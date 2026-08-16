import React, { useState } from 'react';
import { Crown, User, Lock, Sparkles, ShieldCheck, ArrowRight, Gamepad2 } from 'lucide-react';
import { loginOrRegisterUser, loginAsKing } from '../services/userService';
import { UserProfile } from '../types';

interface AuthModalProps {
  onSuccess: (user: UserProfile) => void;
  initialError?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess, initialError }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'king'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [kingPassword, setKingPassword] = useState('');
  const [error, setError] = useState<string | null>(initialError || null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (initialError) {
      setError(initialError);
    }
  }, [initialError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'king') {
        const king = await loginAsKing(kingPassword);
        onSuccess(king);
      } else {
        const user = await loginOrRegisterUser(username, password);
        onSuccess(user);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md text-right dir-rtl">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-500/10 relative overflow-hidden">
        
        {/* Glow ambient background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header Icon & Title */}
        <div className="text-center mb-8 relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/30 mb-4 animate-pulse">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-amber-400">
              {mode === 'king' ? <Crown className="w-8 h-8 text-amber-400" /> : <Gamepad2 className="w-8 h-8 text-yellow-400" />}
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
            {mode === 'king' ? (
              <span className="flex items-center justify-center gap-2 text-amber-400">
                تسجيل الدخول كـ ملك <Crown className="w-6 h-6 inline" />
              </span>
            ) : mode === 'register' ? (
              'إنشاء حساب جديد'
            ) : (
              'تسجيل الدخول إلى اللعبة'
            )}
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            {mode === 'king'
              ? 'أدخل كلمة مرور الملك للوصول إلى الصلاحيات الكاملة والكوينز اللانهائية'
              : 'ادخل اسمك وكلمة المرور للبدء في جمع الكوينز والوصول للمستويات العالية'}
          </p>
        </div>

        {/* Tab Buttons for Player Login / Register */}
        {mode !== 'king' && (
          <div className="flex bg-slate-800/80 p-1 rounded-2xl mb-6 border border-slate-700/60">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              تسجيل دخول
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                mode === 'register'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              حساب جديد
            </button>
          </div>
        )}

        {/* Error / Ban Alert */}
        {error && (
          <div className={`mb-6 p-4 rounded-2xl border text-sm font-semibold flex items-start gap-3 transition-all ${
            error.startsWith('⛔') || error.startsWith('🚫')
              ? 'bg-red-950/70 border-red-500/70 text-red-200 shadow-lg shadow-red-900/30 ring-1 ring-red-500/50'
              : 'bg-red-500/15 border-red-500/30 text-red-300'
          }`}>
            <span className="text-xl shrink-0 mt-0.5">
              {error.startsWith('⛔') ? '⛔' : error.startsWith('🚫') ? '🚫' : '⚠️'}
            </span>
            <div className="flex-1 whitespace-pre-line leading-relaxed">
              {error}
            </div>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'king' ? (
            <div>
              <label className="block text-slate-300 text-xs font-bold mb-2">كلمة مرور الملك السريّة</label>
              <div className="relative">
                <input
                  type="password"
                  value={kingPassword}
                  onChange={(e) => setKingPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور الملكية..."
                  required
                  className="w-full bg-slate-800/90 border border-amber-500/40 rounded-2xl py-3.5 px-4 pr-11 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono"
                />
                <Lock className="absolute right-4 top-4 w-5 h-5 text-amber-400 pointer-events-none" />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-slate-300 text-xs font-bold mb-2">اسم المستخدم</label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="مثال: Ahmed10"
                    required
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-2xl py-3.5 px-4 pr-11 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  />
                  <User className="absolute right-4 top-4 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-bold mb-2">كلمة المرور</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-2xl py-3.5 px-4 pr-11 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  />
                  <Lock className="absolute right-4 top-4 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : mode === 'king' ? (
              <>
                <Crown className="w-5 h-5 fill-slate-950" />
                دخول كـ ملك
              </>
            ) : mode === 'register' ? (
              <>
                <Sparkles className="w-5 h-5" />
                إنشاء الحساب وبدء اللعب
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                دخول الحساب
              </>
            )}
          </button>
        </form>

        {/* Divider & King Login Prompt */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          {mode === 'king' ? (
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className="text-slate-400 hover:text-amber-400 text-xs font-bold flex items-center justify-center gap-1.5 mx-auto transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              العودة إلى تسجيل دخول اللاعبين العاديين
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setMode('king'); setError(null); }}
              className="group py-3 px-4 w-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-2xl text-amber-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Crown className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
              تسجيل الدخول كـ ملك (خاص بالملك Hero)
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
