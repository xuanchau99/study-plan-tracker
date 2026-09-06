package com.edutrack.plan;

import java.time.LocalDateTime;

public record PlanTemplateResponse(
        Long id,
        String name,
        Integer totalMinsPerDay,
        Integer durationDays,
        LocalDateTime createdAt
) {
    public static PlanTemplateResponse fromEntity(PlanTemplate entity) {
        return new PlanTemplateResponse(
                entity.getId(),
                entity.getName(),
                entity.getTotalMinsPerDay(),
                entity.getDurationDays(),
                entity.getCreatedAt()
        );
    }
}
