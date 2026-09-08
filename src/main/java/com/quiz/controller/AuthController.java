package com.quiz.controller;

import com.quiz.dto.AuthRequest;
import com.quiz.dto.AuthResponse;
import com.quiz.dto.RegisterRequest;
import com.quiz.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller handling Authentication.
 * Exposes public endpoints for user registration and login.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Registers a new user.
     * Validates the request body and returns a JWT token if successful.
     * Notice that this controller only returns DTOs (Data Transfer Objects),
     * preventing sensitive Entity data from leaking to the client.
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    /**
     * Authenticates a user.
     * Verifies username and password, then generates and returns a JWT token.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
