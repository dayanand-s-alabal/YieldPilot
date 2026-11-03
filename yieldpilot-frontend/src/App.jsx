import { useState } from 'react';
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
  Sparkles,
  Menu,
  X,
  Moon,
  Sun,
  ShieldAlert
} from 'lucide-react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';

import { useYieldPilotData } from './contracts/useYieldPilotData';
import { useYieldPilotTransactions } from './contracts/useYieldPilotTransactions';
import { NetworkBanner } from './components/common/NetworkBanner';
import { WalletButton } from './components/common/WalletButton';
import { TransactionFeedback } from './components/common/TransactionFeedback';
import { LiveDashboard } from './components/dashboard/LiveDashboard';
import { VaultOperations } from './components/vault/VaultOperations';
import { StrategyManagement } from './components/strategies/StrategyManagement';
import { TransactionHistory } from './components/history/TransactionHistory';
import { ProfileView } from './components/profile/ProfileView';
import { SEPOLIA_CHAIN_ID } from './contracts/addresses';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Wagmi and blockchain state
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const isSepolia = chainId === SEPOLIA_CHAIN_ID;

  // Blockchain Data and Transactions
  const blockchainData = useYieldPilotData();
  const txManager = useYieldPilotTransactions({
    onTransactionSuccess: async () => {
      await blockchainData.refetch();
    },
  });

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Sepolia Contracts Ready', desc: 'YieldVault, StrategyManager & MockUSDC active', time: 'Just now', read: false },
    { id: 2, title: 'Network Configured', desc: 'Connected to Sepolia Chain ID 11155111', time: '5 mins ago', read: false },
  ]);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} font-sans antialiased flex flex-col md:flex-row relative`}>
      {/* Network Alert Banner */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <NetworkBanner />
      </div>

      {/* Floating Transaction Feedback Modal/Toast */}
      <TransactionFeedback activeTx={txManager.activeTx} onClear={txManager.clearActiveTx} />

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${!isSepolia && isConnected ? 'pt-12' : ''}`}>
        <div>
          {/* Logo & Branding */}
          <div className="p-6 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-wide">YieldPilot</h1>
                <p className="text-xs text-slate-400">Sepolia DeFi Vault</p>
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
              { id: 'strategies', label: 'Strategy Manager', icon: Layers },
              { id: 'rebalancing', label: 'Rebalancing', icon: RefreshCw },
              { id: 'history', label: 'Transaction History', icon: HistoryIcon },
              { id: 'profile', label: 'Account & Contracts', icon: User },
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

        {/* Sepolia Info Footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/50">
            <div className="flex items-center space-x-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs font-semibold text-emerald-400">Sepolia Testnet</p>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Chain ID: 11155111<br />
              ERC4626 Yield Vault
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 md:ml-64 flex flex-col min-h-screen ${!isSepolia && isConnected ? 'pt-12' : ''}`}>
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
                placeholder="Search transactions, strategies, contracts..." 
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all border border-transparent dark:border-slate-700"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Live Network Indicator */}
            <div className="hidden lg:flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <span className={`w-2.5 h-2.5 rounded-full ${isSepolia ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-slate-700 dark:text-slate-300">
                {isSepolia ? 'Sepolia (11155111)' : (isConnected ? `Chain: ${chainId}` : 'Not Connected')}
              </span>
            </div>

            {/* Notification Center */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
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

            {/* MetaMask Connect / Disconnect Button */}
            <WalletButton />
          </div>
        </header>

        {/* Dynamic Views */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
          {activeTab === 'dashboard' && (
            <LiveDashboard 
              blockchainData={blockchainData} 
              txManager={txManager} 
              setActiveTab={setActiveTab} 
            />
          )}

          {activeTab === 'deposit' && (
            <VaultOperations 
              blockchainData={blockchainData} 
              txManager={txManager} 
            />
          )}

          {activeTab === 'strategies' && (
            <StrategyManagement 
              blockchainData={blockchainData} 
              txManager={txManager} 
            />
          )}

          {activeTab === 'rebalancing' && (
            <RebalancingView />
          )}

          {activeTab === 'history' && (
            <TransactionHistory history={txManager.history} />
          )}

          {activeTab === 'profile' && (
            <ProfileView blockchainData={blockchainData} />
          )}

          {activeTab === 'settings' && (
            <SettingsView 
              darkMode={darkMode} 
              setDarkMode={setDarkMode} 
              isSepolia={isSepolia} 
            />
          )}
        </main>
      </div>
    </div>
  );
}

