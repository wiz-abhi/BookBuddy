'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MainChat } from '@/components/main-chat';
import type { ChatMessage, Chat, Book } from '@/lib/types';
import { PanelLeft, Loader2, Plus, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mainChat } from '@/ai/flows/main-chat';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import type { ImperativePanelGroupHandle } from 'react-resizable-panels';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, orderBy, getDocs, writeBatch, deleteDoc, updateDoc } from 'firebase/firestore';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/context/settings-context';

export default function DashboardPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const panelGroupRef = useRef<ImperativePanelGroupHandle>(null);
  const { toast } = useToast();
  const { model, conversationMode } = useSettings();
  
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [chatToRename, setChatToRename] = useState<Chat | null>(null);
  const [newChatTitle, setNewChatTitle] = useState("");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setChats([]);
        setBooks([]);
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
    const chatsQuery = query(collection(db, 'chats'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));

    const unsubscribeChats = onSnapshot(chatsQuery, (querySnapshot) => {
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
    }, (error) => {
        console.error("Error fetching chats: ", error);
        toast({
            variant: 'destructive',
            title: 'Error Loading Chats',
            description: 'Could not load your conversations. Please try again later.',
        });
        setIsLoading(false);
    });

    const booksQuery = query(collection(db, 'books'), where('userId', '==', user.uid));
    const unsubscribeBooks = onSnapshot(booksQuery, (snapshot) => {
        const userBooks: Book[] = [];
        snapshot.forEach((doc) => {
            userBooks.push({ id: doc.id, ...doc.data() } as Book);
        });
        setBooks(userBooks);
    }, (error) => {
        console.error("Error fetching books:", error);
        toast({
            variant: 'destructive',
            title: 'Error Loading Library',
            description: 'Could not load your books from the database.',
        });
    });

    return () => {
      unsubscribeChats();
      unsubscribeBooks();
    };
  }, [user, toast]);


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
    }, (error) => {
        console.error("Error fetching messages: ", error);
        toast({
            variant: 'destructive',
            title: 'Error Loading Messages',
            description: 'Could not load messages for this chat.',
        });
    });

    return () => unsubscribe();
  }, [activeChatId, toast]);

  const handleNewChat = async () => {
    if (!user) return;
    try {
        const newChatRef = await addDoc(collection(db, 'chats'), {
            userId: user.uid,
            title: 'New Conversation',
            createdAt: serverTimestamp(),
        });
        setActiveChatId(newChatRef.id);
    } catch (error) {
        console.error("Error creating new chat: ", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not create a new chat. Please try again.',
        });
    }
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
        toast({
            variant: 'destructive',
            title: 'Error Deleting Chat',
            description: 'The chat could not be deleted. Please try again.',
        });
    }
  };
  
  const openRenameDialog = (chat: Chat) => {
    setChatToRename(chat);
    setNewChatTitle(chat.title);
    setIsRenameDialogOpen(true);
  };

  const handleRenameSubmit = async () => {
    if (!chatToRename || !newChatTitle.trim()) return;

    try {
      const chatDocRef = doc(db, 'chats', chatToRename.id);
      await updateDoc(chatDocRef, { title: newChatTitle.trim() });
      toast({
        title: 'Success',
        description: 'Conversation renamed.',
      });
    } catch (error: any) {
      console.error("Error renaming chat:", error);
      let description = 'Could not rename the conversation.';
      if (error.code === 'permission-denied') {
        description = 'Permission denied. Please check your Firestore security rules to allow updates on chats.'
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: description,
      });
    } finally {
      setIsRenameDialogOpen(false);
      setChatToRename(null);
      setNewChatTitle('');
    }
  };


  const handleSendMessage = async (content: string) => {
    if (!user || !activeChatId) return;

    const userMessage: ChatMessage = { role: 'user', content, timestamp: serverTimestamp() };
    const messagesRef = collection(db, 'chats', activeChatId, 'messages');
    
    // Use a temporary state for the AI history to avoid race conditions with Firestore
    const tempMessages = [...messages, {role: 'user', content}];
    setIsSending(true);

    try {
      await addDoc(messagesRef, userMessage);

      const historyForAI = tempMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

      const libraryForAI = books.map(({ title, author }) => ({ title, author }));

      const result = await mainChat({
        query: content,
        chatHistory: historyForAI,
        library: libraryForAI,
        model,
      });

      const activeChat = chats.find(c => c.id === activeChatId);
      if (activeChat && (activeChat.title === 'New Conversation' || activeChat.title.length > 30)) {
        try {
            const chatDocRef = doc(db, 'chats', activeChatId);
            let newTitle = '';

            if (result.relevantBookTitle) {
                newTitle = result.relevantBookTitle;
            } else if (content.toLowerCase().trim() !== 'hi') {
                newTitle = content.length > 40 ? content.substring(0, 37) + '...' : content;
            }
            
            if (newTitle) {
                await updateDoc(chatDocRef, { title: newTitle });
            }
        } catch (error: any) {
            console.error("Error updating chat title:", error);
            let description = 'Could not automatically rename chat.';
             if (error.code === 'permission-denied') {
                description = 'Permission denied. Could not automatically rename the chat.'
            }
            toast({
                variant: 'destructive',
                title: 'Auto-Rename Failed',
                description: description,
            });
        }
      }
      
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
      
      const assistantMessage: ChatMessage = { 
        role: 'assistant', 
        content: formattedResponse, 
        timestamp: serverTimestamp(),
        audioSrc: null,
      };

      if (conversationMode === 'voice') {
        try {
          const { audioSrc } = await textToSpeech(result.mainResponse);
          assistantMessage.audioSrc = audioSrc;
        } catch (ttsError) {
          console.error("Error generating speech:", ttsError);
          assistantMessage.content += "\n\n(Sorry, I couldn't generate the audio for this response.)";
        }
      }

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
                            <div className="flex items-center opacity-0 group-hover:opacity-100">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6" 
                                    onClick={(e) => { e.stopPropagation(); openRenameDialog(chat); }}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
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
      <>
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
        
        {chatToRename && (
          <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>Rename Conversation</DialogTitle>
                      <DialogDescription>
                          Enter a new name for this conversation.
                      </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-2">
                      <Label htmlFor="chat-title">
                          New Title
                      </Label>
                      <Input 
                          id="chat-title"
                          value={newChatTitle}
                          onChange={(e) => setNewChatTitle(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSubmit(); }}
                      />
                  </div>
                  <DialogFooter>
                      <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleRenameSubmit}>Save</Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
        )}
      </>
  );
}
