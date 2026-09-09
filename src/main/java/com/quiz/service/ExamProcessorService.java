package com.quiz.service;

import com.quiz.config.RabbitMQConfig;
import com.quiz.dto.ExamSubmittedEvent;
import com.quiz.entity.ExamResult;
import com.quiz.entity.Question;
import com.quiz.entity.Quiz;
import com.quiz.repository.ExamResultRepository;
import com.quiz.repository.QuizRepository;
import com.quiz.entity.User;
import com.quiz.repository.UserRepository;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Background Service for asynchronously grading exams.
 * Consumes messages from RabbitMQ to process exam submissions without blocking the main web threads.
 */
@Service
public class ExamProcessorService {

    private final QuizRepository quizRepository;
    private final ExamResultRepository examResultRepository;
    private final StringRedisTemplate redisTemplate;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ExamProcessorService(QuizRepository quizRepository, 
                                ExamResultRepository examResultRepository, 
                                StringRedisTemplate redisTemplate,
                                UserRepository userRepository,
                                NotificationService notificationService) {
        this.quizRepository = quizRepository;
        this.examResultRepository = examResultRepository;
        this.redisTemplate = redisTemplate;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    /**
     * RabbitMQ Consumer that listens to the submission queue.
     * When a user submits an exam, this method pulls the event, calculates the score, and saves the result to DB.
     * @param event The event payload containing userId and quizId.
     */
    @RabbitListener(queues = RabbitMQConfig.QUEUE_NAME)
    @Transactional
    public void processExamSubmission(ExamSubmittedEvent event) {
        Long quizId = event.quizId();
        Long userId = event.userId();

        Quiz quiz = quizRepository.findWithQuestionsById(quizId).orElse(null);
        if (quiz == null) return;

        String key = "exam:" + quizId + ":user:" + userId;
        // Fetch all answers cached by the user in Redis (Time complexity: O(1))
        Map<Object, Object> userAnswers = redisTemplate.opsForHash().entries(key);

        int score = 0;
        for (Question question : quiz.getQuestions()) {
            String questionIdStr = String.valueOf(question.getId());
            String userAnswer = (String) userAnswers.get(questionIdStr);

            if (userAnswer != null && userAnswer.equalsIgnoreCase(question.getCorrectAnswer())) {
                score++;
            }
        }

        Map<String, String> evidence = new java.util.HashMap<>();
        for (Map.Entry<Object, Object> entry : userAnswers.entrySet()) {
            evidence.put(String.valueOf(entry.getKey()), String.valueOf(entry.getValue()));
        }

        // Save the final calculated score and the JSONB evidence to the PostgreSQL Database
        ExamResult result = new ExamResult(userId, quizId, score, evidence);
        examResultRepository.save(result);

        // Clean up the temporary cached data in Redis to save memory
        redisTemplate.delete(key);
        
        final int finalScore = score;
        
        // Notify the user about the result
        userRepository.findById(userId).ifPresent(user -> {
            String message = "Bài thi '" + quiz.getTitle() + "' đã chấm xong. Điểm của bạn: " + finalScore + "/" + quiz.getQuestions().size();
            notificationService.sendNotification(user, message);
            
            // Notify all admins
            java.util.List<User> admins = userRepository.findByRole(com.quiz.entity.Role.ADMIN);
            for (User admin : admins) {
                String adminMsg = "Học sinh " + user.getUsername() + " vừa hoàn thành bài thi '" + quiz.getTitle() + "' với số điểm " + finalScore + "/" + quiz.getQuestions().size();
                notificationService.sendNotification(admin, adminMsg);
            }
        });
    }
}
