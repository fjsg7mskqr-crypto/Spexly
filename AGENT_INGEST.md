# Agent Task Ingest API

Use this endpoint to push AI-generated tasks into a Spexly project.

- URL: `POST /api/agent/ingest`
- Auth: HMAC SHA-256 signature headers
- Result: Tasks are persisted in `task_items` and visible in the project Tasks panel

## Required Environment

- `AGENT_INGEST_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`

## Required Headers

- `x-spexly-timestamp`: unix seconds or milliseconds
- `x-spexly-idempotency-key`: unique key per request
- `x-spexly-signature`: `sha256=<hex-hmac>`

Signature input format:

`<timestamp>.<raw_json_body>`

## Payload

```json
{
  "projectId": "YOUR_PROJECT_UUID",
  "sourceAgent": "codex",
  "tasks": [
    {
      "title": "Implement signed ingest verification",
      "details": "Add HMAC verification and idempotency guard.",
      "status": "in_progress",
      "externalRef": "codex-2026-02-13-001",
      "metadata": {
        "conversationId": "abc123"
      }
    }
  ]
}
```

Allowed status values: `todo`, `in_progress`, `done`, `blocked`.

## Curl Example

```bash
BODY='{"projectId":"YOUR_PROJECT_UUID","sourceAgent":"codex","tasks":[{"title":"Create task panel","details":"Show tasks in canvas","status":"todo","externalRef":"codex-1"}]}'
TS=$(date +%s)
IDEMP=$(uuidgen)
SIG=$(printf "%s.%s" "$TS" "$BODY" | openssl dgst -sha256 -hmac "$AGENT_INGEST_SECRET" | sed 's/^.* //')

curl -X POST "http://localhost:3000/api/agent/ingest" \
  -H "content-type: application/json" \
  -H "x-spexly-timestamp: $TS" \
  -H "x-spexly-idempotency-key: $IDEMP" \
  -H "x-spexly-signature: sha256=$SIG" \
  -d "$BODY"
```

## Local CLI (Recommended)

Use the built-in CLI to push tasks from a JSON file:

```bash
AGENT_INGEST_SECRET=your-secret \
npm run push:tasks -- \
  --project YOUR_PROJECT_UUID \
  --file ./tasks.json \
  --agent codex \
  --url http://localhost:3000
```

Short alias for quick testing:

```bash
AGENT_INGEST_SECRET=your-secret \
SPEXLY_PROJECT_ID=YOUR_PROJECT_UUID \
npm run :push -- --agent cloud
```

Notes:
- `npm run :push` defaults to `./tasks.sample.json` if `--file` is omitted.
- `--agent cloud` and `--agent claude` are normalized to `claude-code`.
- Project ID can be passed via `--project`, `SPEXLY_PROJECT_ID`, or in the JSON payload.

`tasks.json` can be either:

```json
[
  {
    "title": "Implement dashboard task panel",
    "details": "Show tasks from ingest API",
    "status": "todo",
    "externalRef": "codex-task-001"
  }
]
```

or:

```json
{
  "projectId": "YOUR_PROJECT_UUID",
  "sourceAgent": "codex",
  "tasks": [
    { "title": "Task A", "status": "todo" }
  ]
}
```
