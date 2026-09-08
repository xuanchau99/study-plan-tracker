package com.quiz.dto;

import java.time.LocalDateTime;
import java.util.List;

public record QuizDto(
        Long id,
        String title,
        String description,
        LocalDateTime createdAt,
        List<QuestionDto> questions
) {
}
