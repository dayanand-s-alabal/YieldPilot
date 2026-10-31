package com.yieldpilot.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Legacy stub - real scheduling is done by StrategySnapshotScheduler and RebalanceScheduler.
 */
@Component
@ConditionalOnProperty(name = "yieldpilot.scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class StrategyEvaluationScheduler {
    private static final Logger log = LoggerFactory.getLogger(StrategyEvaluationScheduler.class);

    @Scheduled(fixedRate = 3_600_000, initialDelay = 60_000)
    public void evaluateStrategiesPeriodically() {
        log.debug("Legacy StrategyEvaluationScheduler tick (delegated to StrategySnapshotScheduler).");
    }
}