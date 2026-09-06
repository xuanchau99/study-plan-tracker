package com.edutrack.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "edutrack.events.exchange";
    public static final String DAILY_GOAL_QUEUE = "notification.daily_goal.queue";
    public static final String DAILY_GOAL_ROUTING_KEY = "daily_goal.achieved";

    @Bean
    public DirectExchange eventsExchange() {
        return new DirectExchange(EXCHANGE_NAME);
    }

    @Bean
    public Queue dailyGoalQueue() {
        return new Queue(DAILY_GOAL_QUEUE, true); // Durable queue
    }

    @Bean
    public Binding bindingDailyGoal(Queue dailyGoalQueue, DirectExchange eventsExchange) {
        return BindingBuilder.bind(dailyGoalQueue).to(eventsExchange).with(DAILY_GOAL_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        // Đảm bảo event (như record DTO) được parse sang JSON để dễ debug trên RabbitMQ Admin UI
        return new Jackson2JsonMessageConverter();
    }
}
