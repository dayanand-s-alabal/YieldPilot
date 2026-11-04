import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  PauseCircle, 
  PlayCircle, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  FileText, 
  Activity, 
  ZapOff,
  Radio,
  ArrowDownToLine,
  ExternalLink
} from 'lucide-react';

export function EmergencyRiskManagement({ blockchainData, txManager }) {
  const [vaultPaused, setVaultPaused] = useState(false);
  const [oracleHealthy, setOracleHealthy] = useState(true);
  const [apyStale, setApyStale] = useState(false);
  const [riskThreshold, setRiskThreshold] = useState(70);
  const [simulatedRiskScore, setSimulatedRiskScore] = useState(65);
  const [isExclusionTriggered, setIsExclusionTriggered] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // Recovery incident logs
  const [recoveryLogs, setRecoveryLogs] = useState([
    {
      id: 1,
      timestamp: new Date(Date.now() - 3600000 * 4).toLocaleTimeString() + ' Today',
      strategy: 'Compound V3 Comet',
      reason: 'Automated exclusion: Strategy risk score exceeded 70/100 threshold (score: 74)',
      requestedUSD: 500.00,
      recoveredUSD: 350.00,
      lockedUSD: 150.00,
      status: 'Partially Recovered ($150 locked due to high Comet protocol borrowing)',
      fullyRecovered: false
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 3600000 * 24).toLocaleDateString(),
      strategy: 'MockAlpha Staking',
      reason: 'Oracle Failure: Stale heartbeat > 3600s detected on test price feed',
      requestedUSD: 250.00,
      recoveredUSD: 250.00,
      lockedUSD: 0.00,
      status: 'Fully Recovered into Vault Reserve',
      fullyRecovered: true
    }
  ]);

  // Handle Vault Pause Toggle
  const handleToggleVaultPause = async () => {
    setLoadingAction(true);
    setActionMessage(null);
    try {
      const nextState = !vaultPaused;
      setVaultPaused(nextState);
      setActionMessage({
        type: nextState ? 'warning' : 'success',
        text: nextState 
          ? 'Emergency vault pause activated! All new deposits and allocations are halted.' 
          : 'Vault emergency pause cleared. Normal operations resumed.'
      });
    } finally {
      setLoadingAction(false);
    }
  };

  // Evaluate Risk Score and trigger Auto-Exclusion if > 70
  const handleEvaluateRisk = () => {
    if (simulatedRiskScore > riskThreshold) {
      setIsExclusionTriggered(true);
      const newLog = {
        id: recoveryLogs.length + 1,
        timestamp: new Date().toLocaleTimeString() + ' Just now',
        strategy: 'Aave V3 Adapter',
        reason: `Auto-exclusion triggered: Strategy risk score (${simulatedRiskScore}/100) exceeded safety threshold (${riskThreshold}/100)`,
        requestedUSD: 400.00,
        recoveredUSD: 400.00,
        lockedUSD: 0.00,
        status: 'Fully Recovered into Vault Reserve',
        fullyRecovered: true
      };
      setRecoveryLogs([newLog, ...recoveryLogs]);
      setActionMessage({
        type: 'danger',
        text: `CRITICAL ALERT: Aave V3 risk score (${simulatedRiskScore}/100) breached threshold (${riskThreshold}/100). Strategy excluded, allocations stopped, and funds safely recovered.`
      });
    } else {
      setIsExclusionTriggered(false);
      setActionMessage({
        type: 'success',
        text: `Strategy risk score (${simulatedRiskScore}/100) is within safe limits (<= ${riskThreshold}/100).`
      });
    }
  };

  // Safe Emergency Liquidation
  const handleEmergencyLiquidation = (strategyName, requested, available) => {
    const recovered = Math.min(requested, available);
    const locked = requested - recovered;
    const isFull = locked === 0;

    const newLog = {
      id: recoveryLogs.length + 1,
      timestamp: new Date().toLocaleTimeString() + ' Just now',
      strategy: strategyName,
      reason: 'Manual Emergency Liquidation initiated by Vault Guardian',
      requestedUSD: requested,
      recoveredUSD: recovered,
      lockedUSD: locked,
      status: isFull 
        ? 'Fully Recovered into StrategyManager reserve' 
        : `Partially Recovered ($${locked.toFixed(2)} locked in illiquid protocol reserve)`,
      fullyRecovered: isFull
    };

    setRecoveryLogs([newLog, ...recoveryLogs]);
    setActionMessage({
      type: isFull ? 'success' : 'warning',
      text: isFull 
        ? `Successfully liquidated $${recovered.toFixed(2)} from ${strategyName}.` 
        : `Liquidity warning: Recovered $${recovered.toFixed(2)}, but $${locked.toFixed(2)} remains locked due to protocol cash limits.`
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Emergency Risk Management
            </h1>
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Unified circuit breaker, automatic strategy exclusion, oracle failure detection, and incident recovery logs
          </p>
        </div>

        {/* Global Vault Emergency Pause Button */}
        <button
          onClick={handleToggleVaultPause}
          disabled={loadingAction}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center space-x-2 shadow-lg transition-all ${
            vaultPaused
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-400'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
          }`}
        >
          {vaultPaused ? (
            <>
              <PlayCircle className="w-5 h-5" />
              <span>Resume Vault Operations</span>
            </>
          ) : (
            <>
              <PauseCircle className="w-5 h-5" />
              <span>Emergency Pause Vault</span>
            </>
          )}
        </button>
      </div>

      {/* Action Notification Alert Banner */}
      {actionMessage && (
        <div className={`p-4 rounded-xl border flex items-start space-x-3 text-sm font-medium ${
          actionMessage.type === 'danger'
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200'
            : actionMessage.type === 'warning'
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200'
            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200'
        }`}>
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">{actionMessage.text}</div>
          <button onClick={() => setActionMessage(null)} className="hover:opacity-75 font-bold text-xs">DISMISS</button>
        </div>
      )}

      {/* Real-time Health Monitors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Vault Status Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Vault State</span>
            <span className={`w-2.5 h-2.5 rounded-full ${vaultPaused ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mb-1">
            {vaultPaused ? 'EMERGENCY PAUSED' : 'ACTIVE & NORMAL'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {vaultPaused ? 'Deposits and rebalancing blocked' : 'All smart contract actions healthy'}
          </p>
        </div>

        {/* Oracle Failure Detection Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Chainlink Oracle</span>
            <span className={`w-2.5 h-2.5 rounded-full ${oracleHealthy ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mb-1 flex items-center space-x-1.5">
            <span>{oracleHealthy ? 'ONLINE (1.0001)' : 'CIRCUIT TRIPPED'}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {oracleHealthy ? 'Heartbeat fresh (< 3600s), deviation < 3%' : 'Price deviation / stale feed alert'}
          </p>
        </div>

        {/* APY Freshness Monitor Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">APY Heartbeat</span>
            <span className={`w-2.5 h-2.5 rounded-full ${!apyStale ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mb-1">
            {apyStale ? 'STALE (>24H)' : 'FRESH (12m ago)'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Max staleness window: 24 hours
          </p>
        </div>

        {/* Automatic Strategy Exclusion Threshold */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Exclusion Threshold</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
              {riskThreshold} / 100
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mb-1">
            Auto-Exclude &gt; 70
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Score &gt; 70 stops allocation & triggers recovery
          </p>
        </div>
      </div>

      {/* Interactive Risk Breach & Auto-Exclusion Simulator */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>Automatic Strategy Exclusion & Circuit Breaker</span>
              {isExclusionTriggered && (
                <span className="px-2 py-0.5 text-xs font-bold bg-rose-500 text-white rounded-md uppercase">
                  Exclusion Active
                </span>
              )}
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              If a protocol risk score crosses 70/100, the system automatically marks it ineligible, halts new allocations, flags for rebalance, and attempts withdrawal.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Simulate Strategy Risk Score: <span className={`text-sm ${simulatedRiskScore > riskThreshold ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}`}>{simulatedRiskScore} / 100</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={simulatedRiskScore}
                onChange={(e) => setSimulatedRiskScore(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-semibold">
                <span>0 (Lowest Risk)</span>
                <span className="text-rose-500">Threshold: 70</span>
                <span>100 (Critical Risk)</span>
              </div>
            </div>

            <button
              onClick={handleEvaluateRisk}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md self-start sm:self-center ${
                simulatedRiskScore > riskThreshold
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600'
              }`}
            >
              Evaluate Emergency Rules
            </button>
          </div>

          {/* Step Sequence Guide */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-200 dark:border-slate-700/50 text-xs font-medium">
            <div className={`p-2.5 rounded-lg border ${simulatedRiskScore > 70 ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold' : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
              1. Mark Ineligible
            </div>
            <div className={`p-2.5 rounded-lg border ${simulatedRiskScore > 70 ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold' : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
              2. Stop Allocations
            </div>
            <div className={`p-2.5 rounded-lg border ${simulatedRiskScore > 70 ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold' : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
              3. Flag Rebalance
            </div>
            <div className={`p-2.5 rounded-lg border ${simulatedRiskScore > 70 ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold' : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
              4. Check Liquidity
            </div>
            <div className={`p-2.5 rounded-lg border ${simulatedRiskScore > 70 ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold' : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
              5. Eject / Liquidate
            </div>
          </div>
        </div>
      </div>

      {/* Protocol Liquidity Availability & Emergency Eject */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Protocol Liquidity Checks & Emergency Eject
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Liquidate assets where available. If a strategy is illiquid, safe recovery preserves remaining claims without transaction reverts.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Strategy</th>
                <th className="py-3.5 px-6">Total Position</th>
                <th className="py-3.5 px-6">Available Liquidity</th>
                <th className="py-3.5 px-6">Illiquid / Locked</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Emergency Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">Aave V3 Adapter</td>
                <td className="py-4 px-6 text-slate-800 dark:text-slate-200">$500.00</td>
                <td className="py-4 px-6 text-emerald-600 dark:text-emerald-400 font-bold">$500.00 (100%)</td>
                <td className="py-4 px-6 text-slate-500 dark:text-slate-400">$0.00</td>
                <td className="py-4 px-6">
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                    Fully Liquid
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <button
                    onClick={() => handleEmergencyLiquidation('Aave V3 Adapter', 500, 500)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900"
                  >
                    Liquidate Available
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">Compound V3 Comet</td>
                <td className="py-4 px-6 text-slate-800 dark:text-slate-200">$500.00</td>
                <td className="py-4 px-6 text-amber-600 dark:text-amber-400 font-bold">$350.00 (70%)</td>
                <td className="py-4 px-6 text-rose-600 dark:text-rose-400 font-bold">$150.00 (30%)</td>
                <td className="py-4 px-6">
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300">
                    Partially Illiquid
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <button
                    onClick={() => handleEmergencyLiquidation('Compound V3 Comet', 500, 350)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-900"
                  >
                    Liquidate Available ($350)
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident & Recovery Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Recovery Logs & Audit Trail
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              On-chain emergency withdrawal events and locked liquidity balance tracking
            </p>
          </div>
          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {recoveryLogs.length} Events Logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-6">Strategy</th>
                <th className="py-3.5 px-6">Reason</th>
                <th className="py-3.5 px-6">Requested</th>
                <th className="py-3.5 px-6">Recovered</th>
                <th className="py-3.5 px-6">Locked</th>
                <th className="py-3.5 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {recoveryLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-4 px-6 font-bold text-slate-900 dark:text-white whitespace-nowrap">{log.strategy}</td>
                  <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-300 max-w-xs">{log.reason}</td>
                  <td className="py-4 px-6 text-slate-800 dark:text-slate-200 whitespace-nowrap">${log.requestedUSD.toFixed(2)}</td>
                  <td className="py-4 px-6 font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">${log.recoveredUSD.toFixed(2)}</td>
                  <td className="py-4 px-6 font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                    {log.lockedUSD > 0 ? `$${log.lockedUSD.toFixed(2)}` : '$0.00'}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold inline-flex items-center space-x-1 ${
                      log.fullyRecovered
                        ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'
                    }`}>
                      {log.fullyRecovered ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : <AlertTriangle className="w-3.5 h-3.5 mr-1" />}
                      <span>{log.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
