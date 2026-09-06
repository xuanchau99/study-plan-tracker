package com.edutrack.plan;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.CascadeType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "plan_templates")
public class PlanTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "total_mins_per_day", nullable = false)
    private Integer totalMinsPerDay;

    @Column(name = "duration_days", nullable = false)
    private Integer durationDays;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "planTemplate", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DailyTask> dailyTasks = new ArrayList<>();

    protected PlanTemplate() {}

    public PlanTemplate(String name, Integer totalMinsPerDay, Integer durationDays) {
        this.name = name;
        this.totalMinsPerDay = totalMinsPerDay;
        this.durationDays = durationDays;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getTotalMinsPerDay() {
        return totalMinsPerDay;
    }

    public void setTotalMinsPerDay(Integer totalMinsPerDay) {
        this.totalMinsPerDay = totalMinsPerDay;
    }

    public Integer getDurationDays() {
        return durationDays;
    }

    public void setDurationDays(Integer durationDays) {
        this.durationDays = durationDays;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public List<DailyTask> getDailyTasks() {
        return dailyTasks;
    }

    public void addDailyTask(DailyTask task) {
        dailyTasks.add(task);
        task.setPlanTemplate(this);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PlanTemplate that = (PlanTemplate) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
