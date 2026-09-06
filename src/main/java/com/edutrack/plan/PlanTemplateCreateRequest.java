package com.edutrack.plan;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PlanTemplateCreateRequest(
        @NotBlank(message = "Plan name cannot be blank")
        String name,
        
        @NotNull(message = "Total minutes per day is required")
        @Min(value = 1, message = "Total minutes per day must be at least 1")
        Integer totalMinsPerDay,
        
        @NotNull(message = "Duration in days is required")
        @Min(value = 1, message = "Duration must be at least 1 day")
        Integer durationDays
) {
}
