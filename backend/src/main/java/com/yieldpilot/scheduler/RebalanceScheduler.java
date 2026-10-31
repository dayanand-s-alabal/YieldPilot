package com.yieldpilot.scheduler;

import com.yieldpilot.dto.RebalanceProposalResponse;
import com.yieldpilot.dto.RebalanceRequest;
import com.yieldpilot.rebalancing.RebalanceProposalService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "yieldpilot.scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class RebalanceScheduler {

    private static final Logger log = LoggerFactory.getLogger(RebalanceScheduler.class);

    private final RebalanceProposalService proposalService;

    public RebalanceScheduler(RebalanceProposalService proposalService) {
        this.proposalService = proposalService;
    }

    @Scheduled(fixedRateString = "${yieldpilot.scheduler.rebalance-rate-ms:600000}", initialDelay = 30000)
    public void evaluateRebalancingPeriodically() {
        try {
            log.info("Running automated periodic rebalancing evaluation...");
            RebalanceProposalResponse response = proposalService.evaluateAndCreateProposal(new RebalanceRequest());
            log.info("Periodic rebalancing evaluation complete: proposal ID={}, recommendation={}, decision={}",
                    response.getId(), response.getRecommendation(), response.getDecisionReason());
        } catch (Exception e) {
            log.error("Error during periodic rebalance evaluation: {}", e.getMessage(), e);
        }
    }
}
