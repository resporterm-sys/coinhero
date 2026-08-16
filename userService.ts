import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  addDoc,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, DonationMessage, BanType, GlobalGameSettings, GameEvent } from '../types';

const KING_PASSWORD = 'hamza11223344';
const KING_USERNAME = 'Hero';

export async function loginOrRegisterUser(usernameInput: string, passwordInput: string): Promise<UserProfile> {
  const cleanUsername = usernameInput.trim();
  if (!cleanUsername) throw new Error('يرجى إدخال اسم المستخدم');
  if (!passwordInput) throw new Error('يرجى إدخال كلمة المرور');

  const usernameLower = cleanUsername.toLowerCase();

  // Strict Hero Security Protection: Nobody can register or use 'hero' via standard login
  if (usernameLower === 'hero' || usernameLower === 'hero👑' || usernameLower.includes('hero')) {
    if (usernameLower === 'hero') {
      throw new Error('حساب Hero محمي وخاص بالملك فقط! استخدم زر "تسجيل الدخول كـ ملك" حصراً.');
    }
  }

  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('usernameLower', '==', usernameLower));
  const querySnap = await getDocs(q);

  if (!querySnap.empty) {
    // Existing user login check
    const existingDoc = querySnap.docs[0];
    const userData = existingDoc.data() as UserProfile;

    // Check if account is banned by King Hero
    if (userData.isBanned || userData.banType === 'temporary' || userData.banType === 'permanent') {
      if (userData.banType === 'temporary' && userData.bannedUntil) {
        const banExpiry = new Date(userData.bannedUntil).getTime();
        const now = Date.now();
        if (now < banExpiry) {
          const formattedExpiry = new Date(userData.bannedUntil).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          const reason = userData.banReason ? `\nالسبب: "${userData.banReason}"` : '';
          throw new Error(`⛔ هذا الحساب محظور مؤقتاً من قبل الملك Hero!${reason}\nينتهي الحظر في: ${formattedExpiry}`);
        } else {
          // Temporary ban has expired: automatically lift ban
          try {
            await updateDoc(doc(db, 'users', userData.uid), {
              isBanned: false,
              banType: 'none',
              banReason: '',
              bannedUntil: null,
              updatedAt: new Date().toISOString()
            });
            userData.isBanned = false;
            userData.banType = 'none';
          } catch (e) {
            console.error('Failed to auto-lift expired ban:', e);
          }
        }
      } else if (userData.banType === 'permanent' || userData.isBanned) {
        const reason = userData.banReason ? `\nالسبب: "${userData.banReason}"` : '';
        throw new Error(`🚫 تم حظر هذا الحساب بشكل دائم ونهائي من قبل الملك Hero!${reason}\nلا يمكنك تسجيل الدخول إلى هذا الحساب.`);
      }
    }

    if (userData.password && userData.password !== passwordInput) {
      throw new Error('كلمة المرور غير صحيحة!');
    }

    return userData;
  } else {
    // Register new user
    const uid = 'user_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    const newUser: UserProfile = {
      uid,
      username: cleanUsername,
      usernameLower,
      password: passwordInput,
      coins: 0,
      isKing: false,
      isVerified: false,
      verificationType: 'none',
      isBanned: false,
      banType: 'none',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', uid), newUser);
    return newUser;
  }
}

