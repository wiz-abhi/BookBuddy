'use server';

/**
 * @fileOverview An AI book companion that allows users to chat with an AI about any book in their library.
 *
 * - mainChat - A function that handles the chat with the AI book companion.
 * - MainChatInput - The input type for the mainChat function.
 * - MainChatOutput - The return type for the mainChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MainChatInputSchema = z.object({
  query: z.string().describe('The user query about their books.'),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().describe('The chat history between the user and the AI.'),
});
export type MainChatInput = z.infer<typeof MainChatInputSchema>;

const MainChatOutputSchema = z.object({
  response: z.string().describe('The AI companion response to the user query.'),
});
export type MainChatOutput = z.infer<typeof MainChatOutputSchema>;

export async function mainChat(input: MainChatInput): Promise<MainChatOutput> {
  return mainChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'mainChatPrompt',
  input: {
    schema: MainChatInputSchema,
  },
  output: {
    schema: MainChatOutputSchema,
  },
  prompt: `You are a knowledgeable friend who has read a whole library of books.
      You are helping the user to understand the books better and have a conversation with them.
      Use RAG to answer questions about any of the books in the library.
      If the user asks which books you know about, you should say that you have access to their full library and can answer questions about any of them.

      {{#if chatHistory}}
      Here is the chat history between you and the user:
      {{#each chatHistory}}
        {{this.role}}: {{this.content}}
      {{/each}}
      {{/if}}

      Now respond to the following query from the user:
      {{{query}}}`,
});

const mainChatFlow = ai.defineFlow(
  {
    name: 'mainChatFlow',
    inputSchema: MainChatInputSchema,
    outputSchema: MainChatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
