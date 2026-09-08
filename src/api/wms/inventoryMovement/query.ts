import type { InventoryMovementQuery } from './types';

/**
 * 同步 SAP 物料凭证号为空筛选：
 * - 未输入凭证号时仅查 sapMaterialOrderNo 为空的记录
 * - 已输入凭证号时按精确匹配查询
 */
export function syncSapMaterialOrderNoEmptyFilter(query: InventoryMovementQuery) {
  const voucherNo = String(query.sapMaterialOrderNo ?? '').trim();
  query.sapMaterialOrderNoEmpty = voucherNo ? undefined : true;
}
