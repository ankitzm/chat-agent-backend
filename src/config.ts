import { createOpenAI } from '@ai-sdk/openai';

export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? '';

export const openrouter = createOpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1',
  headers: {
    'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER ?? 'http://localhost',
    'X-Title': process.env.OPENROUTER_APP_TITLE ?? 'hono-chat-agent',
  },
} as any);

export const DEFAULT_MODEL = process.env.OPENROUTER_MODEL ?? 'meta-llama/llama-3.1-8b-instruct:free';

export function isOpenRouterConfigured(): boolean {
  return Boolean(OPENROUTER_API_KEY && OPENROUTER_API_KEY.trim().length > 0);
}


