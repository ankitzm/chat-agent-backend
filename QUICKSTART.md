## Quickstart

Follow these steps to run the Fastify Volt-like Chat Agent locally and test it quickly.

### 1) Install

```bash
pnpm install
```

### 2) Configure

Copy the example env and set your OpenRouter key:

```bash
cp .env.example .env
```

Required:

- `OPENROUTER_API_KEY` (get one from `https://openrouter.ai`)

Optional:

- `OPENROUTER_MODEL` (defaults to `meta-llama/llama-3.1-8b-instruct:free`)
- `PORT` (default `3141`)

### 3) Run the server

```bash
pnpm dev
```

Server will listen at `http://localhost:3141`.

### 4) Try with cURL

```bash
curl -X POST http://localhost:3141/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello!"}'

curl -N "http://localhost:3141/stream?query=Tell%20me%20a%20story"
```

### 5) Try with bundled api-test script

Run a quick CLI test that hits both `/chat` and `/stream`, logs output, and saves responses under `logs/`:

```bash
pnpm tsx api-test.ts
```

Outputs:

- `logs/chat-response.txt`
- `logs/stream-response.txt`

### Samples

Sample prompts and expected rough outputs are under `samples/`:

- `samples/questions.txt` – example questions
- `samples/expected.md` – rough expected behavior

Note: Model outputs vary. Treat expected answers as approximate.


