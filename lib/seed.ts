// Seed data generation for demo

import { Db, User, Offer, Need, Match, RoutePlan, Stop, KPIs } from './types';
import { generateId } from './db';

/**
 * Generate comprehensive seed data for demo
 */
export function generateSeedData(): Db {
  const users = generateUsers();
  const offers = generateOffers(users);
  const needs = generateNeeds(users);
  const matches = generateMatches(offers, needs);
  const routePlans = generateRoutePlans(users, matches, offers, needs);
  const kpis = generateInitialKPIs();

  return {
    version: 1,
    users,
    offers,
    needs,
    matches,
    routePlans,
    kpis,
  };
}

/**
 * Generate users (donors, beneficiaries, volunteers, ops)
 */
function generateUsers(): User[] {
  return [
    // Donors
    {
      id: 'donor-1',
      role: 'DONOR',
      name: 'FreshGrocer Pte Ltd',
      email: 'donor@demo',
      orgName: 'FreshGrocer Pte Ltd',
    },
    {
      id: 'donor-2',
      role: 'DONOR',
      name: 'Cold Storage',
      email: 'coldstorage@demo',
      orgName: 'Cold Storage Singapore',
    },
    {
      id: 'donor-3',
      role: 'DONOR',
      name: 'Sunshine Bakery',
      email: 'bakery@demo',
      orgName: 'Sunshine Bakery',
    },
    {
      id: 'donor-4',
      role: 'DONOR',
      name: 'Green Valley Farm',
      email: 'farm@demo',
      orgName: 'Green Valley Farm',
    },
    {
      id: 'donor-5',
      role: 'DONOR',
      name: 'Ocean Fresh Seafood',
      email: 'seafood@demo',
      orgName: 'Ocean Fresh Seafood',
    },
    {
      id: 'donor-6',
      role: 'DONOR',
      name: 'Daily Dairy',
      email: 'dairy@demo',
      orgName: 'Daily Dairy Products',
    },

    // Beneficiaries
    {
      id: 'bene-1',
      role: 'BENEFICIARY',
      name: 'Hope Centre',
      email: 'bene@demo',
      orgName: 'Hope Centre',
    },
    {
      id: 'bene-2',
      role: 'BENEFICIARY',
      name: 'Willing Hearts',
      email: 'willinghearts@demo',
      orgName: 'Willing Hearts',
    },
    {
      id: 'bene-3',
      role: 'BENEFICIARY',
      name: 'Community Care',
      email: 'community@demo',
      orgName: 'Community Care Centre',
    },
    {
      id: 'bene-4',
      role: 'BENEFICIARY',
      name: 'Elderly Home',
      email: 'elderly@demo',
      orgName: 'Sunshine Elderly Home',
    },
    {
      id: 'bene-5',
      role: 'BENEFICIARY',
      name: 'Youth Centre',
      email: 'youth@demo',
      orgName: 'Youth Support Centre',
    },

    // Volunteers
    {
      id: 'vol-1',
      role: 'VOLUNTEER',
      name: 'Aisha',
      email: 'driver@demo',
    },
    {
      id: 'vol-2',
      role: 'VOLUNTEER',
      name: 'Rahman',
      email: 'rahman@demo',
    },

    // Ops
    {
      id: 'ops-1',
      role: 'OPS',
      name: 'Operations Manager',
      email: 'ops@demo',
    },
  ];
}

/**
 * Generate offers with geo-distribution across Singapore
 */
