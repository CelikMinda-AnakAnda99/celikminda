// CelikMinda Toddlers — Game State Store (Zustand)
// Includes subscription/entitlement system for two-tier packages
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { canAccessWorld, canAccessGame, PACKAGES } from '@/data/gameData';

export const useGameStore = create(
  persist(
    (set, get) => ({
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
      // Plan: 'free' | 'mini' | 'complete'
      subscription: {
        plan: 'free',
        status: 'active',       // 'active' | 'expired' | 'pending'
        pricePaid: 0,
        gateway: null,          // 'toyyibpay' | 'manual' | null
        transactionRef: null,
        startedAt: null,
        expiresAt: null,        // null = lifetime
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
      
      // Is this plan sufficient for upgrade? (used in UI)
      canUpgradeTo: (targetPlan) => {
        const hierarchy = { free: 0, mini: 1, complete: 2 };
        const current = hierarchy[get().subscription.plan] || 0;
        const target = hierarchy[targetPlan] || 0;
        return target > current;
      },
      
      // Get upgrade price (difference-based pricing)
      getUpgradePrice: (targetPlan) => {
        const currentPlan = get().subscription.plan;
        if (targetPlan === 'complete' && currentPlan === 'mini') {
          return PACKAGES.complete.upgradePrice; // RM50
        }
        if (targetPlan === 'complete' && currentPlan === 'free') {
          return PACKAGES.complete.price; // RM99.90
        }
        if (targetPlan === 'mini' && currentPlan === 'free') {
          return PACKAGES.mini.price; // RM49.90
        }
        return 0;
      },
      
      // Activate subscription (called after VERIFIED payment only)
      // In production: this must only be triggered by server-side webhook
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
            expiresAt: null, // lifetime access
          },
        });
      },
      
      // ════════════════════════════════════════
      // 🧭 NAVIGATION ACTIONS
      // ════════════════════════════════════════
      goToWorld: (worldId) => {
        // Entitlement check at navigation level
        if (!canAccessWorld(get().subscription.plan, worldId)) {
          // Don't navigate — UI should show upgrade modal instead
          return false;
        }
        set({ currentView: 'world', currentWorldId: worldId, currentGameId: null });
        return true;
      },
      
      goToGame: (worldId, gameId) => {
        // Double check entitlement at game level
        if (!canAccessGame(get().subscription.plan, worldId, gameId)) {
          return false;
        }
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
        
        set((state) => ({
          progress: {
            ...state.progress,
            [key]: {
              stars: newStars,
              attempts: prev.attempts + 1,
              bestScore: Math.max(prev.bestScore, score),
            }
          },
          totalStars: state.totalStars + starsDelta,
        }));
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
