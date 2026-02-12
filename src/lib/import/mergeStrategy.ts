import type { SpexlyNodeType, NodeFieldUpdate } from '@/types/nodes';

/** Fields that are never overwritten by smart import */
const PROTECTED_FIELDS = new Set([
  'expanded',
  'completed',
  'version',
  'tags',
  'estimatedHours',
]);

/** Primary name fields — user's chosen name is always preserved */
const PRIMARY_NAME_FIELDS = new Set([
  'featureName',
  'screenName',
  'appName',
  'toolName',
]);

/** Returns true if a field value is empty (should be filled) */
export function isFieldEmpty(value: unknown): boolean {
  if (value === '' || value === null || value === undefined) return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

/** Returns list of non-empty field names on a node's data */
export function getPopulatedFields(data: Record<string, unknown>): string[] {
  return Object.entries(data)
    .filter(([, value]) => !isFieldEmpty(value))
    .map(([key]) => key);
}

/**
 * Builds a NodeFieldUpdate for a matched existing node.
 * Only fills fields that are currently empty, skipping protected and primary name fields.
 * Returns null if nothing to fill.
 */
export function buildFieldUpdate(
  nodeId: string,
  nodeType: SpexlyNodeType,
  populatedFields: string[],
  aiData: Record<string, unknown>
): NodeFieldUpdate | null {
  const populated = new Set(populatedFields);
  const fieldsToFill: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(aiData)) {
    // Skip protected fields
    if (PROTECTED_FIELDS.has(key)) continue;

    // Skip primary name fields (user's name preserved)
    if (PRIMARY_NAME_FIELDS.has(key)) continue;

    // Only fill if the field is currently empty on the existing node
    if (populated.has(key)) continue;

    // Only fill if the AI actually provided a value
    if (isFieldEmpty(value)) continue;

    fieldsToFill[key] = value;
  }

  if (Object.keys(fieldsToFill).length === 0) return null;

  return { nodeId, nodeType, fieldsToFill };
}
