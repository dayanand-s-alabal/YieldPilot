CREATE TABLE IF NOT EXISTS rebalance_proposals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vault_id BIGINT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'GENERATED',
    total_assets DECIMAL(38, 18) NOT NULL DEFAULT 0,
    expected_net_benefit DECIMAL(38, 18) NOT NULL DEFAULT 0,
    estimated_cost DECIMAL(38, 18) NOT NULL DEFAULT 0,
    decision_reason TEXT NULL,
    description VARCHAR(255) NULL,
    reason TEXT NULL,
    risk_warning TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    approved_at TIMESTAMP NULL,
    executed_at TIMESTAMP NULL,
    CONSTRAINT fk_prop_vault FOREIGN KEY (vault_id) REFERENCES vaults(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS rebalance_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    proposal_id BIGINT NOT NULL,
    strategy_id BIGINT NOT NULL,
    current_allocation DECIMAL(38, 18) NOT NULL,
    target_allocation DECIMAL(38, 18) NOT NULL,
    amount_to_move DECIMAL(38, 18) NOT NULL,
    movement_direction VARCHAR(32) NOT NULL,
    CONSTRAINT fk_item_proposal FOREIGN KEY (proposal_id) REFERENCES rebalance_proposals(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_strategy FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE
);

CREATE INDEX idx_rebalance_prop_status ON rebalance_proposals(status);
