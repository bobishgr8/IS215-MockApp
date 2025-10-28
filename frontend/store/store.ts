// Zustand store for global state management with localStorage persistence

import { create } from 'zustand';
import {
  Db,
  User,
  Offer,
  Need,
  Match,
  RoutePlan,
  Stop,
  KPIs,
  BroadcastEvent,
} from '../lib/types';
import {
  loadDb,
  saveDb,
  resetDb,
  generateId,
  broadcastEvent,
  initBroadcastChannel,
  setupStorageListener,
  calculateKPIs,
  getCurrentUser,
  setCurrentUser as saveCurrentUser,
} from '../lib/db';

interface DbStore extends Db {
  // Actions
  initialize: () => void;
  reset: () => void;
  
  // User actions
  login: (role: User['role'], name: string, email: string, orgName?: string) => void;
  logout: () => void;
  
  // Offer actions
  createOffer: (offer: Omit<Offer, 'id' | 'createdAt' | 'status'>) => void;
  updateOffer: (id: string, updates: Partial<Offer>) => void;
  deleteOffer: (id: string) => void;
  
  // Need actions
  createNeed: (need: Omit<Need, 'id' | 'createdAt'>) => void;
  updateNeed: (id: string, updates: Partial<Need>) => void;
  deleteNeed: (id: string) => void;
  
  // Match actions
  createMatch: (match: Omit<Match, 'id' | 'createdAt'>) => void;
  updateMatch: (id: string, updates: Partial<Match>) => void;
  deleteMatch: (id: string) => void;
  approveMatch: (matchId: string, opsUserId: string) => void;
  
  // Route plan actions
  createRoutePlan: (plan: Omit<RoutePlan, 'id' | 'createdAt'>) => void;
  updateRoutePlan: (id: string, updates: Partial<RoutePlan>) => void;
  updateStop: (planId: string, stopId: string, updates: Partial<Stop>) => void;
  completeStop: (planId: string, stopId: string) => void;
  
  // KPI actions
  refreshKPIs: () => void;
  
  // Cross-tab sync
  handleBroadcastEvent: (event: BroadcastEvent) => void;
  handleStorageChange: () => void;
}

