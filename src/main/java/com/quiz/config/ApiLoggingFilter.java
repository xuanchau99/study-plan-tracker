package com.quiz.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;

@Component
public class ApiLoggingFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(ApiLoggingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Không log các request liên quan đến websocket hoặc static files
        String uri = request.getRequestURI();
        if (uri.startsWith("/ws") || uri.contains(".")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Wrap request và response để có thể đọc được payload nhiều lần
        ContentCachingRequestWrapper requestWrapper = new ContentCachingRequestWrapper(request, 10000);
        ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);

        long startTime = System.currentTimeMillis();

        try {
            filterChain.doFilter(requestWrapper, responseWrapper);
        } finally {
            long timeTaken = System.currentTimeMillis() - startTime;
            
            String requestBody = getStringValue(requestWrapper.getContentAsByteArray(), request.getCharacterEncoding());
            String responseBody = getStringValue(responseWrapper.getContentAsByteArray(), response.getCharacterEncoding());

            logger.info("API CALL: [{}] {} | Payload: {} | Status: {} | Response: {} | Time: {}ms",
                    request.getMethod(),
                    uri,
                    requestBody.isEmpty() ? "None" : requestBody,
                    response.getStatus(),
                    responseBody.isEmpty() ? "None" : responseBody,
                    timeTaken);

            // Bắt buộc phải copy body trả về cho client, nếu không client sẽ nhận body rỗng
            responseWrapper.copyBodyToResponse();
        }
    }

    private String getStringValue(byte[] contentAsByteArray, String characterEncoding) {
        if (contentAsByteArray == null || contentAsByteArray.length == 0) {
            return "";
        }
        int length = Math.min(contentAsByteArray.length, 1000); // Giới hạn log 1000 ký tự để tránh log file quá nặng
        return new String(contentAsByteArray, 0, length, java.nio.charset.StandardCharsets.UTF_8)
                .replaceAll("\\r\\n|\\r|\\n", ""); // Xóa dấu xuống dòng cho dễ nhìn
    }
}
