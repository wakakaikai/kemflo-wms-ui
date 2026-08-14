export type InventorySortKey = 'warehouseCode' | 'locationCode' | 'itemCode' | 'batchCode';

export interface InventorySortRule {
  key: InventorySortKey;
  order: 'asc' | 'desc';
}

export interface InventorySortField extends InventorySortRule {
  label?: string;
  enabled?: boolean;
}

export function createDefaultInventorySortRules(): InventorySortRule[] {
  return [
    { key: 'warehouseCode', order: 'asc' },
    { key: 'itemCode', order: 'asc' },
    { key: 'batchCode', order: 'asc' }
  ];
}

export function applyInventorySortToQuery(query: Record<string, any>, rules: InventorySortRule[]) {
  const enabled = (rules || []).filter((f) => f.key && f.order);
  if (!enabled.length) {
    query.orderByColumn = undefined;
    query.isAsc = undefined;
    return;
  }
  query.orderByColumn = enabled.map((f) => f.key).join(',');
  query.isAsc = enabled.map((f) => f.order).join(',');
}

/** none -> asc (append) -> desc -> remove */
export function toggleInventorySort(rules: InventorySortRule[], key: InventorySortKey): InventorySortRule[] {
  const next = (rules || []).map((r) => ({ ...r }));
  const idx = next.findIndex((r) => r.key === key);
  if (idx < 0) {
    next.push({ key, order: 'asc' });
    return next;
  }
  if (next[idx].order === 'asc') {
    next[idx] = { key, order: 'desc' };
    return next;
  }
  next.splice(idx, 1);
  return next;
}

export function getInventorySortState(rules: InventorySortRule[], key: InventorySortKey) {
  const idx = (rules || []).findIndex((r) => r.key === key);
  if (idx < 0) {
    return { order: '' as const, index: 0 };
  }
  return { order: rules[idx].order, index: idx + 1 };
}
