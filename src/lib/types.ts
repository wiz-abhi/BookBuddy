export interface User {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  aiHint: string;
  userId?: string; // Add userId to associate with a user
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: any; // Add timestamp for ordering
  audioSrc?: string | null;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  userId?: string; // Add userId to associate with a user
  createdAt?: any;
}