export async function loginAsKing(passwordInput: string): Promise<UserProfile> {
  if (passwordInput !== KING_PASSWORD) {
    throw new Error('كلمة مرور الملك غير صحيحة! تم منع الوصول.');
  }

  const kingUid = 'king_hero_uid_special';
  const kingUser: UserProfile = {
    uid: kingUid,
    username: KING_USERNAME,
    usernameLower: KING_USERNAME.toLowerCase(),
    password: KING_PASSWORD,
    coins: 999999999999, // infinite representation
    isKing: true,
    isVerified: true,
    verificationType: 'purple', // Hero has the exclusive strongest royal purple badge
    isBanned: false,
    banType: 'none',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Ensure King user document exists in Firestore so search query finds Hero!
  await setDoc(doc(db, 'users', kingUid), kingUser, { merge: true });

  return kingUser;
}

export async function updateUserVerificationInDb(
  uid: string,
  verificationType: 'none' | 'blue' | 'purple'
): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    const isVerified = verificationType !== 'none';
    await updateDoc(userRef, {
      isVerified,
      verificationType,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to update verification in Firestore:', err);
    throw err;
  }
}

export async function banUserInDb(
  uid: string,
  banType: 'temporary' | 'permanent',
  durationHours: number = 24,
  reason: string = 'مخالفة القوانين والتعليمات الملكية'
): Promise<{ bannedUntil: string | null; banReason: string }> {
  try {
    if (uid === 'king_hero_uid_special') {
      throw new Error('لا يمكن حظر حساب الملك Hero!');
    }

    const userRef = doc(db, 'users', uid);
    const bannedUntil = banType === 'temporary'
      ? new Date(Date.now() + durationHours * 3600 * 1000).toISOString()
      : null;

    const cleanReason = reason.trim() || 'مخالفة القوانين والتعليمات الملكية';

    await updateDoc(userRef, {
      isBanned: true,
      banType,
      banReason: cleanReason,
      bannedUntil,
      bannedAt: new Date().toISOString(),
      bannedBy: 'الملك Hero',
      updatedAt: new Date().toISOString()
    });

    return { bannedUntil, banReason: cleanReason };
  } catch (err) {
    console.error('Failed to ban user in Firestore:', err);
    throw err;
  }
}

export async function unbanUserInDb(uid: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      isBanned: false,
      banType: 'none',
      banReason: '',
      bannedUntil: null,
      bannedAt: null,
      bannedBy: null,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to unban user in Firestore:', err);
    throw err;
  }
}

export async function deleteUserAccountInDb(uid: string): Promise<void> {
  try {
    if (uid === 'king_hero_uid_special') {
      throw new Error('لا يمكن حذف حساب الملك Hero!');
    }
    const userRef = doc(db, 'users', uid);
    await deleteDoc(userRef);
  } catch (err) {
    console.error('Failed to delete user document from Firestore:', err);
    throw err;
  }
}

export async function updateUserCoinsInDb(uid: string, coins: number): Promise<void> {
  try {
    if (uid === 'king_hero_uid_special') return; // King has infinite coins
    const userRef = doc(db, 'users', uid);
    
    // Quick verify status before updating
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;
    const data = snap.data() as UserProfile;
    if (data.isBanned || data.banType === 'permanent') return;
    if (data.banType === 'temporary' && data.bannedUntil && new Date(data.bannedUntil).getTime() > Date.now()) {
      return;
    }
    if (data.isCollectingDisabled) {
      return;
    }

    await updateDoc(userRef, {
      coins,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to sync coins to Firestore:', err);
  }
}

export async function toggleUserCollectingInDb(targetUid: string, disabled: boolean): Promise<void> {
  if (targetUid === 'king_hero_uid_special') {
    throw new Error('لا يمكن إيقاف تجميع الكوينز لحساب الملك Hero!');
  }
  const userRef = doc(db, 'users', targetUid);
  await updateDoc(userRef, {
    isCollectingDisabled: disabled,
    updatedAt: new Date().toISOString()
  });
}

export async function setGlobalCollectingDisabledInDb(disabled: boolean): Promise<void> {
  const globalRef = doc(db, 'system_settings', 'global_config');
  await setDoc(globalRef, {
    globalCollectingDisabled: disabled,
    updatedAt: new Date().toISOString(),
    updatedBy: 'الملك Hero'
  }, { merge: true });
}

export function subscribeToGlobalGameSettings(callback: (settings: GlobalGameSettings) => void) {
  const globalRef = doc(db, 'system_settings', 'global_config');
  return onSnapshot(
    globalRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as GlobalGameSettings);
      } else {
        callback({ globalCollectingDisabled: false });
      }
    },
    (err) => {
      console.error('Error listening to global game settings:', err);
      callback({ globalCollectingDisabled: false });
    }
  );
}

export async function getGlobalGameSettings(): Promise<GlobalGameSettings> {
  try {
    const globalRef = doc(db, 'system_settings', 'global_config');
    const snap = await getDoc(globalRef);
    if (snap.exists()) {
      return snap.data() as GlobalGameSettings;
    }
    return { globalCollectingDisabled: false };
  } catch (err) {
    console.error('Failed to fetch global game settings:', err);
    return { globalCollectingDisabled: false };
  }
}

