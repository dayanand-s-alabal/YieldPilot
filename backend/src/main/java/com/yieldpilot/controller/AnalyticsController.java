package com.yieldpilot.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    @GetMapping("/performance")
    public ResponseEntity<Map<String, Object>> getPerformanceAnalytics() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("title", "Strategy performance — Illustrative data");
        response.put("disclaimer", "Illustrative cumulative strategy performance, not actual protocol data.");
        response.put("timestamp", System.currentTimeMillis());

        // Yield Earned Summary
        Map<String, Double> yieldEarned = new LinkedHashMap<>();
        yieldEarned.put("Aave", 124.50);
        yieldEarned.put("Compound", 98.20);
        yieldEarned.put("MockAlpha", 45.10);
        response.put("yieldEarned", yieldEarned);

        // 7-Day Performance Series
        List<Map<String, Object>> dailyPerformance = new ArrayList<>();
        double[][] cumulativeData = {
                {18.20, 12.40}, // Day 1
                {36.80, 25.90}, // Day 2
                {55.40, 41.20}, // Day 3
                {73.90, 56.50}, // Day 4
                {91.30, 71.80}, // Day 5
                {108.40, 85.10}, // Day 6
                {124.50, 98.20}  // Day 7
        };

        double[] aaveApy = {4.80, 4.85, 4.90, 4.88, 5.02, 5.10, 5.12};
        double[] compoundApy = {5.10, 5.25, 5.30, 5.28, 5.35, 5.42, 5.45};

        for (int day = 1; day <= 7; day++) {
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("day", "Day " + day);
            point.put("aaveCumulativeYield", cumulativeData[day - 1][0]);
            point.put("compoundCumulativeYield", cumulativeData[day - 1][1]);
            point.put("aaveApy", aaveApy[day - 1]);
            point.put("compoundApy", compoundApy[day - 1]);
            dailyPerformance.add(point);
        }
        response.put("dailyPerformance", dailyPerformance);

        // Strategy Breakdown Metrics
        Map<String, Object> strategies = new LinkedHashMap<>();

        Map<String, Object> aave = new LinkedHashMap<>();
        aave.put("protocol", "Aave V3");
        aave.put("yieldEarnedUSD", 124.50);
        aave.put("currentApyPercent", 5.12);
        aave.put("totalDepositsUSD", 15000.00);
        aave.put("totalWithdrawalsUSD", 4800.00);
        aave.put("activeBalanceUSD", 10324.50);
        aave.put("utilizationPercent", 74.5);
        aave.put("riskScore", 22);
        aave.put("currentAllocationPercent", 48.0);
        aave.put("status", "Active (Low Risk)");
        strategies.put("Aave", aave);

        Map<String, Object> compound = new LinkedHashMap<>();
        compound.put("protocol", "Compound V3");
        compound.put("yieldEarnedUSD", 98.20);
        compound.put("currentApyPercent", 5.45);
        compound.put("totalDepositsUSD", 12000.00);
        compound.put("totalWithdrawalsUSD", 3900.00);
        compound.put("activeBalanceUSD", 8198.20);
        compound.put("utilizationPercent", 68.2);
        compound.put("riskScore", 45);
        compound.put("currentAllocationPercent", 32.0);
        compound.put("status", "Active (Medium Risk)");
        strategies.put("Compound", compound);

        response.put("strategies", strategies);

        return ResponseEntity.ok(response);
    }
}
