const API_BASE = 'http://localhost:8081/api/v1';

export const api = {
  // Health
  getHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  // Vault
  getVaultSummary: async () => {
    const res = await fetch(`${API_BASE}/vault/summary`);
    return res.json();
  },

  deposit: async (amount, asset = 'USDC') => {
    const res = await fetch(`${API_BASE}/vault/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(amount), asset })
    });
    return res.json();
  },

  withdraw: async (amount, asset = 'USDC') => {
    const res = await fetch(`${API_BASE}/vault/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(amount), asset })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Withdrawal failed' }));
      throw new Error(err.message || 'Withdrawal failed');
    }
    return res.json();
  },

  getTransactions: async () => {
    const res = await fetch(`${API_BASE}/vault/transactions`);
    return res.json();
  },

  // Strategies
  getStrategies: async () => {
    const res = await fetch(`${API_BASE}/strategies`);
    return res.json();
  },

  getStrategyById: async (id) => {
    const res = await fetch(`${API_BASE}/strategies/${id}`);
    return res.json();
  },

  createStrategy: async (strategy) => {
    const res = await fetch(`${API_BASE}/strategies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(strategy)
    });
    return res.json();
  },

  toggleStrategyStatus: async (id) => {
    const res = await fetch(`${API_BASE}/strategies/${id}/status`, {
      method: 'PUT'
    });
    return res.json();
  },

  // Rebalancing
  getProposals: async () => {
    const res = await fetch(`${API_BASE}/rebalance/proposals`);
    return res.json();
  },

  evaluateAllocation: async () => {
    const res = await fetch(`${API_BASE}/rebalance/evaluate`, {
      method: 'POST'
    });
    return res.json();
  },

  executeProposal: async (id) => {
    const res = await fetch(`${API_BASE}/rebalance/proposals/${id}/execute`, {
      method: 'POST'
    });
    return res.json();
  },

  // APY Data Collector
  getApyData: async () => {
    const res = await fetch(`${API_BASE}/apy/current`);
    return res.json();
  },

  // Risk Scoring
  getRiskScores: async () => {
    const res = await fetch(`${API_BASE}/risk/scores`);
    return res.json();
  },

  updateRiskScore: async (strategyId, components) => {
    const res = await fetch(`${API_BASE}/risk/scores/${strategyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(components)
    });
    return res.json();
  },

  // Volatility Monitoring
  getVolatilityMetrics: async () => {
    const res = await fetch(`${API_BASE}/volatility/current`);
    return res.json();
  },

  // Price Oracle
  getOraclePrices: async () => {
    const res = await fetch(`${API_BASE}/oracle/prices`);
    return res.json();
  },
};
