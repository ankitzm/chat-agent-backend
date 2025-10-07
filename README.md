# Fastify Volt-like Chat Agent

A clean, modular chat API built with Fastify, Volt-like agent orchestration, and OpenRouter for LLM inference.

## Features

- 🚀 **Fastify**: Fast, low-overhead web framework
- 🤖 **Volt-style Agent**: Simple agent wrapper with memory and optional RAG
- 🔄 **Per-session Memory**: In-memory chat history (optional Pinecone RAG)
- 🎯 **OpenRouter**: Access many LLM models via a single API
- 📝 **TypeScript + Zod**: Fully typed with validation
- 🧩 **Modular**: Clear separation of concerns
- 🌊 **Streaming**: Real-time SSE responses

## Project Structure

```
src/
├── agent/
│   └── volt-agent.ts         # Agent wrapper (system + history + RAG)
├── rag/
│   ├── embeddings.ts         # Embedding via OpenRouter
│   ├── pinecone.ts           # Pinecone client helpers
│   └── retriever.ts          # Pinecone retriever + context prompt
├── routes/
│   ├── chat.ts               # POST /chat (non-streaming)
│   ├── root.ts               # GET /, GET /health
│   └── stream.ts             # GET /stream (SSE)
├── config.ts                 # OpenRouter config helpers
├── cors.ts                   # Allowlist-based CORS
├── index.ts                  # Fastify server entry
├── memory.ts                 # In-memory chat store
├── openrouter.ts             # Chat + stream wrappers
└── types.ts                  # Shared types
```

## Quick Start

### 1) Install dependencies

```bash
pnpm install
```

### 2) Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set `OPENROUTER_API_KEY` at minimum. Get a key from `https://openrouter.ai`.

### 3) Run the server

```bash
pnpm dev
```

Server defaults to `http://localhost:3141`.

## API Endpoints

### Utility
- `GET /` → API info
- `GET /health` → Health check

### Chat (non-streaming)
- `POST /chat`

Request body:

```json
{
  "message": "Hello, how are you?",
  "sessionId": "optional-session-id",
  "instructions": "optional system prompt",
  "model": "optional model override"
}
```

Response:

```json
{ "text": "…", "sessionId": "…", "timestamp": 1710000000000 }
```

### Streaming (SSE)
- `GET /stream?query=...&sessionId=...&instructions=...&model=...`

Response: `text/event-stream` with incremental `data:` chunks and a terminal `event: done`.

## Example Usage

### cURL

```bash
# Send a chat message (non-streaming)
curl -X POST http://localhost:3141/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is TypeScript?"
  }'

# Stream a response (SSE)
curl -N "http://localhost:3141/stream?query=Tell%20me%20a%20story"
```

### JavaScript/TypeScript

```ts
// Non-streaming
const res = await fetch('http://localhost:3141/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello!' })
});
const data = await res.json();
console.log(data.text, data.sessionId);

// Streaming (SSE)
const resp = await fetch('http://localhost:3141/stream?query=Tell%20me%20a%20story');
const reader = resp.body!.getReader();
const decoder = new TextDecoder();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value);
  console.log(chunk);
}
```

## Configuration

Set via environment variables:

Required:
- `OPENROUTER_API_KEY`

Optional (sensible defaults):
- `OPENROUTER_BASE_URL` (default `https://openrouter.ai/api/v1`)
- `OPENROUTER_HTTP_REFERER` (default `http://localhost`)
- `OPENROUTER_APP_TITLE` (default `hono-chat-agent`)
- `OPENROUTER_MODEL` (default `meta-llama/llama-3.1-8b-instruct:free`)
- `PORT` (default `3141`)
- `HOST` (default `0.0.0.0`)
- `CORS_ALLOWLIST` (comma-separated origins or `*`)
- `EMBEDDINGS_MODEL` (default `openai/text-embedding-3-small`)
- `PINECONE_API_KEY`, `PINECONE_INDEX`, `PINECONE_NAMESPACE` (enable RAG)

## Development

```bash
pnpm dev         # Start development server with hot reload
pnpm build       # Compile TypeScript to ./dist
pnpm start       # Run compiled JavaScript
pnpm type-check  # Type-check only
```

## Notes on RAG (Pinecone)

When `PINECONE_API_KEY` and `PINECONE_INDEX` are set, the server will attempt to retrieve context via Pinecone using embeddings produced through OpenRouter.

## License

MIT