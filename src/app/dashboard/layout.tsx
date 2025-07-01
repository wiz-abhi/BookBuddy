'use client';

import { BookOpenCheck, Library, LogOut, User, Database, CheckCircle, XCircle, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { LibrarySheetContent } from '@/components/library-sheet-content';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import type { User as AppUser } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { SettingsProvider, useSettings } from '@/context/settings-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function ModelSelector() {
    const { model, setModel, availableModels } = useSettings();

    return (
        <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="w-auto h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="Select AI Model" />
                </SelectTrigger>
                <SelectContent>
                    {availableModels.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}


function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const unsubDoc = onSnapshot(userDocRef, (doc) => {
           if (doc.exists()) {
            setProfile(doc.data() as AppUser);
          }
        });
        setLoading(false);
        return () => unsubDoc();
      } else {
        setUser(null);
        setProfile(null);
        router.push('/login');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const handleConnectionCheck = async () => {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Not Authenticated',
            description: 'You must be logged in to check the database connection.',
        });
        return;
    }
    
    try {
        const userDocRef = doc(db, 'users', user.uid);
        await getDoc(userDocRef);
        toast({
            title: 'Success',
            description: 'Database connection is healthy.',
            action: <CheckCircle className="text-green-500" />,
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Connection Failed',
            description: `Could not connect to the database. ${error.message}`,
            action: <XCircle className="text-white" />,
        });
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <Link
          href="/dashboard"
          className="flex items-center gap-2"
        >
          <div className="rounded-lg bg-primary p-2 text-primary-foreground">
            <BookOpenCheck className="h-6 w-6" />
          </div>
          <h1 className="font-headline text-2xl font-semibold text-foreground hidden sm:block">
            BookWise
          </h1>
        </Link>
        
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex flex-shrink-0 items-center gap-2">
            <div className="hidden sm:flex">
              <ModelSelector />
            </div>
            <Button variant="outline" onClick={handleConnectionCheck} size="sm" className="hidden sm:flex">
              <Database className="mr-2 h-4 w-4" />
              Check DB
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button>
                  <Library className="mr-2 h-4 w-4" />
                  My Library
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full p-0 sm:max-w-md">
                <ScrollArea className="h-full">
                  <LibrarySheetContent />
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                    <AvatarImage src={profile?.photoURL || 'https://placehold.co/40x40.png'} alt={profile?.name || 'User'} data-ai-hint="user avatar" />
                    <AvatarFallback>{profile?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SettingsProvider>
  )
}
