import '@/utils/LodopFuncs';
import type { LodopLicenseInfo, PrintTemplate, PrintTemplateItem } from '../types';
import {
  escapeHtml,
  resolveHtmlItemValue,
  resolvePlaceholders,
  resolveTextItemValue
} from '../utils/resolvePlaceholders';
import {
  applyLodopBarcodeStyle,
  applyLodopBarcodeTextStyle,
  applyLodopPositionStyle
} from '../utils/applyLodopItemStyle';
import {
  formatBarcodeValueForLodop,
  minBarcodeSizeMm,
  resolveBarcodeItemValue
} from '../utils/lodopBarcodeValue';
import { getLineOrientation, type LineOrientation } from '../utils/lineItems';
import { lodopTableCellBorderStyle } from '../utils/itemBorderStyle';

/** Lodop instance shape (CLodop) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LodopInstance = any;

let cachedLicense: LodopLicenseInfo | null = null;

function pxToMm(px: number, pxLen: number, mmLen: number): number {
  if (!pxLen) return 0;
  return (px / pxLen) * mmLen;
}

function mmStr(v: unknown): string {
  const n = typeof v === 'number' ? v : Number(v);
  const safe = Number.isFinite(n) ? Math.max(0, n) : 0;
  return `${safe.toFixed(3)}mm`;
}

/** Wait until C-Lodop script is loaded (LodopFuncs side effect). */
export async function waitForLodopReady(timeoutMs = 5000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (getLodopInstance()) return true;
    await new Promise((r) => setTimeout(r, 120));
  }
  return !!getLodopInstance();
}

