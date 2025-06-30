'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MainChat } from '@/components/main-chat';
import type { Chat, ChatMessage } from '@/lib/types';
import { PlusCircle, MessageSquare, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mainChat } from '@/ai/flows/main-chat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, onSnapshot, addDoc, serverTimestamp, orderBy, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const { toast } = useToast();

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

  // Effect to fetch the list of chats (without messages)
  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    const chatsRef = collection(db, 'users', user.uid, 'chats');
    const q = query(chatsRef, orderBy('createdAt', 'desc'));

    const unsubscribeFirestore = onSnapshot(q, async (querySnapshot) => {
      if (querySnapshot.empty && user) {
        await handleNewChat(user.uid);
        setIsLoading(false);
        return;
      }

      const fetchedChats = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        messages: [], // Messages are loaded by the next effect
      })) as Chat[];
      
      setChats(fetchedChats);

      if (!activeChatId && fetchedChats.length > 0) {
        setActiveChatId(fetchedChats[0].id);
      }
      
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching chats: ", error);
      setIsLoading(false);
    });

    return () => unsubscribeFirestore();
  }, [user]);

  // Effect to fetch messages for the active chat
  useEffect(() => {
    if (!user || !activeChatId) return;

    const messagesRef = collection(db, 'users', user.uid, 'chats', activeChatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribeMessages = onSnapshot(q, (messagesSnapshot) => {
      const messages = messagesSnapshot.docs.map(doc => doc.data() as ChatMessage);
      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === activeChatId ? { ...chat, messages } : chat
        )
      );
    });

    return () => unsubscribeMessages();
  }, [user, activeChatId]);


  const activeChat = chats.find((chat) => chat.id === activeChatId);

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setIsMobileSheetOpen(false);
  };

  const handleNewChat = async (uid?: string) => {
    const userId = uid || user?.uid;
    if (!userId) return;
    const newChatData = {
      title: 'New Chat',
      userId: userId,
      createdAt: serverTimestamp(),
    };
    const chatsRef = collection(db, 'users', userId, 'chats');
    const newChatRef = await addDoc(chatsRef, newChatData);

    const initialMessage = {
      role: 'assistant',
      content: "Hello! I'm your AI companion. I have knowledge of all the books in your library. How can I help you today?",
      timestamp: serverTimestamp(),
    };
    const messagesRef = collection(db, 'users', userId, 'chats', newChatRef.id, 'messages');
    await addDoc(messagesRef, initialMessage);

    setActiveChatId(newChatRef.id);
    setIsMobileSheetOpen(false);
    return newChatRef.id;
  };

  const handleSendMessage = async (content: string) => {
    if (!activeChatId || !user) return;

    const messagesRef = collection(db, 'users', user.uid, 'chats', activeChatId, 'messages');
    const userMessage: ChatMessage = { role: 'user', content, timestamp: serverTimestamp() };
    await addDoc(messagesRef, userMessage);

    // Fetch the full, updated message history to ensure the AI has the latest context
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
    const messagesSnapshot = await getDocs(messagesQuery);
    const allMessages = messagesSnapshot.docs.map(doc => doc.data() as ChatMessage);

    // If it's the first user message in a "New Chat", update the chat title
    if (allMessages.length <= 2 && activeChat?.title === 'New Chat') {
        const newTitle = content.length > 30 ? content.substring(0, 27) + '...' : content;
        const chatDocRef = doc(db, 'users', user.uid, 'chats', activeChatId);
        await setDoc(chatDocRef, { title: newTitle }, { merge: true });
    }
    
    try {
      const chatHistory = allMessages.map(msg => ({ role: msg.role as 'user' | 'assistant', content: msg.content }));
      
      // The last message is the current user query, so we exclude it from the history
      const result = await mainChat({
        query: content,
        chatHistory: chatHistory.slice(0, -1),
      });

      const assistantMessage: ChatMessage = { role: 'assistant', content: result.response, timestamp: serverTimestamp() };
      await addDoc(messagesRef, assistantMessage);

    } catch (error) {
      console.error("Error calling mainChat flow:", error);
      const errorMessage: ChatMessage = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', timestamp: serverTimestamp() };
      await addDoc(messagesRef, errorMessage);
    }
  };

  const handleDeleteChat = async () => {
    if (!chatToDelete || !user) return;

    try {
      // Delete all messages in the chat's subcollection first
      const messagesRef = collection(db, 'users', user.uid, 'chats', chatToDelete, 'messages');
      const messagesSnapshot = await getDocs(messagesRef);
      const deletePromises = messagesSnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Delete the chat document itself
      const chatDocRef = doc(db, 'users', user.uid, 'chats', chatToDelete);
      await deleteDoc(chatDocRef);
      
      toast({
        title: "Chat Deleted",
        description: "The conversation has been removed."
      });

      if (activeChatId === chatToDelete) {
        // Find the index of the deleted chat
        const deletedIndex = chats.findIndex(c => c.id === chatToDelete);
        // Reset active chat to the next one in the list, or the previous, or null if no chats left
        const remainingChats = chats.filter(c => c.id !== chatToDelete);
        if (remainingChats.length > 0) {
            const newActiveIndex = Math.max(0, deletedIndex -1);
            setActiveChatId(remainingChats[newActiveIndex].id);
        } else {
            setActiveChatId(null);
            handleNewChat(); // Create a new chat if none are left
        }
      }
    } catch (error) {
      console.error("Error deleting chat: ", error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "There was a problem deleting the chat."
      })
    } finally {
      setIsDeleteDialogOpen(false);
      setChatToDelete(null);
    }
  };

  const openDeleteDialog = (chatId: string) => {
    setChatToDelete(chatId);
    setIsDeleteDialogOpen(true);
  };

  const ChatList = () => (
    <>
      <div className="p-4 flex justify-between items-center border-b">
        <h2 className="text-lg font-headline">My Chats</h2>
        <Button variant="ghost" size="icon" onClick={() => handleNewChat()} aria-label="New Chat">
          <PlusCircle className="h-5 w-5" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-1">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleSelectChat(chat.id)}
              className={cn(
                'group flex items-center justify-between w-full p-2 rounded-md cursor-pointer text-sm h-auto',
                'hover:bg-accent',
                activeChatId === chat.id ? 'bg-accent text-accent-foreground' : 'text-foreground'
              )}
            >
              <span className="truncate flex-1 pr-2">{chat.title}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={(e) => {
                    e.stopPropagation();
                    openDeleteDialog(chat.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </>
  );

  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center gap-2"><Loader2 className="animate-spin" />Loading chats...</div>;
  }

  return (
    <>
      {/* Desktop View */}
      <ResizablePanelGroup direction="horizontal" className="h-full w-full hidden md:flex">
        <ResizablePanel defaultSize={25} minSize={15} collapsible={true} collapsedSize={4} className="flex flex-col bg-muted/30 border-r min-w-[220px]">
          <ChatList />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={75} minSize={40}>
          <div className="flex flex-1 flex-col h-full">
            {activeChat ? (
              <MainChat key={activeChat.id} messages={activeChat.messages} onSendMessage={handleSendMessage} />
            ) : (
              <div className="flex flex-1 items-center justify-center text-muted-foreground flex-col gap-4">
                <p>Select a chat or start a new one.</p>
                <Button onClick={() => handleNewChat()}><PlusCircle className="mr-2 h-4 w-4" /> New Chat</Button>
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
            <Button onClick={() => handleNewChat()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChat}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
