'use server';

/**
 * @fileOverview An AI book companion that allows users to chat with an AI about a book.
 *
 * - aiBookCompanion - A function that handles the chat with the AI book companion.
 * - AiBookCompanionInput - The input type for the aiBookCompanion function.
 * - AiBookCompanionOutput - The return type for the aiBookCompanion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiBookCompanionInputSchema = z.object({
  bookId: z.string().describe('The ID of the book to chat about.'),
  query: z.string().describe('The user query about the book.'),
  chatHistory: z.array(z.object({ // Accept chat history
    role: z.enum(['user', 'assistant']), // Role can be 'user' or 'assistant'
    content: z.string(), // Content of the message
  })).optional().describe('The chat history between the user and the AI.'),
});
export type AiBookCompanionInput = z.infer<typeof AiBookCompanionInputSchema>;

const AiBookCompanionOutputSchema = z.object({
  response: z.string().describe('The AI companion response to the user query.'),
});
export type AiBookCompanionOutput = z.infer<typeof AiBookCompanionOutputSchema>;

export async function aiBookCompanion(input: AiBookCompanionInput): Promise<AiBookCompanionOutput> {
  return aiBookCompanionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiBookCompanionPrompt',
  input: {
    schema: AiBookCompanionInputSchema,
  },
  output: {
    schema: AiBookCompanionOutputSchema,
  },
  prompt: `You are a knowledgeable friend who has read the book with ID {{{bookId}}}.
      You are helping the user to understand the book better and have a conversation with them.
      Use RAG to answer questions about the book.

      {{#if chatHistory}}
      Here is the chat history between you and the user:
      {{#each chatHistory}}
        {{this.role}}: {{this.content}}
      {{/each}}
      {{/if}}

      Now respond to the following query from the user:
      {{{query}}}`,
});

const aiBookCompanionFlow = ai.defineFlow(
  {
    name: 'aiBookCompanionFlow',
    inputSchema: AiBookCompanionInputSchema,
    outputSchema: AiBookCompanionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
