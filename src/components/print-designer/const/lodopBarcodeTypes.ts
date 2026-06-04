/** Lodop ADD_PRINT_BARCODE types (C-Lodop / PrintSample11) */
export interface LodopBarcodeTypeOption {
  value: string;
}

export interface LodopBarcodeTypeGroup {
  /** i18n key under printDesigner.barcodeTypes */
  groupKey: string;
  options: LodopBarcodeTypeOption[];
}

/** 1D barcodes (24 types) */
export const LODOP_BARCODE_1D_GROUPS: LodopBarcodeTypeGroup[] = [
  {
    groupKey: 'code128',
    options: [{ value: '128A' }, { value: '128B' }, { value: '128C' }, { value: '128Auto' }]
  },
  {
    groupKey: 'ean',
    options: [{ value: 'EAN8' }, { value: 'EAN13' }, { value: 'EAN128A' }, { value: 'EAN128B' }, { value: 'EAN128C' }]
  },
  {
    groupKey: 'upc',
    options: [{ value: 'UPC_A' }, { value: 'UPC_E0' }, { value: 'UPC_E1' }, { value: 'UPCsupp2' }, { value: 'UPCsupp5' }]
  },
  {
    groupKey: 'code39',
    options: [{ value: 'Code39' }, { value: '39Extended' }, { value: 'Code93' }, { value: '93Extended' }]
  },
  {
    groupKey: 'twoOfFive',
    options: [{ value: '2_5interleaved' }, { value: '2_5industrial' }, { value: '2_5matrix' }]
  },
  {
    groupKey: 'other1d',
    options: [{ value: 'MSI' }, { value: 'PostNet' }, { value: 'Codabar' }]
  }
];

/** 2D codes (QR / PDF417 / DataMatrix) */
export const LODOP_BARCODE_2D_GROUPS: LodopBarcodeTypeGroup[] = [
  {
    groupKey: 'qrcode2d',
    options: [{ value: 'QRCode' }, { value: 'PDF417' }, { value: 'DataMatrix' }]
  }
];

export const LODOP_BARCODE_TYPE_GROUPS: LodopBarcodeTypeGroup[] = [...LODOP_BARCODE_1D_GROUPS, ...LODOP_BARCODE_2D_GROUPS];

export const LODOP_BARCODE_1D_VALUES = LODOP_BARCODE_1D_GROUPS.flatMap((g) => g.options.map((o) => o.value));

export const LODOP_BARCODE_2D_VALUES = LODOP_BARCODE_2D_GROUPS.flatMap((g) => g.options.map((o) => o.value));

export const LODOP_BARCODE_TYPE_VALUES = [...LODOP_BARCODE_1D_VALUES, ...LODOP_BARCODE_2D_VALUES];

export type BarcodeKind = '1d' | '2d';

export function is2dBarcodeType(codeType: string | undefined): boolean {
  return !!codeType && LODOP_BARCODE_2D_VALUES.includes(codeType);
}

export function is1dBarcodeType(codeType: string | undefined): boolean {
  return !!codeType && LODOP_BARCODE_1D_VALUES.includes(codeType);
}

export function barcodeKindOf(codeType: string | undefined): BarcodeKind {
  return is2dBarcodeType(codeType) ? '2d' : '1d';
}

export function defaultCodeTypeForKind(kind: BarcodeKind): string {
  return kind === '2d' ? 'QRCode' : '128Auto';
}

export function isLodopBarcodeType(value: string | undefined): boolean {
  return !!value && LODOP_BARCODE_TYPE_VALUES.includes(value);
}
