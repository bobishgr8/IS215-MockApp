'use client';

import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Package, Users, Truck, Settings, LogOut, User, Info, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function TopNav() {
  const router = useRouter();
  const { currentUser, logout } = useStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getRoleIcon = () => {
    switch (currentUser?.role) {
      case 'DONOR':
        return <Package className="h-4 w-4" />;
      case 'BENEFICIARY':
        return <Users className="h-4 w-4" />;
      case 'VOLUNTEER':
        return <Truck className="h-4 w-4" />;
      case 'OPS':
        return <Settings className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = () => {
    switch (currentUser?.role) {
      case 'DONOR':
        return 'default' as const;
      case 'BENEFICIARY':
        return 'secondary' as const;
      case 'VOLUNTEER':
        return 'outline' as const;
      case 'OPS':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-7xl">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
            <Heart className="h-6 w-6" fill="currentColor" />
          </div>
          <div className="text-left">
            <h1 className="text-lg font-bold tracking-tight">Food Bank Singapore</h1>
            {currentUser?.role && (
              <Badge variant={getRoleBadgeVariant()} className="text-xs">
                {getRoleIcon()}
                <span className="ml-1">
                  {currentUser.role.charAt(0) + currentUser.role.slice(1).toLowerCase()}
                </span>
              </Badge>
            )}
          </div>
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/about')}
            className="hidden sm:flex"
          >
            <Info className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">About</span>
          </Button>

          {currentUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                    {getRoleIcon()}
                  </div>
                  <span className="hidden sm:inline">{currentUser.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                    <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                    {currentUser.orgName && (
                      <p className="text-xs text-muted-foreground">{currentUser.orgName}</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/about')} className="sm:hidden">
                  <Info className="mr-2 h-4 w-4" />
                  About
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
