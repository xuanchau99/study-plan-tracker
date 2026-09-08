package com.quiz.dto;

import com.quiz.entity.QuestionDetails;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record QuestionCreateRequest(
        @NotNull(message = "Question details cannot be null")
        QuestionDetails details,

        @NotBlank(message = "Question type is required")
        String type,

        @NotBlank(message = "Correct answer is required")
        String correctAnswer
) {
}
