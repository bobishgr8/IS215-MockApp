/**
 * Mock data loader for beneficiaries and donations
 * Loads data from the shared JSON files at project root
 */

import { Category, Storage, Unit, Urgency, OfferStatus } from './types';

// Beneficiary Profile type
export interface BeneficiaryProfile {
  id: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  categories_needed: Category[];
  storage_capabilities: Storage[];
  delivery_preferred: boolean;
  weekly_capacity_kg: number;
}

// Need type
export interface BeneficiaryNeed {
  id: string;
  beneficiary_id: string;
  category: Category;
  min_qty: number;
  urgency: Urgency;
  can_accept: Storage[];
  delivery_preferred: boolean;
  created_at: string;
  lat: number;
  lng: number;
  address: string;
}

// Donation type
export interface Donation {
  id: string;
  donor_id: string;
  donor_name: string;
  title: string;
  category: Category;
  quantity: number;
  unit: Unit;
  storage: Storage;
  expiry_date: string;
  pickup_start: string;
  pickup_end: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  status: OfferStatus;
  created_at: string;
}

// Load beneficiaries data
let beneficiariesData: {
  profiles: BeneficiaryProfile[];
  needs: BeneficiaryNeed[];
} | null = null;

export async function loadBeneficiariesData() {
  if (beneficiariesData) {
    return beneficiariesData;
  }

  try {
    const response = await fetch('/beneficiaries.json');
    if (!response.ok) {
      throw new Error('Failed to load beneficiaries data');
    }
    beneficiariesData = await response.json();
    return beneficiariesData;
  } catch (error) {
    console.error('Error loading beneficiaries data:', error);
    return { profiles: [], needs: [] };
  }
}

// Load donations data
let donationsData: Donation[] | null = null;

export async function loadDonationsData() {
  if (donationsData) {
    return donationsData;
  }

  try {
    const response = await fetch('/donations.json');
    if (!response.ok) {
      throw new Error('Failed to load donations data');
    }
    donationsData = await response.json();
    return donationsData;
  } catch (error) {
    console.error('Error loading donations data:', error);
    return [];
  }
}

// Get beneficiary profiles
export async function getBeneficiaryProfiles(): Promise<BeneficiaryProfile[]> {
  const data = await loadBeneficiariesData();
  return data?.profiles || [];
}

// Get active needs
export async function getActiveNeeds(): Promise<BeneficiaryNeed[]> {
  const data = await loadBeneficiariesData();
  return data?.needs || [];
}

// Get all donations
export async function getDonations(): Promise<Donation[]> {
  const donations = await loadDonationsData();
  return donations || [];
}

// Get donations by donor ID
export async function getDonationsByDonor(donorId: string): Promise<Donation[]> {
  const donations = await loadDonationsData();
  return donations?.filter(d => d.donor_id === donorId) || [];
}

// Get needs by beneficiary ID
export async function getNeedsByBeneficiary(beneficiaryId: string): Promise<BeneficiaryNeed[]> {
  const data = await loadBeneficiariesData();
  return data?.needs.filter(n => n.beneficiary_id === beneficiaryId) || [];
}

// Get beneficiary profile by ID
export async function getBeneficiaryProfile(beneficiaryId: string): Promise<BeneficiaryProfile | undefined> {
  const data = await loadBeneficiariesData();
  return data?.profiles.find(p => p.id === beneficiaryId);
}

// Clear cache (useful for development/testing)
export function clearMockDataCache() {
  beneficiariesData = null;
  donationsData = null;
}
