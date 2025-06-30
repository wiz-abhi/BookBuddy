import { BookOpenCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookCard } from '@/components/book-card';
import { mockBooks } from '@/lib/data';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="rounded-lg bg-primary p-2 text-primary-foreground">
            <BookOpenCheck className="h-6 w-6" />
          </div>
          <h1 className="hidden font-headline text-2xl font-semibold text-foreground sm:block">
            BookWise
          </h1>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="secondary">
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </header>
      <main className="flex-1">
        <section className="container mx-auto px-4 py-12 text-center md:py-20">
          <h2 className="font-headline text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Your Personal AI Reading Companion
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-muted-foreground md:text-xl">
            Upload your books and chat with an AI that has read them all. Gain deeper insights, ask questions, and explore your library like never before.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button asChild size="lg" className="font-headline">
              <Link href="/signup">Get Started for Free</Link>
            </Button>
          </div>
        </section>

        <section className="bg-muted/20 py-12 md:py-20">
            <div className="container mx-auto px-4">
                <h3 className="mb-8 text-center font-headline text-3xl font-bold text-foreground">
                  Explore a World of Knowledge
                </h3>
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {mockBooks.map((book) => (
                    <BookCard key={book.id} book={book} />
                ))}
                </div>
                <p className="mt-8 text-center text-sm text-muted-foreground">
                ...and any other book you choose to upload!
                </p>
            </div>
        </section>
      </main>
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2024 BookWise Companion. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
