CREATE TABLE IF NOT EXISTS strategy_snapshots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    strategy_id BIGINT NOT NULL,
    apy DECIMAL(10, 4) NOT NULL,
    risk_score INT NOT NULL,
    available_liquidity DECIMAL(38, 18) NOT NULL,
    total_allocated DECIMAL(38, 18) NOT NULL,
    recorded_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_snapshot_strategy FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE
);

CREATE INDEX idx_snapshot_strategy_date ON strategy_snapshots(strategy_id, recorded_at);
