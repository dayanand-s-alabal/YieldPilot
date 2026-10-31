package com.yieldpilot.dto;

public class TransactionRequest {
    private Double amount;
    private String asset;

    public TransactionRequest() {
    }

    public TransactionRequest(Double amount, String asset) {
        this.amount = amount;
        this.asset = asset;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public String getAsset() {
        return asset;
    }

    public void setAsset(String asset) {
        this.asset = asset;
    }
}
