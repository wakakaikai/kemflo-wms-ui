import type { PrintTemplateItem, WidgetOption } from '../types';

/** Lodop ADD_PRINT_ELLIPSE palette entries (Top,Left,Width,Height,LineStyle,LineWidth). */
export const SHAPE_WIDGET_OPTIONS: WidgetOption[] = [
  {
    category: 'layout',
    type: 'braid-ellipse',
    title: '',
    titleKey: 'printDesigner.widgets.ellipse',
    value: '',
    defaultValue: '',
    width: 100,
    height: 60,
    resizable: true,
    style: { BorderColor: '#303133', LineWidth: 1, LineStyle: 0, FillColor: 'transparent' }
  }
];

/** Hollow border frame (drag from palette) */
export const BORDER_FRAME_WIDGET: WidgetOption = {
  category: 'layout',
  type: 'braid-border',
  title: '',
  titleKey: 'printDesigner.widgets.borderFrame',
  value: '',
  defaultValue: '',
  width: 200,
  height: 120,
  resizable: true,
  style: {
    borderPreset: 'all',
    BorderColor: '#303133',
    LineWidth: 1,
    LineStyle: 0,
    FillColor: 'transparent'
  }
};

/** Lodop ADD_PRINT_LINE ?? horizontal / vertical rules */
export const LINE_WIDGET_OPTIONS: WidgetOption[] = [
  {
    category: 'layout',
    type: 'braid-hline',
    title: '',
    titleKey: 'printDesigner.widgets.horizontalRule',
    value: '',
    defaultValue: '',
    width: 220,
    height: 8,
    resizable: true,
    style: { BorderColor: '#303133', LineWidth: 1, LineStyle: 0 }
  },
  {
    category: 'layout',
    type: 'braid-vline',
    title: '',
    titleKey: 'printDesigner.widgets.verticalRule',
    value: '',
    defaultValue: '',
    width: 8,
    height: 120,
    resizable: true,
    style: { BorderColor: '#303133', LineWidth: 1, LineStyle: 0 }
  }
];

function migrateLineWidgetOption(w: WidgetOption): WidgetOption {
  const tk = w.titleKey || '';
  if (w.type === 'braid-html' && tk.includes('horizontalRule')) {
    return {
      ...w,
      type: 'braid-hline',
      category: 'layout',
      value: '',
      defaultValue: '',
      style: {
        BorderColor: w.style?.BorderColor || '#303133',
        LineWidth: w.style?.LineWidth ?? 1,
        LineStyle: w.style?.LineStyle ?? 0,
        zIndex: w.style?.zIndex
      }
    };
  }
  if (w.type === 'braid-html' && tk.includes('verticalRule')) {
    return {
      ...w,
      type: 'braid-vline',
      category: 'layout',
      value: '',
      defaultValue: '',
      style: {
        BorderColor: w.style?.BorderColor || '#303133',
        LineWidth: w.style?.LineWidth ?? 1,
        LineStyle: w.style?.LineStyle ?? 0,
        zIndex: w.style?.zIndex
      }
    };
  }
  if (w.type === 'braid-hline' || w.type === 'braid-vline') {
    return { ...w, category: 'layout' as const };
  }
  return w;
}

/** Ensure layout widgets (lines, ellipse, border) exist in the left palette. */
export function ensureShapePaletteWidgets(options: WidgetOption[]): WidgetOption[] {
  const out = options
    .filter((w) => w.type !== 'braid-rect')
    .map((w) => {
      const migrated = migrateLineWidgetOption(w);
      if (migrated.type === 'braid-ellipse' || migrated.type === 'braid-border') {
        return { ...migrated, category: 'layout' as const };
      }
      return migrated;
    });
  const hasHline = out.some((w) => w.type === 'braid-hline');
  const hasVline = out.some((w) => w.type === 'braid-vline');
  const hasEllipse = out.some((w) => w.type === 'braid-ellipse');
  const hasBorder = out.some((w) => w.type === 'braid-border');
  if (!hasHline) out.push({ ...LINE_WIDGET_OPTIONS[0] });
  if (!hasVline) out.push({ ...LINE_WIDGET_OPTIONS[1] });
  if (!hasEllipse) out.push({ ...SHAPE_WIDGET_OPTIONS[0] });
  if (!hasBorder) out.push({ ...BORDER_FRAME_WIDGET });
  return out.filter((w) => w.name !== 'companyName' && w.titleKey !== 'printDesigner.widgets.companyName');
}

