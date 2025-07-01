'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, Mic } from 'lucide-react';
import type { ChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { TypingIndicator } from './typing-indicator';
import { useSettings } from '@/context/settings-context';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';

interface MainChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isSending: boolean;
  mobileHeader?: React.ReactNode;
}

export function MainChat({ messages, onSendMessage, isSending, mobileHeader }: MainChatProps) {
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { conversationMode } = useSettings();
  const { isListening, transcript, startListening, stopListening, setTranscript } = useSpeechRecognition();
  const isAssistantResponding = isSending;

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  useEffect(() => {
    if (transcript && !isListening) {
      onSendMessage(transcript);
      setTranscript('');
    }
  }, [transcript, isListening, onSendMessage, setTranscript]);

  const handleTextInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const messageToSend = input;
    setInput('');
    await onSendMessage(messageToSend);
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center w-full">
        <Card className="w-full h-full flex-1 flex flex-col border-0 shadow-none rounded-none bg-transparent">
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="font-headline flex items-center gap-2">
                    <Bot className="text-accent-foreground" />
                    BookWise AI Companion
                </CardTitle>
                {mobileHeader}
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
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            {message.role === 'assistant' && message.audioSrc && (
                                <audio src={message.audioSrc} autoPlay controls className="mt-2 w-full max-w-xs md:max-w-md lg:max-w-2xl" />
                            )}
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
                            {conversationMode === 'voice' ? 'Thinking...' : <TypingIndicator />}
                        </div>
                    </div>
                    )}
                </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="border-t p-4 bg-background">
                {conversationMode === 'chat' ? (
                    <form onSubmit={handleTextInputSubmit} className="flex w-full items-center gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask something about your books..."
                            disabled={isSending}
                            autoComplete="off"
                        />
                        <Button type="submit" size="icon" disabled={isSending}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                ) : (
                    <div className="flex w-full items-center justify-center gap-4">
                        <Button
                            size="icon"
                            variant={isListening ? 'destructive' : 'outline'}
                            className="h-14 w-14 rounded-full"
                            onClick={handleVoiceToggle}
                            disabled={isSending}
                        >
                            <Mic className="h-6 w-6" />
                            <span className="sr-only">{isListening ? 'Stop listening' : 'Start listening'}</span>
                        </Button>
                    </div>
                )}
            </CardFooter>
        </Card>
    </div>
  );
}
