package com.yieldpilot.controller;

import com.yieldpilot.dto.StrategyResponse;
import com.yieldpilot.entity.Strategy;
import com.yieldpilot.service.StrategyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/strategies")
@CrossOrigin(origins = "*")
public class StrategyController {

    private final StrategyService strategyService;

    public StrategyController(StrategyService strategyService) {
        this.strategyService = strategyService;
    }

    @GetMapping
    public ResponseEntity<List<StrategyResponse>> getAllStrategies() {
        return ResponseEntity.ok(strategyService.getAllStrategies());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StrategyResponse> getStrategyById(@PathVariable Long id) {
        return ResponseEntity.ok(strategyService.getStrategyById(id));
    }

    @PostMapping
    public ResponseEntity<StrategyResponse> createStrategy(@Valid @RequestBody Strategy strategy) {
        return new ResponseEntity<>(strategyService.createStrategy(strategy), HttpStatus.CREATED);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<StrategyResponse> toggleStrategyStatus(@PathVariable Long id) {
        return ResponseEntity.ok(strategyService.toggleStrategyStatus(id));
    }
}