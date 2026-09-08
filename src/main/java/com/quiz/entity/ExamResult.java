package com.quiz.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "exam_results")
public class ExamResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "quiz_id", nullable = false)
    private Long quizId;

    @Column(nullable = false)
    private Integer score;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    private LocalDateTime submittedAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, String> evidence;

    @PrePersist
    protected void onCreate() {
        submittedAt = LocalDateTime.now();
    }

    public ExamResult() {
    }

    public ExamResult(Long userId, Long quizId, Integer score, Map<String, String> evidence) {
        this.userId = userId;
        this.quizId = quizId;
        this.score = score;
        this.evidence = evidence;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getQuizId() {
        return quizId;
    }

    public void setQuizId(Long quizId) {
        this.quizId = quizId;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public Map<String, String> getEvidence() {
        return evidence;
    }

    public void setEvidence(Map<String, String> evidence) {
        this.evidence = evidence;
    }
}
