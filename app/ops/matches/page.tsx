'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { TopNav } from '@/components/TopNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, Package, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function OpsMatchesPage() {
  const router = useRouter();
  const { currentUser, matches, offers, needs, users, approveMatch } = useStore();

  useEffect(() => {
    if (currentUser?.role !== 'OPS') {
      router.push('/login');
    }
  }, [currentUser, router]);

  if (currentUser?.role !== 'OPS') {
    return null;
  }

  const pendingMatches = matches.filter(m => m.status === 'PENDING_PICKUP' && !m.approvedByOps);
  const approvedMatches = matches.filter(m => m.approvedByOps);

  const handleApprove = (matchId: string) => {
    approveMatch(matchId, currentUser.id);
    toast.success('Match approved successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Operations Console</h1>
          <p className="text-gray-600 mt-1">Review and approve donation matches</p>
        </div>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              Pending Approval ({pendingMatches.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({approvedMatches.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {pendingMatches.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Clock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No pending matches</h3>
                  <p className="text-gray-600">
                    All matches have been reviewed
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Matches Awaiting Approval</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Created</TableHead>
                        <TableHead>Donor</TableHead>
                        <TableHead>Offer</TableHead>
                        <TableHead>Beneficiary</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingMatches.map(match => {
                        const offer = offers.find(o => o.id === match.offerId);
                        const need = needs.find(n => n.id === match.needId);
                        const donor = offer ? users.find(u => u.id === offer.donorId) : null;
                        const beneficiary = need ? users.find(u => u.id === need.beneficiaryId) : null;

                        return (
                          <TableRow key={match.id}>
                            <TableCell>{format(new Date(match.createdAt), 'MMM d, HH:mm')}</TableCell>
                            <TableCell>{donor?.name || 'Unknown'}</TableCell>
                            <TableCell>
                              {offer?.title}
                              <div className="text-xs text-gray-500">{offer?.category}</div>
                            </TableCell>
                            <TableCell>{beneficiary?.name || 'Unknown'}</TableCell>
                            <TableCell>
                              {match.quantity} {offer?.unit}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-yellow-50">
                                {match.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button 
                                size="sm"
                                onClick={() => handleApprove(match.id)}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            {approvedMatches.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No approved matches yet</h3>
                  <p className="text-gray-600">
                    Approved matches will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Approved Matches</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Created</TableHead>
                        <TableHead>Donor</TableHead>
                        <TableHead>Offer</TableHead>
                        <TableHead>Beneficiary</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Volunteer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvedMatches.map(match => {
                        const offer = offers.find(o => o.id === match.offerId);
                        const need = needs.find(n => n.id === match.needId);
                        const donor = offer ? users.find(u => u.id === offer.donorId) : null;
                        const beneficiary = need ? users.find(u => u.id === need.beneficiaryId) : null;
                        const volunteer = match.volunteerId ? users.find(u => u.id === match.volunteerId) : null;

                        return (
                          <TableRow key={match.id}>
                            <TableCell>{format(new Date(match.createdAt), 'MMM d, HH:mm')}</TableCell>
                            <TableCell>{donor?.name || 'Unknown'}</TableCell>
                            <TableCell>
                              {offer?.title}
                              <div className="text-xs text-gray-500">{offer?.category}</div>
                            </TableCell>
                            <TableCell>{beneficiary?.name || 'Unknown'}</TableCell>
                            <TableCell>
                              {match.quantity} {offer?.unit}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={match.status === 'COMPLETED' ? 'default' : 'secondary'}
                              >
                                {match.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {volunteer ? volunteer.name : '—'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex gap-4">
          <Button onClick={() => router.push('/ops/routes')}>
            Go to Route Planning
          </Button>
          <Button variant="outline" onClick={() => router.push('/ops/kpis')}>
            View KPIs Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
}
