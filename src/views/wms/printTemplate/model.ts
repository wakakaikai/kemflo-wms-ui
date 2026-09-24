import { createDefaultTemplate, type PrintBusinessField, type TemplateData } from '@worm-vue3-print/canvas';

export type WormTemplate = TemplateData;

type JsonObject = Record<string, any>;

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
  const suffix = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${suffix}`;
}

export function isWormTemplate(value: unknown): value is WormTemplate {
  if (!value || typeof value !== 'object') return false;
  const row = value as JsonObject;
  return typeof row.paperSize === 'string' && !!row.margins && Array.isArray(row.elements);
}

function numberValue(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function legacyType(item: JsonObject) {
  if (item.type === 'braid-txt') return 'text';
  if (item.type === 'braid-html') return 'html';
  if (item.type === 'braid-image') return 'image';
  if (item.type === 'braid-table') return 'table';
  if (item.type === 'braid-rect' || item.type === 'braid-border') return 'rect';
  if (item.type === 'braid-ellipse') return 'oval';
  if (item.type === 'braid-hline') return 'hline';
  if (item.type === 'braid-vline') return 'vline';
  if (item.type === 'bar-code') {
    return String(item.style?.codeType || '')
      .toUpperCase()
      .includes('QR')
      ? 'qrcode'
      : 'barcode';
  }
  return 'text';
}

function legacyFormatter(item: JsonObject) {
  const value = typeof item.value === 'string' ? item.value : '';
  if (value) return value;
  if (item.name) return `{${item.name}}`;
  return item.title || '';
}

function migrateLegacyTable(item: JsonObject, width: number) {
  const columns = Array.isArray(item.columnsAttr) && item.columnsAttr.length ? item.columnsAttr : [{ title: '内容', value: item.value || '' }];
  const colWidth = width / columns.length;
  return {
    dataSource: item.name || '',
    tableColWidths: columns.map(() => colWidth),
    tableRows: [
      {
        id: uid('row'),
        type: 'header',
        height: 8,
        repeatOnPage: true,
        cells: columns.map((column: JsonObject) => ({
          id: uid('cell'),
          formatter: column.title || column.titleKey || column.name || '字段',
          align: 'center',
          fontWeight: '600'
        }))
      },
      {
        id: uid('row'),
        type: 'data',
        height: 8,
        cells: columns.map((column: JsonObject) => ({
          id: uid('cell'),
          formatter: column.value || (column.name ? `{${column.name}}` : ''),
          align: 'left'
        }))
      }
    ],
    tablePagination: { enabled: item.style?.paginate !== false }
  };
}

function migrateLegacyElement(item: JsonObject, scaleX: number, scaleY: number) {
  const type = legacyType(item);
  const width = Math.max(1, numberValue(item.width, 100) * scaleX);
  const height = Math.max(1, numberValue(item.height, 30) * scaleY);
  const options: JsonObject = {
    left: Math.max(0, Number(item.left || 0) * scaleX),
    top: Math.max(0, Number(item.top || 0) * scaleY),
    width,
    height,
    zIndex: Number(item.style?.zIndex || 1),
    fontSize: Number(item.style?.FontSize || 10),
    fontFamily: item.style?.FontName || undefined,
    fontWeight: item.style?.Bold ? '700' : '400',
    color: item.style?.FontColor || '#111827',
    backgroundColor: item.style?.HighlightColor || undefined,
    textAlign: item.style?.Alignment || 'left',
    formatter: legacyFormatter(item),
    testData: typeof item.defaultValue === 'string' ? item.defaultValue : undefined,
    borderWidth: Number(item.style?.LineWidth || 0),
    borderStyle: Number(item.style?.LineStyle || 0) === 1 ? 'dashed' : 'solid',
    borderColor: item.style?.BorderColor || '#111827'
  };

  if (type === 'image') {
    options.src = legacyFormatter(item);
    options.fit = 'contain';
  }
  if (type === 'barcode') {
    options.barcodeType = item.style?.codeType || 'CODE128';
  }
  if (type === 'qrcode') {
    options.qrCodeLevel = item.style?.QRCodeErrorLevel || 'M';
  }
  if (type === 'table') Object.assign(options, migrateLegacyTable(item, width));

  return {
    id: item.id || uid('element'),
    type,
    options,
    printElementType: {
      type,
      title: item.title || '元素',
      editable: item.isEdit !== false
    }
  };
}

function migrateLegacyTemplate(raw: JsonObject): TemplateData {
  const pageWidth = numberValue(raw.pageWidth, 210);
  const pageHeight = numberValue(raw.pageHeight, 297);
  const canvasWidth = numberValue(raw.width, pageWidth * 3.78);
  const canvasHeight = numberValue(raw.height, pageHeight * 3.78);
  const items = Array.isArray(raw.tempItems) ? raw.tempItems : [];
  const template = createDefaultTemplate();
  return {
    ...template,
    paperSize: 'CUSTOM',
    customWidth: pageWidth,
    customHeight: pageHeight,
    orientation: pageWidth > pageHeight ? 'landscape' : 'portrait',
    margins: { top: 0, right: 0, bottom: 0, left: 0 },
    header: { height: 0, elements: [] },
    footer: { height: 0, elements: [] },
    firstPageOverlay: { height: 0, elements: [] },
    elements: items.map((item: JsonObject) => migrateLegacyElement(item, pageWidth / canvasWidth, pageHeight / canvasHeight)) as TemplateData['elements']
  };
}

export function parseTemplateContent(raw: unknown): WormTemplate {
  const parsed = parseJson(raw);
  if (isWormTemplate(parsed)) return parsed;
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as JsonObject).tempItems)) {
    return migrateLegacyTemplate(parsed as JsonObject);
  }
  return createDefaultTemplate();
}

function fieldType(value: unknown) {
  if (Array.isArray(value)) return 'list';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (value instanceof Date) return 'date';
  return 'string';
}

export function inferBusinessFields(rows: Record<string, unknown>[]): PrintBusinessField[] {
  const result: PrintBusinessField[] = [];
  const seen = new Set<string>();
  let order = 0;
  const append = (key: string, label: string, type: string) => {
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push({ fieldKey: key, fieldLabel: label, fieldType: type, sortOrder: ++order });
  };
  const walk = (value: Record<string, unknown>, prefix = '') => {
    Object.entries(value).forEach(([key, child]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      append(path, key, fieldType(child));
      if (child && typeof child === 'object' && !Array.isArray(child)) {
        walk(child as Record<string, unknown>, path);
      } else if (Array.isArray(child) && child[0] && typeof child[0] === 'object') {
        walk(child[0] as Record<string, unknown>, path);
      }
    });
  };
  if (rows[0]) walk(rows[0]);
  return result;
}

export function mapBusinessFields(raw: unknown, sampleRows: Record<string, unknown>[] = []): PrintBusinessField[] {
  const parsed = parseJson(raw);
  const source = Array.isArray(parsed) ? parsed : parsed && typeof parsed === 'object' ? (parsed as JsonObject).rows || (parsed as JsonObject).list || (parsed as JsonObject).data || [] : [];
  const rows = Array.isArray(source) ? source : [];
  const mapped = rows
    .map((item: JsonObject, index: number): PrintBusinessField | null => {
      if (!item || typeof item !== 'object') return null;
      const key = String(item.fieldKey ?? item.name ?? item.key ?? item.prop ?? item.value ?? '')
        .replace(/^\{|\}$/g, '')
        .trim();
      if (!key) return null;
      const rawType = item.fieldType ?? item.dataType ?? item.type;
      return {
        id: item.id == null ? undefined : String(item.id),
        fieldKey: key,
        fieldLabel: String(item.fieldLabel ?? item.title ?? item.label ?? key),
        fieldType: rawType === 'braid-table' ? 'list' : String(rawType || 'string'),
        sortOrder: Number(item.sortOrder ?? index + 1)
      };
    })
    .filter((item: PrintBusinessField | null): item is PrintBusinessField => item !== null);
  return mapped.length ? mapped : inferBusinessFields(sampleRows);
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
