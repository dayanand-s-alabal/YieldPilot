import MockUSDCAbi from './abis/MockUSDC.json';
import YieldVaultAbi from './abis/YieldVault.json';
import StrategyManagerAbi from './abis/StrategyManager.json';
import MockStrategyAbi from './abis/MockStrategy.json';
import RebalanceManagerAbi from './abis/RebalanceManager.json';
import RiskManagerAbi from './abis/RiskManager.json';
import PriceOracleAbi from './abis/PriceOracle.json';
import { CONTRACT_ADDRESSES, SEPOLIA_CHAIN_ID } from './addresses';

export {
  MockUSDCAbi,
  YieldVaultAbi,
  StrategyManagerAbi,
  MockStrategyAbi,
  RebalanceManagerAbi,
  RiskManagerAbi,
  PriceOracleAbi,
  CONTRACT_ADDRESSES,
  SEPOLIA_CHAIN_ID,
};

export const contracts = {
  mockUSDC: {
    address: CONTRACT_ADDRESSES.MockUSDC,
    abi: MockUSDCAbi,
  },
  yieldVault: {
    address: CONTRACT_ADDRESSES.YieldVault,
    abi: YieldVaultAbi,
  },
  strategyManager: {
    address: CONTRACT_ADDRESSES.StrategyManager,
    abi: StrategyManagerAbi,
  },
  mockStrategy: {
    address: CONTRACT_ADDRESSES.MockStrategy,
    abi: MockStrategyAbi,
  },
  rebalanceManager: {
    address: CONTRACT_ADDRESSES.RebalanceManager,
    abi: RebalanceManagerAbi,
  },
  riskManager: {
    address: CONTRACT_ADDRESSES.RiskManager,
    abi: RiskManagerAbi,
  },
  priceOracle: {
    address: CONTRACT_ADDRESSES.PriceOracle,
    abi: PriceOracleAbi,
  },
};
