package com.edutrack;

import com.edutrack.notification.NotificationListener;
import com.edutrack.plan.DailyTask;
import com.edutrack.plan.DailyTaskRepository;
import com.edutrack.plan.PlanTemplate;
import com.edutrack.plan.PlanTemplateRepository;
import com.edutrack.tracking.HeartbeatRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;

public class TrackingIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private PlanTemplateRepository planTemplateRepository;

    @Autowired
    private DailyTaskRepository dailyTaskRepository;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @SpyBean
    private NotificationListener notificationListener;

    private Long testTaskId;
    private static final String REDIS_KEY_PREFIX = "daily_task_progress";

    @BeforeEach
    void setUp() {
        dailyTaskRepository.deleteAll();
        planTemplateRepository.deleteAll();
        redisTemplate.getConnectionFactory().getConnection().serverCommands().flushAll();

        PlanTemplate template = new PlanTemplate("Giao tiếp 30 ngày", 130, 30);
        DailyTask task = new DailyTask(template, LocalDate.now());
        template.addDailyTask(task);
        planTemplateRepository.save(template);
        
        testTaskId = template.getDailyTasks().get(0).getId();
    }

    @Test
    void shouldProcessHeartbeatAndCompleteDailyTask() {
        String url = "/api/v1/tracking/heartbeat";
        HeartbeatRequest request = new HeartbeatRequest(testTaskId, 65); // 65 phút / lần

        // Lần 1: Gọi API cập nhật 65 phút
        ResponseEntity<Void> response1 = restTemplate.postForEntity(url, request, Void.class);
        assertThat(response1.getStatusCode()).isEqualTo(HttpStatus.ACCEPTED);

        // Kiểm tra trong Redis có lưu 65 phút
        String redisVal = redisTemplate.opsForHash().get(REDIS_KEY_PREFIX, String.valueOf(testTaskId)).toString();
        assertThat(redisVal).isEqualTo("65");

        // Trạng thái DB vẫn là TODO
        DailyTask task1 = dailyTaskRepository.findById(testTaskId).orElseThrow();
        assertThat(task1.getStatus()).isEqualTo(DailyTask.TaskStatus.TODO);

        // Lần 2: Gọi tiếp 65 phút (Tổng = 130 phút -> Đạt định mức)
        ResponseEntity<Void> response2 = restTemplate.postForEntity(url, request, Void.class);
        assertThat(response2.getStatusCode()).isEqualTo(HttpStatus.ACCEPTED);

        // Kiểm tra Redis đạt 130
        String redisVal2 = redisTemplate.opsForHash().get(REDIS_KEY_PREFIX, String.valueOf(testTaskId)).toString();
        assertThat(redisVal2).isEqualTo("130");

        // Kiểm tra Database, trạng thái phải chuyển sang DONE
        DailyTask task2 = dailyTaskRepository.findById(testTaskId).orElseThrow();
        assertThat(task2.getStatus()).isEqualTo(DailyTask.TaskStatus.DONE);
        assertThat(task2.getCompletedMins()).isEqualTo(130);
        
        // Tùy chọn nâng cao: Bắt và kiểm tra xem message đã thực sự được ném vào RabbitMQ queue và được listener tiêu thụ chưa
        // Dùng verify với timeout vì Listener xử lý bất đồng bộ, timeout an toàn là 5s
        verify(notificationListener, timeout(5000)).handleDailyGoalAchieved(any());
    }
}
