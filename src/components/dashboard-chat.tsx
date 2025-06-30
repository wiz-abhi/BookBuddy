'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function DashboardChat() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-4">
        <Card className="w-full max-w-4xl flex-1 flex flex-col">
            <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full">
                <div className="space-y-4 p-4 md:p-6">
                    <div className="flex items-start gap-3 justify-start">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-accent text-accent-foreground"><Bot size={20} /></AvatarFallback>
                        </Avatar>
                        <div
                            className='max-w-md rounded-lg px-4 py-2 bg-background'
                            >
                            <p className="text-sm">Welcome to BookWise! I'm your AI companion. Open your library from the top-right to select a book, and we can start chatting about it.</p>
                        </div>
                    </div>
                </div>
                </ScrollArea>
            </CardContent>
        </Card>
    </div>
  );
}
