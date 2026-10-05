// CelikMinda Toddlers — Game State Store (Zustand + Supabase)
// Real authentication & cloud-synced progress
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { canAccessWorld, canAccessGame, PACKAGES } from '@/data/gameData';
import { supabase, isSupabaseReady } from '@/utils/supabase';

// ════════════════════════════════════════
// 🔌 SUPABASE HELPERS (outside store)
// ════════════════════════════════════════

async function supabaseSignUp(email, password, childName) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { child_name: childName || 'Adik' },
    },
  });
  if (error) throw error;

  // Supabase might return user without session if email confirm is ON
  // But our config has email confirm DISABLED, so auto-login
  if (data?.user && !data?.session) {
    // Fake success — email might already exist
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('email', email);
    if (count && count > 0) {
      throw new Error('Email sudah didaftarkan. Sila log masuk.');
    }
  }

  // Auto sign-in after signup (email confirm OFF)
  if (!data?.session) {
    const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
    if (loginErr) throw loginErr;
    return loginData;
  }

  // Upsert profile with child_name
  if (data?.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      email,
      child_name: childName || 'Adik',
      package: 'free',
    }, { onConflict: 'id' });
  }

  return data;
}

async function supabaseSignIn(email, password) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function supabaseSignOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

async function loadProfileFromDB(userId) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) { console.warn('Profile load error:', error); return null; }
  return data;
}

async function loadProgressFromDB(userId) {
  if (!supabase) return {};
  const { data: rows, error } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', userId);
  if (error) { console.warn('Progress load error:', error); return {}; }

  // Convert DB rows to local { 'worldId-gameId': { stars, attempts, bestScore } }
  const progress = {};
  (rows || []).forEach(row => {
    progress[row.game_id] = {
      stars: row.stars || 0,
      attempts: row.play_count || 0,
      bestScore: row.high_score || 0,
    };
  });
  return progress;
}

async function saveProgressToDB(userId, gameId, stars, score, playCount) {
  if (!supabase || !userId) return;
  try {
    await supabase.from('progress').upsert({
      user_id: userId,
      game_id: gameId,
      stars: stars,
      high_score: score,
      play_count: playCount,
      last_played: new Date().toISOString(),
    }, { onConflict: 'user_id,game_id' });
  } catch (e) {
    console.warn('Progress save failed:', e);
  }
}

// ════════════════════════════════════════
// 🏪 ZUSTAND STORE
// ════════════════════════════════════════

