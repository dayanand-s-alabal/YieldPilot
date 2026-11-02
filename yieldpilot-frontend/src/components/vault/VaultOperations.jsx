import { useState } from 'react';
import { 
  Wallet, 
  Coins, 
  CheckCircle2, 
  RefreshCw, 
  Unlock
} from 'lucide-react';
import { parseUSDC, parseShares } from '../../contracts/utils';

export function VaultOperations({
  blockchainData,
  txManager,
}) {
  const {
    address,
    isConnected,
    raw,
    userUSDCBalanceFormatted,
    userSharesFormatted,
    userRedeemableAssetsFormatted,
    userAllowanceFormatted,
    refetch,
  } = blockchainData;

  const [activeTab, setActiveTab] = useState('deposit'); // 'deposit' | 'withdraw' | 'redeem'
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [redeemSharesAmount, setRedeemSharesAmount] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check allowance for deposit
  const parsedDepositAmount = parseUSDC(depositAmount);
  const hasSufficientAllowance = parsedDepositAmount > 0n && raw.userAllowance >= parsedDepositAmount;

  // Expected shares for deposit (ratio preview)
  const calcExpectedShares = (amountStr) => {
    const val = parseFloat(amountStr);
    if (!val || val <= 0) return '0.00';
    if (raw.vaultTotalAssets > 0n && raw.vaultTotalSupply > 0n) {
      const ratio = Number(raw.vaultTotalSupply) / Number(raw.vaultTotalAssets);
      return (val * ratio).toFixed(2);
    }
    return val.toFixed(2); // 1:1 initial deposit
  };

  // Expected shares to burn for withdraw
  const calcExpectedSharesToBurn = (amountStr) => {
    const val = parseFloat(amountStr);
    if (!val || val <= 0) return '0.00';
    if (raw.vaultTotalAssets > 0n && raw.vaultTotalSupply > 0n) {
      const ratio = Number(raw.vaultTotalSupply) / Number(raw.vaultTotalAssets);
      return (val * ratio).toFixed(2);
    }
    return val.toFixed(2);
  };

  // Expected assets received for redemption
  const calcExpectedAssetsForShares = (sharesStr) => {
    const val = parseFloat(sharesStr);
    if (!val || val <= 0) return '0.00';
    if (raw.vaultTotalAssets > 0n && raw.vaultTotalSupply > 0n) {
      const ratio = Number(raw.vaultTotalAssets) / Number(raw.vaultTotalSupply);
      return (val * ratio).toFixed(2);
    }
    return val.toFixed(2);
  };

  // 1. Handle Approve
  const handleApprove = async () => {
    if (!depositAmount || parsedDepositAmount <= 0n) return;
    setIsApproving(true);
    try {
      await txManager.approveUSDC(depositAmount);
      await refetch();
    } finally {
      setIsApproving(false);
    }
  };

  // 2. Handle Deposit
  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || parsedDepositAmount <= 0n) return;
    if (parsedDepositAmount > raw.userUSDCBalance) {
      alert('Insufficient MockUSDC balance in wallet');
      return;
    }
    setIsSubmitting(true);
    try {
      await txManager.deposit(depositAmount);
      setDepositAmount('');
      await refetch();
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Handle Withdraw
  const handleWithdraw = async (e) => {
    e.preventDefault();
    const parsedWithdraw = parseUSDC(withdrawAmount);
    if (!withdrawAmount || parsedWithdraw <= 0n) return;
    
    // Check if user has enough deposited assets
    const userMaxAssets = raw.vaultTotalSupply > 0n
      ? (raw.userShares * raw.vaultTotalAssets) / raw.vaultTotalSupply
      : 0n;

    if (parsedWithdraw > userMaxAssets) {
      alert('Insufficient redeemable balance in YieldVault');
      return;
    }

    setIsSubmitting(true);
    try {
      await txManager.withdraw(withdrawAmount);
      setWithdrawAmount('');
      await refetch();
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Handle Redeem
  const handleRedeem = async (e) => {
    e.preventDefault();
    const parsedRedeem = parseShares(redeemSharesAmount);
    if (!redeemSharesAmount || parsedRedeem <= 0n) return;
    if (parsedRedeem > raw.userShares) {
      alert('Insufficient ypSHARE shares in wallet');
      return;
    }

    setIsSubmitting(true);
    try {
      await txManager.redeemShares(redeemSharesAmount);
      setRedeemSharesAmount('');
      await refetch();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-8">
          <button
            onClick={() => setActiveTab('deposit')}
            className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'deposit'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Deposit USDC
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'withdraw'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Withdraw USDC
          </button>
          <button
            onClick={() => setActiveTab('redeem')}
            className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'redeem'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Redeem Shares
          </button>
        </div>

        {/* 1. DEPOSIT TAB */}
        {activeTab === 'deposit' && (
          <form onSubmit={handleDeposit} className="space-y-6">
            <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-xs text-slate-400 font-medium">Wallet MockUSDC Balance</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">${userUSDCBalanceFormatted} USDC</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 font-medium">Current Allowance</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">${userAllowanceFormatted} USDC</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Deposit Amount (USDC)</label>
                <span className="text-[11px] text-slate-400">Decimals: 6</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3.5 rounded-2xl font-bold text-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 border border-slate-200 dark:border-slate-700"
                />
                <button
                  type="button"
                  onClick={() => setDepositAmount((Number(raw.userUSDCBalance) / 1e6).toString())}
                  className="absolute right-3.5 top-3.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-xl text-xs font-bold hover:bg-emerald-500/20"
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Expected ypSHARE Minted:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ~{calcExpectedShares(depositAmount)} ypSHARE
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Exchange Rate:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">1 ypSHARE ≈ {raw.vaultTotalSupply > 0n ? (Number(raw.vaultTotalAssets) / Number(raw.vaultTotalSupply)).toFixed(4) : '1.0000'} USDC</span>
              </div>
            </div>

            {/* Approval and Deposit Buttons */}
            {!hasSufficientAllowance ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isApproving || txManager.isPending || !depositAmount || parsedDepositAmount <= 0n || !isConnected}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isApproving ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Approving MockUSDC on Sepolia...</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-5 h-5" />
                      <span>Step 1: Approve MockUSDC</span>
                    </>
                  )}
                </button>
                <p className="text-center text-[11px] text-slate-400">
                  You must authorize YieldVault to transfer your MockUSDC before depositing.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-xs text-emerald-600 dark:text-emerald-400 justify-center font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Allowance verified ({userAllowanceFormatted} USDC approved)</span>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || txManager.isPending || !depositAmount || parsedDepositAmount <= 0n || !isConnected}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Depositing into YieldVault...</span>
                    </>
                  ) : (
                    <>
                      <Wallet className="w-5 h-5" />
                      <span>Step 2: Confirm Deposit</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        )}

        {/* 2. WITHDRAW TAB */}
        {activeTab === 'withdraw' && (
          <form onSubmit={handleWithdraw} className="space-y-6">
            <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-xs text-slate-400 font-medium">Available Redeemable USDC</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">${userRedeemableAssetsFormatted} USDC</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 font-medium">Shares Balance</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{userSharesFormatted} ypSHARE</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Withdraw Amount (USDC)</label>
                <span className="text-[11px] text-slate-400">Assets requested</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3.5 rounded-2xl font-bold text-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 border border-slate-200 dark:border-slate-700"
                />
                <button
                  type="button"
                  onClick={() => {
                    const maxAssets = raw.vaultTotalSupply > 0n
                      ? (raw.userShares * raw.vaultTotalAssets) / raw.vaultTotalSupply
                      : 0n;
                    setWithdrawAmount((Number(maxAssets) / 1e6).toString());
                  }}
                  className="absolute right-3.5 top-3.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-xl text-xs font-bold hover:bg-emerald-500/20"
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Estimated Shares to Burn:</span>
                <span className="font-bold text-rose-500">
                  ~{calcExpectedSharesToBurn(withdrawAmount)} ypSHARE
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Receiver:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{address ? `${address.slice(0, 10)}...` : 'Connected Wallet'}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || txManager.isPending || !withdrawAmount || Number(withdrawAmount) <= 0 || !isConnected}
              className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Processing Withdrawal...</span>
                </>
              ) : (
                <>
                  <Coins className="w-5 h-5" />
                  <span>Confirm Withdrawal</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* 3. REDEEM TAB */}
        {activeTab === 'redeem' && (
          <form onSubmit={handleRedeem} className="space-y-6">
            <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-xs text-slate-400 font-medium">Your Vault Shares</p>
                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{userSharesFormatted} ypSHARE</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 font-medium">Estimated Asset Value</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">${userRedeemableAssetsFormatted} USDC</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Shares to Redeem (ypSHARE)</label>
                <span className="text-[11px] text-slate-400">Burn shares for USDC</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={redeemSharesAmount}
                  onChange={(e) => setRedeemSharesAmount(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3.5 rounded-2xl font-bold text-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 border border-slate-200 dark:border-slate-700"
                />
                <button
                  type="button"
                  onClick={() => setRedeemSharesAmount((Number(raw.userShares) / 1e6).toString())}
                  className="absolute right-3.5 top-3.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-xl text-xs font-bold hover:bg-indigo-500/20"
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Estimated USDC Received:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ~${calcExpectedAssetsForShares(redeemSharesAmount)} USDC
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || txManager.isPending || !redeemSharesAmount || Number(redeemSharesAmount) <= 0 || !isConnected}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Redeeming Shares...</span>
                </>
              ) : (
                <>
                  <Coins className="w-5 h-5" />
                  <span>Confirm Share Redemption</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
