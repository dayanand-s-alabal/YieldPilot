import { formatUnits, parseUnits } from 'viem';

export const USDC_DECIMALS = 6;
export const SHARES_DECIMALS = 6;

export function formatUSDC(value, fractionDigits = 2) {
  if (value == null) return '0.00';
  try {
    const raw = typeof value === 'bigint' ? value : BigInt(value.toString());
    const formatted = formatUnits(raw, USDC_DECIMALS);
    const num = parseFloat(formatted);
    return isNaN(num) ? '0.00' : num.toLocaleString(undefined, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  } catch {
    return '0.00';
  }
}

export function formatShares(value, fractionDigits = 2) {
  if (value == null) return '0.00';
  try {
    const raw = typeof value === 'bigint' ? value : BigInt(value.toString());
    const formatted = formatUnits(raw, SHARES_DECIMALS);
    const num = parseFloat(formatted);
    return isNaN(num) ? '0.00' : num.toLocaleString(undefined, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  } catch {
    return '0.00';
  }
}

export function parseUSDC(value) {
  if (!value || isNaN(Number(value))) return 0n;
  const clean = value.toString().trim();
  const parts = clean.split('.');
  const sanitized = parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, USDC_DECIMALS)}` : clean;
  return parseUnits(sanitized, USDC_DECIMALS);
}

export function parseShares(value) {
  if (!value || isNaN(Number(value))) return 0n;
  const clean = value.toString().trim();
  const parts = clean.split('.');
  const sanitized = parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, SHARES_DECIMALS)}` : clean;
  return parseUnits(sanitized, SHARES_DECIMALS);
}

export function truncateAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getEtherscanTxUrl(hash) {
  if (!hash) return '#';
  return `https://sepolia.etherscan.io/tx/${hash}`;
}

export function getEtherscanAddressUrl(address) {
  if (!address) return '#';
  return `https://sepolia.etherscan.io/address/${address}`;
}
