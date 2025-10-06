import type { FastifyCorsOptions } from '@fastify/cors';

export function getAllowedOrigins(): string[] | '*'{
  const raw = process.env.CORS_ALLOWLIST?.trim();
  if (!raw || raw === '*') return '*';
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

export function isOriginAllowed(origin: string | undefined): boolean {
  const allow = getAllowedOrigins();
  if (allow === '*') return true;
  if (!origin) return false;
  return allow.includes(origin);
}

export function getCorsOptions(): FastifyCorsOptions {
  const allow = getAllowedOrigins();
  if (allow === '*') return { origin: '*' };
  return {
    origin: (origin, cb) => {
      // Note: for non-browser requests, origin can be undefined; reject unless explicitly allowed
      if (origin && allow.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error('CORS: origin not allowed'), false);
      }
    },
  };
}


