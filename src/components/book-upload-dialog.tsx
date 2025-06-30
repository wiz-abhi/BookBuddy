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
import { auth, db, storage } from '@/lib/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';

const formSchema = z.object({
  title: z.string().min(1, { message: 'Title is required.' }),
  author: z.string().min(1, { message: 'Author is required.' }),
  bookDataUri: z.string().refine(
    (val) => val.startsWith('data:application/pdf;base64,'),
    {
      message: 'Please upload a PDF file.',
    }
  ),
  fileName: z.string().min(1),
  coverImageFile: z.instanceof(File).optional(),
});

export function BookUploadDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      author: '',
      bookDataUri: '',
      fileName: '',
      coverImageFile: undefined,
    },
  });

  const handleBookFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleCoverFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        form.setValue('coverImageFile', file);
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            setCoverPreview(loadEvent.target?.result as string);
        };
        reader.readAsDataURL(file);
    } else {
        setCoverPreview(null);
        form.setValue('coverImageFile', undefined);
    }
  }

  const resetForm = () => {
    form.reset();
    setCoverPreview(null);
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth.currentUser) {
        toast({ variant: 'destructive', title: 'Not Authenticated', description: 'You must be logged in to upload a book.' });
        return;
    }
    setIsLoading(true);
    try {
      const result = await indexBook({ bookDataUri: values.bookDataUri });
      if (result.success) {
        let coverImageURL = `https://placehold.co/300x450?text=${encodeURIComponent(values.title)}`;
        if (values.coverImageFile) {
            const imageFile = values.coverImageFile;
            const storageRef = ref(storage, `book-covers/${auth.currentUser.uid}/${Date.now()}_${imageFile.name}`);
            await uploadBytes(storageRef, imageFile);
            coverImageURL = await getDownloadURL(storageRef);
        }

        await addDoc(collection(db, 'books'), {
            userId: auth.currentUser.uid,
            title: values.title,
            author: values.author,
            fileName: values.fileName,
            coverImage: coverImageURL,
            aiHint: 'custom book',
        });

        toast({
          title: 'Upload Successful!',
          description: `"${values.title}" has been indexed and added to your library.`,
        });
        setOpen(false);
        resetForm();
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
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
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
            Select a PDF file and a cover image to add it to your library.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl><Input placeholder="The Great Gatsby" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
             <FormField control={form.control} name="author" render={({ field }) => (
                <FormItem>
                    <FormLabel>Author</FormLabel>
                    <FormControl><Input placeholder="F. Scott Fitzgerald" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField
              control={form.control}
              name="bookDataUri"
              render={() => (
                <FormItem>
                  <FormLabel>Book PDF</FormLabel>
                  <FormControl>
                    <div className="relative">
                       <Input id="pdf-upload" type="file" accept=".pdf" onChange={handleBookFileChange} className="pr-12" />
                       <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                         <Upload className="h-5 w-5 text-muted-foreground" />
                       </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="coverImageFile"
              render={() => (
                  <FormItem>
                    <FormLabel>Cover Image (Optional)</FormLabel>
                     <div className="flex items-center gap-4">
                        {coverPreview && <Image src={coverPreview} alt="Cover preview" width={60} height={90} className="rounded-md object-cover" />}
                        <FormControl>
                            <Input id="cover-upload" type="file" accept="image/*" onChange={handleCoverFileChange} />
                        </FormControl>
                    </div>
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
