import { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { LogOut, ExternalLink, Copy, Check, ChevronDown, AlertTriangle } from 'lucide-react';
import { SEPOLIA_CHAIN_ID } from '../../contracts/addresses';
import { truncateAddress, getEtherscanAddressUrl } from '../../contracts/utils';

export function WalletButton() {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const isSepolia = chainId === SEPOLIA_CHAIN_ID;

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = () => {
    const metaMaskConnector = connectors.find((c) => c.id === 'metaMask') || connectors[0];
    if (metaMaskConnector) {
      connect({ connector: metaMaskConnector });
    }
  };

  if (!isConnected) {
    return (
      <div className="relative">
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all border border-emerald-400/20"
        >
          <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center text-xs">
            🦊
          </div>
          <span>{isConnecting ? 'Connecting MetaMask...' : 'Connect MetaMask'}</span>
        </button>
        {connectError && (
          <div className="absolute right-0 top-full mt-2 w-64 p-2 bg-rose-950/90 border border-rose-500/50 rounded-xl text-rose-200 text-[11px] shadow-xl z-50">
            {connectError.shortMessage || connectError.message || 'Connection failed'}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center space-x-2.5 bg-slate-900 dark:bg-slate-800 text-white px-3.5 py-2 rounded-xl font-semibold text-xs sm:text-sm hover:bg-slate-800 dark:hover:bg-slate-700 transition-all shadow-md border border-slate-700"
      >
        <span className={`w-2.5 h-2.5 rounded-full ${isSepolia ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
        <span className="font-mono">{truncateAddress(address)}</span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {menuOpen && (
        <div 
          className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-3 z-50 animate-in fade-in slide-in-from-top-2"
          onClick={() => setMenuOpen(false)}
        >
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[11px] text-slate-400 font-medium">Connected Wallet</p>
            <p className="text-xs font-mono font-bold text-slate-900 dark:text-white truncate">{address}</p>
            <div className="mt-1 flex items-center space-x-1.5">
              <span className={`w-2 h-2 rounded-full ${isSepolia ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {isSepolia ? 'Sepolia Testnet (11155111)' : `Network ID: ${chainId || 'Unknown'}`}
              </span>
            </div>
          </div>

          {!isSepolia && (
            <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-y border-amber-200 dark:border-amber-900/50">
              <div className="flex items-center space-x-1.5 text-amber-700 dark:text-amber-400 text-xs font-bold mb-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Wrong Network</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  switchChain({ chainId: SEPOLIA_CHAIN_ID });
                }}
                className="w-full py-1.5 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-amber-400 transition-colors"
              >
                Switch to Sepolia
              </button>
            </div>
          )}

          <div className="p-2 space-y-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
            >
              <div className="flex items-center space-x-2">
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Address Copied!' : 'Copy Address'}</span>
              </div>
            </button>

            <a
              href={getEtherscanAddressUrl(address)}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
            >
              <div className="flex items-center space-x-2">
                <ExternalLink className="w-4 h-4" />
                <span>View on Sepolia Etherscan</span>
              </div>
            </a>

            <button
              onClick={() => disconnect()}
              className="w-full flex items-center space-x-2 px-3 py-2 text-xs rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Disconnect Wallet</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
