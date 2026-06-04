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

  /** GET sampleData -> preview rows */
  mapSampleDataPayload(payload: unknown): Record<string, unknown>[] | null {
    if (Array.isArray(payload)) return payload as Record<string, unknown>[];
    if (!payload || typeof payload !== 'object') return null;
    const o = payload as Record<string, unknown>;
    const candidates = ['rows', 'list', 'records', 'data'] as const;
    for (const k of candidates) {
      const v = o[k];
      if (Array.isArray(v)) return v as Record<string, unknown>[];
    }
    return null;
  },

  /** GET widgetOptions -> palette array */
  mapWidgetOptionsPayload(payload: unknown): WidgetOption[] | null {
    if (Array.isArray(payload)) return payload as WidgetOption[];
    if (!payload || typeof payload !== 'object') return null;
    const o = payload as Record<string, unknown>;
    for (const k of ['rows', 'list', 'data'] as const) {
      const v = o[k];
      if (Array.isArray(v)) return v as WidgetOption[];
    }
    return null;
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
