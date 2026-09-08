package com.quiz.dto;

import java.time.LocalDateTime;
import java.util.Map;

public record ExamResultDto(Long id, Long userId, Long quizId, Integer score, LocalDateTime submittedAt, Map<String, String> evidence) {}
