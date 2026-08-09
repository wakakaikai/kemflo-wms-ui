export interface KeyValueRow {
  key: string;
  value: string;
}

export function mapToKeyValueRows(value: unknown): KeyValueRow[] {
  if (Array.isArray(value)) {
    const rows = value
      .map((item) => {
        if (item && typeof item === 'object' && 'key' in item) {
          const row = item as { key?: string; value?: string };
          return { key: row.key ?? '', value: row.value ?? '' };
        }
        return null;
      })
      .filter(Boolean) as KeyValueRow[];
    return rows.length ? rows : [{ key: '', value: '' }];
  }

  let map: Record<string, unknown> | null = null;
  if (value && typeof value === 'object') {
    map = value as Record<string, unknown>;
  } else if (typeof value === 'string' && value.trim()) {
    try {
      map = JSON.parse(value);
    } catch {
      map = null;
    }
  }

  if (!map || typeof map !== 'object') {
    return [{ key: '', value: '' }];
  }

  const rows = Object.entries(map).map(([key, val]) => ({
    key,
    value: val == null ? '' : String(val),
  }));
  return rows.length ? rows : [{ key: '', value: '' }];
}

export function keyValueRowsToMap(rows: KeyValueRow[]): Record<string, string> {
  const result: Record<string, string> = {};
  (rows || []).forEach(({ key, value }) => {
    const k = key?.trim();
    if (k) result[k] = value ?? '';
  });
  return result;
}
