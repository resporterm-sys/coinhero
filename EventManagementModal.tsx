import React, { useState, useEffect } from 'react';
import { 
  X, 
  Flame, 
  Sparkles, 
  Clock, 
  Coins, 
  Zap, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Crown,
  Play,
  StopCircle,
  RefreshCw,
  Gift,
  Palette
} from 'lucide-react';
import { GameEvent } from '../types';
import { createOrUpdateGameEventInDb, endGameEventInDb } from '../services/userService';

interface EventManagementModalProps {
  activeEvent: GameEvent | null;
  onClose: () => void;
}

const PRESET_TITLES = [
  '⚡ مهرجان الكوينز الخارق',
  '🔥 حدث الذهب المضاعف',
  '👑 ساعة الملك Hero الذهبية',
  '🚀 جنون الكوينز الملكي',
  '💎 أسبوع الكنز الأسطوري',
  '🎉 احتفالية اللاعبين الكبرى',
];

const PRESET_COINS = [20, 50, 100, 200, 500, 1000, 5000];

const PRESET_DURATIONS = [
  { label: '5 دقائق', minutes: 5 },
  { label: '15 دقيقة', minutes: 15 },
  { label: '30 دقيقة', minutes: 30 },
  { label: 'ساعة واحدة', minutes: 60 },
  { label: 'ساعتان', minutes: 120 },
  { label: '6 ساعات', minutes: 360 },
  { label: '24 ساعة (يوم كامل)', minutes: 1440 },
  { label: '3 أيام', minutes: 4320 },
  { label: 'أسبوع كامل', minutes: 10080 },
];

