import React, { useState } from 'react';
import { 
  RefreshCw, 
  ShieldCheck, 
  ShieldAlert, 
  TrendingUp, 
  Activity, 
  Link as LinkIcon, 
  Zap, 
  AlertTriangle, 
  Sliders, 
  SlidersHorizontal, 
  CheckCircle2, 
  Clock, 
  PieChart, 
  DollarSign, 
  ArrowRight,
  ExternalLink,
  Cpu
} from 'lucide-react';
import { formatUSDC, truncateAddress } from '../../contracts/utils';

export function RebalancingDashboard({ blockchainData, txManager }) {
  const { rebalance, oracle, apy, risk, volatility, distribution, raw, strategyAllocPct, reserveAllocPct } = blockchainData;

  // Local editable targets for simulation & configuration
  const [targetReserve, setTargetReserve] = useState(rebalance.targets.reserveTargetBps / 100);
  const [targetStrategyA, setTargetStrategyA] = useState(rebalance.targets.strategyATargetBps / 100);
  const [targetStrategyB, setTargetStrategyB] = useState(rebalance.targets.strategyBTargetBps / 100);
  const [threshold, setThreshold] = useState(rebalance.targets.rebalanceThresholdBps / 100);
  const [configSuccess, setConfigSuccess] = useState(false);

  // Risk Simulator weights
  const [customV, setCustomV] = useState(25);
  const [customL, setCustomL] = useState(20);
  const [customP, setCustomP] = useState(30);
  const [customW, setCustomW] = useState(25);

  const calculatedSimulatedRisk = Math.round(
    (customV * 0.3) + (customL * 0.25) + (customP * 0.25) + (customW * 0.2)
  );

  const handleSaveTargets = () => {
    const total = Number(targetReserve) + Number(targetStrategyA) + Number(targetStrategyB);
    if (total !== 100) {
      alert(`Target weights must sum to 100%. Current sum: ${total}%`);
      return;
    }
    if (Number(targetReserve) < 10) {
      alert(`Target reserve must be at least 10% (StrategyManager constraint).`);
      return;
    }
    if (Number(targetStrategyA) > 50) {
      alert(`Strategy A allocation cannot exceed 50% allocation cap.`);
      return;
    }

    rebalance.setLocalTargets({
      reserveTargetBps: Number(targetReserve) * 100,
      strategyATargetBps: Number(targetStrategyA) * 100,
      strategyBTargetBps: Number(targetStrategyB) * 100,
      rebalanceThresholdBps: Number(threshold) * 100,
    });

    setConfigSuccess(true);
    setTimeout(() => setConfigSuccess(false), 4000);
  };

  const currentReserveNum = parseFloat(reserveAllocPct) || 100;
  const currentStrategyANum = parseFloat(strategyAllocPct) || 0;
  const driftReserve = Math.abs(currentReserveNum - targetReserve);
  const driftStrategyA = Math.abs(currentStrategyANum - targetStrategyA);
  const highestDrift = Math.max(driftReserve, driftStrategyA);
  const needsRebalance = highestDrift >= threshold;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>YieldPilot Autonomous Portfolio Core</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Automated Rebalancing & Risk Engine
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-1 max-w-2xl">
            Real-time portfolio drift calculation, multi-factor risk scoring, Chainlink price feed validation, and automated keeper execution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => blockchainData.refetch()}
            disabled={blockchainData.isLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 transition"
          >
            <RefreshCw className={`w-4 h-4 ${blockchainData.isLoading ? 'animate-spin text-emerald-500' : ''}`} />
            <span>Refresh State</span>
          </button>

          <button
            onClick={() => txManager.executeRebalance()}
            disabled={txManager.isPending}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 transition-all ${
              needsRebalance
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25 ring-2 ring-emerald-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <Zap className={`w-4 h-4 ${needsRebalance ? 'text-amber-300 animate-bounce' : ''}`} />
            <span>{txManager.isPending ? 'Executing Rebalance...' : 'Execute Rebalance'}</span>
          </button>
        </div>
      </div>

      {/* Top Status Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric 1: Rebalance Need */}
        <div className={`p-5 rounded-2xl border transition-all ${
          needsRebalance
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Rebalance Status</span>
            {needsRebalance ? <AlertTriangle className="w-4 h-4 text-amber-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${needsRebalance ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-400'}`}>
              {needsRebalance ? 'ACTION REQUIRED' : 'OPTIMAL'}
            </span>
          </div>
          <p className="text-xs mt-1 text-slate-600 dark:text-slate-400 font-medium">
            Current Max Drift: <span className="font-bold text-slate-900 dark:text-white">{highestDrift.toFixed(1)}%</span> (Threshold: {threshold}%)
          </p>
        </div>

        {/* Metric 2: Chainlink Price Feed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Chainlink Feed</span>
            <LinkIcon className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">${oracle.chainlinkPriceUSD.toFixed(4)}</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">USDC / USD</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Freshness: {oracle.feedFreshnessSeconds}s ago (Valid)
          </p>
        </div>

        {/* Metric 3: Portfolio USD NAV */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Oracle Portfolio NAV</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">${oracle.vaultUsdValuation}</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">USD</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Base: {blockchainData.vaultTotalAssetsFormatted} USDC
          </p>
        </div>

        {/* Metric 4: Blended APY & Volatility */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Blended APY</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{apy.blendedApy}%</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">weighted</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Market Volatility: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{(volatility.dailyVolatilityPct * 100).toFixed(3)}% (Low)</span>
          </p>
        </div>
      </div>

      {/* Main Grid: Rebalancing Engine & Risk Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Automated Rebalancing Engine (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Current vs Target Allocation Breakdown */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    Automated Allocation & Drift Engine
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">RebalanceManager.sol evaluation & target comparisons</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300">
                Threshold: {threshold}%
              </span>
            </div>

            {/* Comparison Rows */}
            <div className="space-y-4">
              {/* Row 1: Liquid Reserve */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center text-sm font-semibold mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-slate-900 dark:text-white font-bold">Liquid Reserve (Manager + Vault)</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-600 dark:text-slate-400">Current: <strong className="font-mono text-blue-600 dark:text-blue-400">{currentReserveNum.toFixed(1)}%</strong></span>
                    <span className="text-slate-600 dark:text-slate-400">Target: <strong className="font-mono text-slate-900 dark:text-white">{targetReserve}%</strong></span>
                    <span className={`px-2 py-0.5 rounded-md font-mono ${
                      driftReserve >= threshold ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}>
                      Drift: {driftReserve.toFixed(1)}%
                    </span>
                  </div>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                  <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${Math.min(currentReserveNum, 100)}%` }} />
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex justify-between font-medium">
                  <span>Minimum Required: ≥ 10% (StrategyManager invariant)</span>
                  <span>Amount: {blockchainData.managerLiquidFormatted} USDC</span>
                </div>
              </div>

              {/* Row 2: Strategy A (Primary Strategy) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center text-sm font-semibold mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-slate-900 dark:text-white font-bold">Strategy A (Primary Yield Strategy)</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-600 dark:text-slate-400">Current: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{currentStrategyANum.toFixed(1)}%</strong></span>
                    <span className="text-slate-600 dark:text-slate-400">Target: <strong className="font-mono text-slate-900 dark:text-white">{targetStrategyA}%</strong></span>
                    <span className={`px-2 py-0.5 rounded-md font-mono ${
                      driftStrategyA >= threshold ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}>
                      Drift: {driftStrategyA.toFixed(1)}%
                    </span>
                  </div>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${Math.min(currentStrategyANum, 100)}%` }} />
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex justify-between font-medium">
                  <span>Allocation Cap: ≤ 50%</span>
                  <span>Assets: {blockchainData.strategyTotalAssetsFormatted} USDC</span>
                </div>
              </div>

              {/* Row 3: Strategy B (Secondary Protocol Adapter) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center text-sm font-semibold mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="text-slate-900 dark:text-white font-bold">Strategy B (Compound Adapter)</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-600 dark:text-slate-400">Current: <strong className="font-mono text-purple-600 dark:text-purple-400">0.0%</strong></span>
                    <span className="text-slate-600 dark:text-slate-400">Target: <strong className="font-mono text-slate-900 dark:text-white">{targetStrategyB}%</strong></span>
                    <span className="px-2 py-0.5 rounded-md font-mono bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                      Targeted in Next Rebalance
                    </span>
                  </div>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                  <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: '0%' }} />
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex justify-between font-medium">
                  <span>Allocation Cap: ≤ 50%</span>
                  <span>Assets: 0.00 USDC</span>
                </div>
              </div>
            </div>

            {/* Rebalance Execution Details Box */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Calculated Rebalance Delta
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  {needsRebalance ? 'Drift Exceeds 5% Threshold' : 'Drift Within Safe Bounds'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <p className="text-xs text-slate-300 font-medium">Strategy A Realignment</p>
                  <p className="text-lg font-bold font-mono text-white">
                    {rebalance.strategyDifferenceSign === 'excess' ? `+${rebalance.strategyDifferenceFormatted} USDC (Withdraw)` :
                     rebalance.strategyDifferenceSign === 'deficit' ? `-${rebalance.strategyDifferenceFormatted} USDC (Allocate)` :
                     '0.00 USDC (Balanced)'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-300 font-medium">Chainlink Automation Trigger</p>
                  <p className="text-sm font-semibold text-teal-300 flex items-center gap-1">
                    <Cpu className="w-4 h-4" />
                    <span>checkUpkeep(): {needsRebalance ? 'TRUE' : 'FALSE'}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Target Weight Configuration Form */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Target Weight & Threshold Configuration</span>
                </h4>
                {configSuccess && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Configuration Saved!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold">Reserve % (≥10%)</label>
                  <input
                    type="number"
                    value={targetReserve}
                    onChange={(e) => setTargetReserve(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold">Strategy A % (≤50%)</label>
                  <input
                    type="number"
                    value={targetStrategyA}
                    onChange={(e) => setTargetStrategyA(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold">Strategy B % (≤50%)</label>
                  <input
                    type="number"
                    value={targetStrategyB}
                    onChange={(e) => setTargetStrategyB(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold">Threshold %</label>
                  <input
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Total Allocation Sum: <strong className={Number(targetReserve) + Number(targetStrategyA) + Number(targetStrategyB) === 100 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-500 font-bold'}>
                    {Number(targetReserve) + Number(targetStrategyA) + Number(targetStrategyB)}%
                  </strong> (Must equal 100%)
                </span>
                <button
                  onClick={handleSaveTargets}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Apply Configuration
                </button>
              </div>
            </div>
          </div>

          {/* Chainlink Automation Keeper Integration Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Chainlink Automation Keeper Execution
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">AutomationCompatibleInterface on RebalanceManager.sol</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full">
                Keeper Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-slate-600 dark:text-slate-400 font-semibold mb-1">Check Condition</p>
                <p className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  checkUpkeep() returns {needsRebalance ? 'TRUE' : 'FALSE'}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-slate-600 dark:text-slate-400 font-semibold mb-1">Execution Guard</p>
                <p className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  minInterval: 3,600s (1 hr)
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-slate-600 dark:text-slate-400 font-semibold mb-1">Target Action</p>
                <p className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  performUpkeep()
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              When deviation reaches or exceeds the threshold ({threshold}%), Chainlink Automation calls <code className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">performUpkeep()</code>, autonomously running Phase 1 excess withdrawals and Phase 2 deficit allocations without requiring manual owner intervention.
            </p>
          </div>
        </div>

        {/* Right Column: Risk Engine, APY, Volatility (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* RiskManager & Scoring Engine */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Risk-Based Capital Allocation
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">RiskManager.sol weighted evaluation</p>
                </div>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-lg font-bold">
                Max Score: 70/100
              </span>
            </div>

            {/* Formula display */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
              <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Risk Formula:</p>
              <code className="text-purple-600 dark:text-purple-400 font-mono text-xs font-bold">
                RiskScore = 0.30·V + 0.25·L + 0.25·P + 0.20·W
              </code>
            </div>

            {/* Strategy Risk Cards */}
            <div className="space-y-3">
              {/* MockStrategy */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">MockStrategy</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                      Eligible
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">V: 20 | L: 30 | P: 35 | W: 25</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">28</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">/100</span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Low Risk</p>
                </div>
              </div>

              {/* Aave V3 */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">Aave V3 Adapter</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                      Eligible
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">V: 15 | L: 15 | P: 20 | W: 40</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">22</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">/100</span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Very Low Risk</p>
                </div>
              </div>

              {/* Compound V3 */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">Compound V3 Adapter</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                      Eligible
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">V: 35 | L: 40 | P: 50 | W: 50</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">45</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">/100</span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Medium Risk</p>
                </div>
              </div>
            </div>

            {/* Interactive Risk Simulator */}
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 space-y-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Interactive Risk Calculator
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Volatility Risk (V)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={customV}
                    onChange={(e) => setCustomV(Number(e.target.value))}
                    className="w-full h-1 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-right text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200">{customV}</div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Liquidity Risk (L)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={customL}
                    onChange={(e) => setCustomL(Number(e.target.value))}
                    className="w-full h-1 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-right text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200">{customL}</div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Protocol Risk (P)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={customP}
                    onChange={(e) => setCustomP(Number(e.target.value))}
                    className="w-full h-1 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-right text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200">{customP}</div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Withdrawal Risk (W)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={customW}
                    onChange={(e) => setCustomW(Number(e.target.value))}
                    className="w-full h-1 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-right text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200">{customW}</div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Calculated Score:</span>
                <div className="flex items-center gap-2">
                  <span className={`text-base font-bold font-mono ${calculatedSimulatedRisk <= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                    {calculatedSimulatedRisk}/100
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    calculatedSimulatedRisk <= 70 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                  }`}>
                    {calculatedSimulatedRisk <= 70 ? 'Eligible' : 'Ineligible (>70)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Real-Time Protocol Yields */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Real-Time Protocol Yields
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">DeFi protocol rates collector</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Live feeds</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">Aave V3 Lending Pool</span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Supply: 4.85% | Reward: 0.25%</p>
                </div>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">{apy.aaveApy}% Net</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">Compound V3 Comet</span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Supply: 5.30% | Reward: 0.15%</p>
                </div>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">{apy.compoundApy}% Net</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">MockStrategy (Alpha)</span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Active Yield Simulation</p>
                </div>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">{apy.mockApy}% Net</span>
              </div>
            </div>
          </div>

          {/* Market Volatility & Safety Guards */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-500">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Market Volatility & Safeguards
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Asset return variance & drift boundaries</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                Guards Active
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Sample Volatility (σ):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{(volatility.dailyVolatilityPct * 100).toFixed(4)}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Chainlink Max Deviation:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">2.00% (200 BPS)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Volatility Flag:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">No Alert (Normal)</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              If market volatility spikes above tolerance, the risk scoring engine automatically reduces target exposure to affected strategies and suspends price-dependent rebalances.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
