import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Coins, RefreshCw, Sparkles } from 'lucide-react';
import { UserProfile, VerificationType } from '../types';
import { searchUsersInDb } from '../services/userService';
import { getLevelInfo, formatCoins } from '../utils/levels';
import { VerifiedBadge } from './VerifiedBadge';

interface LeaderboardModalProps {
  currentUser: UserProfile;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  currentUser,
  onClose,
}) => {
  const [topUsers, setTopUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      setLoading(true);
      try {
        const users = await searchUsersInDb('', currentUser.isKing);
        setTopUsers(users);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, [currentUser.isKing]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md dir-rtl text-right">
      <div className="w-full max-w-xl bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh] relative overflow-hidden">
        
        {/* Glow Ambient */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              قائمة أساطير وتصدر اللعبة
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              ترتيب اللاعبين وتصدرهم بحسب الرتب وعدد الكوينز ومستوى الحساب
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-lg font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Leaderboard List */}
        <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-1 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-amber-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <span className="text-sm font-bold">جاري تحميل قائمة المتصدرين...</span>
            </div>
          ) : topUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              لا يوجد لاعبين مسجلين بعد
            </div>
          ) : (
            topUsers.map((player, index) => {
              const playerLevel = getLevelInfo(player.coins, player.isKing);
              const isHeroKing = player.usernameLower === 'hero' || player.isKing;
              const isSelf = player.uid === currentUser.uid;
              const rank = index + 1;

              const badgeType: VerificationType =
                isHeroKing
                  ? 'purple'
                  : player.verificationType === 'purple'
                  ? 'purple'
                  : player.verificationType === 'blue'
                  ? 'blue'
                  : 'none';

              let rankBadge = (
                <span className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center border border-slate-700">
                  #{rank}
                </span>
              );

              if (isHeroKing) {
                rankBadge = (
                  <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg shadow-amber-500/30">
                    👑
                  </span>
                );
              } else if (rank === 1) {
                rankBadge = (
                  <span className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-300 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                    🥇
                  </span>
                );
              } else if (rank === 2) {
                rankBadge = (
                  <span className="w-7 h-7 rounded-full bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                    🥈
                  </span>
                );
              } else if (rank === 3) {
                rankBadge = (
                  <span className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-700 to-amber-600 text-slate-100 font-black text-xs flex items-center justify-center shadow-md">
                    🥉
                  </span>
                );
              }

              return (
                <div
                  key={player.uid}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isHeroKing
                      ? 'bg-gradient-to-r from-amber-500/20 via-purple-500/10 to-amber-600/20 border-purple-400/80 shadow-lg shadow-purple-500/20'
                      : isSelf
                      ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30'
                      : 'bg-slate-800/60 border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {rankBadge}

                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${playerLevel.bgGradient} border ${playerLevel.borderColor} flex items-center justify-center text-xl shadow-md shrink-0`}>
                      {isHeroKing ? '👑' : playerLevel.icon}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-white text-sm sm:text-base">
                          {player.username}
                        </span>

                        <VerifiedBadge type={badgeType} size="md" />

                        {isHeroKing && (
                          <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                            <Crown className="w-3 h-3 fill-slate-950" /> الملك
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-xs">
                        <span className={`font-bold ${playerLevel.color}`}>
                          {playerLevel.name}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-amber-400 font-black flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5 text-yellow-400" />
                          {formatCoins(player.coins, isHeroKing)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
