import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { generateText } from 'ai';
import { openrouter, DEFAULT_MODEL, isOpenRouterConfigured } from '../config';
import { ChatMemory } from '../memory';

export interface ChatDeps {
  memory: ChatMemory;
}

export function createChatRoutes(deps: ChatDeps) {
  return async function chatRoutes(fastify: FastifyInstance) {
    const postChatSchema = z.object({
      message: z.string().min(1),
      sessionId: z.string().optional(),
      instructions: z.string().optional(),
      model: z.string().optional(),
    });

    fastify.post('/chat', async (req, reply) => {
      if (!isOpenRouterConfigured()) {
        reply.code(500);
        return { error: 'Missing OPENROUTER_API_KEY. Set it in your environment.' };
      }
      const body = postChatSchema.safeParse(req.body);
      if (!body.success) {
        reply.code(400);
        return { error: 'Invalid body', details: body.error.flatten() };
      }

      const { message, sessionId: maybeSessionId, instructions, model } = body.data;
      const sessionId = maybeSessionId ?? crypto.randomUUID();

      if (instructions) deps.memory.setInstructions(sessionId, instructions);
      const systemPrompt = deps.memory.getInstructions(sessionId);

      deps.memory.appendUserMessage(sessionId, message);
      const history = deps.memory.getHistory(sessionId);

      try {
        const result = await generateText({
          model: openrouter(model ?? DEFAULT_MODEL) as any,
          system: systemPrompt,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        });

        const text = result.text;
        deps.memory.appendAssistantMessage(sessionId, text);
        return { text, sessionId, timestamp: Date.now() };
      } catch (err: unknown) {
        const message = (err as Error)?.message ?? 'Unknown error';
        // Normalize common provider parsing errors
        if (message.includes('Invalid JSON response') || message.includes('JSON')) {
          reply.code(502);
          return { error: 'Upstream provider returned an invalid response', details: message };
        }
        reply.code(500);
        return { error: message };
      }
    });
  };
}


