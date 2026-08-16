import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Crown, 
  Coins, 
  Send, 
  KeyRound, 
  User, 
  RefreshCw, 
  ShieldAlert, 
  Sparkles, 
  Ban,
  Lock,
  Unlock,
  Globe,
  Radio,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';
import { UserProfile, VerificationType, GlobalGameSettings } from '../types';
import { 
  searchUsersInDb, 
  subscribeToGlobalGameSettings, 
  setGlobalCollectingDisabledInDb,
  toggleUserCollectingInDb 
} from '../services/userService';
import { getLevelInfo, formatCoins } from '../utils/levels';
import { AccountDetailsModal } from './AccountDetailsModal';
import { VerifiedBadge } from './VerifiedBadge';

interface SearchModalProps {
  currentUser: UserProfile;
  onSelectUserToDonate?: (targetUser: UserProfile) => void;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  currentUser,
  onSelectUserToDonate,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<UserProfile | null>(null);

  // Global settings state
  const [globalSettings, setGlobalSettings] = useState<GlobalGameSettings>({
    globalCollectingDisabled: false,
  });
  const [globalLoading, setGlobalLoading] = useState(false);
  const [quickActionLoadingUid, setQuickActionLoadingUid] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Subscribe to global game settings (real-time)
  useEffect(() => {
    const unsub = subscribeToGlobalGameSettings((settings) => {
      setGlobalSettings(settings);
    });
    return () => unsub();
  }, []);

  const handleSearch = async (queryStr: string) => {
    setLoading(true);
    try {
      const results = await searchUsersInDb(queryStr, currentUser.isKing);
      setUsers(results);
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch('');
  }, []);

  const handleVerificationChanged = (targetUid: string, newType: VerificationType) => {
    setUsers((prevUsers) =>
      prevUsers.map((u) => {
        if (u.uid === targetUid) {
          return {
            ...u,
            isVerified: newType !== 'none',
            verificationType: newType,
          };
        }
        return u;
      })
    );
  };

  const handleCollectingStatusChanged = (targetUid: string, disabled: boolean) => {
    setUsers((prevUsers) =>
      prevUsers.map((u) => {
        if (u.uid === targetUid) {
          return {
            ...u,
            isCollectingDisabled: disabled,
          };
        }
        return u;
      })
    );
  };

  const handleAccountBanStatusChanged = (updatedUser: UserProfile) => {
    setUsers((prevUsers) =>
      prevUsers.map((u) => (u.uid === updatedUser.uid ? updatedUser : u))
    );
  };

  const handleAccountDeleted = (deletedUid: string) => {
    setUsers((prevUsers) => prevUsers.filter((u) => u.uid !== deletedUid));
    setSelectedUserForDetails(null);
  };

  // King Master Control: Toggle global collecting for ALL players
  const handleToggleGlobalCollecting = async (disable: boolean) => {
    if (!currentUser.isKing) return;
    setGlobalLoading(true);
    setActionNotice(null);
    try {
      await setGlobalCollectingDisabledInDb(disable);
      setActionNotice(
        disable
          ? '🛑 تم إيقاف تجميع الكوينز لجميع اللاعبين بنجاح!'
          : '🟢 تم تفعيل والسماح بتجميع الكوينز لجميع اللاعبين بنجاح!'
      );
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err) {
      console.error('Failed to set global collecting:', err);
      setActionNotice('حدث خطأ أثناء تعديل الإعدادات الشاملة');
      setTimeout(() => setActionNotice(null), 3000);
    } finally {
      setGlobalLoading(false);
    }
  };

