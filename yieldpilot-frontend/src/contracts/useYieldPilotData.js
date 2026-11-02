import { useMemo } from 'react';
import { useAccount, useReadContracts, useChainId } from 'wagmi';
import { contracts, CONTRACT_ADDRESSES, SEPOLIA_CHAIN_ID } from './index';
import { formatUSDC, formatShares } from './utils';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export function useYieldPilotData() {
  const { address, isConnected, isConnecting } = useAccount();
  const chainId = useChainId();
  const isSepolia = chainId === SEPOLIA_CHAIN_ID;
  const effectiveUserAddress = address || ZERO_ADDRESS;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useReadContracts({
    contracts: [
      // 0: MockUSDC balance of user
      {
        ...contracts.mockUSDC,
        functionName: 'balanceOf',
        args: [effectiveUserAddress],
      },
      // 1: MockUSDC allowance to YieldVault
      {
        ...contracts.mockUSDC,
        functionName: 'allowance',
        args: [effectiveUserAddress, CONTRACT_ADDRESSES.YieldVault],
      },
      // 2: YieldVault totalAssets
      {
        ...contracts.yieldVault,
        functionName: 'totalAssets',
      },
      // 3: YieldVault totalSupply
      {
        ...contracts.yieldVault,
        functionName: 'totalSupply',
      },
      // 4: YieldVault user share balance
      {
        ...contracts.yieldVault,
        functionName: 'balanceOf',
        args: [effectiveUserAddress],
      },
      // 5: YieldVault convertToAssets (for 1 share = 1,000,000 units / 6 decimals)
      {
        ...contracts.yieldVault,
        functionName: 'convertToAssets',
        args: [1000000n],
      },
      // 6: YieldVault owner
      {
        ...contracts.yieldVault,
        functionName: 'owner',
      },
      // 7: MockUSDC owner
      {
        ...contracts.mockUSDC,
        functionName: 'owner',
      },
      // 8: StrategyManager isRegistered(MockStrategy)
      {
        ...contracts.strategyManager,
        functionName: 'isRegistered',
        args: [CONTRACT_ADDRESSES.MockStrategy],
      },
      // 9: StrategyManager isStrategyPaused(MockStrategy)
      {
        ...contracts.strategyManager,
        functionName: 'isStrategyPaused',
        args: [CONTRACT_ADDRESSES.MockStrategy],
      },
      // 10: StrategyManager reserveBps
      {
        ...contracts.strategyManager,
        functionName: 'reserveBps',
      },
      // 11: StrategyManager allocationCapBps(MockStrategy)
      {
        ...contracts.strategyManager,
        functionName: 'allocationCapBps',
        args: [CONTRACT_ADDRESSES.MockStrategy],
      },
      // 12: StrategyManager totalManagedAssets
      {
        ...contracts.strategyManager,
        functionName: 'totalManagedAssets',
      },
      // 13: MockStrategy totalAssets
      {
        ...contracts.mockStrategy,
        functionName: 'totalAssets',
      },
      // 14: MockUSDC balance of StrategyManager (Available liquid assets)
      {
        ...contracts.mockUSDC,
        functionName: 'balanceOf',
        args: [CONTRACT_ADDRESSES.StrategyManager],
      },
      // 15: MockUSDC balance of YieldVault (Direct vault buffer)
      {
        ...contracts.mockUSDC,
        functionName: 'balanceOf',
        args: [CONTRACT_ADDRESSES.YieldVault],
      },
      // 16: StrategyManager owner
      {
        ...contracts.strategyManager,
        functionName: 'owner',
      },
    ],
    query: {
      enabled: isSepolia,
      refetchInterval: 10000, // auto refetch every 10s
    },
  });

  const parsedData = useMemo(() => {
    const raw = {
      userUSDCBalance: data?.[0]?.result ?? 0n,
      userAllowance: data?.[1]?.result ?? 0n,
      vaultTotalAssets: data?.[2]?.result ?? 0n,
      vaultTotalSupply: data?.[3]?.result ?? 0n,
      userShares: data?.[4]?.result ?? 0n,
      sharePriceRaw: data?.[5]?.result ?? 1000000n,
      vaultOwner: data?.[6]?.result ?? null,
      usdcOwner: data?.[7]?.result ?? null,
      isStrategyRegistered: data?.[8]?.result ?? false,
      isStrategyPaused: data?.[9]?.result ?? false,
      reserveBps: data?.[10]?.result ?? 1000n,
      strategyAllocationCapBps: data?.[11]?.result ?? 5000n,
      totalManagedAssets: data?.[12]?.result ?? 0n,
      strategyTotalAssets: data?.[13]?.result ?? 0n,
      managerLiquidBalance: data?.[14]?.result ?? 0n,
      vaultDirectBalance: data?.[15]?.result ?? 0n,
      managerOwner: data?.[16]?.result ?? null,
    };

    // User redeemable assets: convert user shares to assets
    let userRedeemableAssets = 0n;
    if (raw.userShares > 0n && raw.vaultTotalSupply > 0n) {
      userRedeemableAssets = (raw.userShares * raw.vaultTotalAssets) / raw.vaultTotalSupply;
    }

    // Share value in USD (1 share = 1 USDC base)
    const shareValueNum = raw.vaultTotalSupply > 0n 
      ? Number(raw.vaultTotalAssets) / Number(raw.vaultTotalSupply)
      : 1.0;

    // Portfolio metrics
    const totalPortfolio = raw.vaultTotalAssets;
    const assetsManager = raw.managerLiquidBalance;
    const assetsStrategy = raw.strategyTotalAssets;
    const assetsVault = raw.vaultDirectBalance;

    // Percentages
    const calcPct = (part) => {
      if (totalPortfolio === 0n) return 0;
      return ((Number(part) / Number(totalPortfolio)) * 100).toFixed(1);
    };

    const isVaultOwner = Boolean(
      address && raw.vaultOwner && address.toLowerCase() === raw.vaultOwner.toLowerCase()
    );
    const isUSDCOwner = Boolean(
      address && raw.usdcOwner && address.toLowerCase() === raw.usdcOwner.toLowerCase()
    );

    // Strategy allocation percentage
    const strategyAllocPct = totalPortfolio > 0n
      ? ((Number(assetsStrategy) / Number(totalPortfolio)) * 100).toFixed(1)
      : '0.0';

    return {
      raw,
      // Wallet
      address,
      isConnected,
      isConnecting,
      isSepolia,
      chainId,
      isVaultOwner,
      isUSDCOwner,
      userUSDCBalanceFormatted: formatUSDC(raw.userUSDCBalance),
      userAllowanceFormatted: formatUSDC(raw.userAllowance),
      userSharesFormatted: formatShares(raw.userShares),
      userRedeemableAssetsFormatted: formatUSDC(userRedeemableAssets),

      // Vault
      vaultTotalAssetsFormatted: formatUSDC(raw.vaultTotalAssets),
      vaultTotalSupplyFormatted: formatShares(raw.vaultTotalSupply),
      shareValueFormatted: shareValueNum.toFixed(4),

      // Strategy
      strategyTotalAssetsFormatted: formatUSDC(assetsStrategy),
      strategyAllocPct,
      isStrategyRegistered: raw.isStrategyRegistered,
      isStrategyPaused: raw.isStrategyPaused,
      managerLiquidFormatted: formatUSDC(assetsManager),
      reserveBpsNumber: Number(raw.reserveBps) / 100, // in %
      strategyCapBpsNumber: Number(raw.strategyAllocationCapBps) / 100, // in %

      // Portfolio
      portfolioTotalFormatted: formatUSDC(totalPortfolio),
      assetsVaultFormatted: formatUSDC(assetsVault),
      assetsManagerFormatted: formatUSDC(assetsManager),
      assetsStrategyFormatted: formatUSDC(assetsStrategy),
      distribution: {
        vaultPct: calcPct(assetsVault),
        managerPct: calcPct(assetsManager),
        strategyPct: calcPct(assetsStrategy),
      },
    };
  }, [data, address, isConnected, isConnecting, isSepolia, chainId]);

  return {
    ...parsedData,
    isLoading,
    isError,
    error,
    refetch,
  };
}
