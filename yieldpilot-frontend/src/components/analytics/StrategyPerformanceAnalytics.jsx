import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  DollarSign, 
  Layers, 
  PieChart, 
  ArrowUpRight, 
  ShieldCheck, 
  Activity,
  Info,
  Calendar,
  Zap,
  Percent
} from 'lucide-react';

export function StrategyPerformanceAnalytics({ blockchainData }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [activeStrategy, setActiveStrategy] = useState('all');

  useEffect(() => {
    // Attempt fetching from backend or fallback to initial illustrative state
    fetch('http://localhost:8080/api/v1/analytics/performance')
      .then(res => res.json())
      .then(data => setAnalyticsData(data))
      .catch(() => {
        // Fallback robust illustrative benchmark
        setAnalyticsData({
          title: "Strategy performance — Illustrative data",
          disclaimer: "Illustrative cumulative strategy performance, not actual protocol data.",
          yieldEarned: {
            Aave: 124.50,
            Compound: 98.20,
            MockAlpha: 45.10
          },
          dailyPerformance: [
            { day: "Day 1", aaveCumulativeYield: 18.20, compoundCumulativeYield: 12.40, aaveApy: 4.80, compoundApy: 5.10 },
            { day: "Day 2", aaveCumulativeYield: 36.80, compoundCumulativeYield: 25.90, aaveApy: 4.85, compoundApy: 5.25 },
            { day: "Day 3", aaveCumulativeYield: 55.40, compoundCumulativeYield: 41.20, aaveApy: 4.90, compoundApy: 5.30 },
            { day: "Day 4", aaveCumulativeYield: 73.90, compoundCumulativeYield: 56.50, aaveApy: 4.88, compoundApy: 5.28 },
            { day: "Day 5", aaveCumulativeYield: 91.30, compoundCumulativeYield: 71.80, aaveApy: 5.02, compoundApy: 5.35 },
            { day: "Day 6", aaveCumulativeYield: 108.40, compoundCumulativeYield: 85.10, aaveApy: 5.10, compoundApy: 5.42 },
            { day: "Day 7", aaveCumulativeYield: 124.50, compoundCumulativeYield: 98.20, aaveApy: 5.12, compoundApy: 5.45 },
          ],
          strategies: {
            Aave: {
              protocol: "Aave V3",
              yieldEarnedUSD: 124.50,
              currentApyPercent: 5.12,
              totalDepositsUSD: 15000.00,
              totalWithdrawalsUSD: 4800.00,
              activeBalanceUSD: 10324.50,
              utilizationPercent: 74.5,
              riskScore: 22,
              currentAllocationPercent: 48.0,
              status: "Active (Low Risk)"
            },
            Compound: {
              protocol: "Compound V3",
              yieldEarnedUSD: 98.20,
              currentApyPercent: 5.45,
              totalDepositsUSD: 12000.00,
              totalWithdrawalsUSD: 3900.00,
              activeBalanceUSD: 8198.20,
              utilizationPercent: 68.2,
              riskScore: 45,
              currentAllocationPercent: 32.0,
              status: "Active (Medium Risk)"
            }
          }
        });
      });
  }, []);

  const data = analyticsData;
  const aaveYield = data?.yieldEarned?.Aave ?? 124.50;
  const compoundYield = data?.yieldEarned?.Compound ?? 98.20;

  const maxChartValue = 140; // Max scale $140 as requested
  const yAxisTicks = [140, 105, 70, 35, 0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header section with proper high-contrast text color */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <BarChart3 className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Strategy Performance Analytics
            </h1>
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Historical APY, cumulative yield tracking, utilization metrics, and allocation history
          </p>
        </div>

        {/* Timeframe pill selector */}
        <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 self-start md:self-auto">
          {['24h', '7d', '30d', 'all'].map((tf) => (
            <button
              key={tf}
              onClick={() => setSelectedTimeframe(tf)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedTimeframe === tf
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Top Banner KPI Cards (As Specified in Prompt) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Aave Yield Earned Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-cyan-500 ring-4 ring-cyan-500/20" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Aave V3</span>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
              Low Risk
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Aave yield earned</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              ${aaveYield.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +5.12% APY
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/70 flex justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Utilization: <strong className="text-slate-800 dark:text-slate-200">74.5%</strong></span>
            <span>Allocated: <strong className="text-slate-800 dark:text-slate-200">48%</strong></span>
          </div>
        </div>

        {/* Compound Yield Earned Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-purple-500 ring-4 ring-purple-500/20" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Compound V3</span>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50">
              Medium Risk
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Compound yield earned</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              ${compoundYield.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +5.45% APY
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/70 flex justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Utilization: <strong className="text-slate-800 dark:text-slate-200">68.2%</strong></span>
            <span>Allocated: <strong className="text-slate-800 dark:text-slate-200">32%</strong></span>
          </div>
        </div>

        {/* Combined Total Portfolio Yield Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-all md:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Total Portfolio Alpha</span>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
              Rebalanced
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Cumulative vault earnings</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
              ${(aaveYield + compoundYield).toFixed(2)}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              across 7 days
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/70 flex justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Risk-Adjusted Alpha: <strong className="text-emerald-600 dark:text-emerald-400">+1.24%</strong></span>
            <span>Liquid Reserve: <strong className="text-slate-800 dark:text-slate-200">20%</strong></span>
          </div>
        </div>
      </div>

      {/* Main Cumulative Strategy Performance Chart (Requested format) */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Cumulative Strategy Performance
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Illustrative cumulative strategy performance, not actual protocol data.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center space-x-6 text-xs font-semibold">
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded-md bg-cyan-500 shadow-sm" />
              <span className="text-slate-800 dark:text-slate-200">Aave V3</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded-md bg-purple-500 shadow-sm" />
              <span className="text-slate-800 dark:text-slate-200">Compound V3</span>
            </div>
          </div>
        </div>

        {/* Visual Chart with $0, $35, $70, $105, $140 Y-Axis and Day 1 - Day 7 X-Axis */}
        <div className="relative pt-4 pb-2">
          <div className="flex h-72">
            {/* Y-Axis Labels ($140 to $0) */}
            <div className="flex flex-col justify-between pr-4 text-xs font-bold text-slate-500 dark:text-slate-400 select-none text-right w-12 border-r border-slate-200 dark:border-slate-800">
              {yAxisTicks.map((val) => (
                <span key={val}>${val}</span>
              ))}
            </div>

            {/* Chart Area with Gridlines and Bars */}
            <div className="flex-1 relative pl-4 flex flex-col justify-between">
              {/* Horizontal Gridlines */}
              <div className="absolute inset-x-4 inset-y-0 flex flex-col justify-between pointer-events-none opacity-40">
                {yAxisTicks.map((val) => (
                  <div key={val} className="border-b border-dashed border-slate-200 dark:border-slate-800 w-full" />
                ))}
              </div>

              {/* 7 Days Bar Groups */}
              <div className="flex-1 grid grid-cols-7 gap-2 md:gap-6 items-end z-10 px-2 pt-2">
                {data?.dailyPerformance?.map((item, index) => {
                  const aaveHeight = (item.aaveCumulativeYield / maxChartValue) * 100;
                  const compoundHeight = (item.compoundCumulativeYield / maxChartValue) * 100;

                  return (
                    <div key={index} className="flex flex-col items-center h-full justify-end group cursor-pointer">
                      {/* Tooltip on hover */}
                      <div className="hidden group-hover:flex absolute -top-10 bg-slate-900 text-white dark:bg-slate-800 text-[11px] font-semibold py-1 px-2.5 rounded-lg shadow-lg border border-slate-700 pointer-events-none z-30 flex-col items-center">
                        <span>{item.day}</span>
                        <span className="text-cyan-400">Aave: ${item.aaveCumulativeYield.toFixed(2)}</span>
                        <span className="text-purple-400">Comp: ${item.compoundCumulativeYield.toFixed(2)}</span>
                      </div>

                      {/* Side by side bars */}
                      <div className="w-full flex items-end justify-center space-x-1 sm:space-x-2 h-full">
                        {/* Aave Bar */}
                        <div 
                          className="w-1/2 max-w-[20px] rounded-t-md bg-gradient-to-t from-cyan-600 to-cyan-400 transition-all duration-300 group-hover:brightness-110 shadow-xs"
                          style={{ height: `${Math.min(aaveHeight, 100)}%` }}
                        />
                        {/* Compound Bar */}
                        <div 
                          className="w-1/2 max-w-[20px] rounded-t-md bg-gradient-to-t from-purple-600 to-purple-400 transition-all duration-300 group-hover:brightness-110 shadow-xs"
                          style={{ height: `${Math.min(compoundHeight, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X-Axis Labels (Day 1 - Day 7) */}
              <div className="grid grid-cols-7 gap-2 md:gap-6 pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
                {data?.dailyPerformance?.map((item, index) => (
                  <span key={index} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {item.day}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Performance & Protocol Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Historical Performance & Allocation Metrics
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Detailed breakdown of deposits, withdrawals, yield accrual, and utilization per strategy
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Strategy</th>
                <th className="py-3.5 px-6">Current APY</th>
                <th className="py-3.5 px-6">Total Deposits</th>
                <th className="py-3.5 px-6">Total Withdrawals</th>
                <th className="py-3.5 px-6">Yield Earned</th>
                <th className="py-3.5 px-6">Utilization</th>
                <th className="py-3.5 px-6">Risk Score</th>
                <th className="py-3.5 px-6">Target Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-4 px-6 flex items-center space-x-3">
                  <span className="w-3 h-3 rounded-full bg-cyan-500" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Aave V3 Lending</span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">aUSDC Supply</span>
                  </div>
                </td>
                <td className="py-4 px-6 font-bold text-emerald-600 dark:text-emerald-400">5.12%</td>
                <td className="py-4 px-6 text-slate-800 dark:text-slate-200">$15,000.00</td>
                <td className="py-4 px-6 text-slate-800 dark:text-slate-200">$4,800.00</td>
                <td className="py-4 px-6 font-bold text-cyan-600 dark:text-cyan-400">${aaveYield.toFixed(2)}</td>
                <td className="py-4 px-6 text-slate-800 dark:text-slate-200">74.5%</td>
                <td className="py-4 px-6">
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                    22 / 100
                  </span>
                </td>
                <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">48%</td>
              </tr>

              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-4 px-6 flex items-center space-x-3">
                  <span className="w-3 h-3 rounded-full bg-purple-500" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Compound V3 Comet</span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">cUSDC Market</span>
                  </div>
                </td>
                <td className="py-4 px-6 font-bold text-emerald-600 dark:text-emerald-400">5.45%</td>
                <td className="py-4 px-6 text-slate-800 dark:text-slate-200">$12,000.00</td>
                <td className="py-4 px-6 text-slate-800 dark:text-slate-200">$3,900.00</td>
                <td className="py-4 px-6 font-bold text-purple-600 dark:text-purple-400">${compoundYield.toFixed(2)}</td>
                <td className="py-4 px-6 text-slate-800 dark:text-slate-200">68.2%</td>
                <td className="py-4 px-6">
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300">
                    45 / 100
                  </span>
                </td>
                <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">32%</td>
              </tr>

              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-4 px-6 flex items-center space-x-3">
                  <span className="w-3 h-3 rounded-full bg-slate-400" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Liquid Reserve</span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">StrategyManager Cash</span>
                  </div>
                </td>
                <td className="py-4 px-6 font-bold text-slate-500 dark:text-slate-400">0.00%</td>
                <td className="py-4 px-6 text-slate-800 dark:text-slate-200">$10,000.00</td>
                <td className="py-4 px-6 text-slate-800 dark:text-slate-200">$2,000.00</td>
                <td className="py-4 px-6 font-bold text-slate-500 dark:text-slate-400">$0.00</td>
                <td className="py-4 px-6 text-slate-800 dark:text-slate-200">100.0%</td>
                <td className="py-4 px-6">
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    0 / 100
                  </span>
                </td>
                <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">20%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