/** Default palette entries; API may replace via `widgetOptions`. Labels use `titleKey` + vue-i18n. */
export const defaultWidgetOptions: WidgetOption[] = [
  {
    category: 'common',
    type: 'braid-txt',
    isEdit: true,
    title: '',
    titleKey: 'printDesigner.widgets.customText',
    value: '???',
    defaultValue: '???',
    width: 160,
    height: 28
  },
  {
    category: 'common',
    type: 'braid-txt',
    title: '',
    titleKey: 'printDesigner.widgets.dateField',
    value: '{printDate}',
    defaultValue: '2026-05-20',
    name: 'printDate',
    width: 160,
    height: 26,
    style: { FontSize: 10 }
  },
  {
    category: 'barcode',
    type: 'bar-code',
    title: '',
    titleKey: 'printDesigner.widgets.barcode128',
    value: '{orderNo}',
    defaultValue: 'ORDER-001',
    name: 'orderNo',
    width: 140,
    height: 48,
    style: { codeType: '128Auto', ShowBarText: true }
  },
  {
    category: 'barcode',
    type: 'bar-code',
    title: '',
    titleKey: 'printDesigner.widgets.barcodeCode39',
    value: '{barcode}',
    defaultValue: 'CODE39-001',
    name: 'barcode',
    width: 140,
    height: 48,
    style: { codeType: 'Code39', ShowBarText: true }
  },
  {
    category: 'barcode',
    type: 'bar-code',
    title: '',
    titleKey: 'printDesigner.widgets.barcodeEan13',
    value: '{ean13}',
    defaultValue: '6901234567890',
    name: 'ean13',
    width: 160,
    height: 48,
    style: { codeType: 'EAN13', ShowBarText: true }
  },
  {
    category: 'barcode',
    type: 'bar-code',
    title: '',
    titleKey: 'printDesigner.widgets.qrCode',
    value: '{qrCode}',
    defaultValue: 'SN-DEMO-001',
    name: 'qrCode',
    width: 72,
    height: 72,
    style: { codeType: 'QRCode', ShowBarText: false, BarCodeTextPosition: 0, QRCodeErrorLevel: 'M', DataCharset: 'ANSI' }
  },
  {
    category: 'barcode',
    type: 'bar-code',
    title: '',
    titleKey: 'printDesigner.widgets.pdf417',
    value: '{pdf417}',
    defaultValue: 'PDF417-DEMO',
    name: 'pdf417',
    width: 120,
    height: 56,
    style: { codeType: 'PDF417', ShowBarText: false }
  },
  {
    category: 'barcode',
    type: 'bar-code',
    title: '',
    titleKey: 'printDesigner.widgets.dataMatrix',
    value: '{dataMatrix}',
    defaultValue: 'DM-DEMO',
    name: 'dataMatrix',
    width: 64,
    height: 64,
    style: { codeType: 'DataMatrix', ShowBarText: false }
  },
  {
    category: 'common',
    type: 'braid-image',
    title: '',
    titleKey: 'printDesigner.widgets.image',
    value: '',
    defaultValue: '',
    name: 'logoUrl',
    width: 80,
    height: 80
  },
  {
    category: 'common',
    type: 'braid-html',
    title: '',
    titleKey: 'printDesigner.widgets.pageNoLodop',
    value: '{pageInfo}',
    defaultValue:
      '<span style="font-size:9pt"><span tdata="pageNO">##</span> / <span tdata="pageCount">##</span></span>',
    width: 200,
    height: 24,
    style: { FontSize: 9 }
  },
  {
    category: 'common',
    type: 'braid-table',
    title: '',
    titleKey: 'printDesigner.widgets.table',
    name: 'details',
    value: '{details}',
    defaultValue: [
      { productName: '__demoA__', skuName: 'SKU-A', quantity: 2, price: '10.00' },
      { productName: '__demoB__', skuName: 'SKU-B', quantity: 1, price: '20.00' }
    ],
    width: 480,
    height: 120,
    columnsAttr: [
      { title: '', titleKey: 'printDesigner.widgets.colProduct', value: '{productName}', name: 'productName' },
      { title: '', titleKey: 'printDesigner.widgets.colSku', value: '{skuName}', name: 'skuName' },
      { title: '', titleKey: 'printDesigner.widgets.colQty', value: '{quantity}', name: 'quantity' },
      { title: '', titleKey: 'printDesigner.widgets.colPrice', value: '{price}', name: 'price' }
    ],
    style: { FontSize: 9, BorderColor: '#000000' }
  },

  ...LINE_WIDGET_OPTIONS,
  ...SHAPE_WIDGET_OPTIONS
];

export function createBlankTemplate() {
  return {
    title: '',
    width: 750,
    height: 550,
    pageWidth: 210,
    pageHeight: 297,
    tempItems: [] as PrintTemplateItem[]
  };
}