/** Prefer C-Lodop; do not call legacy getLodop() (it may replace document.body when unavailable). */
function getLodopInstance(): LodopInstance | null {
  try {
    const win = window as unknown as { getCLodop?: () => LodopInstance };
    if (typeof win.getCLodop === 'function') {
      const lodop = win.getCLodop();
      if (lodop) return lodop;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function alignmentToLodop(a?: string): number {
  if (a === 'center') return 2;
  if (a === 'right') return 3;
  return 1;
}

function applyItemStyle(LODOP: LodopInstance, item: PrintTemplateItem) {
  const s = item.style || {};
  const fontName = s.FontName?.trim();
  if (fontName) LODOP.SET_PRINT_STYLEA(0, 'FontName', fontName);
  if (s.FontSize != null) LODOP.SET_PRINT_STYLEA(0, 'FontSize', s.FontSize);
  else LODOP.SET_PRINT_STYLEA(0, 'FontSize', 9);
  if (s.FontColor) LODOP.SET_PRINT_STYLEA(0, 'FontColor', s.FontColor);
  LODOP.SET_PRINT_STYLEA(0, 'Bold', s.Bold ? 1 : 0);
  LODOP.SET_PRINT_STYLEA(0, 'Italic', s.Italic ? 1 : 0);
  LODOP.SET_PRINT_STYLEA(0, 'Underline', s.Underline ? 1 : 0);
  LODOP.SET_PRINT_STYLEA(0, 'StrikeOut', s.StrikeOut ? 1 : 0);
  if (s.HighlightColor) {
    try {
      LODOP.SET_PRINT_STYLEA(0, 'BackColor', s.HighlightColor);
    } catch {
      /* older Lodop builds may not support BackColor */
    }
  }
  LODOP.SET_PRINT_STYLEA(0, 'Alignment', alignmentToLodop(s.Alignment));
  if (s.AutoHeight != null) LODOP.SET_PRINT_STYLEA(0, 'AutoHeight', s.AutoHeight ? 1 : 0);
  if (s.BottomMargin != null) LODOP.SET_PRINT_STYLEA(0, 'BottomMargin', s.BottomMargin);
}

function buildTableHtml(item: PrintTemplateItem, data: Record<string, unknown>): string {
  const cols = item.columnsAttr || [];
  let rows: Record<string, unknown>[] = [];
  if (item.name && Array.isArray(data[item.name])) {
    rows = data[item.name] as Record<string, unknown>[];
  } else if (Array.isArray(item.defaultValue)) {
    rows = item.defaultValue as Record<string, unknown>[];
  }
  const fs = item.style?.FontSize ?? 9;
  const fn = item.style?.FontName?.trim();
  const ff = fn ? `font-family:${JSON.stringify(fn)};` : '';
  const colCount = cols.length || 1;
  const rowCount = 1 + rows.length;
  let html = `<table cellspacing="0" cellpadding="4" style="border-collapse:collapse;font-size:${fs}pt;width:100%;${ff}">`;
  html += '<thead><tr>';
  for (let ci = 0; ci < cols.length; ci++) {
    const c = cols[ci];
    const cellStyle = lodopTableCellBorderStyle(item, 0, ci, rowCount, colCount);
    html += `<th style="text-align:center;${cellStyle}">${escapeHtml(c.title)}</th>`;
  }
  html += '</tr></thead><tbody>';
  for (let ri = 0; ri < rows.length; ri++) {
    const row = rows[ri];
    html += '<tr>';
    for (let ci = 0; ci < cols.length; ci++) {
      const c = cols[ci];
      const cellStyle = lodopTableCellBorderStyle(item, ri + 1, ci, rowCount, colCount);
      const cell =
        c.name && row[c.name] !== undefined
          ? String(row[c.name])
          : resolvePlaceholders(c.value, { ...data, ...row });
      html += `<td style="${cellStyle}">${escapeHtml(cell)}</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table>';
  return html;
}

function addLodopLine(
  LODOP: LodopInstance,
  temp: PrintTemplate,
  item: PrintTemplateItem,
  orient: LineOrientation
) {
  const pageH = temp.pageHeight > 0 ? temp.pageHeight : 297;
  const pageW = temp.pageWidth > 0 ? temp.pageWidth : 210;
  const topMm = pxToMm(item.top, temp.height, pageH);
  const leftMm = pxToMm(item.left, temp.width, pageW);
  const wMm = Math.max(pxToMm(item.width, temp.width, pageW), 0.5);
  const hMm = Math.max(pxToMm(item.height, temp.height, pageH), 0.5);
  const lineStyle = item.style?.LineStyle ?? 0;
  const lineWidth = item.style?.LineWidth ?? 1;
  const stroke = item.style?.BorderColor?.trim();
  const t = mmStr(topMm);
  const l = mmStr(leftMm);
  const mw = mmStr(wMm);
  const mh = mmStr(hMm);

  const applyStroke = () => {
    if (stroke) {
      try {
        LODOP.SET_PRINT_STYLEA(0, 'LineColor', stroke);
      } catch {
        /* some CLodop builds ignore LineColor on lines */
      }
    }
    applyLodopPositionStyle(LODOP, item);
  };

  try {
    if (typeof LODOP.ADD_PRINT_LINE === 'function') {
      let t1: string;
      let l1: string;
      let t2: string;
      let l2: string;
      if (orient === 'h') {
        const mid = topMm + hMm / 2;
        t1 = mmStr(mid);
        t2 = mmStr(mid);
        l1 = mmStr(leftMm);
        l2 = mmStr(leftMm + wMm);
      } else {
        const mid = leftMm + wMm / 2;
        l1 = mmStr(mid);
        l2 = mmStr(mid);
        t1 = mmStr(topMm);
        t2 = mmStr(topMm + hMm);
      }
      LODOP.ADD_PRINT_LINE(t1, l1, t2, l2, lineStyle, lineWidth);
      applyStroke();
      return;
    }
  } catch {
    /* fallback below */
  }

  const thin = mmStr(Math.max(0.2, lineWidth * 0.26));
  if (orient === 'h') {
    LODOP.ADD_PRINT_RECT(t, l, mw, thin, lineStyle, lineWidth);
  } else {
    LODOP.ADD_PRINT_RECT(t, l, thin, mh, lineStyle, lineWidth);
  }
  applyStroke();
}

function addOneItem(LODOP: LodopInstance, temp: PrintTemplate, item: PrintTemplateItem, data: Record<string, unknown>) {
  const pageH = temp.pageHeight > 0 ? temp.pageHeight : 297;
  const pageW = temp.pageWidth > 0 ? temp.pageWidth : 210;
  const top = pxToMm(item.top, temp.height, pageH);
  const left = pxToMm(item.left, temp.width, pageW);
  const w = pxToMm(item.width, temp.width, pageW);
  const h = pxToMm(item.height, temp.height, pageH);
  const t = mmStr(top);
  const l = mmStr(left);
  const mw = mmStr(w);
  const mh = mmStr(h);

  switch (item.type) {
    case 'braid-txt': {
      const text = resolveTextItemValue(item, data);
      LODOP.ADD_PRINT_TEXT(t, l, mw, mh, text);
      applyItemStyle(LODOP, item);
      applyLodopPositionStyle(LODOP, item);
      break;
    }
    case 'bar-code': {
      const codeType = item.style?.codeType || '128Auto';
      const rawVal = resolveBarcodeItemValue(item, data);
      const val = formatBarcodeValueForLodop(codeType, rawVal);
      const min = minBarcodeSizeMm(codeType);
      const wNum = parseFloat(mw);
      const hNum = parseFloat(mh);
      const barW = mmStr(Number.isFinite(wNum) && wNum >= min.w ? wNum : min.w);
      const barH = mmStr(Number.isFinite(hNum) && hNum >= min.h ? hNum : min.h);
      LODOP.ADD_PRINT_BARCODE(t, l, barW, barH, codeType, val);
      applyLodopBarcodeTextStyle(LODOP, item, codeType);
      applyLodopBarcodeStyle(LODOP, item, codeType);
      applyLodopPositionStyle(LODOP, item);
      break;
    }
    case 'braid-image': {
      let url = '';
      if (item.name && data[item.name]) url = String(data[item.name]);
      else url = resolvePlaceholders(item.value || '', data) || String(item.defaultValue || '');
      if (url) {
        LODOP.ADD_PRINT_IMAGE(t, l, mw, mh, url);
        LODOP.SET_PRINT_STYLEA(0, 'Stretch', 1);
      }
      applyLodopPositionStyle(LODOP, item);
      break;
    }
    case 'braid-rect':
    case 'braid-border': {
      const lineStyle = item.style?.LineStyle ?? 0;
      const lineWidth = item.style?.LineWidth ?? 1;
      LODOP.ADD_PRINT_RECT(t, l, mw, mh, lineStyle, lineWidth);
      applyLodopPositionStyle(LODOP, item);
      break;
    }
    case 'braid-ellipse': {
      const lineStyle = item.style?.LineStyle ?? 0;
      const lineWidth = item.style?.LineWidth ?? 1;
      LODOP.ADD_PRINT_ELLIPSE(t, l, mw, mh, lineStyle, lineWidth);
      applyLodopPositionStyle(LODOP, item);
      break;
    }
    case 'braid-hline': {
      addLodopLine(LODOP, temp, item, 'h');
      break;
    }
    case 'braid-vline': {
      addLodopLine(LODOP, temp, item, 'v');
      break;
    }
    case 'braid-html': {
      const lineOrient = getLineOrientation(item);
      if (lineOrient) {
        addLodopLine(LODOP, temp, item, lineOrient);
        break;
      }
      const html = resolveHtmlItemValue(item, data);
      LODOP.ADD_PRINT_HTM(t, l, mw, mh, html);
      applyItemStyle(LODOP, item);
      applyLodopPositionStyle(LODOP, item);
      break;
    }
    case 'braid-table': {
      const html = buildTableHtml(item, data);
      LODOP.ADD_PRINT_HTM(t, l, mw, mh, html);
      applyItemStyle(LODOP, item);
      applyLodopPositionStyle(LODOP, item);
      break;
    }
    default:
      break;
  }
}

/**
 * Render one logical page (one data row) onto the current LODOP job.
 */
export function renderTemplatePage(LODOP: LodopInstance, temp: PrintTemplate, data: Record<string, unknown>) {
  const items = [...temp.tempItems].sort((a, b) => (a.style?.zIndex ?? 0) - (b.style?.zIndex ?? 0));
  for (const item of items) {
    try {
      addOneItem(LODOP, temp, item, data);
    } catch (err) {
      console.warn('[print-designer] skip item on print', item.type, item.id, err);
    }
  }
}

/**
 * Build chunked datasets for auto-paginated table widgets.
 * If no table on the template has `paginate=true`, returns `[data]` (single page).
 * Otherwise, splits the rows of the first paginated table into chunks of `pageRows`
 * and produces one data clone per chunk (with the original array on `<name>` replaced
 * by the chunk). Other fields on the row are kept identical so headers / footers /
 * page numbers render the same.
 */
function buildPaginatedDatasets(
  temp: PrintTemplate,
  data: Record<string, unknown>
): Record<string, unknown>[] {
  const paginatedTable = temp.tempItems.find((it) => {
    if (it.type !== 'braid-table') return false;
    if (!it.style?.paginate) return false;
    if (!it.name) return false;
    return Array.isArray(data[it.name]);
  });
  if (!paginatedTable || !paginatedTable.name) return [data];

  const rows = data[paginatedTable.name] as unknown[];
  const perPage = Math.max(1, Math.floor(paginatedTable.style?.pageRows ?? 10));
  if (rows.length <= perPage) return [data];

  const pages: Record<string, unknown>[] = [];
  for (let i = 0; i < rows.length; i += perPage) {
    const slice = rows.slice(i, i + perPage);
    pages.push({ ...data, [paginatedTable.name]: slice });
  }
  return pages;
}

function initLodopJob(LODOP: LodopInstance, temp: PrintTemplate, taskName: string) {
  if (cachedLicense) {
    LODOP.SET_LICENSES(
      cachedLicense.strCompanyName,
      cachedLicense.strLicense,
      cachedLicense.strLicenseA || '',
      cachedLicense.strLicenseB || ''
    );
  }
  LODOP.PRINT_INIT(taskName || temp.title || 'print');
  const pageW = temp.pageWidth > 0 ? temp.pageWidth : 210;
  const pageH = temp.pageHeight > 0 ? temp.pageHeight : 297;
  LODOP.SET_PRINT_PAGESIZE(1, mmStr(pageW), mmStr(pageH), '');
}

export type LodopPrintApi = {
  setLicenses: (license: LodopLicenseInfo | null | undefined) => void;
  previewTemp: (temp: PrintTemplate) => void;
  preview: (temp: PrintTemplate, data: Record<string, unknown>[]) => void;
  print: (temp: PrintTemplate, data: Record<string, unknown>[]) => void;
};

export const lodopPrint: LodopPrintApi = {
  setLicenses(license) {
    cachedLicense = license || null;
  },

  previewTemp(temp) {
    this.preview(temp, [{}]);
  },

  preview(temp, data) {
    const LODOP = getLodopInstance();
    if (!LODOP) {
      throw new Error('C-Lodop / Lodop is not available');
    }
    const rows = data?.length ? data : [{}];
    initLodopJob(LODOP, temp, 'preview');
    let pageIdx = 0;
    for (const row of rows) {
      const pages = buildPaginatedDatasets(temp, row);
      for (const page of pages) {
        if (pageIdx > 0) LODOP.NEWPAGE();
        renderTemplatePage(LODOP, temp, page);
        pageIdx += 1;
      }
    }
    LODOP.PREVIEW();
  },

  print(temp, data) {
    const LODOP = getLodopInstance();
    if (!LODOP) {
      throw new Error('C-Lodop / Lodop is not available');
    }
    const rows = data.length ? data : [{}];
    initLodopJob(LODOP, temp, 'print');
    let pageIdx = 0;
    for (const row of rows) {
      const pages = buildPaginatedDatasets(temp, row);
      for (const page of pages) {
        if (pageIdx > 0) LODOP.NEWPAGE();
        renderTemplatePage(LODOP, temp, page);
        pageIdx += 1;
      }
    }
    LODOP.PRINT();
  }
};
