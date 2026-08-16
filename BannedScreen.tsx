import React, { useState, useEffect } from 'react';
import { Ban, AlertTriangle, ShieldAlert, LogOut, Clock, Crown, Trash2, RotateCcw } from 'lucide-react';
import { UserProfile } from '../types';

interface BannedScreenProps {
  user: UserProfile;
  isDeleted?: boolean;
  onSignOut: () => void;
}

export const BannedScreen: React.FC<BannedScreenProps> = ({
  user,
  isDeleted = false,
  onSignOut,
}) => {
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    if (isDeleted || user.banType !== 'temporary' || !user.bannedUntil) {
      return;
    }

    const checkTime = () => {
      const expiry = new Date(user.bannedUntil!).getTime();
      const now = Date.now();
      const diff = expiry - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeftStr('انتهت مدة الحظر المؤقت! يمكنك الآن المتابعة أو تسجيل الدخول من جديد.');
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (hours > 24) {
          const days = Math.floor(hours / 24);
          const remainingHours = hours % 24;
          setTimeLeftStr(`${days} يوم و ${remainingHours} ساعة و ${minutes} دقيقة`);
        } else {
          setTimeLeftStr(`${hours} ساعة و ${minutes} دقيقة و ${seconds} ثانية`);
        }
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [user.bannedUntil, user.banType, isDeleted]);

  const formattedExpiryDate = user.bannedUntil
    ? new Date(user.bannedUntil).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl dir-rtl text-right select-none animate-fadeIn">
      {/* Background glowing alert effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-slate-900/95 border-2 border-red-500/70 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-red-950/60 relative overflow-hidden flex flex-col items-center text-center">
        
        {/* Top Warning Icon Badge */}
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-red-600 via-red-500 to-amber-600 flex items-center justify-center shadow-xl shadow-red-600/40 text-white animate-pulse">
            {isDeleted ? (
              <Trash2 className="w-10 h-10" />
            ) : (
              <Ban className="w-10 h-10" />
            )}
          </div>
          <div className="absolute -top-2 -right-2 bg-amber-500 text-slate-950 p-1.5 rounded-full shadow-md">
            <Crown className="w-4 h-4 fill-slate-950" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
          {isDeleted ? (
            'تم حذف هذا الحساب نهائياً'
          ) : user.banType === 'temporary' ? (
            'حسابك محظور مؤقتاً ⛔'
          ) : (
            'حسابك محظور نهائياً 🚫'
          )}
        </h2>

        {/* Decree subtitle */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-full text-xs font-bold text-red-300 mb-6">
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          قرار أمني صادر من الملك Hero
        </div>

        {/* Account Info Box */}
        <div className="w-full bg-slate-950/80 border border-red-500/30 rounded-2xl p-4 mb-6 text-right space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-xs text-slate-400 font-semibold">اسم المستخدم:</span>
            <span className="text-sm font-black text-white">{user.username}</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-xs text-slate-400 font-semibold">نوع العقوبة:</span>
            <span className="text-xs font-black text-red-400">
              {isDeleted ? 'حذف الحساب والبيانات' : user.banType === 'temporary' ? 'حظر مؤقت عن اللعب' : 'حظر دائم وشامل'}
            </span>
          </div>

          {/* Reason Box */}
          <div className="pt-1">
            <span className="block text-xs text-slate-400 font-semibold mb-1">سبب الحظر:</span>
            <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3 text-xs text-red-200 font-bold leading-relaxed">
              "{user.banReason || (isDeleted ? 'تم حذف الحساب بقرار ملكي' : 'مخالفة القوانين والتعليمات الملكية')}"
            </div>
          </div>

          {/* Expiry Date (Temporary Ban) */}
          {!isDeleted && user.banType === 'temporary' && formattedExpiryDate && (
            <div className="pt-1 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  تاريخ انتهاء الحظر:
                </span>
                <span className="text-amber-300 font-bold">{formattedExpiryDate}</span>
              </div>

              {timeLeftStr && (
                <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-2.5 text-center text-xs font-black text-amber-200">
                  الوقت المتبقي: {timeLeftStr}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Warning Notice */}
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          {isDeleted
            ? 'تمت إزالة هذا الحساب وبياناته بالكامل من السيرفر. يمكنك تسجيل الخروج وإنشاء حساب جديد باسم آخر.'
            : 'تم إيقاف صلاحيات اللعب وجمع الكوينز لهذا الحساب بشكل فوري. لا يمكن استخدام هذا الحساب أثناء سريان الحظر.'}
        </p>

        {/* Action Button: Sign Out */}
        <button
          onClick={onSignOut}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-red-950/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج والتبديل إلى حساب آخر</span>
        </button>

      </div>
    </div>
  );
};
