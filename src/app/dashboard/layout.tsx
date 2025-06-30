import { BookOpenCheck, Library, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { LibrarySheetContent } from '@/components/library-sheet-content';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <Link
          href="/dashboard"
          className="flex items-center gap-2"
        >
          <div className="rounded-lg bg-primary p-2 text-primary-foreground">
            <BookOpenCheck className="h-6 w-6" />
          </div>
          <h1 className="font-headline text-2xl font-semibold text-primary-foreground hidden sm:block">
            BookWise
          </h1>
        </Link>
        
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto">
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
          <div className="flex items-center gap-2">
            <Avatar>
                <AvatarImage src="https://placehold.co/40x40.png" alt="User" data-ai-hint="user avatar" />
                <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <Link href="/" passHref>
              <Button variant="ghost" size="icon" aria-label='Log out'>
                  <LogOut className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex flex-1 bg-muted/20">
        {children}
      </main>
    </div>
  );
}
