export type VerificationType = 'none' | 'blue' | 'purple';
export type BanType = 'none' | 'temporary' | 'permanent';
export type GameEventType = 'coins_per_tap' | 'double_multiplier' | 'custom_boost';

export interface GameEvent {
  id?: string;
  title: string;
  description?: string;
  type: GameEventType;
  coinsPerTap: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  themeColor?: 'gold' | 'purple' | 'emerald' | 'crimson' | 'cyan';
}

export interface UserProfile {
  uid: string;
  username: string;
  usernameLower: string;
  password?: string;
  coins: number;
  isKing?: boolean;
  isVerified?: boolean;
  verificationType?: VerificationType;
  isBanned?: boolean;
  banType?: BanType;
  banReason?: string;
  bannedUntil?: string | null;
  bannedAt?: string | null;
  bannedBy?: string | null;
  isCollectingDisabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GlobalGameSettings {
  globalCollectingDisabled: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface LevelInfo {
  name: string;
  icon: string;
  color: string;
  bgGradient: string;
  borderColor: string;
  minCoins: number;
  nextCoins: number | null;
  levelNumber: number;
}

export interface DonationMessage {
  id: string;
  fromUsername: string;
  toUsername: string;
  toUid: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected';
  note?: string;
  createdAt: string;
}

export type ActiveTab = 'tapper' | 'search' | 'inbox' | 'leaderboard';
