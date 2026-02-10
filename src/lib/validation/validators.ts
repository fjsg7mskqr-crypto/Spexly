/**
 * Input Validation Library
 *
 * Provides validation and sanitization for all user inputs to prevent:
 * - XSS (Cross-Site Scripting) attacks
 * - SQL injection
 * - DoS (Denial of Service) via size limits
 * - Data corruption
 */

import type { SpexlyNode, SpexlyEdge } from '@/types/nodes';

export interface ValidationResult {
  valid: boolean;
  sanitized?: string;
  error?: string;
}

export interface CanvasValidationResult {
  valid: boolean;
  sanitizedNodes?: SpexlyNode[];
  sanitizedEdges?: SpexlyEdge[];
  error?: string;
}

// Security constants
const MAX_PROJECT_NAME_LENGTH = 100;
const MIN_PROJECT_NAME_LENGTH = 1;
const MAX_NODES = 500;
const MAX_EDGES = 1000;
const MAX_STRING_FIELD_LENGTH = 10000; // For node text fields

// SQL keywords to block in project names (basic protection)
const SQL_KEYWORDS = [
  'DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'INSERT', 'UPDATE',
  'SELECT', 'UNION', 'EXEC', 'EXECUTE', 'SCRIPT', '--', ';--', '/*', '*/',
];

// Allowed characters for project names (alphanumeric, spaces, basic punctuation)
const ALLOWED_NAME_PATTERN = /^[a-zA-Z0-9\s\-_.,!?'()]+$/;

/**
 * HTML escapes a string to prevent XSS attacks
 */
function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return str.replace(/[&<>"'/]/g, (char) => htmlEscapes[char] || char);
}

/**
 * Sanitizes a generic string field (for node data)
 */
function sanitizeStringField(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = value.trim();

  // Enforce max length
  if (sanitized.length > MAX_STRING_FIELD_LENGTH) {
    sanitized = sanitized.substring(0, MAX_STRING_FIELD_LENGTH);
  }

  // HTML escape to prevent XSS
  sanitized = escapeHtml(sanitized);

  return sanitized;
}

/**
 * Validates and sanitizes a project name
 */
export function validateProjectName(name: unknown): ValidationResult {
  // Type check
  if (typeof name !== 'string') {
    return {
      valid: false,
      error: 'Project name must be a string',
    };
  }

  const trimmed = name.trim();

  // Length validation
  if (trimmed.length < MIN_PROJECT_NAME_LENGTH) {
    return {
      valid: false,
      error: 'Project name cannot be empty',
    };
  }

  if (trimmed.length > MAX_PROJECT_NAME_LENGTH) {
    return {
      valid: false,
      error: `Project name must be ${MAX_PROJECT_NAME_LENGTH} characters or less`,
    };
  }

  // Check for SQL keywords (case-insensitive)
  const upperName = trimmed.toUpperCase();
  for (const keyword of SQL_KEYWORDS) {
    if (upperName.includes(keyword)) {
      return {
        valid: false,
        error: 'Project name contains invalid characters or keywords',
      };
    }
  }

  // Check allowed characters
  if (!ALLOWED_NAME_PATTERN.test(trimmed)) {
    return {
      valid: false,
      error: 'Project name contains invalid characters. Only letters, numbers, spaces, and basic punctuation are allowed',
    };
  }

  // Sanitize (HTML escape)
  const sanitized = escapeHtml(trimmed);

  return {
    valid: true,
    sanitized,
  };
}

/**
 * Validates a single node structure and sanitizes its data
 */
function validateAndSanitizeNode(node: unknown): SpexlyNode | null {
  // Type guard
  if (!node || typeof node !== 'object') {
    return null;
  }

  const n = node as Record<string, unknown>;

  // Required fields
  if (typeof n.id !== 'string' || !n.id) {
    return null;
  }

  if (typeof n.type !== 'string') {
    return null;
  }

  // Validate node type
  const validTypes = ['idea', 'feature', 'screen', 'techStack', 'prompt', 'note'];
  if (!validTypes.includes(n.type)) {
    return null;
  }

  // Position validation
  if (!n.position || typeof n.position !== 'object') {
    return null;
  }

  const pos = n.position as Record<string, unknown>;
  if (typeof pos.x !== 'number' || typeof pos.y !== 'number') {
    return null;
  }

  // Data validation and sanitization
  if (!n.data || typeof n.data !== 'object') {
    return null;
  }

  // Deep clone and sanitize data
  const data = n.data as Record<string, unknown>;
  const sanitizedData: Record<string, unknown> = {};

  // Sanitize all string fields in data
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitizedData[key] = sanitizeStringField(value);
    } else if (typeof value === 'boolean') {
      sanitizedData[key] = value;
    } else if (typeof value === 'number') {
      sanitizedData[key] = value;
    } else {
      // For other types, convert to string and sanitize
      sanitizedData[key] = sanitizeStringField(String(value));
    }
  }

  return {
    ...n,
    id: String(n.id),
    type: String(n.type),
    position: {
      x: Number(pos.x),
      y: Number(pos.y),
    },
    data: sanitizedData,
  } as SpexlyNode;
}

