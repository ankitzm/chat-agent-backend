import { FastifyInstance } from 'fastify';

export async function rootRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (_req, _rep) => {
    return {
      name: 'Volt-like Minimal Chat Agent',
      version: '1.0.0',
      routes: {
        stream: 'GET /stream?query=...&sessionId=...&instructions=...&model=...',
        chat: 'POST /chat { message, sessionId?, instructions?, model? }',
        health: 'GET /health',
      },
    };
  });

  fastify.get('/health', async (_req, _rep) => {
    return { ok: true, timestamp: Date.now() };
  });
}


