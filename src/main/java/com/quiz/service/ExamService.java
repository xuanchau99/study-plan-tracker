package com.quiz.service;

import com.quiz.config.RabbitMQConfig;
import com.quiz.dto.AnswerSubmitRequest;
import com.quiz.dto.ExamSubmittedEvent;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

/**
 * Core Service for managing exam taking mechanics.
 * Highly optimized by using Redis for auto-saves and RabbitMQ for submissions.
 */
@Service
public class ExamService {

    private final StringRedisTemplate redisTemplate;
    private final RabbitTemplate rabbitTemplate;

    public ExamService(StringRedisTemplate redisTemplate, RabbitTemplate rabbitTemplate) {
        this.redisTemplate = redisTemplate;
        this.rabbitTemplate = rabbitTemplate;
    }

    /**
     * Instantly saves the user's answer into Redis.
     * This avoids locking the PostgreSQL database during exams when hundreds of users
     * are clicking options simultaneously.
     */
    public void autoSaveAnswer(Long userId, Long quizId, Long questionId, AnswerSubmitRequest request) {
        // Key Structure: exam:{quizId}:user:{userId}
        String key = "exam:" + quizId + ":user:" + userId;
        // Save the answer in a Redis Hash. opsForHash guarantees ultra-low latency RAM writes.
        redisTemplate.opsForHash().put(key, questionId.toString(), request.answer());
    }

    /**
     * Submits the exam asynchronously.
     * Fires an event to RabbitMQ and returns immediately, allowing the UI to show
     * a success screen while background workers process the grading.
     */
    public void submitExam(Long userId, Long quizId) {
        ExamSubmittedEvent event = new ExamSubmittedEvent(userId, quizId);
        // Publish the exam submission event to the message broker
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, RabbitMQConfig.ROUTING_KEY, event);
    }
}
