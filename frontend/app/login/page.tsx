'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useStore } from '@/store/store';
import { Role } from '@/lib/types';
import { Package, Users, Truck, Settings, Heart, Shield } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

const DEMO_USERS = [
  { 
    role: 'DONOR' as Role, 
    email: 'donor@demo', 
    name: 'FreshGrocer Pte Ltd', 
    icon: Package,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Donate surplus food items'
  },
  { 
    role: 'BENEFICIARY' as Role, 
    email: 'bene@demo', 
    name: 'Hope Centre', 
    icon: Users,
    color: 'bg-green-50 text-green-700 border-green-200',
    description: 'Receive food donations'
  },
  { 
    role: 'VOLUNTEER' as Role, 
    email: 'driver@demo', 
    name: 'Aisha', 
    icon: Truck,
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Deliver food to beneficiaries'
  },
  { 
    role: 'OPS' as Role, 
    email: 'ops@demo', 
    name: 'Operations Manager', 
    icon: Settings,
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    description: 'Manage matches and routes'
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, currentUser } = useStore();
  const [role, setRole] = useState<Role>('DONOR');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [orgName, setOrgName] = useState('');

  useEffect(() => {
    // If already logged in, redirect to appropriate dashboard
    if (currentUser) {
      redirectToDashboard(currentUser.role);
    }
  }, [currentUser]);

  const redirectToDashboard = (userRole: Role) => {
    switch (userRole) {
      case 'DONOR':
        router.push('/donor/offers');
        break;
      case 'BENEFICIARY':
        router.push('/beneficiary/needs');
        break;
      case 'VOLUNTEER':
        router.push('/volunteer/routes');
        break;
      case 'OPS':
        router.push('/ops/matches');
        break;
    }
  };

  const handleQuickLogin = (demoUser: typeof DEMO_USERS[0]) => {
    login(demoUser.role, demoUser.name, demoUser.email, demoUser.name);
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email) {
      login(role, name, email, orgName || name);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
      <div className="w-full max-w-5xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <Heart className="h-12 w-12 text-primary-foreground" fill="currentColor" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
              Food Bank Singapore
            </h1>
            <p className="text-lg text-muted-foreground">
              Mock MVP Demo - Connecting Donors with Beneficiaries
            </p>
            <Badge variant="outline" className="mt-3">
              <Shield className="mr-1 h-3 w-3" />
              Local Demo • No Real Data
            </Badge>
            <Badge asChild variant="outline" className="mt-3">
              <Link href="/about">
                <Shield className="mr-1 h-3 w-3" />
                About us
              </Link>
            </Badge>
          </div>
        </div>

        {/* Quick Login Options */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Quick Demo Login</CardTitle>
            <CardDescription>Select a role to explore different portals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DEMO_USERS.map((user) => {
                const Icon = user.icon;
                return (
                  <button
                    key={user.email}
                    className={`${user.color} border-2 rounded-xl p-6 text-left transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                    onClick={() => handleQuickLogin(user)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-white/50 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-lg mb-1">{user.role}</div>
                        <div className="text-sm font-medium mb-2">{user.name}</div>
                        <div className="text-xs opacity-75">{user.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Custom Login */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Custom Login</CardTitle>
            <CardDescription>Create your own demo user profile</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCustomLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={role} onValueChange={(value) => setRole(value as Role)}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DONOR">Donor - Food Provider</SelectItem>
                    <SelectItem value="BENEFICIARY">Beneficiary - Food Receiver</SelectItem>
                    <SelectItem value="VOLUNTEER">Volunteer - Delivery Driver</SelectItem>
                    <SelectItem value="OPS">Operations - System Manager</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose your role to access specific features
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {(role === 'DONOR' || role === 'BENEFICIARY') && (
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    placeholder="Organization or company name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional for {role.toLowerCase()}s
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full h-11 text-base" size="lg">
                <Heart className="mr-2 h-5 w-5" />
                Enter Application
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Footer */}
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="pt-6 text-center text-sm text-muted-foreground space-y-2">
            <p className="flex items-center justify-center gap-2">
              <Shield className="h-4 w-4" />
              This is a mock application for demonstration purposes only
            </p>
            <p>All data is stored locally in your browser • No backend services • No real authentication</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
