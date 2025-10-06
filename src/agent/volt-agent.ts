import { PineconeRetriever, buildContextPrompt } from '../rag/retriever';
import { ChatMemory } from '../memory';
import { orChatComplete, orChatStream } from '../openrouter';

export interface VoltAgentConfig {
  model: string;
  instructions?: string;
}

export class VoltChatAgent {
  private model: string;
  private instructions?: string;
  private retriever?: PineconeRetriever;
  private memory: ChatMemory;

  constructor(cfg: VoltAgentConfig, memory: ChatMemory, retriever?: PineconeRetriever) {
    this.model = cfg.model;
    this.instructions = cfg.instructions;
    this.memory = memory;
    this.retriever = retriever;
  }

  async generate(sessionId: string, userMessage: string): Promise<string> {
    // Build context via retriever
    let contextSystem: string | undefined;
    if (this.retriever) {
      try {
        const docs = await this.retriever.retrieve(userMessage);
        contextSystem = buildContextPrompt(docs);
      } catch {}
    }

    const systemPrompt = this.instructions ?? this.memory.getInstructions(sessionId);
    const history = this.memory.getHistory(sessionId);

    const messages = [
      ...(contextSystem ? [{ role: 'system', content: contextSystem }] : []),
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage },
    ];

    return await orChatComplete(messages as any, this.model);
  }

  async *stream(sessionId: string, userMessage: string): AsyncGenerator<string> {
    let contextSystem: string | undefined;
    if (this.retriever) {
      try {
        const docs = await this.retriever.retrieve(userMessage);
        contextSystem = buildContextPrompt(docs);
      } catch {}
    }
    const systemPrompt = this.instructions ?? this.memory.getInstructions(sessionId);
    const history = this.memory.getHistory(sessionId);
    const messages = [
      ...(contextSystem ? [{ role: 'system', content: contextSystem }] : []),
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage },
    ];
    for await (const delta of orChatStream(messages as any, this.model)) {
      yield delta;
    }
  }
}


