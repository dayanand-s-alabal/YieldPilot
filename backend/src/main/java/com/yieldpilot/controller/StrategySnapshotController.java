package com.yieldpilot.controller;

import com.yieldpilot.dto.SnapshotRequest;
import com.yieldpilot.dto.SnapshotResponse;
import com.yieldpilot.dto.StrategyPerformanceResponse;
import com.yieldpilot.service.StrategySnapshotService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;

@RestController
@RequestMapping("/api/v1/strategies")
@CrossOrigin(origins = "*")
public class StrategySnapshotController {

    private final StrategySnapshotService snapshotService;

    public StrategySnapshotController(StrategySnapshotService snapshotService) {
        this.snapshotService = snapshotService;
    }

    @PostMapping("/{id}/snapshots")
    public ResponseEntity<SnapshotResponse> createSnapshot(@PathVariable Long id,
                                                           @Valid @RequestBody SnapshotRequest request) {
        return new ResponseEntity<>(snapshotService.createSnapshot(id, request), HttpStatus.CREATED);
    }

    @GetMapping("/{id}/snapshots")
    public ResponseEntity<Page<SnapshotResponse>> getSnapshots(
            @PathVariable Long id,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "recordedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        LocalDateTime fromDate = parseDateTime(from, false);
        LocalDateTime toDate = parseDateTime(to, true);

        Sort sort = "asc".equalsIgnoreCase(direction) ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(snapshotService.getSnapshots(id, fromDate, toDate, pageable));
    }

    @GetMapping("/{id}/snapshots/latest")
    public ResponseEntity<SnapshotResponse> getLatestSnapshot(@PathVariable Long id) {
        return ResponseEntity.ok(snapshotService.getLatestSnapshot(id));
    }

    @GetMapping("/{id}/performance")
    public ResponseEntity<StrategyPerformanceResponse> getStrategyPerformance(
            @PathVariable Long id,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {

        LocalDateTime fromDate = parseDateTime(from, false);
        LocalDateTime toDate = parseDateTime(to, true);

        return ResponseEntity.ok(snapshotService.getStrategyPerformance(id, fromDate, toDate));
    }

    private LocalDateTime parseDateTime(String text, boolean endOfDay) {
        if (text == null || text.trim().isEmpty()) {
            return null;
        }
        String clean = text.trim();
        try {
            return LocalDateTime.parse(clean);
        } catch (DateTimeParseException e1) {
            try {
                LocalDate date = LocalDate.parse(clean);
                return endOfDay ? date.atTime(23, 59, 59) : date.atStartOfDay();
            } catch (DateTimeParseException e2) {
                return null;
            }
        }
    }
}
