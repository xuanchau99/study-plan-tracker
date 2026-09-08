package com.quiz.dto;

import com.quiz.entity.QuestionDetails;

public record QuestionDto(
        Long id,
        QuestionDetails details,
        String type,
        String correctAnswer
) {
}
