package com.yieldpilot.rebalancing;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class RiskScoringService {

    /**
     * Calculates risk-adjusted score: S_i = APY_i / (1 + lambda * R_i)
     *
     * @param apy Strategy APY (e.g., 7.0 for 7%)
     * @param riskScore Risk score from 1 to 5
     * @param lambda Risk aversion parameter (e.g. 0.5)
     * @return Risk-adjusted score
     */
    public double calculateScore(double apy, int riskScore, double lambda) {
        if (apy <= 0.0) return 0.0;
        int boundedRisk = Math.max(1, Math.min(5, riskScore));
        double denominator = 1.0 + (lambda * boundedRisk);
        if (denominator <= 0.0) return 0.0;
        double score = apy / denominator;
        return BigDecimal.valueOf(score).setScale(4, RoundingMode.HALF_UP).doubleValue();
    }
}
