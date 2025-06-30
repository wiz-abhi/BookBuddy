import { ChatInterface } from '@/components/chat-interface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { mockBooks } from '@/lib/data';
import { notFound } from 'next/navigation';

export default function BookPage({ params }: { params: { id: string } }) {
  const book = mockBooks.find((b) => b.id === params.id);

  if (!book) {
    notFound();
  }

  return (
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
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue. Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede.
                </p>
                <p>
                  Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh. Mauris ac mauris sed pede pellentesque fermentum. Maecenas adipiscing ante non diam. Duis mi eros, varius nec, pulvinar in, semper vel, enim. Vivamus vel sem at sapien pulvinar ornare.
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
  );
}
