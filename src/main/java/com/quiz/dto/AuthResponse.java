package com.quiz.dto;

public record AuthResponse(
    String token,
    String username,
    String role
) {}
