import type { Book, Chat } from './types';

export const mockBooks: Book[] = [
  {
    id: '1',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    coverImage: 'https://placehold.co/300x450/d1c4e9/3c3645',
    aiHint: 'art deco',
  },
  {
    id: '2',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    coverImage: 'https://placehold.co/300x450/90caf9/203a4c',
    aiHint: 'courtroom drama',
  },
  {
    id: '3',
    title: '1984',
    author: 'George Orwell',
    coverImage: 'https://placehold.co/300x450/a5d6a7/2e4d2f',
    aiHint: 'dystopian future',
  },
  {
    id: '4',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    coverImage: 'https://placehold.co/300x450/f48fb1/65223c',
    aiHint: 'regency romance',
  },
   {
    id: '5',
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    coverImage: 'https://placehold.co/300x450/ffe082/614f1d',
    aiHint: 'fantasy adventure',
  },
  {
    id: '6',
    title: 'Moby Dick',
    author: 'Herman Melville',
    coverImage: 'https://placehold.co/300x450/bcaaa4/4e342e',
    aiHint: 'sea adventure',
  },
];

export const mockChats: Chat[] = [
  {
    id: 'chat1',
    title: 'Gatsby & The American Dream',
    messages: [
      { role: 'assistant', content: "Hello! Let's talk about your books. What's on your mind?" },
      { role: 'user', content: 'What are the main themes in The Great Gatsby?' },
      { role: 'assistant', content: 'The Great Gatsby masterfully explores themes like the corrosiveness of the American Dream, the illusion of wealth, the significance of memory and the past, and the rigid structures of social class.' },
    ],
  },
  {
    id: 'chat2',
    title: 'Symbolism in 1984',
    messages: [
      { role: 'assistant', content: "Hi there! I'm ready to discuss any book in your library." },
      { role: 'user', content: "What does the paperweight symbolize in 1984?" },
      { role: 'assistant', content: "The glass paperweight is a powerful symbol of Winston's attempt to connect with a past he can't remember and his desperate desire for a private life, free from the Party's suffocating surveillance. When it shatters, it tragically represents the destruction of his hopes for rebellion and freedom." },
    ],
  },
  {
    id: 'chat3',
    title: 'Reading Recommendations',
    messages: [
      { role: 'assistant', content: "Hello! Based on your library, I can give you some reading recommendations." },
      { role: 'user', content: "I liked Moby Dick. What should I read next?" },
      { role: 'assistant', content: "If you enjoyed the grand adventure and thematic depth of Moby Dick, you might love 'Heart of Darkness' by Joseph Conrad for its exploration of human nature during a journey, or 'The Old Man and the Sea' by Ernest Hemingway for another tale of man versus nature." },
    ],
  },
];
