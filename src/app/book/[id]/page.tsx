'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Book } from '@/lib/types';
import { ChatInterface } from '@/components/chat-interface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { SettingsProvider } from '@/context/settings-context';

export default function BookPage({ params }: { params: { id: string } }) {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const bookDocRef = doc(db, 'books', params.id);
        const bookDoc = await getDoc(bookDocRef);
        if (bookDoc.exists()) {
          setBook({ id: bookDoc.id, ...bookDoc.data() } as Book);
        } else {
          setBook(null);
        }
      } catch (error) {
        console.error("Error fetching book:", error);
        toast({
            variant: 'destructive',
            title: 'Failed to Load Book',
            description: 'There was a problem fetching the book details from the database.',
        });
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
        fetchBook();
    }
  }, [params.id, toast]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading book...</div>;
  }

  if (!book) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="font-headline text-2xl font-bold">Book Not Found</h1>
          <p className="text-muted-foreground">The book you are looking for does not exist or you do not have permission to view it.</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SettingsProvider>
      <div className="grid h-screen grid-cols-1 lg:grid-cols-2">
        <div className="flex flex-col p-6">
          <Card className="flex flex-1 flex-col">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">{book.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{book.author}</p>
            </CardHeader>
            <Separator />
            <ScrollArea className="flex-1">
              <CardContent className="p-6">
                <div className="prose prose-lg max-w-none font-body text-foreground">
                  <p>
                    This is a placeholder for the book reader interface. In a full implementation, the actual content of "{book.title}" would be displayed here, allowing you to scroll through and read the book. The text would be paginated or presented as a continuous scroll.
                  </p>
                  <p>
                    The companion chat on the right is where the magic happens. You can ask questions about the plot, characters, themes, or any other aspect of the book. The AI has been indexed on this specific book and will provide knowledgeable answers, helping you gain a deeper understanding of the text as you read.
                  </p>
                </div>
              </CardContent>
            </ScrollArea>
          </Card>
        </div>
        <div className="flex h-screen flex-col bg-muted/30">
          <ChatInterface bookId={book.id} bookTitle={book.title} />
        </div>
      </div>
    </SettingsProvider>
  );
}
