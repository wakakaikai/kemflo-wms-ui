import type { PrintTemplateItem } from '../types';

export type LineOrientation = 'h' | 'v';

export function isLineItem(item: Pick<PrintTemplateItem, 'type' | 'titleKey'>): boolean {
  if (item.type === 'braid-hline' || item.type === 'braid-vline') return true;
  return isLegacyLineHtml(item);
}

export function isLegacyLineHtml(item: Pick<PrintTemplateItem, 'type' | 'titleKey'>): boolean {
  if (item.type !== 'braid-html') return false;
  const tk = item.titleKey || '';
  return tk.includes('horizontalRule') || tk.includes('verticalRule');
}

export function getLineOrientation(item: Pick<PrintTemplateItem, 'type' | 'titleKey'>): LineOrientation | null {
  if (item.type === 'braid-hline') return 'h';
  if (item.type === 'braid-vline') return 'v';
  if (item.titleKey?.includes('verticalRule')) return 'v';
  if (item.titleKey?.includes('horizontalRule')) return 'h';
  return null;
}

export function normalizeLineTemplateItem(item: PrintTemplateItem): PrintTemplateItem {
  const orient = getLineOrientation(item);
  if (!orient || (item.type !== 'braid-html' && item.type !== 'braid-hline' && item.type !== 'braid-vline')) {
    return item;
  }
  const type = orient === 'h' ? 'braid-hline' : 'braid-vline';
  const style = {
    BorderColor: item.style?.BorderColor || '#303133',
    LineWidth: item.style?.LineWidth ?? 1,
    LineStyle: item.style?.LineStyle ?? 0,
    zIndex: item.style?.zIndex
  };
  return {
    ...item,
    type,
    value: '',
    defaultValue: '',
    style: { ...item.style, ...style }
  };
}

export function linePreviewStyle(item: PrintTemplateItem): Record<string, string> {
  const orient = getLineOrientation(item);
  const stroke = item.style?.BorderColor || '#303133';
  const lw = item.style?.LineWidth ?? 1;
  const ls = item.style?.LineStyle ?? 0;
  let borderStyle = 'solid';
  if (ls === 1) borderStyle = 'dashed';
  else if (ls === 2) borderStyle = 'dotted';

  if (orient === 'v') {
    return {
      width: '0',
      height: '100%',
      borderLeft: `${lw}px ${borderStyle} ${stroke}`,
      boxSizing: 'border-box',
      margin: '0 auto'
    };
  }
  return {
    width: '100%',
    height: '0',
    borderTop: `${lw}px ${borderStyle} ${stroke}`,
    boxSizing: 'border-box',
    margin: 'auto 0'
  };
}
