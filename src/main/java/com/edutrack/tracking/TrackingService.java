package com.edutrack.tracking;

import com.edutrack.config.RabbitMQConfig;
import com.edutrack.plan.DailyTask;
import com.edutrack.plan.DailyTaskRepository;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TrackingService {

    private static final String REDIS_KEY_PREFIX = "daily_task_progress";

    private final StringRedisTemplate redisTemplate;
    private final DailyTaskRepository dailyTaskRepository;
    private final RabbitTemplate rabbitTemplate;

    public TrackingService(StringRedisTemplate redisTemplate, DailyTaskRepository dailyTaskRepository, RabbitTemplate rabbitTemplate) {
        this.redisTemplate = redisTemplate;
        this.dailyTaskRepository = dailyTaskRepository;
        this.rabbitTemplate = rabbitTemplate;
    }

    /**
     * TẠI SAO LẠI DÙNG CÁCH NÀY (High-Throughput):
     * - API Tracking được gọi rất nhiều lần (mỗi phút 1 lần từ hàng ngàn user).
     * - Nếu Update thẳng PostgreSQL cho mỗi phút sẽ gây quá tải Disk I/O.
     * - Dùng Redis Hash (`HINCRBY`) để cộng dồn trực tiếp trên RAM, thao tác này có độ trễ O(1) 
     *   và throughput cực cao.
     * - Chỉ khi đạt target mới update DB 1 lần duy nhất, giảm 99% tải cho PostgreSQL.
     */
    @Transactional
    public void processHeartbeat(HeartbeatRequest request) {
        Long taskId = request.taskId();
        Integer studiedMins = request.studiedMinutes();

        // 1. Cộng dồn thời gian trên Redis (Atomic HINCRBY)
        Long currentTotalMins = redisTemplate.opsForHash()
                .increment(REDIS_KEY_PREFIX, String.valueOf(taskId), studiedMins);

        // 2. Lấy DailyTask để kiểm tra định mức (Dùng findByIdWithPlan để tránh N+1 Query)
        DailyTask task = dailyTaskRepository.findByIdWithPlan(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found with id: " + taskId));

        // 3. Kiểm tra Threshold (Định mức)
        Integer targetMins = task.getPlanTemplate().getTotalMinsPerDay();
        
        if (currentTotalMins >= targetMins && task.getStatus() != DailyTask.TaskStatus.DONE) {
            // Đạt định mức -> Update trạng thái
            task.setStatus(DailyTask.TaskStatus.DONE);
            task.setCompletedMins(currentTotalMins.intValue());
            dailyTaskRepository.save(task);

            // 4. Tạo Event để xử lý Asynchronous (ví dụ: cấp Badge, thông báo Push)
            DailyGoalAchievedEvent event = new DailyGoalAchievedEvent(
                    taskId,
                    task.getPlanTemplate().getId(),
                    currentTotalMins
            );
            
            // Publish Event sang Notification Module bằng RabbitMQ
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE_NAME, 
                    RabbitMQConfig.DAILY_GOAL_ROUTING_KEY, 
                    event
            );
        }
    }
}