export const useGameStore = create(
  persist(
    (set, get) => ({
      // ── Auth ──
      isLoggedIn: false,
      parentEmail: '',
      parentName: '',
      userId: null,        // Supabase user UUID
      authLoading: false,  // true while checking session
      authError: null,     // last auth error message

      // ── Child profile ──
      childName: 'Adik',
      ageTier: 'tunas', // benih (1-2), tunas (3-4), pokok (5-6)
      avatar: 'minda',

      // ── Stars & rewards ──
      totalStars: 0,

      // ── Progress per game: { 'worldId-gameId': { stars: 0, attempts: 0, bestScore: 0 } } ──
      progress: {},

      // ── Current navigation ──
      currentView: 'home', // 'home', 'world', 'game'
      currentWorldId: null,
      currentGameId: null,

      // ── Language ──
      language: 'bm', // 'bm' or 'en'

      // ── Sound ──
      soundEnabled: true,

      // ════════════════════════════════════════
      // 💰 SUBSCRIPTION / ENTITLEMENT
      // ════════════════════════════════════════
      subscription: {
        plan: 'free',
        status: 'active',
        pricePaid: 0,
        gateway: null,
        transactionRef: null,
        startedAt: null,
        expiresAt: null,
      },

      // Get current plan
      getPlan: () => get().subscription.plan,

      // Centralized access check — single source of truth
      canAccessWorld: (worldId) => {
        const plan = get().subscription.plan;
        return canAccessWorld(plan, worldId);
      },

      canAccessGame: (worldId, gameId) => {
        const plan = get().subscription.plan;
        return canAccessGame(plan, worldId, gameId);
      },

      // Is this plan sufficient for upgrade?
      canUpgradeTo: (targetPlan) => {
        const hierarchy = { free: 0, mini: 1, complete: 2 };
        const current = hierarchy[get().subscription.plan] || 0;
        const target = hierarchy[targetPlan] || 0;
        return target > current;
      },

      // Get upgrade price
      getUpgradePrice: (targetPlan) => {
        const currentPlan = get().subscription.plan;
        if (targetPlan === 'complete' && currentPlan === 'mini') return PACKAGES.complete.upgradePrice;
        if (targetPlan === 'complete' && currentPlan === 'free') return PACKAGES.complete.price;
        if (targetPlan === 'mini' && currentPlan === 'free') return PACKAGES.mini.price;
        return 0;
      },

      // Activate subscription (called after verified payment)
      activateSubscription: (plan, transactionRef = null, gateway = 'toyyibpay') => {
        const prev = get().subscription;
        set({
          subscription: {
            plan,
            status: 'active',
            pricePaid: plan === 'complete' && prev.plan === 'mini'
              ? prev.pricePaid + PACKAGES.complete.upgradePrice
              : PACKAGES[plan]?.price || 0,
            gateway,
            transactionRef,
            startedAt: prev.plan === 'free' ? new Date().toISOString() : prev.startedAt,
            expiresAt: null,
          },
        });
      },

      // ════════════════════════════════════════
      // 🔐 AUTH ACTIONS (Supabase)
      // ════════════════════════════════════════

      // Initialize — check existing session on app load
      initAuth: async () => {
        if (!isSupabaseReady()) return;
        set({ authLoading: true, authError: null });
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const profile = await loadProfileFromDB(session.user.id);
            const progress = await loadProgressFromDB(session.user.id);

            // Calculate total stars from synced progress
            let totalStars = 0;
            Object.values(progress).forEach(p => { totalStars += p.stars || 0; });

            set({
              isLoggedIn: true,
              userId: session.user.id,
              parentEmail: session.user.email,
              parentName: profile?.child_name || 'Adik',
              childName: profile?.child_name || 'Adik',
              progress,
              totalStars,
              subscription: {
                ...get().subscription,
                plan: profile?.package || 'free',
              },
              language: profile?.language || 'bm',
              soundEnabled: profile?.sound_enabled !== false,
            });
          }
        } catch (e) {
          console.warn('Auth init error:', e);
        } finally {
          set({ authLoading: false });
        }
      },

      // Register — real Supabase signup
      register: async (email, password, childName, ageTier) => {
        set({ authLoading: true, authError: null });
        try {
          const data = await supabaseSignUp(email, password, childName);
          const user = data?.user || data?.session?.user;
          if (!user) throw new Error('Pendaftaran gagal');

          const progress = await loadProgressFromDB(user.id);

          set({
            isLoggedIn: true,
            userId: user.id,
            parentEmail: email,
            parentName: childName || 'Adik',
            childName: childName || 'Adik',
            ageTier: ageTier || 'tunas',
            currentView: 'home',
            currentWorldId: null,
            currentGameId: null,
            progress,
            authLoading: false,
          });
          return { success: true };
        } catch (e) {
          set({ authLoading: false, authError: e.message });
          return { success: false, error: e.message };
        }
      },

      // Login — real Supabase signin
      login: async (email, password) => {
        set({ authLoading: true, authError: null });
        try {
          const data = await supabaseSignIn(email, password);
          const user = data?.user;
          if (!user) throw new Error('Log masuk gagal');

          const profile = await loadProfileFromDB(user.id);
          const progress = await loadProgressFromDB(user.id);

          let totalStars = 0;
          Object.values(progress).forEach(p => { totalStars += p.stars || 0; });

          set({
            isLoggedIn: true,
            userId: user.id,
            parentEmail: email,
            parentName: profile?.child_name || 'Adik',
            childName: profile?.child_name || 'Adik',
            progress,
            totalStars,
            subscription: {
              ...get().subscription,
              plan: profile?.package || 'free',
            },
            language: profile?.language || 'bm',
            currentView: 'home',
            currentWorldId: null,
            currentGameId: null,
            authLoading: false,
          });
          return { success: true };
        } catch (e) {
          set({ authLoading: false, authError: e.message });
          return { success: false, error: e.message };
        }
      },

      // Logout
      logout: async () => {
        await supabaseSignOut();
        set({
          isLoggedIn: false,
          parentEmail: '',
          parentName: '',
          userId: null,
          currentView: 'home',
          currentWorldId: null,
          currentGameId: null,
          authError: null,
        });
      },

      // Clear auth error
      clearAuthError: () => set({ authError: null }),

      // ════════════════════════════════════════
      // 🧭 NAVIGATION ACTIONS
      // ════════════════════════════════════════
      goToWorld: (worldId) => {
        if (!canAccessWorld(get().subscription.plan, worldId)) return false;
        set({ currentView: 'world', currentWorldId: worldId, currentGameId: null });
        return true;
      },

      goToGame: (worldId, gameId) => {
        if (!canAccessGame(get().subscription.plan, worldId, gameId)) return false;
        set({ currentView: 'game', currentWorldId: worldId, currentGameId: gameId });
        return true;
      },

      goHome: () => set({ currentView: 'home', currentWorldId: null, currentGameId: null }),

      // ── Game actions ──
      completeGame: (worldId, gameId, stars, score) => {
        const key = `${worldId}-${gameId}`;
        const prev = get().progress[key] || { stars: 0, attempts: 0, bestScore: 0 };
        const newStars = Math.max(prev.stars, stars);
        const starsDelta = newStars - prev.stars;
        const newAttempts = prev.attempts + 1;
        const newBest = Math.max(prev.bestScore, score);

        set((state) => ({
          progress: {
            ...state.progress,
            [key]: {
              stars: newStars,
              attempts: newAttempts,
              bestScore: newBest,
            }
          },
          totalStars: state.totalStars + starsDelta,
        }));

        // Sync to Supabase in background
        const userId = get().userId;
        if (userId) {
          saveProgressToDB(userId, key, newStars, newBest, newAttempts);
        }
      },

      getGameProgress: (worldId, gameId) => {
        const key = `${worldId}-${gameId}`;
        return get().progress[key] || { stars: 0, attempts: 0, bestScore: 0 };
      },

      getWorldProgress: (worldId) => {
        const progress = get().progress;
        let totalStars = 0;
        let gamesPlayed = 0;
        Object.entries(progress).forEach(([key, val]) => {
          if (key.startsWith(`${worldId}-`)) {
            totalStars += val.stars;
            if (val.attempts > 0) gamesPlayed++;
          }
        });
        return { totalStars, gamesPlayed };
      },

      // ── Settings ──
      toggleLanguage: () => set((s) => ({ language: s.language === 'bm' ? 'en' : 'bm' })),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      setChildName: (name) => set({ childName: name }),
      setAgeTier: (tier) => set({ ageTier: tier }),
    }),
    {
      name: 'celikminda-store',
    }
  )
);
