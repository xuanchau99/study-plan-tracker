package com.edutrack.tracking;

import com.edutrack.plan.DailyTask;
import com.edutrack.plan.DailyTaskRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class RedisSyncScheduler {

    private static final Logger log = LoggerFactory.getLogger(RedisSyncScheduler.class);
    private static final String REDIS_KEY_PREFIX = "daily_task_progress";

    private final StringRedisTemplate redisTemplate;
    private final DailyTaskRepository dailyTaskRepository;
    private final StudyLogRepository studyLogRepository;

    public RedisSyncScheduler(StringRedisTemplate redisTemplate, 
                              DailyTaskRepository dailyTaskRepository,
                              StudyLogRepository studyLogRepository) {
        this.redisTemplate = redisTemplate;
        this.dailyTaskRepository = dailyTaskRepository;
        this.studyLogRepository = studyLogRepository;
    }

    /**
     * TẠI SAO LẠI DÙNG CÁCH NÀY:
     * - @Transactional đảm bảo nếu chèn DB thất bại, Redis sẽ KHÔNG bị xóa (Ngăn mất mát).
     * - Dùng HSCAN quét Redis nhẹ nhàng, không block Server.
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void syncHeartbeatToDb() {
        log.info("Bắt đầu đồng bộ Heartbeat từ Redis -> PostgreSQL...");
        
        Map<String, String> syncData = new HashMap<>();
        try (Cursor<Map.Entry<Object, Object>> cursor = redisTemplate.opsForHash().scan(REDIS_KEY_PREFIX, ScanOptions.scanOptions().build())) {
            while (cursor.hasNext()) {
                Map.Entry<Object, Object> entry = cursor.next();
                syncData.put((String) entry.getKey(), (String) entry.getValue());
            }
        }

        if (syncData.isEmpty()) {
            log.info("Không có dữ liệu Heartbeat mới.");
            return;
        }

        List<StudyLog> logsToSave = new ArrayList<>();
        List<String> keysToDelete = new ArrayList<>();

        for (Map.Entry<String, String> entry : syncData.entrySet()) {
            Long taskId = Long.parseLong(entry.getKey());
            Integer currentTotal = Integer.parseInt(entry.getValue());

            dailyTaskRepository.findById(taskId).ifPresent(task -> {
                // Tận dụng cột JSONB metadata
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("platform", "web");
                metadata.put("last_sync", LocalDateTime.now().toString());

                StudyLog logEntry = new StudyLog(task, currentTotal, metadata);
                logsToSave.add(logEntry);
                
                // Đồng bộ ngược tổng số phút mới nhất lên DailyTask nếu có độ trễ
                task.setCompletedMins(currentTotal);
                if (currentTotal >= task.getPlanTemplate().getTotalMinsPerDay() && task.getStatus() != DailyTask.TaskStatus.DONE) {
                     task.setStatus(DailyTask.TaskStatus.DONE);
                }

                keysToDelete.add(entry.getKey());
            });
        }

        if (!logsToSave.isEmpty()) {
            studyLogRepository.saveAll(logsToSave);
            log.info("Đã Batch Insert {} bản ghi StudyLog.", logsToSave.size());
        }

        if (!keysToDelete.isEmpty()) {
            redisTemplate.opsForHash().delete(REDIS_KEY_PREFIX, keysToDelete.toArray());
            log.info("Đã clear {} keys trên Redis để giải phóng RAM.", keysToDelete.size());
        }
    }
}
