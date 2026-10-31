package com.yieldpilot.scheduler;

import com.yieldpilot.entity.Strategy;
import com.yieldpilot.repository.StrategyRepository;
import com.yieldpilot.service.StrategySnapshotService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Random;

@Component
@ConditionalOnProperty(name = "yieldpilot.scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class StrategySnapshotScheduler {

    private static final Logger log = LoggerFactory.getLogger(StrategySnapshotScheduler.class);

    private final StrategyRepository strategyRepository;
    private final StrategySnapshotService snapshotService;
    private final Random random;

    public StrategySnapshotScheduler(StrategyRepository strategyRepository,
                                     StrategySnapshotService snapshotService,
                                     @Value("${yieldpilot.scheduler.seed:#{null}}") Long seed) {
        this.strategyRepository = strategyRepository;
        this.snapshotService = snapshotService;
        this.random = seed != null ? new Random(seed) : new Random();
    }

    @Scheduled(fixedRateString = "${yieldpilot.scheduler.snapshot-rate-ms:300000}", initialDelay = 10000)
    public void generateSnapshotsPeriodically() {
        generateSnapshots();
    }

    public int generateSnapshots() {
        log.info("Generating periodic strategy snapshots...");
        List<Strategy> activeStrategies = strategyRepository.findAll().stream()
                .filter(Strategy::isActive)
                .toList();

        int count = 0;
        for (Strategy strategy : activeStrategies) {
            try {
                snapshotService.generateSimulatedObservation(strategy, random);
                count++;
            } catch (Exception e) {
                log.error("Failed to generate snapshot for strategy {}: {}", strategy.getName(), e.getMessage());
            }
        }
        log.info("Generated snapshots for {} active strategies", count);
        return count;
    }
}
