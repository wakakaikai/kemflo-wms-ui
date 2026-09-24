/**
 * Print-template backend URLs and payload adapters.
 *
 * - Paths: override with env `VITE_PRINT_TEMPLATE_API_PREFIX` (default `/wms/printTemplate`, appended to axios baseURL).
 * - Payloads: if your API differs from default style, edit `printTemplateAdapter` below (avoid scattering parsers in views).
 */

import type { WidgetOption } from '@/components/print-designer/types';

export function getPrintTemplateApiPrefix(): string {
  const raw = import.meta.env.VITE_PRINT_TEMPLATE_API_PREFIX;
  const p = typeof raw === 'string' ? raw.trim() : '';
  return (p || '/wms/printTemplate').replace(/\/+$/, '');
}

export function printTemplateUrls() {
  const base = getPrintTemplateApiPrefix();
  return {
    list: `${base}/list`,
    detail: (code: string | number) => `${base}/${encodeURIComponent(String(code))}`,
    save: base,
    widgetOptions: `${base}/widgetOptions`,
    sampleData: `${base}/sampleData`,
    deletePath: (joinedIds: string) => `${base}/${joinedIds}`
  } as const;
}

export const printTemplateAdapter = {
  /** GET detail -> flatten `res.data` into template VO shape */
  mapDetailPayload(payload: unknown): Record<string, unknown> | null {
    if (!payload || typeof payload !== 'object') return null;
    const o = payload as Record<string, unknown>;
    // Example nested APIs:
    // const inner = o.data ?? o.record ?? o.result;
    // if (inner && typeof inner === 'object') return inner as Record<string, unknown>;
    return o;
  },

  /** GET sampleData -> preview data (single object or batch array) */
  mapSampleDataPayload(payload: unknown): Record<string, unknown>[] | null {
    if (Array.isArray(payload)) return payload as Record<string, unknown>[];
    if (!payload || typeof payload !== 'object') return null;
    const o = payload as Record<string, unknown>;
    const candidates = ['rows', 'list', 'records', 'data'] as const;
    for (const k of candidates) {
      const v = o[k];
      if (Array.isArray(v)) return v as Record<string, unknown>[];
      if (v && typeof v === 'object') return [v as Record<string, unknown>];
    }
    return [o];
  },

  /** GET widgetOptions/businessFields -> self-hosted designer palette fields */
  mapWidgetOptionsPayload(payload: unknown): WidgetOption[] | null {
    let rows: unknown[] | null = Array.isArray(payload) ? payload : null;
    if (!payload || typeof payload !== 'object') return null;
    if (!rows) {
      const o = payload as Record<string, unknown>;
      for (const k of ['rows', 'list', 'records', 'data'] as const) {
        const v = o[k];
        if (Array.isArray(v)) {
          rows = v;
          break;
        }
      }
    }
    if (!rows) return null;
    return rows
      .map((item): WidgetOption | null => {
        if (!item || typeof item !== 'object') return null;
        const row = item as Record<string, unknown>;
        if (row.type && row.title && row.value) return row as unknown as WidgetOption;
        const fieldKey = String(row.fieldKey ?? row.key ?? row.value ?? row.prop ?? '').trim();
        if (!fieldKey) return null;
        return {
          type: 'braid-txt',
          title: String(row.fieldLabel ?? row.label ?? row.name ?? fieldKey),
          value: `{${fieldKey}}`,
          name: fieldKey,
          category: 'common',
          width: 150,
          height: 30,
          isEdit: false
        };
      })
      .filter((item): item is WidgetOption => item !== null);
  },

  /** POST save body wrapper */
  mapSavePayload(vo: Record<string, unknown>): unknown {
    return vo;
  },

  /** Optional decode for `templateContent`; return undefined to use JSON.parse path */
  decodeTemplateContent(_raw: unknown): Record<string, unknown> | undefined {
    return undefined;
  }
};
