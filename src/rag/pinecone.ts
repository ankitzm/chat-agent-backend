import { Pinecone } from '@pinecone-database/pinecone';

export interface PineconeConfig {
  apiKey: string;
  indexName: string;
  namespace?: string;
}

export function initPineconeFromEnv(): PineconeConfig | undefined {
  const apiKey = process.env.PINECONE_API_KEY?.trim();
  const indexName = process.env.PINECONE_INDEX?.trim();
  const namespace = process.env.PINECONE_NAMESPACE?.trim() || undefined;
  if (!apiKey || !indexName) return undefined;
  return { apiKey, indexName, namespace };
}

export function createPineconeClient(cfg: PineconeConfig): Pinecone {
  return new Pinecone({ apiKey: cfg.apiKey });
}


