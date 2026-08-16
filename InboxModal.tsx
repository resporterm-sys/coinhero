import React, { useState } from 'react';
import { Mail, Crown, CheckCircle2, XCircle, Clock, Coins, Sparkles, Check, X } from 'lucide-react';
import { DonationMessage, UserProfile } from '../types';
import { acceptDonation, rejectDonation } from '../services/userService';
import { VerifiedBadge } from './VerifiedBadge';

interface InboxModalProps {
  currentUser: UserProfile;
  donations: DonationMessage[];
  onCoinsUpdated: (newCoins: number) => void;
  onClose: () => void;
}

export const InboxModal: React.FC<InboxModalProps> = ({
  currentUser,
  donations,
  onCoinsUpdated,
  onClose,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'accepted' | 'rejected' | 'all'>('pending');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAccept = async (donation: DonationMessage) => {
    setProcessingId(donation.id);
    try {
      const updatedCoins = await acceptDonation(
        donation.id,
        currentUser.uid,
        currentUser.coins,
        donation.amount
      );
      onCoinsUpdated(updatedCoins);
      setSuccessMsg(`مبروك! تم استلام ${donation.amount.toLocaleString('en-US')} كوينز بنجاح ✨`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Failed to accept donation:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (donation: DonationMessage) => {
    setProcessingId(donation.id);
    try {
      await rejectDonation(donation.id);
      setSuccessMsg('تم رفض التبرع');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Failed to reject donation:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredDonations = donations.filter((d) => {
    if (filter === 'pending') return d.status === 'pending';
    if (filter === 'accepted') return d.status === 'accepted';
    if (filter === 'rejected') return d.status === 'rejected';
    return true;
  });

  const pendingCount = donations.filter((d) => d.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md dir-rtl text-right">
      <div className="w-full max-w-xl bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh] relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-amber-400" />
              قائمة الرسائل الإلكترونية
              {pendingCount > 0 && (
                <span className="bg-amber-500 text-slate-950 text-xs px-2 py-0.5 rounded-full font-black">
                  {pendingCount} جديد
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              استلم أو ارفض التبرعات الواردة إليك من الملك Hero
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-lg font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="my-3 p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            {successMsg}
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex bg-slate-800/80 p-1 rounded-2xl my-4 border border-slate-700/60 text-xs">
          <button
            onClick={() => setFilter('pending')}
            className={`flex-1 py-2 font-bold rounded-xl transition-all ${
              filter === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            الطلبات المعلقة ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('accepted')}
            className={`flex-1 py-2 font-bold rounded-xl transition-all ${
              filter === 'accepted'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            المستلمة ({donations.filter((d) => d.status === 'accepted').length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`flex-1 py-2 font-bold rounded-xl transition-all ${
              filter === 'rejected'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            المرفوضة ({donations.filter((d) => d.status === 'rejected').length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 font-bold rounded-xl transition-all ${
              filter === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            الكل ({donations.length})
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 custom-scrollbar">
          {filteredDonations.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              لا توجد رسائل إلكترونية في هذه القائمة حالياً
            </div>
          ) : (
            filteredDonations.map((donation) => {
              const isPending = donation.status === 'pending';
              const isAccepted = donation.status === 'accepted';
              const isRejected = donation.status === 'rejected';

              return (
                <div
                  key={donation.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isPending
                      ? 'bg-gradient-to-r from-amber-500/15 via-slate-800/90 to-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/10'
                      : isAccepted
                      ? 'bg-slate-800/40 border-emerald-500/30'
                      : 'bg-slate-800/30 border-slate-700/40 opacity-70'
                  }`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
                        <Crown className="w-4 h-4 fill-amber-400" />
                      </div>
                      <span className="font-black text-white text-sm flex items-center gap-1.5">
                        {donation.fromUsername}
                        <VerifiedBadge type={donation.fromUsername.toLowerCase() === 'hero' ? 'purple' : 'none'} size="sm" />
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(donation.createdAt).toLocaleDateString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {/* Donation Amount Badge */}
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-700/60 my-2 flex items-center justify-between">
                    <span className="text-slate-400 text-xs">مبلغ التبرع الملكي:</span>
                    <span className="text-amber-400 font-black text-base flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      +{donation.amount.toLocaleString('en-US')} كوينز
                    </span>
                  </div>

                  {/* Message Note */}
                  {donation.note && (
                    <p className="text-slate-300 text-xs bg-slate-900/40 p-2.5 rounded-xl border border-slate-800 italic mb-3">
                      "{donation.note}"
                    </p>
                  )}

                  {/* Accept / Reject Buttons or Status Badge */}
                  {isPending ? (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleAccept(donation)}
                        disabled={processingId === donation.id}
                        className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {processingId === donation.id ? (
                          <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4 stroke-[3]" />
                            استلام الكوينز
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleReject(donation)}
                        disabled={processingId === donation.id}
                        className="py-2.5 px-4 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        رفض
                      </button>
                    </div>
                  ) : (
                    <div className="pt-1 flex justify-end">
                      {isAccepted && (
                        <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> تم الاستلام بنجاح
                        </span>
                      )}
                      {isRejected && (
                        <span className="bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> تم الرفض
                        </span>
                      )}
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
