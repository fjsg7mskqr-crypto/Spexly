import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { logError } from '@/lib/errors';
import { similarity } from '@/lib/import/fuzzyMatcher';

const MAX_TASKS_PER_REQUEST = 200;
const MAX_TIMESTAMP_DRIFT_MS = 5 * 60 * 1000;

type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';

interface AgentTaskInput {
  title: string;
  details?: string;
  status?: string;
  externalRef?: string;
  metadata?: Record<string, unknown>;
}

interface AgentIngestPayload {
  projectId: string;
  sourceAgent?: string;
  tasks: AgentTaskInput[];
}

interface NodeCandidate {
  id: string;
  type: string;
  name: string;
}

function normalizeStatus(status: string | undefined): TaskStatus {
  if (status === 'in_progress' || status === 'done' || status === 'blocked') {
    return status;
  }
  return 'todo';
}

function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function isValidSignature(rawBody: string, timestamp: string, signature: string, secret: string): boolean {
  const payload = `${timestamp}.${rawBody}`;
  const expected = createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
  const provided = signature.replace(/^sha256=/, '').trim();

  if (!expected || !provided || expected.length !== provided.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(provided, 'utf8'));
}

function parseTimestamp(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed > 1_000_000_000_000) return parsed; // milliseconds
  return parsed * 1000; // seconds
}

function requestHash(rawBody: string): string {
  return createHash('sha256').update(rawBody, 'utf8').digest('hex');
}

function validatePayload(input: unknown): AgentIngestPayload {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid payload');
  }

  const payload = input as Partial<AgentIngestPayload>;
  const projectId = sanitizeText(payload.projectId, 64);
  if (!projectId) {
    throw new Error('Missing projectId');
  }

  const tasks = Array.isArray(payload.tasks) ? payload.tasks : [];
  if (tasks.length === 0) {
    throw new Error('At least one task is required');
  }
  if (tasks.length > MAX_TASKS_PER_REQUEST) {
    throw new Error(`Too many tasks. Max ${MAX_TASKS_PER_REQUEST}`);
  }

  return {
    projectId,
    sourceAgent: sanitizeText(payload.sourceAgent, 64) || 'unknown',
    tasks,
  };
}

function getNodePrimaryName(node: Record<string, unknown>): string {
  const type = String(node.type || '');
  const data = (node.data || {}) as Record<string, unknown>;

  if (type === 'idea') return sanitizeText(data.appName, 180);
  if (type === 'feature') return sanitizeText(data.featureName, 180);
  if (type === 'screen') return sanitizeText(data.screenName, 180);
  if (type === 'techStack') return sanitizeText(data.toolName, 180);
  if (type === 'prompt') return sanitizeText(data.promptText, 180);
  if (type === 'note') return sanitizeText(data.title, 180);
  return '';
}

function extractNodeCandidates(canvasData: unknown): NodeCandidate[] {
  if (!canvasData || typeof canvasData !== 'object') return [];

  const nodesRaw = (canvasData as { nodes?: unknown }).nodes;
  if (!Array.isArray(nodesRaw)) return [];

  const allowedTypes = new Set(['idea', 'feature', 'screen', 'techStack']);
  const candidates: NodeCandidate[] = [];

  for (const raw of nodesRaw) {
    if (!raw || typeof raw !== 'object') continue;
    const node = raw as Record<string, unknown>;
    const id = sanitizeText(node.id, 120);
    const type = sanitizeText(node.type, 40);
    if (!id || !type || !allowedTypes.has(type)) continue;

    const name = getNodePrimaryName(node);
    if (!name) continue;

    candidates.push({ id, type, name });
  }

  return candidates;
}

function selectAutoLink(task: AgentTaskInput, candidates: NodeCandidate[]) {
  const metadata = task.metadata && typeof task.metadata === 'object' ? task.metadata : {};
  const source = sanitizeText((metadata as Record<string, unknown>).source, 64).toLowerCase();
  const explicitNodeId = sanitizeText((metadata as Record<string, unknown>).nodeId, 120);
  if (explicitNodeId) {
    const explicit = candidates.find((candidate) => candidate.id === explicitNodeId);
    if (explicit) {
      return {
        nodeId: explicit.id,
        nodeType: explicit.type,
        confidence: 1,
      };
    }
  }

  // Deployment-plan items should stay project-level unless explicitly linked.
  if (source === 'deployment-plan') {
    return null;
  }

  const title = sanitizeText(task.title, 180);
  const details = sanitizeText(task.details, 3000);
  const fullText = `${title} ${details}`.trim();

  let best: { nodeId: string; nodeType: string; confidence: number } | null = null;

  for (const candidate of candidates) {
    let score = similarity(title, candidate.name);

    if (details && details.toLowerCase().includes(candidate.name.toLowerCase())) {
      score += 0.1;
    }

    if (fullText && fullText.toLowerCase().includes(candidate.name.toLowerCase())) {
      score += 0.05;
    }

    if (!best || score > best.confidence) {
      best = {
        nodeId: candidate.id,
        nodeType: candidate.type,
        confidence: Math.min(1, score),
      };
    }
  }

  if (!best || best.confidence < 0.62) {
    return null;
  }

  return best;
}

