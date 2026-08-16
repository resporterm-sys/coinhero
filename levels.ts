import { LevelInfo } from '../types';

export const BASE_LEVELS: LevelInfo[] = [
  {
    name: 'برونزي',
    icon: '🥉',
    color: 'text-amber-700',
    bgGradient: 'from-amber-700/20 to-amber-900/30',
    borderColor: 'border-amber-700/50',
    minCoins: 0,
    nextCoins: 1000,
    levelNumber: 1
  },
  {
    name: 'فضي',
    icon: '🥈',
    color: 'text-slate-300',
    bgGradient: 'from-slate-400/20 to-slate-600/30',
    borderColor: 'border-slate-400/50',
    minCoins: 1000,
    nextCoins: 5000,
    levelNumber: 2
  },
  {
    name: 'ذهبي',
    icon: '🥇',
    color: 'text-yellow-400',
    bgGradient: 'from-yellow-500/20 to-amber-600/30',
    borderColor: 'border-yellow-400/50',
    minCoins: 5000,
    nextCoins: 25000,
    levelNumber: 3
  },
  {
    name: 'بلاتيني',
    icon: '💎',
    color: 'text-cyan-300',
    bgGradient: 'from-cyan-500/20 to-teal-700/30',
    borderColor: 'border-cyan-400/50',
    minCoins: 25000,
    nextCoins: 100000,
    levelNumber: 4
  },
  {
    name: 'ألماسي',
    icon: '💠',
    color: 'text-blue-400',
    bgGradient: 'from-blue-500/20 to-indigo-700/30',
    borderColor: 'border-blue-400/50',
    minCoins: 100000,
    nextCoins: 500000,
    levelNumber: 5
  },
  {
    name: 'ماستر',
    icon: '👑',
    color: 'text-purple-400',
    bgGradient: 'from-purple-500/20 to-indigo-800/30',
    borderColor: 'border-purple-400/50',
    minCoins: 500000,
    nextCoins: 2500000,
    levelNumber: 6
  },
  {
    name: 'جراند ماستر',
    icon: '🌟',
    color: 'text-pink-400',
    bgGradient: 'from-pink-500/20 to-purple-800/30',
    borderColor: 'border-pink-400/50',
    minCoins: 2500000,
    nextCoins: 10000000,
    levelNumber: 7
  },
  {
    name: 'أسطورة',
    icon: '⚡',
    color: 'text-red-400',
    bgGradient: 'from-red-500/20 to-orange-700/30',
    borderColor: 'border-red-400/50',
    minCoins: 10000000,
    nextCoins: 50000000,
    levelNumber: 8
  },
  {
    name: 'خرافي',
    icon: '🔥',
    color: 'text-orange-400',
    bgGradient: 'from-orange-500/20 to-red-800/30',
    borderColor: 'border-orange-400/50',
    minCoins: 50000000,
    nextCoins: 250000000,
    levelNumber: 9
  },
  {
    name: 'فائق',
    icon: '🌌',
    color: 'text-violet-400',
    bgGradient: 'from-violet-500/20 to-fuchsia-900/30',
    borderColor: 'border-violet-400/50',
    minCoins: 250000000,
    nextCoins: 1000000000,
    levelNumber: 10
  }
];

export function getLevelInfo(coins: number, isKing?: boolean): LevelInfo {
  if (isKing || coins >= 999999999999) {
    return {
      name: 'ملك الكوينز (اللانهاية ∞)',
      icon: '👑✨',
      color: 'text-amber-300',
      bgGradient: 'from-amber-400/30 via-yellow-500/40 to-amber-600/30',
      borderColor: 'border-amber-400 shadow-amber-500/50',
      minCoins: 1000000000,
      nextCoins: null,
      levelNumber: 999
    };
  }

  // Check base levels
  for (let i = BASE_LEVELS.length - 1; i >= 0; i--) {
    if (coins >= BASE_LEVELS[i].minCoins) {
      // If highest base level, check procedural infinite expansion
      if (i === BASE_LEVELS.length - 1 && coins >= 1000000000) {
        const extraBillions = Math.floor((coins - 1000000000) / 1000000000);
        const infinityLevelNum = 11 + extraBillions;
        const currentMin = 1000000000 + extraBillions * 1000000000;
        const currentNext = currentMin + 1000000000;
        return {
          name: `اللانهاية +${extraBillions + 1}`,
          icon: '✨∞',
          color: 'text-emerald-300',
          bgGradient: 'from-emerald-500/20 via-teal-600/30 to-cyan-800/30',
          borderColor: 'border-emerald-400/60',
          minCoins: currentMin,
          nextCoins: currentNext,
          levelNumber: infinityLevelNum
        };
      }
      return BASE_LEVELS[i];
    }
  }

  return BASE_LEVELS[0];
}

export function formatCoins(coins: number, isKing?: boolean): string {
  if (isKing || coins >= 999999999999) {
    return 'غير محدود (∞)';
  }
  return coins.toLocaleString('en-US');
}
