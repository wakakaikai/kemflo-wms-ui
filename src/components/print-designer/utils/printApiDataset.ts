import type { PrintApiDatasetConfig, PrintApiDatasetField } from '@/components/print-designer/types';
import request from '@/utils/request';

export function createEmptyPrintApiDataset(): PrintApiDatasetConfig {
  return {
    code: '',
    name: '',
    isCollection: true,
    isPaginated: false,
    method: 'get',
    converter: '',
    url: '',
    fields: [],
    params: []
  };
}

/** Replace `${param}` placeholders using dataset.params[].defaultValue */
export function substituteDatasetUrl(url: string, params: PrintApiDatasetConfig['params']): string {
  let out = url.trim();
  for (const p of params) {
    const safe = p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`\\$\\{${safe}\\}`, 'g');
    out = out.replace(re, p.defaultValue ?? '');
  }
  return out;
}

function extractListPayload(body: Record<string, unknown>): unknown {
  const rows = body.rows;
  const data = body.data;
  if (Array.isArray(rows)) return rows;
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.records)) return d.records;
    if (Array.isArray(d.list)) return d.list;
    return data;
  }
  return body;
}

export function normalizeDatasetRows(payload: unknown, isCollection: boolean): Record<string, unknown>[] {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (typeof payload === 'object') {
    const row = payload as Record<string, unknown>;
    return isCollection ? [row] : [row];
  }
  return [];
}

export function inferDatasetFields(sampleRow: Record<string, unknown>): PrintApiDatasetField[] {
  return Object.entries(sampleRow).map(([k, v], i) => ({
    fieldName: k,
    sort: i + 1,
    fieldText: k,
    type: inferFieldType(v),
    dictCode: '',
    query: false,
    queryMode: '',
    queryDefault: '',
    queryDateFormat: '',
    paramConfig: ''
  }));
}

function inferFieldType(v: unknown): string {
  if (v == null) return 'string';
  if (typeof v === 'number') return 'number';
  if (typeof v === 'boolean') return 'boolean';
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return 'date';
  return 'string';
}

/** Split `/path?a=1` into pathname + plain query params object for axios. */
export function splitUrlPathAndQuery(full: string): { pathname: string; query: Record<string, string> } {
  const [pathPart, qs = ''] = full.split('?');
  const pathname = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
  const query: Record<string, string> = {};
  const sp = new URLSearchParams(qs);
  sp.forEach((val, key) => {
    query[key] = val;
  });
  return { pathname, query };
}

/** Execute dataset request (Ruoyi request wrapper: auth + baseURL). */
export async function fetchPrintDatasetRows(ds: PrintApiDatasetConfig): Promise<Record<string, unknown>[]> {
  const rawUrl = substituteDatasetUrl(ds.url, ds.params);
  const { pathname, query } = splitUrlPathAndQuery(rawUrl);
  const method = (ds.method || 'get').toLowerCase() === 'post' ? 'post' : 'get';

  const res = (await request({
    url: pathname,
    method,
    params: Object.keys(query).length ? query : undefined,
    data: method === 'post' ? {} : undefined
  })) as Record<string, unknown>;

  const payload = extractListPayload(res);
  return normalizeDatasetRows(payload, ds.isCollection);
}
