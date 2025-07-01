'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type ConversationMode = 'chat' | 'voice';

type SettingsContextType = {
  model: string;
  setModel: (model: string) => void;
  availableModels: string[];
  conversationMode: ConversationMode;
  setConversationMode: (mode: ConversationMode) => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const availableModels = ['gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-2.0-flash'];
const MODEL_STORAGE_KEY = 'bookwise-ai-model';
const MODE_STORAGE_KEY = 'bookwise-conversation-mode';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [model, setModel] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedModel = localStorage.getItem(MODEL_STORAGE_KEY);
      return savedModel && availableModels.includes(savedModel) ? savedModel : availableModels[0];
    }
    return availableModels[0];
  });
  
  const [conversationMode, setConversationMode] = useState<ConversationMode>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem(MODE_STORAGE_KEY);
      return (savedMode === 'chat' || savedMode === 'voice') ? savedMode : 'chat';
    }
    return 'chat';
  });

  useEffect(() => {
    try {
      const savedModel = localStorage.getItem(MODEL_STORAGE_KEY);
      if (savedModel && availableModels.includes(savedModel)) {
        setModel(savedModel);
      }
      const savedMode = localStorage.getItem(MODE_STORAGE_KEY);
      if (savedMode === 'chat' || savedMode === 'voice') {
          setConversationMode(savedMode);
      }
    } catch (error) {
      console.warn('Could not read settings from localStorage', error)
    }
  }, []);

  useEffect(() => {
    try {
        localStorage.setItem(MODEL_STORAGE_KEY, model);
    } catch (error) {
        console.warn('Could not save model to localStorage', error);
    }
  }, [model]);

  useEffect(() => {
    try {
        localStorage.setItem(MODE_STORAGE_KEY, conversationMode);
    } catch (error) {
        console.warn('Could not save conversation mode to localStorage', error);
    }
  }, [conversationMode]);

  const value = { model, setModel, availableModels, conversationMode, setConversationMode };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
