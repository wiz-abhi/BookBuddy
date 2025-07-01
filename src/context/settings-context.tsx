'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type SettingsContextType = {
  model: string;
  setModel: (model: string) => void;
  availableModels: string[];
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const availableModels = ['gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-2.0-flash'];
const STORAGE_KEY = 'bookwise-ai-model';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [model, setModel] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedModel = localStorage.getItem(STORAGE_KEY);
      return savedModel && availableModels.includes(savedModel) ? savedModel : availableModels[0];
    }
    return availableModels[0];
  });

  useEffect(() => {
    try {
      const savedModel = localStorage.getItem(STORAGE_KEY);
      if (savedModel && availableModels.includes(savedModel)) {
        setModel(savedModel);
      }
    } catch (error) {
      console.warn('Could not read model from localStorage', error)
    }
  }, []);

  useEffect(() => {
    try {
        localStorage.setItem(STORAGE_KEY, model);
    } catch (error) {
        console.warn('Could not save model to localStorage', error);
    }
  }, [model]);

  const value = { model, setModel, availableModels };

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
