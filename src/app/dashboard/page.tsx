import { BookCard } from '@/components/book-card';
import { BookUploadDialog } from '@/components/book-upload-dialog';
import { mockBooks } from '@/lib/data';

export default function DashboardPage() {
  return (
    <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
            <h1 className="font-headline text-3xl font-bold text-primary-foreground">
                My Library
            </h1>
            <BookUploadDialog />
        </div>
        <p className="text-muted-foreground mb-6">
            Browse your book collection or upload a new one to get started. Click on a book to start reading and chatting.
        </p>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {mockBooks.map((book) => (
                <BookCard key={book.id} book={book} />
            ))}
        </div>
    </div>
  );
}
