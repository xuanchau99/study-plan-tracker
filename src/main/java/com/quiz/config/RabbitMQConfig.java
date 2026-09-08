package com.quiz.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class for RabbitMQ Message Broker.
 * Defines the Queue, Exchange, and Routing Key used for asynchronous exam grading.
 * This ensures high throughput by offloading heavy grading calculations from the main HTTP thread.
 */
@Configuration
public class RabbitMQConfig {

    public static final String QUEUE_NAME = "quiz.exam.submit.queue";
    public static final String EXCHANGE_NAME = "quiz.exam.exchange";
    public static final String ROUTING_KEY = "quiz.exam.routingkey";

    /**
     * Creates a durable queue that survives server restarts.
     */
    @Bean
    public Queue queue() {
        return new Queue(QUEUE_NAME, true);
    }

    /**
     * Creates a direct exchange to route messages based on an exact routing key match.
     */
    @Bean
    public DirectExchange exchange() {
        return new DirectExchange(EXCHANGE_NAME);
    }

    /**
     * Binds the queue to the direct exchange with the specified routing key.
     */
    @Bean
    public Binding binding(Queue queue, DirectExchange exchange) {
        return BindingBuilder.bind(queue).to(exchange).with(ROUTING_KEY);
    }

    /**
     * Configures a JSON message converter.
     * This allows Spring AMQP to automatically serialize/deserialize Java objects to/from JSON payloads in RabbitMQ.
     */
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
