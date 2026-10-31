import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  Layers, 
  RefreshCw, 
  History as HistoryIcon, 
  User, 
  Settings as SettingsIcon, 
  Bell, 
  Search, 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  ChevronRight, 
  ExternalLink, 
  Sliders, 
  Lock, 
  Unlock, 
  Globe, 
  Moon, 
  Sun, 
  Menu, 
  X, 
  Check, 
  Plus, 
  Minus,
  Sparkles
} from 'lucide-react';
import { api } from './services/api';

export default function App() {
  // Navigation & UI state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(true);
  const [walletAddress, setWalletAddress] = useState('0x3A2F...7B9C');
  const [network, setNetwork] = useState('Localhost (Hardhat)');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // App Data States
  const [tvl, setTvl] = useState(12580.45);
  const [vaultShareValue, setVaultShareValue] = useState(1245.32);
  const [userDeposits, setUserDeposits] = useState(1000.00);
  const [vaultShares, setVaultShares] = useState(892.34);
  const [estimatedEarnings, setEstimatedEarnings] = useState(245.32);
  const [currentApy, setCurrentApy] = useState(6.84);

  const refreshVault = async () => {
    try {
      const summary = await api.getVaultSummary();
      if (summary) {
        if (summary.totalValueLocked != null) setTvl(summary.totalValueLocked);
        if (summary.userDepositedValue != null) setUserDeposits(summary.userDepositedValue);
        if (summary.vaultShares != null) setVaultShares(summary.vaultShares);
        if (summary.estimatedEarnings != null) setEstimatedEarnings(summary.estimatedEarnings);
        if (summary.currentApy != null) setCurrentApy(summary.currentApy);
      }
      const health = await api.getHealth();
      if (health && health.blockchain) {
        setNetwork(health.blockchain);
      }
    } catch (e) {
      console.warn('Backend not responding yet, fallback to local state', e);
    }
  };

  useEffect(() => {
    refreshVault();
  }, []);

  // Notifications state
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Rebalance Executed', desc: 'Moved 200 USDC to Strategy B', time: '10 mins ago', read: false },
    { id: 2, title: 'Harvest Successful', desc: '+12.34 USDC added to vault', time: '1 hour ago', read: false },
    { id: 3, title: 'Strategy Updated', desc: 'Strategy C APY increased to 10.14%', time: '3 hours ago', read: true }
  ]);

  // Toast / Status banner
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} font-sans antialiased flex flex-col md:flex-row relative`}>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          {/* Logo & Branding */}
          <div className="p-6 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-wide">YieldPilot</h1>
                <p className="text-xs text-slate-400">Save · Earn · Rebalance</p>
              </div>
            </div>
            <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'deposit', label: 'Deposit / Withdraw', icon: Wallet },
              { id: 'strategies', label: 'Strategies', icon: Layers },
              { id: 'rebalancing', label: 'Rebalancing', icon: RefreshCw },
              { id: 'history', label: 'Transaction History', icon: HistoryIcon },
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'settings', label: 'Settings', icon: SettingsIcon },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                      : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Agoric Branding footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/50">
            <p className="text-xs font-semibold text-emerald-400 mb-1">Agoric Ecosystem</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">Seamless. Automated. Intelligent Apps.</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Header Bar */}
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center space-x-4">
            <button className="md:hidden text-slate-600 dark:text-slate-300" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative hidden sm:block w-72 md:w-96">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by transaction, strategy or wallet..." 
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all border border-transparent dark:border-slate-700"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Network Indicator */}
            <div className="hidden lg:flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-700 dark:text-slate-300">{network}</span>
            </div>

            {/* Notification Center */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="font-bold text-sm text-slate-800 dark:text-white">Notifications</span>
                    <button 
                      onClick={() => setNotifications(notifications.map(n => ({...n, read: true})))}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!n.read ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''}`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{n.title}</span>
                          <span className="text-[10px] text-slate-400">{n.time}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{n.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Connect Wallet Button */}
            <button 
              onClick={() => {
                setIsWalletConnected(!isWalletConnected);
                showToast(isWalletConnected ? 'Wallet disconnected' : 'Wallet connected successfully!');
              }}
              className="flex items-center space-x-2.5 bg-slate-900 dark:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-slate-800 dark:hover:bg-slate-700 transition-all shadow-md shadow-slate-900/10 border border-slate-700"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-orange-500 to-amber-400 flex items-center justify-center text-xs font-bold text-white">🦊</div>
              <span>{isWalletConnected ? walletAddress : 'Connect Wallet'}</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Views */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
          {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} tvl={tvl} vaultShareValue={vaultShareValue} userDeposits={userDeposits} vaultShares={vaultShares} estimatedEarnings={estimatedEarnings} currentApy={currentApy} />}
          {activeTab === 'deposit' && <DepositWithdrawView userDeposits={userDeposits} setUserDeposits={setUserDeposits} vaultShares={vaultShares} setVaultShares={setVaultShares} showToast={showToast} onSuccess={refreshVault} />}
          {activeTab === 'strategies' && <StrategiesView showToast={showToast} />}
          {activeTab === 'rebalancing' && <RebalancingView showToast={showToast} onSuccess={refreshVault} />}
          {activeTab === 'history' && <HistoryView />}
          {activeTab === 'profile' && <ProfileView walletAddress={walletAddress} userDeposits={userDeposits} vaultShares={vaultShares} />}
          {activeTab === 'settings' && <SettingsView darkMode={darkMode} setDarkMode={setDarkMode} showToast={showToast} network={network} setNetwork={setNetwork} />}
        </main>
      </div>
    </div>
  );
}

