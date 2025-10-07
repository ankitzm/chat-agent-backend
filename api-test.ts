import fs from 'node:fs';
import path from 'node:path';

const SERVER_URL = process.env.TEST_SERVER_URL ?? 'http://localhost:3141';
const LOG_DIR = path.resolve('logs');
const QUESTIONS_FILE = path.resolve('samples/questions.txt');

async function ensureDir(dir: string): Promise<void> {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function readQuestions(): Promise<string[]> {
  try {
    const raw = await fs.promises.readFile(QUESTIONS_FILE, 'utf8');
    return raw
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  } catch {
    return ['What is TypeScript?'];
  }
}

async function testChat(question: string): Promise<string> {
  const res = await fetch(`${SERVER_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: question }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`chat failed ${res.status}: ${txt}`);
  }
  const data = (await res.json()) as { text?: string };
  return data.text ?? '';
}

async function testStream(question: string): Promise<string> {
  const res = await fetch(
    `${SERVER_URL}/stream?` + new URLSearchParams({ query: question }).toString(),
    { method: 'GET' }
  );
  if (!res.ok || !res.body) {
    const txt = await res.text().catch(() => '');
    throw new Error(`stream failed ${res.status}: ${txt}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let assembled = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    // naive parse of SSE: accumulate only data: lines that look like model deltas
    for (const line of chunk.split(/\n/)) {
      if (line.startsWith('data: ')) {
        const payload = line.slice(6);
        // ignore JSON blobs like final done event; keep plain text deltas
        if (!payload.startsWith('{')) {
          assembled += payload;
          process.stdout.write(payload);
        }
      }
    }
  }
  return assembled;
}

async function main(): Promise<void> {
  await ensureDir(LOG_DIR);
  const questions = await readQuestions();
  const first = questions[0];
  console.log(`[api-test] Using question: ${first}`);

  // Test /chat
  console.log('\n[api-test] /chat response:');
  const chatText = await testChat(first);
  console.log(chatText);
  await fs.promises.writeFile(path.join(LOG_DIR, 'chat-response.md'), chatText, 'utf8');

  // Test /stream
  console.log('\n[api-test] /stream response (streamed):');
  const streamText = await testStream(first);
  console.log('\n');
  await fs.promises.writeFile(path.join(LOG_DIR, 'stream-response.md'), streamText, 'utf8');

  console.log('[api-test] Saved logs to logs/chat-response.md and logs/stream-response.md');
}

main().catch((err) => {
  console.error('[api-test] Error:', err);
  process.exit(1);
});


