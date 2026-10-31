package com.yieldpilot.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public class WithdrawalRequest {

    @NotBlank(message = "Wallet address is required")
    private String walletAddress;

    @DecimalMin(value = "0.000000000000000001", message = "Withdrawal amount must be greater than zero")
    private BigDecimal amount;

    @DecimalMin(value = "0.000000000000000001", message = "Withdrawal shares must be greater than zero")
    private BigDecimal shares;

    private String transactionHash;

    public WithdrawalRequest() {
    }

    public WithdrawalRequest(String walletAddress, BigDecimal amount) {
        this.walletAddress = walletAddress;
        this.amount = amount;
    }

    public WithdrawalRequest(String walletAddress, BigDecimal amount, BigDecimal shares, String transactionHash) {
        this.walletAddress = walletAddress;
        this.amount = amount;
        this.shares = shares;
        this.transactionHash = transactionHash;
    }

    public String getWalletAddress() {
        return walletAddress;
    }

    public void setWalletAddress(String walletAddress) {
        this.walletAddress = walletAddress;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getShares() {
        return shares;
    }

    public void setShares(BigDecimal shares) {
        this.shares = shares;
    }

    public String getTransactionHash() {
        return transactionHash;
    }

    public void setTransactionHash(String transactionHash) {
        this.transactionHash = transactionHash;
    }
}
