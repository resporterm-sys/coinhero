import React, { useState } from 'react';
import { 
  ShieldAlert, 
  KeyRound, 
  User, 
  Coins, 
  Calendar, 
  Clock, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Crown, 
  Send,
  Fingerprint,
  Sparkles,
  ShieldCheck,
  ShieldX,
  BadgeCheck,
  Zap,
  Ban,
  Trash2,
  AlertTriangle,
  RotateCcw,
  UserX,
  Lock,
  Unlock
} from 'lucide-react';
import { UserProfile, VerificationType, BanType } from '../types';
import { getLevelInfo, formatCoins } from '../utils/levels';
import { VerifiedBadge } from './VerifiedBadge';
import { 
  updateUserVerificationInDb, 
  banUserInDb, 
  unbanUserInDb, 
  deleteUserAccountInDb,
  toggleUserCollectingInDb 
} from '../services/userService';

interface AccountDetailsModalProps {
  user: UserProfile;
  onSendCoins?: (user: UserProfile) => void;
  onVerificationChanged?: (targetUid: string, newType: VerificationType) => void;
  onCollectingStatusChanged?: (targetUid: string, disabled: boolean) => void;
  onAccountBanStatusChanged?: (updatedUser: UserProfile) => void;
  onAccountDeleted?: (uid: string) => void;
  onClose: () => void;
}

