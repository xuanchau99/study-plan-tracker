package com.quiz.config;

import com.quiz.security.StompChannelInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final StompChannelInterceptor stompChannelInterceptor;

    @Autowired
    public WebSocketConfig(StompChannelInterceptor stompChannelInterceptor) {
        this.stompChannelInterceptor = stompChannelInterceptor;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Cho phép gửi tin nhắn từ server về client thông qua các prefix này
        config.enableSimpleBroker("/topic", "/queue");
        // Các tin nhắn client gửi lên server sẽ bắt đầu bằng /app (Dù ở app này ta chỉ push 1 chiều)
        config.setApplicationDestinationPrefixes("/app");
        // Giúp phân biệt user destination (e.g. /user/{username}/queue/notifications)
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Raw websocket endpoint
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
                
        // SockJS fallback
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompChannelInterceptor);
    }
}
