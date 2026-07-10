import type { BorderPreset, PrintTemplateItem } from '../types';

/** 5��2 ����˳���� Excel / ��ľ�߿�˵�һ�£����� 5 �������� 5 ���� */
export const TABLE_BORDER_PRESETS: BorderPreset[] = [
  'all',
  'inner',
  'innerH',
  'innerV',
  'outer',
  'left',
  'top',
  'right',
  'bottom',
  'none'
];

export const BOX_BORDER_PRESETS: BorderPreset[] = ['all', 'outer', 'left', 'top', 'right', 'bottom', 'none'];

export function defaultBorderPresetForItem(item: Pick<PrintTemplateItem, 'type'>): BorderPreset {
  if (item.type === 'braid-table' || item.type === 'braid-border') return 'all';
  return 'none';
}

export function getBorderPreset(item: PrintTemplateItem): BorderPreset {
  return item.style?.borderPreset ?? defaultBorderPresetForItem(item);
}

export function lineStyleToCss(lineStyle?: number): 'solid' | 'dashed' | 'dotted' {
  if (lineStyle === 1) return 'dashed';
  if (lineStyle === 2) return 'dotted';
  return 'solid';
}

function borderLine(color: string, width: number, style: string, sides: Partial<Record<'top' | 'right' | 'bottom' | 'left', boolean>>) {
  const w = `${Math.max(1, width)}px`;
  const out: Record<string, string> = {};
  if (sides.top) out.borderTop = `${w} ${style} ${color}`;
  if (sides.right) out.borderRight = `${w} ${style} ${color}`;
  if (sides.bottom) out.borderBottom = `${w} ${style} ${color}`;
  if (sides.left) out.borderLeft = `${w} ${style} ${color}`;
  return out;
}

/** Canvas box border for txt / image; table uses per-cell borders */
export function previewBoxBorderStyle(item: PrintTemplateItem): Record<string, string> {
  if (item.type === 'braid-table') {
    return { border: '1px dashed var(--el-border-color-lighter)' };
  }
  const preset = getBorderPreset(item);
  const color = item.style?.BorderColor || '#303133';
  const width = item.style?.LineWidth ?? 1;
  const style = lineStyleToCss(item.style?.LineStyle);

  if (preset === 'none') {
    return { border: '1px dashed var(--el-border-color-lighter)' };
  }

  const p = preset === 'outer' ? 'all' : preset === 'inner' || preset === 'innerH' || preset === 'innerV' ? 'all' : preset;

  switch (p) {
    case 'all':
      return { border: `${width}px ${style} ${color}` };
    case 'left':
      return { ...borderLine(color, width, style, { left: true }), borderTop: 'none', borderRight: 'none', borderBottom: 'none' };
    case 'top':
      return { ...borderLine(color, width, style, { top: true }), borderRight: 'none', borderBottom: 'none', borderLeft: 'none' };
    case 'right':
      return { ...borderLine(color, width, style, { right: true }), borderTop: 'none', borderBottom: 'none', borderLeft: 'none' };
    case 'bottom':
      return { ...borderLine(color, width, style, { bottom: true }), borderTop: 'none', borderRight: 'none', borderLeft: 'none' };
    default:
      return { border: '1px dashed var(--el-border-color-lighter)' };
  }
}

/** Per-cell borders for mini table preview */
export function previewTableCellBorderStyle(
  item: PrintTemplateItem,
  rowIndex: number,
  colIndex: number,
  rowCount: number,
  colCount: number
): Record<string, string> {
  const preset = getBorderPreset(item);
  const color = item.style?.BorderColor || '#cccccc';
  const width = Math.max(1, item.style?.LineWidth ?? 1);
  const style = lineStyleToCss(item.style?.LineStyle);
  const w = `${width}px`;

  if (preset === 'none') {
    return { border: 'none' };
  }

  const isFirstRow = rowIndex === 0;
  const isLastRow = rowIndex === rowCount - 1;
  const isFirstCol = colIndex === 0;
  const isLastCol = colIndex === colCount - 1;

  const sides = { top: false, right: false, bottom: false, left: false };

  switch (preset) {
    case 'all':
      sides.top = sides.right = sides.bottom = sides.left = true;
      break;
    case 'outer':
      if (isFirstRow) sides.top = true;
      if (isLastRow) sides.bottom = true;
      if (isFirstCol) sides.left = true;
      if (isLastCol) sides.right = true;
      break;
    case 'inner':
      if (!isLastRow) sides.bottom = true;
      if (!isLastCol) sides.right = true;
      break;
    case 'innerH':
      if (!isLastRow) sides.bottom = true;
      break;
    case 'innerV':
      if (!isLastCol) sides.right = true;
      break;
    case 'left':
      if (isFirstCol) sides.left = true;
      break;
    case 'top':
      if (isFirstRow) sides.top = true;
      break;
    case 'right':
      if (isLastCol) sides.right = true;
      break;
    case 'bottom':
      if (isLastRow) sides.bottom = true;
      break;
    default:
      break;
  }

  const css: Record<string, string> = {};
  if (sides.top) css.borderTop = `${w} ${style} ${color}`;
  if (sides.right) css.borderRight = `${w} ${style} ${color}`;
  if (sides.bottom) css.borderBottom = `${w} ${style} ${color}`;
  if (sides.left) css.borderLeft = `${w} ${style} ${color}`;
  return css;
}

/** Lodop HTML table cell style */
export function lodopTableCellBorderStyle(
  item: PrintTemplateItem,
  rowIndex: number,
  colIndex: number,
  rowCount: number,
  colCount: number
): string {
  const o = previewTableCellBorderStyle(item, rowIndex, colIndex, rowCount, colCount);
  const parts: string[] = [];
  if (o.borderTop) parts.push(`border-top:${o.borderTop}`);
  if (o.borderRight) parts.push(`border-right:${o.borderRight}`);
  if (o.borderBottom) parts.push(`border-bottom:${o.borderBottom}`);
  if (o.borderLeft) parts.push(`border-left:${o.borderLeft}`);
  return parts.join(';');
}
