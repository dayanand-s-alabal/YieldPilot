package com.yieldpilot.config;

import com.yieldpilot.entity.*;
import com.yieldpilot.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Configuration
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final StrategyRepository strategyRepository;
    private final StrategySnapshotRepository snapshotRepository;
    private final VaultRepository vaultRepository;
    private final VaultPositionRepository positionRepository;
    private final VaultTransactionRepository transactionRepository;
    private final RebalanceProposalRepository proposalRepository;

    public DataInitializer(StrategyRepository strategyRepository,
                           StrategySnapshotRepository snapshotRepository,
                           VaultRepository vaultRepository,
                           VaultPositionRepository positionRepository,
                           VaultTransactionRepository transactionRepository,
                           RebalanceProposalRepository proposalRepository) {
        this.strategyRepository = strategyRepository;
        this.snapshotRepository = snapshotRepository;
        this.vaultRepository = vaultRepository;
        this.positionRepository = positionRepository;
        this.transactionRepository = transactionRepository;
        this.proposalRepository = proposalRepository;
    }

    @Override
    public void run(String... args) {
        seedStrategiesAndSnapshots();
        Vault vault = seedVaultAndPositions();
        seedTransactions(vault);
        seedInitialProposal(vault);
    }

    private void seedStrategiesAndSnapshots() {
        // Ensure the 3 required strategies exist
        Strategy s1 = ensureStrategy("Stable Reserve", "Lending", 1, "Low Risk", 4.0, 50.0, 50.0, 100000.0);
        Strategy s2 = ensureStrategy("Balanced Yield", "Liquidity Pool", 2, "Balanced", 7.0, 30.0, 40.0, 75000.0);
        Strategy s3 = ensureStrategy("High Yield", "Leveraged Staking", 4, "High Yield", 10.0, 20.0, 30.0, 50000.0);

        seedHistoricalSnapshots(s1, 4.0, 1, 100000.0);
        seedHistoricalSnapshots(s2, 7.0, 2, 75000.0);
        seedHistoricalSnapshots(s3, 10.0, 4, 50000.0);
    }

    private Strategy ensureStrategy(String name, String type, int riskScore, String riskLevel,
                                    double apy, double allocPct, double capPct, double liquidity) {
        Optional<Strategy> opt = strategyRepository.findByName(name);
        if (opt.isPresent()) {
            Strategy s = opt.get();
            s.setStrategyType(type);
            s.setRiskScore(riskScore);
            s.setAllocationPercentage(allocPct);
            s.setAllocationCapPercent(capPct);
            s.setLiquidityAvailable(liquidity);
            s.setActive(true);
            return strategyRepository.save(s);
        } else {
            Strategy s = Strategy.builder()
                    .name(name)
                    .strategyType(type)
                    .riskScore(riskScore)
                    .riskLevel(riskLevel)
                    .currentApy(apy)
                    .allocationPercentage(allocPct)
                    .allocationCapPercent(capPct)
                    .liquidityAvailable(liquidity)
                    .status("Active")
                    .active(true)
                    .build();
            return strategyRepository.save(s);
        }
    }

    private void seedHistoricalSnapshots(Strategy strategy, double baseApy, int riskScore, double liquidity) {
        if (snapshotRepository.findByStrategyIdOrderByRecordedAtDesc(strategy.getId()).isEmpty()) {
            log.info("Seeding initial historical snapshots for strategy: {}", strategy.getName());
            LocalDateTime now = LocalDateTime.now();

            // Create 5 observations over the past 5 days
            double[] deltas = {-0.3, 0.1, -0.1, 0.2, 0.0};
            for (int i = 0; i < deltas.length; i++) {
                double apy = Math.max(0.1, baseApy + deltas[i]);
                LocalDateTime time = now.minusDays(4 - i).minusHours(i * 2);

                snapshotRepository.save(StrategySnapshot.builder()
                        .strategy(strategy)
                        .apy(BigDecimal.valueOf(apy))
                        .riskScore(riskScore)
                        .availableLiquidity(BigDecimal.valueOf(liquidity * (1.0 + (deltas[i] * 0.01))))
                        .totalAllocated(BigDecimal.valueOf(100000.0 * (strategy.getAllocationPercentage() / 100.0)))
                        .recordedAt(time)
                        .build());
            }
        }
    }

    private Vault seedVaultAndPositions() {
        Vault vault = vaultRepository.findFirstByOrderByIdAsc().orElseGet(() -> {
            log.info("Seeding default Vault...");
            Vault v = Vault.builder()
                    .name("YieldPilot USDC Core Vault")
                    .assetSymbol("USDC")
                    .totalAssets(BigDecimal.valueOf(250000.0))
                    .totalShares(BigDecimal.valueOf(250000.0))
                    .estimatedApy(BigDecimal.valueOf(7.25))
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            return vaultRepository.save(v);
        });

        String demoWallet = "0x1234567890abcdef1234567890abcdef12345678";
        if (positionRepository.findByVaultIdAndWalletAddress(vault.getId(), demoWallet).isEmpty()) {
            log.info("Seeding default position for demo wallet...");
            positionRepository.save(VaultPosition.builder()
                    .vault(vault)
                    .walletAddress(demoWallet)
                    .shares(BigDecimal.valueOf(1000.0))
                    .depositedAssets(BigDecimal.valueOf(1000.0))
                    .createdAt(LocalDateTime.now().minusDays(7))
                    .updatedAt(LocalDateTime.now().minusDays(7))
                    .build());
        }

        return vault;
    }

    private void seedTransactions(Vault vault) {
        if (transactionRepository.count() == 0) {
            log.info("Seeding initial vault transactions...");
            String demoWallet = "0x1234567890abcdef1234567890abcdef12345678";

            transactionRepository.save(VaultTransaction.builder()
                    .vault(vault)
                    .walletAddress(demoWallet)
                    .transactionType("DEPOSIT")
                    .assetAmount(BigDecimal.valueOf(1000.00))
                    .shareAmount(BigDecimal.valueOf(1000.00))
                    .status("CONFIRMED")
                    .source("SIMULATED")
                    .transactionHash("0x8f2c31d9a5b4e7c10000000000000001")
                    .createdAt(LocalDateTime.now().minusDays(3))
                    .build());

            transactionRepository.save(VaultTransaction.builder()
                    .vault(vault)
                    .walletAddress(demoWallet)
                    .transactionType("WITHDRAW")
                    .assetAmount(BigDecimal.valueOf(200.00))
                    .shareAmount(BigDecimal.valueOf(200.00))
                    .status("CONFIRMED")
                    .source("SIMULATED")
                    .transactionHash("0x1d8a55e8f4b7a2c30000000000000002")
                    .createdAt(LocalDateTime.now().minusDays(1))
                    .build());
        }
    }

    private void seedInitialProposal(Vault vault) {
        if (proposalRepository.count() == 0) {
            log.info("Seeding initial rebalance proposal...");
            RebalanceProposal proposal = RebalanceProposal.builder()
                    .vault(vault)
                    .status("GENERATED")
                    .totalAssets(BigDecimal.valueOf(250000.0))
                    .expectedNetBenefit(BigDecimal.valueOf(18.45))
                    .estimatedCost(BigDecimal.valueOf(15.00))
                    .decisionReason("Rebalance recommended: Expected 30-day additional yield of $33.45 exceeds estimated execution cost of $15.00 (Net Benefit: +$18.45). Allocation drift: 4.80%.")
                    .description("Optimize Balanced Yield vs High Yield Allocation")
                    .reason("Balanced Yield APY has outperformed while risk remains low. Shifting weight optimizes risk-adjusted returns.")
                    .riskWarning("Execution involves multi-strategy routing. Slippage bounded under 0.1%.")
                    .createdAt(LocalDateTime.now())
                    .expiresAt(LocalDateTime.now().plusHours(24))
                    .build();

            proposalRepository.save(proposal);
        }
    }
}
