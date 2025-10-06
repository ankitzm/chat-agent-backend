import { createOpenAI } from '@ai-sdk/openai';

export const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY ?? '',
  baseURL: process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1',
});

export const DEFAULT_MODEL = process.env.OPENROUTER_MODEL ?? 'meta-llama/llama-3.1-8b-instruct:free';