// ========================
// ⚡ KING HERO GAME EVENTS MANAGEMENT
// ========================

export async function createOrUpdateGameEventInDb(
  eventData: {
    title: string;
    description?: string;
    type?: 'coins_per_tap' | 'double_multiplier' | 'custom_boost';
    coinsPerTap: number;
    startsAt: string;
    endsAt: string;
    isActive: boolean;
    createdBy?: string;
    themeColor?: 'gold' | 'purple' | 'emerald' | 'crimson' | 'cyan';
  }
): Promise<GameEvent> {
  const now = new Date().toISOString();
  const eventDoc: GameEvent = {
    title: eventData.title.trim() || 'حدث الكوينز الخاص',
    description: eventData.description?.trim() || '',
    type: eventData.type || 'coins_per_tap',
    coinsPerTap: Math.max(1, Number(eventData.coinsPerTap) || 100),
    startsAt: eventData.startsAt || now,
    endsAt: eventData.endsAt,
    isActive: eventData.isActive ?? true,
    createdBy: eventData.createdBy || 'الملك Hero',
    createdAt: now,
    updatedAt: now,
    themeColor: eventData.themeColor || 'gold',
  };

  // 1. Save as the active event in system_settings
  const activeEventRef = doc(db, 'system_settings', 'active_event');
  await setDoc(activeEventRef, eventDoc);

  // 2. Also log in game_events history collection
  try {
    const eventsHistoryRef = collection(db, 'game_events');
    await addDoc(eventsHistoryRef, {
      ...eventDoc,
      loggedAt: now,
    });
  } catch (historyErr) {
    console.warn('Could not log event history:', historyErr);
  }

  return eventDoc;
}

export async function endGameEventInDb(): Promise<void> {
  const activeEventRef = doc(db, 'system_settings', 'active_event');
  await updateDoc(activeEventRef, {
    isActive: false,
    updatedAt: new Date().toISOString(),
  });
}

export function subscribeToActiveGameEvent(callback: (event: GameEvent | null) => void) {
  const activeEventRef = doc(db, 'system_settings', 'active_event');
  return onSnapshot(
    activeEventRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as GameEvent;
        // Check if event is expired by timestamp
        const nowTime = Date.now();
        const endTime = new Date(data.endsAt).getTime();

        if (data.isActive && endTime > nowTime) {
          callback(data);
        } else {
          callback(null);
        }
      } else {
        callback(null);
      }
    },
    (err) => {
      console.error('Error listening to active game event:', err);
      callback(null);
    }
  );
}

export async function getActiveGameEvent(): Promise<GameEvent | null> {
  try {
    const activeEventRef = doc(db, 'system_settings', 'active_event');
    const snap = await getDoc(activeEventRef);
    if (snap.exists()) {
      const data = snap.data() as GameEvent;
      const nowTime = Date.now();
      const endTime = new Date(data.endsAt).getTime();
      if (data.isActive && endTime > nowTime) {
        return data;
      }
    }
    return null;
  } catch (err) {
    console.error('Failed to get active game event:', err);
    return null;
  }
}


export interface BanCheckResult {
  isBanned: boolean;
  isDeleted?: boolean;
  banMessage?: string;
  user?: UserProfile;
}

