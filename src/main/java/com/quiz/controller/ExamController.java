package com.quiz.controller;

import com.quiz.dto.AnswerSubmitRequest;
import com.quiz.entity.User;
import com.quiz.repository.UserRepository;
import com.quiz.service.ExamService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for managing Exams.
 * Handles auto-saving of answers, exam submission, and retrieving exam results.
 */
@RestController
@RequestMapping("/api/v1/exams")
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class ExamController {

    private final ExamService examService;
    private final UserRepository userRepository;
    private final com.quiz.repository.ExamResultRepository examResultRepository;

    public ExamController(ExamService examService, UserRepository userRepository, com.quiz.repository.ExamResultRepository examResultRepository) {
        this.examService = examService;
        this.userRepository = userRepository;
        this.examResultRepository = examResultRepository;
    }

    /**
     * Helper method to extract User ID from the JWT authentication context.
     */
    private Long getUserId(UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return user.getId();
    }

    /**
     * Ultra-fast auto-save API.
     * Caches the user's selected answer in a Redis Hash.
     * Prevents database bottlenecks during concurrent exams.
     */
    @PostMapping("/{quizId}/questions/{questionId}/answers")
    public ResponseEntity<Void> autoSaveAnswer(
            @PathVariable Long quizId,
            @PathVariable Long questionId,
            @Valid @RequestBody AnswerSubmitRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long userId = getUserId(userDetails);
        examService.autoSaveAnswer(userId, quizId, questionId, request);
        return ResponseEntity.ok().build();
    }

    /**
     * Exam submission API.
     * Extremely fast response time as it delegates grading to RabbitMQ.
     * Immediately returns 202 ACCEPTED.
     */
    @PostMapping("/{quizId}/submit")
    public ResponseEntity<Void> submitExam(
            @PathVariable Long quizId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long userId = getUserId(userDetails);
        examService.submitExam(userId, quizId);
        
        return ResponseEntity.accepted().build();
    }

    /**
     * Retrieves all exam results including the submitted evidence.
     * Restricted to ADMIN role for auditing purposes.
     */
    @GetMapping("/results")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<java.util.List<com.quiz.dto.ExamResultDto>> getAllResults() {
        java.util.List<com.quiz.dto.ExamResultDto> results = examResultRepository.findAll().stream()
                .map(r -> new com.quiz.dto.ExamResultDto(r.getId(), r.getUserId(), r.getQuizId(), r.getScore(), r.getSubmittedAt(), r.getEvidence()))
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(results);
    }
}
