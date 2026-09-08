package com.quiz.repository;

import com.quiz.entity.Quiz;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    
    // Rule 3 (N+1 Query Prevention): Bắt buộc dùng @EntityGraph để kéo fetch danh sách questions
    @EntityGraph(attributePaths = {"questions"})
    Optional<Quiz> findWithQuestionsById(Long id);

    @EntityGraph(attributePaths = {"questions"})
    @org.springframework.data.jpa.repository.Query("SELECT q FROM Quiz q")
    java.util.List<Quiz> findAllWithQuestions();
}
