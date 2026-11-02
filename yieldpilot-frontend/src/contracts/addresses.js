// Sepolia Deployed Contract Addresses
export const SEPOLIA_CHAIN_ID = 11155111;

export const CONTRACT_ADDRESSES = {
  chainId: SEPOLIA_CHAIN_ID,
  network: 'sepolia',
  deployer: '0x13400cac2d5190f9b68e135a63e79dcefb8c904a',
  MockUSDC: '0xc6564a37e63f64c67ceec6ed9b316aba2412d560',
  StrategyManager: '0x45bbf9eb0ca86cc2b8e401eb563a6a7d5c198638',
  MockStrategy: '0x31496ee5524923efe196709bee47b9d10c30293f',
  YieldVault: '0x8048009d01f88a449206af1ec79d49938e21b4ed',
  configuration: {
    reserveBps: 1000,
    strategyAllocationCapBps: 5000,
  },
};
