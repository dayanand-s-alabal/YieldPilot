package com.yieldpilot.service;

import com.yieldpilot.dto.SnapshotRequest;
import com.yieldpilot.dto.SnapshotResponse;
import com.yieldpilot.dto.StrategyPerformanceResponse;
import com.yieldpilot.entity.Strategy;
import com.yieldpilot.entity.StrategySnapshot;
import com.yieldpilot.exception.ResourceNotFoundException;
import com.yieldpilot.repository.StrategyRepository;
import com.yieldpilot.repository.StrategySnapshotRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class StrategySnapshotService {

    private final StrategyRepository strategyRepository;
    private final StrategySnapshotRepository snapshotRepository;

    public StrategySnapshotService(StrategyRepository strategyRepository,
                                   StrategySnapshotRepository snapshotRepository) {
        this.strategyRepository = strategyRepository;
        this.snapshotRepository = snapshotRepository;
    }

    @Transactional
    public SnapshotResponse createSnapshot(Long strategyId, SnapshotRequest request) {
        Strategy strategy = strategyRepository.findById(strategyId)
                .orElseThrow(() -> new ResourceNotFoundException("Strategy not found with ID: " + strategyId));

        if (request.getApy() == null || request.getApy().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("APY cannot be negative or null");
        }
        if (request.getRiskScore() == null || request.getRiskScore() < 1 || request.getRiskScore() > 5) {
            throw new IllegalArgumentException("Risk score must be between 1 and 5");
        }
        if (request.getAvailableLiquidity() == null || request.getAvailableLiquidity().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Available liquidity cannot be negative or null");
        }

        LocalDateTime recordedAt = request.getRecordedAt() != null ? request.getRecordedAt() : LocalDateTime.now();

        StrategySnapshot snapshot = StrategySnapshot.builder()
                .strategy(strategy)
                .apy(request.getApy())
                .riskScore(request.getRiskScore())
                .availableLiquidity(request.getAvailableLiquidity())
                .totalAllocated(request.getTotalAllocated() != null ? request.getTotalAllocated() : BigDecimal.ZERO)
                .recordedAt(recordedAt)
                .build();

        StrategySnapshot saved = snapshotRepository.save(snapshot);

        // Update strategy current observation
        strategy.setCurrentApy(request.getApy().doubleValue());
        strategy.setRiskScore(request.getRiskScore());
        strategy.setLiquidityAvailable(request.getAvailableLiquidity().doubleValue());
        strategyRepository.save(strategy);

        return mapToResponse(saved, strategy.getName());
    }

    @Transactional(readOnly = true)
    public Page<SnapshotResponse> getSnapshots(Long strategyId, LocalDateTime from, LocalDateTime to, Pageable pageable) {
        Strategy strategy = strategyRepository.findById(strategyId)
                .orElseThrow(() -> new ResourceNotFoundException("Strategy not found with ID: " + strategyId));

        Page<StrategySnapshot> page;
        if (from != null && to != null) {
            page = snapshotRepository.findByStrategyIdAndRecordedAtBetween(strategyId, from, to, pageable);
        } else if (from != null) {
            page = snapshotRepository.findByStrategyIdAndRecordedAtBetween(strategyId, from, LocalDateTime.now(), pageable);
        } else if (to != null) {
            page = snapshotRepository.findByStrategyIdAndRecordedAtBetween(strategyId, LocalDateTime.of(2000, 1, 1, 0, 0), to, pageable);
        } else {
            page = snapshotRepository.findByStrategyId(strategyId, pageable);
        }

        return page.map(s -> mapToResponse(s, strategy.getName()));
    }

    @Transactional(readOnly = true)
    public SnapshotResponse getLatestSnapshot(Long strategyId) {
        Strategy strategy = strategyRepository.findById(strategyId)
                .orElseThrow(() -> new ResourceNotFoundException("Strategy not found with ID: " + strategyId));

        Optional<StrategySnapshot> latestOpt = snapshotRepository.findTopByStrategyIdOrderByRecordedAtDesc(strategyId);
        if (latestOpt.isPresent()) {
            return mapToResponse(latestOpt.get(), strategy.getName());
        }

        // If no snapshot exists yet, construct from strategy current state
        return SnapshotResponse.builder()
                .strategyId(strategy.getId())
                .strategyName(strategy.getName())
                .apy(BigDecimal.valueOf(strategy.getCurrentApy() != null ? strategy.getCurrentApy() : 0.0))
                .riskScore(strategy.getRiskScore())
                .availableLiquidity(BigDecimal.valueOf(strategy.getLiquidityAvailable() != null ? strategy.getLiquidityAvailable() : 0.0))
                .totalAllocated(BigDecimal.ZERO)
                .recordedAt(LocalDateTime.now())
                .build();
    }

    @Transactional(readOnly = true)
    public StrategyPerformanceResponse getStrategyPerformance(Long strategyId, LocalDateTime from, LocalDateTime to) {
        Strategy strategy = strategyRepository.findById(strategyId)
                .orElseThrow(() -> new ResourceNotFoundException("Strategy not found with ID: " + strategyId));

        LocalDateTime periodEnd = to != null ? to : LocalDateTime.now();
        LocalDateTime periodStart = from != null ? from : periodEnd.minusDays(30);

        List<StrategySnapshot> snapshots = snapshotRepository
                .findByStrategyIdAndRecordedAtBetweenOrderByRecordedAtAsc(strategyId, periodStart, periodEnd);

        if (snapshots.isEmpty()) {
            // Check all snapshots for the strategy
            snapshots = snapshotRepository.findByStrategyIdOrderByRecordedAtDesc(strategyId);
        }

        if (snapshots.isEmpty()) {
            BigDecimal currentApy = BigDecimal.valueOf(strategy.getCurrentApy() != null ? strategy.getCurrentApy() : 0.0);
            return StrategyPerformanceResponse.builder()
                    .strategyId(strategy.getId())
                    .strategyName(strategy.getName())
                    .periodStart(periodStart)
                    .periodEnd(periodEnd)
                    .currentApy(currentApy)
                    .averageApy(currentApy)
                    .minApy(currentApy)
                    .maxApy(currentApy)
                    .totalObservations(0)
                    .build();
        }

        BigDecimal minApy = snapshots.get(0).getApy();
        BigDecimal maxApy = snapshots.get(0).getApy();
        BigDecimal sumApy = BigDecimal.ZERO;

        for (StrategySnapshot s : snapshots) {
            BigDecimal apy = s.getApy();
            if (apy.compareTo(minApy) < 0) minApy = apy;
            if (apy.compareTo(maxApy) > 0) maxApy = apy;
            sumApy = sumApy.add(apy);
        }

        BigDecimal avgApy = sumApy.divide(BigDecimal.valueOf(snapshots.size()), 4, RoundingMode.HALF_UP);
        BigDecimal currentApy = snapshots.get(snapshots.size() - 1).getApy();

        return StrategyPerformanceResponse.builder()
                .strategyId(strategy.getId())
                .strategyName(strategy.getName())
                .periodStart(snapshots.get(0).getRecordedAt())
                .periodEnd(snapshots.get(snapshots.size() - 1).getRecordedAt())
                .currentApy(currentApy)
                .averageApy(avgApy)
                .minApy(minApy)
                .maxApy(maxApy)
                .totalObservations(snapshots.size())
                .build();
    }

    @Transactional
    public StrategySnapshot generateSimulatedObservation(Strategy strategy, Random random) {
        double currentApy = strategy.getCurrentApy() != null ? strategy.getCurrentApy() : 5.0;
        // APY change between -0.4% and +0.4%
        double apyDelta = (random.nextDouble() * 0.8) - 0.4;
        double newApy = Math.max(0.5, Math.min(25.0, currentApy + apyDelta));

        double currentLiquidity = strategy.getLiquidityAvailable() != null ? strategy.getLiquidityAvailable() : 100000.0;
        // Liquidity change between -2% and +2%
        double liqFactor = 1.0 + ((random.nextDouble() * 0.04) - 0.02);
        double newLiquidity = Math.max(10000.0, currentLiquidity * liqFactor);

        StrategySnapshot snapshot = StrategySnapshot.builder()
                .strategy(strategy)
                .apy(BigDecimal.valueOf(newApy).setScale(4, RoundingMode.HALF_UP))
                .riskScore(strategy.getRiskScore())
                .availableLiquidity(BigDecimal.valueOf(newLiquidity).setScale(2, RoundingMode.HALF_UP))
                .totalAllocated(BigDecimal.valueOf(100000.0 * (strategy.getAllocationPercentage() / 100.0)).setScale(2, RoundingMode.HALF_UP))
                .recordedAt(LocalDateTime.now())
                .build();

        strategy.setCurrentApy(newApy);
        strategy.setLiquidityAvailable(newLiquidity);
        strategyRepository.save(strategy);

        return snapshotRepository.save(snapshot);
    }

    private SnapshotResponse mapToResponse(StrategySnapshot s, String strategyName) {
        return SnapshotResponse.builder()
                .id(s.getId())
                .strategyId(s.getStrategyId())
                .strategyName(strategyName)
                .apy(s.getApy())
                .riskScore(s.getRiskScore())
                .availableLiquidity(s.getAvailableLiquidity())
                .totalAllocated(s.getTotalAllocated())
                .recordedAt(s.getRecordedAt())
                .build();
    }
}
