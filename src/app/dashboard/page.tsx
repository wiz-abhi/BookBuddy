'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MainChat } from '@/components/main-chat';
import type { Chat, ChatMessage } from '@/lib/types';
import { PlusCircle, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mainChat } from '@/ai/flows/main-chat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, onSnapshot, addDoc, serverTimestamp, orderBy, getDocs, doc, setDoc } from 'firebase/firestore';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setChats([]);
        setActiveChatId(null);
        setIsLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      const chatsRef = collection(db, 'users', user.uid, 'chats');
      const q = query(chatsRef, orderBy('createdAt', 'desc'));

      const unsubscribeFirestore = onSnapshot(q, async (querySnapshot) => {
        const fetchedChatsPromises = querySnapshot.docs.map(async (chatDoc) => {
          const chatData = chatDoc.data();
          const messagesRef = collection(db, 'users', user.uid, 'chats', chatDoc.id, 'messages');
          const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
          const messagesSnapshot = await getDocs(messagesQuery);
          const messages = messagesSnapshot.docs.map(doc => doc.data() as ChatMessage);
          
          return {
            id: chatDoc.id,
            ...chatData,
            messages,
          } as Chat;
        });

        const fetchedChats = await Promise.all(fetchedChatsPromises);
        
        setChats(fetchedChats);
        if (fetchedChats.length > 0 && !activeChatId) {
          setActiveChatId(fetchedChats[0].id);
        } else if (fetchedChats.length === 0) {
            handleNewChat();
        }
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching chats: ", error);
        setIsLoading(false);
      });

      return () => unsubscribeFirestore();
    }
  }, [user]);

  const activeChat = chats.find((chat) => chat.id === activeChatId);

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setIsMobileSheetOpen(false);
  };

  const handleNewChat = async () => {
    if (!user) return;
    const newChatData = {
      title: 'New Chat',
      userId: user.uid,
      createdAt: serverTimestamp(),
    };
    const chatsRef = collection(db, 'users', user.uid, 'chats');
    const newChatRef = await addDoc(chatsRef, newChatData);

    const initialMessage = {
      role: 'assistant',
      content: "Hello! I'm your AI companion. I have knowledge of all the books in your library. How can I help you today?",
      timestamp: serverTimestamp(),
    };
    const messagesRef = collection(db, 'users', user.uid, 'chats', newChatRef.id, 'messages');
    await addDoc(messagesRef, initialMessage);

    setActiveChatId(newChatRef.id);
    setIsMobileSheetOpen(false);
  };

  const handleSendMessage = async (content: string) => {
    if (!activeChatId || !activeChat || !user) return;

    const userMessage: ChatMessage = { role: 'user', content, timestamp: serverTimestamp() };
    const messagesRef = collection(db, 'users', user.uid, 'chats', activeChatId, 'messages');
    await addDoc(messagesRef, userMessage);

    const isNewChat = activeChat.messages.length <= 1;
    if (isNewChat) {
        const newTitle = content.length > 30 ? content.substring(0, 27) + '...' : content;
        const chatDocRef = doc(db, 'users', user.uid, 'chats', activeChatId);
        await setDoc(chatDocRef, { title: newTitle }, { merge: true });
    }
    
    try {
      const chatHistory = [...activeChat.messages, {role: 'user', content}].map(msg => ({ role: msg.role, content: msg.content }));
      
      const result = await mainChat({
        query: content,
        chatHistory: chatHistory.slice(0, -1),
      });

      const assistantMessage: ChatMessage = { role: 'assistant', content: result.response, timestamp: serverTimestamp() };
      await addDoc(messagesRef, assistantMessage);

    } catch (error) {
      const errorMessage: ChatMessage = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', timestamp: serverTimestamp() };
      await addDoc(messagesRef, errorMessage);
    }
  };

  const ChatList = () => (
    <>
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
    </>
  );

  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center">Loading chats...</div>;
  }

  return (
    <>
      {/* Desktop View */}
      <ResizablePanelGroup direction="horizontal" className="h-full w-full hidden md:flex">
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="flex flex-col bg-muted/30 border-r">
          <ChatList />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={75}>
          <div className="flex flex-1 flex-col h-full">
            {activeChat ? (
              <MainChat key={activeChat.id} messages={activeChat.messages} onSendMessage={handleSendMessage} />
            ) : (
              <div className="flex flex-1 items-center justify-center text-muted-foreground flex-col gap-4">
                <p>Select a chat or start a new one.</p>
                <Button onClick={handleNewChat}><PlusCircle className="mr-2 h-4 w-4" /> New Chat</Button>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      
      {/* Mobile View */}
      <div className="flex h-full w-full flex-col md:hidden">
        {activeChat ? (
          <MainChat
            key={activeChat.id}
            messages={activeChat.messages}
            onSendMessage={handleSendMessage}
            mobileHeader={
              <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Chats
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-80">
                  <ChatList />
                </SheetContent>
              </Sheet>
            }
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground flex-col gap-4 p-4 text-center">
            <p>No chats found. Start a conversation!</p>
            <Button onClick={handleNewChat}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