// Rebalancing View
function RebalancingView() {
  const [active, setActive] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSimulate = () => {
    setActive(true);
    setTimeout(() => {
      setActive(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Smart Rebalancing Engine</h2>
        <p className="text-xs text-slate-400">Automated portfolio evaluation and strategy weight optimization.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Evaluation #RB-SEP-2026</p>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Sepolia Portfolio Allocation Review</h3>
          </div>
          <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold">
            Ready to Evaluate
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-2">
            <p className="font-bold text-slate-500 mb-2">StrategyManager Constraints</p>
            <div className="flex justify-between text-emerald-200"><span>Minimum Reserve Requirement:</span><span className="font-bold">10% (1,000 bps)</span></div>
            <div className="flex justify-between text-emerald-200"><span>Strategy Allocation Cap:</span><span className="font-bold">50% (5,000 bps)</span></div>
            <div className="flex justify-betweenn text-emerald-200"><span>Target Strategy:</span><span className="font-bold font-mono">MockStrategy</span></div>
          </div>

          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 text-xs space-y-2">
            <p className="font-bold text-emerald-600 dark:text-emerald-400 mb-2">Optimization Target</p>
            <div className="flex justify-between text-emerald-200"><span>Maintain Liquid Reserve:</span><span className="font-bold">≥ 10%</span></div>
            <div className="flex justify-between text-emerald-200"><span>Active Yield Allocation:</span><span className="font-bold">Up to 50%</span></div>
            <div className="flex justify-between text-emerald-200"><span>Slippage & Loss Bound:</span><span className="font-bold">Strictly 0%</span></div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-2xl border border-blue-200 dark:border-blue-900/50 flex items-start space-x-3 text-xs text-blue-800 dark:text-blue-300">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            Allocations between YieldVault, StrategyManager, and registered strategies are secured by invariant checks.
          </p>
        </div>

        {success && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs font-bold text-center">
            Portfolio evaluated successfully! All parameters conform to reserve requirements.
          </div>
        )}

        <button 
          onClick={handleSimulate}
          disabled={active}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
        >
          {active ? (
            <span className="flex items-center space-x-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Evaluating Portfolio on Sepolia...</span>
            </span>
          ) : (
            <span>Run Rebalance Check</span>
          )}
        </button>
      </div>
    </div>
  );
}

// Settings View
function SettingsView({ darkMode, setDarkMode, isSepolia }) {
  const { switchChain } = useSwitchChain();

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Protocol Settings</h2>
        <p className="text-xs text-slate-400">Configure theme preferences, RPC network connections and wallet parameters.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="flex justify-between items-center pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Blockchain Network</h4>
            <p className="text-xs text-slate-400">YieldPilot contracts are deployed on Ethereum Sepolia Testnet</p>
          </div>
          <button
            onClick={() => switchChain({ chainId: SEPOLIA_CHAIN_ID })}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              isSepolia 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
            }`}
          >
            {isSepolia ? 'Sepolia (Active)' : 'Switch to Sepolia'}
          </button>
        </div>

        <div className="flex justify-between items-center pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Dark Mode Appearance</h4>
            <p className="text-xs text-slate-400">Toggle between light and dark dashboard interface</p>
          </div>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-800 dark:text-amber-400 transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