export const useStore = create<DbStore>((set, get) => {
  // Initialize broadcast channel and storage listener
  if (typeof window !== 'undefined') {
    initBroadcastChannel((event) => {
      get().handleBroadcastEvent(event);
    });

    setupStorageListener(() => {
      get().handleStorageChange();
    });
  }

  return {
    // Initial state
    ...loadDb(),

    // Initialize store
    initialize: () => {
      const db = loadDb();
      const currentUser = getCurrentUser();
      set({ ...db, currentUser: currentUser || undefined });
    },

    // Reset to seed data
    reset: () => {
      const db = resetDb();
      set(db);
    },

    // User actions
    login: (role, name, email, orgName) => {
      const users = get().users;
      let user = users.find(u => u.email === email);

      if (!user) {
        user = {
          id: generateId(),
          role,
          name,
          email,
          orgName,
        };
        set(state => ({
          users: [...state.users, user!],
          currentUser: user,
        }));
      } else {
        set({ currentUser: user });
      }

      saveCurrentUser(user);
      const db = get();
      saveDb(db);
    },

    logout: () => {
      set({ currentUser: undefined });
      saveCurrentUser(null);
    },

    // Offer actions
    createOffer: (offerData) => {
      const offer: Offer = {
        ...offerData,
        id: generateId(),
        status: 'AVAILABLE',
        createdAt: new Date().toISOString(),
      };

      set(state => ({
        offers: [...state.offers, offer],
      }));

      const db = get();
      saveDb(db);
      broadcastEvent('offer:created', offer);
      get().refreshKPIs();
    },

    updateOffer: (id, updates) => {
      set(state => ({
        offers: state.offers.map(o => (o.id === id ? { ...o, ...updates } : o)),
      }));

      const db = get();
      saveDb(db);
      broadcastEvent('offer:updated', { id, updates });
      get().refreshKPIs();
    },

    deleteOffer: (id) => {
      set(state => ({
        offers: state.offers.filter(o => o.id !== id),
      }));

      const db = get();
      saveDb(db);
      broadcastEvent('offer:updated', { id, deleted: true });
    },

    // Need actions
    createNeed: (needData) => {
      const need: Need = {
        ...needData,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };

      set(state => ({
        needs: [...state.needs, need],
      }));

      const db = get();
      saveDb(db);
      broadcastEvent('need:created', need);
      get().refreshKPIs();
    },

    updateNeed: (id, updates) => {
      set(state => ({
        needs: state.needs.map(n => (n.id === id ? { ...n, ...updates } : n)),
      }));

      const db = get();
      saveDb(db);
      broadcastEvent('need:updated', { id, updates });
    },

    deleteNeed: (id) => {
      set(state => ({
        needs: state.needs.filter(n => n.id !== id),
      }));

      const db = get();
      saveDb(db);
      broadcastEvent('need:updated', { id, deleted: true });
    },

    // Match actions
    createMatch: (matchData) => {
      const match: Match = {
        ...matchData,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };

      set(state => {
        // Update offer quantity or status
        const offer = state.offers.find(o => o.id === matchData.offerId);
        const updatedOffers = state.offers.map(o => {
          if (o.id === matchData.offerId) {
            const newQuantity = o.quantity - matchData.quantity;
            return {
              ...o,
              quantity: newQuantity,
              status: newQuantity <= 0 ? 'CLAIMED' : o.status,
            } as Offer;
          }
          return o;
        });

        return {
          matches: [...state.matches, match],
          offers: updatedOffers,
        };
      });

      const db = get();
      saveDb(db);
      broadcastEvent('match:created', match);
      get().refreshKPIs();
    },

    updateMatch: (id, updates) => {
      set(state => ({
        matches: state.matches.map(m => (m.id === id ? { ...m, ...updates } : m)),
      }));

      const db = get();
      saveDb(db);
      broadcastEvent('match:updated', { id, updates });
      get().refreshKPIs();
    },

    deleteMatch: (id) => {
      set(state => ({
        matches: state.matches.filter(m => m.id !== id),
      }));

      const db = get();
      saveDb(db);
      broadcastEvent('match:updated', { id, deleted: true });
    },

    approveMatch: (matchId, opsUserId) => {
      set(state => ({
        matches: state.matches.map(m =>
          m.id === matchId ? { ...m, approvedByOps: opsUserId } : m
        ),
      }));

      const db = get();
      saveDb(db);
      broadcastEvent('match:updated', { id: matchId, approved: true });
    },

    // Route plan actions
    createRoutePlan: (planData) => {
      const plan: RoutePlan = {
        ...planData,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };

      // Assign plan ID to stops
      const stopsWithPlanId = plan.stops.map(stop => ({
        ...stop,
        id: stop.id || generateId(),
        planId: plan.id,
      }));

      const finalPlan = { ...plan, stops: stopsWithPlanId };

      set(state => {
        // Update matches with route plan info
        const updatedMatches = state.matches.map(match => {
          const pickupStop = stopsWithPlanId.find(s => 
            s.kind === 'PICKUP' && s.matchIds?.includes(match.id)
          );
          const dropoffStop = stopsWithPlanId.find(s => 
            s.kind === 'DROPOFF' && s.matchIds?.includes(match.id)
          );

          if (pickupStop || dropoffStop) {
            return {
              ...match,
              status: 'ROUTED' as const,
              volunteerId: plan.volunteerId,
              pickupStopId: pickupStop?.id,
              dropoffStopId: dropoffStop?.id,
            };
          }
          return match;
        });

        return {
          routePlans: [...state.routePlans, finalPlan],
          matches: updatedMatches,
        };
      });

      const db = get();
      saveDb(db);
      broadcastEvent('route:created', finalPlan);
      get().refreshKPIs();
    },

    updateRoutePlan: (id, updates) => {
      set(state => ({
        routePlans: state.routePlans.map(p => (p.id === id ? { ...p, ...updates } : p)),
      }));

      const db = get();
      saveDb(db);
      broadcastEvent('route:updated', { id, updates });
      get().refreshKPIs();
    },

    updateStop: (planId, stopId, updates) => {
      set(state => ({
        routePlans: state.routePlans.map(p =>
          p.id === planId
            ? {
                ...p,
                stops: p.stops.map(s => (s.id === stopId ? { ...s, ...updates } : s)),
              }
            : p
        ),
      }));

      const db = get();
      saveDb(db);
      broadcastEvent('stop:updated', { planId, stopId, updates });
    },

    completeStop: (planId, stopId) => {
      const now = new Date().toISOString();
      
      set(state => {
        const plan = state.routePlans.find(p => p.id === planId);
        if (!plan) return state;

        const stop = plan.stops.find(s => s.id === stopId);
        if (!stop) return state;

        // Update stop
        const updatedStops = plan.stops.map(s =>
          s.id === stopId ? { ...s, completedAt: now } : s
        );

        // Check if all stops are completed
        const allCompleted = updatedStops.every(s => s.completedAt);
        const updatedPlan = {
          ...plan,
          stops: updatedStops,
          status: allCompleted ? ('DONE' as const) : plan.status,
        };

        // Update matches to COMPLETED if plan is done
        const updatedMatches = allCompleted
          ? state.matches.map(m => {
              const isInPlan = updatedStops.some(s => s.matchIds?.includes(m.id));
              return isInPlan ? { ...m, status: 'COMPLETED' as const } : m;
            })
          : state.matches;

        return {
          routePlans: state.routePlans.map(p => (p.id === planId ? updatedPlan : p)),
          matches: updatedMatches,
        };
      });

      const db = get();
      saveDb(db);
      broadcastEvent('stop:updated', { planId, stopId, completed: true });
      get().refreshKPIs();
    },

    // KPI actions
    refreshKPIs: () => {
      const db = get();
      const kpis = calculateKPIs(db);
      
      set({ kpis });
      
      const updatedDb = get();
      saveDb(updatedDb);
      broadcastEvent('kpis:updated', kpis);
    },

    // Cross-tab sync
    handleBroadcastEvent: (event) => {
      // Reload from localStorage when another tab makes changes
      const db = loadDb();
      set(db);
    },

    handleStorageChange: () => {
      // Reload from localStorage when storage event fires
      const db = loadDb();
      const currentUser = get().currentUser;
      set({ ...db, currentUser });
    },
  };
});

// Initialize on module load
if (typeof window !== 'undefined') {
  useStore.getState().initialize();
}
