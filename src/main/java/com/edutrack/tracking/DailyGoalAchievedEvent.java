package com.edutrack.tracking;

public record DailyGoalAchievedEvent(
        Long taskId,
        Long planTemplateId,
        Long totalStudiedMinutes
) {
}
