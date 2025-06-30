import { BookCard } from '@/components/book-card';
import { BookUploadDialog } from '@/components/book-upload-dialog';
import { mockBooks } from '@/lib/data';

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold text-primary-foreground">
          My Library
        </h1>
        <BookUploadDialog />
      </header>
      <main className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {mockBooks.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </main>
    </div>
  );
}
