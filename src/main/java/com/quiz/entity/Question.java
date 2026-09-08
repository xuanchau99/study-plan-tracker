package com.quiz.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "questions")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Rule 2: Mọi quan hệ bắt buộc phải set fetch = FetchType.LAZY
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    // Rule 4: Sử dụng JSONB để lưu trữ cấu trúc chi tiết
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private QuestionDetails details;

    @Column(nullable = false, length = 50)
    private String type;

    @Column(nullable = false, name = "correct_answer")
    private String correctAnswer;

    public Question() {
    }

    public Question(QuestionDetails details, String type, String correctAnswer) {
        this.details = details;
        this.type = type;
        this.correctAnswer = correctAnswer;
    }

    public Long getId() {
        return id;
    }

    public Quiz getQuiz() {
        return quiz;
    }

    public void setQuiz(Quiz quiz) {
        this.quiz = quiz;
    }

    public QuestionDetails getDetails() {
        return details;
    }

    public void setDetails(QuestionDetails details) {
        this.details = details;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getCorrectAnswer() {
        return correctAnswer;
    }

    public void setCorrectAnswer(String correctAnswer) {
        this.correctAnswer = correctAnswer;
    }
}
