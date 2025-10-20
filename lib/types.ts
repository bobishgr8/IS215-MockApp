// Type definitions for Food Bank Singapore Mock App

export type UUID = string;

export type Role = 'DONOR' | 'BENEFICIARY' | 'VOLUNTEER' | 'OPS';

export type User = {
  id: UUID;
  role: Role;
  name: string;
  email: string;
  orgName?: string; // For donors and beneficiaries
};

export type Category = 'Produce' | 'Bakery' | 'Canned' | 'Dairy' | 'Meat' | 'Frozen' | 'Other';

export type Storage = 'Ambient' | 'Chilled' | 'Frozen';

export type Unit = 'kg' | 'pcs' | 'crates';

export type OfferStatus = 'AVAILABLE' | 'CLAIMED' | 'EXPIRED';

export type Offer = {
  id: UUID;
  donorId: UUID;
  title: string;
  category: Category;
  quantity: number;
  unit: Unit;
  storage: Storage;
  expiryDate: string; // ISO date string
  pickupStart: string; // ISO datetime string
  pickupEnd: string; // ISO datetime string
  address: string;
  lat: number;
  lng: number;
  photoUrl?: string;
  status: OfferStatus;
  createdAt: string; // ISO datetime string
};

export type Urgency = 'Low' | 'Medium' | 'High';

export type Need = {
  id: UUID;
  beneficiaryId: UUID;
  category: Category;
  minQty: number;
  urgency: Urgency;
  canAccept: Storage[]; // Storage types beneficiary can accept
  deliveryPreferred: boolean;
  createdAt: string;
  lat: number; // Beneficiary location
  lng: number;
  address: string;
};

export type MatchStatus = 'PENDING_PICKUP' | 'ROUTED' | 'COMPLETED' | 'CANCELLED';

export type Match = {
  id: UUID;
  offerId: UUID;
  needId: UUID;
  quantity: number;
  status: MatchStatus;
  createdAt: string;
  approvedByOps?: UUID;
  volunteerId?: UUID;
  pickupStopId?: UUID;
  dropoffStopId?: UUID;
};

export type StopKind = 'PICKUP' | 'DROPOFF';

export type Stop = {
  id: UUID;
  planId: UUID;
  seq: number; // Order in route
  kind: StopKind;
  lat: number;
  lng: number;
  name: string;
  address: string;
  windowStart?: string;
  windowEnd?: string;
  coldChain: boolean;
  checkedInAt?: string;
  scanned?: boolean;
  temperatureC?: number;
  completedAt?: string;
  matchIds?: UUID[]; // Associated matches
};

export type RoutePlanStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'DONE';

export type RoutePlan = {
  id: UUID;
  volunteerId: UUID;
  depot: { lat: number; lng: number; name: string };
  stops: Stop[];
  totalKm: number;
  totalMins: number;
  status: RoutePlanStatus;
  createdAt: string;
};

export type KPIs = {
  totalMatches: number;
  timeToMatchP50: number; // minutes
  timeToMatchP90: number; // minutes
  matchRate: number; // percentage
  fillRate: number; // percentage
  totalDistanceKm: number;
  totalCO2Kg: number; // proxy calculation
  wastageAvoided: number; // kg
  lastUpdated: string;
};

export type Db = {
  version: number;
  users: User[];
  offers: Offer[];
  needs: Need[];
  matches: Match[];
  routePlans: RoutePlan[];
  kpis: KPIs;
  currentUser?: User; // Currently logged in user
};

// Event types for BroadcastChannel
export type EventType =
  | 'offer:created'
  | 'offer:updated'
  | 'need:created'
  | 'need:updated'
  | 'match:created'
  | 'match:updated'
  | 'route:created'
  | 'route:updated'
  | 'stop:updated'
  | 'kpis:updated';

export type BroadcastEvent = {
  type: EventType;
  payload: any;
  timestamp: string;
};

// Matching score explanation
export type MatchExplanation = {
  score: number;
  tags: string[];
  breakdown: {
    expiryScore: number;
    distanceScore: number;
    urgencyScore: number;
    surplusScore: number;
  };
};

// Coordinates type
export type LatLng = {
  lat: number;
  lng: number;
};
