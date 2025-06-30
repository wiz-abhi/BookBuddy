import type { Book } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  return (
    <Link href={`/book/${book.id}`} className="block h-full">
      <Card className="flex h-full flex-col overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
        <div className="relative aspect-[2/3] w-full">
          <Image
            src={book.coverImage}
            alt={`Cover of ${book.title}`}
            fill
            className="object-cover"
            data-ai-hint={book.aiHint}
          />
        </div>
        <CardHeader className="flex-1 p-4">
          <CardTitle className="font-headline text-lg leading-tight">
            {book.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-sm text-muted-foreground">{book.author}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