export const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({
  user,
  onSendCoins,
  onVerificationChanged,
  onCollectingStatusChanged,
  onAccountBanStatusChanged,
  onAccountDeleted,
  onClose,
}) => {
  const [currentUserData, setCurrentUserData] = useState<UserProfile>(user);
  const [showPassword, setShowPassword] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [verifyingLoading, setVerifyingLoading] = useState(false);
  const [collectingLoading, setCollectingLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Ban management states
  const [banLoading, setBanLoading] = useState(false);
  const [banMode, setBanMode] = useState<'temporary' | 'permanent'>('temporary');
  const [banDurationHours, setBanDurationHours] = useState<number>(24);
  const [banReason, setBanReason] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const level = getLevelInfo(currentUserData.coins, currentUserData.isKing);

  const isBannedActive = Boolean(
    currentUserData.isBanned ||
    currentUserData.banType === 'permanent' ||
    (currentUserData.banType === 'temporary' && currentUserData.bannedUntil && new Date(currentUserData.bannedUntil).getTime() > Date.now())
  );

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSetVerification = async (type: VerificationType) => {
    if (currentUserData.isKing && type !== 'purple') {
      setStatusMessage({ text: 'حساب الملك Hero يحمل التوثيق البنفسجي الأسطوري الدائم 👑' });
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    setVerifyingLoading(true);
    setStatusMessage(null);
    try {
      await updateUserVerificationInDb(currentUserData.uid, type);
      const isVerified = type !== 'none';
      const updatedUser: UserProfile = {
        ...currentUserData,
        isVerified,
        verificationType: type,
      };
      setCurrentUserData(updatedUser);

      if (onVerificationChanged) {
        onVerificationChanged(currentUserData.uid, type);
      }

      if (type === 'purple') {
        setStatusMessage({ text: '✨ تم منح التوثيق البنفسجي الأسطوري بنجاح!' });
      } else if (type === 'blue') {
        setStatusMessage({ text: '✓ تم منح علامة التوثيق الزرقاء بنجاح!' });
      } else {
        setStatusMessage({ text: '✕ تم إلغاء وحذف علامة التوثيق من الحساب.' });
      }

      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error('Failed to change verification:', err);
      setStatusMessage({ text: 'حدث خطأ أثناء تعديل حالة التوثيق', isError: true });
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setVerifyingLoading(false);
    }
  };

  const handleToggleCollecting = async (disabled: boolean) => {
    if (currentUserData.isKing) {
      setStatusMessage({ text: 'حساب الملك Hero لا يمكن إيقافه!', isError: true });
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    setCollectingLoading(true);
    setStatusMessage(null);
    try {
      await toggleUserCollectingInDb(currentUserData.uid, disabled);
      const updatedUser: UserProfile = {
        ...currentUserData,
        isCollectingDisabled: disabled,
        updatedAt: new Date().toISOString(),
      };
      setCurrentUserData(updatedUser);

      if (onCollectingStatusChanged) {
        onCollectingStatusChanged(currentUserData.uid, disabled);
      }
      if (onAccountBanStatusChanged) {
        onAccountBanStatusChanged(updatedUser);
      }

      setStatusMessage({
        text: disabled
          ? '🔒 تم إيقاف وتجميد تجميع الكوينز لهذا اللاعب بنجاح!'
          : '🟢 تم تفعيل واستئناف تجميع الكوينز لهذا اللاعب بنجاح!',
      });
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err: any) {
      console.error('Failed to toggle collecting:', err);
      setStatusMessage({ text: err.message || 'فشل في تعديل حالة التجميع', isError: true });
      setTimeout(() => setStatusMessage(null), 3500);
    } finally {
      setCollectingLoading(false);
    }
  };

  const handleApplyBan = async () => {
    if (currentUserData.isKing) {
      setStatusMessage({ text: 'لا يمكن حظر حساب الملك Hero!', isError: true });
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    setBanLoading(true);
    setStatusMessage(null);
    try {
      const reasonToUse = banReason.trim() || (banMode === 'temporary' ? 'مخالفة مؤقتة لقوانين اللعبة' : 'مخالفة جسيمة لقوانين اللعبة');
      const { bannedUntil, banReason: cleanReason } = await banUserInDb(
        currentUserData.uid,
        banMode,
        banDurationHours,
        reasonToUse
      );

      const updatedUser: UserProfile = {
        ...currentUserData,
        isBanned: true,
        banType: banMode,
        banReason: cleanReason,
        bannedUntil,
        bannedAt: new Date().toISOString(),
        bannedBy: 'الملك Hero',
      };
      setCurrentUserData(updatedUser);

      if (onAccountBanStatusChanged) {
        onAccountBanStatusChanged(updatedUser);
      }

      setStatusMessage({
        text: banMode === 'temporary'
          ? `⛔ تم حظر الحساب مؤقتاً بنجاح!`
          : `🚫 تم حظر الحساب بشكل دائم بنجاح!`
      });
      setBanReason('');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to ban user:', err);
      setStatusMessage({ text: err.message || 'فشل في تطبيق الحظر', isError: true });
      setTimeout(() => setStatusMessage(null), 3500);
    } finally {
      setBanLoading(false);
    }
  };

  const handleUnban = async () => {
    setBanLoading(true);
    setStatusMessage(null);
    try {
      await unbanUserInDb(currentUserData.uid);
      const updatedUser: UserProfile = {
        ...currentUserData,
        isBanned: false,
        banType: 'none',
        banReason: '',
        bannedUntil: null,
        bannedAt: null,
        bannedBy: null,
      };
      setCurrentUserData(updatedUser);

      if (onAccountBanStatusChanged) {
        onAccountBanStatusChanged(updatedUser);
      }

      setStatusMessage({ text: '🟢 تم إلغاء وفك الحظر عن هذا الحساب بنجاح!' });
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err: any) {
      console.error('Failed to unban user:', err);
      setStatusMessage({ text: err.message || 'فشل في إلغاء الحظر', isError: true });
      setTimeout(() => setStatusMessage(null), 3500);
    } finally {
      setBanLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (currentUserData.isKing) {
      setStatusMessage({ text: 'لا يمكن حذف حساب الملك Hero!', isError: true });
      return;
    }

    setBanLoading(true);
    try {
      await deleteUserAccountInDb(currentUserData.uid);
      if (onAccountDeleted) {
        onAccountDeleted(currentUserData.uid);
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      setStatusMessage({ text: err.message || 'فشل في حذف الحساب', isError: true });
      setBanLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const currentBadgeType: VerificationType =
    currentUserData.isKing || currentUserData.usernameLower === 'hero'
      ? 'purple'
      : currentUserData.verificationType === 'purple'
      ? 'purple'
      : currentUserData.verificationType === 'blue'
      ? 'blue'
      : 'none';

  const formattedCreatedDate = currentUserData.createdAt
    ? new Date(currentUserData.createdAt).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'غير متوفر';

  const formattedUpdatedDate = currentUserData.updatedAt
    ? new Date(currentUserData.updatedAt).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'غير متوفر';

  const formattedBanExpiry = currentUserData.bannedUntil
    ? new Date(currentUserData.bannedUntil).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md dir-rtl text-right">
      <div className="w-full max-w-lg bg-slate-900 border border-amber-500/50 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-amber-500/10 relative overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Glow ambient effects */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-1.5">
                كشف معلومات وإدارة الحساب الملكية
                <Crown className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-[11px] text-amber-300 font-semibold">
                صلاحية خاصة وحصرية بالملك Hero فقط 👑
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1 custom-scrollbar">
          
          {/* User Profile Card Header */}
          <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
            isBannedActive
              ? 'bg-red-950/40 border-red-500/60 shadow-lg shadow-red-950/50'
              : 'bg-slate-800/60 border-slate-700/80'
          }`}>
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${level.bgGradient} border ${level.borderColor} flex items-center justify-center text-2xl shadow-lg shrink-0`}>
              {currentUserData.isKing ? '👑' : isBannedActive ? '🚫' : level.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-lg font-black text-white truncate">{currentUserData.username}</span>
                
                {/* Dynamic Royal / Standard Badge */}
                <VerifiedBadge type={currentBadgeType} size="md" />

                {currentUserData.isKing && (
                  <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    الملك Hero
                  </span>
                )}

                {isBannedActive && (
                  <span className="bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md animate-pulse">
                    <Ban className="w-3 h-3" />
                    {currentUserData.banType === 'temporary' ? 'محظور مؤقتاً' : 'محظور دائمياً'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs mt-0.5">
                <span className={`font-bold ${level.color}`}>{level.name}</span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400 font-extrabold flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" />
                  {formatCoins(currentUserData.coins, currentUserData.isKing)} كوينز
                </span>
              </div>
            </div>
          </div>

          {/* King Verification Management Control Panel */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-indigo-950/40 border-2 border-purple-500/50 shadow-lg shadow-purple-500/10">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                التحكم الملكي في علامات التوثيق للحساب:
              </span>
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-slate-400">الحالة:</span>
                {currentBadgeType === 'purple' ? (
                  <span className="font-extrabold text-purple-300 flex items-center gap-1 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30">
                    <Sparkles className="w-3 h-3 text-amber-300" /> توثيق بنفسجي أسطوري
                  </span>
                ) : currentBadgeType === 'blue' ? (
                  <span className="font-extrabold text-blue-300 flex items-center gap-1 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
                    <BadgeCheck className="w-3 h-3 fill-blue-500 text-slate-900" /> توثيق أزرق
                  </span>
                ) : (
                  <span className="font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                    غير موثق
                  </span>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
              بصفتك <strong className="text-amber-300">الملك Hero</strong>، يمكنك منح هذا اللاعب علامة التوثيق البنفسجية الأسطورية أو الزرقاء، أو إلغاء التوثيق في أي وقت:
            </p>

            {/* 3 Verification Action Buttons */}
            <div className="grid grid-cols-3 gap-2">
              
              {/* Purple Royal Badge Button */}
              <button
                type="button"
                disabled={verifyingLoading}
                onClick={() => handleSetVerification('purple')}
                className={`py-2.5 px-2 rounded-xl text-xs font-black flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                  currentBadgeType === 'purple'
                    ? 'bg-purple-600/30 border-purple-400 text-purple-200 ring-2 ring-purple-500/50 shadow-lg shadow-purple-600/20'
                    : 'bg-purple-950/40 hover:bg-purple-900/60 border-purple-500/40 text-purple-300 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1">
                  <BadgeCheck className="w-4 h-4 fill-purple-500 text-purple-100" />
                  <Sparkles className="w-3 h-3 text-amber-300" />
                </div>
                <span>توثيق بنفسجي 👑</span>
                <span className="text-[9px] text-purple-300/80 font-normal">(الأقوى)</span>
              </button>

              {/* Blue Verification Badge Button */}
              <button
                type="button"
                disabled={verifyingLoading || currentUserData.isKing}
                onClick={() => handleSetVerification('blue')}
                className={`py-2.5 px-2 rounded-xl text-xs font-black flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                  currentBadgeType === 'blue'
                    ? 'bg-blue-600/30 border-blue-400 text-blue-200 ring-2 ring-blue-500/50 shadow-lg shadow-blue-600/20'
                    : 'bg-blue-950/40 hover:bg-blue-900/60 border-blue-500/40 text-blue-300 hover:text-white'
                }`}
              >
                <BadgeCheck className="w-4 h-4 fill-blue-500 text-slate-900" />
                <span>توثيق أزرق</span>
                <span className="text-[9px] text-blue-300/80 font-normal">(رسمي)</span>
              </button>

              {/* Remove Verification Button */}
              <button
                type="button"
                disabled={verifyingLoading || currentUserData.isKing}
                onClick={() => handleSetVerification('none')}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                  currentBadgeType === 'none'
                    ? 'bg-red-950/40 border-red-500/60 text-red-300 ring-1 ring-red-500/30'
                    : 'bg-slate-800/80 hover:bg-red-950/30 border-slate-700 hover:border-red-500/40 text-slate-400 hover:text-red-300'
                }`}
              >
                <ShieldX className="w-4 h-4 text-red-400" />
                <span>إلغاء التوثيق</span>
                <span className="text-[9px] text-slate-500 font-normal">(حذف العلامة)</span>
              </button>

            </div>

            {/* Notification alert */}
            {statusMessage && (
              <div className={`mt-2.5 p-2.5 rounded-xl text-center text-xs font-black animate-fadeIn ${
                statusMessage.isError
                  ? 'bg-red-500/20 border border-red-500/40 text-red-200'
                  : 'bg-purple-500/20 border border-purple-500/40 text-purple-200'
              }`}>
                {statusMessage.text}
              </div>
            )}
          </div>

          {/* KING COIN COLLECTING FREEZE / RESUME (Hero Exclusive) */}
          {!currentUserData.isKing && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-amber-950/20 border-2 border-amber-500/40 shadow-lg shadow-amber-500/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  التحكم في تجميع الكوينز للاعب (خاص بالملك Hero):
                </span>
                {currentUserData.isCollectingDisabled ? (
                  <span className="bg-red-500/20 text-red-300 border border-red-500/40 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3 text-red-400" />
                    التجميع موقوف ومجمّد
                  </span>
                ) : (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Unlock className="w-3 h-3 text-emerald-400" />
                    التجميع مفعّل ونشط
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
                يمكنك كـ <strong className="text-amber-300">الملك Hero</strong> إيقاف وتجميد قدرة هذا اللاعب على جمع الكوينز والضغط بشكل فوري، أو إعادة تفعيلها:
              </p>

              <div className="grid grid-cols-2 gap-2">
                {/* Freeze button */}
                <button
                  type="button"
                  disabled={collectingLoading || currentUserData.isCollectingDisabled}
                  onClick={() => handleToggleCollecting(true)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                    currentUserData.isCollectingDisabled
                      ? 'bg-red-950/50 border-red-500/50 text-red-400 opacity-60 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-600/30 via-red-500/20 to-amber-600/30 hover:from-red-600/50 hover:to-amber-600/50 border-red-500/50 text-red-200 hover:text-white shadow-md'
                  }`}
                >
                  <Lock className="w-4 h-4 text-red-400" />
                  <span>إيقاف تجميع الكوينز 🔒</span>
                </button>

                {/* Enable button */}
                <button
                  type="button"
                  disabled={collectingLoading || !currentUserData.isCollectingDisabled}
                  onClick={() => handleToggleCollecting(false)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                    !currentUserData.isCollectingDisabled
                      ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-400 opacity-60 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-600/30 via-emerald-500/20 to-teal-600/30 hover:from-emerald-600/50 hover:to-teal-600/50 border-emerald-500/50 text-emerald-200 hover:text-white shadow-md'
                  }`}
                >
                  <Unlock className="w-4 h-4 text-emerald-400" />
                  <span>إعادة وتفعيل التجميع 🟢</span>
                </button>
              </div>
            </div>
          )}

          {/* KING BAN & ACCOUNT DELETION MANAGEMENT (Hero Exclusive) */}
          {!currentUserData.isKing && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-red-950/50 via-slate-900 to-amber-950/40 border-2 border-red-500/60 shadow-xl shadow-red-950/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-red-300 flex items-center gap-1.5">
                  <Ban className="w-4 h-4 text-red-400" />
                  إدارة حظر وحذف الحساب (خاص بالملك Hero):
                </span>
                {isBannedActive && (
                  <span className="bg-red-500 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    محظور حالياً
                  </span>
                )}
              </div>

              {/* If Currently Banned */}
              {isBannedActive ? (
                <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-xl mb-3 space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-red-200">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">
                        {currentUserData.banType === 'temporary' ? 'حظر مؤقت نشط' : 'حظر دائم ونهائي نشط'}
                      </div>
                      <div className="text-[11px] text-red-300/90 mt-0.5">
                        السبب: {currentUserData.banReason || 'مخالفة قوانين اللعبة'}
                      </div>
                      {formattedBanExpiry && (
                        <div className="text-[10px] text-amber-300 font-bold mt-1">
                          تاريخ انتهاء الحظر: {formattedBanExpiry}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={banLoading}
                    onClick={handleUnban}
                    className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    إلغاء وفك الحظر عن هذا الحساب الآن
                  </button>
                </div>
              ) : (
                /* Ban Configuration Form */
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    يمكنك تطبيق حظر مؤقت بمدة محددة أو حظر دائم نهائي مع إظهار رسالة سبب الحظر للاعب عند محاولة تسجيل الدخول:
                  </p>

                  {/* Mode Selector Tabs */}
                  <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setBanMode('temporary')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        banMode === 'temporary'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      حظر مؤقت (مدة محددة)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBanMode('permanent')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        banMode === 'permanent'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      حظر دائم ونهائي
                    </button>
                  </div>

                  {/* Temporary Duration Selector */}
                  {banMode === 'temporary' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                        اختر مدة الحظر المؤقت:
                      </label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[
                          { hours: 1, label: '1 ساعة' },
                          { hours: 24, label: '24 ساعة' },
                          { hours: 72, label: '3 أيام' },
                          { hours: 168, label: '7 أيام' },
                          { hours: 720, label: '30 يوماً' },
                        ].map((item) => (
                          <button
                            key={item.hours}
                            type="button"
                            onClick={() => setBanDurationHours(item.hours)}
                            className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              banDurationHours === item.hours
                                ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400'
                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ban Reason Input */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      سبب الحظر (سيظهر للاعب عند محاولة الدخول):
                    </label>
                    <input
                      type="text"
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      placeholder={
                        banMode === 'temporary'
                          ? 'مثال: مخالفة قوانين اللعبة وسلوك غير لائق'
                          : 'مثال: استخدام أدوات غير مسموحة ومخالفة التعليمات'
                      }
                      className="w-full bg-slate-950/90 border border-slate-700 focus:border-red-500 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Submit Ban Button */}
                  <button
                    type="button"
                    disabled={banLoading}
                    onClick={handleApplyBan}
                    className={`w-full py-2.5 px-3 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                      banMode === 'temporary'
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        : 'bg-red-600 hover:bg-red-500 text-white'
                    }`}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    {banMode === 'temporary' ? 'تطبيق الحظر المؤقت على الحساب' : 'تطبيق الحظر الدائم والنهائي'}
                  </button>
                </div>
              )}

              {/* Hard Delete Account Section */}
              <div className="mt-3 pt-3 border-t border-red-500/20">
                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    disabled={banLoading}
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-2 px-3 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    حذف الحساب نهائياً من قاعدة البيانات
                  </button>
                ) : (
                  <div className="p-3 bg-red-950/80 border border-red-500 rounded-xl space-y-2 text-xs">
                    <p className="font-black text-red-200 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      تأكيد الحذف النهائي لحساب "{currentUserData.username}"؟
                    </p>
                    <p className="text-[10px] text-red-300">
                      سيتم مسح بيانات الحساب والكوينز وكلمة المرور بالكامل ولا يمكن التراجع عن هذه الخطوة.
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        disabled={banLoading}
                        onClick={handleDeleteAccount}
                        className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-lg shadow transition-all cursor-pointer"
                      >
                        نعم، احذف الحساب نهائياً
                      </button>
                      <button
                        type="button"
                        disabled={banLoading}
                        onClick={() => setShowDeleteConfirm(false)}
                        className="py-2 px-3 bg-slate-800 text-slate-300 font-bold text-xs rounded-lg hover:bg-slate-700 transition-all cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Password Security Box (The Core Request) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-red-500/10 to-amber-500/15 border-2 border-amber-500/60 shadow-lg shadow-amber-500/10">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-yellow-400" />
                كلمة المرور الحالية للحساب:
              </label>
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] font-bold text-slate-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" /> إخفاء
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" /> إظهار
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between bg-slate-950/80 rounded-xl p-3 border border-amber-500/40">
              <div className="font-mono text-sm sm:text-base font-bold text-yellow-300 tracking-wider select-all">
                {showPassword ? (
                  currentUserData.password || '<لم يتم تعيين كلمة مرور>'
                ) : (
                  '••••••••••••'
                )}
              </div>

              {currentUserData.password && (
                <button
                  onClick={() => copyToClipboard(currentUserData.password || '', 'password')}
                  className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 border border-amber-500/30 transition-all cursor-pointer"
                >
                  {copiedField === 'password' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> تم النسخ
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> نسخ
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Full Account Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            
            {/* UID */}
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60">
              <div className="text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
                معرّف الحساب (UID):
              </div>
              <div className="font-mono text-[11px] text-slate-200 truncate flex items-center justify-between gap-1">
                <span className="truncate">{currentUserData.uid}</span>
                <button
                  onClick={() => copyToClipboard(currentUserData.uid, 'uid')}
                  className="text-slate-400 hover:text-amber-300 p-1 cursor-pointer"
                  title="نسخ UID"
                >
                  {copiedField === 'uid' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Username Lower */}
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60">
              <div className="text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                اسم المستخدم للبحث:
              </div>
              <div className="font-mono text-[11px] text-slate-200 truncate">
                {currentUserData.usernameLower}
              </div>
            </div>

            {/* Created At */}
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60">
              <div className="text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                تاريخ إنشاء الحساب:
              </div>
              <div className="text-slate-300 text-[11px]">
                {formattedCreatedDate}
              </div>
            </div>

            {/* Last Updated */}
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60">
              <div className="text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                آخر نشاط / تحديث:
              </div>
              <div className="text-slate-300 text-[11px]">
                {formattedUpdatedDate}
              </div>
            </div>

          </div>

          {/* Account Status Flags */}
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">حالة الحساب:</span>
            <div className="flex gap-2">
              {currentUserData.isKing ? (
                <span className="bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/40 text-[11px]">
                  👑 حساب الملك الرئيسي
                </span>
              ) : isBannedActive ? (
                <span className="bg-red-500/20 text-red-300 font-bold px-2 py-0.5 rounded-full border border-red-500/40 text-[11px] flex items-center gap-1">
                  <Ban className="w-3 h-3 text-red-400" />
                  {currentUserData.banType === 'temporary' ? 'محظور مؤقتاً' : 'محظور دائمياً'}
                </span>
              ) : (
                <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/40 text-[11px]">
                  ✓ حساب لاعب نشط
                </span>
              )}
              {currentBadgeType === 'purple' ? (
                <span className="bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/40 text-[11px] flex items-center gap-1">
                  علامة بنفسجية أسطورية
                </span>
              ) : currentBadgeType === 'blue' ? (
                <span className="bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-500/40 text-[11px]">
                  علامة التوثيق الزرقاء
                </span>
              ) : null}
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex gap-2">
          {onSendCoins && !currentUserData.isKing && (
            <button
              onClick={() => {
                onSendCoins(currentUserData);
                onClose();
              }}
              className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4 fill-slate-950" />
              إرسال كوينز لهذا الحساب
            </button>
          )}

          <button
            onClick={onClose}
            className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
