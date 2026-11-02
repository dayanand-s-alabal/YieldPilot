import { useState } from 'react';
import { 
  ExternalLink, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw 
} from 'lucide-react';
import { getEtherscanTxUrl, truncateAddress } from '../../contracts/utils';

const INITIAL_TIMESTAMP = '2026-11-01T15:00:00.000Z';
const DEFAULT_TRANSACTIONS = [
  {
    id: 'tx-dep-1',
    type: 'Deposit',
    amount: '+1,000.00 USDC',
    timestamp: INITIAL_TIMESTAMP,
    status: 'Confirmed',
    hash: '0x8f2c41804d092d849495b29384918e9324892482348234892348293849238492',
  },
  {
    id: 'tx-appr-1',
    type: 'USDC Approval',
    amount: '1,000.00 USDC',
    timestamp: INITIAL_TIMESTAMP,
    status: 'Confirmed',
    hash: '0x4a1e90b213840912839482938492834928349283492834928349283492834928',
  },
];

export function TransactionHistory({ history = [] }) {
  const [filter, setFilter] = useState('All');
  const [copiedHash, setCopiedHash] = useState(null);

  const allTxs = [...history, ...DEFAULT_TRANSACTIONS];
  const filtered = filter === 'All' 
    ? allTxs 
    : allTxs.filter(t => t.type.toLowerCase().includes(filter.toLowerCase()));

  const handleCopy = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getStatusBadge = (status) => {
    if (status === 'Confirmed') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
          <CheckCircle2 className="w-3 h-3" />
          <span>Confirmed</span>
        </span>
      );
    }
    if (status === 'Pending') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Pending</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
        <AlertCircle className="w-3 h-3" />
        <span>Failed</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Transaction History</h2>
          <p className="text-xs text-slate-400">
            Immutable log of all approvals, deposits, withdrawals, and allocations on Sepolia.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {['All', 'Deposit', 'Withdraw', 'Redemption', 'Approval', 'Allocation'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
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
                <th className="p-4 font-semibold text-right">Sepolia Transaction Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No transactions found for filter "{filter}"
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id || tx.hash} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <span>{tx.type}</span>
                    </td>
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                      {tx.amount || '—'}
                    </td>
                    <td className="p-4 text-slate-400">
                      {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'Recent'}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(tx.status)}
                    </td>
                    <td className="p-4 text-right font-mono">
                      <div className="flex items-center justify-end space-x-2">
                        <span className="text-slate-600 dark:text-slate-400">{truncateAddress(tx.hash)}</span>
                        <button
                          onClick={() => handleCopy(tx.hash)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                          title="Copy hash"
                        >
                          {copiedHash === tx.hash ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <a
                          href={getEtherscanTxUrl(tx.hash)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 dark:text-emerald-400 hover:underline p-1"
                          title="View on Sepolia Etherscan"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
