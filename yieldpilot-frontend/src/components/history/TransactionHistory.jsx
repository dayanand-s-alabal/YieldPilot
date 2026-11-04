import { useState } from 'react';
import { 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Layers,
  Coins
} from 'lucide-react';
import { getEtherscanTxUrl, truncateAddress } from '../../contracts/utils';

export function TransactionHistory({ history = [] }) {
  const [filter, setFilter] = useState('All'); // 'All' | 'Deposit' | 'Withdraw' | 'Redemption' | 'Approval' | 'Allocation'

  const filtered = history.filter((item) => {
    if (filter === 'All') return true;
    if (filter === 'Deposit') return item.type?.toLowerCase().includes('deposit');
    if (filter === 'Withdraw') return item.type?.toLowerCase().includes('withdraw');
    if (filter === 'Redemption') return item.type?.toLowerCase().includes('redemption') || item.type?.toLowerCase().includes('redeem');
    if (filter === 'Approval') return item.type?.toLowerCase().includes('approval');
    if (filter === 'Allocation') return item.type?.toLowerCase().includes('allocation');
    return true;
  });

  const getStatusBadge = (status) => {
    if (status === 'Confirmed' || status === 'Success') {
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
          <Clock className="w-3 h-3 animate-spin" />
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
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
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
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 bg-slate-50/80 dark:bg-slate-800/50">
                <th className="p-4 font-bold">Type</th>
                <th className="p-4 font-bold">Amount / Details</th>
                <th className="p-4 font-bold">Timestamp</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Sepolia Transaction Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                    No transactions found for filter "{filter}"
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id || tx.hash} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <span>{tx.type}</span>
                    </td>
                    <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                      {tx.amount || '—'}
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 font-medium">
                      {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'Recent'}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(tx.status)}
                    </td>
                    <td className="p-4 text-right">
                      {tx.hash ? (
                        <a
                          href={getEtherscanTxUrl(tx.hash)}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center space-x-1 font-bold"
                        >
                          <span>{truncateAddress(tx.hash)}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="font-mono text-slate-400 dark:text-slate-600">Pending</span>
                      )}
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
