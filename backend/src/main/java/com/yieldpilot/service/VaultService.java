package com.yieldpilot.service;

import com.yieldpilot.dto.*;
import com.yieldpilot.entity.Strategy;
import com.yieldpilot.entity.Vault;
import com.yieldpilot.entity.VaultPosition;
import com.yieldpilot.entity.VaultTransaction;
import com.yieldpilot.repository.StrategyRepository;
import com.yieldpilot.repository.VaultPositionRepository;
import com.yieldpilot.repository.VaultRepository;
import com.yieldpilot.repository.VaultTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class VaultService {

    private final VaultRepository vaultRepository;
    private final VaultPositionRepository positionRepository;
    private final VaultTransactionRepository transactionRepository;
    private final StrategyRepository strategyRepository;

    public VaultService(VaultRepository vaultRepository,
                        VaultPositionRepository positionRepository,
                        VaultTransactionRepository transactionRepository,
                        StrategyRepository strategyRepository) {
        this.vaultRepository = vaultRepository;
        this.positionRepository = positionRepository;
        this.transactionRepository = transactionRepository;
        this.strategyRepository = strategyRepository;
    }

    @Transactional
    public Vault getOrCreateDefaultVault() {
        return vaultRepository.findFirstByOrderByIdAsc().orElseGet(() -> {
            Vault vault = Vault.builder()
                    .name("YieldPilot USDC Core Vault")
                    .assetSymbol("USDC")
                    .totalAssets(BigDecimal.valueOf(250000.0))
                    .totalShares(BigDecimal.valueOf(250000.0))
                    .estimatedApy(BigDecimal.valueOf(7.25))
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            return vaultRepository.save(vault);
        });
    }

    @Transactional(readOnly = true)
    public VaultSummaryResponse getVaultSummary() {
        Vault vault = getOrCreateDefaultVault();
        int totalStrategies = (int) strategyRepository.findAll().stream().filter(Strategy::isActive).count();
        long activeUsers = positionRepository.countBySharesGreaterThan(BigDecimal.ZERO);
        if (activeUsers == 0) {
            // Default mock user count for dashboard if position table hasn't recorded external users
            activeUsers = 25;
        }

        BigDecimal apy = calculateVaultApy();

        return VaultSummaryResponse.builder()
                .totalValueLocked(vault.getTotalAssets().doubleValue())
                .totalAssets(vault.getTotalAssets())
                .totalShares(vault.getTotalShares())
                .estimatedApy(apy.doubleValue())
                .totalStrategies(totalStrategies > 0 ? totalStrategies : 3)
                .activeUsers(activeUsers)
                .assetSymbol(vault.getAssetSymbol())
                .userDepositedValue(1000.00)
                .vaultShares(vault.getTotalShares().doubleValue() > 0 ? 892.34 : 0.0)
                .estimatedEarnings(245.32)
                .currentApy(apy.doubleValue())
                .apyChangePercentage(0.6)
                .build();
    }

    @Transactional(readOnly = true)
    public UserPositionResponse getUserPosition(String walletAddress) {
        if (walletAddress == null || walletAddress.trim().isEmpty()) {
            throw new IllegalArgumentException("Wallet address cannot be empty");
        }
        String normalizedAddress = walletAddress.trim().toLowerCase();
        Vault vault = getOrCreateDefaultVault();

        return positionRepository.findByVaultIdAndWalletAddress(vault.getId(), normalizedAddress)
                .map(pos -> {
                    BigDecimal shares = pos.getShares();
                    BigDecimal currentAssetValue;
                    if (vault.getTotalShares().compareTo(BigDecimal.ZERO) > 0) {
                        currentAssetValue = shares.multiply(vault.getTotalAssets())
                                .divide(vault.getTotalShares(), 18, RoundingMode.DOWN);
                    } else {
                        currentAssetValue = shares;
                    }
                    BigDecimal unrealizedYield = currentAssetValue.subtract(pos.getDepositedAssets());
                    return UserPositionResponse.builder()
                            .walletAddress(normalizedAddress)
                            .vaultId(vault.getId())
                            .shares(shares)
                            .depositedAssets(pos.getDepositedAssets())
                            .currentAssetValue(currentAssetValue)
                            .unrealizedYield(unrealizedYield.compareTo(BigDecimal.ZERO) > 0 ? unrealizedYield : BigDecimal.ZERO)
                            .build();
                })
                .orElseGet(() -> UserPositionResponse.builder()
                        .walletAddress(normalizedAddress)
                        .vaultId(vault.getId())
                        .shares(BigDecimal.ZERO)
                        .depositedAssets(BigDecimal.ZERO)
                        .currentAssetValue(BigDecimal.ZERO)
                        .unrealizedYield(BigDecimal.ZERO)
                        .build());
    }

    @Transactional
    public TransactionResponse simulateDeposit(DepositRequest request) {
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Deposit amount must be strictly greater than zero");
        }
        if (request.getWalletAddress() == null || request.getWalletAddress().trim().isEmpty()) {
            throw new IllegalArgumentException("Wallet address is required");
        }

        String normalizedAddress = request.getWalletAddress().trim().toLowerCase();
        String txHash = request.getTransactionHash() != null && !request.getTransactionHash().trim().isEmpty()
                ? request.getTransactionHash().trim()
                : generateSimulatedTxHash();

        if (transactionRepository.existsByTransactionHash(txHash)) {
            throw new IllegalArgumentException("Duplicate transaction hash: " + txHash);
        }

        Vault vault = getOrCreateDefaultVault();
        BigDecimal depositAmount = request.getAmount();

        // ERC-4626 Share Calculation:
        // Shares Issued = (Deposit Assets * Total Shares) / Total Assets
        BigDecimal sharesIssued;
        if (vault.getTotalShares().compareTo(BigDecimal.ZERO) == 0 || vault.getTotalAssets().compareTo(BigDecimal.ZERO) == 0) {
            sharesIssued = depositAmount;
        } else {
            sharesIssued = depositAmount.multiply(vault.getTotalShares())
                    .divide(vault.getTotalAssets(), 18, RoundingMode.DOWN);
        }

        // Update vault
        vault.setTotalAssets(vault.getTotalAssets().add(depositAmount));
        vault.setTotalShares(vault.getTotalShares().add(sharesIssued));
        vaultRepository.save(vault);

        // Update position
        VaultPosition position = positionRepository.findByVaultIdAndWalletAddress(vault.getId(), normalizedAddress)
                .orElseGet(() -> VaultPosition.builder()
                        .vault(vault)
                        .walletAddress(normalizedAddress)
                        .shares(BigDecimal.ZERO)
                        .depositedAssets(BigDecimal.ZERO)
                        .build());

        position.setShares(position.getShares().add(sharesIssued));
        position.setDepositedAssets(position.getDepositedAssets().add(depositAmount));
        positionRepository.save(position);

        // Record transaction
        VaultTransaction tx = VaultTransaction.builder()
                .vault(vault)
                .walletAddress(normalizedAddress)
                .transactionType("DEPOSIT")
                .assetAmount(depositAmount)
                .shareAmount(sharesIssued)
                .transactionHash(txHash)
                .status("SIMULATED")
                .source("SIMULATED")
                .createdAt(LocalDateTime.now())
                .build();

        VaultTransaction saved = transactionRepository.save(tx);
        return mapToTransactionResponse(saved);
    }

    @Transactional
    public TransactionResponse simulateWithdraw(WithdrawalRequest request) {
        if (request.getWalletAddress() == null || request.getWalletAddress().trim().isEmpty()) {
            throw new IllegalArgumentException("Wallet address is required");
        }

        String normalizedAddress = request.getWalletAddress().trim().toLowerCase();
        Vault vault = getOrCreateDefaultVault();

        VaultPosition position = positionRepository.findByVaultIdAndWalletAddress(vault.getId(), normalizedAddress)
                .orElseThrow(() -> new IllegalArgumentException("No position found for wallet: " + normalizedAddress));

        if (position.getShares().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("User position has zero shares");
        }

        BigDecimal sharesToBurn;
        BigDecimal assetsToReturn;

        if (request.getAmount() != null && request.getAmount().compareTo(BigDecimal.ZERO) > 0) {
            assetsToReturn = request.getAmount();
            // ERC-4626 convertToShares with ceiling for withdrawal
            if (vault.getTotalAssets().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Vault has zero assets");
            }
            sharesToBurn = assetsToReturn.multiply(vault.getTotalShares())
                    .divide(vault.getTotalAssets(), 18, RoundingMode.CEILING);
        } else if (request.getShares() != null && request.getShares().compareTo(BigDecimal.ZERO) > 0) {
            sharesToBurn = request.getShares();
            if (vault.getTotalShares().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Vault has zero shares");
            }
            assetsToReturn = sharesToBurn.multiply(vault.getTotalAssets())
                    .divide(vault.getTotalShares(), 18, RoundingMode.DOWN);
        } else {
            throw new IllegalArgumentException("Either withdrawal amount or shares must be greater than zero");
        }

        if (sharesToBurn.compareTo(position.getShares()) > 0) {
            throw new IllegalArgumentException("Withdrawal exceeds user's position balance");
        }

        if (assetsToReturn.compareTo(vault.getTotalAssets()) > 0) {
            throw new IllegalArgumentException("Withdrawal exceeds total vault liquidity");
        }

        String txHash = request.getTransactionHash() != null && !request.getTransactionHash().trim().isEmpty()
                ? request.getTransactionHash().trim()
                : generateSimulatedTxHash();

        if (transactionRepository.existsByTransactionHash(txHash)) {
            throw new IllegalArgumentException("Duplicate transaction hash: " + txHash);
        }

        // Update vault
        vault.setTotalAssets(vault.getTotalAssets().subtract(assetsToReturn));
        vault.setTotalShares(vault.getTotalShares().subtract(sharesToBurn));
        vaultRepository.save(vault);

        // Update position
        position.setShares(position.getShares().subtract(sharesToBurn));
        BigDecimal remainingDeposited = position.getDepositedAssets().subtract(assetsToReturn);
        position.setDepositedAssets(remainingDeposited.compareTo(BigDecimal.ZERO) > 0 ? remainingDeposited : BigDecimal.ZERO);
        positionRepository.save(position);

        // Record transaction
        VaultTransaction tx = VaultTransaction.builder()
                .vault(vault)
                .walletAddress(normalizedAddress)
                .transactionType("WITHDRAW")
                .assetAmount(assetsToReturn)
                .shareAmount(sharesToBurn)
                .transactionHash(txHash)
                .status("SIMULATED")
                .source("SIMULATED")
                .createdAt(LocalDateTime.now())
                .build();

        VaultTransaction saved = transactionRepository.save(tx);
        return mapToTransactionResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getTransactions() {
        return transactionRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToTransactionResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getTransactionsByWallet(String walletAddress) {
        if (walletAddress == null || walletAddress.trim().isEmpty()) {
            return List.of();
        }
        String normalized = walletAddress.trim().toLowerCase();
        return transactionRepository.findByWalletAddressOrderByCreatedAtDesc(normalized).stream()
                .map(this::mapToTransactionResponse)
                .collect(Collectors.toList());
    }

    // Compatibility methods for frontend
    @Transactional
    public VaultTransaction deposit(TransactionRequest request) {
        double amt = request.getAmount() != null ? request.getAmount() : 0.0;
        DepositRequest depReq = new DepositRequest("0x1234567890abcdef1234567890abcdef12345678", BigDecimal.valueOf(amt));
        simulateDeposit(depReq);
        return transactionRepository.findAllByOrderByCreatedAtDesc().get(0);
    }

    @Transactional
    public VaultTransaction withdraw(TransactionRequest request) {
        double amt = request.getAmount() != null ? request.getAmount() : 0.0;
        WithdrawalRequest wReq = new WithdrawalRequest("0x1234567890abcdef1234567890abcdef12345678", BigDecimal.valueOf(amt));
        simulateWithdraw(wReq);
        return transactionRepository.findAllByOrderByCreatedAtDesc().get(0);
    }

    private BigDecimal calculateVaultApy() {
        List<Strategy> activeStrategies = strategyRepository.findAll().stream()
                .filter(Strategy::isActive)
                .toList();

        if (activeStrategies.isEmpty()) {
            return BigDecimal.valueOf(7.25);
        }

        double weightedApySum = 0.0;
        double totalWeight = 0.0;
        for (Strategy s : activeStrategies) {
            double weight = s.getAllocationPercentage() > 0 ? s.getAllocationPercentage() : 1.0;
            weightedApySum += (s.getCurrentApy() * weight);
            totalWeight += weight;
        }

        if (totalWeight <= 0) return BigDecimal.valueOf(7.25);
        double apy = weightedApySum / totalWeight;
        return BigDecimal.valueOf(apy).setScale(2, RoundingMode.HALF_UP);
    }

    private String generateSimulatedTxHash() {
        return "0x" + UUID.randomUUID().toString().replace("-", "").substring(0, 32);
    }

    private TransactionResponse mapToTransactionResponse(VaultTransaction tx) {
        return TransactionResponse.builder()
                .transactionId(tx.getId())
                .vaultId(tx.getVaultId())
                .walletAddress(tx.getWalletAddress())
                .assetAmount(tx.getAssetAmount())
                .shareAmount(tx.getShareAmount())
                .transactionType(tx.getTransactionType())
                .status(tx.getStatus())
                .source(tx.getSource())
                .transactionHash(tx.getTransactionHash())
                .createdAt(tx.getCreatedAt())
                .build();
    }
}