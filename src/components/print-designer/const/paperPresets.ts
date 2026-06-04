/** Quick paper sizes (mm). */

/** Canvas px per mm (legacy default: 750px canvas @ 210mm A4 width). */
export const CANVAS_PX_PER_MM = 750 / 210;

export type PaperPresetDef = {  id: string;
  widthMm: number;
  heightMm: number;
};

export const PAPER_QUICK_PRESETS: readonly PaperPresetDef[] = [
  { id: 'a4', widthMm: 210, heightMm: 297 },
  { id: 'a4Landscape', widthMm: 297, heightMm: 210 },
  { id: 'a5', widthMm: 148, heightMm: 210 },
  { id: 'a5Landscape', widthMm: 210, heightMm: 148 },
  { id: 'a3', widthMm: 297, heightMm: 420 },
  { id: 'b5', widthMm: 176, heightMm: 250 },
  { id: 'letter', widthMm: 216, heightMm: 279 },
  { id: 'legal', widthMm: 216, heightMm: 356 },
  { id: 'continuous241', widthMm: 241, heightMm: 280 },
  { id: 'label80x60', widthMm: 80, heightMm: 60 },
  { id: 'label100x60', widthMm: 100, heightMm: 60 },
  { id: 'label100x150', widthMm: 100, heightMm: 150 }
];

const MATCH_TOLERANCE_MM = 1;

export function findMatchingPaperPreset(widthMm: number, heightMm: number): string | null {
  for (const p of PAPER_QUICK_PRESETS) {
    if (
      Math.abs(widthMm - p.widthMm) <= MATCH_TOLERANCE_MM &&
      Math.abs(heightMm - p.heightMm) <= MATCH_TOLERANCE_MM
    ) {
      return p.id;
    }
  }
  return null;
}

export function getPaperPresetById(id: string): PaperPresetDef | undefined {
  return PAPER_QUICK_PRESETS.find((p) => p.id === id);
}

export function canvasPxFromPaper(widthMm: number, heightMm: number): { width: number; height: number } {
  const w = Math.max(10, widthMm);
  const h = Math.max(10, heightMm);
  return {
    width: Math.max(100, Math.round(w * CANVAS_PX_PER_MM)),
    height: Math.max(100, Math.round(h * CANVAS_PX_PER_MM))
  };
}

/** Apply preset mm size and sync design canvas pixels from paper. */
export function applyPaperPresetMm(
  pageWidth: number,
  pageHeight: number
): { pageWidth: number; pageHeight: number; width: number; height: number } {
  const pw = Math.max(10, pageWidth);
  const ph = Math.max(10, pageHeight);
  const px = canvasPxFromPaper(pw, ph);
  return { pageWidth: pw, pageHeight: ph, width: px.width, height: px.height };
}
