/**
 * Format address for display
 */
export function formatAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format number with commas
 */
export function formatNumber(num: number | string, decimals = 2): string {
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(numValue)) return '0.00';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue);
}

/**
 * Format token amount with proper decimals
 */
export function formatTokenAmount(amount: string | number, decimals = 18): string {
  const amountStr = amount.toString();
  const [whole, fraction = ''] = amountStr.split('.');
  
  if (fraction.length <= decimals) {
    return amountStr;
  }
  
  return `${whole}.${fraction.slice(0, decimals)}`;
}

/**
 * Parse token amount to smallest unit (wei)
 */
export function parseTokenAmount(amount: string, decimals = 18): bigint {
  try {
    const [whole = '0', fraction = ''] = amount.split('.');
    const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(whole + paddedFraction);
  } catch {
    return BigInt(0);
  }
}

