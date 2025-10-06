import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { ChatMemory } from './memory';
import { rootRoutes } from './routes/root';
import { createStreamRoutes } from './routes/stream';
import { createChatRoutes } from './routes/chat';
import { initPineconeFromEnv } from './rag/pinecone';
import { PineconeRetriever } from './rag/retriever';
import { VoltChatAgent } from './agent/volt-agent';

// Server setup
const fastify = Fastify({
  logger: {
    transport: process.env.NODE_ENV === 'production' ? undefined : {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  },
});

await fastify.register(cors, { origin: '*' });

// Shared deps
const memory = new ChatMemory();

// Optional Pinecone retriever (RAG)
const pineconeCfg = initPineconeFromEnv();
const retriever = pineconeCfg ? new PineconeRetriever(pineconeCfg) : undefined;
const agent = new VoltChatAgent({ model: process.env.OPENROUTER_MODEL ?? 'meta-llama/llama-3.1-8b-instruct:free' }, memory, retriever);

// Register modular routes
await fastify.register(rootRoutes);
await fastify.register(createStreamRoutes({ memory, retriever, agent } as any));
await fastify.register(createChatRoutes({ memory, retriever, agent } as any));

// Start server
const PORT = Number(process.env.PORT ?? 3141);
const HOST = process.env.HOST ?? '0.0.0.0';

try {
  await fastify.listen({ port: PORT, host: HOST });
  fastify.log.info(`Server listening on http://${HOST}:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}


