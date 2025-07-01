'use server';

/**
 * @fileOverview Book indexing flow using AI and RAG.
 *
 * - indexBook - A function that handles the book indexing process.
 * - IndexBookInput - The input type for the indexBook function.
 * - IndexBookOutput - The return type for the indexBook function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IndexBookInputSchema = z.object({
  model: z.string().optional().describe('The AI model to use for the response.'),
  bookDataUri: z
    .string()
    .describe(
      "A book PDF, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type IndexBookInput = z.infer<typeof IndexBookInputSchema>;

const IndexBookOutputSchema = z.object({
  success: z.boolean().describe('Whether the book was successfully indexed.'),
  message: z.string().describe('A message indicating the status of the indexing process.'),
});
export type IndexBookOutput = z.infer<typeof IndexBookOutputSchema>;

export async function indexBook(input: IndexBookInput): Promise<IndexBookOutput> {
  return indexBookFlow(input);
}

const prompt = ai.definePrompt({
  name: 'indexBookPrompt',
  input: {schema: IndexBookInputSchema},
  output: {schema: IndexBookOutputSchema},
  prompt: `You are an AI assistant that processes and indexes uploaded books.

  Your task is to analyze the provided book data and index it for efficient retrieval and interaction.

  Book Data: {{media url=bookDataUri}}

  Return a JSON object indicating whether the indexing was successful and providing a message about the process.`, 
});

const indexBookFlow = ai.defineFlow(
  {
    name: 'indexBookFlow',
    inputSchema: IndexBookInputSchema,
    outputSchema: IndexBookOutputSchema,
  },
  async (input) => {
    try {
      const modelToUse = input.model ? `googleai/${input.model}` : undefined;
      const {output} = await prompt(input, { model: modelToUse });
      // Implement RAG indexing logic here, for now just returning prompt output
      // This might involve calling external services, chunking the book data, etc.
      return output!;
    } catch (error: any) {
      console.error('Error indexing book:', error);
      return {
        success: false,
        message: `Indexing failed: ${error.message ?? 'Unknown error'}`,
      };
    }
  }
);
