'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { indexBook } from '@/ai/flows/book-indexing';
import { Loader2, PlusCircle, Upload } from 'lucide-react';

const formSchema = z.object({
  bookDataUri: z.string().refine(
    (val) => val.startsWith('data:application/pdf;base64,'),
    {
      message: 'Please upload a PDF file.',
    }
  ),
  fileName: z.string().min(1),
});

export function BookUploadDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bookDataUri: '',
      fileName: '',
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const dataUri = loadEvent.target?.result as string;
        form.setValue('bookDataUri', dataUri);
        form.setValue('fileName', file.name);
        form.clearErrors('bookDataUri');
      };
      reader.readAsDataURL(file);
    } else {
      form.setError('bookDataUri', {
        type: 'manual',
        message: 'Please upload a PDF file.',
      });
      form.setValue('fileName', '');
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const result = await indexBook({ bookDataUri: values.bookDataUri });
      if (result.success) {
        toast({
          title: 'Upload Successful!',
          description: `"${values.fileName}" has been indexed and added to your library.`,
        });
        setOpen(false);
        form.reset();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-headline">
          <PlusCircle className="mr-2 h-4 w-4" />
          Upload Book
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Upload a New Book</DialogTitle>
          <DialogDescription>
            Select a PDF file from your computer to add it to your library.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="bookDataUri"
              render={() => (
                <FormItem>
                  <FormLabel>Book PDF</FormLabel>
                  <FormControl>
                    <div className="relative">
                       <Input id="pdf-upload" type="file" accept=".pdf" onChange={handleFileChange} className="pr-12" />
                       <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                         <Upload className="h-5 w-5 text-muted-foreground" />
                       </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading} className="font-headline">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Indexing...
                  </>
                ) : (
                  'Upload and Index'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
