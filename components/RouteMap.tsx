'use client';

import { Map, Marker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { useState, useEffect } from 'react';
import { MapPin, Package, Navigation } from 'lucide-react';

interface RouteMapProps {
  stops: Array<{
    id: string;
    lat: number;
    lng: number;
    name: string;
    address: string;
    kind: 'PICKUP' | 'DROPOFF';
    completedAt?: string;
  }>;
  depot?: {
    lat: number;
    lng: number;
    name: string;
  };
  className?: string;
}

export function RouteMap({ stops, depot, className = 'h-[500px] w-full' }: RouteMapProps) {
  const [selectedStop, setSelectedStop] = useState<string | null>(null);
  const [center, setCenter] = useState({ lat: 1.3521, lng: 103.8198 }); // Singapore center

  useEffect(() => {
    // Center map on first stop or depot
    if (stops.length > 0) {
      setCenter({ lat: stops[0].lat, lng: stops[0].lng });
    } else if (depot) {
      setCenter({ lat: depot.lat, lng: depot.lng });
    }
  }, [stops, depot]);

  const selectedStopData = stops.find(s => s.id === selectedStop);

  return (
    <div className={className}>
      <Map
        defaultZoom={12}
        defaultCenter={center}
        mapId="route-map"
        gestureHandling="greedy"
        disableDefaultUI={false}
      >
        {/* Depot marker */}
        {depot && (
          <Marker
            position={{ lat: depot.lat, lng: depot.lng }}
            title={depot.name}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#3b82f6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
          />
        )}

        {/* Stop markers */}
        {stops.map((stop, index) => (
          <Marker
            key={stop.id}
            position={{ lat: stop.lat, lng: stop.lng }}
            title={`${index + 1}. ${stop.name}`}
            onClick={() => setSelectedStop(stop.id)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: stop.completedAt
                ? '#10b981'
                : stop.kind === 'PICKUP'
                ? '#f59e0b'
                : '#8b5cf6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
            label={{
              text: String(index + 1),
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          />
        ))}

        {/* Info window for selected stop */}
        {selectedStopData && (
          <InfoWindow
            position={{ lat: selectedStopData.lat, lng: selectedStopData.lng }}
            onCloseClick={() => setSelectedStop(null)}
          >
            <div className="p-2">
              <div className="flex items-center gap-2 mb-1">
                {selectedStopData.kind === 'PICKUP' ? (
                  <Package className="h-4 w-4 text-orange-600" />
                ) : (
                  <Navigation className="h-4 w-4 text-purple-600" />
                )}
                <h3 className="font-semibold">{selectedStopData.name}</h3>
              </div>
              <p className="text-sm text-gray-600">{selectedStopData.address}</p>
              {selectedStopData.completedAt && (
                <p className="text-xs text-green-600 mt-1">✓ Completed</p>
              )}
            </div>
          </InfoWindow>
        )}

        {/* Draw route polyline */}
        <RoutePolyline stops={stops} depot={depot} />
      </Map>
    </div>
  );
}

function RoutePolyline({
  stops,
  depot,
}: {
  stops: RouteMapProps['stops'];
  depot?: RouteMapProps['depot'];
}) {
  const map = useMap();
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (!map) return;

    const service = new google.maps.DirectionsService();
    const renderer = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true, // We're using custom markers
      polylineOptions: {
        strokeColor: '#3b82f6',
        strokeWeight: 3,
        strokeOpacity: 0.7,
      },
    });

    setDirectionsService(service);
    setDirectionsRenderer(renderer);

    return () => {
      renderer.setMap(null);
    };
  }, [map]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer || stops.length === 0) return;

    // Create waypoints from stops
    const origin = depot
      ? { lat: depot.lat, lng: depot.lng }
      : { lat: stops[0].lat, lng: stops[0].lng };

    const destination =
      stops.length > 0
        ? { lat: stops[stops.length - 1].lat, lng: stops[stops.length - 1].lng }
        : origin;

    const waypoints = stops.slice(depot ? 0 : 1, -1).map((stop) => ({
      location: { lat: stop.lat, lng: stop.lng },
      stopover: true,
    }));

    directionsService.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false, // We've already optimized the route
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result);
        } else {
          console.error('Directions request failed:', status);
        }
      }
    );
  }, [directionsService, directionsRenderer, stops, depot]);

  return null;
}
