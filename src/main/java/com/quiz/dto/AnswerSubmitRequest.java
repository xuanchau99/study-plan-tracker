package com.quiz.dto;

import jakarta.validation.constraints.NotBlank;

public record AnswerSubmitRequest(
        @NotBlank(message = "Answer cannot be blank")
        String answer
) {
}
