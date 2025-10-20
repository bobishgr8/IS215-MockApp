'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { TopNav } from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Package, Calendar, MapPin, Thermometer, Clock, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Category, Storage, Unit } from '@/lib/types';
import { daysToExpiry, getStorageColor } from '@/lib/matching';
import { format } from 'date-fns';
import { LocationPicker } from '@/components/LocationPicker';
import { EmptyState } from '@/components/EmptyState';
import { OfferSkeleton } from '@/components/LoadingSkeleton';

export default function DonorOffersPage() {
  const router = useRouter();
  const { currentUser, offers, createOffer } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (currentUser?.role !== 'DONOR') {
      router.push('/login');
    }
  }, [currentUser, router]);

  if (currentUser?.role !== 'DONOR') {
    return null;
  }

  const myOffers = offers.filter(o => o.donorId === currentUser.id);

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Offers</h1>
            <p className="text-muted-foreground mt-2">
              Manage your food donation listings
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Create Offer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">Create New Offer</DialogTitle>
                <DialogDescription>
                  List food items available for donation to help those in need
                </DialogDescription>
              </DialogHeader>
              <OfferForm 
                donorId={currentUser.id} 
                onSuccess={() => {
                  setIsDialogOpen(false);
                  toast.success('Offer created successfully!');
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {myOffers.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No offers yet"
            description="Create your first donation offer to help the community and reduce food waste"
            action={{
              label: 'Create First Offer',
              onClick: () => setIsDialogOpen(true),
              icon: Plus,
            }}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {myOffers.map(offer => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function OfferCard({ offer }: { offer: any }) {
  const daysLeft = daysToExpiry(offer.expiryDate);
  
  const getStatusBadge = () => {
    switch (offer.status) {
      case 'AVAILABLE':
        return <Badge variant="default" className="bg-green-600">Available</Badge>;
      case 'CLAIMED':
        return <Badge variant="secondary">Matched</Badge>;
      case 'EXPIRED':
        return <Badge variant="outline" className="text-muted-foreground">Expired</Badge>;
      default:
        return <Badge variant="outline">{offer.status}</Badge>;
    }
  };

  const getExpiryBadge = () => {
    if (daysLeft <= 2) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          FEFO: {daysLeft}d
        </Badge>
      );
    }
    if (daysLeft <= 5) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          {daysLeft} days left
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-1">{offer.title}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <CardDescription>{offer.category}</CardDescription>
              {offer.storage !== 'Ambient' && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                  ❄️ {offer.storage}
                </Badge>
              )}
            </div>
          </div>
          {getStatusBadge()}
        </div>
        {getExpiryBadge() && (
          <div className="pt-2">
            {getExpiryBadge()}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span>{offer.quantity} {offer.unit}</span>
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {format(new Date(offer.pickupStart), 'MMM d, HH:mm')} - {format(new Date(offer.pickupEnd), 'HH:mm')}
            </span>
          </div>

          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{offer.address}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            disabled={offer.status !== 'AVAILABLE'}
          >
            <Edit className="mr-2 h-3 w-3" />
            Edit
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            disabled={offer.status !== 'AVAILABLE'}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function OfferForm({ donorId, onSuccess }: { donorId: string; onSuccess: () => void }) {
  const { createOffer } = useStore();
  const [formData, setFormData] = useState({
    title: '',
    category: 'Produce' as Category,
    quantity: '',
    unit: 'kg' as Unit,
    storage: 'Ambient' as Storage,
    expiryDate: '',
    pickupStart: '',
    pickupEnd: '',
    address: '',
    lat: 1.3521,
    lng: 103.8198,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createOffer({
      donorId,
      title: formData.title,
      category: formData.category,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit,
      storage: formData.storage,
      expiryDate: new Date(formData.expiryDate).toISOString(),
      pickupStart: new Date(formData.pickupStart).toISOString(),
      pickupEnd: new Date(formData.pickupEnd).toISOString(),
      address: formData.address,
      lat: formData.lat,
      lng: formData.lng,
    });

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Basic Information</h3>
          <p className="text-sm text-muted-foreground">Describe the food item you're donating</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="title">Item Title *</Label>
          <Input
            id="title"
            placeholder="e.g., Fresh Bananas, Bread Loaves, Canned Soup"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <p className="text-xs text-muted-foreground">
            Be specific to help beneficiaries understand what you're offering
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value as Category })}
            >
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Produce">🥬 Produce</SelectItem>
                <SelectItem value="Bakery">🍞 Bakery</SelectItem>
                <SelectItem value="Canned">🥫 Canned</SelectItem>
                <SelectItem value="Dairy">🥛 Dairy</SelectItem>
                <SelectItem value="Meat">🥩 Meat</SelectItem>
                <SelectItem value="Frozen">🧊 Frozen</SelectItem>
                <SelectItem value="Other">📦 Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storage">Storage Type *</Label>
            <Select
              value={formData.storage}
              onValueChange={(value) => setFormData({ ...formData, storage: value as Storage })}
            >
              <SelectTrigger id="storage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ambient">🌡️ Ambient (Room Temp)</SelectItem>
                <SelectItem value="Chilled">❄️ Chilled (2-8°C)</SelectItem>
                <SelectItem value="Frozen">🧊 Frozen (-18°C)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Cold chain items require special handling
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Quantity */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Quantity</h3>
          <p className="text-sm text-muted-foreground">How much are you donating?</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Amount *</Label>
            <Input
              id="quantity"
              type="number"
              min="0.1"
              step="0.1"
              placeholder="50"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unit *</Label>
            <Select
              value={formData.unit}
              onValueChange={(value) => setFormData({ ...formData, unit: value as Unit })}
            >
              <SelectTrigger id="unit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">Kilograms (kg)</SelectItem>
                <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                <SelectItem value="crates">Crates</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Timing */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Timing</h3>
          <p className="text-sm text-muted-foreground">When does it expire and when can it be picked up?</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiryDate">Expiry Date *</Label>
          <Input
            id="expiryDate"
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={formData.expiryDate}
            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            required
          />
          <p className="text-xs text-muted-foreground">
            Items expiring sooner get priority (FEFO - First Expired, First Out)
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pickupStart">Pickup Window Start *</Label>
            <Input
              id="pickupStart"
              type="datetime-local"
              value={formData.pickupStart}
              onChange={(e) => setFormData({ ...formData, pickupStart: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pickupEnd">Pickup Window End *</Label>
            <Input
              id="pickupEnd"
              type="datetime-local"
              value={formData.pickupEnd}
              onChange={(e) => setFormData({ ...formData, pickupEnd: e.target.value })}
              required
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Provide a flexible pickup window to accommodate volunteer schedules
        </p>
      </div>

      <Separator />

      {/* Location */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Pickup Location</h3>
          <p className="text-sm text-muted-foreground">Where can volunteers collect this donation?</p>
        </div>

        <LocationPicker
          label="Address *"
          value={formData.address}
          onChange={(address, lat, lng) => {
            setFormData({
              ...formData,
              address,
              lat,
              lng,
            });
          }}
          placeholder="Search for your location in Singapore"
          required
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" size="lg" className="min-w-[140px]">
          <Plus className="mr-2 h-4 w-4" />
          Create Offer
        </Button>
      </div>
    </form>
  );
}
