# Spexly Agent Task Push CLI

Push tasks into any Spexly project from external agents (Codex, Claude Code, CI pipelines, custom scripts).

## Quick Start

```bash
node push-agent-tasks.mjs \
  --project <PROJECT_UUID> \
  --file tasks.json \
  --agent codex
```

## Setup

### 1. Copy the script

Copy `scripts/push-agent-tasks.mjs` from the Spexly repo into your project:

```bash
cp /path/to/spexly/scripts/push-agent-tasks.mjs ./push-agent-tasks.mjs
```

### 2. Set environment variables

Add these to your `.env.local` or export them in your shell:

| Variable | Required | Description |
|---|---|---|
| `AGENT_INGEST_SECRET` | Yes | HMAC signing secret (must match your Spexly deployment) |
| `SPEXLY_BASE_URL` | No | Spexly instance URL. Default: `http://localhost:3000` |
| `SPEXLY_PROJECT_ID` | No | Default project ID (can also pass via `--project`) |

### 3. Add an npm script (optional)

```json
{
  "scripts": {
    "push:tasks": "node push-agent-tasks.mjs"
  }
}
```

## Usage

### CLI Flags

```
--project <uuid>    Spexly project ID (or set SPEXLY_PROJECT_ID)
--file <path>       Path to tasks JSON file (default: ./tasks.sample.json)
--agent <name>      Source agent name: codex, claude, cloud, or custom (default: codex)
--url <url>         Override SPEXLY_BASE_URL
--help              Show help
```

### Examples

```bash
# Push from Codex
node push-agent-tasks.mjs --project abc-123 --file codex-tasks.json --agent codex

# Push from Claude Code
node push-agent-tasks.mjs --project abc-123 --file tasks.json --agent claude

# Push to production
SPEXLY_BASE_URL=https://your-spexly.vercel.app \
  node push-agent-tasks.mjs --project abc-123 --file tasks.json

# Using npm script
npm run push:tasks -- --project abc-123 --file tasks.json --agent codex
```

## Input File Formats

The CLI accepts three JSON formats:

### 1. Tasks Array (simplest)

```json
[
  {
    "title": "Set up auth middleware",
    "details": "Add JWT verification to API routes",
    "status": "todo"
  },
  {
    "title": "Write unit tests for user model",
    "status": "todo"
  }
]
```

### 2. Full Payload

```json
{
  "projectId": "abc-123",
  "sourceAgent": "codex",
  "tasks": [
    {
      "title": "Migrate database schema",
      "details": "Run pending Supabase migrations",
      "status": "in_progress"
    }
  ]
}
```

When `projectId` and `sourceAgent` are in the file, CLI flags are optional.

### 3. Deployment Plan

```json
{
  "phases": [
    {
      "title": "Phase 1 - Infrastructure",
      "tasks": [
        {
          "title": "Provision database",
          "done": false,
          "commands": ["supabase db push"],
          "checks": ["Verify tables exist"],
          "variables": ["DATABASE_URL"]
        },
        {
          "title": "Configure DNS",
          "done": true
        }
      ]
    }
  ]
}
```

Phase metadata (commands, checks, variables) is preserved in task metadata.

## Task Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | Yes | Task title (max 180 chars) |
| `details` | string | No | Description/notes (max 3000 chars) |
| `status` | string | No | `todo`, `in_progress`, `done`, `blocked` (default: `todo`) |
| `externalRef` | string | No | Unique ref for upsert deduplication |
| `metadata` | object | No | Arbitrary JSON metadata |

### Auto-Linking to Canvas Nodes

Tasks are automatically linked to canvas nodes (ideas, features, screens, tech stack) when the task title fuzzy-matches a node name (>62% similarity). To explicitly link a task:

```json
{
  "title": "Fix login bug",
  "metadata": {
    "nodeId": "node-uuid-here"
  }
}
```

## How It Works

1. Reads tasks from the JSON file
2. Signs the request with HMAC-SHA256 using `AGENT_INGEST_SECRET`
3. Sends a POST to `/api/agent/ingest` with headers:
   - `x-spexly-timestamp` - Unix timestamp
   - `x-spexly-idempotency-key` - UUID (prevents duplicate processing)
   - `x-spexly-signature` - `sha256=<hmac>`
4. Server validates signature, creates an audit log entry, inserts tasks
5. Tasks with `externalRef` are upserted (update if ref exists, insert if new)

## Security

- All requests are HMAC-signed with a shared secret
- Timestamps are validated within a 5-minute window
- Idempotency keys prevent duplicate processing
- Task content is sanitized server-side

## Troubleshooting

| Error | Fix |
|---|---|
| `Missing AGENT_INGEST_SECRET` | Set the env var in `.env.local` or export it |
| `Stale or invalid timestamp` | System clock may be off, or request took >5 min |
| `Invalid signature` | `AGENT_INGEST_SECRET` doesn't match the server |
| `Project not found` | Check the project UUID exists in Spexly |
| `Ingest failed (503)` | Server doesn't have `AGENT_INGEST_SECRET` configured |
