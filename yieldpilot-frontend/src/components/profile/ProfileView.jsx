import { 
  User, 
  Wallet, 
  ExternalLink, 
  ShieldCheck, 
  Key, 
  CheckCircle2, 
  Sparkles,
  Layers
} from 'lucide-react';
import { CONTRACT_ADDRESSES } from '../../contracts/addresses';
import { getEtherscanAddressUrl, truncateAddress } from '../../contracts/utils';

export function ProfileView({ blockchainData }) {
  const {
    address,
    chainId,
    isSepolia,
    isVaultOwner,
    userUSDCBalanceFormatted,
    userSharesFormatted,
    userRedeemableAssetsFormatted,
  } = blockchainData;

  const contractsList = [
    { name: 'YieldVault', desc: 'ERC4626 Vault Shares Token', address: CONTRACT_ADDRESSES.YieldVault },
    { name: 'StrategyManager', desc: 'Portfolio Allocation Manager', address: CONTRACT_ADDRESSES.StrategyManager },
    { name: 'MockUSDC', desc: 'ERC20 Stablecoin Asset (6 Decimals)', address: CONTRACT_ADDRESSES.MockUSDC },
    { name: 'MockStrategy', desc: 'Active Yield Strategy', address: CONTRACT_ADDRESSES.MockStrategy },
    { name: 'RebalanceManager', desc: 'Automated Portfolio Rebalancer & Keeper', address: CONTRACT_ADDRESSES.RebalanceManager },
    { name: 'PriceOracle', desc: 'Chainlink Price Feed Oracle', address: CONTRACT_ADDRESSES.PriceOracle },
    { name: 'RiskManager', desc: 'Multi-Factor Risk Scoring Engine', address: CONTRACT_ADDRESSES.RiskManager },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Account Position & Contracts</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
          Connected Web3 credentials, portfolio standing, and verified Sepolia smart contract registry.
        </p>
      </div>

      {/* User Position */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-500/20">
              🦊
            </div>
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Connected MetaMask Wallet</p>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white font-mono">
                {address || 'Not Connected'}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  isSepolia
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold'
                }`}>
                  {isSepolia ? 'Sepolia Network (11155111)' : `Network ID: ${chainId || 'Unknown'}`}
                </span>
                {isVaultOwner && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                    Vault Owner
                  </span>
                )}
              </div>
            </div>
          </div>

          {address && (
            <a
              href={getEtherscanAddressUrl(address)}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors border border-slate-200 dark:border-slate-700"
            >
              <span>View On Etherscan</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* 3 Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1">Wallet MockUSDC</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">${userUSDCBalanceFormatted} USDC</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1">Vault Shares Held</p>
            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{userSharesFormatted} ypSHARE</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1">Redeemable Asset Value</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">${userRedeemableAssetsFormatted} USDC</p>
          </div>
        </div>
      </div>

      {/* Contract Registry */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Deployed Sepolia Contracts</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">All contracts deployed on Ethereum Sepolia Testnet (Chain ID 11155111)</p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {contractsList.map((c) => (
            <div key={c.name} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{c.desc}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold">
                  {c.address}
                </span>
                <a
                  href={getEtherscanAddressUrl(c.address)}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                  title="View on Sepolia Etherscan"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
