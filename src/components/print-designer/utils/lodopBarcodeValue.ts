import { is2dBarcodeType } from '../const/lodopBarcodeTypes';
import { resolveTextItemValue } from './resolvePlaceholders';
import type { PrintTemplateItem } from '../types';

function digitsOnly(s: string): string {
  const d = s.replace(/\D/g, '');
  return d.length ? d : '0';
}

/** EAN-13??12 ????????Lodop ?????????????????13 ???????????????????????????? 0 */
function formatEan13(v: string): string {
  const d = digitsOnly(v);
  if (d.length === 13) return d;
  if (d.length === 12) return d;
  if (d.length > 13) return d.slice(0, 13);
  return d.padStart(12, '0').slice(-12);
}

/** EAN-8??7 ???????? 8 ???????? */
function formatEan8(v: string): string {
  const d = digitsOnly(v);
  if (d.length >= 8) return d.slice(0, 8);
  if (d.length === 7) return d;
  return d.padStart(7, '0').slice(-7);
}

/** UPC-A??12 ???????????????????? 0 */
function formatUpcA(v: string): string {
  const d = digitsOnly(v);
  if (d.length >= 12) return d.slice(0, 12);
  return d.padStart(12, '0').slice(-12);
}

const DEMO_1D = '1234567890128';
const DEMO_2D = 'SN-DEMO-001';

/** Resolve barcode content for preview/print (same rules as text items). */
export function resolveBarcodeItemValue(item: PrintTemplateItem, data: Record<string, unknown>): string {
  return resolveTextItemValue(item, data).trim();
}

/**
 * Format value for Lodop ADD_PRINT_BARCODE to avoid "barcode error".
 * @see C-Lodop PrintSample11
 */
export function formatBarcodeValueForLodop(codeType: string | undefined, raw: string): string {
  const type = (codeType || '128Auto').trim();
  let v = raw.trim();

  if (!v) {
    v = is2dBarcodeType(type) ? DEMO_2D : DEMO_1D;
  }

  if (is2dBarcodeType(type)) {
    return v;
  }

  switch (type) {
    case 'EAN8':
      return formatEan8(v);
    case 'EAN13':
      return formatEan13(v);
    case 'EAN128A':
    case 'EAN128B':
    case 'EAN128C':
      return digitsOnly(v) || '0';
    case 'UPC_A':
      return formatUpcA(v);
    case 'UPC_E0':
    case 'UPC_E1':
      return digitsOnly(v).padStart(8, '0').slice(-8);
    case 'UPCsupp2':
      return digitsOnly(v).padStart(2, '0').slice(-2);
    case 'UPCsupp5':
      return digitsOnly(v).padStart(5, '0').slice(-5);
    case 'Codabar':
      return v.toUpperCase().replace(/[^0-9A-D\-\.\ \$\/:+]/g, '') || 'A0000000';
    case 'MSI':
    case 'PostNet':
      return digitsOnly(v);
    case 'Code39':
    case '39Extended':
      return v.toUpperCase().replace(/[^0-9A-Z\-\.\ \$\/+%]/g, '') || 'CODE39';
    case 'Code93':
    case '93Extended':
      return v.toUpperCase().replace(/[^\x00-\x7F]/g, '') || '93';
    default:
      return v;
  }
}

/** Minimum barcode box size (mm) for stable Lodop rendering */
export function minBarcodeSizeMm(codeType: string | undefined): { w: number; h: number } {
  if (is2dBarcodeType(codeType)) {
    return { w: 12, h: 12 };
  }
  return { w: 20, h: 6 };
}
