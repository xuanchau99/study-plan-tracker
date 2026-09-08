package com.quiz.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

/**
 * Configuration class for Redis caching.
 * Redis is utilized in this project for the ultra-fast auto-saving mechanism.
 */
@Configuration
public class RedisConfig {

    /**
     * Explicitly configures StringRedisTemplate.
     * While Spring Boot provides this by default, configuring it explicitly improves clarity
     * and allows for future customizations (e.g., connection pooling, serializers).
     */
    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory redisConnectionFactory) {
        StringRedisTemplate template = new StringRedisTemplate();
        template.setConnectionFactory(redisConnectionFactory);
        return template;
    }
}
