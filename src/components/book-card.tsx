import type { Book } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

interface BookCardProps {
  book: Book;
  onEdit: () => void;
}

export function BookCard({ book, onEdit }: BookCardProps) {
  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <Link href={`/book/${book.id}`} className="block">
        <div className="relative aspect-[2/3] w-full">
          <Image
            src={book.coverImage}
            alt={`Cover of ${book.title}`}
            fill
            className="object-cover"
            data-ai-hint={book.aiHint}
          />
        </div>
        <CardHeader className="p-4">
          <CardTitle className="font-headline text-lg leading-tight">
            {book.title}
          </CardTitle>
        </CardHeader>
      </Link>
      <CardContent className="px-4 pb-2 pt-0 flex-grow">
        <p className="text-sm text-muted-foreground">{book.author}</p>
      </CardContent>
      <CardFooter className="p-2 mt-auto border-t">
        <Button variant="ghost" size="sm" className="w-full" onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Cover
        </Button>
      </CardFooter>
    </Card>
  );
}
