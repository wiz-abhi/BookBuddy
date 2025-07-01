'use server';

/**
 * @fileOverview An AI book companion that allows users to chat with an AI about any book in their library.
 *
 * - mainChat - A function that handles the chat with the AI book companion.
 * - MainChatInput - The input type for the mainChat function.
 * - MainChatOutput - The return type for the mainChat function.
 */

import {ai} from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {z} from 'genkit';

const MainChatInputSchema = z.object({
  model: z.string().optional().describe('The AI model to use for the response.'),
  query: z.string().describe('The user query about their books.'),
  library: z.array(z.object({
      title: z.string(),
      author: z.string(),
  })).optional().describe("A list of books in the user's library."),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().describe('The chat history between the user and the AI.'),
});
export type MainChatInput = z.infer<typeof MainChatInputSchema>;

const MainChatOutputSchema = z.object({
  mainResponse: z.string().describe("The main, detailed, and human-like response to the user's query. This should be written in a conversational and engaging tone."),
  followUpQuestions: z.array(z.string()).describe("A list of three interesting follow-up questions the user might want to ask based on the main response. This helps guide the conversation."),
  didYouKnow: z.string().optional().describe("An optional, interesting fact or a piece of trivia related to the user's query or the books in the library."),
  relevantBookTitle: z.string().optional().describe("The title of the book from the user's library that is most relevant to the current query. If the query is general and not about a specific book, leave this field empty."),
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
  prompt: `You are a friendly and deeply knowledgeable AI book companion named BookWise. Your personality is that of an enthusiastic librarian and a well-read friend, eager to share insights and spark curiosity. You have read every book in the user's library and can recall details with perfect clarity.

Your goal is to provide responses that are not just accurate but also engaging, detailed, and human-like. You should sound like you're having a real conversation. Use a warm and approachable tone.

**IMPORTANT:** If the user's query seems to be primarily about one specific book from their library, you MUST populate the 'relevantBookTitle' field with the exact title of that book. If the query is general or doesn't relate to a specific book, you should leave 'relevantBookTitle' empty.

Here is the context for your response:
1.  **User's Library:**
    {{#if library}}
    The user has the following books in their library. You should use this list to inform your answers about what books you know about.
    {{#each library}}
      - "{{this.title}}" by {{this.author}}
    {{/each}}
    {{else}}
    The user's library is currently empty.
    {{/if}}
2.  **Chat History:**
    {{#if chatHistory}}
    Here is the conversation so far:
    {{#each chatHistory}}
      {{this.role}}: {{this.content}}
    {{/each}}
    {{else}}
    This is the beginning of your conversation.
    {{/if}}

Based on this context, please respond to the user's latest query:
**User Query:** {{{query}}}

Please formulate a comprehensive response that includes a main answer, suggest some follow-up questions, and optionally provide a fun fact. Remember to set the 'relevantBookTitle' if applicable.
`,
});

const mainChatFlow = ai.defineFlow(
  {
    name: 'mainChatFlow',
    inputSchema: MainChatInputSchema,
    outputSchema: MainChatOutputSchema,
  },
  async (input) => {
    const modelId = input.model || 'gemini-1.5-flash-latest';
    const {output} = await prompt(input, { model: googleAI.model(modelId) });
    return output!;
  }
);
