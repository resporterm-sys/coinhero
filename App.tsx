import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, ActiveTab, DonationMessage, GlobalGameSettings, GameEvent } from './types';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { Tapper } from './components/Tapper';
import { SearchModal } from './components/SearchModal';
import { KingDonateModal } from './components/KingDonateModal';
import { InboxModal } from './components/InboxModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { BannedScreen } from './components/BannedScreen';
import { EventManagementModal } from './components/EventManagementModal';
import { EventBanner } from './components/EventBanner';
import { 
  subscribeToUserDonations, 
  subscribeToUserProfile, 
  verifyUserBanStatus,
  subscribeToGlobalGameSettings,
  subscribeToActiveGameEvent 
} from './services/userService';
import { ShieldCheck, Loader2 } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'coin_tapper_current_user_v2';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isInitialChecking, setIsInitialChecking] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!saved) return false;
      const parsed = JSON.parse(saved) as UserProfile;
      // King doesn't need checking
      return !parsed.isKing;
    } catch {
      return false;
    }
  });

  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('tapper');
  const [donations, setDonations] = useState<DonationMessage[]>([]);
  const [selectedRecipientForKing, setSelectedRecipientForKing] = useState<UserProfile | null>(null);
  const [isDeletedAccount, setIsDeletedAccount] = useState<boolean>(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState<boolean>(false);
  const [activeEvent, setActiveEvent] = useState<GameEvent | null>(null);
  const [globalSettings, setGlobalSettings] = useState<GlobalGameSettings>({
    globalCollectingDisabled: false,
  });

  // Subscribe to real-time global server settings
  useEffect(() => {
    const unsub = subscribeToGlobalGameSettings((settings) => {
      setGlobalSettings(settings);
    });
    return () => unsub();
  }, []);

  // Subscribe to real-time active Game Event
  useEffect(() => {
    const unsub = subscribeToActiveGameEvent((ev) => {
      setActiveEvent(ev);
    });
    return () => unsub();
  }, []);

  // Initial Verification on Page Refresh / Startup
  useEffect(() => {
    let isMounted = true;

    const performInitialBanCheck = async () => {
      if (!currentUser || currentUser.isKing) {
        if (isMounted) setIsInitialChecking(false);
        return;
      }

      try {
        const result = await verifyUserBanStatus(currentUser.uid);

        if (!isMounted) return;

        if (result.isBanned) {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          setCurrentUser(null);
          setAuthError(result.banMessage || 'تم حظر حسابك بقرار من الملك Hero!');
          setIsInitialChecking(false);
          return;
        }

        if (result.user) {
          setCurrentUser((prev) => {
            if (!prev) return result.user!;
            return {
              ...prev,
              ...result.user,
              password: prev.password || result.user!.password,
            };
          });
        }
      } catch (err) {
        console.error('Initial ban check failed:', err);
      } finally {
        if (isMounted) {
          setIsInitialChecking(false);
        }
      }
    };

    performInitialBanCheck();

    return () => {
      isMounted = false;
    };
  }, []);

  // Continuous Silent Verification Every 1 Second in Background
  useEffect(() => {
    if (!currentUser || currentUser.isKing || isInitialChecking) return;

    const interval = setInterval(async () => {
      try {
        const result = await verifyUserBanStatus(currentUser.uid);
        if (result.isBanned) {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          setCurrentUser(null);
          setAuthError(result.banMessage || 'تم طردك وحظر حسابك بواسطة الملك Hero!');
        }
      } catch (err) {
        console.error('Silent ban verification error:', err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentUser?.uid, currentUser?.isKing, isInitialChecking]);

  // Save currentUser to localStorage when changed
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [currentUser]);

  // Real-time listener for current user profile changes (Bans, Verification badges, Coins, Account Deletions)
  useEffect(() => {
    if (!currentUser || currentUser.isKing) return;

    const unsubscribe = subscribeToUserProfile(currentUser.uid, (freshUser, isDeleted) => {
      if (isDeleted) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setCurrentUser(null);
        setAuthError('🚫 تم حذف هذا الحساب نهائياً من قبل الملك Hero!');
      } else if (freshUser) {
        if (
          freshUser.isBanned ||
          freshUser.banType === 'permanent' ||
          (freshUser.banType === 'temporary' &&
            freshUser.bannedUntil &&
            new Date(freshUser.bannedUntil).getTime() > Date.now())
        ) {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          setCurrentUser(null);
          const reason = freshUser.banReason ? `\nالسبب: "${freshUser.banReason}"` : '';
          setAuthError(
            freshUser.banType === 'permanent'
              ? `🚫 تم حظر هذا الحساب بشكل دائم ونهائي من قبل الملك Hero!${reason}\nتم طردك ومنع الوصول إلى اللعبة.`
              : `⛔ هذا الحساب محظور مؤقتاً من قبل الملك Hero!${reason}`
          );
        } else {
          setIsDeletedAccount(false);
          setCurrentUser((prev) => {
            if (!prev) return freshUser;
            return {
              ...prev,
              ...freshUser,
              password: prev.password || freshUser.password,
            };
          });
        }
      }
    });

    return () => unsubscribe();
  }, [currentUser?.uid, currentUser?.isKing]);

  // Real-time listener for incoming donations to this user
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToUserDonations(currentUser.username, (incoming) => {
      setDonations(incoming);
    });

    return () => unsubscribe();
  }, [currentUser?.username]);

  const handleCoinsChange = (newCoins: number) => {
    if (!currentUser) return;
    const updated = { ...currentUser, coins: newCoins };
    setCurrentUser(updated);
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setDonations([]);
    setIsDeletedAccount(false);
    setAuthError(null);
    setActiveTab('tapper');
  };

  // 1. Initial Checking Loading Screen on Page Refresh
  if (isInitialChecking) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans antialiased dir-rtl text-center select-none">
        <div className="w-full max-w-sm bg-slate-900/90 border border-amber-500/30 rounded-3xl p-8 shadow-2xl flex flex-col items-center relative overflow-hidden">
          
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 mb-4 animate-bounce">
            <ShieldCheck className="w-9 h-9" />
          </div>

          <h3 className="text-lg font-black text-white mb-1">
            جاري التحقق من أمان وحالة الحساب...
          </h3>

          <p className="text-xs text-slate-400 mb-5 leading-relaxed">
            فحص صلاحيات الحظر والقرارات الملكية مع السيرفر
          </p>

          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>لحظة واحدة...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Auth Modal Screen (if not logged in or if kicked out due to ban)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
        <AuthModal
          initialError={authError}
          onSuccess={(user) => {
            setAuthError(null);
            setIsDeletedAccount(false);
            setCurrentUser(user);
          }}
        />
      </div>
    );
  }

  // Active Ban Verification Check
  const isBannedActive = Boolean(
    !currentUser.isKing && (
      currentUser.isBanned ||
      currentUser.banType === 'permanent' ||
      (currentUser.banType === 'temporary' &&
        currentUser.bannedUntil &&
        new Date(currentUser.bannedUntil).getTime() > Date.now())
    )
  );

  const pendingDonationsCount = donations.filter((d) => d.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-slate-950 relative">
      
      {/* Instant Real-Time Ban & Account Deletion Lockdown Screen */}
      {(isBannedActive || isDeletedAccount) && (
        <BannedScreen
          user={currentUser}
          isDeleted={isDeletedAccount}
          onSignOut={handleSignOut}
        />
      )}

      {/* Top Header Navbar */}
      <Navbar
        user={currentUser}
        pendingDonationsCount={pendingDonationsCount}
        activeTab={activeTab}
        activeEvent={activeEvent}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenEventManagement={() => setIsEventModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Global Event Active Announcement Banner */}
      {activeEvent && activeEvent.isActive && (
        <EventBanner
          event={activeEvent}
          currentUser={currentUser}
          onOpenEventManagement={() => setIsEventModalOpen(true)}
        />
      )}

      {/* Main App Canvas / Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 flex flex-col">
        {activeTab === 'tapper' && (
          <Tapper
            user={currentUser}
            globalSettings={globalSettings}
            activeEvent={activeEvent}
            onCoinsChange={handleCoinsChange}
            onOpenSearch={() => setActiveTab('search')}
          />
        )}

        {activeTab === 'search' && (
          <SearchModal
            currentUser={currentUser}
            onSelectUserToDonate={(recipient) => setSelectedRecipientForKing(recipient)}
            onClose={() => setActiveTab('tapper')}
          />
        )}

        {activeTab === 'inbox' && (
          <InboxModal
            currentUser={currentUser}
            donations={donations}
            onCoinsUpdated={(newCoins) => handleCoinsChange(newCoins)}
            onClose={() => setActiveTab('tapper')}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardModal
            currentUser={currentUser}
            onClose={() => setActiveTab('tapper')}
          />
        )}

        {/* King Donation Modal overlay if triggered */}
        {selectedRecipientForKing && currentUser.isKing && (
          <KingDonateModal
            kingUser={currentUser}
            recipientUser={selectedRecipientForKing}
            onClose={() => setSelectedRecipientForKing(null)}
          />
        )}

        {/* King Hero Event Management Modal */}
        {isEventModalOpen && currentUser.isKing && (
          <EventManagementModal
            activeEvent={activeEvent}
            onClose={() => setIsEventModalOpen(false)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-slate-900 text-center text-slate-500 text-xs dir-rtl">
        <p>لعبة الكوينز الرقمية 🪙 • تعمل عبر Firebase • حساب الملك الموثق: <strong>Hero</strong></p>
      </footer>

    </div>
  );
}
