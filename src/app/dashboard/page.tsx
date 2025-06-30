'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MainChat } from '@/components/main-chat';
import type { ChatMessage, Chat } from '@/lib/types';
import { PanelLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mainChat } from '@/ai/flows/main-chat';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import type { ImperativePanelGroupHandle } from 'react-resizable-panels';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, orderBy, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function DashboardPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const panelGroupRef = useRef<ImperativePanelGroupHandle>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setChats([]);
        setActiveChatId(null);
        setMessages([]);
        setIsLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    const q = query(collection(db, 'chats'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userChats: Chat[] = [];
      querySnapshot.forEach((doc) => {
        userChats.push({ id: doc.id, ...doc.data() } as Chat);
      });
      setChats(userChats);
      
      if (!activeChatId && userChats.length > 0) {
        setActiveChatId(userChats[0].id);
      } else if (userChats.length === 0) {
        setActiveChatId(null);
        setMessages([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, activeChatId]);


  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    };

    const messagesQuery = query(collection(db, 'chats', activeChatId, 'messages'), orderBy('timestamp'));
    const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
      const chatMessages: ChatMessage[] = [];
      querySnapshot.forEach(doc => {
        chatMessages.push(doc.data() as ChatMessage);
      });
      setMessages(chatMessages);
    });

    return () => unsubscribe();
  }, [activeChatId]);

  const handleNewChat = async () => {
    if (!user) return;
    const newChatRef = await addDoc(collection(db, 'chats'), {
        userId: user.uid,
        title: 'New Conversation',
        createdAt: serverTimestamp(),
    });
    setActiveChatId(newChatRef.id);
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
        const chatDocRef = doc(db, 'chats', chatId);
        const messagesCollectionRef = collection(chatDocRef, 'messages');
        const messagesSnapshot = await getDocs(messagesCollectionRef);
        
        const batch = writeBatch(db);
        messagesSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        await deleteDoc(chatDocRef);

        if (activeChatId === chatId) {
            setActiveChatId(null);
        }
    } catch (error) {
        console.error("Error deleting chat: ", error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!user || !activeChatId) return;

    const userMessage: ChatMessage = { role: 'user', content, timestamp: serverTimestamp() };
    const messagesRef = collection(db, 'chats', activeChatId, 'messages');
    
    // Optimistically update UI
    const tempMessages = [...messages, {role: 'user', content}];
    setIsSending(true);

    try {
      await addDoc(messagesRef, userMessage);

      const historyForAI = tempMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const result = await mainChat({
        query: content,
        chatHistory: historyForAI,
      });
      
      let formattedResponse = result.mainResponse;
      if (result.followUpQuestions && result.followUpQuestions.length > 0) {
          formattedResponse += "\n\n**Here are some things you could ask next:**";
          result.followUpQuestions.forEach(q => {
              formattedResponse += `\n- "${q}"`;
          });
      }
      if (result.didYouKnow) {
          formattedResponse += `\n\n**Did you know?**\n${result.didYouKnow}`;
      }
      
      const assistantMessage: ChatMessage = { role: 'assistant', content: formattedResponse, timestamp: serverTimestamp() };
      await addDoc(messagesRef, assistantMessage);

    } catch (error: any) {
      console.error("Error calling mainChat flow or saving messages:", error);
      const detailedError = `Sorry, I encountered an error. Error: ${error.message ?? 'Unknown error'}`;
      const errorMessage: ChatMessage = { role: 'assistant', content: detailedError, timestamp: serverTimestamp() };
      await addDoc(messagesRef, errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const togglePanel = () => {
    const group = panelGroupRef.current;
    if (group) {
        if (isPanelCollapsed) {
            group.setLayout([25, 75]);
        } else {
            group.setLayout([4, 96]);
        }
    }
  };

  const ChatList = () => (
    <div className={cn("flex flex-col h-full", isPanelCollapsed && 'items-center')}>
      <div className="p-4 flex justify-between items-center border-b">
        {!isPanelCollapsed && <h2 className="text-lg font-headline">My Chats</h2>}
        <Button variant="ghost" size="icon" onClick={togglePanel} aria-label="Toggle chat panel">
          <PanelLeft className="h-5 w-5" />
        </Button>
      </div>
      {!isPanelCollapsed && (
        <>
            <div className="p-2 border-b">
                <Button className="w-full" variant="outline" onClick={handleNewChat}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Chat
                </Button>
            </div>
            <ScrollArea className="flex-1">
                <nav className="p-2 space-y-1">
                    {chats.map(chat => (
                        <div
                            key={chat.id}
                            className={cn(
                            'group flex items-center justify-between w-full p-2 rounded-md text-sm h-auto cursor-pointer hover:bg-muted',
                            activeChatId === chat.id && 'bg-accent text-accent-foreground'
                            )}
                            onClick={() => setActiveChatId(chat.id)}
                        >
                            <span className="truncate flex-1 pr-2">{chat.title}</span>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete this conversation. This action cannot be undone.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteChat(chat.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        Delete
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))}
                </nav>
            </ScrollArea>
        </>
      )}
    </div>
  );

  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center gap-2"><Loader2 className="animate-spin" />Loading chats...</div>;
  }

  return (
      <ResizablePanelGroup 
        direction="horizontal" 
        className="h-full w-full"
        ref={panelGroupRef}
        onLayout={(sizes) => {
          if(sizes[0] < 5) {
            setIsPanelCollapsed(true);
          } else {
            setIsPanelCollapsed(false);
          }
        }}
      >
        <ResizablePanel 
          id="chat-list-panel"
          defaultSize={25} 
          minSize={isPanelCollapsed ? 0 : 15}
          maxSize={40}
          collapsible={true} 
          collapsedSize={4}
          className="flex flex-col bg-muted/30 border-r min-w-[55px] transition-all duration-300 ease-in-out"
        >
          <ChatList />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={75} minSize={30}>
          <div className="flex flex-1 flex-col h-full">
            {activeChatId ? (
                <MainChat messages={messages} onSendMessage={handleSendMessage} isSending={isSending} />
            ) : (
                <div className="flex flex-col h-full items-center justify-center text-center p-4">
                    <h2 className="text-xl font-headline">Welcome to BookWise</h2>
                    <p className="text-muted-foreground">Select a chat to continue a conversation or start a new one.</p>
                    <Button className="mt-4" onClick={handleNewChat}>
                       <Plus className="mr-2 h-4 w-4" /> Start New Chat
                    </Button>
                </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
  );
}
