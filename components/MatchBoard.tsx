'use client';

import { useState } from 'react';
import { useStore } from '@/store/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package, MapPin, Calendar, Thermometer, Info, CheckCircle } from 'lucide-react';
import { rankOffersForNeed, daysToExpiry, getStorageColor, formatScoreBreakdown } from '@/lib/matching';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function MatchBoard() {
  const { currentUser, needs, offers, createMatch } = useStore();
  const [selectedNeed, setSelectedNeed] = useState<string | null>(null);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [claimQuantity, setClaimQuantity] = useState('');

  const myNeeds = needs.filter(n => n.beneficiaryId === currentUser?.id);
  const selectedNeedObj = selectedNeed ? myNeeds.find(n => n.id === selectedNeed) : myNeeds[0];

  const rankedOffers = selectedNeedObj ? rankOffersForNeed(offers, selectedNeedObj) : [];

  const handleClaim = () => {
    if (!selectedOffer || !selectedNeedObj || !claimQuantity) return;

    const quantity = parseFloat(claimQuantity);
    if (quantity > selectedOffer.quantity) {
      toast.error('Claim quantity cannot exceed available quantity');
      return;
    }

    if (quantity < selectedNeedObj.minQty && quantity === selectedOffer.quantity) {
      // Allow claiming all even if less than minQty
    } else if (quantity < selectedNeedObj.minQty) {
      toast.error(`Quantity should be at least ${selectedNeedObj.minQty} or all available`);
      return;
    }

    createMatch({
      offerId: selectedOffer.id,
      needId: selectedNeedObj.id,
      quantity,
      status: 'PENDING_PICKUP',
    });

    toast.success(`Successfully claimed ${quantity} ${selectedOffer.unit} of ${selectedOffer.title}!`);
    setClaimDialogOpen(false);
    setSelectedOffer(null);
    setClaimQuantity('');
  };

  const openClaimDialog = (offer: any) => {
    setSelectedOffer(offer);
    setClaimQuantity(Math.min(offer.quantity, selectedNeedObj?.minQty || 0).toString());
    setClaimDialogOpen(true);
  };

  if (myNeeds.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No needs posted</h3>
          <p className="text-gray-600">
            Post a need first to see matching donation offers
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Available Matches</h2>
        <div className="flex gap-2 flex-wrap">
          {myNeeds.map(need => (
            <Button
              key={need.id}
              variant={selectedNeed === need.id || (!selectedNeed && need === selectedNeedObj) ? 'default' : 'outline'}
              onClick={() => setSelectedNeed(need.id)}
            >
              {need.category} ({need.minQty}+ units)
            </Button>
          ))}
        </div>
      </div>

      {selectedNeedObj && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">Searching for: {selectedNeedObj.category}</CardTitle>
            <CardDescription>
              Min {selectedNeedObj.minQty} units • {selectedNeedObj.urgency} urgency • 
              Accepts: {selectedNeedObj.canAccept.join(', ')}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {rankedOffers.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No matches found</h3>
            <p className="text-gray-600">
              No available offers match your current criteria. Check back later!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Found {rankedOffers.length} matching offer{rankedOffers.length !== 1 ? 's' : ''}, ranked by relevance
          </p>
          
          {rankedOffers.map(({ offer, explanation }, index) => (
            <Card key={offer.id} className={index === 0 ? 'border-green-300 border-2' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{offer.title}</CardTitle>
                      {index === 0 && (
                        <Badge className="bg-green-600">Best Match</Badge>
                      )}
                    </div>
                    <CardDescription>{offer.category}</CardDescription>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <pre className="text-xs whitespace-pre-wrap">
                          {formatScoreBreakdown(explanation)}
                        </pre>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex gap-2 mt-2">
                  {explanation.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Package className="h-4 w-4 mr-2 text-gray-500" />
                      <span><strong>{offer.quantity} {offer.unit}</strong> available</span>
                    </div>

                    <div className="flex items-center text-sm">
                      <Thermometer className="h-4 w-4 mr-2 text-gray-500" />
                      <Badge variant="outline" className={getStorageColor(offer.storage)}>
                        {offer.storage}
                      </Badge>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>
                        Expires in {daysToExpiry(offer.expiryDate)} days
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{offer.address}</span>
                    </div>

                    <div className="text-sm text-gray-600">
                      <strong>Pickup:</strong> {format(new Date(offer.pickupStart), 'MMM d, HH:mm')} - {format(new Date(offer.pickupEnd), 'HH:mm')}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button 
                    className="w-full" 
                    onClick={() => openClaimDialog(offer)}
                    disabled={offer.status !== 'AVAILABLE'}
                  >
                    {offer.status === 'AVAILABLE' ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Claim This Offer
                      </>
                    ) : (
                      'Not Available'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Claim Donation</DialogTitle>
            <DialogDescription>
              Specify how much you want to claim from this offer
            </DialogDescription>
          </DialogHeader>
          {selectedOffer && (
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="font-semibold">{selectedOffer.title}</p>
                <p className="text-sm text-gray-600">
                  Available: {selectedOffer.quantity} {selectedOffer.unit}
                </p>
                <p className="text-sm text-gray-600">
                  Your need: {selectedNeedObj?.minQty}+ units
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="claimQty">Quantity to Claim *</Label>
                <Input
                  id="claimQty"
                  type="number"
                  min="1"
                  max={selectedOffer.quantity}
                  step="0.1"
                  value={claimQuantity}
                  onChange={(e) => setClaimQuantity(e.target.value)}
                  placeholder="Enter quantity"
                />
                <p className="text-xs text-gray-500">
                  Max: {selectedOffer.quantity} {selectedOffer.unit}
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setClaimDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleClaim}>
                  Confirm Claim
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
