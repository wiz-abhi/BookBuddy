import { BookCard } from '@/components/book-card';
import { BookUploadDialog } from '@/components/book-upload-dialog';
import { mockBooks } from '@/lib/data';
import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export function LibrarySheetContent() {
  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="p-6 pb-4 border-b text-left">
        <div className="flex items-center justify-between">
          <SheetTitle className="font-headline text-2xl font-bold text-primary-foreground">
            My Library
          </SheetTitle>
          <BookUploadDialog />
        </div>
        <SheetDescription>
          Browse your book collection or upload a new one to get started.
        </SheetDescription>
      </SheetHeader>
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
