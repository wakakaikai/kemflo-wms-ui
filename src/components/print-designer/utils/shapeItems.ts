import type { PrintTemplateItem } from '../types';

export function isShapeItem(item: Pick<PrintTemplateItem, 'type'>): boolean {
  return item.type === 'braid-rect' || item.type === 'braid-ellipse' || item.type === 'braid-border';
}

export function isBorderFrameItem(item: Pick<PrintTemplateItem, 'type'>): boolean {
  return item.type === 'braid-border';
}

export function shapePreviewStyle(item: PrintTemplateItem): Record<string, string> {
  const stroke = item.style?.BorderColor || '#303133';
  const lw = item.style?.LineWidth ?? 1;
  const fill = item.style?.FillColor || 'transparent';
  const ls = item.style?.LineStyle ?? 0;
  let borderStyle = 'solid';
  if (ls === 1) borderStyle = 'dashed';
  else if (ls === 2) borderStyle = 'dotted';
  return {
    border: `${lw}px ${borderStyle} ${stroke}`,
    background: fill,
    borderRadius: item.type === 'braid-ellipse' ? '50%' : '0',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    display: 'block'
  };
}
