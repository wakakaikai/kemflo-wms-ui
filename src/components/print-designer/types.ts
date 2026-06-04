/** Border placement (Excel-style) */
export type BorderPreset =
  | 'all'
  | 'inner'
  | 'innerH'
  | 'innerV'
  | 'outer'
  | 'left'
  | 'top'
  | 'right'
  | 'bottom'
  | 'none';

/** Print item kinds; aligned with kr-print-designer naming */
export type PrintItemType =
  | 'braid-txt'
  | 'braid-table'
  | 'braid-html'
  | 'braid-image'
  | 'bar-code'
  | 'braid-rect'
  | 'braid-ellipse'
  | 'braid-border'
  | 'braid-hline'
  | 'braid-vline';

export interface PrintItemStyle {
  zIndex?: number;
  FontSize?: number;
  /** Lodop / CSS font-family (installed on print PC) */
  FontName?: string;
  FontColor?: string;
  Bold?: boolean;
  Italic?: boolean;
  Underline?: boolean;
  /** Lodop StrikeOut / CSS text-decoration line-through */
  StrikeOut?: boolean;
  /** Lodop BackColor / CSS background-color for text */
  HighlightColor?: string;
  /** left | center | right */
  Alignment?: 'left' | 'center' | 'right';
  /** Lodop ItemType */
  ItemType?: number;
  HOrient?: 0 | 1 | 2 | 3;
  VOrient?: 0 | 1 | 2 | 3;
  ScalX?: number;
  ScalY?: number;
  LinkedItem?: string;
  AutoHeight?: boolean;
  BottomMargin?: number;
  ShowBarText?: boolean;
  /** Lodop BarCodeTextPosition: 0=?? 1=?? 2=?? 3=?? */
  BarCodeTextPosition?: 0 | 1 | 2 | 3;
  codeType?: string;
  BarcodeBgColor?: string;
  BarcodeBgTransparent?: boolean;
  QRCodeVersion?: number;
  QRCodeErrorLevel?: 'L' | 'M' | 'Q' | 'H';
  DataCharset?: string;
  BorderColor?: string;
  /** Box/table border placement preset */
  borderPreset?: BorderPreset;
  /** Lodop ADD_PRINT_RECT / ELLIPSE line width (px) */
  LineWidth?: number;
  /** Lodop line style 0 solid, 1 dash, 2 dot */
  LineStyle?: number;
  /** Canvas preview fill; Lodop shapes are stroke-only */
  FillColor?: string;
  /** Table widget: auto-paginate when rows exceed `pageRows` */
  paginate?: boolean;
  /** Table widget: max body rows per page (header repeats on each page) */
  pageRows?: number;
}

export interface TableColumnAttr {
  /** Fallback when `titleKey` is absent */
  title?: string;
  /** i18n path e.g. printDesigner.widgets.colProduct */
  titleKey?: string;
  value: string;
  name?: string;
}

/** One placed object on the design canvas */
export interface PrintTemplateItem {
  id: string;
  type: PrintItemType;
  title: string;
  /** Legacy field from saved templates / API; UI uses `title` */
  titleKey?: string;
  value: string;
  defaultValue?: string | Record<string, unknown>[];
  name?: string;
  isEdit?: boolean;
  dragable?: boolean;
  resizable?: boolean;
  left: number;
  top: number;
  width: number;
  height: number;
  style?: PrintItemStyle;
  lodopStyle?: Record<string, unknown>;
  columnsAttr?: TableColumnAttr[];
}

export interface PrintTemplate {
  title: string;
  /** Canvas width in px (layout / scale to mm) */
  width: number;
  height: number;
  /** Paper width in mm */
  pageWidth: number;
  /** Paper height in mm */
  pageHeight: number;
  tempItems: PrintTemplateItem[];
  /** Optional: bind print data from a configurable HTTP dataset (saved with template JSON). */
  apiDataset?: PrintApiDatasetConfig;
}

/** API dataset field mapping (report fields). */
export interface PrintApiDatasetField {
  fieldName: string;
  sort: number;
  fieldText: string;
  type: string;
  dictCode?: string;
  query?: boolean;
  queryMode?: string;
  queryDefault?: string;
  queryDateFormat?: string;
  paramConfig?: string;
}

/** Request parameter placeholder e.g. `${orderId}` in URL. */
export interface PrintApiDatasetParam {
  name: string;
  label?: string;
  defaultValue?: string;
  required?: boolean;
}

/** API dataset definition (configurable HTTP binding for print data). */
export interface PrintApiDatasetConfig {
  code: string;
  name: string;
  isCollection: boolean;
  isPaginated: boolean;
  method: 'get' | 'post';
  /** Reserved: converter key / JSON path hint (not executed yet). */
  converter?: string;
  /** Relative API path, may include query string; supports `${paramName}` from params list. */
  url: string;
  fields: PrintApiDatasetField[];
  params: PrintApiDatasetParam[];
}

export type WidgetCategory = 'common' | 'barcode' | 'layout' | 'other';

/** Widget palette entry; may be loaded from API */
export interface WidgetOption extends Partial<Omit<PrintTemplateItem, 'id' | 'left' | 'top'>> {
  type: PrintItemType;
  title: string;
  /** Palette label i18n path when `title` is empty */
  titleKey?: string;
  value: string;
  /** Left panel group; default common */
  category?: WidgetCategory;
  defaultValue?: string | Record<string, unknown>[];
  name?: string;
  isEdit?: boolean;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  style?: PrintItemStyle;
  lodopStyle?: Record<string, unknown>;
  columnsAttr?: TableColumnAttr[];
}

export interface LodopLicenseInfo {
  strCompanyName: string;
  strLicense: string;
  strLicenseA?: string;
  strLicenseB?: string;
}

/** DataTransfer MIME for palette ?? canvas drag */
export const PRINT_WIDGET_DRAG_MIME = 'application/x-print-designer-widget';
