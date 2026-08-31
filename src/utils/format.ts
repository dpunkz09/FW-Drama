/**
 * Format a large number into a human-readable string.
 * e.g. 1_200_000 → "1.2M", 5_400 → "5.4K"
 */
export const formatCount = (n: number): string => {
  if (!n || isNaN(n)) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};
