package com.quiz.dto;

import java.io.Serializable;

public record ExamSubmittedEvent(
        Long userId,
        Long quizId
) implements Serializable {
}
