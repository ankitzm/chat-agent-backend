import OpenAI from 'openai';
import { OPENROUTER_API_KEY } from './config';

const BASE_URL = process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1';
const REFERER = process.env.OPENROUTER_HTTP_REFERER ?? 'http://localhost';
const APP_TITLE = process.env.OPENROUTER_APP_TITLE ?? 'hono-chat-agent';

export interface ORMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const openai = new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: BASE_URL,
  defaultHeaders: {
    'HTTP-Referer': REFERER,
    'X-Title': APP_TITLE,
  },
});

export async function orChatComplete(messages: ORMessage[], model: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model,
    messages: messages as any,
  });
  return completion.choices?.[0]?.message?.content ?? '';
}

export async function* orChatStream(messages: ORMessage[], model: string): AsyncGenerator<string> {
  const stream = await openai.chat.completions.create({
    model,
    messages: messages as any,
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content;
    if (delta) yield delta;
  }
}


