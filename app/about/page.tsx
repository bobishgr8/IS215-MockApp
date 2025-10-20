'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { TopNav } from '@/components/TopNav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Info,
  Database,
  Shield,
  Zap,
  Users,
  Package,
  MapPin,
  BarChart3,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { resetDb } from '@/lib/db';

export default function AboutPage() {
  const router = useRouter();
  const { currentUser, logout } = useStore();
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = () => {
    if (
      !confirm(
        'This will delete ALL local data and reset to demo state. Are you sure?'
      )
    ) {
      return;
    }

    setIsResetting(true);
    
    try {
      resetDb();
      toast.success('Database reset to demo state!');
      
      // Logout and redirect after a short delay
      setTimeout(() => {
        logout();
        router.push('/login');
      }, 1000);
    } catch (error) {
      toast.error('Failed to reset database');
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Info className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">About Food Bank Singapore</h1>
          </div>
          <p className="text-gray-600">Mock MVP Demo Application</p>
        </div>

        {/* Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>
              End-to-end food rescue & redistribution platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              This is a <strong>mock MVP web application</strong> demonstrating the complete user journey 
              for Food Bank Singapore's operations: from donor offers to beneficiary matching, 
              operations approval & routing, and volunteer delivery execution.
            </p>

            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold">4 User Roles</h4>
                  <p className="text-sm text-gray-600">
                    Donors, Beneficiaries, Volunteers, Operations
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Smart Matching</h4>
                  <p className="text-sm text-gray-600">
                    FEFO algorithm with distance, urgency, surplus scoring
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Route Optimization</h4>
                  <p className="text-sm text-gray-600">
                    Nearest-neighbor + 2-opt TSP with cold chain validation
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <BarChart3 className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Real-time KPIs</h4>
                  <p className="text-sm text-gray-600">
                    Match rates, fill rates, distance, CO₂, food rescued
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tech Stack */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Technical Stack</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Badge variant="outline" className="mb-2">Frontend</Badge>
                <ul className="text-sm text-gray-700 space-y-1 ml-4">
                  <li>• Next.js 15 (App Router)</li>
                  <li>• React 19</li>
                  <li>• TypeScript 5</li>
                  <li>• Tailwind CSS 4</li>
                  <li>• shadcn/ui components</li>
                </ul>
              </div>

              <div>
                <Badge variant="outline" className="mb-2">State & Data</Badge>
                <ul className="text-sm text-gray-700 space-y-1 ml-4">
                  <li>• Zustand (global state)</li>
                  <li>• localStorage (persistence)</li>
                  <li>• BroadcastChannel (cross-tab sync)</li>
                  <li>• date-fns (date utilities)</li>
                  <li>• zod (validation)</li>
                </ul>
              </div>
            </div>

            <Separator className="my-4" />

            <div>
              <Badge variant="outline" className="mb-2">Algorithms</Badge>
              <ul className="text-sm text-gray-700 space-y-1 ml-4">
                <li>• <strong>Haversine distance</strong> - geospatial calculations (6371km Earth radius)</li>
                <li>• <strong>FEFO matching</strong> - First Expired First Out with weighted scoring</li>
                <li>• <strong>Nearest Neighbor TSP</strong> - initial route construction</li>
                <li>• <strong>2-opt optimization</strong> - route improvement (max 100 iterations)</li>
                <li>• <strong>Cold chain validation</strong> - ensure pickup before dropoff</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <CardTitle>Privacy & Data</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-green-900">
            <p>
              <strong>All data is stored locally in your browser.</strong> This is a mock application 
              with no backend server. Your data never leaves your device. The app uses localStorage 
              for persistence and BroadcastChannel API for cross-tab synchronization within the same browser.
            </p>
          </CardContent>
        </Card>

        {/* Demo Script */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <CardTitle>Demo Script</CardTitle>
            </div>
            <CardDescription>Try the complete workflow</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm text-gray-700">
              <li>
                <strong>1. Donor</strong> - Login as donor (e.g., FreshGrocer), create a new food offer 
                with pickup details and expiry date
              </li>
              <li>
                <strong>2. Beneficiary</strong> - Login as beneficiary (e.g., Willing Hearts), 
                post a food need, view matched offers on the Match Board, claim an offer
              </li>
              <li>
                <strong>3. Operations</strong> - Login as ops user, approve the pending match, 
                create a route plan by selecting matches and assigning a volunteer
              </li>
              <li>
                <strong>4. Volunteer</strong> - Login as volunteer (e.g., Aisha), view assigned route, 
                check in at each stop, scan packages, record temperatures for cold chain items, complete deliveries
              </li>
              <li>
                <strong>5. KPIs</strong> - Login as ops, view the KPIs dashboard to see match rates, 
                delivery distance, CO₂ emissions, and food rescued
              </li>
            </ol>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Tip:</strong> Open multiple browser tabs to simulate different users 
                simultaneously. Changes sync in real-time via BroadcastChannel!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Database Reset */}
        <Card className="border-red-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-900">Danger Zone</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <Database className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Reset Database</h4>
                <p className="text-sm text-gray-700 mb-4">
                  Delete all local data and restore the demo seed data (6 donors, 12 offers, 
                  5 beneficiaries, 8 needs, 2 volunteers, 1 sample route). This action cannot be undone.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleReset}
                  disabled={isResetting}
                >
                  {isResetting ? 'Resetting...' : 'Reset to Demo State'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Food Bank Singapore Mock MVP</p>
          <p className="mt-1">
            Built with Next.js, React, TypeScript, Tailwind CSS, Zustand
          </p>
          {currentUser && (
            <p className="mt-2">
              Logged in as <strong>{currentUser.name}</strong> ({currentUser.role})
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
