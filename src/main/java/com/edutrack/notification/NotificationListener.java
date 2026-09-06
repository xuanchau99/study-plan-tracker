package com.edutrack.notification;

import com.edutrack.config.RabbitMQConfig;
import com.edutrack.tracking.DailyGoalAchievedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
public class NotificationListener {

    private static final Logger log = LoggerFactory.getLogger(NotificationListener.class);

    @RabbitListener(queues = RabbitMQConfig.DAILY_GOAL_QUEUE)
    public void handleDailyGoalAchieved(DailyGoalAchievedEvent event) {
        log.info("🎉 Đã gửi thông báo chúc mừng hoàn thành lộ trình hôm nay cho Task ID: {} (Plan ID: {}). Tổng thời gian: {} phút", 
                event.taskId(), event.planTemplateId(), event.totalStudiedMinutes());
    }
}
