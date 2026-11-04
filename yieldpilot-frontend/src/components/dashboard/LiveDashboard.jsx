import { useState } from 'react';
import { 
  Sparkles, 
  ArrowUpRight, 
  Wallet, 
  PieChart, 
  Coins, 
  TrendingUp, 
  Layers, 
  RefreshCw, 
  ExternalLink,
  ShieldCheck,
  Gift,
  Zap,
  ArrowRight
} from 'lucide-react';
import { CONTRACT_ADDRESSES } from '../../contracts/addresses';
import { getEtherscanAddressUrl, truncateAddress } from '../../contracts/utils';

export function LiveDashboard({
  blockchainData,
  txManager,
  setActiveTab,
}) {
  const {
    address,
    isConnected,
    vaultTotalAssetsFormatted,
    vaultTotalSupplyFormatted,
    userUSDCBalanceFormatted,
    userSharesFormatted,
    userRedeemableAssetsFormatted,
    shareValueFormatted,
    strategyTotalAssetsFormatted,
    strategyAllocPct,
    isStrategyRegistered,
    isStrategyPaused,
    managerLiquidFormatted,
    assetsVaultFormatted,
    assetsManagerFormatted,
    assetsStrategyFormatted,
    distribution,
    reserveBpsNumber,
    strategyCapBpsNumber,
    isUSDCOwner,
    isLoading,
    refetch,
    rebalance,
    oracle,
    apy,
    risk,
    volatility,
  } = blockchainData;

  const [mintAmount, setMintAmount] = useState('1000');
  const [mintAddress, setMintAddress] = useState('');
  const [minting, setMinting] = useState(false);

  const handleMintTestTokens = async (e) => {
    e.preventDefault();
    if (!mintAmount || Number(mintAmount) <= 0) return;
    setMinting(true);
    try {
      const recipient = mintAddress.trim() || address;
      await txManager.mintTokens(recipient, mintAmount);
      await refetch();
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 rounded-3xl shadow-2xl border border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sepolia Testnet · Chain ID: 11155111</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">YieldPilot Protocol Dashboard</h2>
          <p className="text-slate-300 text-sm max-w-xl font-medium">
            Live on-chain metrics directly queried from Sepolia smart contracts: YieldVault, StrategyManager, MockUSDC & MockStrategy.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-4 z-10 w-full lg:w-auto items-stretch">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex-1 sm:w-56">
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium mb-1">
              <span>Total Vault Assets (TVL)</span>
              <button onClick={() => refetch()} className="hover:text-white transition-colors" title="Refresh on-chain data">
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>
            <p className="text-2xl font-bold text-white">${vaultTotalAssetsFormatted} USDC</p>
            <div className="flex items-center text-xs text-emerald-400 mt-1 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              <span>Verified On-Chain</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex-1 sm:w-56">
            <p className="text-xs text-slate-300 font-medium mb-1">Your Redeemable Value</p>
            <p className="text-2xl font-bold text-white">${userRedeemableAssetsFormatted} USDC</p>
            <div className="flex items-center text-xs text-indigo-300 mt-1 font-semibold">
              <PieChart className="w-3.5 h-3.5 mr-1" />
              <span>{userSharesFormatted} ypSHARE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Protocol Automation Quick Status Bar */}
      {rebalance && oracle && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-4 rounded-2xl border border-slate-700/60 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-300">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-semibold text-white">Chainlink Price Feed:</span>
              <span className="font-mono font-bold text-emerald-400">${oracle.chainlinkPriceUSD.toFixed(4)} USDC/USD</span>
              <span className="text-[10px] text-slate-400 font-medium">({oracle.feedFreshnessSeconds}s ago)</span>
            </div>
            <div className="hidden sm:block text-slate-600">|</div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white">DeFi Blended APY:</span>
              <span className="font-mono font-bold text-purple-400">{apy?.blendedApy || '5.10'}%</span>
              <span className="text-[10px] text-slate-400 font-medium">(Risk: 28/100)</span>
            </div>
            <div className="hidden sm:block text-slate-600">|</div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white">Rebalance Engine:</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                rebalance.isRebalanceRequired ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {rebalance.isRebalanceRequired ? 'Rebalance Needed' : 'Optimal Allocation'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('rebalancing')}
            className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold rounded-xl flex items-center gap-1.5 transition whitespace-nowrap border border-emerald-500/30"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Manage Rebalancing</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Wallet USDC Balance</span>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">${userUSDCBalanceFormatted}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">MockUSDC in your connected wallet</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Your Vault Shares</span>
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{userSharesFormatted}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">ypSHARE (ERC4626 vault share tokens)</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Share Ratio / Value</span>
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{shareValueFormatted} USDC</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Per 1.0000 ypSHARE</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Total Share Supply</span>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{vaultTotalSupplyFormatted}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total circulating ypSHARE tokens</p>
        </div>
      </div>

      {/* Portfolio Distribution & Strategy Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Distribution Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Portfolio Distribution</h3>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">Live On-Chain</span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Manager Liquidity Reserve</span>
                  <span className="font-bold text-slate-900 dark:text-white">${assetsManagerFormatted} ({distribution.managerPct}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(Number(distribution.managerPct), 4)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Active Strategy Allocation</span>
                  <span className="font-bold text-slate-900 dark:text-white">${assetsStrategyFormatted} ({distribution.strategyPct}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(Number(distribution.strategyPct), 4)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Vault Buffer (Direct)</span>
                  <span className="font-bold text-slate-900 dark:text-white">${assetsVaultFormatted} ({distribution.vaultPct}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(Number(distribution.vaultPct), 4)}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 font-medium flex justify-between items-center">
            <span>Minimum Liquid Reserve</span>
            <span className="font-bold text-slate-900 dark:text-white">{reserveBpsNumber}%</span>
          </div>
        </div>

        {/* Strategy Status Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Deployed Strategy Status</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">MockStrategy managed by StrategyManager on Sepolia</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                isStrategyRegistered && !isStrategyPaused
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
              }`}>
                {isStrategyRegistered ? (!isStrategyPaused ? 'Registered & Active' : 'Paused') : 'Not Registered'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1">Strategy Assets</p>
                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">${strategyTotalAssetsFormatted} USDC</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{strategyAllocPct}% of portfolio</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1">Allocation Cap</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{strategyCapBpsNumber}%</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Maximum permitted cap</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1">Manager Liquid USDC</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">${managerLiquidFormatted}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Available for allocation</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800/60 font-mono text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400 font-medium">YieldVault:</span>
                <a href={getEtherscanAddressUrl(CONTRACT_ADDRESSES.YieldVault)} target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center font-bold">
                  <span>{truncateAddress(CONTRACT_ADDRESSES.YieldVault)}</span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400 font-medium">StrategyManager:</span>
                <a href={getEtherscanAddressUrl(CONTRACT_ADDRESSES.StrategyManager)} target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center font-bold">
                  <span>{truncateAddress(CONTRACT_ADDRESSES.StrategyManager)}</span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400 font-medium">MockStrategy:</span>
                <a href={getEtherscanAddressUrl(CONTRACT_ADDRESSES.MockStrategy)} target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center font-bold">
                  <span>{truncateAddress(CONTRACT_ADDRESSES.MockStrategy)}</span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('strategies')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center"
            >
              <span>Manage Strategy Allocations</span>
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Mint Test Tokens & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mint MockUSDC Box */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-500">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-md text-slate-900 dark:text-white">Mint Test MockUSDC</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Acquire test tokens on Sepolia to test deposits and yield</p>
            </div>
          </div>

          <form onSubmit={handleMintTestTokens} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Recipient Address (defaults to connected wallet)
              </label>
              <input
                type="text"
                placeholder={address || '0x...'}
                value={mintAddress}
                onChange={(e) => setMintAddress(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs font-mono border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="flex space-x-3">
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Amount"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700"
                />
              </div>
              <button
                type="submit"
                disabled={minting || txManager.isPending || !isConnected}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center space-x-1.5 disabled:opacity-50"
              >
                {minting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                <span>Mint USDC</span>
              </button>
            </div>

            {!isUSDCOwner && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                Note: MockUSDC minting is restricted to the contract owner ({truncateAddress(CONTRACT_ADDRESSES.deployer)}).
              </p>
            )}
          </form>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-md text-slate-900 dark:text-white mb-2">Protocol Quick Actions</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4">Jump directly into contract interactions</p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setActiveTab('deposit')}
                className="p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-600/20"
              >
                <Wallet className="w-4 h-4" />
                <span>Deposit USDC</span>
              </button>

              <button
                onClick={() => setActiveTab('deposit')}
                className="p-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 transition-all border border-slate-200 dark:border-slate-700"
              >
                <Coins className="w-4 h-4" />
                <span>Withdraw Assets</span>
              </button>

              <button
                onClick={() => setActiveTab('strategies')}
                className="p-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 transition-all border border-slate-200 dark:border-slate-700"
              >
                <Layers className="w-4 h-4" />
                <span>Strategy Allocations</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className="p-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 transition-all border border-slate-200 dark:border-slate-700"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Transaction Log</span>
              </button>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium">
            Connected as <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{truncateAddress(address) || 'Guest'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
