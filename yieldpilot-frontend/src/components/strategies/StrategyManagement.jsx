import { useState } from 'react';
import { 
  Layers, 
  ExternalLink, 
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { CONTRACT_ADDRESSES } from '../../contracts/addresses';
import { getEtherscanAddressUrl, parseUSDC, truncateAddress } from '../../contracts/utils';

export function StrategyManagement({ blockchainData, txManager }) {
  const {
    strategyTotalAssetsFormatted,
    strategyAllocPct,
    managerLiquidFormatted,
    reserveBpsNumber,
    strategyCapBpsNumber,
    isStrategyRegistered,
    isStrategyPaused,
    isVaultOwner,
    isConnected,
    raw,
    refetch,
  } = blockchainData;

  const [selectedStrategy, setSelectedStrategy] = useState(CONTRACT_ADDRESSES.MockStrategy);
  const [allocateAmount, setAllocateAmount] = useState('');
  const [isAllocating, setIsAllocating] = useState(false);

  const handleAllocate = async (e) => {
    e.preventDefault();
    if (!allocateAmount || Number(allocateAmount) <= 0) return;
    const parsed = parseUSDC(allocateAmount);

    if (parsed > raw.managerLiquidBalance) {
      alert('Allocation exceeds available liquid manager assets');
      return;
    }

    setIsAllocating(true);
    try {
      await txManager.allocateToStrategy(selectedStrategy, allocateAmount);
      setAllocateAmount('');
      await refetch();
    } finally {
      setIsAllocating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Strategy & Portfolio Management</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
            Allocate managed funds across verified yield strategies via StrategyManager & YieldVault.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Strategies</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1">Strategy Balance</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">${strategyTotalAssetsFormatted} USDC</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{strategyAllocPct}% of total portfolio value</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1">Manager Liquid Buffer</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">${managerLiquidFormatted} USDC</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Unallocated liquidity held by manager</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1">Reserve & Cap Rules</p>
          <div className="flex justify-between text-xs font-bold text-slate-900 dark:text-white mt-1">
            <span>Min. Liquid Reserve:</span>
            <span>{reserveBpsNumber}%</span>
          </div>
          <div className="flex justify-between text-xs font-bold text-slate-900 dark:text-white mt-1">
            <span>Max Strategy Cap:</span>
            <span>{strategyCapBpsNumber}%</span>
          </div>
        </div>
      </div>

      {/* Main Strategy Card & Allocation Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* MockStrategy Details */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="flex justify-between items-start pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">Primary Strategy</span>
              <h3 className="font-bold text-xl text-slate-900 dark:text-white mt-2">MockStrategy (Sepolia)</h3>
              <a
                href={getEtherscanAddressUrl(CONTRACT_ADDRESSES.MockStrategy)}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center mt-1 font-bold"
              >
                <span>{CONTRACT_ADDRESSES.MockStrategy}</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              isStrategyRegistered && !isStrategyPaused
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
            }`}>
              {isStrategyRegistered ? (!isStrategyPaused ? 'Active' : 'Paused') : 'Unregistered'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Registration Status:</span>
              <span className="font-bold text-slate-900 dark:text-white">{isStrategyRegistered ? 'Registered in StrategyManager' : 'Not Registered'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Total Strategy Assets:</span>
              <span className="font-bold text-slate-900 dark:text-white">${strategyTotalAssetsFormatted} USDC</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Allocation Cap:</span>
              <span className="font-bold text-slate-900 dark:text-white">{strategyCapBpsNumber}% (5,000 bps)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Yield Generation:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">Simulated Yield Vault</span>
            </div>
          </div>
        </div>

        {/* Allocate to Strategy Action Form */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Allocate to Strategy</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
              Transfer funds from StrategyManager liquid reserves into MockStrategy via YieldVault.
            </p>
          </div>

          {/* Owner check banner */}
          <div className={`p-4 rounded-2xl border text-xs flex items-start space-x-3 ${
            isVaultOwner
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-300'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-300'
          }`}>
            {isVaultOwner ? (
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            )}
            <div>
              <p className="font-bold">
                {isVaultOwner ? 'Authorized Contract Owner' : 'Owner-Restricted Function'}
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed">
                {isVaultOwner
                  ? 'Your connected account is the YieldVault contract owner. You can allocate funds directly to strategies.'
                  : `YieldVault.allocateToStrategy() is restricted to the contract owner (${truncateAddress(raw.vaultOwner || CONTRACT_ADDRESSES.deployer)}). Non-owner transactions will revert.`}
              </p>
            </div>
          </div>

          <form onSubmit={handleAllocate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                Target Strategy Address
              </label>
              <input
                type="text"
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 rounded-xl font-mono text-xs border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-900 dark:text-white">Amount (USDC)</label>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Available: ${managerLiquidFormatted} USDC</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={allocateAmount}
                  onChange={(e) => setAllocateAmount(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3 rounded-xl font-bold text-base border border-slate-200 dark:border-slate-700"
                />
                <button
                  type="button"
                  onClick={() => setAllocateAmount((Number(raw.managerLiquidBalance) / 1e6).toString())}
                  className="absolute right-3 top-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-emerald-500/20"
                >
                  MAX
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAllocating || txManager.isPending || !allocateAmount || Number(allocateAmount) <= 0 || !isConnected}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isAllocating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting Strategy Allocation...</span>
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" />
                  <span>Execute Allocation to Strategy</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
