const BULLET_PREFIX = /^(\s*[-*•]\s+|\s*\d+[\.\)]\s+)/;

const METADATA_PREFIXES = [
  'phase',
  'owner',
  'plan item id',
  'plan item',
  'linked',
  'linked to',
  'metadata',
];

function normalizeScalarToken(value: string): string {
  return value
    .trim()
    .replace(BULLET_PREFIX, '')
    .replace(/^["'`]+|["'`]+$/g, '')
    .trim();
}

function isMetadataLikeToken(value: string): boolean {
  const lower = value.toLowerCase();
  return METADATA_PREFIXES.some((prefix) => lower.startsWith(`${prefix}:`));
}

function isGarbageToken(value: string): boolean {
  if (!value) return true;
  const lower = value.toLowerCase();
  if (lower === '[object object]' || lower === 'undefined' || lower === 'null') return true;
  if (isMetadataLikeToken(value)) return true;

  // Skip object/array syntax and JSON property fragments.
  if (
    value.startsWith('{') ||
    value.endsWith('}') ||
    value.startsWith('[') ||
    value.endsWith(']') ||
    value.includes('":') ||
    value.includes("':")
  ) {
    return true;
  }

  return false;
}

function extractTokenFromObject(item: unknown, objectKeys: string[]): string | null {
  if (!item || typeof item !== 'object') return null;
  const record = item as Record<string, unknown>;
  for (const key of objectKeys) {
    if (typeof record[key] === 'string') {
      const token = normalizeScalarToken(record[key]);
      if (!isGarbageToken(token)) return token;
    }
  }
  return null;
}

function splitFreeText(raw: string): string[] {
  return raw
    .split(/[\n,;]/)
    .map(normalizeScalarToken)
    .filter((token) => !isGarbageToken(token));
}

function isTableDividerLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (
    /^[-+\s|:]+$/.test(trimmed) ||
    /^[┌┬┐├┼┤└┴┘─│\s]+$/.test(trimmed)
  ) {
    return true;
  }
  return false;
}

function extractTableCells(line: string): string[] {
  if (!line.includes('|') && !line.includes('│')) return [];
  return line
    .split(/[|│]/)
    .map((cell) => cell.trim())
    .filter(Boolean);
}

function normalizeFeatureName(name: string): string {
  const base = normalizeScalarToken(name);
  if (!base) return '';
  if (isMetadataLikeToken(base)) return '';

  // Keep concise feature labels when details are included inline.
  for (const delimiter of [' — ', ' - ', ': ']) {
    const idx = base.indexOf(delimiter);
    if (idx > 2) {
      const candidate = base.slice(0, idx).trim();
      if (candidate.length >= 3) return candidate;
    }
  }

  return base;
}

function parseScreenLines(raw: string): string[] {
  const items: string[] = [];
  for (const line of raw.split('\n')) {
    if (isTableDividerLine(line)) continue;
    const cells = extractTableCells(line);
    if (cells.length >= 2) {
      const firstCell = cells[0].toLowerCase();
      const secondCell = normalizeScalarToken(cells[1]);
      if (
        firstCell === '#' ||
        firstCell === 'screen' ||
        secondCell.toLowerCase() === 'screen'
      ) {
        continue;
      }
      if (secondCell && !isGarbageToken(secondCell)) {
        items.push(secondCell);
      }
      continue;
    }

    for (const segment of line.split(/[;,]/)) {
      const token = normalizeFeatureName(segment);
      if (token && !isGarbageToken(token)) {
        items.push(token);
      }
    }
  }

  return items;
}

function parseFeatureLines(raw: string): string[] {
  const items: string[] = [];
  for (const line of raw.split('\n')) {
    if (isTableDividerLine(line)) continue;
    for (const segment of line.split(/[;,]/)) {
      const token = normalizeFeatureName(segment);
      if (token && !isGarbageToken(token)) {
        items.push(token);
      }
    }
  }
  return items;
}

function dedupeCaseInsensitive(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function extractItemsFromJson(raw: string, objectKeys: string[]): string[] {
  const input = raw.trim();
  if (!input) return [];

  const fromJson: string[] = [];
  try {
    const parsed = JSON.parse(input) as unknown;
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (typeof item === 'string') {
          const token = normalizeScalarToken(item);
          if (!isGarbageToken(token)) fromJson.push(token);
          continue;
        }
        const fromObject = extractTokenFromObject(item, objectKeys);
        if (fromObject) fromJson.push(fromObject);
      }
    }
  } catch {
    // Not JSON input.
  }
  return fromJson;
}

export function normalizeItemList(raw: string, objectKeys: string[]): string[] {
  const input = raw.trim();
  if (!input) return [];

  const fromJson = extractItemsFromJson(raw, objectKeys);
  const normalized = fromJson.length > 0 ? fromJson : splitFreeText(raw);
  return dedupeCaseInsensitive(normalized);
}

export function normalizeFeatureList(raw: string): string[] {
  const fromJson = extractItemsFromJson(raw, ['featureName', 'name', 'title', 'label']);
  if (fromJson.length > 0) {
    return dedupeCaseInsensitive(fromJson.map(normalizeFeatureName).filter(Boolean));
  }
  return dedupeCaseInsensitive(parseFeatureLines(raw));
}

export function normalizeScreenList(raw: string): string[] {
  const fromJson = extractItemsFromJson(raw, ['screenName', 'name', 'title', 'page', 'route']);
  if (fromJson.length > 0) {
    return dedupeCaseInsensitive(fromJson.map(normalizeFeatureName).filter(Boolean));
  }
  return dedupeCaseInsensitive(parseScreenLines(raw));
}