  // King Quick Action: Freeze/Unfreeze individual player in 1-click
  const handleQuickToggleCollecting = async (player: UserProfile, disable: boolean) => {
    if (!currentUser.isKing || player.isKing) return;
    setQuickActionLoadingUid(player.uid);
    try {
      await toggleUserCollectingInDb(player.uid, disable);
      setUsers((prev) =>
        prev.map((u) => (u.uid === player.uid ? { ...u, isCollectingDisabled: disable } : u))
      );
      setActionNotice(
        disable
          ? `🔒 تم إيقاف تجميع الكوينز للاعب "${player.username}" فوراً!`
          : `🟢 تم تفعيل تجميع الكوينز للاعب "${player.username}" فوراً!`
      );
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      console.error('Failed quick toggle:', err);
    } finally {
      setQuickActionLoadingUid(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md dir-rtl text-right">
      <div className="w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[88vh] relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-amber-400" />
              البحث عن حسابات اللاعبين
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {currentUser.isKing
                ? 'لوحة تحكم الملك Hero: إيقاف وتفعيل التجميع للجميع أو بالاسم، كشف الحسابات والحظر 👑'
                : 'ابحث عن أي اسم لاعب لمعرفة عدد الكوينز لديه ومستواه وموثوقية حسابه'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-lg font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* KING GLOBAL COIN COLLECTING MASTER CONTROL BAR */}
        {currentUser.isKing && (
          <div className="mt-3 p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-slate-900 border-2 border-amber-500/40 shadow-xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black text-amber-300">
                  التحكم الشامل في تجميع الكوينز (لجميع اللاعبين دفعة واحدة):
                </span>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-slate-400">حالة السيرفر:</span>
                {globalSettings.globalCollectingDisabled ? (
                  <span className="bg-red-500/20 border border-red-500/40 text-red-300 font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                    <Lock className="w-3 h-3 text-red-400" /> التجميع موقوف للجميع 🛑
                  </span>
                ) : (
                  <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Unlock className="w-3 h-3 text-emerald-400" /> التجميع متاح ومفعّل 🟢
                  </span>
                )}
              </div>
            </div>

            {/* Quick Master Global Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Stop All Players Button */}
              <button
                type="button"
                disabled={globalLoading || globalSettings.globalCollectingDisabled}
                onClick={() => handleToggleGlobalCollecting(true)}
                className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  globalSettings.globalCollectingDisabled
                    ? 'bg-red-950/40 border-red-500/30 text-red-400 opacity-60 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 border-red-400 text-white shadow-lg shadow-red-950/50 hover:scale-[1.01]'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>إيقاف تجميع الكوينز لجميع اللاعبين 🛑</span>
              </button>

              {/* Allow / Resume All Players Button */}
              <button
                type="button"
                disabled={globalLoading || !globalSettings.globalCollectingDisabled}
                onClick={() => handleToggleGlobalCollecting(false)}
                className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  !globalSettings.globalCollectingDisabled
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 opacity-60 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-emerald-400 text-white shadow-lg shadow-emerald-950/50 hover:scale-[1.01]'
                }`}
              >
                <Unlock className="w-4 h-4" />
                <span>تفعيل واستئناف التجميع للجميع 🟢</span>
              </button>
            </div>
          </div>
        )}

        {/* Global Toast Notice */}
        {actionNotice && (
          <div className="mt-2.5 p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-center text-xs font-black text-amber-200 animate-fadeIn">
            {actionNotice}
          </div>
        )}

        {/* Search Bar Input */}
        <div className="my-3 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            placeholder="ادخل اسم الحساب للبحث... (مثلاً: Hero)"
            className="w-full bg-slate-800/90 border border-slate-700 focus:border-amber-500 rounded-2xl py-3.5 px-4 pr-11 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all text-sm"
          />
          <Search className="absolute right-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
          {loading && (
            <RefreshCw className="absolute left-4 top-3.5 w-5 h-5 text-amber-400 animate-spin" />
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
          {users.length === 0 && !loading ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              لم يتم العثور على أي لاعب بهذا الاسم
            </div>
          ) : (
            users.map((player) => {
              const playerLevel = getLevelInfo(player.coins, player.isKing);
              const isHeroKing = player.usernameLower === 'hero' || player.isKing;
              
              const badgeType: VerificationType =
                isHeroKing
                  ? 'purple'
                  : player.verificationType === 'purple'
                  ? 'purple'
                  : player.verificationType === 'blue'
                  ? 'blue'
                  : 'none';

              const isBannedActive = Boolean(
                player.isBanned ||
                player.banType === 'permanent' ||
                (player.banType === 'temporary' && player.bannedUntil && new Date(player.bannedUntil).getTime() > Date.now())
              );

              const isFrozenCollecting = Boolean(player.isCollectingDisabled);
              const isQuickLoading = quickActionLoadingUid === player.uid;

              return (
                <div
                  key={player.uid}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isHeroKing
                      ? 'bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-amber-600/15 border-purple-400/60 shadow-lg shadow-purple-500/10'
                      : isBannedActive
                      ? 'bg-red-950/30 border-red-500/40 hover:border-red-500/70'
                      : isFrozenCollecting
                      ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/60'
                      : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
                  }`}
                >
                  {/* Left Info: Avatar, Username, Badge, Level, Status Badges */}
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${playerLevel.bgGradient} border ${playerLevel.borderColor} flex items-center justify-center text-2xl shadow-md shrink-0`}>
                      {isHeroKing ? '👑' : isBannedActive ? '🚫' : playerLevel.icon}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-white text-base">
                          {player.username}
                        </span>

                        {/* Royal / Standard Verified Badge */}
                        <VerifiedBadge type={badgeType} size="md" />

                        {isHeroKing && (
                          <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                            <Crown className="w-3 h-3 fill-slate-950" /> الملك
                          </span>
                        )}

                        {isBannedActive && (
                          <span className="bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                            <Ban className="w-3 h-3" />
                            {player.banType === 'temporary' ? 'محظور مؤقتاً' : 'محظور دائمياً'}
                          </span>
                        )}

                        {!isHeroKing && isFrozenCollecting && !isBannedActive && (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                            <Lock className="w-3 h-3 text-amber-400" />
                            التجميع موقوف 🔒
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className={`font-bold ${playerLevel.color}`}>
                          {playerLevel.name}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-amber-400 font-extrabold flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5 text-yellow-400" />
                          {formatCoins(player.coins, isHeroKing)} كوينز
                        </span>
                      </div>

                      {isBannedActive && player.banReason && (
                        <div className="text-[11px] text-red-300/90 mt-1 font-semibold">
                          السبب: {player.banReason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* King Actions: Quick Toggle Freeze / Manage Account / Donate */}
                  <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
                    
                    {/* King Direct Quick Freeze / Resume Button */}
                    {currentUser.isKing && !isHeroKing && !isBannedActive && (
                      <button
                        type="button"
                        disabled={isQuickLoading}
                        onClick={() => handleQuickToggleCollecting(player, !isFrozenCollecting)}
                        className={`px-3 py-2 text-xs font-black rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                          isFrozenCollecting
                            ? 'bg-emerald-600/25 hover:bg-emerald-600/40 border-emerald-500/50 text-emerald-200 hover:text-white'
                            : 'bg-red-600/25 hover:bg-red-600/40 border-red-500/50 text-red-200 hover:text-white'
                        }`}
                        title={isFrozenCollecting ? 'إعادة تمكين هذا اللاعب من جمع الكوينز' : 'إيقاف هذا اللاعب من جمع الكوينز فوراً'}
                      >
                        {isQuickLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : isFrozenCollecting ? (
                          <>
                            <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                            <span>تفعيل التجميع 🟢</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 text-red-400" />
                            <span>إيقاف التجميع 🔒</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* King Only: View All Account Information, Password, Verification, Ban & Delete Controls */}
                    {currentUser.isKing && (
                      <button
                        onClick={() => setSelectedUserForDetails(player)}
                        className="px-3 py-2 bg-gradient-to-r from-purple-500/25 via-amber-500/20 to-purple-500/25 hover:from-purple-500/40 hover:to-amber-500/40 border border-purple-500/50 text-purple-200 hover:text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                        title="كشف كلمة المرور، التحكم بالتوثيق، الحظر أو الحذف"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        <span>إدارة وكشف</span>
                      </button>
                    )}

                    {/* King Donation Action Button */}
                    {currentUser.isKing && !isHeroKing && !isBannedActive && onSelectUserToDonate && (
                      <button
                        onClick={() => {
                          onSelectUserToDonate(player);
                          onClose();
                        }}
                        className="px-3 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 hover:scale-105 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5 fill-slate-950" />
                        إرسال كوينز
                      </button>
                    )}

                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* King Account Details Modal Overlay */}
      {selectedUserForDetails && (
        <AccountDetailsModal
          user={selectedUserForDetails}
          onVerificationChanged={handleVerificationChanged}
          onCollectingStatusChanged={handleCollectingStatusChanged}
          onAccountBanStatusChanged={handleAccountBanStatusChanged}
          onAccountDeleted={handleAccountDeleted}
          onSendCoins={(targetUser) => {
            setSelectedUserForDetails(null);
            if (onSelectUserToDonate) {
              onSelectUserToDonate(targetUser);
              onClose();
            }
          }}
          onClose={() => setSelectedUserForDetails(null)}
        />
      )}
    </div>
  );
};
