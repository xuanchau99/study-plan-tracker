package com.quiz.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record QuizCreateRequest(
        @NotBlank(message = "Title is required")
        String title,

        String description,

        @NotEmpty(message = "Quiz must have at least one question")
        @Valid
        List<QuestionCreateRequest> questions,

        Boolean isActive,
        
        java.time.LocalDateTime startTime,
        
        java.time.LocalDateTime endTime
) {
}
