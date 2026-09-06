package com.edutrack.plan;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DailyTaskRepository extends JpaRepository<DailyTask, Long> {
    
    @Query("SELECT d FROM DailyTask d JOIN FETCH d.planTemplate WHERE d.id = :id")
    Optional<DailyTask> findByIdWithPlan(@Param("id") Long id);
}
