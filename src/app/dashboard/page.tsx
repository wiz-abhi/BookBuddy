'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MainChat } from '@/components/main-chat';
import { mockChats } from '@/lib/data';
import type { Chat, ChatMessage } from '@/lib/types';
import { PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mainChat } from '@/ai/flows/main-chat';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function DashboardPage() {
  const [chats, setChats] = useState<Chat[]>(mockChats);
  const [activeChatId, setActiveChatId] = useState<string | null>(chats[0]?.id || null);

  const activeChat = chats.find((chat) => chat.id === activeChatId);

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
  };

  const handleNewChat = () => {
    const newChat: Chat = {
      id: `chat${Date.now()}`,
      title: `New Chat`,
      messages: [{ role: 'assistant', content: "Hello! I'm your AI companion. I have knowledge of all the books in your library. How can I help you today?" }],
    };
    setChats([newChat, ...chats]);
    setActiveChatId(newChat.id);
  };

  const handleSendMessage = async (content: string) => {
    if (!activeChatId || !activeChat) return;

    const userMessage: ChatMessage = { role: 'user', content };

    const updatedMessages = [...activeChat.messages, userMessage];
    const updatedChat = { ...activeChat, messages: updatedMessages };

    setChats(chats.map((chat) => (chat.id === activeChatId ? updatedChat : chat)));

    try {
      const chatHistory = updatedMessages.map(msg => ({ role: msg.role, content: msg.content }));
      
      const result = await mainChat({
        query: content,
        chatHistory: chatHistory.slice(0, -1),
      });

      const assistantMessage: ChatMessage = { role: 'assistant', content: result.response };

      setChats(prevChats => {
        return prevChats.map(chat => {
          if (chat.id === activeChatId) {
            return { ...chat, messages: [...updatedMessages, assistantMessage] };
          }
          return chat;
        });
      });
    } catch (error) {
      const errorMessage: ChatMessage = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' };
       setChats(prevChats => {
        return prevChats.map(chat => {
          if (chat.id === activeChatId) {
            return { ...chat, messages: [...updatedMessages, errorMessage] };
          }
          return chat;
        });
      });
    }
  };

  return (
    <div className="flex h-full w-full">
      <div className="hidden md:flex flex-col w-80 border-r bg-muted/30">
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="text-lg font-headline">My Chats</h2>
          <Button variant="ghost" size="icon" onClick={handleNewChat} aria-label="New Chat">
            <PlusCircle className="h-5 w-5" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-1">
            {chats.map((chat) => (
              <Button
                key={chat.id}
                variant="ghost"
                onClick={() => handleSelectChat(chat.id)}
                className={cn(
                  'w-full justify-start truncate h-auto py-2',
                  activeChatId === chat.id && 'bg-accent text-accent-foreground'
                )}
              >
                {chat.title}
              </Button>
            ))}
          </nav>
        </ScrollArea>
      </div>
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <MainChat
            key={activeChat.id}
            messages={activeChat.messages}
            onSendMessage={handleSendMessage}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <p>Select a chat or start a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
