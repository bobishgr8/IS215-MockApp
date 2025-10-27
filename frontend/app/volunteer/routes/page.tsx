'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { TopNav } from '@/components/TopNav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Route,
  MapPin,
  CheckCircle2,
  Circle,
  Navigation,
  Clock,
  Package,
  Thermometer,
  QrCode,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { RouteMap } from '@/components/RouteMap';

export default function VolunteerRoutesPage() {
  const router = useRouter();
  const { currentUser, routePlans, updateStop, completeStop, offers, needs, users } = useStore();
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [expandedStop, setExpandedStop] = useState<string | null>(null);
  const [tempInput, setTempInput] = useState('');

  useEffect(() => {
    if (currentUser?.role !== 'VOLUNTEER') {
      router.push('/login');
    }
  }, [currentUser, router]);

  if (currentUser?.role !== 'VOLUNTEER') {
    return null;
  }

  const myRoutes = routePlans.filter(rp => rp.volunteerId === currentUser.id);
  const activeRoutes = myRoutes.filter(rp => rp.status !== 'DONE');
  const completedRoutes = myRoutes.filter(rp => rp.status === 'DONE');

  const currentRoute = selectedRoute
    ? routePlans.find(rp => rp.id === selectedRoute)
    : activeRoutes[0];

  const handleCheckIn = (stopId: string) => {
    if (currentRoute) {
      updateStop(currentRoute.id, stopId, {
        checkedInAt: new Date().toISOString(),
      });
      toast.success('Checked in!');
    }
  };

  const handleScan = (stopId: string) => {
    if (currentRoute) {
      updateStop(currentRoute.id, stopId, {
        scanned: true,
      });
      toast.success('Package scanned!');
    }
  };

  const handleTemperature = (stopId: string) => {
    const temp = parseFloat(tempInput);
    if (isNaN(temp)) {
      toast.error('Please enter a valid temperature');
      return;
    }

    if (currentRoute) {
      updateStop(currentRoute.id, stopId, {
        temperatureC: temp,
      });
      toast.success(`Temperature recorded: ${temp}°C`);
      setTempInput('');
    }
  };

  const handleComplete = (stopId: string) => {
    if (!currentRoute) return;

    const stop = currentRoute.stops.find(s => s.id === stopId);
    if (!stop?.checkedInAt) {
      toast.error('Please check in first');
      return;
    }

    if (stop.coldChain && !stop.temperatureC) {
      toast.error('Please record temperature for cold chain item');
      return;
    }

    completeStop(currentRoute.id, stopId);
    toast.success('Stop completed!');
  };

  const getStopProgress = () => {
    if (!currentRoute) return 0;
    const completed = currentRoute.stops.filter(s => s.completedAt).length;
    return (completed / currentRoute.stops.length) * 100;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Routes</h1>
          <p className="text-gray-600 mt-1">Execute assigned delivery routes</p>
        </div>

        {myRoutes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Route className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No routes assigned</h3>
              <p className="text-gray-600">Routes assigned to you will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active">
                Active ({activeRoutes.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedRoutes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-6 mt-6">
              {activeRoutes.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-gray-600">No active routes</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {activeRoutes.map(route => (
                    <Card key={route.id} className="overflow-hidden">
                      <CardHeader className="bg-purple-50">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Route className="h-5 w-5" />
                              Route {route.id.slice(0, 8)}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {route.totalKm.toFixed(1)} km • ~{route.totalMins} min • {route.stops.length} stops
                            </CardDescription>
                          </div>
                          <Badge variant={route.status === 'IN_PROGRESS' ? 'default' : 'outline'}>
                            {route.status === 'ASSIGNED' ? 'Ready to Start' : 'In Progress'}
                          </Badge>
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span>Progress</span>
                            <span className="font-medium">
                              {route.stops.filter(s => s.completedAt).length} / {route.stops.length} stops
                            </span>
                          </div>
                          <Progress 
                            value={(route.stops.filter(s => s.completedAt).length / route.stops.length) * 100} 
                          />
                        </div>
                      </CardHeader>

                      <CardContent className="pt-6 space-y-6">
                        {/* Route Map */}
                        <div className="h-80 rounded-lg overflow-hidden border">
                          <RouteMap
                            depot={{
                              lat: route.depot.lat,
                              lng: route.depot.lng,
                              name: route.depot.name || 'Depot',
                            }}
                            stops={route.stops}
                          />
                        </div>

                        {/* Route Details */}
                        <div>
                          <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Stop Details
                          </h3>
                          <div className="space-y-4">
                            {route.stops.map((stop, idx) => {
                            const isExpanded = expandedStop === stop.id;
                            const isCompleted = !!stop.completedAt;
                            const isCheckedIn = !!stop.checkedInAt;

                            return (
                              <div key={stop.id}>
                                <div
                                  className={`rounded-lg border p-4 cursor-pointer transition ${
                                    isCompleted
                                      ? 'bg-green-50 border-green-200'
                                      : isCheckedIn
                                      ? 'bg-blue-50 border-blue-200'
                                      : 'bg-white hover:bg-gray-50'
                                  }`}
                                  onClick={() => setExpandedStop(isExpanded ? null : stop.id)}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-1">
                                      {isCompleted ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                      ) : (
                                        <Circle className="h-5 w-5 text-gray-400" />
                                      )}
                                    </div>

                                    <div className="flex-1">
                                      <div className="flex items-start justify-between mb-1">
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-semibold">
                                              Stop {idx + 1}: {stop.kind}
                                            </span>
                                            {stop.coldChain && (
                                              <Badge variant="outline" className="bg-blue-50">
                                                ❄️
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="text-sm text-gray-600 mt-1">{stop.name}</p>
                                        </div>
                                      </div>

                                      <p className="text-sm text-gray-500">{stop.address}</p>

                                      {stop.windowStart && stop.windowEnd && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          <Clock className="inline h-3 w-3 mr-1" />
                                          {format(new Date(stop.windowStart), 'HH:mm')} -{' '}
                                          {format(new Date(stop.windowEnd), 'HH:mm')}
                                        </p>
                                      )}

                                      {isExpanded && !isCompleted && (
                                        <div className="mt-4 space-y-3 border-t pt-4">
                                          {!isCheckedIn ? (
                                            <Button
                                              size="sm"
                                              className="w-full"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleCheckIn(stop.id);
                                              }}
                                            >
                                              <Navigation className="mr-2 h-4 w-4" />
                                              Check In
                                            </Button>
                                          ) : (
                                            <>
                                              <div className="flex gap-2">
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  className="flex-1"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleScan(stop.id);
                                                  }}
                                                  disabled={stop.scanned}
                                                >
                                                  <QrCode className="mr-2 h-4 w-4" />
                                                  {stop.scanned ? 'Scanned' : 'Scan Package'}
                                                </Button>
                                              </div>

                                              {stop.coldChain && !stop.temperatureC && (
                                                <div className="flex gap-2">
                                                  <Input
                                                    type="number"
                                                    placeholder="Temperature (°C)"
                                                    value={tempInput}
                                                    onChange={(e) => setTempInput(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex-1"
                                                  />
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleTemperature(stop.id);
                                                    }}
                                                  >
                                                    <Thermometer className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              )}

                                              {stop.temperatureC && (
                                                <p className="text-sm text-blue-600">
                                                  ❄️ Temperature: {stop.temperatureC}°C
                                                </p>
                                              )}

                                              <Button
                                                size="sm"
                                                className="w-full bg-green-600 hover:bg-green-700"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleComplete(stop.id);
                                                }}
                                              >
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                Complete Stop
                                              </Button>
                                            </>
                                          )}
                                        </div>
                                      )}

                                      {isCompleted && stop.completedAt && (
                                        <p className="text-xs text-green-600 mt-2">
                                          ✓ Completed at {format(new Date(stop.completedAt), 'HH:mm')}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {idx < route.stops.length - 1 && (
                                  <div className="flex justify-center py-2">
                                    <div className="h-6 w-0.5 bg-gray-300"></div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4 mt-6">
              {completedRoutes.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-gray-600">No completed routes</p>
                  </CardContent>
                </Card>
              ) : (
                completedRoutes.map(route => (
                  <Card key={route.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">
                            Route {route.id.slice(0, 8)}
                          </CardTitle>
                          <CardDescription>
                            {route.totalKm.toFixed(1)} km • {route.stops.length} stops
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          ✓ Done
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 rounded-lg overflow-hidden border">
                        <RouteMap
                          depot={{
                            lat: route.depot.lat,
                            lng: route.depot.lng,
                            name: route.depot.name || 'Depot',
                          }}
                          stops={route.stops}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
