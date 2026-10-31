CREATE TABLE IF NOT EXISTS strategies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    strategy_type VARCHAR(100) DEFAULT 'Yield',
    risk_score INT DEFAULT 2,
    risk_level VARCHAR(255) DEFAULT 'Balanced',
    current_apy DOUBLE DEFAULT 5.0,
    allocation_percentage DOUBLE DEFAULT 0.0,
    allocation_cap_percent DOUBLE DEFAULT 40.0,
    liquidity_available DOUBLE DEFAULT 100000.0,
    status VARCHAR(255) DEFAULT 'Active',
    active BOOLEAN DEFAULT TRUE
);
