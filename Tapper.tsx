import React, { useState, useEffect, useRef } from 'react';
import { Coins, Sparkles, Zap, Trophy, Crown, ArrowUpRight, Lock, AlertTriangle, ShieldAlert, Flame } from 'lucide-react';
import { UserProfile, GlobalGameSettings, GameEvent } from '../types';
import { getLevelInfo, formatCoins, BASE_LEVELS } from '../utils/levels';
import { updateUserCoinsInDb } from '../services/userService';

interface TapperProps {
  user: UserProfile;
  globalSettings?: GlobalGameSettings;
  activeEvent?: GameEvent | null;
  onCoinsChange: (newCoins: number) => void;
  onOpenSearch: () => void;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
}

export const Tapper: React.FC<TapperProps> = ({ 
  user, 
  globalSettings, 
  activeEvent,
  onCoinsChange, 
  onOpenSearch 
}) => {
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [isPressed, setIsPressed] = useState(false);
  const [blockedAlert, setBlockedAlert] = useState<string | null>(null);
  const pendingCoinsRef = useRef(user.coins);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const level = getLevelInfo(user.coins, user.isKing);

  // Sync to Firestore debounced
  const scheduleSync = (newCoins: number) => {
    pendingCoinsRef.current = newCoins;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(() => {
      if (!user.isKing) {
        updateUserCoinsInDb(user.uid, pendingCoinsRef.current);
      }
    }, 1200);
  };

  useEffect(() => {
    pendingCoinsRef.current = user.coins;
  }, [user.coins]);

  const isBannedActive = Boolean(
    !user.isKing && (
      user.isBanned ||
      user.banType === 'permanent' ||
      (user.banType === 'temporary' &&
        user.bannedUntil &&
        new Date(user.bannedUntil).getTime() > Date.now())
    )
  );

  const isGloballyDisabled = Boolean(globalSettings?.globalCollectingDisabled && !user.isKing);
  const isIndividuallyDisabled = Boolean(user.isCollectingDisabled && !user.isKing);
  const isCollectingBlocked = isGloballyDisabled || isIndividuallyDisabled;

  const isEventActive = Boolean(
    activeEvent && 
    activeEvent.isActive && 
    new Date(activeEvent.endsAt).getTime() > Date.now()
  );

  const eventCoinsPerTap = isEventActive && activeEvent ? activeEvent.coinsPerTap : 10;

  const handleTap = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (isBannedActive) return;

    if (isCollectingBlocked) {
      const msg = isGloballyDisabled
        ? '🛑 تم إيقاف تجميع الكوينز لجميع اللاعبين بقرار من الملك Hero!'
        : '🔒 تم إيقاف تجميع الكوينز لحسابك بقرار من الملك Hero!';
      setBlockedAlert(msg);
      setTimeout(() => setBlockedAlert(null), 3000);
      return;
    }

    // Add coins (King gets infinity, players get event boost or 10)
    const tapValue = user.isKing ? 1000000000 : eventCoinsPerTap;
    const nextCoins = user.isKing ? 999999999999 : user.coins + tapValue;

    onCoinsChange(nextCoins);
    scheduleSync(nextCoins);

    // Get click position for floating text
    const rect = e.currentTarget.getBoundingClientRect();
    let clientX = rect.left + rect.width / 2;
    let clientY = rect.top + rect.height / 2;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const newId = Date.now() + Math.random();
    setFloatingTexts((prev) => [
      ...prev.slice(-15),
      { 
        id: newId, 
        x, 
        y, 
        text: user.isKing 
          ? '+∞' 
          : isEventActive 
          ? `+${tapValue} 🔥` 
          : `+${tapValue}` 
      }
    ]);

    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== newId));
    }, 800);
  };

  // Progress to next level logic
  let progressPercent = 100;
  let remainingCoins = 0;
  if (level.nextCoins && !user.isKing) {
    const currentLevelCoins = user.coins - level.minCoins;
    const totalRequiredForLevel = level.nextCoins - level.minCoins;
    progressPercent = Math.min(100, Math.max(0, (currentLevelCoins / totalRequiredForLevel) * 100));
    remainingCoins = Math.max(0, level.nextCoins - user.coins);
  }

  return (
    <div className="flex flex-col items-center justify-center py-6 px-4 max-w-2xl mx-auto dir-rtl text-right">
      
      {/* Active Collection Blocked Notice Banner */}
      {isCollectingBlocked && (
        <div className="w-full mb-4 p-4 rounded-2xl bg-gradient-to-r from-red-950/70 via-rose-900/60 to-red-950/70 border-2 border-red-500/80 shadow-xl shadow-red-950/50 flex items-center justify-between gap-3 text-red-100 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/40 border border-red-400 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-red-300" />
            </div>
            <div>
              <div className="text-sm font-black flex items-center gap-1.5 text-white">
                <span>تجميع الكوينز متوقف ومجمّد حالياً 🔒</span>
              </div>
              <p className="text-xs text-red-200 mt-0.5">
                {isGloballyDisabled
                  ? 'تم إيقاف تجميع الكوينز لجميع اللاعبين على مستوى اللعبة بقرار من الملك Hero.'
                  : 'تم إيقاف صلاحية تجميع الكوينز لحسابك بقرار مباشر من الملك Hero.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Blocked Tap Toast Alert */}
      {blockedAlert && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-red-600 border border-red-400 text-white font-black text-sm rounded-2xl shadow-2xl animate-bounce flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-yellow-300" />
          <span>{blockedAlert}</span>
        </div>
      )}

      {/* Current Balance Display Card */}
      <div className="w-full bg-slate-900/80 border border-amber-500/30 rounded-3xl p-6 shadow-xl text-center relative overflow-hidden mb-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-3 border ${
          isCollectingBlocked
            ? 'bg-red-500/15 border-red-500/30 text-red-300'
            : isEventActive
            ? 'bg-gradient-to-r from-red-600/30 via-amber-500/30 to-yellow-500/30 border-amber-400/60 text-yellow-200 shadow-md shadow-amber-500/20'
            : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
        }`}>
          {isCollectingBlocked ? (
            <>
              <Lock className="w-4 h-4 text-red-400" />
              <span>التجميع موقوف ومجمّد من الملك Hero</span>
            </>
          ) : isEventActive ? (
            <>
              <Flame className="w-4 h-4 text-yellow-400 animate-bounce" />
              <span>
                {activeEvent?.title}: كل ضغطة تمنحك <strong className="text-yellow-300 font-extrabold text-sm">{user.isKing ? '∞' : eventCoinsPerTap} كوينز</strong> 🔥
              </span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-amber-400" />
              <span>كل ضغطة تحصل على {user.isKing ? 'نقاط لا نهائية (∞)' : '10 كوينز'}</span>
            </>
          )}
        </div>

        <div className="text-4xl sm:text-6xl font-black text-amber-400 tracking-tight flex items-center justify-center gap-3 my-2">
          <Coins className={`w-10 h-10 sm:w-14 sm:h-14 text-yellow-400 ${isCollectingBlocked ? 'opacity-50' : 'animate-bounce'}`} />
          <span>{formatCoins(user.coins, user.isKing)}</span>
        </div>

        <p className="text-slate-400 text-xs sm:text-sm font-semibold">إجمالي رصيد الكوينز في حسابك</p>

        {/* Level Progress Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="flex items-center gap-1 text-slate-300">
              المستوى الحالي: <strong className={level.color}>{level.name}</strong> ({level.icon})
            </span>
            {level.nextCoins && !user.isKing ? (
              <span className="text-slate-400">متبقي {remainingCoins.toLocaleString('en-US')} كوينز للمستوى القادم</span>
            ) : (
              <span className="text-amber-300 font-bold">وصلت لأعلى المستويات! ✨</span>
            )}
          </div>

          <div className="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-700/80">
            <div
              className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 h-full rounded-full transition-all duration-300 shadow-md shadow-amber-500/50"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Interactive Big Coin */}
      <div className="my-6 relative flex flex-col items-center select-none">
        <div
          onClick={handleTap}
          onMouseDown={() => !isCollectingBlocked && setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          onTouchStart={() => !isCollectingBlocked && setIsPressed(true)}
          onTouchEnd={() => setIsPressed(false)}
          className={`relative w-64 h-64 sm:w-72 sm:h-72 rounded-full transition-all duration-75 flex items-center justify-center shadow-2xl ${
            isCollectingBlocked
              ? 'cursor-not-allowed opacity-85 grayscale-[40%]'
              : isPressed
              ? 'cursor-pointer scale-95 shadow-amber-500/50'
              : 'cursor-pointer hover:scale-105 shadow-amber-500/30'
          }`}
          style={{
            background: isCollectingBlocked
              ? 'radial-gradient(circle at 30% 30%, #a1a1aa 0%, #71717a 50%, #3f3f46 100%)'
              : 'radial-gradient(circle at 30% 30%, #fde047 0%, #eab308 50%, #ca8a04 100%)',
            boxShadow: isCollectingBlocked
              ? '0 0 30px rgba(239, 68, 68, 0.4), inset 0 6px 12px rgba(0,0,0,0.6)'
              : isPressed
              ? '0 0 40px rgba(234, 179, 8, 0.8), inset 0 6px 12px rgba(0,0,0,0.4)'
              : '0 0 60px rgba(234, 179, 8, 0.4), inset 0 -8px 16px rgba(0,0,0,0.3)',
          }}
        >
          {/* Outer Coin Ring */}
          <div className={`w-56 h-56 sm:w-64 sm:h-64 rounded-full border-4 flex items-center justify-center relative overflow-hidden ${
            isCollectingBlocked ? 'border-red-400/50' : 'border-amber-200/60'
          }`}>
            
            {/* Shiny Rays Background Effect */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-200/40 via-amber-400/10 to-transparent" />

            <div className="text-center z-10">
              <div className="text-6xl sm:text-7xl mb-1 filter drop-shadow-md">
                {user.isKing ? '👑' : isCollectingBlocked ? '🔒' : isEventActive ? '🔥' : '🪙'}
              </div>
              <div className={`font-black text-2xl sm:text-3xl tracking-widest drop-shadow ${
                isCollectingBlocked ? 'text-red-300' : 'text-slate-950'
              }`}>
                {isCollectingBlocked ? 'مجمّد 🔒' : isEventActive ? 'حدث خاص! 🔥' : 'اضغط هنا'}
              </div>
              <div className={`font-bold text-xs mt-0.5 px-3 py-1 rounded-full shadow-sm ${
                isCollectingBlocked
                  ? 'bg-red-950/80 text-red-200 border border-red-500/50'
                  : isEventActive
                  ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white border border-yellow-300 shadow-md animate-pulse'
                  : 'bg-yellow-300/80 text-amber-950'
              }`}>
                {isCollectingBlocked
                  ? 'التجميع موقوف'
                  : user.isKing
                  ? '+∞ كوينز'
                  : isEventActive
                  ? `+${eventCoinsPerTap} كوينز (مضاعف!)`
                  : '+10 كوينز'}
              </div>
            </div>
          </div>

          {/* Floating Tap Text Effect (+10) */}
          {floatingTexts.map((item) => (
            <span
              key={item.id}
              className="absolute font-black text-2xl sm:text-3xl text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] pointer-events-none animate-floatUp"
              style={{ left: `${item.x}px`, top: `${item.y}px` }}
            >
              {item.text}
            </span>
          ))}
        </div>

        <p className={`text-xs mt-4 font-semibold ${
          isCollectingBlocked ? 'text-red-400 font-black' : 'text-slate-400 animate-pulse'
        }`}>
          {isCollectingBlocked
            ? '⚠️ لا يمكنك جمع الكوينز حالياً لأن الملك Hero قام بإيقاف التجميع.'
            : 'اضغط باستمرار على الكوين للحصول على النقاط وتطوير مستواك!'}
        </p>
      </div>

      {/* Levels Showcase Carousel / Preview Grid */}
      <div className="w-full bg-slate-900/60 border border-slate-800 rounded-3xl p-5 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-200 font-bold text-sm flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            سلسلة مستويات اللعبة (من البرونزي إلى اللانهاية):
          </h3>
          <button
            onClick={onOpenSearch}
            className="text-amber-400 text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            البحث عن لاعبين <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {BASE_LEVELS.map((lvl) => {
            const isCurrent = level.name === lvl.name;
            const isUnlocked = user.coins >= lvl.minCoins || user.isKing;

            return (
              <div
                key={lvl.name}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50'
                    : isUnlocked
                    ? 'bg-slate-800/80 border-slate-700/80'
                    : 'bg-slate-900/40 border-slate-800/60 opacity-50'
                }`}
              >
                <div className="text-2xl mb-1">{lvl.icon}</div>
                <div className={`font-black text-xs ${lvl.color}`}>{lvl.name}</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {lvl.minCoins === 0 ? 'البداية' : `${lvl.minCoins.toLocaleString('en-US')}+`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
