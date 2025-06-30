'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User } from 'lucide-react';
import type { ChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { TypingIndicator } from './typing-indicator';

interface MainChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
}

export function MainChat({ messages, onSendMessage }: MainChatProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isAssistantResponding = messages[messages.length - 1]?.role === 'user';

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const messageToSend = input;
    setInput('');
    setIsLoading(true);
    
    await onSendMessage(messageToSend);

    setIsLoading(false);
  };

  return (
    <div className="flex h-full flex-col items-center justify-center w-full">
        <Card className="w-full h-full flex-1 flex flex-col border-0 shadow-none rounded-none bg-transparent">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Bot className="text-accent-foreground" />
                    BookWise AI Companion
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full" ref={scrollAreaRef}>
                <div className="space-y-4 p-4 md:p-6">
                    {messages.map((message, index) => (
                    <div
                        key={index}
                        className={cn(
                        'flex items-start gap-3',
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                    >
                        {message.role === 'assistant' && (
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-accent text-accent-foreground"><Bot size={20} /></AvatarFallback>
                        </Avatar>
                        )}
                        <div
                        className={cn(
                            'max-w-xs rounded-lg px-4 py-2 md:max-w-md lg:max-w-2xl',
                            message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                        >
                        <p className="text-sm">{message.content}</p>
                        </div>
                        {message.role === 'user' && (
                        <Avatar className="h-8 w-8">
                            <AvatarFallback><User size={20} /></AvatarFallback>
                        </Avatar>
                        )}
                    </div>
                    ))}
                    {isAssistantResponding && (
                    <div className="flex items-start gap-3 justify-start">
                        <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-accent text-accent-foreground"><Bot size={20} /></AvatarFallback>
                        </Avatar>
                        <div className="max-w-xs rounded-lg px-4 py-2 md:max-w-md bg-muted">
                        <TypingIndicator />
                        </div>
                    </div>
                    )}
                </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="border-t p-4 bg-background">
                <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask something about your books..."
                    disabled={isLoading || isAssistantResponding}
                    autoComplete="off"
                />
                <Button type="submit" size="icon" disabled={isLoading || isAssistantResponding}>
                    <Send className="h-4 w-4" />
                </Button>
                </form>
            </CardFooter>
        </Card>
    </div>
  );
}
