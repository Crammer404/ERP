export interface BillCounts {
  bill_1000: number;
  bill_500: number;
  bill_200: number;
  bill_100: number;
  bill_50: number;
  bill_20: number;
  coin_20: number;
  coin_10: number;
  coin_5: number;
  coin_1: number;
  coin_0_25: number;
  coin_0_10: number;
  coin_0_05: number;
  coin_0_01: number;
}

export const BILLS = [
  { key: 'bill_1000' as keyof BillCounts, label: '1,000', value: 1000, type: 'bill', color: 'blue' },
  { key: 'bill_500' as keyof BillCounts, label: '500', value: 500, type: 'bill', color: 'yellow' },
  { key: 'bill_200' as keyof BillCounts, label: '200', value: 200, type: 'bill', color: 'green' },
  { key: 'bill_100' as keyof BillCounts, label: '100', value: 100, type: 'bill', color: 'violet' },
  { key: 'bill_50' as keyof BillCounts, label: '50', value: 50, type: 'bill', color: 'red' },
  { key: 'bill_20' as keyof BillCounts, label: '20', value: 20, type: 'bill', color: 'orange' },
];

export const COINS = [
  { key: 'coin_20' as keyof BillCounts, label: '20', value: 20, type: 'coin', color: 'yellow-orange' },
  { key: 'coin_10' as keyof BillCounts, label: '10', value: 10, type: 'coin', color: 'gold' },
  { key: 'coin_5' as keyof BillCounts, label: '5', value: 5, type: 'coin', color: 'light-yellow' },
  { key: 'coin_1' as keyof BillCounts, label: '1', value: 1, type: 'coin', color: 'silver' },
  { key: 'coin_0_25' as keyof BillCounts, label: '0.25', value: 0.25, type: 'coin', color: 'yellow' },
  { key: 'coin_0_10' as keyof BillCounts, label: '0.10', value: 0.10, type: 'coin', color: 'brown-copper' },
  { key: 'coin_0_05' as keyof BillCounts, label: '0.05', value: 0.05, type: 'coin', color: 'light-copper' },
  { key: 'coin_0_01' as keyof BillCounts, label: '0.01', value: 0.01, type: 'coin', color: 'natural-copper' },
];

export const DENOMINATIONS = [...BILLS, ...COINS];

