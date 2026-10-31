package com.yieldpilot.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class DepositRequest {

    @NotBlank(message = "Wallet address is required")
    private String walletAddress;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.000000000000000001", message = "Deposit amount must be greater than zero")
    private BigDecimal amount;

    private String transactionHash;

    public DepositRequest() {
    }

    public DepositRequest(String walletAddress, BigDecimal amount) {
        this.walletAddress = walletAddress;
        this.amount = amount;
    }

    public DepositRequest(String walletAddress, BigDecimal amount, String transactionHash) {
        this.walletAddress = walletAddress;
        this.amount = amount;
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

    public String getTransactionHash() {
        return transactionHash;
    }

    public void setTransactionHash(String transactionHash) {
        this.transactionHash = transactionHash;
    }
}
