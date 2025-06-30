'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MainChat } from '@/components/main-chat';
import type { ChatMessage } from '@/lib/types';
import { PanelLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mainChat } from '@/ai/flows/main-chat';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import type { ImperativePanelGroupHandle } from 'react-resizable-panels';

const LOCAL_STORAGE_KEY = 'bookwise-chat-messages';

export default function DashboardPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const panelGroupRef = useRef<ImperativePanelGroupHandle>(null);

  // Load messages from localStorage on initial client-side render
  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      } else {
        // If no history, start with a welcome message.
        setMessages([
          { role: 'assistant', content: "Hello! I'm your AI companion. I have knowledge of all the books in your library. How can I help you today?" }
        ]);
      }
    } catch (error) {
      console.error("Failed to parse messages from localStorage", error);
       // Start with a clean slate if parsing fails
       setMessages([
        { role: 'assistant', content: "Hello! I'm your AI companion. I have knowledge of all the books in your library. How can I help you today?" }
      ]);
    }
    setIsLoading(false);
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    // We don't want to save the initial empty array or while loading.
    if (!isLoading && messages.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (content: string) => {
    const userMessage: ChatMessage = { role: 'user', content };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsSending(true);

    try {
      // Build history from the most up-to-date state
      const historyForAI = updatedMessages
        .slice(0, -1) // Exclude the current user query from history
        .map(msg => ({ role: msg.role, content: msg.content }));
      
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

      const assistantMessage: ChatMessage = { role: 'assistant', content: formattedResponse };
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);

    } catch (error: any) {
      console.error("Error calling mainChat flow:", error);
      const detailedError = `Sorry, I encountered an error and could not get a response. Error: ${error.message ?? 'Unknown error'}`;
      const errorMessage: ChatMessage = { role: 'assistant', content: detailedError };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
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
        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-1">
              <div
                className={cn(
                  'group flex items-center justify-between w-full p-2 rounded-md text-sm h-auto',
                  'bg-accent text-accent-foreground'
                )}
              >
                <span className="truncate flex-1 pr-2">Main Conversation</span>
              </div>
          </nav>
        </ScrollArea>
      )}
    </div>
  );

  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center gap-2"><Loader2 className="animate-spin" />Loading chat...</div>;
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
            <MainChat messages={messages} onSendMessage={handleSendMessage} isSending={isSending} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
  );
}
