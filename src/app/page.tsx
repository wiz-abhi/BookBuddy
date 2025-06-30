import { BookOpenCheck, BrainCircuit, MessagesSquare, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
        <section className="container mx-auto px-4 py-12 text-center md:py-20 lg:py-28">
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
            <div className="mx-auto max-w-5xl">
              <h3 className="mb-12 text-center font-headline text-3xl font-bold text-foreground">
                Features to Enhance Your Reading
              </h3>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <div className="flex flex-col items-center text-center">
                  <UploadCloud className="h-12 w-12 mb-4 text-primary" />
                  <h4 className="font-headline text-xl font-semibold">Upload Your Library</h4>
                  <p className="mt-2 text-muted-foreground">
                    Easily upload your books in PDF format and build your personal digital library.
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <MessagesSquare className="h-12 w-12 mb-4 text-primary" />
                  <h4 className="font-headline text-xl font-semibold">Intelligent Chat</h4>
                  <p className="mt-2 text-muted-foreground">
                    Converse with an AI that has read your books. Ask questions, explore themes, and get summaries.
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <BrainCircuit className="h-12 w-12 mb-4 text-primary" />
                  <h4 className="font-headline text-xl font-semibold">Powered by RAG</h4>
                  <p className="mt-2 text-muted-foreground">
                    Our AI uses Retrieval-Augmented Generation to provide contextually-aware answers from your content.
                  </p>
                </div>
              </div>
            </div>
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
