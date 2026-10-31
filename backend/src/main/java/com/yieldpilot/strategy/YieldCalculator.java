package com.yieldpilot.strategy;

import org.springframework.stereotype.Component;

@Component
public class YieldCalculator {
    public Double computeCompoundApy(Double baseApy, Double rewardApy) {
        return baseApy + (rewardApy * 0.95); // Compounding efficiency calculation
    }
}