export interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  aiHint: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
}
