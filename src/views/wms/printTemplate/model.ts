import { createBlankTemplate, type PrintTemplate, type PrintTemplateItem, type WidgetOption } from '@/components/print-designer';
import { canvasPxFromPaper } from '@/components/print-designer/const/paperPresets';

type JsonObject = Record<string, any>;

export interface PrintBusinessField {
  id?: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  sortOrder?: number;
}

function parseJson(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;
  if (!raw.trim()) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function uid(prefix: string) {
  const suffix = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(16).slice(2);
  return prefix + '-' + suffix;
}

export function isLocalTemplate(value: unknown): value is PrintTemplate {
  if (!value || typeof value !== 'object') return false;
  const row = value as JsonObject;
  return Number.isFinite(Number(row.pageWidth)) && Number.isFinite(Number(row.pageHeight)) && Array.isArray(row.tempItems);
}

export function isWormTemplate(value: unknown) {
  if (!value || typeof value !== 'object') return false;
  const row = value as JsonObject;
  return typeof row.paperSize === 'string' && !!row.margins && Array.isArray(row.elements);
}

function paperDimensions(raw: JsonObject) {
  const presets: Record<string, [number, number]> = {
    A3: [297, 420],
    A4: [210, 297],
    A5: [148, 210],
    Letter: [215.9, 279.4],
    Legal: [215.9, 355.6],
    LABEL_80X60: [80, 60],
    LABEL_60X40: [60, 40],
    LABEL_40X30: [40, 30],
    THERMAL_57: [57, 120],
    THERMAL_80: [80, 160],
    THERMAL_110: [110, 180]
  };
  let [width, height] = raw.paperSize === 'CUSTOM' || raw.paperSize === 'CONTINUOUS' ? [Number(raw.customWidth || 210), Number(raw.customHeight || 297)] : presets[raw.paperSize] || presets.A4;
  if (raw.orientation === 'landscape') [width, height] = [height, width];
  return { width, height };
}

function localType(type: string): PrintTemplateItem['type'] {
  const types: Record<string, PrintTemplateItem['type']> = {
    text: 'braid-txt',
    longText: 'braid-txt',
    html: 'braid-html',
    pageNumber: 'braid-html',
    image: 'braid-image',
    table: 'braid-table',
    barcode: 'bar-code',
    qrcode: 'bar-code',
    rect: 'braid-border',
    oval: 'braid-ellipse',
    hline: 'braid-hline',
    vline: 'braid-vline'
  };
  return types[type] || 'braid-txt';
}

function migrateTableRows(options: JsonObject) {
  const rows = Array.isArray(options.tableRows) ? options.tableRows : [];
  const header = rows.find((row: JsonObject) => row.type === 'header') || rows[0];
  const data = rows.find((row: JsonObject) => row.type === 'data') || rows[1];
  const cells = Array.isArray(header?.cells) ? header.cells : [];
  return cells.map((cell: JsonObject, index: number) => {
    const dataCell = data?.cells?.[index] || {};
    const value = String(dataCell.formatter || '');
    return {
      title: String(cell.formatter || '字段' + (index + 1)),
      value,
      name: value.replace(/^\{|\}$/g, '')
    };
  });
}

function migrateWormElement(element: JsonObject, scaleX: number, scaleY: number, zoneOffset = 0): PrintTemplateItem {
  const type = String(element.printElementType?.type || element.type || 'text');
  const options = element.options || {};
  const itemType = localType(type);
  const formatter = String(options.formatter || options.src || '');
  return {
    id: String(element.id || uid('item')),
    type: itemType,
    title: String(element.printElementType?.title || options.title || type),
    value: formatter,
    defaultValue: options.testData,
    name: formatter.match(/^\{(.+)\}$/)?.[1],
    isEdit: element.printElementType?.editable !== false,
    dragable: options.locked !== true,
    resizable: options.locked !== true,
    left: Math.max(0, Number(options.left || 0) * scaleX),
    top: Math.max(0, (Number(options.top || 0) + zoneOffset) * scaleY),
    width: Math.max(2, Number(options.width || 20) * scaleX),
    height: Math.max(2, Number(options.height || 8) * scaleY),
    columnsAttr: itemType === 'braid-table' ? migrateTableRows(options) : undefined,
    style: {
      zIndex: Number(options.zIndex || 1),
      FontSize: Number(options.fontSize || 9),
      FontName: options.fontFamily,
      FontColor: options.color,
      Bold: String(options.fontWeight || '') === '700' || options.fontWeight === 'bold',
      Italic: options.fontStyle === 'italic',
      Underline: String(options.textDecoration || '').includes('underline'),
      StrikeOut: String(options.textDecoration || '').includes('line-through'),
      HighlightColor: options.backgroundColor,
      Alignment: options.textAlign || 'left',
      codeType: type === 'qrcode' ? 'QRCode' : options.barcodeType || '128Auto',
      QRCodeErrorLevel: options.qrCodeLevel || 'M',
      ShowBarText: options.showText !== false,
      BorderColor: options.borderColor,
      LineWidth: Number(options.borderWidth || 1),
      LineStyle: options.borderStyle === 'dashed' ? 1 : options.borderStyle === 'dotted' ? 2 : 0,
      FillColor: options.backgroundColor,
      paginate: options.tablePagination?.enabled === true,
      pageRows: Number(options.tablePagination?.pageRows || 10)
    }
  };
}

function migrateWormTemplate(raw: JsonObject): PrintTemplate {
  const first = Array.isArray(raw.pages) ? raw.pages[0] || {} : raw;
  const { width: pageWidth, height: pageHeight } = paperDimensions(first);
  const canvas = canvasPxFromPaper(pageWidth, pageHeight);
  const scaleX = canvas.width / pageWidth;
  const scaleY = canvas.height / pageHeight;
  const headerHeight = Number(first.header?.height || 0);
  const body = Array.isArray(first.elements) ? first.elements : [];
  const header = Array.isArray(first.header?.elements) ? first.header.elements : [];
  const footer = Array.isArray(first.footer?.elements) ? first.footer.elements : [];
  return {
    title: String(first.title || raw.title || ''),
    width: canvas.width,
    height: canvas.height,
    pageWidth,
    pageHeight,
    tempItems: [...header.map((item: JsonObject) => migrateWormElement(item, scaleX, scaleY)), ...body.map((item: JsonObject) => migrateWormElement(item, scaleX, scaleY, headerHeight)), ...footer.map((item: JsonObject) => migrateWormElement(item, scaleX, scaleY, Math.max(0, pageHeight - Number(first.footer?.height || 0))))]
  };
}

export function parseTemplateContent(raw: unknown): PrintTemplate {
  const parsed = parseJson(raw);
  if (isLocalTemplate(parsed)) {
    return {
      ...createBlankTemplate(),
      ...parsed,
      tempItems: parsed.tempItems.map((item) => ({ ...item, id: item.id || uid('item') }))
    };
  }
  if (isWormTemplate(parsed) || (parsed && typeof parsed === 'object' && Array.isArray((parsed as JsonObject).pages))) {
    return migrateWormTemplate(parsed as JsonObject);
  }
  return createBlankTemplate();
}

function fieldType(value: unknown) {
  if (Array.isArray(value)) return 'list';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'string';
}

export function inferBusinessFields(rows: Record<string, unknown>[]): PrintBusinessField[] {
  const result: PrintBusinessField[] = [];
  const seen = new Set<string>();
  const walk = (value: Record<string, unknown>, prefix = '') => {
    Object.entries(value).forEach(([key, child]) => {
      const path = prefix ? prefix + '.' + key : key;
      if (!seen.has(path)) {
        seen.add(path);
        result.push({ fieldKey: path, fieldLabel: key, fieldType: fieldType(child), sortOrder: result.length + 1 });
      }
      if (child && typeof child === 'object' && !Array.isArray(child)) walk(child as Record<string, unknown>, path);
    });
  };
  if (rows[0]) walk(rows[0]);
  return result;
}

export function mapBusinessFields(raw: unknown, sampleRows: Record<string, unknown>[] = []): PrintBusinessField[] {
  const parsed = parseJson(raw);
  const source = Array.isArray(parsed) ? parsed : parsed && typeof parsed === 'object' ? (parsed as JsonObject).rows || (parsed as JsonObject).list || (parsed as JsonObject).data || [] : [];
  const mapped = (Array.isArray(source) ? source : [])
    .map((item: JsonObject, index: number): PrintBusinessField | null => {
      const key = String(item?.fieldKey ?? item?.name ?? item?.key ?? item?.prop ?? item?.value ?? '')
        .replace(/^\{|\}$/g, '')
        .trim();
      if (!key) return null;
      return {
        id: item.id == null ? undefined : String(item.id),
        fieldKey: key,
        fieldLabel: String(item.fieldLabel ?? item.title ?? item.label ?? key),
        fieldType: String(item.fieldType ?? item.dataType ?? (item.type === 'braid-table' ? 'list' : 'string')),
        sortOrder: Number(item.sortOrder ?? index + 1)
      };
    })
    .filter((item: PrintBusinessField | null): item is PrintBusinessField => item !== null);
  return mapped.length ? mapped : inferBusinessFields(sampleRows);
}

export function fieldsToWidgetOptions(fields: PrintBusinessField[]): WidgetOption[] {
  return fields.map((field) => ({
    type: field.fieldType === 'list' ? 'braid-table' : 'braid-txt',
    title: field.fieldLabel,
    value: '{' + field.fieldKey + '}',
    name: field.fieldKey,
    category: 'common',
    width: field.fieldType === 'list' ? 480 : 150,
    height: field.fieldType === 'list' ? 120 : 30,
    isEdit: false
  }));
}

export function parseSampleRows(raw: unknown): Record<string, unknown>[] {
  const parsed = parseJson(raw);
  if (Array.isArray(parsed)) return parsed.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object');
  if (!parsed || typeof parsed !== 'object') return [];
  const row = parsed as JsonObject;
  for (const key of ['rows', 'list', 'records', 'data']) {
    if (Array.isArray(row[key])) return row[key];
    if (row[key] && typeof row[key] === 'object') return [row[key]];
  }
  return [row];
}
