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
    private final com.quiz.repository.QuizRepository quizRepository;

    public ExamService(StringRedisTemplate redisTemplate, RabbitTemplate rabbitTemplate, com.quiz.repository.QuizRepository quizRepository) {
        this.redisTemplate = redisTemplate;
        this.rabbitTemplate = rabbitTemplate;
        this.quizRepository = quizRepository;
    }

    private void validateQuizTime(Long quizId) {
        com.quiz.entity.Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found"));
        
        if (quiz.getIsActive() == null || !quiz.getIsActive()) {
            throw new IllegalStateException("Bài thi chưa được kích hoạt");
        }
        
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        if (quiz.getStartTime() != null && now.isBefore(quiz.getStartTime())) {
            throw new IllegalStateException("Chưa đến giờ làm bài");
        }
        if (quiz.getEndTime() != null && now.isAfter(quiz.getEndTime())) {
            throw new IllegalStateException("Bài thi đã kết thúc");
        }
    }

    /**
     * Instantly saves the user's answer into Redis.
     * This avoids locking the PostgreSQL database during exams when hundreds of users
     * are clicking options simultaneously.
     */
    public void autoSaveAnswer(Long userId, Long quizId, Long questionId, AnswerSubmitRequest request) {
        validateQuizTime(quizId);
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
        // We do not strictly check endTime here to allow automatic submissions that fire right at timeout
        com.quiz.entity.Quiz quiz = quizRepository.findById(quizId).orElseThrow(() -> new IllegalArgumentException("Quiz not found"));
        if (quiz.getIsActive() == null || !quiz.getIsActive()) {
            throw new IllegalStateException("Bài thi chưa được kích hoạt");
        }
        if (quiz.getStartTime() != null && java.time.LocalDateTime.now().isBefore(quiz.getStartTime())) {
            throw new IllegalStateException("Chưa đến giờ làm bài");
        }

        ExamSubmittedEvent event = new ExamSubmittedEvent(userId, quizId);
        // Publish the exam submission event to the message broker
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, RabbitMQConfig.ROUTING_KEY, event);
    }
}
