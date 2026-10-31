package com.yieldpilot;

import com.yieldpilot.dto.*;
import com.yieldpilot.entity.*;
import com.yieldpilot.rebalancing.*;
import com.yieldpilot.repository.*;
import com.yieldpilot.service.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class YieldPilotIntegrationTests {

    // ---- Repositories ----
    @Autowired StrategyRepository strategyRepository;
    @Autowired StrategySnapshotRepository snapshotRepository;
    @Autowired VaultRepository vaultRepository;
    @Autowired VaultPositionRepository positionRepository;
    @Autowired VaultTransactionRepository transactionRepository;
    @Autowired RebalanceProposalRepository proposalRepository;

    // ---- Services ----
    @Autowired StrategySnapshotService snapshotService;
    @Autowired VaultService vaultService;
    @Autowired RebalanceProposalService proposalService;
    @Autowired RiskScoringService riskScoringService;
    @Autowired AllocationOptimizer allocationOptimizer;
    @Autowired RebalanceCostCalculator costCalculator;
    @Autowired RebalanceEvaluator rebalanceEvaluator;

    // ======================================================================
    // MILESTONE 2.3 — Strategy Yield Monitoring
    // ======================================================================

    @Test
    @Order(1)
    @DisplayName("2.3-1: Seeded strategies are present")
    void strategiesSeeded() {
        List<Strategy> all = strategyRepository.findAll();
        assertThat(all).hasSizeGreaterThanOrEqualTo(3);
        assertThat(all.stream().map(Strategy::getName))
                .contains("Stable Reserve", "Balanced Yield", "High Yield");
    }

    @Test
    @Order(2)
    @DisplayName("2.3-2: Create snapshot via service - valid")
    @Transactional
    void createValidSnapshot() {
        Strategy s = strategyRepository.findByName("Stable Reserve").orElseThrow();
        SnapshotRequest req = new SnapshotRequest(s.getId(),
                BigDecimal.valueOf(4.05), 1,
                BigDecimal.valueOf(100000), BigDecimal.valueOf(50000),
                LocalDateTime.now());

        SnapshotResponse resp = snapshotService.createSnapshot(s.getId(), req);

        assertThat(resp).isNotNull();
        assertThat(resp.getStrategyId()).isEqualTo(s.getId());
        assertThat(resp.getApy()).isEqualByComparingTo(BigDecimal.valueOf(4.05));
        assertThat(resp.getRiskScore()).isEqualTo(1);
        assertThat(resp.getAvailableLiquidity()).isGreaterThanOrEqualTo(BigDecimal.ZERO);
    }

    @Test
    @Order(3)
    @DisplayName("2.3-3: Reject negative APY")
    void rejectNegativeApy() {
        Strategy s = strategyRepository.findByName("Stable Reserve").orElseThrow();
        SnapshotRequest req = new SnapshotRequest(s.getId(),
                BigDecimal.valueOf(-1.0), 1,
                BigDecimal.valueOf(100000), BigDecimal.ZERO, null);

        assertThatThrownBy(() -> snapshotService.createSnapshot(s.getId(), req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("APY");
    }

    @Test
    @Order(4)
    @DisplayName("2.3-4: Reject risk score outside 1-5")
    void rejectInvalidRiskScore() {
        Strategy s = strategyRepository.findByName("Stable Reserve").orElseThrow();
        SnapshotRequest req = new SnapshotRequest(s.getId(),
                BigDecimal.valueOf(4.0), 6,   // invalid
                BigDecimal.valueOf(100000), BigDecimal.ZERO, null);

        assertThatThrownBy(() -> snapshotService.createSnapshot(s.getId(), req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Risk score");
    }

    @Test
    @Order(5)
    @DisplayName("2.3-5: Reject negative liquidity")
    void rejectNegativeLiquidity() {
        Strategy s = strategyRepository.findByName("Stable Reserve").orElseThrow();
        SnapshotRequest req = new SnapshotRequest(s.getId(),
                BigDecimal.valueOf(4.0), 1,
                BigDecimal.valueOf(-500), BigDecimal.ZERO, null);

        assertThatThrownBy(() -> snapshotService.createSnapshot(s.getId(), req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("liquidity");
    }

    @Test
    @Order(6)
    @DisplayName("2.3-6: Latest snapshot returns most recent observation")
    void latestSnapshotReturnsMostRecent() {
        Strategy s = strategyRepository.findByName("Balanced Yield").orElseThrow();
        SnapshotResponse latest = snapshotService.getLatestSnapshot(s.getId());
        assertThat(latest).isNotNull();
        assertThat(latest.getStrategyId()).isEqualTo(s.getId());
    }

    @Test
    @Order(7)
    @DisplayName("2.3-7: Performance stats calculated from snapshots")
    void performanceStatsCalculated() {
        Strategy s = strategyRepository.findByName("High Yield").orElseThrow();
        StrategyPerformanceResponse perf = snapshotService.getStrategyPerformance(s.getId(), null, null);
        assertThat(perf).isNotNull();
        assertThat(perf.getStrategyId()).isEqualTo(s.getId());
        assertThat(perf.getAverageApy()).isGreaterThan(BigDecimal.ZERO);
        assertThat(perf.getMinApy()).isLessThanOrEqualTo(perf.getAverageApy());
        assertThat(perf.getMaxApy()).isGreaterThanOrEqualTo(perf.getAverageApy());
    }

    @Test
    @Order(8)
    @DisplayName("2.3-8: Snapshot associated with correct strategy")
    @Transactional
    void snapshotBelongsToCorrectStrategy() {
        Strategy s1 = strategyRepository.findByName("Stable Reserve").orElseThrow();
        Strategy s2 = strategyRepository.findByName("Balanced Yield").orElseThrow();

        SnapshotRequest req = new SnapshotRequest(s1.getId(),
                BigDecimal.valueOf(3.95), 1,
                BigDecimal.valueOf(99000), BigDecimal.ZERO, null);
        SnapshotResponse resp = snapshotService.createSnapshot(s1.getId(), req);

        assertThat(resp.getStrategyId()).isEqualTo(s1.getId());
        assertThat(resp.getStrategyId()).isNotEqualTo(s2.getId());
    }

    @Test
    @Order(9)
    @DisplayName("2.3-9: Scheduler generates new snapshots without overwriting old ones")
    void schedulerAppendsNewSnapshots() {
        Strategy s = strategyRepository.findByName("Stable Reserve").orElseThrow();
        long countBefore = snapshotRepository.findByStrategyIdOrderByRecordedAtDesc(s.getId()).size();

        // Manually trigger a simulated observation
        snapshotService.generateSimulatedObservation(s, new Random(42));

        long countAfter = snapshotRepository.findByStrategyIdOrderByRecordedAtDesc(s.getId()).size();
        assertThat(countAfter).isGreaterThan(countBefore);
    }

    // ======================================================================
    // MILESTONE 2.4 — Vault Management
    // ======================================================================

    @Test
    @Order(10)
    @DisplayName("2.4-1: Vault summary is returned")
    void vaultSummaryReturned() {
        VaultSummaryResponse summary = vaultService.getVaultSummary();
        assertThat(summary).isNotNull();
        assertThat(summary.getTotalValueLocked()).isGreaterThan(0.0);
        assertThat(summary.getEstimatedApy()).isGreaterThan(0.0);
        assertThat(summary.getTotalStrategies()).isGreaterThan(0);
    }

    @Test
    @Order(11)
    @DisplayName("2.4-2: User position returned for known wallet")
    void userPositionForKnownWallet() {
        String wallet = "0x1234567890abcdef1234567890abcdef12345678";
        UserPositionResponse pos = vaultService.getUserPosition(wallet);
        assertThat(pos).isNotNull();
        assertThat(pos.getWalletAddress()).isEqualTo(wallet.toLowerCase());
        assertThat(pos.getShares()).isGreaterThanOrEqualTo(BigDecimal.ZERO);
    }

    @Test
    @Order(12)
    @DisplayName("2.4-3: Unknown wallet returns empty position")
    void unknownWalletReturnsEmptyPosition() {
        String wallet = "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
        UserPositionResponse pos = vaultService.getUserPosition(wallet);
        assertThat(pos.getShares()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(pos.getDepositedAssets()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @Order(13)
    @DisplayName("2.4-4: Simulated deposit adds shares and records transaction")
    @Transactional
    void simulatedDepositAddsSharesAndTransaction() {
        String wallet = "0xaabbccddeeff00112233445566778899aabbccdd";
        BigDecimal amount = BigDecimal.valueOf(1000);

        TransactionResponse resp = vaultService.simulateDeposit(new DepositRequest(wallet, amount));

        assertThat(resp).isNotNull();
        assertThat(resp.getTransactionType()).isEqualTo("DEPOSIT");
        assertThat(resp.getAssetAmount()).isEqualByComparingTo(amount);
        assertThat(resp.getShareAmount()).isGreaterThan(BigDecimal.ZERO);
        assertThat(resp.getStatus()).isEqualTo("SIMULATED");

        UserPositionResponse pos = vaultService.getUserPosition(wallet);
        assertThat(pos.getShares()).isGreaterThan(BigDecimal.ZERO);
    }

    @Test
    @Order(14)
    @DisplayName("2.4-5: Reject deposit of zero amount")
    void rejectZeroDeposit() {
        DepositRequest req = new DepositRequest("0xaabbccddeeff00112233445566778899aabbccdd", BigDecimal.ZERO);
        assertThatThrownBy(() -> vaultService.simulateDeposit(req))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @Order(15)
    @DisplayName("2.4-6: Simulated withdrawal reduces shares atomically")
    @Transactional
    void simulatedWithdrawalReducesShares() {
        String wallet = "0x1111222233334444555566667777888899990000";
        // First deposit
        vaultService.simulateDeposit(new DepositRequest(wallet, BigDecimal.valueOf(500)));

        UserPositionResponse before = vaultService.getUserPosition(wallet);
        BigDecimal sharesBefore = before.getShares();
        assertThat(sharesBefore).isGreaterThan(BigDecimal.ZERO);

        // Then withdraw half
        TransactionResponse resp = vaultService.simulateWithdraw(new WithdrawalRequest(wallet, BigDecimal.valueOf(200)));
        assertThat(resp.getTransactionType()).isEqualTo("WITHDRAW");

        UserPositionResponse after = vaultService.getUserPosition(wallet);
        assertThat(after.getShares()).isLessThan(sharesBefore);
    }

    @Test
    @Order(16)
    @DisplayName("2.4-7: Reject withdrawal exceeding position balance")
    @Transactional
    void rejectOverdraftWithdrawal() {
        String wallet = "0x9999000011112222333344445555666677778888";
        // Deposit 100
        vaultService.simulateDeposit(new DepositRequest(wallet, BigDecimal.valueOf(100)));

        // Try to withdraw 99999
        assertThatThrownBy(() -> vaultService.simulateWithdraw(
                new WithdrawalRequest(wallet, BigDecimal.valueOf(99999))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("exceeds");
    }

    @Test
    @Order(17)
    @DisplayName("2.4-8: Multiple deposits compound share balance correctly")
    @Transactional
    void multipleDepositsCompoundShareBalance() {
        String wallet = "0xffeeddccbbaa99887766554433221100ffeeddcc";
        vaultService.simulateDeposit(new DepositRequest(wallet, BigDecimal.valueOf(200)));
        vaultService.simulateDeposit(new DepositRequest(wallet, BigDecimal.valueOf(300)));

        UserPositionResponse pos = vaultService.getUserPosition(wallet);
        assertThat(pos.getShares()).isGreaterThan(BigDecimal.ZERO);
        // Should have more shares than a single 200 deposit
        assertThat(pos.getShares()).isGreaterThan(BigDecimal.valueOf(100));
    }

    @Test
    @Order(18)
    @DisplayName("2.4-9: Transaction history is returned")
    void transactionHistoryReturned() {
        List<TransactionResponse> txs = vaultService.getTransactions();
        assertThat(txs).isNotEmpty();
    }

    @Test
    @Order(19)
    @DisplayName("2.4-10: Duplicate transaction hash is rejected")
    void rejectDuplicateTxHash() {
        String wallet = "0xabababababababababababababababababababababab";
        String txHash = "0xdeadbeef00000000000000000000000000000001";
        vaultService.simulateDeposit(new DepositRequest(wallet, BigDecimal.valueOf(100), txHash));

        assertThatThrownBy(() ->
                vaultService.simulateDeposit(new DepositRequest(wallet, BigDecimal.valueOf(100), txHash)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Duplicate transaction hash");
    }

    // ======================================================================
    // MILESTONE 2.5 — Dynamic Rebalancing Engine
    // ======================================================================

    @Test
    @Order(20)
    @DisplayName("2.5-1: Risk-adjusted score S_i = APY / (1 + lambda * risk)")
    void riskAdjustedScoreFormula() {
        // S = 7.0 / (1 + 0.5 * 2) = 7.0 / 2.0 = 3.5
        double score = riskScoringService.calculateScore(7.0, 2, 0.5);
        assertThat(score).isCloseTo(3.5, within(0.0001));
    }

    @Test
    @Order(21)
    @DisplayName("2.5-2: Higher APY strategy gets higher score at same risk")
    void higherApyHigherScore() {
        double s1 = riskScoringService.calculateScore(10.0, 2, 0.5);
        double s2 = riskScoringService.calculateScore(4.0, 2, 0.5);
        assertThat(s1).isGreaterThan(s2);
    }

    @Test
    @Order(22)
    @DisplayName("2.5-3: Constrained allocation sums to <= total assets")
    void allocationSumsToTotalAssets() {
        List<Strategy> eligible = strategyRepository.findAll().stream()
                .filter(Strategy::isActive).toList();
        Map<Long, Double> scores = new HashMap<>();
        for (Strategy s : eligible) {
            scores.put(s.getId(), riskScoringService.calculateScore(s.getCurrentApy(), s.getRiskScore(), 0.5));
        }

        BigDecimal totalAssets = BigDecimal.valueOf(100000);
        AllocationOptimizer.OptimizationResult result = allocationOptimizer.optimize(
                eligible, scores, totalAssets, 5.0);

        assertThat(result.isFeasible()).isTrue();
        BigDecimal totalAllocated = result.getPlans().stream()
                .map(AllocationOptimizer.StrategyAllocationPlan::getTargetAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertThat(totalAllocated).isLessThanOrEqualTo(totalAssets);
    }

    @Test
    @Order(23)
    @DisplayName("2.5-4: Strategy exceeding max risk is excluded from evaluation")
    void riskExceedingStrategyExcluded() {
        Vault vault = vaultService.getOrCreateDefaultVault();
        RebalanceRequest req = new RebalanceRequest(0.5, 1, 30, 0.0); // maxRiskScore = 1

        RebalanceEvaluator.EvaluationResult result = rebalanceEvaluator.evaluateVault(vault, req);

        // With maxRiskScore=1 only Stable Reserve (risk=1) should qualify
        // High Yield (4) and Balanced Yield (2) should be excluded
        if (result.isEligible()) {
            boolean allWithinRisk = result.getItems().stream()
                    .allMatch(i -> i.getRiskScore() != null && i.getRiskScore() <= 1);
            assertThat(allWithinRisk).isTrue();
        }
    }

    @Test
    @Order(24)
    @DisplayName("2.5-5: Inactive strategy is excluded from evaluation")
    void inactiveStrategyExcluded() {
        // Deactivate one strategy temporarily
        Strategy s = strategyRepository.findByName("High Yield").orElseThrow();
        s.setActive(false);
        strategyRepository.save(s);

        Vault vault = vaultService.getOrCreateDefaultVault();
        RebalanceEvaluator.EvaluationResult result = rebalanceEvaluator.evaluateVault(vault, new RebalanceRequest());

        boolean noHighYield = result.getItems().stream()
                .noneMatch(i -> "High Yield".equals(i.getStrategyName()));
        assertThat(noHighYield).isTrue();

        // Restore
        s.setActive(true);
        strategyRepository.save(s);
    }

    @Test
    @Order(25)
    @DisplayName("2.5-6: Cost exceeding benefit returns HOLD recommendation")
    void costExceedingBenefitReturnsHold() {
        // Manufacture scenario: identical APY so no extra yield, but with turnover
        List<RebalanceCostCalculator.StrategyMovement> movements = List.of(
                new RebalanceCostCalculator.StrategyMovement(1L, "A", 5.0,
                        BigDecimal.valueOf(50000), BigDecimal.valueOf(50100),
                        BigDecimal.valueOf(100), "DEPOSIT")
        );
        RebalanceCostCalculator.CostBenefitAnalysis analysis = costCalculator.evaluate(
                movements, BigDecimal.valueOf(100000), 30, 5.0);

        // Expected: 30-day extra yield on $100 at 5% APY = 100 * 0.05 * (30/365) ≈ $0.41
        // Cost ≈ 1 leg * $5 + 0.05% * $50 ≈ $5.03
        // Net benefit < 0 → not worthwhile
        assertThat(analysis.isWorthwhile()).isFalse();
    }

    @Test
    @Order(26)
    @DisplayName("2.5-7: Evaluate creates a rebalance proposal in DB")
    void evaluateCreatesProposal() {
        long before = proposalRepository.count();
        RebalanceProposalResponse resp = proposalService.evaluateAndCreateProposal(new RebalanceRequest());
        assertThat(resp).isNotNull();
        assertThat(resp.getId()).isNotNull();
        assertThat(proposalRepository.count()).isGreaterThan(before);
    }

    @Test
    @Order(27)
    @DisplayName("2.5-8: Proposal has GENERATED status initially")
    void proposalGeneratedStatus() {
        RebalanceProposalResponse resp = proposalService.evaluateAndCreateProposal(new RebalanceRequest());
        assertThat(resp.getStatus()).isEqualTo("GENERATED");
    }

    @Test
    @Order(28)
    @DisplayName("2.5-9: Approve changes status to APPROVED")
    void approveChangesStatus() {
        RebalanceProposalResponse generated = proposalService.evaluateAndCreateProposal(new RebalanceRequest());
        RebalanceProposalResponse approved = proposalService.approveProposal(generated.getId());
        assertThat(approved.getStatus()).isEqualTo("APPROVED");
        assertThat(approved.getApprovedAt()).isNotNull();
    }

    @Test
    @Order(29)
    @DisplayName("2.5-10: Double-approve is rejected")
    void doubleApproveRejected() {
        RebalanceProposalResponse gen = proposalService.evaluateAndCreateProposal(new RebalanceRequest());
        proposalService.approveProposal(gen.getId());
        assertThatThrownBy(() -> proposalService.approveProposal(gen.getId()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already been approved");
    }

    @Test
    @Order(30)
    @DisplayName("2.5-11: Reject changes status to REJECTED")
    void rejectChangesStatus() {
        RebalanceProposalResponse gen = proposalService.evaluateAndCreateProposal(new RebalanceRequest());
        RebalanceProposalResponse rejected = proposalService.rejectProposal(gen.getId(), "Not needed now");
        assertThat(rejected.getStatus()).isEqualTo("REJECTED");
    }

    @Test
    @Order(31)
    @DisplayName("2.5-12: Execute rejected proposal is blocked")
    void executeRejectedProposalBlocked() {
        RebalanceProposalResponse gen = proposalService.evaluateAndCreateProposal(new RebalanceRequest());
        proposalService.rejectProposal(gen.getId(), "Testing rejection");
        assertThatThrownBy(() -> proposalService.executeProposal(gen.getId()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("rejected");
    }

    @Test
    @Order(32)
    @DisplayName("2.5-13: Execute changes status to EXECUTED")
    void executeChangesStatus() {
        RebalanceProposalResponse gen = proposalService.evaluateAndCreateProposal(new RebalanceRequest());
        RebalanceProposalResponse exec = proposalService.executeProposal(gen.getId());
        assertThat(exec.getStatus()).isEqualTo("EXECUTED");
        assertThat(exec.getExecutedAt()).isNotNull();
    }

    @Test
    @Order(33)
    @DisplayName("2.5-14: Duplicate execution is rejected")
    void duplicateExecutionRejected() {
        RebalanceProposalResponse gen = proposalService.evaluateAndCreateProposal(new RebalanceRequest());
        proposalService.executeProposal(gen.getId());
        assertThatThrownBy(() -> proposalService.executeProposal(gen.getId()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already been executed");
    }

    @Test
    @Order(34)
    @DisplayName("2.5-15: Expired proposal cannot be approved")
    void expiredProposalCannotBeApproved() {
        RebalanceProposalResponse gen = proposalService.evaluateAndCreateProposal(new RebalanceRequest());

        // Force expiry on the entity
        RebalanceProposal entity = proposalRepository.findById(gen.getId()).orElseThrow();
        entity.setExpiresAt(LocalDateTime.now().minusHours(1));
        proposalRepository.save(entity);

        assertThatThrownBy(() -> proposalService.approveProposal(gen.getId()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("expired");
    }

    @Test
    @Order(35)
    @DisplayName("2.5-16: Decision reason explains the recommendation")
    void decisionReasonIsExplained() {
        RebalanceProposalResponse resp = proposalService.evaluateAndCreateProposal(new RebalanceRequest());
        assertThat(resp.getDecisionReason()).isNotBlank();
        assertThat(resp.getRecommendation()).isIn("REBALANCE", "HOLD");
    }

    @Test
    @Order(36)
    @DisplayName("2.5-17: Proposal never allocates more than total assets")
    void proposalNeverAllocatesMoreThanTotalAssets() {
        RebalanceProposalResponse resp = proposalService.evaluateAndCreateProposal(new RebalanceRequest());

        if (resp.getItems() != null && !resp.getItems().isEmpty()) {
            BigDecimal totalTarget = resp.getItems().stream()
                    .map(AllocationResponse::getTargetAllocationAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            assertThat(totalTarget).isLessThanOrEqualTo(resp.getTotalAssets());
        }
    }

    @Test
    @Order(37)
    @DisplayName("2.5-18: Rebalance history contains executed proposals")
    void rebalanceHistoryContainsExecuted() {
        // Execute one
        RebalanceProposalResponse gen = proposalService.evaluateAndCreateProposal(new RebalanceRequest());
        proposalService.executeProposal(gen.getId());

        List<RebalanceProposalResponse> history = proposalService.getRebalanceHistory();
        boolean hasExecuted = history.stream().anyMatch(p -> "EXECUTED".equals(p.getStatus()));
        assertThat(hasExecuted).isTrue();
    }

    // ======================================================================
    // Helpers
    // ======================================================================
    static org.assertj.core.data.Offset<Double> within(double delta) {
        return org.assertj.core.data.Offset.offset(delta);
    }
}
