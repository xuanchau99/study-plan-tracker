package com.edutrack.plan;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlanTemplateRepository extends JpaRepository<PlanTemplate, Long> {

    @EntityGraph(attributePaths = {"dailyTasks"})
    @Query("SELECT p FROM PlanTemplate p WHERE p.id = :id")
    Optional<PlanTemplate> findByIdWithTasks(@Param("id") Long id);
}
