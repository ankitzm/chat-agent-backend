import OpenAI from 'openai';
import { OPENROUTER_API_KEY } from '../config';

const BASE_URL = process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1';
const REFERER = process.env.OPENROUTER_HTTP_REFERER ?? 'http://localhost';
const APP_TITLE = process.env.OPENROUTER_APP_TITLE ?? 'hono-chat-agent';

const EMBEDDINGS_MODEL = process.env.EMBEDDINGS_MODEL ?? 'openai/text-embedding-3-small';

const openai = new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: BASE_URL,
  defaultHeaders: {
    'HTTP-Referer': REFERER,
    'X-Title': APP_TITLE,
  },
});

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const res = await openai.embeddings.create({
    model: EMBEDDINGS_MODEL,
    input: texts,
  } as any);
  return res.data.map((d: any) => d.embedding as number[]);
}