const THEME_COLORS: { id: 'gold' | 'purple' | 'emerald' | 'crimson' | 'cyan'; name: string; gradient: string; border: string; text: string }[] = [
  { id: 'gold', name: 'ذهبي ملكي', gradient: 'from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/50', text: 'text-amber-400' },
  { id: 'purple', name: 'بنفسجي أسطوري', gradient: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/50', text: 'text-purple-400' },
  { id: 'crimson', name: 'أحمر ناري', gradient: 'from-red-500/20 to-rose-600/20', border: 'border-red-500/50', text: 'text-red-400' },
  { id: 'emerald', name: 'زمردي', gradient: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400' },
  { id: 'cyan', name: 'سيان فضائي', gradient: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400' },
];

export const EventManagementModal: React.FC<EventManagementModalProps> = ({
  activeEvent,
  onClose,
}) => {
  const [title, setTitle] = useState(activeEvent?.title || '⚡ مهرجان الكوينز الخارق');
  const [coinsPerTap, setCoinsPerTap] = useState<number>(activeEvent?.coinsPerTap || 100);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [customEndDateTime, setCustomEndDateTime] = useState<string>('');
  const [isCustomDate, setIsCustomDate] = useState<boolean>(false);
  const [description, setDescription] = useState<string>(
    activeEvent?.description || 'احصل على 100 كوينز لكل نقرة لفترة محدودة بقرار من الملك Hero!'
  );
  const [themeColor, setThemeColor] = useState<'gold' | 'purple' | 'emerald' | 'crimson' | 'cyan'>(
    activeEvent?.themeColor || 'gold'
  );

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ text: string; isError?: boolean } | null>(null);
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');

  // Live countdown for currently active event
  useEffect(() => {
    if (!activeEvent || !activeEvent.isActive) {
      setTimeLeftStr('');
      return;
    }

    const updateTimer = () => {
      const diff = new Date(activeEvent.endsAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeftStr('انتهى الوقت');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const parts: string[] = [];
      if (days > 0) parts.push(`${days} يوم`);
      if (hours > 0 || days > 0) parts.push(`${hours} ساعة`);
      parts.push(`${minutes} دقيقة`);
      parts.push(`${seconds} ثانية`);

      setTimeLeftStr(parts.join(' و '));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeEvent]);

  const handleLaunchEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setNotice({ text: 'يرجى إدخال اسم الحدث', isError: true });
      return;
    }

    if (coinsPerTap <= 0) {
      setNotice({ text: 'يرجى إدخال عدد كوينز صحيح (أكبر من 0)', isError: true });
      return;
    }

    let endIso = '';
    if (isCustomDate && customEndDateTime) {
      const customDate = new Date(customEndDateTime);
      if (customDate.getTime() <= Date.now()) {
        setNotice({ text: 'وقت الانتهاء المخصص يجب أن يكون في المستقبل!', isError: true });
        return;
      }
      endIso = customDate.toISOString();
    } else {
      const endDate = new Date(Date.now() + durationMinutes * 60 * 1000);
      endIso = endDate.toISOString();
    }

    setLoading(true);
    setNotice(null);

    try {
      await createOrUpdateGameEventInDb({
        title: title.trim(),
        description: description.trim(),
        type: 'coins_per_tap',
        coinsPerTap: Number(coinsPerTap),
        startsAt: new Date().toISOString(),
        endsAt: endIso,
        isActive: true,
        createdBy: 'الملك Hero',
        themeColor,
      });

      setNotice({ text: '🚀 تم إطلاق الحدث لجميع اللاعبين بنجاح في الوقت الفعلي!' });
      setTimeout(() => {
        setNotice(null);
      }, 4000);
    } catch (err: any) {
      console.error('Failed to launch event:', err);
      setNotice({ text: err.message || 'فشل في إطلاق الحدث', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleEndActiveEvent = async () => {
    setLoading(true);
    setNotice(null);
    try {
      await endGameEventInDb();
      setNotice({ text: '🛑 تم إنهاء وإيقاف الحدث الحالي فوراً لجميع اللاعبين!' });
      setTimeout(() => {
        setNotice(null);
      }, 3500);
    } catch (err: any) {
      console.error('Failed to end event:', err);
      setNotice({ text: err.message || 'فشل في إنهاء الحدث', isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md dir-rtl text-right overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col max-h-[92vh] relative overflow-hidden my-auto">
        
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 relative z-10">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-amber-400 flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-400 animate-pulse" />
              <span>إدارة الفعاليات والأحداث (خاص بالملك Hero)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              أنشئ حدثاً استثنائياً لجميع اللاعبين، حدد مقدار الكوينز لكل نقرة، واضبط وقت انتهاء الحدث مع عداد تنازلي فوري!
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast / Notification Banner */}
        {notice && (
          <div className={`mt-3 p-3 rounded-2xl text-xs font-black flex items-center gap-2 border animate-fadeIn ${
            notice.isError 
              ? 'bg-red-500/20 border-red-500/40 text-red-200' 
              : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
          }`}>
            {notice.isError ? <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            <span>{notice.text}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-5 py-4 pr-1 custom-scrollbar relative z-10">
          
          {/* 1. CURRENT ACTIVE EVENT CARD (IF ACTIVE) */}
          {activeEvent && activeEvent.isActive && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-purple-950/50 to-slate-900 border-2 border-amber-500/60 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-black text-amber-300">
                    الحدث النشط حالياً على مستوى اللعبة:
                  </span>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleEndActiveEvent}
                  className="px-3 py-1.5 bg-red-600/30 hover:bg-red-600/50 border border-red-500/60 text-red-200 hover:text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <StopCircle className="w-4 h-4 text-red-400" />
                  <span>إنهاء الحدث الآن 🛑</span>
                </button>
              </div>

              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-400" />
                    <span>{activeEvent.title}</span>
                  </h3>
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-yellow-400" />
                    {activeEvent.coinsPerTap} كوينز / نقرة!
                  </span>
                </div>

                {activeEvent.description && (
                  <p className="text-xs text-slate-300">
                    {activeEvent.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-800 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>العداد التنازلي:</span>
                    <span className="text-yellow-300 font-black tracking-wide">{timeLeftStr || 'جارِ الحساب...'}</span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    ينتهي في: {new Date(activeEvent.endsAt).toLocaleDateString('ar-EG', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. CREATE / UPDATE EVENT FORM */}
          <form onSubmit={handleLaunchEvent} className="space-y-4">
            
            {/* Section Heading */}
            <div className="flex items-center gap-2 text-sm font-black text-amber-300">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>{activeEvent?.isActive ? 'تعديل الحدث الحالي أو إطلاق حدث جديد:' : 'إعداد وإطلاق حدث جديد لجميع اللاعبين:'}</span>
            </div>

            {/* A. Event Name & Presets */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                اسم الحدث (العنوان الذي سيظهر للاعبين):
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: مهرجان الكوينز الخارق"
                className="w-full bg-slate-800/90 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all font-bold"
                required
              />

              {/* Preset Title Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_TITLES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTitle(t);
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                      title === t
                        ? 'bg-amber-500/30 border-amber-500 text-amber-200'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* B. Event Coins Per Tap Setting */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  عدد الكوينز لكل نقرة للاعبين أثناء الحدث:
                </label>

                <div className="bg-amber-500/20 text-amber-300 font-black text-xs px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
                  <span>كل نقرة = </span>
                  <span className="text-yellow-400 font-extrabold text-sm">{coinsPerTap}</span>
                  <span>كوينز</span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {PRESET_COINS.map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setCoinsPerTap(num);
                      if (description.includes('كوينز لكل نقرة')) {
                        setDescription(`احصل على ${num} كوينز لكل نقرة لفترة محدودة بقرار من الملك Hero!`);
                      }
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-black border transition-all cursor-pointer text-center ${
                      coinsPerTap === num
                        ? 'bg-gradient-to-tr from-amber-500 to-yellow-500 text-slate-950 border-yellow-300 shadow-md shadow-amber-500/20 scale-105'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {num} 🪙
                  </button>
                ))}
              </div>

              {/* Custom Number Input */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-400 shrink-0">أو حدد رقماً مخصصاً:</span>
                <input
                  type="number"
                  min="1"
                  max="1000000"
                  value={coinsPerTap}
                  onChange={(e) => setCoinsPerTap(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-32 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-1.5 text-sm text-amber-400 font-black text-center focus:outline-none"
                />
                <span className="text-xs text-slate-400">كوينز لكل ضغطة</span>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>الوضع العادي: <strong>10 كوينز</strong> ➡️ أثناء الحدث: <strong className="text-yellow-300">{coinsPerTap} كوينز</strong> (مضاعفة {(coinsPerTap / 10).toFixed(1)}x)!</span>
              </div>
            </div>

            {/* C. Duration & End Time Selection */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-400" />
                  مدة ووقت انتهاء الحدث:
                </label>

                {/* Toggle Custom vs Presets */}
                <button
                  type="button"
                  onClick={() => setIsCustomDate(!isCustomDate)}
                  className="text-xs text-amber-400 hover:underline font-bold cursor-pointer"
                >
                  {isCustomDate ? 'الرجوع للمدد الجاهزة' : 'تحديد تاريخ وساعة دقيقة 📅'}
                </button>
              </div>

              {!isCustomDate ? (
                /* Preset Duration Grid */
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                  {PRESET_DURATIONS.map((dur) => (
                    <button
                      key={dur.minutes}
                      type="button"
                      onClick={() => setDurationMinutes(dur.minutes)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        durationMinutes === dur.minutes
                          ? 'bg-purple-600/30 border-purple-500 text-purple-200 shadow-md'
                          : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              ) : (
                /* Custom Date Time Picker */
                <div className="space-y-2">
                  <label className="block text-xs text-slate-400">
                    حدد تاريخ ووقت انتهاء الحدث بالدقيقة:
                  </label>
                  <input
                    type="datetime-local"
                    value={customEndDateTime}
                    onChange={(e) => setCustomEndDateTime(e.target.value)}
                    className="w-full bg-slate-900 border border-purple-500/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none font-bold dir-ltr"
                    required={isCustomDate}
                  />
                </div>
              )}
            </div>

            {/* D. Theme & Styling Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-pink-400" />
                لون ومظهر شريط الحدث:
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {THEME_COLORS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setThemeColor(t.id)}
                    className={`p-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      themeColor === t.id
                        ? `${t.border} bg-gradient-to-r ${t.gradient} ${t.text} ring-2 ring-amber-400/30 scale-105`
                        : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <span>{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* E. Event Description / Broadcast Note */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                وصف أو رسالة الحدث (اختياري):
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="اكتب رسالة تحفيزية للاعبين..."
                rows={2}
                className="w-full bg-slate-800/90 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-all resize-none"
              />
            </div>

            {/* Submit Action Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl font-black text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 border border-yellow-200 transition-all cursor-pointer hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>جارِ إطلاق الحدث...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-slate-950" />
                    <span>🚀 إطلاق وتفعيل الحدث لجميع اللاعبين الآن</span>
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
