'use client';

import { useState } from 'react';
import { useStore } from '@/store/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Category, Storage, Urgency } from '@/lib/types';

export function NeedForm({ beneficiaryId, onSuccess }: { beneficiaryId: string; onSuccess: () => void }) {
  const { createNeed, users } = useStore();
  const beneficiary = users.find(u => u.id === beneficiaryId);

  const [formData, setFormData] = useState({
    category: 'Produce' as Category,
    minQty: '',
    urgency: 'Medium' as Urgency,
    canAccept: ['Ambient'] as Storage[],
    deliveryPreferred: true,
    address: beneficiary?.orgName ? `${beneficiary.orgName}, Singapore` : '',
    lat: 1.3521,
    lng: 103.8198,
  });

  const handleStorageToggle = (storage: Storage) => {
    setFormData(prev => ({
      ...prev,
      canAccept: prev.canAccept.includes(storage)
        ? prev.canAccept.filter(s => s !== storage)
        : [...prev.canAccept, storage]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.canAccept.length === 0) {
      toast.error('Please select at least one storage type');
      return;
    }

    createNeed({
      beneficiaryId,
      category: formData.category,
      minQty: parseFloat(formData.minQty),
      urgency: formData.urgency,
      canAccept: formData.canAccept,
      deliveryPreferred: formData.deliveryPreferred,
      address: formData.address,
      lat: formData.lat,
      lng: formData.lng,
    });

    toast.success('Need posted successfully!');
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
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
              <SelectItem value="Produce">Produce</SelectItem>
              <SelectItem value="Bakery">Bakery</SelectItem>
              <SelectItem value="Canned">Canned</SelectItem>
              <SelectItem value="Dairy">Dairy</SelectItem>
              <SelectItem value="Meat">Meat</SelectItem>
              <SelectItem value="Frozen">Frozen</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="urgency">Urgency *</Label>
          <Select
            value={formData.urgency}
            onValueChange={(value) => setFormData({ ...formData, urgency: value as Urgency })}
          >
            <SelectTrigger id="urgency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="minQty">Minimum Quantity Needed *</Label>
        <Input
          id="minQty"
          type="number"
          min="1"
          placeholder="20"
          value={formData.minQty}
          onChange={(e) => setFormData({ ...formData, minQty: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Storage Types Accepted *</Label>
        <div className="flex gap-4">
          {(['Ambient', 'Chilled', 'Frozen'] as Storage[]).map(storage => (
            <div key={storage} className="flex items-center space-x-2">
              <Checkbox
                id={storage}
                checked={formData.canAccept.includes(storage)}
                onCheckedChange={() => handleStorageToggle(storage)}
              />
              <Label htmlFor={storage} className="cursor-pointer">
                {storage}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="deliveryPreferred"
          checked={formData.deliveryPreferred}
          onCheckedChange={(checked) => 
            setFormData({ ...formData, deliveryPreferred: checked as boolean })
          }
        />
        <Label htmlFor="deliveryPreferred" className="cursor-pointer">
          Delivery preferred (vs. self-pickup)
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Delivery Address *</Label>
        <Input
          id="address"
          placeholder="100 Victoria Street, Singapore"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lat">Latitude</Label>
          <Input
            id="lat"
            type="number"
            step="0.0001"
            value={formData.lat}
            onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lng">Longitude</Label>
          <Input
            id="lng"
            type="number"
            step="0.0001"
            value={formData.lng}
            onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit">Post Need</Button>
      </div>
    </form>
  );
}
