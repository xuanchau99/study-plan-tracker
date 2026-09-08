package com.quiz.service;

import com.quiz.dto.QuestionDto;
import com.quiz.dto.QuizCreateRequest;
import com.quiz.dto.QuizDto;
import com.quiz.entity.Question;
import com.quiz.entity.Quiz;
import com.quiz.repository.QuizRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service class for managing Quizzes and Questions.
 * Utilizes Spring Data JPA for persistence.
 */
@Service
public class QuizService {

    private final QuizRepository quizRepository;

    public QuizService(QuizRepository quizRepository) {
        this.quizRepository = quizRepository;
    }

    @Transactional
    public QuizDto createQuiz(QuizCreateRequest request) {
        Quiz quiz = new Quiz(request.title(), request.description());

        request.questions().forEach(qRequest -> {
            Question question = new Question(
                    qRequest.details(),
                    qRequest.type(),
                    qRequest.correctAnswer()
            );
            quiz.addQuestion(question);
        });

        // Cascade saving: Saving the Quiz will automatically save all its associated Questions
        Quiz savedQuiz = quizRepository.save(quiz);

        return mapToDto(savedQuiz);
    }

    /**
     * Retrieves a Quiz by ID.
     * Uses an EntityGraph defined in the Repository to fetch associated questions in a single query,
     * preventing the N+1 select problem.
     */
    @Transactional(readOnly = true)
    public QuizDto getQuizById(Long id) {
        Quiz quiz = quizRepository.findWithQuestionsById(id)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found with id: " + id));
        return mapToDto(quiz);
    }

    @Transactional(readOnly = true)
    public List<QuizDto> getAllQuizzes() {
        return quizRepository.findAllWithQuestions().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private QuizDto mapToDto(Quiz quiz) {
        List<QuestionDto> questionDtos = quiz.getQuestions().stream()
                .map(q -> new QuestionDto(q.getId(), q.getDetails(), q.getType(), q.getCorrectAnswer()))
                .collect(Collectors.toList());

        return new QuizDto(
                quiz.getId(),
                quiz.getTitle(),
                quiz.getDescription(),
                quiz.getCreatedAt(),
                questionDtos
        );
    }
}
