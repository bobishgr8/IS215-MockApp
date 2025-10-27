'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { TopNav } from '@/components/TopNav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, TrendingUp, Package, Truck, Clock, Leaf, Scale } from 'lucide-react';

export default function OpsKPIsPage() {
  const router = useRouter();
  const { currentUser, kpis, matches, needs, offers, routePlans } = useStore();

  useEffect(() => {
    if (currentUser?.role !== 'OPS') {
      router.push('/login');
    }
  }, [currentUser, router]);

  if (currentUser?.role !== 'OPS') {
    return null;
  }

  const metrics = [
    {
      title: 'Total Matches',
      value: kpis.totalMatches.toString(),
      description: 'All matches created',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Time to Match (P50)',
      value: kpis.timeToMatchP50 > 0 ? `${kpis.timeToMatchP50} min` : 'N/A',
      description: 'Median time from need posted to match claimed',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Time to Match (P90)',
      value: kpis.timeToMatchP90 > 0 ? `${kpis.timeToMatchP90} min` : 'N/A',
      description: '90th percentile time to match',
      icon: Clock,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Match Success Rate',
      value: `${(kpis.matchRate * 100).toFixed(1)}%`,
      description: 'Percentage of needs that found matches',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Fill Rate',
      value: `${(kpis.fillRate * 100).toFixed(1)}%`,
      description: 'Average % of need quantity fulfilled',
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Delivery Distance',
      value: kpis.totalDistanceKm > 0 ? `${kpis.totalDistanceKm.toFixed(1)} km` : 'N/A',
      description: 'Total distance for all routes',
      icon: Truck,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    {
      title: 'CO₂ Emissions',
      value: kpis.totalCO2Kg > 0 ? `${kpis.totalCO2Kg.toFixed(1)} kg` : 'N/A',
      description: 'Estimated carbon footprint',
      icon: Leaf,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Food Rescued',
      value: kpis.wastageAvoided > 0 ? `${kpis.wastageAvoided.toFixed(0)} kg` : 'N/A',
      description: 'Total food diverted from waste',
      icon: Scale,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-8 w-8 text-orange-600" />
            <h1 className="text-3xl font-bold">KPIs Dashboard</h1>
          </div>
          <p className="text-gray-600">Key performance indicators for food bank operations</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {metrics.map((metric) => (
            <Card key={metric.title}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                    <metric.icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                  <CardTitle className="text-base">{metric.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">{metric.value}</div>
                <CardDescription className="text-xs">{metric.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Details Section */}
        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Match Breakdown</CardTitle>
              <CardDescription>Status distribution of all matches</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pending Pickup</span>
                  <span className="text-sm text-gray-600">
                    {matches.filter(m => m.status === 'PENDING_PICKUP').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Routed</span>
                  <span className="text-sm text-gray-600">
                    {matches.filter(m => m.status === 'ROUTED').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Completed</span>
                  <span className="text-sm text-gray-600">
                    {matches.filter(m => m.status === 'COMPLETED').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Cancelled</span>
                  <span className="text-sm text-gray-600">
                    {matches.filter(m => m.status === 'CANCELLED').length}
                  </span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-sm">Total Matches</span>
                    <span className="text-sm">{matches.length}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>Current operational metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Needs</span>
                  <span className="text-sm text-gray-600">{needs.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Needs with Matches</span>
                  <span className="text-sm text-gray-600">
                    {needs.filter(n => matches.some(m => m.needId === n.id)).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Offers</span>
                  <span className="text-sm text-gray-600">{offers.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active Routes</span>
                  <span className="text-sm text-gray-600">
                    {routePlans.filter(rp => rp.status !== 'DONE').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Avg Fill Rate</span>
                  <span className="text-sm text-gray-600">
                    {(kpis.fillRate * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Panel */}
        <Card className="mt-8 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">About KPIs</h3>
                <p className="text-sm text-blue-800">
                  These metrics are calculated in real-time. 
                  Time-to-match measures how quickly needs are fulfilled. Match rate shows 
                  the percentage of needs that found offers. Fill rate indicates how well 
                  the matched quantity meets the requested amount. Distance and CO₂ 
                  metrics help optimize routing efficiency.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
