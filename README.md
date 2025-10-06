# Fastify VoltAgent Chat Server

A clean, modular chat API built with [Fastify](https://fastify.dev) and [VoltAgent](https://voltagent.dev), powered by OpenRouter for LLM inference.

## Features

- 🚀 **Fastify** - Fast and low overhead web framework
- 🤖 **VoltAgent Integration** - AI agent framework for chat
- 🔄 **Chat Context Management** - Per-session message history (in-memory, ready for Pinecone)
- 🎯 **OpenRouter Support** - Access to multiple LLM models
- 📝 **TypeScript** - Fully typed with Zod validation
- 🧩 **Modular Architecture** - Clean separation of concerns
- 🌊 **Streaming Support** - Real-time SSE streaming responses

## Project Structure

```
src/
├── agents/          # VoltAgent agent definitions
│   └── chat-agent.ts
├── config/          # Environment configuration
│   └── env.ts
├── memory/          # Chat storage (in-memory, ready for Pinecone)
│   └── chat-store.ts
├── routes/          # Fastify route handlers
│   └── chat.ts
├── types/           # TypeScript type definitions
│   └── chat.ts
├── server.ts        # Fastify server setup
└── index.ts         # Entry point
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your OpenRouter API key:

```env
OPENROUTER_API_KEY=sk-or-v1-YOUR-ACTUAL-KEY-HERE
```

Get your OpenRouter API key from: https://openrouter.ai/

### 3. Run the Server

```bash
npm run dev
```

The server will start at: http://localhost:3141

## API Endpoints

### Chat Endpoints

#### Send Chat Message
```bash
POST /api/chat/text
Content-Type: application/json

{
  "message": "Hello, how are you?",
  "chatId": "optional-session-id",
  "history": [
    {"role": "user", "content": "Previous message", "timestamp": 1234567890}
  ]
}
```

Response:
```json
{
  "text": "I'm doing well, thank you!",
  "chatId": "generated-or-provided-id",
  "timestamp": 1234567890
}
```

#### Stream Chat Response
```bash
POST /api/chat/stream
Content-Type: application/json

{
  "message": "Tell me a story",
  "chatId": "optional-session-id"
}
```

Response: Server-Sent Events (SSE) stream

#### Get Chat History
```bash
GET /api/chat/history/:chatId
```

#### List All Sessions
```bash
GET /api/chat/sessions
```

#### Delete Session
```bash
DELETE /api/chat/session/:chatId
```

### Utility Endpoints

- `GET /` - API information
- `GET /health` - Health check

## Example Usage

### cURL Examples

```bash
# Send a chat message
curl -X POST http://localhost:3141/api/chat/text \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is TypeScript?"
  }'

# Stream a response
curl -X POST http://localhost:3141/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Count to 5 slowly"
  }' \
  --no-buffer

# Get chat history
curl http://localhost:3141/api/chat/history/YOUR_CHAT_ID

# List all sessions
curl http://localhost:3141/api/chat/sessions
```

### JavaScript/TypeScript Example

```typescript
// Send a message
const response = await fetch('http://localhost:3141/api/chat/text', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Hello!',
    history: []
  })
});

const data = await response.json();
console.log(data.text); // AI response
console.log(data.chatId); // Session ID for follow-up messages

// Stream a response
const streamResponse = await fetch('http://localhost:3141/api/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Tell me a story' })
});

const reader = streamResponse.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  console.log(chunk); // Stream chunks
}
```

## Chat Context Management

The server maintains conversation history per `chatId`:

```typescript
// First message - creates new session
const response1 = await chat({ message: "Remember the number 42" });
const chatId = response1.chatId;

// Follow-up message - maintains context
const response2 = await chat({
  message: "What number did I just mention?",
  chatId: chatId,
  history: [
    { role: "user", content: "Remember the number 42", timestamp: Date.now() },
    { role: "assistant", content: "I'll remember 42", timestamp: Date.now() }
  ]
});
```

## OpenRouter Models

You can use any model available on OpenRouter. Some popular options:

- `meta-llama/llama-3.1-8b-instruct:free` (default, free)
- `anthropic/claude-3-haiku`
- `openai/gpt-4-turbo`
- `google/gemini-pro`

Change the model in `.env`:
```env
OPENROUTER_MODEL=anthropic/claude-3-haiku
```

See all models at: https://openrouter.ai/models

## Development

### Scripts

```bash
npm run dev         # Start development server with hot reload
npm run build       # Compile TypeScript
npm run start       # Run compiled JavaScript
npm run type-check  # Check TypeScript types
```

### Code Structure

- **KISS** - Simple, readable code
- **YAGNI** - Only build what's needed
- **DRY** - Reusable, modular components
- **HAI** - Proper error handling and logging

## Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables for Production

```env
NODE_ENV=production
OPENROUTER_API_KEY=your-production-key
PORT=3141
HOST=0.0.0.0
```

## Migration to Pinecone

The current `ChatStore` is in-memory. To migrate to Pinecone:

1. Install Pinecone SDK: `npm install @pinecone-database/pinecone`
2. Create `src/memory/pinecone-store.ts` with same interface
3. Swap implementation in `src/routes/chat.ts`
4. Add `PINECONE_API_KEY` to `.env`

The modular architecture makes this swap seamless!

## Next Steps

- [ ] Add authentication (API keys or JWT)
- [ ] Implement rate limiting
- [ ] Add Pinecone integration for persistent storage
- [ ] Add custom tools for the agent
- [ ] Deploy to production

## Tech Stack

- [Fastify](https://fastify.dev) - Fast web framework
- [VoltAgent](https://voltagent.dev) - AI agent framework
- [OpenRouter](https://openrouter.ai) - LLM routing and inference
- [TypeScript](https://typescriptlang.org) - Type safety
- [Zod](https://zod.dev) - Runtime validation

## License

MIT

