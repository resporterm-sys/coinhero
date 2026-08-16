import React, { useState, useEffect } from 'react';
import { Flame, Clock, Coins, Crown, Sparkles, Settings2, Zap } from 'lucide-react';
import { GameEvent, UserProfile } from '../types';

interface EventBannerProps {
  event: GameEvent;
  currentUser: UserProfile;
  onOpenEventManagement: () => void;
}

export const EventBanner: React.FC<EventBannerProps> = ({
  event,
  currentUser,
  onOpenEventManagement,
}) => {
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const diff = new Date(event.endsAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeftStr('00:00:00');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const pad = (n: number) => n.toString().padStart(2, '0');

      if (days > 0) {
        setTimeLeftStr(`${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      } else {
        setTimeLeftStr(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [event]);

  // Color theme mapping
  const getThemeStyles = () => {
    switch (event.themeColor) {
      case 'purple':
        return {
          bg: 'from-purple-950/80 via-pink-950/60 to-slate-900',
          border: 'border-purple-500/60 shadow-purple-500/10',
          badge: 'bg-purple-500/25 border-purple-500/50 text-purple-200',
          glow: 'bg-purple-500/20',
          text: 'text-purple-300',
        };
      case 'crimson':
        return {
          bg: 'from-red-950/80 via-rose-950/60 to-slate-900',
          border: 'border-red-500/60 shadow-red-500/10',
          badge: 'bg-red-500/25 border-red-500/50 text-red-200',
          glow: 'bg-red-500/20',
          text: 'text-red-300',
        };
      case 'emerald':
        return {
          bg: 'from-emerald-950/80 via-teal-950/60 to-slate-900',
          border: 'border-emerald-500/60 shadow-emerald-500/10',
          badge: 'bg-emerald-500/25 border-emerald-500/50 text-emerald-200',
          glow: 'bg-emerald-500/20',
          text: 'text-emerald-300',
        };
      case 'cyan':
        return {
          bg: 'from-cyan-950/80 via-blue-950/60 to-slate-900',
          border: 'border-cyan-500/60 shadow-cyan-500/10',
          badge: 'bg-cyan-500/25 border-cyan-500/50 text-cyan-200',
          glow: 'bg-cyan-500/20',
          text: 'text-cyan-300',
        };
      case 'gold':
      default:
        return {
          bg: 'from-amber-950/80 via-yellow-950/60 to-slate-900',
          border: 'border-amber-500/60 shadow-amber-500/10',
          badge: 'bg-amber-500/25 border-amber-500/50 text-amber-200',
          glow: 'bg-amber-500/20',
          text: 'text-amber-300',
        };
    }
  };

  const theme = getThemeStyles();

  return (
    <div className={`w-full max-w-4xl mx-auto my-3 px-3 sm:px-4 dir-rtl text-right animate-fadeIn`}>
      <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 bg-gradient-to-r ${theme.bg} border-2 ${theme.border} shadow-xl backdrop-blur-md`}>
        
        {/* Glowing background animation */}
        <div className={`absolute top-0 right-1/4 w-48 h-48 ${theme.glow} rounded-full blur-3xl pointer-events-none animate-pulse`} />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Left / Info Section */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 border border-yellow-200 flex items-center justify-center text-2xl shadow-lg shrink-0 animate-bounce">
              🔥
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  حدث نشط الآن
                </span>
                
                <h3 className="font-black text-white text-sm sm:text-base tracking-wide flex items-center gap-1.5">
                  {event.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 mt-1 text-xs flex-wrap">
                <span className={`font-black ${theme.badge} px-2.5 py-0.5 rounded-full border text-[11px] flex items-center gap-1 shadow-sm`}>
                  <Coins className="w-3.5 h-3.5 text-yellow-400" />
                  <span>كل نقرة = </span>
                  <strong className="text-yellow-300 text-xs font-black">{event.coinsPerTap} كوينز</strong>
                </span>

                {event.description && (
                  <span className="text-slate-300 text-xs hidden sm:inline-block">
                    • {event.description}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right / Countdown & King Action */}
          <div className="flex items-center gap-2 sm:gap-3 justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-800/80">
            
            {/* Live Countdown Badge */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span className="text-slate-400 font-semibold">متبقي:</span>
              <span className="text-amber-300 font-black tracking-widest font-mono text-xs sm:text-sm">
                {timeLeftStr || '00:00:00'}
              </span>
            </div>

            {/* King Hero Management Shortcut Button */}
            {currentUser.isKing && (
              <button
                type="button"
                onClick={onOpenEventManagement}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/40 hover:to-yellow-500/40 border border-amber-500/50 text-amber-200 hover:text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:scale-105"
                title="تعديل الحدث أو إيقافه"
              >
                <Crown className="w-3.5 h-3.5 text-yellow-400" />
                <span>إدارة الحدث</span>
              </button>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
