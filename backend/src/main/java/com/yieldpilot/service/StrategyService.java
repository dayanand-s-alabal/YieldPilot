package com.yieldpilot.service;

import com.yieldpilot.dto.StrategyResponse;
import com.yieldpilot.entity.Strategy;
import com.yieldpilot.exception.ResourceNotFoundException;
import com.yieldpilot.repository.StrategyRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class StrategyService {
    private final StrategyRepository strategyRepository;

    public StrategyService(StrategyRepository strategyRepository) {
        this.strategyRepository = strategyRepository;
    }

    public List<StrategyResponse> getAllStrategies() {
        return strategyRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public StrategyResponse getStrategyById(Long id) {
        Strategy strategy = strategyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Strategy not found with ID: " + id));
        return mapToDto(strategy);
    }

    public StrategyResponse createStrategy(Strategy strategy) {
        Strategy saved = strategyRepository.save(strategy);
        return mapToDto(saved);
    }

    public StrategyResponse toggleStrategyStatus(Long id) {
        Strategy strategy = strategyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Strategy not found with ID: " + id));
        boolean nowActive = !strategy.isActive();
        strategy.setActive(nowActive);
        return mapToDto(strategyRepository.save(strategy));
    }

    public StrategyResponse mapToDto(Strategy strategy) {
        return StrategyResponse.builder()
                .id(strategy.getId())
                .name(strategy.getName())
                .strategyType(strategy.getStrategyType())
                .riskScore(strategy.getRiskScore())
                .riskLevel(strategy.getRiskLevel())
                .currentApy(strategy.getCurrentApy())
                .allocationPercentage(strategy.getAllocationPercentage())
                .allocationCapPercent(strategy.getAllocationCapPercent())
                .liquidityAvailable(strategy.getLiquidityAvailable())
                .status(strategy.getStatus())
                .active(strategy.getActive())
                .build();
    }
}