export function getHighlightColorClasses(color: string, count: number) {
  const colorMap: Record<string, { border: string; bg: string; hoverBorder: string; hoverBg: string; badge: string; hoverBorderUnselected: string; hoverBgUnselected: string }> = {
    blue: {
      border: 'border-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      hoverBorder: 'hover:border-blue-600',
      hoverBg: 'hover:bg-blue-100 dark:hover:bg-blue-950/50',
      hoverBorderUnselected: 'hover:border-blue-400',
      hoverBgUnselected: 'hover:bg-blue-50 dark:hover:bg-blue-950/20',
      badge: 'bg-blue-500 text-white',
    },
    yellow: {
      border: 'border-yellow-500',
      bg: 'bg-yellow-50 dark:bg-yellow-950/30',
      hoverBorder: 'hover:border-yellow-600',
      hoverBg: 'hover:bg-yellow-100 dark:hover:bg-yellow-950/50',
      hoverBorderUnselected: 'hover:border-yellow-400',
      hoverBgUnselected: 'hover:bg-yellow-50 dark:hover:bg-yellow-950/20',
      badge: 'bg-yellow-500 text-white',
    },
    green: {
      border: 'border-green-500',
      bg: 'bg-green-50 dark:bg-green-950/30',
      hoverBorder: 'hover:border-green-600',
      hoverBg: 'hover:bg-green-100 dark:hover:bg-green-950/50',
      hoverBorderUnselected: 'hover:border-green-400',
      hoverBgUnselected: 'hover:bg-green-50 dark:hover:bg-green-950/20',
      badge: 'bg-green-500 text-white',
    },
    violet: {
      border: 'border-violet-500',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
      hoverBorder: 'hover:border-violet-600',
      hoverBg: 'hover:bg-violet-100 dark:hover:bg-violet-950/50',
      hoverBorderUnselected: 'hover:border-violet-400',
      hoverBgUnselected: 'hover:bg-violet-50 dark:hover:bg-violet-950/20',
      badge: 'bg-violet-500 text-white',
    },
    red: {
      border: 'border-red-500',
      bg: 'bg-red-50 dark:bg-red-950/30',
      hoverBorder: 'hover:border-red-600',
      hoverBg: 'hover:bg-red-100 dark:hover:bg-red-950/50',
      hoverBorderUnselected: 'hover:border-red-400',
      hoverBgUnselected: 'hover:bg-red-50 dark:hover:bg-red-950/20',
      badge: 'bg-red-500 text-white',
    },
    orange: {
      border: 'border-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      hoverBorder: 'hover:border-orange-600',
      hoverBg: 'hover:bg-orange-100 dark:hover:bg-orange-950/50',
      hoverBorderUnselected: 'hover:border-orange-400',
      hoverBgUnselected: 'hover:bg-orange-50 dark:hover:bg-orange-950/20',
      badge: 'bg-orange-500 text-white',
    },
    'yellow-orange': {
      border: 'border-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      hoverBorder: 'hover:border-amber-600',
      hoverBg: 'hover:bg-amber-100 dark:hover:bg-amber-950/50',
      hoverBorderUnselected: 'hover:border-amber-400',
      hoverBgUnselected: 'hover:bg-amber-50 dark:hover:bg-amber-950/20',
      badge: 'bg-amber-500 text-white',
    },
    'light-yellow': {
      border: 'border-yellow-300',
      bg: 'bg-yellow-50 dark:bg-yellow-950/20',
      hoverBorder: 'hover:border-yellow-400',
      hoverBg: 'hover:bg-yellow-100 dark:hover:bg-yellow-950/30',
      hoverBorderUnselected: 'hover:border-yellow-300',
      hoverBgUnselected: 'hover:bg-yellow-50 dark:hover:bg-yellow-950/10',
      badge: 'bg-yellow-300 text-yellow-900',
    },
    gold: {
      border: 'border-amber-600',
      bg: 'bg-amber-100 dark:bg-amber-950/40',
      hoverBorder: 'hover:border-amber-700',
      hoverBg: 'hover:bg-amber-200 dark:hover:bg-amber-950/60',
      hoverBorderUnselected: 'hover:border-amber-500',
      hoverBgUnselected: 'hover:bg-amber-50 dark:hover:bg-amber-950/20',
      badge: 'bg-amber-600 text-white',
    },
    silver: {
      border: 'border-slate-400',
      bg: 'bg-slate-100 dark:bg-slate-950/30',
      hoverBorder: 'hover:border-slate-500',
      hoverBg: 'hover:bg-slate-200 dark:hover:bg-slate-950/50',
      hoverBorderUnselected: 'hover:border-slate-400',
      hoverBgUnselected: 'hover:bg-slate-50 dark:hover:bg-slate-950/20',
      badge: 'bg-slate-400 text-white',
    },
    'brown-copper': {
      border: 'border-amber-800',
      bg: 'bg-amber-900/20 dark:bg-amber-950/40',
      hoverBorder: 'hover:border-amber-900',
      hoverBg: 'hover:bg-amber-900/30 dark:hover:bg-amber-950/60',
      hoverBorderUnselected: 'hover:border-amber-700',
      hoverBgUnselected: 'hover:bg-amber-900/10 dark:hover:bg-amber-950/20',
      badge: 'bg-amber-800 text-white',
    },
    'light-copper': {
      border: 'border-orange-600',
      bg: 'bg-orange-100 dark:bg-orange-950/30',
      hoverBorder: 'hover:border-orange-700',
      hoverBg: 'hover:bg-orange-200 dark:hover:bg-orange-950/50',
      hoverBorderUnselected: 'hover:border-orange-500',
      hoverBgUnselected: 'hover:bg-orange-50 dark:hover:bg-orange-950/20',
      badge: 'bg-orange-600 text-white',
    },
    'natural-copper': {
      border: 'border-orange-700',
      bg: 'bg-orange-200 dark:bg-orange-950/40',
      hoverBorder: 'hover:border-orange-800',
      hoverBg: 'hover:bg-orange-300 dark:hover:bg-orange-950/60',
      hoverBorderUnselected: 'hover:border-orange-600',
      hoverBgUnselected: 'hover:bg-orange-100 dark:hover:bg-orange-950/20',
      badge: 'bg-orange-700 text-white',
    },
  };

  const colorConfig = colorMap[color] || {
    border: 'border-primary',
    bg: 'bg-primary/10 dark:bg-primary/20',
    hoverBorder: 'hover:border-primary',
    hoverBg: 'hover:bg-primary/20 dark:hover:bg-primary/30',
    hoverBorderUnselected: 'hover:border-primary/50',
    hoverBgUnselected: 'hover:bg-primary/10 dark:hover:bg-primary/15',
    badge: 'bg-primary text-primary-foreground',
  };

  if (count === 0) {
    return {
      border: 'border-border',
      bg: 'bg-background',
      hoverBorder: colorConfig.hoverBorderUnselected,
      hoverBg: colorConfig.hoverBgUnselected,
      badge: 'bg-primary text-primary-foreground',
    };
  }

  return colorConfig;
}
