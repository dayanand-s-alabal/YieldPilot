package com.yieldpilot.repository;

import com.yieldpilot.entity.StrategySnapshot;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface StrategySnapshotRepository extends JpaRepository<StrategySnapshot, Long> {

    Page<StrategySnapshot> findByStrategyId(Long strategyId, Pageable pageable);

    Page<StrategySnapshot> findByStrategyIdAndRecordedAtBetween(Long strategyId, LocalDateTime from, LocalDateTime to, Pageable pageable);

    List<StrategySnapshot> findByStrategyIdOrderByRecordedAtDesc(Long strategyId);

    Optional<StrategySnapshot> findTopByStrategyIdOrderByRecordedAtDesc(Long strategyId);

    List<StrategySnapshot> findByStrategyIdAndRecordedAtBetweenOrderByRecordedAtAsc(Long strategyId, LocalDateTime from, LocalDateTime to);

    List<StrategySnapshot> findByStrategyIdAndRecordedAtBetweenOrderByRecordedAtDesc(Long strategyId, LocalDateTime from, LocalDateTime to);
}
