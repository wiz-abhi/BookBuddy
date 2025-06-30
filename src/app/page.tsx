import { Button } from '@/components/ui/button';
import { BookHeart } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-6 rounded-full bg-primary/20 p-4 text-primary">
          <BookHeart className="h-16 w-16" />
        </div>
        <h1 className="font-headline text-5xl font-bold tracking-tight text-primary-foreground md:text-6xl">
          Welcome to BookWise Companion
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Upload your books, dive into an immersive reading experience, and chat with an AI that knows your book as well as a knowledgeable friend.
        </p>
        <div className="mt-8 flex gap-4">
          <Button asChild size="lg" className="font-headline">
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="font-headline">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
