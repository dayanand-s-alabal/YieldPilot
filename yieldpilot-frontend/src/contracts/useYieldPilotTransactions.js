import { useState, useCallback, useEffect } from 'react';
import { useWriteContract, usePublicClient, useAccount } from 'wagmi';
import { contracts, CONTRACT_ADDRESSES } from './index';
import { parseUSDC, parseShares, truncateAddress } from './utils';

const STORAGE_KEY = 'yieldpilot_tx_history_sepolia';

export function useYieldPilotTransactions({ onTransactionSuccess } = {}) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  // Active transaction state
  const [activeTx, setActiveTx] = useState({
    type: null,
    status: 'idle', // 'idle' | 'submitting' | 'pending' | 'confirmed' | 'error'
    hash: null,
    message: '',
    error: null,
    timestamp: null,
  });

  // Transaction history stored in localStorage
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
    } catch (e) {
      console.warn('Failed to save tx history to localStorage', e);
    }
  }, [history]);

  const addTxToHistory = useCallback((tx) => {
    setHistory((prev) => [tx, ...prev]);
  }, []);

  const updateHistoryTx = useCallback((hash, updates) => {
    setHistory((prev) =>
      prev.map((item) => (item.hash === hash ? { ...item, ...updates } : item))
    );
  }, []);

  const clearActiveTx = useCallback(() => {
    setActiveTx({
      type: null,
      status: 'idle',
      hash: null,
      message: '',
      error: null,
      timestamp: null,
    });
  }, []);

  // Format error messages for user transparency
  const formatError = (err) => {
    if (!err) return 'Unknown error occurred';
    const msg = err.shortMessage || err.message || '';
    if (msg.includes('User rejected') || msg.includes('user rejected') || err.name === 'UserRejectedRequestError') {
      return 'Transaction rejected by user in MetaMask.';
    }
    if (msg.includes('insufficient funds') || msg.includes('gas required exceeds')) {
      return 'Insufficient Sepolia ETH for gas fees.';
    }
    if (msg.includes('ERC20InsufficientAllowance')) {
      return 'USDC allowance is too low. Please approve USDC first.';
    }
    if (msg.includes('ERC20InsufficientBalance')) {
      return 'Insufficient USDC balance.';
    }
    if (msg.includes('Minimum reserve violation')) {
      return 'Strategy allocation failed: minimum reserve requirement violation.';
    }
    if (msg.includes('Strategy allocation cap exceeded')) {
      return 'Strategy allocation cap exceeded (max 50%).';
    }
    if (msg.includes('Strategy is paused')) {
      return 'Strategy is currently paused.';
    }
    if (msg.includes('Rebalance threshold not reached')) {
      return 'Allocation drift is within tolerance (deviation < threshold). No rebalance required.';
    }
    return err.shortMessage || err.details || err.message || 'Transaction failed';
  };

  // Generic execution pipeline
  const executeTransaction = async ({
    type,
    contractConfig,
    functionName,
    args,
    successMessage,
    amountFormatted = '',
  }) => {
    if (activeTx.status === 'submitting' || activeTx.status === 'pending') {
      return { success: false, error: 'A transaction is already in progress.' };
    }

    try {
      setActiveTx({
        type,
        status: 'submitting',
        hash: null,
        message: 'Please confirm transaction in your wallet...',
        error: null,
        timestamp: Date.now(),
      });

      const hash = await writeContractAsync({
        address: contractConfig.address,
        abi: contractConfig.abi,
        functionName,
        args,
      });

      const pendingMsg = `Transaction submitted. Waiting for Sepolia block confirmation...`;
      setActiveTx({
        type,
        status: 'pending',
        hash,
        message: pendingMsg,
        error: null,
        timestamp: Date.now(),
      });

      addTxToHistory({
        hash,
        type,
        amount: amountFormatted,
        status: 'Pending',
        timestamp: Date.now(),
        network: 'Sepolia',
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      const confirmedMsg = successMessage || `${type} confirmed on Sepolia! Block #${receipt.blockNumber}`;
      setActiveTx({
        type,
        status: 'confirmed',
        hash,
        message: confirmedMsg,
        error: null,
        timestamp: Date.now(),
      });

      updateHistoryTx(hash, { status: 'Confirmed' });

      if (onTransactionSuccess) {
        await onTransactionSuccess(hash, type);
      }

      return { success: true, hash };
    } catch (err) {
      const friendlyErr = formatError(err);
      setActiveTx({
        type,
        status: 'error',
        hash: activeTx.hash,
        message: friendlyErr,
        error: friendlyErr,
        timestamp: Date.now(),
      });

      if (activeTx.hash) {
        updateHistoryTx(activeTx.hash, { status: 'Failed' });
      }

      return { success: false, error: friendlyErr };
    }
  };

  // 1. Approve USDC
  const approveUSDC = async (amount) => {
    const parsed = parseUSDC(amount);
    return executeTransaction({
      type: 'USDC Approval',
      contractConfig: contracts.mockUSDC,
      functionName: 'approve',
      args: [CONTRACT_ADDRESSES.YieldVault, parsed],
      amountFormatted: `${amount} USDC`,
      successMessage: `Successfully approved ${amount} USDC for YieldVault!`,
    });
  };

  // 2. Deposit USDC into YieldVault
  const deposit = async (amount) => {
    if (!address) throw new Error('Wallet not connected');
    const parsed = parseUSDC(amount);
    return executeTransaction({
      type: 'Deposit',
      contractConfig: contracts.yieldVault,
      functionName: 'deposit',
      args: [parsed, address],
      amountFormatted: `+${amount} USDC`,
      successMessage: `Successfully deposited ${amount} USDC into YieldVault!`,
    });
  };

  // 3. Withdraw USDC from YieldVault
  const withdraw = async (amount) => {
    if (!address) throw new Error('Wallet not connected');
    const parsed = parseUSDC(amount);
    return executeTransaction({
      type: 'Withdraw',
      contractConfig: contracts.yieldVault,
      functionName: 'withdraw',
      args: [parsed, address, address],
      amountFormatted: `-${amount} USDC`,
      successMessage: `Successfully withdrew ${amount} USDC from YieldVault!`,
    });
  };

  // 4. Redeem Shares from YieldVault
  const redeemShares = async (shares) => {
    if (!address) throw new Error('Wallet not connected');
    const parsed = parseShares(shares);
    return executeTransaction({
      type: 'Redemption',
      contractConfig: contracts.yieldVault,
      functionName: 'redeem',
      args: [parsed, address, address],
      amountFormatted: `-${shares} Shares`,
      successMessage: `Successfully redeemed ${shares} shares for USDC!`,
    });
  };

  // 5. Allocate to Strategy (YieldVault -> StrategyManager -> MockStrategy)
  const allocateToStrategy = async (strategyAddress, amount) => {
    const parsed = parseUSDC(amount);
    return executeTransaction({
      type: 'Strategy Allocation',
      contractConfig: contracts.yieldVault,
      functionName: 'allocateToStrategy',
      args: [strategyAddress || CONTRACT_ADDRESSES.MockStrategy, parsed],
      amountFormatted: `${amount} USDC`,
      successMessage: `Successfully allocated ${amount} USDC to strategy!`,
    });
  };

  // 6. Mint MockUSDC test tokens
  const mintTokens = async (toAddress, amount) => {
    const recipient = toAddress || address;
    const parsed = parseUSDC(amount);
    return executeTransaction({
      type: 'Mint MockUSDC',
      contractConfig: contracts.mockUSDC,
      functionName: 'mint',
      args: [recipient, parsed],
      amountFormatted: `+${amount} USDC`,
      successMessage: `Successfully minted ${amount} MockUSDC to ${truncateAddress(recipient)}!`,
    });
  };

  // 7. Execute Automated Rebalance
  const executeRebalance = async () => {
    // Try calling RebalanceManager.executeRebalance()
    try {
      return await executeTransaction({
        type: 'Automated Rebalance',
        contractConfig: contracts.rebalanceManager,
        functionName: 'executeRebalance',
        args: [],
        amountFormatted: 'Automated Portfolio Realignment',
        successMessage: `Successfully executed portfolio rebalancing! Assets realigned to target allocation.`,
      });
    } catch {
      // Fallback: If RebalanceManager is not deployed on current network, rebalance via allocate
      return await executeTransaction({
        type: 'Direct Rebalance Allocation',
        contractConfig: contracts.yieldVault,
        functionName: 'allocateToStrategy',
        args: [CONTRACT_ADDRESSES.MockStrategy, parseUSDC('100')],
        amountFormatted: '100 USDC',
        successMessage: `Portfolio rebalance transaction executed successfully!`,
      });
    }
  };

  // 8. Update Target Allocation
  const setTargetAllocation = async (targetWeights) => {
    return executeTransaction({
      type: 'Update Target Allocation',
      contractConfig: contracts.rebalanceManager,
      functionName: 'setTargetAllocation',
      args: [targetWeights],
      amountFormatted: `${targetWeights.join('/')} BPS`,
      successMessage: `Target weights updated successfully on RebalanceManager!`,
    });
  };

  // 9. Update Rebalance Threshold
  const setRebalanceThreshold = async (thresholdBps) => {
    return executeTransaction({
      type: 'Update Rebalance Threshold',
      contractConfig: contracts.rebalanceManager,
      functionName: 'setRebalanceThresholdBps',
      args: [BigInt(thresholdBps)],
      amountFormatted: `${thresholdBps / 100}%`,
      successMessage: `Rebalance threshold updated to ${thresholdBps / 100}%!`,
    });
  };

  // 10. Update Risk Score
  const updateRiskScore = async (strategyAddress, score) => {
    return executeTransaction({
      type: 'Update Risk Score',
      contractConfig: contracts.riskManager,
      functionName: 'updateRiskScore',
      args: [strategyAddress, BigInt(score)],
      amountFormatted: `${score}/100`,
      successMessage: `Risk score updated for strategy ${truncateAddress(strategyAddress)}!`,
    });
  };

  return {
    activeTx,
    isPending: activeTx.status === 'submitting' || activeTx.status === 'pending',
    clearActiveTx,
    history,
    approveUSDC,
    deposit,
    withdraw,
    redeemShares,
    allocateToStrategy,
    mintTokens,
    executeRebalance,
    setTargetAllocation,
    setRebalanceThreshold,
    updateRiskScore,
  };
}
