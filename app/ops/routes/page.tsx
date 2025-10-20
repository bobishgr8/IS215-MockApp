'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { TopNav } from '@/components/TopNav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Route, MapPin, Truck, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { generateRoute, RouteInput } from '@/lib/routing';
import { generateId } from '@/lib/db';
import { LocationPicker } from '@/components/LocationPicker';
import { RouteMap } from '@/components/RouteMap';

export default function OpsRoutesPage() {
  const router = useRouter();
  const { currentUser, matches, offers, needs, users, routePlans, createRoutePlan } = useStore();
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [selectedMatches, setSelectedMatches] = useState<string[]>([]);
  const [depotAddress, setDepotAddress] = useState('Jurong West Street 63, Singapore');
  const [depotLat, setDepotLat] = useState(1.3329);
  const [depotLng, setDepotLng] = useState(103.7436);

  useEffect(() => {
    if (currentUser?.role !== 'OPS') {
      router.push('/login');
    }
  }, [currentUser, router]);

  if (currentUser?.role !== 'OPS') {
    return null;
  }

  const volunteers = users.filter(u => u.role === 'VOLUNTEER');
  const availableMatches = matches.filter(
    m => m.status === 'PENDING_PICKUP' && m.approvedByOps && !m.volunteerId
  );

  const toggleMatch = (matchId: string) => {
    setSelectedMatches(prev =>
      prev.includes(matchId) ? prev.filter(id => id !== matchId) : [...prev, matchId]
    );
  };

  const handleCreateRoute = () => {
    if (!selectedVolunteer) {
      toast.error('Please select a volunteer');
      return;
    }

    if (selectedMatches.length === 0) {
      toast.error('Please select at least one match');
      return;
    }

    // Build route stops from selected matches
    const stops: RouteInput[] = [];

    selectedMatches.forEach(matchId => {
      const match = matches.find(m => m.id === matchId);
      if (!match) return;

      const offer = offers.find(o => o.id === match.offerId);
      const need = needs.find(n => n.id === match.needId);
      const donor = offer ? users.find(u => u.id === offer.donorId) : null;
      const beneficiary = need ? users.find(u => u.id === need.beneficiaryId) : null;

      if (offer && need) {
        // Add pickup stop
        stops.push({
          type: 'PICKUP',
          lat: offer.lat,
          lng: offer.lng,
          name: donor?.name || 'Donor',
          address: offer.address,
          windowStart: offer.pickupStart,
          windowEnd: offer.pickupEnd,
          coldChain: offer.storage !== 'Ambient',
          matchIds: [matchId],
        });

        // Add dropoff stop
        stops.push({
          type: 'DROPOFF',
          lat: need.lat,
          lng: need.lng,
          name: beneficiary?.name || 'Beneficiary',
          address: need.address,
          coldChain: offer.storage !== 'Ambient',
          matchIds: [matchId],
        });
      }
    });

    // Generate optimized route
    const depot = {
      lat: depotLat,
      lng: depotLng,
    };

    const routeResult = generateRoute(depot, stops);

    // Create route plan
    const routeStops = routeResult.orderedStops.map((stop, index) => ({
      id: generateId(),
      planId: '', // Will be set by store
      seq: index + 1,
      kind: stop.type,
      lat: stop.lat,
      lng: stop.lng,
      name: stop.name,
      address: stop.address,
      windowStart: stop.windowStart,
      windowEnd: stop.windowEnd,
      coldChain: stop.coldChain,
      matchIds: stop.matchIds,
    }));

    createRoutePlan({
      volunteerId: selectedVolunteer,
      depot: {
        lat: depot.lat,
        lng: depot.lng,
        name: 'Depot',
      },
      stops: routeStops,
      totalKm: routeResult.totalKm,
      totalMins: routeResult.totalMins,
      status: 'ASSIGNED',
    });

    toast.success(`Route created! ${routeResult.totalKm}km, ~${routeResult.totalMins} minutes`);
    
    if (routeResult.warnings.length > 0) {
      routeResult.warnings.forEach(warning => {
        toast.warning(warning);
      });
    }

    // Reset form
    setSelectedMatches([]);
    setSelectedVolunteer('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Route Planning</h1>
          <p className="text-gray-600 mt-1">Create optimized delivery routes for volunteers</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Route Configuration</CardTitle>
              <CardDescription>Select volunteer and depot location</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Volunteer *</Label>
                <Select value={selectedVolunteer} onValueChange={setSelectedVolunteer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select volunteer" />
                  </SelectTrigger>
                  <SelectContent>
                    {volunteers.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <LocationPicker
                label="Depot Location"
                value={depotAddress}
                onChange={(address, lat, lng) => {
                  setDepotAddress(address);
                  setDepotLat(lat);
                  setDepotLng(lng);
                }}
                placeholder="Search for depot location in Singapore"
              />

              <div className="pt-4">
                <p className="text-sm text-gray-600 mb-2">
                  Selected: {selectedMatches.length} match{selectedMatches.length !== 1 ? 'es' : ''}
                </p>
                <Button
                  className="w-full"
                  onClick={handleCreateRoute}
                  disabled={selectedMatches.length === 0 || !selectedVolunteer}
                >
                  <Route className="mr-2 h-4 w-4" />
                  Create Route Plan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Matches List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Available Matches</CardTitle>
              <CardDescription>
                Select matches to include in the route ({availableMatches.length} available)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableMatches.length === 0 ? (
                <div className="text-center py-12">
                  <Truck className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No matches available</h3>
                  <p className="text-gray-600">
                    Approved matches ready for routing will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableMatches.map(match => {
                    const offer = offers.find(o => o.id === match.offerId);
                    const need = needs.find(n => n.id === match.needId);
                    const donor = offer ? users.find(u => u.id === offer.donorId) : null;
                    const beneficiary = need ? users.find(u => u.id === need.beneficiaryId) : null;

                    return (
                      <div
                        key={match.id}
                        className={`rounded-lg border p-4 cursor-pointer transition ${
                          selectedMatches.includes(match.id)
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-white hover:bg-gray-50'
                        }`}
                        onClick={() => toggleMatch(match.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedMatches.includes(match.id)}
                            onCheckedChange={() => toggleMatch(match.id)}
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold">{offer?.title}</p>
                                <p className="text-sm text-gray-600">
                                  {match.quantity} {offer?.unit} • {offer?.category}
                                </p>
                              </div>
                              {offer?.storage !== 'Ambient' && (
                                <Badge variant="outline" className="bg-blue-50">
                                  ❄️ Cold Chain
                                </Badge>
                              )}
                            </div>

                            <div className="grid md:grid-cols-2 gap-2 text-sm">
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="font-medium text-green-700">Pickup</p>
                                  <p className="text-gray-600">{donor?.name}</p>
                                  <p className="text-xs text-gray-500">{offer?.address}</p>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="font-medium text-blue-700">Dropoff</p>
                                  <p className="text-gray-600">{beneficiary?.name}</p>
                                  <p className="text-xs text-gray-500">{need?.address}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Existing Route Plans */}
        {routePlans.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Existing Route Plans</h2>
            <div className="space-y-6">
              {routePlans.map(plan => {
                const volunteer = users.find(u => u.id === plan.volunteerId);
                
                return (
                  <Card key={plan.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>Route #{plan.id.slice(0, 8)}</CardTitle>
                          <CardDescription>
                            Volunteer: {volunteer?.name || 'Unknown'} • {plan.stops.length} stops • {plan.totalKm.toFixed(1)}km • ~{plan.totalMins} mins
                          </CardDescription>
                        </div>
                        <Badge
                          variant={
                            plan.status === 'DONE' ? 'default' :
                            plan.status === 'IN_PROGRESS' ? 'secondary' :
                            'outline'
                          }
                        >
                          {plan.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Route Map */}
                        <div className="h-96 rounded-lg overflow-hidden border">
                          <RouteMap
                            depot={{
                              lat: plan.depot.lat,
                              lng: plan.depot.lng,
                              name: plan.depot.name || 'Depot',
                            }}
                            stops={plan.stops}
                          />
                        </div>

                        {/* Stop Details */}
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Route Details:</h4>
                          <div className="space-y-1">
                            {plan.stops.map((stop, idx) => (
                              <div
                                key={stop.id}
                                className="flex items-center gap-2 text-sm p-2 rounded bg-gray-50"
                              >
                                <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                                  {idx + 1}
                                </Badge>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {stop.kind === 'PICKUP' ? '📦 Pickup' : '🎯 Dropoff'}
                                    </span>
                                    <span className="text-gray-600">at {stop.name}</span>
                                    {stop.coldChain && (
                                      <Badge variant="outline" className="text-xs">❄️</Badge>
                                    )}
                                    {stop.completedAt && (
                                      <Badge variant="default" className="text-xs">✓ Done</Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500">{stop.address}</p>
                                  {stop.windowStart && stop.windowEnd && (
                                    <p className="text-xs text-gray-500">
                                      <Clock className="inline h-3 w-3 mr-1" />
                                      {new Date(stop.windowStart).toLocaleTimeString('en-SG', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                      {' - '}
                                      {new Date(stop.windowEnd).toLocaleTimeString('en-SG', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
