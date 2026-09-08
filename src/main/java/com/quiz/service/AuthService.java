package com.quiz.service;

import com.quiz.dto.AuthRequest;
import com.quiz.dto.AuthResponse;
import com.quiz.dto.RegisterRequest;
import com.quiz.entity.Role;
import com.quiz.entity.User;
import com.quiz.repository.UserRepository;
import com.quiz.security.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Service class handling business logic for authentication and registration.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, 
                       JwtUtil jwtUtil, AuthenticationManager authenticationManager,
                       UserDetailsService userDetailsService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
    }

    /**
     * Registers a new user with the default USER role.
     * Passwords are encrypted using BCrypt before storing.
     */
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Username is already taken");
        }

        // Encrypt the password using BCrypt before persisting to the database
        User user = new User(
                request.username(),
                passwordEncoder.encode(request.password()),
                Role.USER // Set the default role
        );

        userRepository.save(user);

        // Load the user details and generate a fresh JWT token
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String jwtToken = jwtUtil.generateToken(userDetails);

        return new AuthResponse(jwtToken, user.getUsername(), user.getRole().name());
    }

    /**
     * Authenticates an existing user and returns a new JWT token.
     */
    public AuthResponse login(AuthRequest request) {
        // Authenticate the credentials against the database via CustomUserDetailsService
        // This will automatically throw an exception if the credentials are invalid
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        // Generate a JWT token for the authenticated user
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String jwtToken = jwtUtil.generateToken(userDetails);

        return new AuthResponse(jwtToken, user.getUsername(), user.getRole().name());
    }
}