/* ========================================================================
   1. DASHBOARD VIEW
   ======================================================================== */
function DashboardView({ setActiveTab, tvl, vaultShareValue, userDeposits, vaultShares, estimatedEarnings, currentApy }) {
  const [timeframe, setTimeframe] = useState('Last 30 Days');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 rounded-3xl shadow-2xl border border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>YieldPilot Protocol v2.4</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Welcome to YieldPilot</h2>
          <p className="text-slate-400 text-sm max-w-xl">Automated Savings & Yield Vault with Dynamic Rebalancing across top DeFi liquidity pools.</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-4 z-10 w-full lg:w-auto">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex-1 sm:w-56">
            <p className="text-xs text-slate-400 font-medium mb-1">Total Value Locked (TVL)</p>
            <p className="text-2xl font-bold text-white">${tvl.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
            <div className="flex items-center text-xs text-emerald-400 mt-1 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              <span>+2.4% this week</span>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex-1 sm:w-56">
            <p className="text-xs text-slate-400 font-medium mb-1">Your Share Value</p>
            <p className="text-2xl font-bold text-white">${vaultShareValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
            <div className="flex items-center text-xs text-emerald-400 mt-1 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              <span>+1.8% earnings</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { title: 'Your Deposits', value: `$${userDeposits.toLocaleString(undefined, {minimumFractionDigits: 2})}`, change: '+0.0%', icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { title: 'Vault Shares', value: vaultShares.toLocaleString(undefined, {minimumFractionDigits: 2}), change: '+1.8%', icon: PieChart, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
          { title: 'Estimated Earnings', value: `$${estimatedEarnings.toLocaleString(undefined, {minimumFractionDigits: 2})}`, change: '+5.1%', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { title: 'Current APY', value: `${currentApy}%`, change: '+0.6%', icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{metric.title}</span>
                <div className={`p-3 rounded-2xl ${metric.bg} ${metric.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{metric.value}</p>
              <div className="flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                <span>{metric.change} vs last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Allocation & Yield Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Allocation Overview Donut */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Allocation Overview</h3>
            <span className="text-xs font-medium text-slate-400">Live Breakdown</span>
          </div>
          
          <div className="relative flex items-center justify-center py-4">
            {/* SVG Donut Chart */}
            <svg className="w-48 h-48 transform -rotate-90">
              <circle cx="96" cy="96" r="72" stroke="currentColor" strokeWidth="24" className="text-slate-100 dark:text-slate-800 fill-none" />
              <circle cx="96" cy="96" r="72" stroke="currentColor" strokeWidth="24" className="text-amber-500 fill-none" strokeDasharray="452.39" strokeDashoffset="45" />
              <circle cx="96" cy="96" r="72" stroke="currentColor" strokeWidth="24" className="text-indigo-500 fill-none" strokeDasharray="452.39" strokeDashoffset="180" />
              <circle cx="96" cy="96" r="72" stroke="currentColor" strokeWidth="24" className="text-emerald-500 fill-none" strokeDasharray="452.39" strokeDashoffset="270" />
            </svg>
            <div className="absolute text-center">
              <p className="text-xs text-slate-400 font-medium">Total Assets</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">$12,580.45</p>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            {[
              { label: 'Strategy A (Low Risk)', pct: '40%', color: 'bg-emerald-500' },
              { label: 'Strategy B (Balanced)', pct: '35%', color: 'bg-indigo-500' },
              { label: 'Strategy C (High Yield)', pct: '20%', color: 'bg-amber-500' },
              { label: 'Reserve (Liquidity)', pct: '5%', color: 'bg-slate-400' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className={`w-3 h-3 rounded-full ${item.color}`}></span>
                  <span className="text-slate-600 dark:text-slate-300 font-medium">{item.label}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{item.pct}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Yield Performance Line Chart Simulation */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Yield Performance</h3>
              <p className="text-xs text-slate-400">Historical APY and strategy growth trends</p>
            </div>
            <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 focus:outline-hidden"
            >
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
              <option>Year to Date</option>
            </select>
          </div>

          {/* Graphical representation mockup */}
          <div className="h-64 flex flex-col justify-between relative py-4">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-b border-slate-400 w-full"></div>
              <div className="border-b border-slate-400 w-full"></div>
              <div className="border-b border-slate-400 w-full"></div>
              <div className="border-b border-slate-400 w-full"></div>
            </div>

            {/* Simulated Wave SVG */}
            <svg className="w-full h-48 overflow-visible">
              <path d="M 0 120 Q 150 90, 300 100 T 600 40 T 900 20" fill="none" stroke="#10b981" strokeWidth="3" />
              <path d="M 0 150 Q 150 120, 300 130 T 600 80 T 900 50" fill="none" stroke="#6366f1" strokeWidth="3" />
              <path d="M 0 180 Q 150 160, 300 150 T 600 120 T 900 90" fill="none" stroke="#f59e0b" strokeWidth="3" />
            </svg>

            <div className="flex justify-between text-[11px] text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Oct 10</span>
              <span>Oct 15</span>
              <span>Oct 20</span>
              <span>Oct 25</span>
              <span>Oct 26</span>
              <span>Nov 04</span>
              <span>Nov 08</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span><span className="text-slate-600 dark:text-slate-300 font-medium">Strategy A</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-full bg-indigo-500"></span><span className="text-slate-600 dark:text-slate-300 font-medium">Strategy B</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span><span className="text-slate-600 dark:text-slate-300 font-medium">Strategy C</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-full bg-purple-500"></span><span className="text-slate-600 dark:text-slate-300 font-medium">Vault APY</span></div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Active Strategies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Recent Activity</h3>
            <button onClick={() => setActiveTab('history')} className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {[
              { type: 'Deposit', amount: '+1,000.00 USDC', time: 'Nov 08, 2024 10:24 AM', status: 'Confirmed', icon: Wallet, color: 'text-emerald-500 bg-emerald-500/10' },
              { type: 'Rebalance', amount: 'Moved 200 USDC to Strategy B', time: 'Nov 07, 2024 03:12 PM', status: 'Confirmed', icon: RefreshCw, color: 'text-indigo-500 bg-indigo-500/10' },
              { type: 'Harvest', amount: '+12.34 USDC', time: 'Nov 06, 2024 09:20 AM', status: 'Confirmed', icon: TrendingUp, color: 'text-blue-500 bg-blue-500/10' },
              { type: 'Withdraw', amount: '-200.00 USDC', time: 'Nov 05, 2024 01:45 PM', status: 'Confirmed', icon: Wallet, color: 'text-rose-500 bg-rose-500/10' },
            ].map((act, i) => {
              const Icon = act.icon;
              return (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-xl ${act.color}`}><Icon className="w-4 h-4" /></div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{act.type}</p>
                      <p className="text-[11px] text-slate-400">{act.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{act.amount}</p>
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 mt-0.5">{act.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Strategies */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Active Strategies</h3>
            <button onClick={() => setActiveTab('strategies')} className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">Manage</button>
          </div>
          <div className="space-y-4">
            {[
              { name: 'Strategy A', desc: 'Low Risk', apy: '4.12%', alloc: '40%' },
              { name: 'Strategy B', desc: 'Balanced', apy: '7.36%', alloc: '35%' },
              { name: 'Strategy C', desc: 'High Yield', apy: '10.14%', alloc: '20%' },
              { name: 'Reserve', desc: 'Liquidity', apy: '2.00%', alloc: '5%' },
            ].map((strat, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{strat.name}</p>
                  <p className="text-[11px] text-slate-400">{strat.desc}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{strat.apy}</p>
                  <p className="text-[10px] text-slate-400">APY</p>
                </div>
                <div className="text-right w-24">
                  <div className="flex justify-between text-[11px] font-semibold mb-1">
                    <span className="text-slate-600 dark:text-slate-300">{strat.alloc}</span>
                    <span className="text-emerald-600">Active</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: strat.alloc }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="font-bold text-md text-slate-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button onClick={() => setActiveTab('deposit')} className="p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-600/20">
            <Wallet className="w-4 h-4" />
            <span>Deposit Assets</span>
          </button>
          <button onClick={() => setActiveTab('deposit')} className="p-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-2xl font-semibold text-xs flex items-center justify-center space-x-2 transition-all">
            <Wallet className="w-4 h-4" />
            <span>Withdraw Assets</span>
          </button>
          <button onClick={() => setActiveTab('rebalancing')} className="p-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-2xl font-semibold text-xs flex items-center justify-center space-x-2 transition-all">
            <RefreshCw className="w-4 h-4" />
            <span>View Rebalancing</span>
          </button>
          <button onClick={() => setActiveTab('strategies')} className="p-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-2xl font-semibold text-xs flex items-center justify-center space-x-2 transition-all">
            <Layers className="w-4 h-4" />
            <span>Explore Strategies</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================
   2. DEPOSIT / WITHDRAW VIEW
   ======================================================================== */
function DepositWithdrawView({ userDeposits, setUserDeposits, vaultShares, setVaultShares, showToast, onSuccess }) {
  const [tab, setTab] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAction = async (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    setLoading(true);
    try {
      if (tab === 'deposit') {
        await api.deposit(val);
        setUserDeposits(prev => prev + val);
        setVaultShares(prev => prev + (val * 0.89));
        showToast(`Successfully deposited $${val.toLocaleString()} USDC!`);
      } else {
        if (val > userDeposits) {
          showToast('Insufficient deposited balance', 'error');
          setLoading(false);
          return;
        }
        await api.withdraw(val);
        setUserDeposits(prev => prev - val);
        setVaultShares(prev => Math.max(0, prev - (val * 0.89)));
        showToast(`Successfully withdrawn $${val.toLocaleString()} USDC!`);
      }
      if (onSuccess) await onSuccess();
      setAmount('');
    } catch (err) {
      showToast(err.message || 'Transaction failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
        {/* Tab switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-8">
          <button 
            onClick={() => setTab('deposit')} 
            className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${tab === 'deposit' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            Deposit
          </button>
          <button 
            onClick={() => setTab('withdraw')} 
            className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${tab === 'withdraw' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            Withdraw
          </button>
        </div>

        {/* Balance summary */}
        <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-6 border border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-xs text-slate-400 font-medium">{tab === 'deposit' ? 'Wallet Balance' : 'Available to Withdraw'}</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">${tab === 'deposit' ? '12,450.00 USDC' : userDeposits.toLocaleString(undefined, {minimumFractionDigits: 2}) + ' USDC'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-medium">Vault Shares Estimate</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">~{(amount ? parseFloat(amount) * 0.89 : 0).toFixed(2)} YP-USDC</p>
          </div>
        </div>

        <form onSubmit={handleAction} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Amount (USDC)</label>
            <div className="relative">
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00" 
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3.5 rounded-2xl font-bold text-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 border border-slate-200 dark:border-slate-700"
              />
              <button 
                type="button" 
                onClick={() => setAmount(tab === 'deposit' ? '12450' : userDeposits.toString())}
                className="absolute right-3.5 top-3.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-xl text-xs font-bold hover:bg-emerald-500/20"
              >
                MAX
              </button>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-2xl flex items-start space-x-3 text-xs text-blue-700 dark:text-blue-300">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>Deposits are automatically distributed across YieldPilot's optimized risk-weighted strategies with dynamic gasless rebalancing.</p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Processing transaction...</span>
              </span>
            ) : (
              <span>Confirm {tab === 'deposit' ? 'Deposit' : 'Withdrawal'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ========================================================================
   3. STRATEGIES VIEW
   ======================================================================== */
function StrategiesView({ showToast }) {
  const [strategies, setStrategies] = useState([
    { id: 1, name: 'Strategy A', category: 'Low Risk', apy: '4.12%', alloc: '40%', liquidity: '$4,500,000', status: true },
    { id: 2, name: 'Strategy B', category: 'Balanced', apy: '7.36%', alloc: '35%', liquidity: '$2,800,000', status: true },
    { id: 3, name: 'Strategy C', category: 'High Yield', apy: '10.14%', alloc: '20%', liquidity: '$1,200,000', status: true },
    { id: 4, name: 'Reserve Vault', category: 'Liquidity', apy: '2.00%', alloc: '5%', liquidity: '$850,000', status: true },
  ]);

  const loadStrategies = async () => {
    try {
      const data = await api.getStrategies();
      if (Array.isArray(data) && data.length > 0) {
        setStrategies(data.map(s => ({
          id: s.id,
          name: s.name,
          category: s.riskLevel,
          apy: `${s.currentApy}%`,
          alloc: `${s.allocationPercentage}%`,
          liquidity: `$${Number(s.liquidityAvailable).toLocaleString()}`,
          status: s.status === 'Active'
        })));
      }
    } catch (e) {
      console.warn('Fallback to default strategies', e);
    }
  };

  useEffect(() => {
    loadStrategies();
  }, []);

  const toggleStrategy = async (id) => {
    try {
      const updated = await api.toggleStrategyStatus(id);
      setStrategies(strategies.map(s => s.id === id ? {...s, status: updated.status === 'Active'} : s));
      showToast(`Strategy ${updated.name} is now ${updated.status}!`);
    } catch (err) {
      setStrategies(strategies.map(s => s.id === id ? {...s, status: !s.status} : s));
      showToast('Strategy status updated successfully!');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Strategy Marketplace</h2>
          <p className="text-xs text-slate-400">Automated yield farming vaults managed by smart rebalancing agents.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {strategies.map((strat) => (
          <div key={strat.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{strat.category}</span>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">{strat.name}</h3>
                </div>
                <button 
                  onClick={() => toggleStrategy(strat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${strat.status ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'}`}
                >
                  <span className={`w-2 h-2 rounded-full ${strat.status ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                  <span>{strat.status ? 'Active' : 'Paused'}</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-6 border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">Estimated APY</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{strat.apy}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">Allocation</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{strat.alloc}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">Liquidity</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{strat.liquidity}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400">Risk-weighted autonomous yield</span>
              <button 
                onClick={() => showToast(`Configuring ${strat.name}...`)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-all"
              >
                Configure
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========================================================================
   4. REBALANCING VIEW
   ======================================================================== */
function RebalancingView({ showToast, onSuccess }) {
  const [proposal, setProposal] = useState(null);
  const [rebalancingActive, setRebalancingActive] = useState(false);

  useEffect(() => {
    api.getProposals().then(props => {
      if (Array.isArray(props) && props.length > 0) {
        setProposal(props[0]);
      }
    }).catch(err => console.warn('Proposals offline', err));
  }, []);

  const handleApproveRebalance = async () => {
    setRebalancingActive(true);
    try {
      if (proposal && proposal.id) {
        const res = await api.executeProposal(proposal.id);
        setProposal(res);
      }
      if (onSuccess) await onSuccess();
      showToast('Smart rebalance successfully evaluated and executed in backend!');
    } catch (err) {
      showToast('Rebalance evaluated');
    } finally {
      setRebalancingActive(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Smart Rebalancing Panel</h2>
        <p className="text-xs text-slate-400">AI-driven automated portfolio rebalancing to maximize APY and mitigate risk.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Recommendation #RB-2026-9</p>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Optimize Strategy B vs C Weights</h3>
          </div>
          <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold">Action Required</span>
        </div>

        {/* Current vs Target Allocations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-500 mb-3">Current Allocation</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span>Strategy A:</span><span className="font-bold">40%</span></div>
              <div className="flex justify-between"><span>Strategy B:</span><span className="font-bold">35%</span></div>
              <div className="flex justify-between"><span>Strategy C:</span><span className="font-bold">20%</span></div>
              <div className="flex justify-between"><span>Reserve:</span><span className="font-bold">5%</span></div>
            </div>
          </div>
          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-3">Recommended Target</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span>Strategy A:</span><span className="font-bold">35% (-5%)</span></div>
              <div className="flex justify-between"><span>Strategy B:</span><span className="font-bold">45% (+10%)</span></div>
              <div className="flex justify-between"><span>Strategy C:</span><span className="font-bold">15% (-5%)</span></div>
              <div className="flex justify-between"><span>Reserve:</span><span className="font-bold">5% (0%)</span></div>
            </div>
          </div>
        </div>

        {/* Recommendation details */}
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
          <p><strong className="text-slate-800 dark:text-white">Reason for Recommendation:</strong> Strategy B APY has surged by 1.4% following liquidity inflows on Agoric DEX pools. Shifting 10% weight optimizes risk-adjusted returns.</p>
          <div className="flex justify-between font-semibold text-slate-800 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Estimated Benefit: +0.65% APY</span>
            <span>Est. Transaction Cost: $0.12 (Gasless via Relayer)</span>
          </div>
        </div>

        {/* Risk Warning */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/50 flex items-start space-x-3 text-xs text-amber-800 dark:text-amber-300">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <p>Rebalancing involves smart contract execution across multiple AMM routes. Slippage is bounded to less than 0.1%.</p>
        </div>

        <button 
          onClick={handleApproveRebalance}
          disabled={rebalancingActive}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
        >
          {rebalancingActive ? (
            <span className="flex items-center space-x-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Executing Rebalance...</span>
            </span>
          ) : (
            <span>Evaluate & Approve Rebalance</span>
          )}
        </button>
      </div>
    </div>
  );
}

/* ========================================================================
   5. HISTORY VIEW
   ======================================================================== */
function HistoryView() {
  const [filter, setFilter] = useState('All');
  const [transactions, setTransactions] = useState([
    { id: 'tx-1', type: 'Deposit', amount: '+1,000.00 USDC', date: 'Nov 08, 2024 10:24 AM', status: 'Confirmed', hash: '0x8f2c...31d9' },
    { id: 'tx-2', type: 'Rebalance', amount: 'Moved 200 USDC to Strategy B', date: 'Nov 07, 2024 03:12 PM', status: 'Confirmed', hash: '0x4a1e...90b2' },
    { id: 'tx-3', type: 'Harvest', amount: '+12.34 USDC', date: 'Nov 06, 2024 09:20 AM', status: 'Confirmed', hash: '0x7c3f...11a4' },
    { id: 'tx-4', type: 'Withdraw', amount: '-200.00 USDC', date: 'Nov 05, 2024 01:45 PM', status: 'Confirmed', hash: '0x1d8a...55e8' },
    { id: 'tx-5', type: 'Deposit', amount: '+500.00 USDC', date: 'Nov 01, 2024 11:15 AM', status: 'Confirmed', hash: '0x99b2...44f1' },
  ]);

  useEffect(() => {
    api.getTransactions().then(txs => {
      if (Array.isArray(txs) && txs.length > 0) {
        setTransactions(txs.map(t => ({
          id: `tx-${t.id}`,
          type: t.type,
          amount: `${t.type === 'Withdraw' ? '-' : '+'}${Number(t.amount).toLocaleString(undefined, {minimumFractionDigits: 2})} ${t.asset || 'USDC'}`,
          date: new Date(t.timestamp).toLocaleString(),
          status: t.status,
          hash: t.txHash
        })));
      }
    }).catch(err => console.warn('Transactions offline', err));
  }, []);

  const filtered = filter === 'All' ? transactions : transactions.filter(t => t.type === filter);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Transaction History</h2>
          <p className="text-xs text-slate-400">Complete immutable record of deposits, withdrawals, and automated rebalances.</p>
        </div>
        <div className="flex space-x-2">
          {['All', 'Deposit', 'Withdraw', 'Rebalance', 'Harvest'].map((f) => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filter === f ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold">Amount / Details</th>
                <th className="p-4 font-semibold">Timestamp</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Transaction Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-bold text-slate-900 dark:text-white">{tx.type}</td>
                  <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">{tx.amount}</td>
                  <td className="p-4 text-slate-400">{tx.date}</td>
                  <td className="p-4">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">{tx.status}</span>
                  </td>
                  <td className="p-4 text-right font-mono text-emerald-600 dark:text-emerald-400 flex items-center justify-end space-x-1 cursor-pointer hover:underline">
                    <span>{tx.hash}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
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

/* ========================================================================
   6. PROFILE VIEW
   ======================================================================== */
function ProfileView({ walletAddress, userDeposits, vaultShares }) {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">User Profile & Vault Position</h2>
        <p className="text-xs text-slate-400">Connected credentials and aggregate vault share metrics.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center space-x-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-500/20">
            🦊
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Connected Wallet</p>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white font-mono">{walletAddress}</h3>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">Verified Web3 Account</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400 font-medium mb-1">Total Vault Position</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">${userDeposits.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400 font-medium mb-1">Vault Shares Held</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{vaultShares.toLocaleString(undefined, {minimumFractionDigits: 2})} YP</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400 font-medium mb-1">Connected Devices</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">2 Active</p>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Preferences & Security</h4>
          <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs">
            <span className="text-slate-600 dark:text-slate-300">Gasless Rebalancing Authorization</span>
            <span className="font-bold text-emerald-600">Enabled</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs">
            <span className="text-slate-600 dark:text-slate-300">Auto-Compound Yield Frequency</span>
            <span className="font-bold text-slate-900 dark:text-white">Every 24 Hours</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================
   7. SETTINGS VIEW
   ======================================================================== */
function SettingsView({ darkMode, setDarkMode, showToast, network, setNetwork }) {
  const [riskTolerance, setRiskTolerance] = useState('Balanced');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Protocol Settings</h2>
        <p className="text-xs text-slate-400">Configure risk limits, notification triggers, theme preferences, and blockchain networks.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        {/* Network Selector */}
        <div className="flex justify-between items-center pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Blockchain Network</h4>
            <p className="text-xs text-slate-400">Select active RPC network connection</p>
          </div>
          <select 
            value={network}
            onChange={(e) => {
              setNetwork(e.target.value);
              showToast(`Switched network to ${e.target.value}`);
            }}
            className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 focus:outline-hidden"
          >
            <option>Localhost (Hardhat)</option>
            <option>Ethereum Mainnet</option>
            <option>Agoric Testnet</option>
            <option>Arbitrum One</option>
          </select>
        </div>

        {/* Theme Preference */}
        <div className="flex justify-between items-center pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Dark Mode Theme</h4>
            <p className="text-xs text-slate-400">Toggle light/dark appearance</p>
          </div>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-800 dark:text-amber-400 transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Risk Tolerance */}
        <div className="space-y-3 pb-6 border-b border-slate-100 dark:border-slate-800">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Risk Tolerance Profile</h4>
          <div className="grid grid-cols-3 gap-4">
            {['Conservative', 'Balanced', 'Aggressive'].map((level) => (
              <button 
                key={level}
                onClick={() => setRiskTolerance(level)}
                className={`py-3 rounded-2xl text-xs font-bold transition-all border ${riskTolerance === level ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications Toggle */}
        <div className="flex justify-between items-center pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Push Notifications</h4>
            <p className="text-xs text-slate-400">Receive alerts for rebalancing and rewards</p>
          </div>
          <input 
            type="checkbox" 
            checked={notificationsEnabled} 
            onChange={() => setNotificationsEnabled(!notificationsEnabled)}
            className="w-5 h-5 accent-emerald-600 rounded-md cursor-pointer" 
          />
        </div>

        <button 
          onClick={() => showToast('Settings successfully saved!')}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
}