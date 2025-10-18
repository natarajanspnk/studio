
'use server';

import {
  checkSymptoms,
  type SymptomCheckerInput,
  type SymptomCheckerOutput,
} from '@/ai/flows/ai-symptom-checker';

export async function getSymptomAnalysis(
  input: SymptomCheckerInput
): Promise<{ error: string | null; data: SymptomCheckerOutput | null }> {
  try {
    const result = await checkSymptoms(input);
    return { error: null, data: result };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return {
      error: `Failed to get symptom analysis: ${errorMessage}`,
      data: null,
    };
  }
}
