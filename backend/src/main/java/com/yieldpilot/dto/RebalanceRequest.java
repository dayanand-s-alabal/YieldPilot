package com.yieldpilot.dto;

public class RebalanceRequest {

    private Double riskAversion = 0.5; // lambda
    private Integer maxRiskScore = 4;
    private Integer evaluationHorizonDays = 30;
    private Double minDriftThresholdPercent = 2.0;

    public RebalanceRequest() {
    }

    public RebalanceRequest(Double riskAversion, Integer maxRiskScore, Integer evaluationHorizonDays, Double minDriftThresholdPercent) {
        this.riskAversion = riskAversion != null ? riskAversion : 0.5;
        this.maxRiskScore = maxRiskScore != null ? maxRiskScore : 4;
        this.evaluationHorizonDays = evaluationHorizonDays != null ? evaluationHorizonDays : 30;
        this.minDriftThresholdPercent = minDriftThresholdPercent != null ? minDriftThresholdPercent : 2.0;
    }

    public Double getRiskAversion() {
        return riskAversion != null ? riskAversion : 0.5;
    }

    public void setRiskAversion(Double riskAversion) {
        this.riskAversion = riskAversion;
    }

    public Integer getMaxRiskScore() {
        return maxRiskScore != null ? maxRiskScore : 4;
    }

    public void setMaxRiskScore(Integer maxRiskScore) {
        this.maxRiskScore = maxRiskScore;
    }

    public Integer getEvaluationHorizonDays() {
        return evaluationHorizonDays != null ? evaluationHorizonDays : 30;
    }

    public void setEvaluationHorizonDays(Integer evaluationHorizonDays) {
        this.evaluationHorizonDays = evaluationHorizonDays;
    }

    public Double getMinDriftThresholdPercent() {
        return minDriftThresholdPercent != null ? minDriftThresholdPercent : 2.0;
    }

    public void setMinDriftThresholdPercent(Double minDriftThresholdPercent) {
        this.minDriftThresholdPercent = minDriftThresholdPercent;
    }
}
