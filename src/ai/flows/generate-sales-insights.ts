'use server';

/**
 * @fileOverview An AI agent for generating sales insights.
 * 
 * - generateSalesInsights - A function that generates sales insights based on transaction history.
 * - GenerateSalesInsightsInput - The input type for the generateSalesInsights function.
 * - GenerateSalesInsightsOutput - The return type for the generateSalesInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSalesInsightsInputSchema = z.object({
  transactionHistory: z.string().describe('The transaction history in JSON format.'),
});
export type GenerateSalesInsightsInput = z.infer<typeof GenerateSalesInsightsInputSchema>;

const GenerateSalesInsightsOutputSchema = z.object({
  summary: z.string().describe('A summary of the sales insights.'),
  trends: z.string().describe('Key trends observed in the sales data.'),
  recommendations: z.string().describe('Recommendations for optimizing the business based on the insights.'),
});
export type GenerateSalesInsightsOutput = z.infer<typeof GenerateSalesInsightsOutputSchema>;

export async function generateSalesInsights(input: GenerateSalesInsightsInput): Promise<GenerateSalesInsightsOutput> {
  return generateSalesInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSalesInsightsPrompt',
  input: {schema: GenerateSalesInsightsInputSchema},
  output: {schema: GenerateSalesInsightsOutputSchema},
  prompt: `You are an AI assistant that analyzes sales transaction history to generate key insights, identify trends, and provide actionable recommendations for business optimization.

  Analyze the following transaction history:
  {{{transactionHistory}}}

  Provide a concise summary of the sales insights, highlight key trends observed in the data, and suggest concrete recommendations for optimizing the business.
  Ensure that the output is well-formatted and easy to understand.`, 
});

const generateSalesInsightsFlow = ai.defineFlow(
  {
    name: 'generateSalesInsightsFlow',
    inputSchema: GenerateSalesInsightsInputSchema,
    outputSchema: GenerateSalesInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
