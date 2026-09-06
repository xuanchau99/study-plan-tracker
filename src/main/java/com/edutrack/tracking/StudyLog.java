package com.edutrack.tracking;

import com.edutrack.plan.DailyTask;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

@Entity
@Table(name = "study_logs")
public class StudyLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "daily_task_id", nullable = false)
    private DailyTask dailyTask;

    @Column(name = "synced_mins", nullable = false)
    private Integer syncedMins;

    @Column(name = "sync_time", nullable = false)
    private LocalDateTime syncTime = LocalDateTime.now();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Map<String, Object> metadata = new HashMap<>();

    protected StudyLog() {}

    public StudyLog(DailyTask dailyTask, Integer syncedMins, Map<String, Object> metadata) {
        this.dailyTask = dailyTask;
        this.syncedMins = syncedMins;
        this.metadata = metadata;
    }

    public Long getId() {
        return id;
    }

    public DailyTask getDailyTask() {
        return dailyTask;
    }

    public void setDailyTask(DailyTask dailyTask) {
        this.dailyTask = dailyTask;
    }

    public Integer getSyncedMins() {
        return syncedMins;
    }

    public void setSyncedMins(Integer syncedMins) {
        this.syncedMins = syncedMins;
    }

    public LocalDateTime getSyncTime() {
        return syncTime;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        StudyLog studyLog = (StudyLog) o;
        return Objects.equals(id, studyLog.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
