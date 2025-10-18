'use server';
/**
 * @fileOverview This file defines a Genkit flow for an AI-powered symptom checker.
 *
 * The flow takes a description of symptoms as input and returns a list of potential health issues
 * and suggestions for consultation with medical professionals.
 *
 * @fileOverview
 * - `checkSymptoms`: Asynchronous function to initiate the symptom check and return potential health issues.
 * - `SymptomCheckerInput`: Interface defining the input schema for the symptom checker.
 * - `SymptomCheckerOutput`: Interface defining the output schema for the symptom checker.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SymptomCheckerInputSchema = z.object({
  symptomsDescription: z
    .string()
    .describe('A detailed description of the patient\'s symptoms.'),
});
export type SymptomCheckerInput = z.infer<typeof SymptomCheckerInputSchema>;

const SymptomCheckerOutputSchema = z.object({
  potentialHealthIssues: z
    .string()
    .describe('A list of potential health issues based on the symptoms.'),
  suggestions: z
    .string()
    .describe(
      'Suggestions for the patient regarding consultation with medical professionals.'
    ),
});
export type SymptomCheckerOutput = z.infer<typeof SymptomCheckerOutputSchema>;

export async function checkSymptoms(
  input: SymptomCheckerInput
): Promise<SymptomCheckerOutput> {
  return symptomCheckerFlow(input);
}

const symptomCheckerPrompt = ai.definePrompt({
  name: 'symptomCheckerPrompt',
  input: {schema: SymptomCheckerInputSchema},
  output: {schema: SymptomCheckerOutputSchema},
  prompt: `You are an AI-powered symptom checker that helps patients identify potential health issues before their consultation.

  Based on the following description of symptoms, provide a list of potential health issues and suggestions for consultation with medical professionals.

  Symptoms Description: {{{symptomsDescription}}}
  \nOutput the potential health issues, and suggestions to consult a doctor, and what kind of specialist to consult in natural language.`,
});

const symptomCheckerFlow = ai.defineFlow(
  {
    name: 'symptomCheckerFlow',
    inputSchema: SymptomCheckerInputSchema,
    outputSchema: SymptomCheckerOutputSchema,
  },
  async input => {
    const {output} = await symptomCheckerPrompt(input);
    return output!;
  }
);
