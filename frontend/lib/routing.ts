// Routing logic for volunteer route planning

import { Stop, LatLng } from './types';
import {
  haversineKm,
  nearestNeighbour,
  twoOptImprovement,
  calculateTotalDistance,
  estimateTravelTime,
  isWithinTimeWindow,
} from './geo';

export type RouteInput = {
  type: 'PICKUP' | 'DROPOFF';
  lat: number;
  lng: number;
  name: string;
  address: string;
  windowStart?: string;
  windowEnd?: string;
  coldChain: boolean;
  matchIds?: string[];
};

export type RouteResult = {
  orderedStops: RouteInput[];
  totalKm: number;
  totalMins: number;
  warnings: string[];
};

/**
 * Generate optimized route using Nearest Neighbour + 2-opt heuristic
 */
export function generateRoute(depot: LatLng, stops: RouteInput[], startTime?: Date): RouteResult {
  if (stops.length === 0) {
    return {
      orderedStops: [],
      totalKm: 0,
      totalMins: 0,
      warnings: [],
    };
  }

  // Extract coordinates
  const stopCoords: LatLng[] = stops.map(s => ({ lat: s.lat, lng: s.lng }));

  // Apply nearest neighbour
  const nnRoute = nearestNeighbour(depot, stopCoords);

  // Apply 2-opt improvement
  const optimizedRoute = twoOptImprovement(nnRoute, stopCoords);

  // Reorder stops based on optimized route
  const orderedStops = optimizedRoute.map(idx => stops[idx]);

  // Calculate total distance and time
  const orderedCoords = orderedStops.map(s => ({ lat: s.lat, lng: s.lng }));
  const totalKm = calculateTotalDistance(depot, orderedCoords);
  const totalMins = estimateTravelTime(totalKm);

  // Check for time window violations
  const warnings: string[] = [];
  let currentTime = startTime || new Date();

  orderedStops.forEach((stop, idx) => {
    // Add travel time to reach this stop
    if (idx > 0) {
      const travelDist = haversineKm(
        { lat: orderedStops[idx - 1].lat, lng: orderedStops[idx - 1].lng },
        { lat: stop.lat, lng: stop.lng }
      );
      const travelMins = estimateTravelTime(travelDist);
      currentTime = new Date(currentTime.getTime() + travelMins * 60 * 1000);
    } else {
      // Travel from depot to first stop
      const travelDist = haversineKm(depot, { lat: stop.lat, lng: stop.lng });
      const travelMins = estimateTravelTime(travelDist);
      currentTime = new Date(currentTime.getTime() + travelMins * 60 * 1000);
    }

    // Check time window
    if (!isWithinTimeWindow(currentTime, stop.windowStart, stop.windowEnd)) {
      warnings.push(`⚠ Stop "${stop.name}" may violate time window`);
    }

    // Add service time (e.g., 15 minutes per stop)
    currentTime = new Date(currentTime.getTime() + 15 * 60 * 1000);
  });

  // Validate cold chain continuity (pickups should come before corresponding dropoffs)
  const coldChainWarnings = validateColdChain(orderedStops);
  warnings.push(...coldChainWarnings);

  return {
    orderedStops,
    totalKm: Math.round(totalKm * 10) / 10,
    totalMins: Math.round(totalMins),
    warnings,
  };
}

/**
 * Validate cold chain integrity (pickup before dropoff for temperature-sensitive items)
 */
function validateColdChain(orderedStops: RouteInput[]): string[] {
  const warnings: string[] = [];
  const pickupsSeen = new Set<string>();

  orderedStops.forEach(stop => {
    if (stop.coldChain) {
      if (stop.type === 'PICKUP') {
        // Mark this match as picked up
        stop.matchIds?.forEach(id => pickupsSeen.add(id));
      } else if (stop.type === 'DROPOFF') {
        // Check if pickup happened before dropoff
        const allPickedUp = stop.matchIds?.every(id => pickupsSeen.has(id)) ?? true;
        if (!allPickedUp) {
          warnings.push(`⚠ Cold chain: dropoff at "${stop.name}" before pickup`);
        }
      }
    }
  });

  return warnings;
}

/**
 * Calculate ETA for each stop based on start time
 */
export function calculateStopETAs(
  depot: LatLng,
  stops: Stop[],
  startTime: Date
): Map<string, Date> {
  const etas = new Map<string, Date>();
  let currentTime = new Date(startTime);
  let lastLocation = depot;

  stops.forEach(stop => {
    // Calculate travel time to this stop
    const distance = haversineKm(lastLocation, { lat: stop.lat, lng: stop.lng });
    const travelMins = estimateTravelTime(distance);

    // Add travel time
    currentTime = new Date(currentTime.getTime() + travelMins * 60 * 1000);
    etas.set(stop.id, new Date(currentTime));

    // Add service time (15 minutes)
    currentTime = new Date(currentTime.getTime() + 15 * 60 * 1000);
    lastLocation = { lat: stop.lat, lng: stop.lng };
  });

  return etas;
}

/**
 * Group stops by proximity for batch operations
 */
export function groupStopsByProximity(
  stops: RouteInput[],
  maxDistanceKm = 2
): RouteInput[][] {
  if (stops.length === 0) return [];

  const groups: RouteInput[][] = [];
  const remaining = [...stops];

  while (remaining.length > 0) {
    const current = remaining.shift()!;
    const group = [current];

    // Find nearby stops
    let i = 0;
    while (i < remaining.length) {
      const distance = haversineKm(
        { lat: current.lat, lng: current.lng },
        { lat: remaining[i].lat, lng: remaining[i].lng }
      );

      if (distance <= maxDistanceKm) {
        group.push(remaining.splice(i, 1)[0]);
      } else {
        i++;
      }
    }

    groups.push(group);
  }

  return groups;
}