export async function verifyUserBanStatus(uid: string): Promise<BanCheckResult> {
  if (uid === 'king_hero_uid_special') {
    return { isBanned: false };
  }

  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      return {
        isBanned: true,
        isDeleted: true,
        banMessage: '🚫 تم حذف هذا الحساب نهائياً من قاعدة البيانات بقرار من الملك Hero!'
      };
    }

    const userData = snap.data() as UserProfile;

    // Check ban status
    if (userData.isBanned || userData.banType === 'temporary' || userData.banType === 'permanent') {
      if (userData.banType === 'temporary' && userData.bannedUntil) {
        const banExpiry = new Date(userData.bannedUntil).getTime();
        const now = Date.now();

        if (now < banExpiry) {
          const formattedExpiry = new Date(userData.bannedUntil).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          const reason = userData.banReason ? `\nالسبب: "${userData.banReason}"` : '';
          return {
            isBanned: true,
            banMessage: `⛔ هذا الحساب محظور مؤقتاً من قبل الملك Hero!${reason}\nينتهي الحظر في: ${formattedExpiry}`
          };
        } else {
          // Temporary ban expired: auto unban
          try {
            await updateDoc(userRef, {
              isBanned: false,
              banType: 'none',
              banReason: '',
              bannedUntil: null,
              updatedAt: new Date().toISOString()
            });
            userData.isBanned = false;
            userData.banType = 'none';
          } catch (e) {
            console.error('Failed to auto lift expired ban in verification:', e);
          }
        }
      } else if (userData.banType === 'permanent' || userData.isBanned) {
        const reason = userData.banReason ? `\nالسبب: "${userData.banReason}"` : '';
        return {
          isBanned: true,
          banMessage: `🚫 تم حظر هذا الحساب بشكل دائم ونهائي من قبل الملك Hero!${reason}\nتم طردك ومنع الوصول إلى اللعبة.`
        };
      }
    }

    return {
      isBanned: false,
      user: userData
    };
  } catch (err) {
    console.error('Failed to verify user ban status:', err);
    return { isBanned: false };
  }
}

export function subscribeToUserProfile(
  uid: string,
  callback: (user: UserProfile | null, isDeleted?: boolean) => void
) {
  if (uid === 'king_hero_uid_special') {
    return () => {};
  }

  const userRef = doc(db, 'users', uid);
  return onSnapshot(
    userRef,
    (docSnap) => {
      if (!docSnap.exists()) {
        callback(null, true);
      } else {
        const data = docSnap.data() as UserProfile;
        callback(data, false);
      }
    },
    (err) => {
      console.error('Error listening to user profile changes:', err);
    }
  );
}

export async function searchUsersInDb(searchQuery: string, isKing: boolean = false): Promise<UserProfile[]> {
  const cleanQuery = searchQuery.trim().toLowerCase();
  const usersRef = collection(db, 'users');
  
  const querySnap = await getDocs(usersRef);
  const results: UserProfile[] = [];

  querySnap.forEach((docSnap) => {
    const data = docSnap.data() as UserProfile;
    if (!cleanQuery || data.usernameLower.includes(cleanQuery) || data.username.toLowerCase().includes(cleanQuery)) {
      if (isKing) {
        // King Hero can see full profile data including password
        results.push({ ...data });
      } else {
        // Normal players never get password data
        const sanitized: UserProfile = { ...data };
        delete sanitized.password;
        results.push(sanitized);
      }
    }
  });

  // Sort with King Hero on top, then higher coins
  return results.sort((a, b) => {
    if (a.isKing) return -1;
    if (b.isKing) return 1;
    return b.coins - a.coins;
  });
}

export async function sendCoinDonation(
  fromUsername: string,
  toUsername: string,
  toUid: string,
  amount: number,
  note: string = ''
): Promise<void> {
  const donationsRef = collection(db, 'donations');
  await addDoc(donationsRef, {
    fromUsername,
    toUsername,
    toUid,
    amount,
    status: 'pending',
    note: note.trim(),
    createdAt: new Date().toISOString()
  });
}

export function subscribeToUserDonations(
  toUsername: string,
  callback: (donations: DonationMessage[]) => void
) {
  const donationsRef = collection(db, 'donations');
  const q = query(donationsRef, where('toUsername', '==', toUsername));

  return onSnapshot(q, (snapshot) => {
    const list: DonationMessage[] = [];
    snapshot.forEach((docSnap) => {
      list.push({
        id: docSnap.id,
        ...docSnap.data()
      } as DonationMessage);
    });

    // Sort by createdAt newest first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  });
}

export async function acceptDonation(
  donationId: string,
  recipientUid: string,
  currentCoins: number,
  donationAmount: number
): Promise<number> {
  const donationRef = doc(db, 'donations', donationId);
  await updateDoc(donationRef, {
    status: 'accepted'
  });

  const newCoins = currentCoins + donationAmount;
  await updateUserCoinsInDb(recipientUid, newCoins);

  return newCoins;
}

export async function rejectDonation(donationId: string): Promise<void> {
  const donationRef = doc(db, 'donations', donationId);
  await updateDoc(donationRef, {
    status: 'rejected'
  });
}
