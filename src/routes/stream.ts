import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { streamText } from 'ai';
import { openrouter, DEFAULT_MODEL, isOpenRouterConfigured } from '../config';
import { ChatMemory } from '../memory';

export interface StreamDeps {
  memory: ChatMemory;
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

      reply.headers({
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      });

      // Flush headers
      await reply.send('\u0000');

      try {
        const result = await streamText({
          model: openrouter(model ?? DEFAULT_MODEL) as any,
          system: systemPrompt,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        });

        let assembled = '';
        for await (const delta of result.textStream) {
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


