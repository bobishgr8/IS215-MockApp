// Database layer with localStorage persistence and BroadcastChannel for cross-tab sync

import { Db, BroadcastEvent, User, Offer, Need, Match, RoutePlan, KPIs } from './types';
import { generateSeedData } from './seed';

const DB_KEY = 'fbs-db-v1';
const CHANNEL_NAME = 'fbs-events';
const DB_VERSION = 1;

let broadcastChannel: BroadcastChannel | null = null;

/**
 * Initialize BroadcastChannel for cross-tab communication
 */
export function initBroadcastChannel(onMessage: (event: BroadcastEvent) => void): void {
  if (typeof window === 'undefined') return;

  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    broadcastChannel.onmessage = (event) => {
      onMessage(event.data);
    };
  } catch (error) {
    console.warn('BroadcastChannel not supported', error);
  }
}

/**
 * Broadcast an event to other tabs
 */
export function broadcastEvent(type: BroadcastEvent['type'], payload: any): void {
  if (!broadcastChannel) return;

  const event: BroadcastEvent = {
    type,
    payload,
    timestamp: new Date().toISOString(),
  };

  try {
    broadcastChannel.postMessage(event);
  } catch (error) {
    console.error('Failed to broadcast event', error);
  }
}

/**
 * Close BroadcastChannel
 */
export function closeBroadcastChannel(): void {
  if (broadcastChannel) {
    broadcastChannel.close();
    broadcastChannel = null;
  }
}

/**
 * Load database from localStorage
 */
export function loadDb(): Db {
  if (typeof window === 'undefined') {
    return getEmptyDb();
  }

  try {
    const stored = localStorage.getItem(DB_KEY);
    
    if (!stored) {
      // First time - initialize with seed data
      const db = generateSeedData();
      saveDb(db);
      return db;
    }

    const db = JSON.parse(stored) as Db;

    // Migrate if needed
    if (db.version < DB_VERSION) {
      return migrateDb(db);
    }

    return db;
  } catch (error) {
    console.error('Failed to load database', error);
    return getEmptyDb();
  }
}

/**
 * Save database to localStorage
 */
export function saveDb(db: Db): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (error) {
    console.error('Failed to save database', error);
  }
}

/**
 * Reset database to seed data
 */
export function resetDb(): Db {
  const db = generateSeedData();
  saveDb(db);
  broadcastEvent('kpis:updated', {});
  return db;
}

/**
 * Migrate database to latest version
 */
function migrateDb(db: Db): Db {
  // Add migration logic here when version changes
  let migrated = { ...db };

  if (migrated.version < 1) {
    // Migration from v0 to v1
    migrated = {
      ...migrated,
      version: 1,
    };
  }

  saveDb(migrated);
  return migrated;
}

/**
 * Get empty database structure
 */
function getEmptyDb(): Db {
  return {
    version: DB_VERSION,
    users: [],
    offers: [],
    needs: [],
    matches: [],
    routePlans: [],
    kpis: getEmptyKPIs(),
  };
}

/**
 * Get empty KPIs structure
 */
function getEmptyKPIs(): KPIs {
  return {
    totalMatches: 0,
    timeToMatchP50: 0,
    timeToMatchP90: 0,
    matchRate: 0,
    fillRate: 0,
    totalDistanceKm: 0,
    totalCO2Kg: 0,
    wastageAvoided: 0,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Calculate KPIs from current data
 */
export function calculateKPIs(db: Db): KPIs {
  const { offers, needs, matches, routePlans } = db;

  // Total matches
  const totalMatches = matches.length;

  // Time to match (time from need creation to match creation)
  const matchTimes: number[] = [];
  matches.forEach(match => {
    const need = needs.find(n => n.id === match.needId);
    if (need) {
      const timeDiff = new Date(match.createdAt).getTime() - new Date(need.createdAt).getTime();
      matchTimes.push(timeDiff / (1000 * 60)); // Convert to minutes
    }
  });

  matchTimes.sort((a, b) => a - b);
  const timeToMatchP50 = matchTimes.length > 0 ? matchTimes[Math.floor(matchTimes.length * 0.5)] : 0;
  const timeToMatchP90 = matchTimes.length > 0 ? matchTimes[Math.floor(matchTimes.length * 0.9)] : 0;

  // Match rate (% of needs that got matched)
  const matchRate = needs.length > 0 ? (totalMatches / needs.length) * 100 : 0;

  // Fill rate (% of matched quantity vs requested quantity)
  let totalRequested = 0;
  let totalMatched = 0;
  needs.forEach(need => {
    totalRequested += need.minQty;
    const needMatches = matches.filter(m => m.needId === need.id);
    totalMatched += needMatches.reduce((sum, m) => sum + m.quantity, 0);
  });
  const fillRate = totalRequested > 0 ? (totalMatched / totalRequested) * 100 : 0;

  // Total distance and CO2
  const totalDistanceKm = routePlans.reduce((sum, plan) => sum + plan.totalKm, 0);
  const totalCO2Kg = totalDistanceKm * 0.27; // kg CO2 per km

  // Wastage avoided (estimate based on matched items that would have expired)
  let wastageAvoided = 0;
  matches.forEach(match => {
    const offer = offers.find(o => o.id === match.offerId);
    if (offer) {
      const now = new Date();
      const expiry = new Date(offer.expiryDate);
      const daysToExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (daysToExpiry <= 3) {
        wastageAvoided += match.quantity; // Assume kg for simplicity
      }
    }
  });

  return {
    totalMatches,
    timeToMatchP50: Math.round(timeToMatchP50),
    timeToMatchP90: Math.round(timeToMatchP90),
    matchRate: Math.round(matchRate * 10) / 10,
    fillRate: Math.round(fillRate * 10) / 10,
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    totalCO2Kg: Math.round(totalCO2Kg * 10) / 10,
    wastageAvoided: Math.round(wastageAvoided),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Setup storage event listener for cross-tab sync
 */
export function setupStorageListener(onStorageChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (event: StorageEvent) => {
    if (event.key === DB_KEY) {
      onStorageChange();
    }
  };

  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener('storage', handler);
  };
}

/**
 * Generate UUID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem('fbs-current-user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Set current user in localStorage
 */
export function setCurrentUser(user: User | null): void {
  if (typeof window === 'undefined') return;

  try {
    if (user) {
      localStorage.setItem('fbs-current-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('fbs-current-user');
    }
  } catch (error) {
    console.error('Failed to set current user', error);
  }
}
