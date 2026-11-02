import { ExternalLink } from 'lucide-react';
import { CONTRACT_ADDRESSES } from '../../contracts/addresses';
import { getEtherscanAddressUrl } from '../../contracts/utils';

export function ProfileView({ blockchainData }) {
  const {
    address,
    isSepolia,
    chainId,
    userUSDCBalanceFormatted,
    userSharesFormatted,
    userRedeemableAssetsFormatted,
    isVaultOwner,
  } = blockchainData;

  const contractsList = [
    { name: 'MockUSDC', desc: 'Test Token (6 Decimals)', address: CONTRACT_ADDRESSES.MockUSDC },
    { name: 'YieldVault', desc: 'ERC4626 Yield Vault (Shares & Deposits)', address: CONTRACT_ADDRESSES.YieldVault },
    { name: 'StrategyManager', desc: 'Strategy Orchestrator & Allocator', address: CONTRACT_ADDRESSES.StrategyManager },
    { name: 'MockStrategy', desc: 'Active Yield Strategy', address: CONTRACT_ADDRESSES.MockStrategy },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Account Position & Contracts</h2>
        <p className="text-xs text-slate-400">
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
              <p className="text-xs text-slate-400 font-medium">Connected MetaMask Wallet</p>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white font-mono">
                {address || 'Not Connected'}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  isSepolia
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                }`}>
                  {isSepolia ? 'Sepolia Network (11155111)' : `Network ID: ${chainId || 'Unknown'}`}
                </span>
                {isVaultOwner && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400">
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
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <span>View On Etherscan</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* 3 Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400 font-medium mb-1">Wallet MockUSDC</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">${userUSDCBalanceFormatted} USDC</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400 font-medium mb-1">Vault Shares Held</p>
            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{userSharesFormatted} ypSHARE</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400 font-medium mb-1">Redeemable Asset Value</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">${userRedeemableAssetsFormatted} USDC</p>
          </div>
        </div>
      </div>

      {/* Contract Registry */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Deployed Sepolia Contracts</h3>
          <p className="text-xs text-slate-400">All contracts deployed on Ethereum Sepolia Testnet (Chain ID 11155111)</p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {contractsList.map((c) => (
            <div key={c.name} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</p>
                <p className="text-xs text-slate-400">{c.desc}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  {c.address}
                </span>
                <a
                  href={getEtherscanAddressUrl(c.address)}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-emerald-600 hover:text-emerald-700"
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
