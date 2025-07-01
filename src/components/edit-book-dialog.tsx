'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import { auth, db, storage } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import type { Book } from '@/lib/types';

interface EditBookDialogProps {
  book: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditBookDialog({ book, open, onOpenChange }: EditBookDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [newCoverFile, setNewCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    if (book) {
      setCoverPreview(book.coverImage);
    }
  }, [book]);

  const handleCoverFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setNewCoverFile(file);
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setCoverPreview(loadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setNewCoverFile(null);
      setCoverPreview(book?.coverImage || null);
    }
  };

  const resetForm = () => {
    setNewCoverFile(null);
    setCoverPreview(null);
  };

  const handleSave = async () => {
    if (!book || !newCoverFile || !auth.currentUser) {
      toast({ variant: 'destructive', title: 'Error', description: 'No book or file selected, or you are not logged in.' });
      return;
    }
    setIsLoading(true);
    try {
      const storageRef = ref(storage, `book-covers/${auth.currentUser.uid}/${Date.now()}_${newCoverFile.name}`);
      await uploadBytes(storageRef, newCoverFile);
      const coverImageURL = await getDownloadURL(storageRef);

      const bookDocRef = doc(db, 'books', book.id);
      await updateDoc(bookDocRef, {
        coverImage: coverImageURL,
      });

      toast({
        title: 'Update Successful!',
        description: `Cover for "${book.title}" has been updated.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { onOpenChange(isOpen); if (!isOpen) resetForm(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">Edit Book Cover</DialogTitle>
          <DialogDescription>
            Upload a new cover for "{book?.title}".
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
                <Image
                    src={coverPreview || 'https://placehold.co/60x90.png'}
                    alt="Cover preview"
                    width={60}
                    height={90}
                    className="rounded-md object-cover"
                />
                <div className="relative flex-1">
                    <Input id="cover-upload" type="file" accept="image/*" onChange={handleCoverFileChange} className="pr-12" />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                </div>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading || !newCoverFile}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
