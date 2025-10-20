'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { TopNav } from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, MapPin, AlertCircle, Package, Thermometer } from 'lucide-react';
import { NeedForm } from '@/components/NeedForm';
import { MatchBoard } from '@/components/MatchBoard';
import { getUrgencyColor } from '@/lib/matching';
import { EmptyState } from '@/components/EmptyState';
import { Separator } from '@/components/ui/separator';

export default function BeneficiaryPage() {
  const router = useRouter();
  const { currentUser, needs, matches } = useStore();
  const [activeTab, setActiveTab] = useState('needs');

  useEffect(() => {
    if (currentUser?.role !== 'BENEFICIARY') {
      router.push('/login');
    }
  }, [currentUser, router]);

  if (currentUser?.role !== 'BENEFICIARY') {
    return null;
  }

  const myNeeds = needs.filter(n => n.beneficiaryId === currentUser.id);
  const myMatches = matches.filter(m => {
    const need = needs.find(n => n.id === m.needId);
    return need?.beneficiaryId === currentUser.id;
  });

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Beneficiary Portal</h1>
          <p className="text-muted-foreground mt-2">
            Post your needs and browse available food donations
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="needs" className="gap-2">
              <Package className="h-4 w-4" />
              My Needs ({myNeeds.length})
            </TabsTrigger>
            <TabsTrigger value="match-board" className="gap-2">
              <Users className="h-4 w-4" />
              Match Board
            </TabsTrigger>
          </TabsList>

          <TabsContent value="needs" className="mt-6">
            <NeedsTab needs={myNeeds} beneficiaryId={currentUser.id} />
          </TabsContent>

          <TabsContent value="match-board" className="mt-6">
            <MatchBoard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function NeedsTab({ needs, beneficiaryId }: { needs: any[]; beneficiaryId: string }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Posted Needs</h2>
          <p className="text-muted-foreground text-sm">
            Food items your organization requires
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {showForm ? 'Cancel' : 'Post New Need'}
        </Button>
      </div>

      {showForm && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Post a New Need</CardTitle>
            <CardDescription>
              Describe what food items your organization needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NeedForm beneficiaryId={beneficiaryId} onSuccess={() => setShowForm(false)} />
          </CardContent>
        </Card>
      )}

      {needs.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No needs posted yet"
          description="Post your first need to start receiving donation offers from generous donors"
          action={{
            label: 'Post First Need',
            onClick: () => setShowForm(true),
            icon: Plus,
          }}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {needs.map(need => (
            <NeedCard key={need.id} need={need} />
          ))}
        </div>
      )}
    </div>
  );
}

function NeedCard({ need }: { need: any }) {
  const getUrgencyBadge = () => {
    switch (need.urgency) {
      case 'High':
        return <Badge variant="destructive">High Priority</Badge>;
      case 'Medium':
        return <Badge variant="secondary">Medium Priority</Badge>;
      case 'Low':
        return <Badge variant="outline">Low Priority</Badge>;
      default:
        return <Badge variant="outline">{need.urgency}</Badge>;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg">{need.category}</CardTitle>
            <CardDescription className="mt-1">
              Min. {need.minQty} units needed
            </CardDescription>
          </div>
          {getUrgencyBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span>Minimum: {need.minQty} units</span>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <Thermometer className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-muted-foreground">Can accept:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {need.canAccept.map((storage: string) => (
                  <Badge key={storage} variant="outline" className="text-xs">
                    {storage === 'Chilled' && '❄️ '}
                    {storage === 'Frozen' && '🧊 '}
                    {storage}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{need.address}</span>
          </div>

          {need.deliveryPreferred && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
              ✓ Delivery Preferred
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
