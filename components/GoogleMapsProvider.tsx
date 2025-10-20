'use client';

import { APIProvider } from '@vis.gl/react-google-maps';
import { ReactNode } from 'react';

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  if (!apiKey) {
    console.warn('Google Maps API key not found. Map features will be limited.');
  }

  return (
    <APIProvider apiKey={apiKey} libraries={['places', 'geocoding']}>
      {children}
    </APIProvider>
  );
}
