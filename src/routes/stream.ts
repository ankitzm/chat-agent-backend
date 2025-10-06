import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { DEFAULT_MODEL, isOpenRouterConfigured } from '../config';
import { ChatMemory } from '../memory';
import { PineconeRetriever, buildContextPrompt } from '../rag/retriever';
import { VoltChatAgent } from '../agent/volt-agent';

export interface StreamDeps {
  memory: ChatMemory;
  retriever?: PineconeRetriever;
  agent: VoltChatAgent;
}

export function createStreamRoutes(deps: StreamDeps) {
  return async function streamRoutes(fastify: FastifyInstance) {
    fastify.get('/stream', async (req, reply) => {
      if (!isOpenRouterConfigured()) {
        reply.code(500);
        return { error: 'Missing OPENROUTER_API_KEY. Set it in your environment.' };
      }
      const querySchema = z.object({
        query: z.string().min(1),
        sessionId: z.string().optional(),
        instructions: z.string().optional(),
        model: z.string().optional(),
      });

      const parse = querySchema.safeParse(req.query);
      if (!parse.success) {
        reply.code(400);
        return { error: 'Invalid query params', details: parse.error.flatten() };
      }

      const { query, sessionId: maybeSessionId, instructions, model } = parse.data;
      const sessionId = maybeSessionId ?? crypto.randomUUID();

      if (instructions) deps.memory.setInstructions(sessionId, instructions);
      const systemPrompt = deps.memory.getInstructions(sessionId);

      deps.memory.appendUserMessage(sessionId, query);
      const history = deps.memory.getHistory(sessionId);

      // Write SSE + CORS headers and keep connection open
      reply.raw.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
      reply.raw.setHeader('Connection', 'keep-alive');
      reply.raw.setHeader('X-Accel-Buffering', 'no');
      // Respect allowlist: if plugin approved the origin, Fastify will set Vary/ACA-Origin.
      // Here we mirror it based on request header when writing raw.
      const reqOrigin = (req.headers?.origin as string | undefined) ?? '*';
      reply.raw.setHeader('Access-Control-Allow-Origin', reqOrigin);
      reply.raw.setHeader('Vary', 'Origin');
      reply.raw.writeHead(200);

      try {
        let contextSystem: string | undefined;
        if (deps.retriever) {
          try {
            const docs = await deps.retriever.retrieve(query);
            contextSystem = buildContextPrompt(docs);
          } catch {}
        }
        const messages = [
          ...(contextSystem ? [{ role: 'system', content: contextSystem }] : []),
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          ...history.map((m) => ({ role: m.role, content: m.content })),
        ];

        let assembled = '';
        for await (const delta of deps.agent.stream(sessionId, query)) {
          assembled += delta;
          reply.raw.write(`data: ${delta}\n\n`);
        }
        deps.memory.appendAssistantMessage(sessionId, assembled);
        reply.raw.write(`event: done\n`);
        reply.raw.write(`data: {"sessionId":"${sessionId}"}\n\n`);
        reply.raw.end();
      } catch (err: unknown) {
        const message = (err as Error)?.message ?? 'Unknown error';
        const isJsonIssue = message.includes('Invalid JSON response') || message.includes('JSON');
        reply.raw.write(`event: error\n`);
        reply.raw.write(`data: ${JSON.stringify({ message: isJsonIssue ? 'Upstream provider returned an invalid response' : message })}\n\n`);
        reply.raw.end();
      }
    });
  };
}


