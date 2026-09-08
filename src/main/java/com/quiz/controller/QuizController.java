package com.quiz.controller;

import com.quiz.dto.QuizCreateRequest;
import com.quiz.dto.QuizDto;
import com.quiz.service.QuizService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for managing Quizzes.
 * Provides endpoints for creating, retrieving, and listing quizzes.
 */
@RestController
@RequestMapping("/api/v1/quizzes")
public class QuizController {

    private final QuizService quizService;

    public QuizController(QuizService quizService) {
        this.quizService = quizService;
    }

    /**
     * Creates a new quiz along with its questions.
     * Restricted to ADMIN role.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<QuizDto> createQuiz(@Valid @RequestBody QuizCreateRequest request) {
        return ResponseEntity.ok(quizService.createQuiz(request));
    }

    /**
     * Retrieves a specific quiz by its ID.
     * Accessible by both ADMIN and USER.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<QuizDto> getQuiz(@PathVariable Long id) {
        return ResponseEntity.ok(quizService.getQuizById(id));
    }

    /**
     * Lists all available quizzes.
     * Accessible by both ADMIN and USER.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<java.util.List<QuizDto>> getAllQuizzes() {
        return ResponseEntity.ok(quizService.getAllQuizzes());
    }
}
