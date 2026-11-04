package com.yieldpilot.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/volatility")
@CrossOrigin(origins = "*")
public class VolatilityController {

    @GetMapping("/current")
    public ResponseEntity<Map<String, Object>> getVolatility() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("asset", "USDC");
        response.put("sampleVolatilitySigma", 0.00042); // 0.042%
        response.put("annualizedVolatilityPercent", 0.80);
        response.put("maxDeviationThresholdBps", 200); // 2%
        response.put("currentDeviationBps", 1); // 0.01%
        response.put("isVolatilityFlagged", false);
        response.put("status", "NORMAL");
        response.put("timestamp", System.currentTimeMillis());

        return ResponseEntity.ok(response);
    }
}
