// Matching logic for offers and needs

import { Offer, Need, MatchExplanation } from './types';
import { haversineKm } from './geo';

// Weights for matching score
const WEIGHTS = {
  expiry: 0.5,
  distance: 0.3,
  urgency: 0.15,
  surplus: 0.05,
};

/**
 * Calculate matching score for an offer against a need
 * Lower score = better match
 */
export function scoreOfferForNeed(offer: Offer, need: Need): MatchExplanation {
  // Check basic eligibility
  if (offer.category !== need.category) {
    return {
      score: Infinity,
      tags: [],
      breakdown: { expiryScore: 0, distanceScore: 0, urgencyScore: 0, surplusScore: 0 },
    };
  }

  if (!need.canAccept.includes(offer.storage)) {
    return {
      score: Infinity,
      tags: [],
      breakdown: { expiryScore: 0, distanceScore: 0, urgencyScore: 0, surplusScore: 0 },
    };
  }

  if (offer.status !== 'AVAILABLE') {
    return {
      score: Infinity,
      tags: [],
      breakdown: { expiryScore: 0, distanceScore: 0, urgencyScore: 0, surplusScore: 0 },
    };
  }

  // Calculate days to expiry
  const now = new Date();
  const expiryDate = new Date(offer.expiryDate);
  const daysToExpiry = Math.max(0, (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate distance
  const distance = haversineKm(
    { lat: offer.lat, lng: offer.lng },
    { lat: need.lat, lng: need.lng }
  );

  // Calculate urgency score
  const urgencyMap = { High: 0, Medium: 1, Low: 2 };
  const urgencyScore = urgencyMap[need.urgency];

  // Calculate surplus penalty
  const surplusPenalty = offer.quantity > need.minQty * 3 ? 1 : 0;

  // Weighted score
  const expiryComponent = WEIGHTS.expiry * daysToExpiry;
  const distanceComponent = WEIGHTS.distance * distance;
  const urgencyComponent = WEIGHTS.urgency * urgencyScore;
  const surplusComponent = WEIGHTS.surplus * surplusPenalty;

  const totalScore = expiryComponent + distanceComponent + urgencyComponent + surplusComponent;

  // Generate tags
  const tags: string[] = [];
  if (daysToExpiry <= 2) tags.push('FEFO');
  if (distance <= 5) tags.push('Nearby');
  if (need.urgency === 'High') tags.push('Urgent');
  if (offer.quantity >= need.minQty * 1.5) tags.push('Surplus');

  return {
    score: totalScore,
    tags,
    breakdown: {
      expiryScore: expiryComponent,
      distanceScore: distanceComponent,
      urgencyScore: urgencyComponent,
      surplusScore: surplusComponent,
    },
  };
}

/**
 * Rank all available offers for a given need
 */
export function rankOffersForNeed(offers: Offer[], need: Need): Array<{ offer: Offer; explanation: MatchExplanation }> {
  const scored = offers
    .map(offer => ({
      offer,
      explanation: scoreOfferForNeed(offer, need),
    }))
    .filter(item => item.explanation.score !== Infinity);

  // Sort by score (lower is better)
  scored.sort((a, b) => a.explanation.score - b.explanation.score);

  return scored;
}

/**
 * Calculate days until expiry for FEFO priority
 */
export function daysToExpiry(expiryDate: string): number {
  const now = new Date();
  const expiry = new Date(expiryDate);
  return Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

/**
 * Get urgency color for UI
 */
export function getUrgencyColor(urgency: Need['urgency']): string {
  switch (urgency) {
    case 'High':
      return 'text-red-600 bg-red-50';
    case 'Medium':
      return 'text-orange-600 bg-orange-50';
    case 'Low':
      return 'text-blue-600 bg-blue-50';
  }
}

/**
 * Get storage type color for UI
 */
export function getStorageColor(storage: Offer['storage']): string {
  switch (storage) {
    case 'Frozen':
      return 'text-blue-600 bg-blue-50';
    case 'Chilled':
      return 'text-cyan-600 bg-cyan-50';
    case 'Ambient':
      return 'text-green-600 bg-green-50';
  }
}

/**
 * Format score breakdown for tooltip
 */
export function formatScoreBreakdown(explanation: MatchExplanation): string {
  const { breakdown } = explanation;
  return `
Score: ${explanation.score.toFixed(2)}

Breakdown:
• Expiry: ${breakdown.expiryScore.toFixed(2)}
• Distance: ${breakdown.distanceScore.toFixed(2)}
• Urgency: ${breakdown.urgencyScore.toFixed(2)}
• Surplus: ${breakdown.surplusScore.toFixed(2)}
  `.trim();
}
