import { BookOpenCheck, Library } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { LibrarySheetContent } from '@/components/library-sheet-content';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MainChat } from '@/components/main-chat';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <Link
          href="/"
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
          <div className="ml-auto flex items-center gap-2">
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
            <Button asChild variant="secondary">
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex flex-1 bg-muted/20">
        <MainChat />
      </main>
    </div>
  );
}
