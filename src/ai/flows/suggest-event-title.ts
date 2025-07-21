// This is an AI-powered agent to suggest an event title.
'use server';

/**
 * @fileOverview An AI agent that suggests an event title based on the event date and/or content description.
 *
 * - suggestEventTitle - A function that handles the event title suggestion process.
 * - SuggestEventTitleInput - The input type for the suggestEventTitle function.
 * - SuggestEventTitleOutput - The return type for the suggestEventTitle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestEventTitleInputSchema = z.object({
  eventDate: z.string().optional().describe('The date of the event.'),
  contentDescription: z.string().optional().describe('The description of the event content.'),
});
export type SuggestEventTitleInput = z.infer<typeof SuggestEventTitleInputSchema>;

const SuggestEventTitleOutputSchema = z.object({
  suggestedTitle: z.string().describe('The suggested title for the event.'),
});
export type SuggestEventTitleOutput = z.infer<typeof SuggestEventTitleOutputSchema>;

export async function suggestEventTitle(input: SuggestEventTitleInput): Promise<SuggestEventTitleOutput> {
  return suggestEventTitleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestEventTitlePrompt',
  input: {schema: SuggestEventTitleInputSchema},
  output: {schema: SuggestEventTitleOutputSchema},
  prompt: `You are an event title suggestion expert.

  Based on the provided event date and content description, suggest a concise and meaningful title for the event.

  Event Date: {{{eventDate}}}
  Content Description: {{{contentDescription}}}

  Suggested Title:`,
});

const suggestEventTitleFlow = ai.defineFlow(
  {
    name: 'suggestEventTitleFlow',
    inputSchema: SuggestEventTitleInputSchema,
    outputSchema: SuggestEventTitleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
