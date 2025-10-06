// Shared types for the chat agent

export type Role = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: Role;
  content: string;
  timestamp: number;
}

// Request/response helper types
export interface PostChatBody {
  message: string;
  sessionId?: string;
  instructions?: string;
  model?: string;
}

export interface StreamQuery {
  query: string;
  sessionId?: string;
  instructions?: string;
  model?: string;
}


