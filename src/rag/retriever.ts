import { createPineconeClient, PineconeConfig } from './pinecone';
import { embedTexts } from './embeddings';

export interface RetrievedDoc {
  content: string;
  score: number;
}

export class PineconeRetriever {
  private cfg: PineconeConfig;
  private topK: number;

  constructor(cfg: PineconeConfig, topK: number = 4) {
    this.cfg = cfg;
    this.topK = topK;
  }

  async retrieve(query: string): Promise<RetrievedDoc[]> {
    const pinecone = createPineconeClient(this.cfg);
    const index = pinecone.index(this.cfg.indexName);
    const [vector] = await embedTexts([query]);
    const res = await index.namespace(this.cfg.namespace ?? '').query({
      vector,
      topK: this.topK,
      includeMetadata: true,
    });
    return (res.matches ?? []).map((m: any) => ({
      content: (m.metadata?.text as string) ?? '',
      score: m.score ?? 0,
    })).filter(d => d.content);
  }
}

export function buildContextPrompt(docs: RetrievedDoc[]): string | undefined {
  if (!docs.length) return undefined;
  const joined = docs.map((d, i) => `[[Doc ${i + 1} | score=${d.score.toFixed(3)}]]\n${d.content}`).join('\n\n');
  return `You are given the following context documents. Use them to answer the user succinctly. If unsure, say you don't know.\n\n${joined}`;
}


