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
import { mainChat } from '@/ai/flows/main-chat';
import { TypingIndicator } from './typing-indicator';

export function MainChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hello! I'm your AI companion. I have knowledge of all the books in your library. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const chatHistory = messages.map(msg => ({ role: msg.role, content: msg.content }));
      
      const result = await mainChat({
        query: input,
        chatHistory,
      });

      const assistantMessage: ChatMessage = { role: 'assistant', content: result.response };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center p-4 w-full">
        <Card className="w-full max-w-4xl flex-1 flex flex-col">
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
                    {isLoading && (
                    <div className="flex items-start gap-3 justify-start">
                        <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-accent text-accent-foreground"><Bot size={20} /></AvatarFallback>
                        </Avatar>
                        <div className="max-w-xs rounded-lg px-4 py-2 md:max-w-md bg-card">
                        <TypingIndicator />
                        </div>
                    </div>
                    )}
                </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="border-t p-4">
                <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask something about your books..."
                    disabled={isLoading}
                    autoComplete="off"
                />
                <Button type="submit" size="icon" disabled={isLoading}>
                    <Send className="h-4 w-4" />
                </Button>
                </form>
            </CardFooter>
        </Card>
    </div>
  );
}
