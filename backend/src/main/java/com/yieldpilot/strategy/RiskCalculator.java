package com.yieldpilot.strategy;

import org.springframework.stereotype.Component;

@Component
public class RiskCalculator {
    public String calculateRisk(Double volatility, Double liquidity) {
        if (liquidity > 500000 && volatility < 0.05) return "Low Risk";
        if (volatility < 0.15) return "Balanced";
        return "High Yield";
    }
}