function generateOffers(users: User[]): Offer[] {
  const donors = users.filter(u => u.role === 'DONOR');
  const now = new Date();

  return [
    // FreshGrocer - Jurong West
    {
      id: 'offer-1',
      donorId: 'donor-1',
      title: 'Fresh Bananas',
      category: 'Produce',
      quantity: 50,
      unit: 'kg',
      storage: 'Ambient',
      expiryDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      pickupStart: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      pickupEnd: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
      address: '3 Gateway Drive, Jurong West',
      lat: 1.3343,
      lng: 103.7436,
      status: 'AVAILABLE',
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'offer-2',
      donorId: 'donor-1',
      title: 'Mixed Vegetables',
      category: 'Produce',
      quantity: 30,
      unit: 'kg',
      storage: 'Chilled',
      expiryDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      pickupStart: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      pickupEnd: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
      address: '3 Gateway Drive, Jurong West',
      lat: 1.3343,
      lng: 103.7436,
      status: 'AVAILABLE',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },

    // Cold Storage - Orchard
    {
      id: 'offer-3',
      donorId: 'donor-2',
      title: 'Canned Goods Mix',
      category: 'Canned',
      quantity: 100,
      unit: 'pcs',
      storage: 'Ambient',
      expiryDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      pickupStart: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(),
      pickupEnd: new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString(),
      address: '290 Orchard Road',
      lat: 1.3048,
      lng: 103.8318,
      status: 'AVAILABLE',
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'offer-4',
      donorId: 'donor-2',
      title: 'Fresh Milk',
      category: 'Dairy',
      quantity: 40,
      unit: 'pcs',
      storage: 'Chilled',
      expiryDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      pickupStart: new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString(),
      pickupEnd: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
      address: '290 Orchard Road',
      lat: 1.3048,
      lng: 103.8318,
      status: 'AVAILABLE',
      createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    },

    // Sunshine Bakery - Bedok
    {
      id: 'offer-5',
      donorId: 'donor-3',
      title: 'Fresh Bread Loaves',
      category: 'Bakery',
      quantity: 80,
      unit: 'pcs',
      storage: 'Ambient',
      expiryDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      pickupStart: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      pickupEnd: new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString(),
      address: '209 New Upper Changi Road, Bedok',
      lat: 1.3236,
      lng: 103.9273,
      status: 'AVAILABLE',
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'offer-6',
      donorId: 'donor-3',
      title: 'Pastries Assortment',
      category: 'Bakery',
      quantity: 60,
      unit: 'pcs',
      storage: 'Ambient',
      expiryDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      pickupStart: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      pickupEnd: new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString(),
      address: '209 New Upper Changi Road, Bedok',
      lat: 1.3236,
      lng: 103.9273,
      status: 'AVAILABLE',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },

    // Green Valley Farm - Woodlands
    {
      id: 'offer-7',
      donorId: 'donor-4',
      title: 'Leafy Vegetables',
      category: 'Produce',
      quantity: 45,
      unit: 'kg',
      storage: 'Chilled',
      expiryDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      pickupStart: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(),
      pickupEnd: new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString(),
      address: '10 Woodlands Road',
      lat: 1.4382,
      lng: 103.7890,
      status: 'AVAILABLE',
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'offer-8',
      donorId: 'donor-4',
      title: 'Root Vegetables',
      category: 'Produce',
      quantity: 35,
      unit: 'kg',
      storage: 'Ambient',
      expiryDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      pickupStart: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(),
      pickupEnd: new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString(),
      address: '10 Woodlands Road',
      lat: 1.4382,
      lng: 103.7890,
      status: 'AVAILABLE',
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
    },

    // Ocean Fresh Seafood - Jurong
    {
      id: 'offer-9',
      donorId: 'donor-5',
      title: 'Frozen Fish Fillets',
      category: 'Frozen',
      quantity: 25,
      unit: 'kg',
      storage: 'Frozen',
      expiryDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      pickupStart: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      pickupEnd: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
      address: '2 Jurong East Street 21',
      lat: 1.3329,
      lng: 103.7436,
      status: 'AVAILABLE',
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'offer-10',
      donorId: 'donor-5',
      title: 'Frozen Prawns',
      category: 'Frozen',
      quantity: 20,
      unit: 'kg',
      storage: 'Frozen',
      expiryDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      pickupStart: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      pickupEnd: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
      address: '2 Jurong East Street 21',
      lat: 1.3329,
      lng: 103.7436,
      status: 'AVAILABLE',
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    },

    // Daily Dairy - Tampines
    {
      id: 'offer-11',
      donorId: 'donor-6',
      title: 'Cheese Blocks',
      category: 'Dairy',
      quantity: 15,
      unit: 'kg',
      storage: 'Chilled',
      expiryDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      pickupStart: new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString(),
      pickupEnd: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
      address: '4 Tampines Central 5',
      lat: 1.3526,
      lng: 103.9449,
      status: 'AVAILABLE',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'offer-12',
      donorId: 'donor-6',
      title: 'Yogurt Cups',
      category: 'Dairy',
      quantity: 100,
      unit: 'pcs',
      storage: 'Chilled',
      expiryDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      pickupStart: new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString(),
      pickupEnd: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
      address: '4 Tampines Central 5',
      lat: 1.3526,
      lng: 103.9449,
      status: 'AVAILABLE',
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

/**
 * Generate needs from beneficiaries
 */
function generateNeeds(users: User[]): Need[] {
  const beneficiaries = users.filter(u => u.role === 'BENEFICIARY');
  const now = new Date();

  return [
    // Hope Centre - Central area
    {
      id: 'need-1',
      beneficiaryId: 'bene-1',
      category: 'Produce',
      minQty: 20,
      urgency: 'High',
      canAccept: ['Ambient', 'Chilled'],
      deliveryPreferred: true,
      lat: 1.3521,
      lng: 103.8198,
      address: '100 Victoria Street',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'need-2',
      beneficiaryId: 'bene-1',
      category: 'Bakery',
      minQty: 40,
      urgency: 'Medium',
      canAccept: ['Ambient'],
      deliveryPreferred: true,
      lat: 1.3521,
      lng: 103.8198,
      address: '100 Victoria Street',
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    },

    // Willing Hearts - Kaki Bukit
    {
      id: 'need-3',
      beneficiaryId: 'bene-2',
      category: 'Canned',
      minQty: 50,
      urgency: 'Low',
      canAccept: ['Ambient'],
      deliveryPreferred: false,
      lat: 1.3355,
      lng: 103.9005,
      address: '3 Kaki Bukit Road',
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'need-4',
      beneficiaryId: 'bene-2',
      category: 'Dairy',
      minQty: 30,
      urgency: 'High',
      canAccept: ['Chilled'],
      deliveryPreferred: true,
      lat: 1.3355,
      lng: 103.9005,
      address: '3 Kaki Bukit Road',
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
    },

    // Community Care - Yishun
    {
      id: 'need-5',
      beneficiaryId: 'bene-3',
      category: 'Produce',
      minQty: 25,
      urgency: 'Medium',
      canAccept: ['Ambient', 'Chilled'],
      deliveryPreferred: true,
      lat: 1.4304,
      lng: 103.8354,
      address: '51 Yishun Avenue 11',
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
    },

    // Elderly Home - Bukit Timah
    {
      id: 'need-6',
      beneficiaryId: 'bene-4',
      category: 'Dairy',
      minQty: 20,
      urgency: 'Medium',
      canAccept: ['Chilled'],
      deliveryPreferred: true,
      lat: 1.3294,
      lng: 103.7920,
      address: '55 Bukit Timah Road',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'need-7',
      beneficiaryId: 'bene-4',
      category: 'Frozen',
      minQty: 15,
      urgency: 'Low',
      canAccept: ['Frozen'],
      deliveryPreferred: false,
      lat: 1.3294,
      lng: 103.7920,
      address: '55 Bukit Timah Road',
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
    },

    // Youth Centre - Punggol
    {
      id: 'need-8',
      beneficiaryId: 'bene-5',
      category: 'Bakery',
      minQty: 30,
      urgency: 'High',
      canAccept: ['Ambient'],
      deliveryPreferred: true,
      lat: 1.4054,
      lng: 103.9021,
      address: '83 Punggol Central',
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

/**
 * Generate some pre-existing matches
 */
function generateMatches(offers: Offer[], needs: Need[]): Match[] {
  const now = new Date();

  return [
    {
      id: 'match-1',
      offerId: 'offer-1',
      needId: 'need-1',
      quantity: 20,
      status: 'PENDING_PICKUP',
      createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      approvedByOps: 'ops-1',
    },
    {
      id: 'match-2',
      offerId: 'offer-5',
      needId: 'need-2',
      quantity: 40,
      status: 'PENDING_PICKUP',
      createdAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
      approvedByOps: 'ops-1',
    },
  ];
}

/**
 * Generate a pre-built route plan for demo
 */
function generateRoutePlans(users: User[], matches: Match[], offers: Offer[], needs: Need[]): RoutePlan[] {
  const now = new Date();

  // Create a demo route for Aisha
  const stops: Stop[] = [
    // Pickup at FreshGrocer
    {
      id: 'stop-1',
      planId: 'route-1',
      seq: 1,
      kind: 'PICKUP',
      lat: 1.3343,
      lng: 103.7436,
      name: 'FreshGrocer Pte Ltd',
      address: '3 Gateway Drive, Jurong West',
      windowStart: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      windowEnd: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
      coldChain: false,
      matchIds: ['match-1'],
    },
    // Pickup at Sunshine Bakery
    {
      id: 'stop-2',
      planId: 'route-1',
      seq: 2,
      kind: 'PICKUP',
      lat: 1.3236,
      lng: 103.9273,
      name: 'Sunshine Bakery',
      address: '209 New Upper Changi Road, Bedok',
      windowStart: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      windowEnd: new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString(),
      coldChain: false,
      matchIds: ['match-2'],
    },
    // Dropoff at Hope Centre
    {
      id: 'stop-3',
      planId: 'route-1',
      seq: 3,
      kind: 'DROPOFF',
      lat: 1.3521,
      lng: 103.8198,
      name: 'Hope Centre',
      address: '100 Victoria Street',
      coldChain: false,
      matchIds: ['match-1', 'match-2'],
    },
  ];

  return [
    {
      id: 'route-1',
      volunteerId: 'vol-1',
      depot: { lat: 1.3329, lng: 103.7436, name: 'Jurong Hub' },
      stops,
      totalKm: 42.5,
      totalMins: 85,
      status: 'ASSIGNED',
      createdAt: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
    },
  ];
}

/**
 * Generate initial KPIs
 */
function generateInitialKPIs(): KPIs {
  return {
    totalMatches: 2,
    timeToMatchP50: 45,
    timeToMatchP90: 90,
    matchRate: 25.0,
    fillRate: 80.5,
    totalDistanceKm: 42.5,
    totalCO2Kg: 11.5,
    wastageAvoided: 60,
    lastUpdated: new Date().toISOString(),
  };
}
