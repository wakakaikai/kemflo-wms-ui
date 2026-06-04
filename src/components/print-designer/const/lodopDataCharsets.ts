/**
 * Lodop DataCharset values for barcodes / QR (C-Lodop manual).
 * @see SET_PRINT_STYLEA(0, "DataCharset", "...")
 */
export const LODOP_DATA_CHARSETS = [
  'ANSI',
  'UTF-8',
  'GB2312',
  'GBK',
  'BIG5',
  'EUC-JP',
  'UTF-7',
  'UNICODE',
  'UTF-16',
  'UTF-16BE',
  'SHIFT-JIS',
  'Windows-874',
  'Windows-1250',
  'Windows-1251',
  'Windows-1253',
  'Windows-1254',
  'Windows-1255',
  'Windows-1256',
  'Windows-1257',
  'Windows-1258'
] as const;

export type LodopDataCharset = (typeof LODOP_DATA_CHARSETS)[number];

export function isLodopDataCharset(value: string | undefined): value is LodopDataCharset {
  return !!value && (LODOP_DATA_CHARSETS as readonly string[]).includes(value);
}
