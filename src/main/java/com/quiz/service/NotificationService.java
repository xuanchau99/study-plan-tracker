package com.quiz.service;

import com.quiz.dto.NotificationDto;
import com.quiz.model.Notification;
import com.quiz.entity.User;
import com.quiz.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public NotificationService(NotificationRepository notificationRepository, SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public void sendNotification(User user, String message) {
        // 1. Lưu vào Database
        Notification notification = new Notification(user, message);
        notification = notificationRepository.save(notification);

        NotificationDto dto = new NotificationDto(notification);

        // 2. Push qua WebSocket (Gửi tới /user/{username}/queue/notifications)
        messagingTemplate.convertAndSendToUser(
                user.getUsername(),
                "/queue/notifications",
                dto
        );
    }

    public List<NotificationDto> getNotificationsForUser(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationDto::new)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }
}
