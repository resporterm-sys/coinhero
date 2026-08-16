import React from 'react';
import { Crown, Search, Mail, Trophy, LogOut, Coins, Flame, Sparkles } from 'lucide-react';
import { UserProfile, ActiveTab, VerificationType, GameEvent } from '../types';
import { getLevelInfo, formatCoins } from '../utils/levels';
import { VerifiedBadge } from './VerifiedBadge';

interface NavbarProps {
  user: UserProfile;
  pendingDonationsCount: number;
  activeTab: ActiveTab;
  activeEvent?: GameEvent | null;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenEventManagement?: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  pendingDonationsCount,
  activeTab,
  activeEvent,
  onSelectTab,
  onOpenEventManagement,
  onSignOut,
}) => {
  const level = getLevelInfo(user.coins, user.isKing);

  const isEventCurrentlyActive = Boolean(
    activeEvent && 
    activeEvent.isActive && 
    new Date(activeEvent.endsAt).getTime() > Date.now()
  );

  const badgeType: VerificationType =
    user.isKing || user.usernameLower === 'hero' || user.verificationType === 'purple'
      ? 'purple'
      : user.verificationType === 'blue'
      ? 'blue'
      : 'none';

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 dir-rtl text-right">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Left/Right User Badge */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${level.bgGradient} border ${level.borderColor} flex items-center justify-center text-xl shadow-md`}>
              {user.isKing ? '👑' : level.icon}
            </div>
            {badgeType !== 'none' && (
              <div className="absolute -bottom-1 -right-1">
                <VerifiedBadge type={badgeType} size="sm" showTooltip={false} />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black text-white text-base tracking-wide flex items-center gap-1.5">
                {user.username}
                <VerifiedBadge type={badgeType} size="md" />
                {user.isKing && (
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" /> الملك
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-0.5 text-xs">
              <span className={`font-bold ${level.color}`}>
                {level.name}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400 font-extrabold flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-yellow-400" />
                {formatCoins(user.coins, user.isKing)}
              </span>
            </div>
          </div>
        </div>

        {/* Center / Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          
          {/* King Hero Event Management Button */}
          {user.isKing && onOpenEventManagement && (
            <button
              onClick={onOpenEventManagement}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-lg ${
                isEventCurrentlyActive
                  ? 'bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 text-slate-950 border border-yellow-300 animate-pulse hover:scale-105'
                  : 'bg-purple-950/80 hover:bg-purple-900 border border-purple-500/60 text-purple-200 hover:text-white'
              }`}
              title="إدارة وإنشاء الفعاليات والأحداث"
            >
              <Flame className="w-4 h-4 text-yellow-400" />
              <span>{isEventCurrentlyActive ? '🔥 إدارة الحدث النشط' : '⚡ إدارة الفعاليات'}</span>
            </button>
          )}

          {/* Main Tapper Button */}
          <button
            onClick={() => onSelectTab('tapper')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'tapper'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-105'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>الرئيسية</span>
          </button>

          {/* Search Button */}
          <button
            onClick={() => onSelectTab('search')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-105'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>البحث</span>
          </button>

          {/* Inbox / Donations Tab */}
          <button
            onClick={() => onSelectTab('inbox')}
            className={`relative px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'inbox'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-105'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>البريد</span>
            {pendingDonationsCount > 0 && (
              <span className="absolute -top-1.5 -left-1.5 bg-red-500 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 animate-bounce">
                {pendingDonationsCount}
              </span>
            )}
          </button>

          {/* Leaderboard Tab */}
          <button
            onClick={() => onSelectTab('leaderboard')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-105'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>المتصدرين</span>
          </button>

          {/* Sign Out Button */}
          <button
            onClick={onSignOut}
            title="تسجيل الخروج"
            className="p-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-xl transition-all border border-slate-700/60 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};

