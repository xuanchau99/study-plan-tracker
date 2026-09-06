package com.edutrack;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class StudyPlanTrackerApplication {

    public static void main(String[] args) {
        SpringApplication.run(StudyPlanTrackerApplication.class, args);
    }
}
