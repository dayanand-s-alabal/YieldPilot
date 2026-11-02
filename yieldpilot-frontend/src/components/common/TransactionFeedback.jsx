import { useState } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink, 
  Copy, 
  Check, 
  X,
  Clock
} from 'lucide-react';
import { getEtherscanTxUrl, truncateAddress } from '../../contracts/utils';

export function TransactionFeedback({ activeTx, onClear }) {
  const [copied, setCopied] = useState(false);

  if (!activeTx || activeTx.status === 'idle') return null;

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBadgeColor = (type) => {
    switch (type) {
      case 'USDC Approval': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Deposit': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Withdraw': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'Redemption': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Strategy Allocation': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Mint MockUSDC': return 'bg-teal-500/20 text-teal-400 border-teal-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-md transition-all ${
        activeTx.status === 'confirmed'
          ? 'bg-slate-900/95 border-emerald-500/50 text-white shadow-emerald-500/10'
          : activeTx.status === 'error'
          ? 'bg-slate-900/95 border-rose-500/50 text-white shadow-rose-500/10'
          : 'bg-slate-900/95 border-amber-500/50 text-white shadow-amber-500/10'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            {activeTx.status === 'confirmed' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            {activeTx.status === 'error' && (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            {(activeTx.status === 'submitting' || activeTx.status === 'pending') && (
              <RefreshCw className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
            )}
            <span className="font-bold text-sm">
              {activeTx.status === 'submitting' && 'Submitting Transaction'}
              {activeTx.status === 'pending' && 'Transaction Pending Confirmation'}
              {activeTx.status === 'confirmed' && 'Transaction Confirmed'}
              {activeTx.status === 'error' && 'Transaction Failed'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {activeTx.type && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getBadgeColor(activeTx.type)}`}>
                {activeTx.type}
              </span>
            )}
            {onClear && (
              <button 
                onClick={onClear} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Body Message */}
        <div className="py-3 text-xs text-slate-300 leading-relaxed">
          <p>{activeTx.message || activeTx.error}</p>
        </div>

        {/* Transaction details & Links */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          {activeTx.timestamp && (
            <div className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{new Date(activeTx.timestamp).toLocaleTimeString()}</span>
            </div>
          )}

          {activeTx.hash ? (
            <div className="flex items-center space-x-2 ml-auto">
              <span className="font-mono text-slate-300">
                {truncateAddress(activeTx.hash)}
              </span>
              <button
                onClick={() => handleCopy(activeTx.hash)}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                title="Copy Transaction Hash"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={getEtherscanTxUrl(activeTx.hash)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-0.5 text-emerald-400 hover:underline font-semibold"
              >
                <span>Sepolia Etherscan</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </div>
          ) : (
            <span className="text-[10px] text-slate-500 ml-auto">Sepolia Network</span>
          )}
        </div>
      </div>
    </div>
  );
}
