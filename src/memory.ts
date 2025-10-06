import { ChatMessage } from './types';

export class ChatMemory {
  private sessionIdToInstructions: Map<string, string> = new Map();
  private sessionIdToHistory: Map<string, ChatMessage[]> = new Map();

  private ensure(sessionId: string): void {
    if (!this.sessionIdToHistory.has(sessionId)) {
      this.sessionIdToHistory.set(sessionId, []);
    }
  }

  appendUserMessage(sessionId: string, content: string): void {
    this.ensure(sessionId);
    this.sessionIdToHistory.get(sessionId)!.push({
      role: 'user',
      content,
      timestamp: Date.now(),
    });
  }

  appendAssistantMessage(sessionId: string, content: string): void {
    this.ensure(sessionId);
    this.sessionIdToHistory.get(sessionId)!.push({
      role: 'assistant',
      content,
      timestamp: Date.now(),
    });
  }

  setInstructions(sessionId: string, instructions: string): void {
    if (instructions.trim().length === 0) return;
    this.sessionIdToInstructions.set(sessionId, instructions.trim());
  }

  getInstructions(sessionId: string): string | undefined {
    return this.sessionIdToInstructions.get(sessionId);
  }

  getHistory(sessionId: string): ChatMessage[] {
    return this.sessionIdToHistory.get(sessionId) ?? [];
  }
}