export async function POST(request: Request) {
  const ingestSecret = process.env.AGENT_INGEST_SECRET;

  if (!ingestSecret) {
    return Response.json({ ok: false, error: 'Agent ingest not configured' }, { status: 503 });
  }

  const idempotencyKey = request.headers.get('x-spexly-idempotency-key')?.trim();
  const timestamp = request.headers.get('x-spexly-timestamp')?.trim();
  const signature = request.headers.get('x-spexly-signature')?.trim();

  if (!idempotencyKey || !timestamp || !signature) {
    return Response.json({ ok: false, error: 'Missing signature headers' }, { status: 401 });
  }

  const timestampMs = parseTimestamp(timestamp);
  if (!timestampMs || Math.abs(Date.now() - timestampMs) > MAX_TIMESTAMP_DRIFT_MS) {
    return Response.json({ ok: false, error: 'Stale or invalid timestamp' }, { status: 401 });
  }

  const rawBody = await request.text();
  if (!isValidSignature(rawBody, timestamp, signature, ingestSecret)) {
    return Response.json({ ok: false, error: 'Invalid signature' }, { status: 401 });
  }

  const hash = requestHash(rawBody);
  const supabase = createAdminClient();

  try {
    const payload = validatePayload(JSON.parse(rawBody));

    const { error: lockError } = await supabase.from('agent_ingest_events').insert({
      idempotency_key: idempotencyKey,
      source_agent: payload.sourceAgent,
      request_hash: hash,
      status: 'processing',
    });

    if (lockError) {
      if (lockError.code === '23505') {
        return Response.json({ ok: true, idempotent: true }, { status: 200 });
      }
      logError(lockError, { action: 'agent-ingest:create-lock', idempotencyKey });
      return Response.json({ ok: false, error: 'Failed to start ingest' }, { status: 500 });
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id,user_id,canvas_data')
      .eq('id', payload.projectId)
      .single();

    if (projectError || !project) {
      await supabase
        .from('agent_ingest_events')
        .update({
          status: 'rejected',
          error_message: 'Project not found',
          processed_at: new Date().toISOString(),
        })
        .eq('idempotency_key', idempotencyKey);

      return Response.json({ ok: false, error: 'Project not found' }, { status: 404 });
    }

    const nodeCandidates = extractNodeCandidates(project.canvas_data);

    const rows = payload.tasks.map((task, idx) => {
      const title = sanitizeText(task.title, 180);
      if (!title) {
        throw new Error(`Task ${idx + 1} is missing a valid title`);
      }

      const link = selectAutoLink(task, nodeCandidates);

      return {
        user_id: project.user_id,
        project_id: payload.projectId,
        node_id: link?.nodeId || null,
        node_type: link?.nodeType || null,
        link_confidence: link?.confidence || null,
        title,
        details: sanitizeText(task.details, 3000) || null,
        status: normalizeStatus(task.status),
        source: 'agent',
        source_agent: payload.sourceAgent,
        external_ref: sanitizeText(task.externalRef, 120) || null,
        metadata: task.metadata && typeof task.metadata === 'object' && !Array.isArray(task.metadata)
          ? task.metadata
          : {},
      };
    });

    const withRef = rows.filter((row) => row.external_ref);
    const noRef = rows.filter((row) => !row.external_ref);

    if (noRef.length > 0) {
      const { error } = await supabase.from('task_items').insert(noRef);
      if (error) {
        throw error;
      }
    }

    if (withRef.length > 0) {
      const { error } = await supabase
        .from('task_items')
        .upsert(withRef, { onConflict: 'project_id,external_ref' });
      if (error) {
        throw error;
      }
    }

    await supabase
      .from('agent_ingest_events')
      .update({
        status: 'accepted',
        user_id: project.user_id,
        project_id: payload.projectId,
        processed_at: new Date().toISOString(),
      })
      .eq('idempotency_key', idempotencyKey);

    return Response.json({ ok: true, inserted: rows.length }, { status: 200 });
  } catch (error) {
    logError(error, { action: 'agent-ingest:post', idempotencyKey });

    await supabase
      .from('agent_ingest_events')
      .update({
        status: 'rejected',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        processed_at: new Date().toISOString(),
      })
      .eq('idempotency_key', idempotencyKey);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to ingest tasks',
      },
      { status: 400 }
    );
  }
}
