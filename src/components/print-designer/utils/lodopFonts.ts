import { normalizeFontFamilyName } from '../const/printFonts';

/**
 * C-Lodop has no stable public API to list all fonts; probe optional extensions.
 */

export function tryGetLodopFontFamilies(): string[] {
  try {
    const getCLodop = (window as unknown as { getCLodop?: () => unknown }).getCLodop;
    if (typeof getCLodop !== 'function') return [];

    const LODOP = getCLodop() as Record<string, unknown> | null | undefined;
    if (!LODOP || typeof LODOP !== 'object') return [];

    const pushNormalized = (rawList: string[]) => {
      const out = new Set<string>();
      for (const raw of rawList) {
        const n = normalizeFontFamilyName(raw);
        if (n) out.add(n);
      }
      return [...out].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    };

    const enumerate = (countFn: unknown, nameFn: unknown): string[] | null => {
      if (typeof countFn !== 'function' || typeof nameFn !== 'function') return null;
      const rawN = (countFn as () => unknown).call(LODOP);
      const n = typeof rawN === 'number' ? rawN : Number(rawN);
      if (!Number.isFinite(n) || n <= 0) return null;
      const list: string[] = [];
      const max = Math.min(Math.floor(n), 8000);
      for (let i = 0; i < max; i++) {
        const raw = (nameFn as (idx: number) => unknown).call(LODOP, i);
        const s = String(raw ?? '').trim();
        if (s) list.push(s);
      }
      return list.length ? pushNormalized(list) : null;
    };

    const pairs: [string, string][] = [
      ['GET_FONT_COUNT', 'GET_FONT_NAME'],
      ['GET_SYSTEM_FONT_COUNT', 'GET_SYSTEM_FONT_NAME'],
      ['GET_SYSFONT_COUNT', 'GET_SYSFONT_NAME']
    ];

    for (const [ck, nk] of pairs) {
      const list = enumerate(LODOP[ck], LODOP[nk]);
      if (list?.length) return list;
    }

    const createFontList = LODOP.Create_Font_List ?? LODOP.CreateFont_List;
    if (typeof createFontList === 'function') {
      const sel = document.createElement('select');
      try {
        (createFontList as (el: HTMLSelectElement) => void).call(LODOP, sel);
      } catch {
        return [];
      }
      const names = [...sel.options]
        .map((o) => (o.value || o.textContent || '').trim())
        .filter(Boolean);
      sel.remove();
      if (names.length) return pushNormalized(names);
    }
  } catch {
    /* ignore */
  }
  return [];
}
