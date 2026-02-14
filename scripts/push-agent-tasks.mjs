#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { createHmac, randomUUID } from 'node:crypto';
import process from 'node:process';
import path from 'node:path';

async function loadEnvFile(filePath) {
  try {
    const raw = await readFile(filePath, 'utf8');
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx <= 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const valueRaw = trimmed.slice(eqIdx + 1).trim();
      if (!key) continue;
      if (process.env[key]) continue;
      const value = valueRaw.replace(/^['"]|['"]$/g, '');
      process.env[key] = value;
    }
  } catch {
    // Ignore missing files.
  }
}

async function loadLocalEnv() {
  const cwd = process.cwd();
  await loadEnvFile(path.join(cwd, '.env.local'));
  await loadEnvFile(path.join(cwd, '.env'));
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) {
      args[key] = true;
      continue;
    }
    args[key] = value;
    i += 1;
  }
  return args;
}

function printHelp() {
  const help = [
    'Push AI tasks into Spexly via signed ingest endpoint.',
    '',
    'Usage:',
    '  npm run push:tasks -- --project <project_id> --file <tasks.json> [--agent codex|claude|cloud] [--url http://localhost:3000]',
    '  npm run :push -- --project <project_id> [--agent codex|claude|cloud] [--file ./tasks.sample.json]',
    '',
    'Required env vars:',
    '  AGENT_INGEST_SECRET',
    '',
    'Optional env vars:',
    '  SPEXLY_BASE_URL (default: http://localhost:3000)',
    '',
    'Input file format:',
    '  1) Full payload:',
    '     {"projectId":"...","sourceAgent":"codex","tasks":[...]}',
    '  2) Tasks-only array:',
    '     [{"title":"Task A","status":"todo"}]',
    '  3) Deployment plan JSON:',
    '     {"phases":[{"title":"...","tasks":[{"title":"...","done":false}]}]}',
  ];
  console.log(help.join('\n'));
}

function normalizeAgent(agent) {
  const raw = typeof agent === 'string' ? agent.trim().toLowerCase() : '';
  if (!raw) return 'codex';
  if (raw === 'cloud') return 'claude-code';
  if (raw === 'claude') return 'claude-code';
  return raw;
}

function normalizeTasks(input) {
  // Raw tasks array
  if (Array.isArray(input)) {
    return input;
  }
  // Payload shape with tasks
  if (input && typeof input === 'object' && Array.isArray(input.tasks)) {
    return input.tasks;
  }
  // Deployment plan shape with phases[].tasks[]
  if (input && typeof input === 'object' && Array.isArray(input.phases)) {
    const tasks = [];
    for (const phase of input.phases) {
      if (!phase || typeof phase !== 'object' || !Array.isArray(phase.tasks)) continue;

      const phaseTitle =
        typeof phase.title === 'string' && phase.title.trim()
          ? phase.title.trim()
          : 'Plan Phase';

      for (const entry of phase.tasks) {
        if (!entry || typeof entry !== 'object') continue;
        const rawTitle = typeof entry.title === 'string' ? entry.title.trim() : '';
        if (!rawTitle) continue;

        const done = entry.done === true;
        const notes = [];
        if (Array.isArray(entry.commands) && entry.commands.length > 0) {
          notes.push(`Commands: ${entry.commands.join(' | ')}`);
        }
        if (Array.isArray(entry.checks) && entry.checks.length > 0) {
          notes.push(`Checks: ${entry.checks.join(' | ')}`);
        }
        if (Array.isArray(entry.variables) && entry.variables.length > 0) {
          notes.push(`Variables: ${entry.variables.join(', ')}`);
        }
        const detailText = notes.join('\n').trim();
        const owner = typeof entry.owner === 'string' && entry.owner.trim() ? entry.owner.trim() : undefined;
        const planItemId = typeof entry.id === 'string' && entry.id.trim() ? entry.id.trim() : undefined;

        tasks.push({
          title: rawTitle,
          details: detailText || undefined,
          status: done ? 'done' : 'todo',
          externalRef: planItemId,
          metadata: {
            source: 'deployment-plan',
            phase: phaseTitle,
            owner,
            planItemId,
            commands: Array.isArray(entry.commands) ? entry.commands : undefined,
            checks: Array.isArray(entry.checks) ? entry.checks : undefined,
            variables: Array.isArray(entry.variables) ? entry.variables : undefined,
          },
        });
      }
    }

    if (tasks.length > 0) {
      return tasks;
    }
  }

  throw new Error('Invalid input file. Expected an array or object with "tasks" array.');
}

function buildPayload(parsed, projectId, sourceAgent, tasks) {
  const payloadProjectId =
    typeof parsed?.projectId === 'string'
      ? parsed.projectId
      : projectId || process.env.SPEXLY_PROJECT_ID;
  if (!payloadProjectId) {
    throw new Error('Missing project ID. Pass --project, set SPEXLY_PROJECT_ID, or include projectId in JSON file.');
  }

  const payloadSourceAgent =
    typeof parsed?.sourceAgent === 'string' && parsed.sourceAgent.trim()
      ? normalizeAgent(parsed.sourceAgent)
      : normalizeAgent(sourceAgent);

  return {
    projectId: payloadProjectId,
    sourceAgent: payloadSourceAgent,
    tasks,
  };
}

function signRequest(timestamp, rawBody, secret) {
  return createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`, 'utf8')
    .digest('hex');
}

async function main() {
  await loadLocalEnv();

  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    printHelp();
    return;
  }

  const filePath = typeof args.file === 'string' ? args.file : './tasks.sample.json';
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Missing --file <path-to-json>.');
  }

  const secret = process.env.AGENT_INGEST_SECRET;
  if (!secret) {
    throw new Error('Missing AGENT_INGEST_SECRET env var.');
  }

  const baseUrl = (args.url || process.env.SPEXLY_BASE_URL || 'http://localhost:3000').toString().replace(/\/$/, '');
  const endpoint = `${baseUrl}/api/agent/ingest`;
  const timestamp = `${Math.floor(Date.now() / 1000)}`;
  const idempotencyKey = randomUUID();

  const fileContents = await readFile(filePath, 'utf8');
  const parsed = JSON.parse(fileContents);
  const tasks = normalizeTasks(parsed);
  const payload = buildPayload(parsed, args.project, args.agent, tasks);
  const rawBody = JSON.stringify(payload);
  const signature = signRequest(timestamp, rawBody, secret);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-spexly-timestamp': timestamp,
      'x-spexly-idempotency-key': idempotencyKey,
      'x-spexly-signature': `sha256=${signature}`,
    },
    body: rawBody,
  });

  const text = await response.text();
  const output = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(`Ingest failed (${response.status}): ${JSON.stringify(output)}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        endpoint,
        idempotencyKey,
        inserted: output.inserted ?? 0,
        response: output,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
