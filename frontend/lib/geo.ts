// Geo utilities for routing and distance calculations

import { LatLng } from './types';

/**
 * Calculate Haversine distance between two points in kilometers
 */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const aCalc = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(aCalc), Math.sqrt(1 - aCalc));
  
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Nearest Neighbour algorithm for TSP
 */
export function nearestNeighbour(start: LatLng, points: LatLng[]): number[] {
  if (points.length === 0) return [];
  if (points.length === 1) return [0];

  const unvisited = new Set(points.map((_, i) => i));
  const route: number[] = [];
  let current = start;

  while (unvisited.size > 0) {
    let nearestIdx = -1;
    let nearestDist = Infinity;

    for (const idx of unvisited) {
      const dist = haversineKm(current, points[idx]);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = idx;
      }
    }

    route.push(nearestIdx);
    unvisited.delete(nearestIdx);
    current = points[nearestIdx];
  }

  return route;
}

/**
 * 2-opt improvement for TSP route
 */
export function twoOptImprovement(route: number[], points: LatLng[], maxIterations = 100): number[] {
  if (route.length < 4) return route; // Need at least 4 points for 2-opt

  let improved = [...route];
  let bestDistance = calculateRouteDistance(improved, points);
  let iterations = 0;

  while (iterations < maxIterations) {
    let foundImprovement = false;

    for (let i = 1; i < improved.length - 2; i++) {
      for (let j = i + 1; j < improved.length; j++) {
        // Try reversing the segment between i and j
        const newRoute = twoOptSwap(improved, i, j);
        const newDistance = calculateRouteDistance(newRoute, points);

        if (newDistance < bestDistance) {
          improved = newRoute;
          bestDistance = newDistance;
          foundImprovement = true;
        }
      }
    }

    if (!foundImprovement) break;
    iterations++;
  }

  return improved;
}

function twoOptSwap(route: number[], i: number, j: number): number[] {
  const newRoute = [...route.slice(0, i), ...route.slice(i, j + 1).reverse(), ...route.slice(j + 1)];
  return newRoute;
}

function calculateRouteDistance(route: number[], points: LatLng[]): number {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    total += haversineKm(points[route[i]], points[route[i + 1]]);
  }
  return total;
}

/**
 * Calculate total distance of a route including depot
 */
export function calculateTotalDistance(depot: LatLng, orderedStops: LatLng[]): number {
  if (orderedStops.length === 0) return 0;
  
  let total = haversineKm(depot, orderedStops[0]);
  
  for (let i = 0; i < orderedStops.length - 1; i++) {
    total += haversineKm(orderedStops[i], orderedStops[i + 1]);
  }
  
  // Return to depot
  total += haversineKm(orderedStops[orderedStops.length - 1], depot);
  
  return total;
}

/**
 * Estimate travel time in minutes based on distance (assumes 30 km/h average speed)
 */
export function estimateTravelTime(distanceKm: number, speedKmh = 30): number {
  return (distanceKm / speedKmh) * 60;
}

/**
 * Calculate CO2 emissions proxy (kg) based on distance
 * Using approximate factor of 0.27 kg CO2 per km for light commercial vehicle
 */
export function calculateCO2(distanceKm: number): number {
  return distanceKm * 0.27;
}

/**
 * Check if a time is within a window
 */
export function isWithinTimeWindow(
  time: Date,
  windowStart?: string,
  windowEnd?: string
): boolean {
  if (!windowStart || !windowEnd) return true;
  
  const start = new Date(windowStart);
  const end = new Date(windowEnd);
  
  return time >= start && time <= end;
}

/**
 * Get Singapore bounds (for map centering)
 */
export const SINGAPORE_BOUNDS = {
  center: { lat: 1.3521, lng: 103.8198 },
  southwest: { lat: 1.1304, lng: 103.6020 },
  northeast: { lat: 1.4704, lng: 104.0120 },
};
