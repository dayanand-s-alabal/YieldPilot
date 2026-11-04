// Sepolia Deployed Contract Addresses & Modules Configuration
export const SEPOLIA_CHAIN_ID = 11155111;

export const CONTRACT_ADDRESSES = {
  chainId: SEPOLIA_CHAIN_ID,
  network: 'sepolia',
  deployer: '0x13400cac2d5190f9b68e135a63e79dcefb8c904a',

  // Core Base Contracts
  MockUSDC: '0xc6564a37e63f64c67ceec6ed9b316aba2412d560',
  StrategyManager: '0x45bbf9eb0ca86cc2b8e401eb563a6a7d5c198638',
  MockStrategy: '0x31496ee5524923efe196709bee47b9d10c30293f',
  YieldVault: '0x8048009d01f88a449206af1ec79d49938e21b4ed',

  // Automated Rebalance Engine & Chainlink Automation Keeper
  RebalanceManager: '0x9B113cE4e8C54b1d6fEcb45f7E4f676DeB07411B',

  // Chainlink Price Feed Oracle & Sepolia USDC/USD Aggregator
  PriceOracle: '0x3b85D73E67814b7f83E0062f447fFfF8d65C47c9',
  ChainlinkSepoliaUSDCFeed: '0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E',

  // Risk Manager & Scoring Engine
  RiskManager: '0x6A1A76b50e41B1F956f4d8a57eBe6d10f2258411',

  // Strategies Adapters (Aave & Compound)
  AaveStrategy: '0x5C9f72782A7Fe8429B4d11242337E64b5e28D8A2',
  CompoundStrategy: '0x7b8893Af48e3549fC05296839352c3A7025f8999',

  // System Configurations
  configuration: {
    reserveBps: 1000, // 10%
    strategyAllocationCapBps: 5000, // 50%
    rebalanceThresholdBps: 500, // 5%
    minRebalanceInterval: 3600, // 1 hour
    maxRiskScoreThreshold: 70, // 0-100 scale
    riskWeights: {
      volatility: 30, // 30%
      liquidity: 25,  // 25%
      protocol: 25,   // 25%
      withdrawal: 20, // 20%
    },
    protocols: {
      aave: {
        name: 'Aave V3',
        baseApy: 4.85,
        rewardApy: 0.25,
        riskScore: 22,
        riskLabel: 'Low',
      },
      compound: {
        name: 'Compound V3',
        baseApy: 5.30,
        rewardApy: 0.15,
        riskScore: 45,
        riskLabel: 'Medium',
      },
      mock: {
        name: 'MockStrategy (Alpha)',
        baseApy: 6.20,
        rewardApy: 0.00,
        riskScore: 30,
        riskLabel: 'Low-Medium',
      },
    },
  },
};
