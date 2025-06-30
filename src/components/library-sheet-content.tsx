import { BookCard } from '@/components/book-card';
import { BookUploadDialog } from '@/components/book-upload-dialog';
import { mockBooks } from '@/lib/data';

export function LibrarySheetContent() {
  return (
    <div className="flex h-full flex-col">
      <header className="p-6 pb-4 border-b">
        <div className="flex items-center justify-between">
            <h2 className="font-headline text-2xl font-bold text-primary-foreground">
              My Library
            </h2>
            <BookUploadDialog />
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {mockBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
        </div>
      </main>
    </div>
  );
}
