import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { SEPOLIA_CHAIN_ID } from '../../contracts/addresses';

export function NetworkBanner() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending, error } = useSwitchChain();

  if (!isConnected) return null;

  const isWrongNetwork = chainId !== SEPOLIA_CHAIN_ID;
  if (!isWrongNetwork) return null;

  const handleSwitch = () => {
    try {
      switchChain({ chainId: SEPOLIA_CHAIN_ID });
    } catch (e) {
      console.error('Failed to initiate switch:', e);
    }
  };

  return (
    <div className="bg-amber-500 text-slate-950 px-4 py-3 shadow-md border-b border-amber-600">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>
            Incorrect network detected (Chain ID: {chainId || 'Unknown'}). YieldPilot is deployed on <strong>Sepolia (Chain ID: 11155111)</strong>.
          </span>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleSwitch}
            disabled={isPending}
            className="bg-slate-950 text-amber-400 hover:bg-slate-900 px-3.5 py-1.5 rounded-xl font-bold transition-all shadow-sm flex items-center space-x-1.5"
          >
            {isPending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Switching...</span>
              </>
            ) : (
              <span>Switch to Sepolia</span>
            )}
          </button>
        </div>
      </div>
      {error && (
        <div className="max-w-7xl mx-auto text-center text-xs text-rose-900 mt-1 font-medium">
          {error.shortMessage || error.message || 'Failed to switch network'}
        </div>
      )}
    </div>
  );
}
