import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { ChatMemory } from './memory';
import { rootRoutes } from './routes/root';
import { createStreamRoutes } from './routes/stream';
import { createChatRoutes } from './routes/chat';

// Server setup
const fastify = Fastify({
  logger: {
    transport: process.env.NODE_ENV === 'production' ? undefined : {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  },
});

await fastify.register(cors, { origin: true });

// Shared deps
const memory = new ChatMemory();

// Register modular routes
await fastify.register(rootRoutes);

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