/**
 * Validates a single edge structure
 */
function validateEdge(edge: unknown): SpexlyEdge | null {
  if (!edge || typeof edge !== 'object') {
    return null;
  }

  const e = edge as Record<string, unknown>;

  // Required fields
  if (typeof e.id !== 'string' || !e.id) {
    return null;
  }

  if (typeof e.source !== 'string' || !e.source) {
    return null;
  }

  if (typeof e.target !== 'string' || !e.target) {
    return null;
  }

  // Prevent self-referencing edges
  if (e.source === e.target) {
    return null;
  }

  return {
    id: String(e.id),
    source: String(e.source),
    target: String(e.target),
  } as SpexlyEdge;
}

/**
 * Validates and sanitizes canvas data (nodes and edges)
 */
export function validateCanvasData(
  nodes: unknown,
  edges: unknown
): CanvasValidationResult {
  // Type check
  if (!Array.isArray(nodes)) {
    return {
      valid: false,
      error: 'Nodes must be an array',
    };
  }

  if (!Array.isArray(edges)) {
    return {
      valid: false,
      error: 'Edges must be an array',
    };
  }

  // Size limits (DoS prevention)
  if (nodes.length > MAX_NODES) {
    return {
      valid: false,
      error: `Cannot exceed ${MAX_NODES} nodes`,
    };
  }

  if (edges.length > MAX_EDGES) {
    return {
      valid: false,
      error: `Cannot exceed ${MAX_EDGES} edges`,
    };
  }

  // Validate and sanitize each node
  const sanitizedNodes: SpexlyNode[] = [];
  for (const node of nodes) {
    const sanitized = validateAndSanitizeNode(node);
    if (!sanitized) {
      return {
        valid: false,
        error: 'Invalid node structure detected',
      };
    }
    sanitizedNodes.push(sanitized);
  }

  // Validate each edge
  const sanitizedEdges: SpexlyEdge[] = [];
  const nodeIds = new Set(sanitizedNodes.map(n => n.id));

  for (const edge of edges) {
    const sanitized = validateEdge(edge);
    if (!sanitized) {
      return {
        valid: false,
        error: 'Invalid edge structure detected',
      };
    }

    // Verify edge references valid nodes
    if (!nodeIds.has(sanitized.source) || !nodeIds.has(sanitized.target)) {
      return {
        valid: false,
        error: 'Edge references non-existent node',
      };
    }

    sanitizedEdges.push(sanitized);
  }

  return {
    valid: true,
    sanitizedNodes,
    sanitizedEdges,
  };
}

/**
 * Validates a project ID (UUID format)
 */
export function validateProjectId(id: unknown): ValidationResult {
  if (typeof id !== 'string') {
    return {
      valid: false,
      error: 'Project ID must be a string',
    };
  }

  // UUID v4 pattern
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(id)) {
    return {
      valid: false,
      error: 'Invalid project ID format',
    };
  }

  return {
    valid: true,
    sanitized: id,
  };
}
