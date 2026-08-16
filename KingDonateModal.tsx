import React, { useState } from 'react';
import { Crown, Send, Coins, Sparkles, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';
import { sendCoinDonation } from '../services/userService';

interface KingDonateModalProps {
  kingUser: UserProfile;
  recipientUser: UserProfile;
  onClose: () => void;
}

const PRESET_AMOUNTS = [10000, 100000, 1000000, 10000000, 100000000];

export const KingDonateModal: React.FC<KingDonateModalProps> = ({
  kingUser,
  recipientUser,
  onClose,
}) => {
  const [amount, setAmount] = useState<number>(100000);
  const [note, setNote] = useState('تبرع ملكي فاخر من الملك Hero! 👑✨');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError('يرجى تحديد كمية كوينز صالحة');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await sendCoinDonation(
        kingUser.username,
        recipientUser.username,
        recipientUser.uid,
        amount,
        note
      );
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إرسال التبرع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md dir-rtl text-right">
      <div className="w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 shadow-lg shadow-amber-500/30 mb-3">
            <Crown className="w-8 h-8 fill-slate-950" />
          </div>
          <h2 className="text-2xl font-black text-white">
            إرسال تبرع ملكي بالكوينز
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            من الملك <strong className="text-amber-400">Hero 👑</strong> إلى اللاعب <strong className="text-white">{recipientUser.username}</strong>
          </p>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-xl font-black text-white">تم إرسال التبرع الملكي بنجاح!</h3>
            <p className="text-slate-400 text-xs">
              سيظهر التبرع في قائمة الرسائل الإلكترونية لـ {recipientUser.username} لاستلامه أو رفضه.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold">
                ⚠️ {error}
              </div>
            )}

            {/* Quick Amount Buttons */}
            <div>
              <label className="block text-slate-300 text-xs font-bold mb-2">
                اختر كمية الكوينز للتبرع:
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      amount === amt
                        ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {amt.toLocaleString('en-US')}
                  </button>
                ))}
              </div>

              {/* Custom Amount Input */}
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="أدخل مبلغا مخصصا..."
                  required
                  min={1}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-amber-500 rounded-2xl py-3 px-4 pr-11 text-white font-mono focus:outline-none"
                />
                <Coins className="absolute right-4 top-3.5 w-5 h-5 text-amber-400" />
              </div>
            </div>

            {/* Custom Royal Message Note */}
            <div>
              <label className="block text-slate-300 text-xs font-bold mb-2">
                رسالة إلكترونية مرافقة للتبرع:
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="اكتب رسالة للاعب..."
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 focus:border-amber-500 rounded-2xl p-3.5 text-white text-xs focus:outline-none resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-amber-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 fill-slate-950" />
                    تأكيد إرسال التبرع الملكي
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
