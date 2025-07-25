'use client';

import { useState, useEffect } from 'react';
import { BookCard } from '@/components/book-card';
import { BookUploadDialog } from '@/components/book-upload-dialog';
import type { Book } from '@/lib/types';
import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { EditBookDialog } from './edit-book-dialog';

export function LibrarySheetContent() {
  const [user, setUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEditClick = (book: Book) => {
    setBookToEdit(book);
    setIsEditDialogOpen(true);
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const booksRef = collection(db, 'books');
      const q = query(booksRef, where('userId', '==', user.uid));
      const unsubscribeFirestore = onSnapshot(q, (querySnapshot) => {
        const userBooks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
        setBooks(userBooks);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching books:", error);
        toast({
            variant: 'destructive',
            title: 'Could Not Load Library',
            description: 'Failed to fetch your books. Please try again later.',
        });
        setLoading(false);
      });
      return () => unsubscribeFirestore();
    } else {
      setBooks([]);
      setLoading(false);
    }
  }, [user, toast]);

  return (
    <>
      <div className="flex h-full flex-col">
        <SheetHeader className="p-6 pb-4 border-b text-left">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-headline text-2xl font-bold text-foreground">
              My Library
            </SheetTitle>
            <BookUploadDialog />
          </div>
          <SheetDescription>
            Browse your book collection or upload a new one to get started.
          </SheetDescription>
        </SheetHeader>
        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <p>Loading your library...</p>
          ) : books.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {books.map((book) => (
                <BookCard key={book.id} book={book} onEdit={() => handleEditClick(book)} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">Your library is empty. Upload a book to get started!</p>
          )}
        </main>
      </div>
      <EditBookDialog book={bookToEdit} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
    </>
  );
}
