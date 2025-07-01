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
  model: z.string().optional().describe('The AI model to use for the response.'),
  bookId: z.string().describe('The ID of the book to chat about.'),
  query: z.string().describe('The user query about the book.'),
  chatHistory: z.array(z.object({ // Accept chat history
    role: z.enum(['user', 'assistant']), // Role can be 'user' or 'assistant'
    content: z.string(), // Content of the message
  })).optional().describe('The chat history between the user and the AI.'),
});
export type AiBookCompanionInput = z.infer<typeof AiBookCompanionInputSchema>;

const AiBookCompanionOutputSchema = z.object({
  mainResponse: z.string().describe("The main, detailed, and human-like response to the user's query about the specific book."),
  followUpQuestions: z.array(z.string()).describe("A list of three interesting follow-up questions the user might want to ask based on the main response."),
  pageReference: z.string().optional().describe("A page number or chapter reference from the book that is relevant to the answer, if applicable."),
  quote: z.string().optional().describe("A direct, exact quote from the book that supports the main response or answers the user's query."),
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
  prompt: `You are a friendly and deeply knowledgeable AI book companion for the book with ID {{{bookId}}}. Your personality is that of an enthusiastic guide who has read this specific book multiple times and knows it inside out.

Your goal is to provide responses that are not just accurate but also engaging, detailed, and human-like, as if you're discussing the book with a friend. Use a warm and approachable tone.

**Crucially, if the user's question can be supported by a direct quote from the book, you MUST provide one in the 'quote' field. This makes your answers more credible and immersive. Also provide a 'pageReference' if you can find one for the quote.**

Here is the context for your response:
1.  **RAG Context:** Use your knowledge of the book with ID {{{bookId}}} to answer the user's questions. You can reference specific details, characters, plot points, and themes.
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

Please formulate a comprehensive response that includes a main answer, suggests some follow-up questions, and provides a relevant quote with a page or chapter reference where applicable.
`,
});

const aiBookCompanionFlow = ai.defineFlow(
  {
    name: 'aiBookCompanionFlow',
    inputSchema: AiBookCompanionInputSchema,
    outputSchema: AiBookCompanionOutputSchema,
  },
  async (input) => {
    const modelToUse = input.model ? `googleai/${input.model}` : 'googleai/gemini-1.5-flash-latest';
    const {output} = await prompt(input, { model: modelToUse });
    return output!;
  }
);
