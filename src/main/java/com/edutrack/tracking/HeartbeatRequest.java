package com.edutrack.tracking;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record HeartbeatRequest(
        @NotNull(message = "Task ID is required")
        Long taskId,
        
        @NotNull(message = "Studied minutes is required")
        @Min(value = 1, message = "Studied minutes must be at least 1")
        Integer studiedMinutes
) {
}
