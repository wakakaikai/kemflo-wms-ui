/** Chromium Font Access API �� lists fonts installed on the user machine (needs HTTPS + permission). */

export function supportsLocalFontsQuery(): boolean {
  return typeof (globalThis as unknown as { queryLocalFonts?: unknown }).queryLocalFonts === 'function';
}

export async function queryInstalledFontFamilies(): Promise<string[]> {
  const win = globalThis as unknown as {
    queryLocalFonts?: () => Promise<Array<{ family: string }>>;
  };
  if (typeof win.queryLocalFonts !== 'function') return [];
  const faces = await win.queryLocalFonts();
  const families = new Set<string>();
  for (const f of faces) {
    if (f.family && typeof f.family === 'string') families.add(f.family);
  }
  return [...families].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}
