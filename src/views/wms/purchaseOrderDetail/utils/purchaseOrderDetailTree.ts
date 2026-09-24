import { PurchaseOrderBomVO, PurchaseOrderDetailVO } from '@/api/wms/purchaseOrderDetail/types';

export interface PoDetailTreeRow extends PurchaseOrderDetailVO, Partial<PurchaseOrderBomVO> {
  rowKey: string;
  isPoDetailHead?: boolean;
  children?: PoDetailTreeRow[];
  /** 入库/操作行主键 */
  inboundRowKey?: string;
  parentInboundRowKey?: string;
}

export const isOutsourcingCategory = (poCategory: string | number | undefined | null) => String(poCategory ?? '') === '3';

export const isPoDetailParentRow = (row: PoDetailTreeRow) => row.isPoDetailHead === true;

export const hasPoDetailBomChildren = (row: { poCategory?: string | number; purchaseOrderBomScheduleVoList?: PurchaseOrderBomVO[] }) => isOutsourcingCategory(row.poCategory) && (row.purchaseOrderBomScheduleVoList || []).length > 0;

function resolveHistoryRowKey(row: PurchaseOrderDetailVO) {
  return String(row.id ?? `${row.poNumber ?? ''}-${row.itemNumber ?? ''}-${row.scheduleNumber ?? ''}`);
}

function resolveOperationRowKey(row: { inboundRowKey?: string; id?: string | number }) {
  return String(row.inboundRowKey ?? row.id ?? '');
}

/** BOM 子行继承采购订单主行项次（接口 BOM 常不带 itemNumber） */
export function inheritPoItemNumberOnBom(bom: PurchaseOrderBomVO, parent: Pick<PurchaseOrderDetailVO, 'itemNumber'>) {
  const parentItem = String(parent.itemNumber ?? '').trim();
  if (parentItem && !String(bom.itemNumber ?? '').trim()) {
    bom.itemNumber = parentItem;
  }
  return bom;
}

function attachBomTreeChild(bom: PurchaseOrderBomVO, parentKey: string, index: number, parent: PurchaseOrderDetailVO): PoDetailTreeRow {
  inheritPoItemNumberOnBom(bom, parent);
  const rowKey = String(bom.inventorySplitKey || bom.originBomKey || `${parentKey}-bom-${bom.id ?? index}`);
  const node = bom as PoDetailTreeRow;
  node.rowKey = rowKey;
  node.isPoDetailHead = false;
  node.moveType = node.moveType || '543';
  node.materialCode = bom.componentMaterial;
  node.materialDesc = bom.componentDesc;
  node.orderQuantity = bom.componentQty;
  node.poNumber = parent.poNumber;
  node.itemNumber = bom.itemNumber ?? parent.itemNumber;
  node.scheduleNumber = bom.scheduleNumber ?? parent.scheduleNumber;
  node.parentInboundRowKey = (parent as { inboundRowKey?: string }).inboundRowKey ?? parentKey;
  return node;
}

function mapHistoryBomDisplay(bom: PurchaseOrderBomVO, parentKey: string, index: number, parent: PurchaseOrderDetailVO): PoDetailTreeRow {
  return {
    ...attachBomTreeChild(bom, parentKey, index, parent)
  };
}

/** 查询列表：BOM 只读展示，子行不共用引用 */
export function buildPurchaseOrderDetailHistoryTree(rows: PurchaseOrderDetailVO[]): PoDetailTreeRow[] {
  return (rows || []).map((row) => {
    const rowKey = resolveHistoryRowKey(row);
    const bomList = hasPoDetailBomChildren(row) ? row.purchaseOrderBomScheduleVoList || [] : [];
    const children = bomList.length ? bomList.map((bom, index) => mapHistoryBomDisplay({ ...bom }, rowKey, index, row)) : undefined;
    return {
      ...row,
      rowKey,
      isPoDetailHead: true,
      moveType: '101',
      children
    };
  });
}

/** 入库/退货操作列表：主行/子行均用原对象引用，避免树表编辑数量写不到 inboundList */
export function buildPurchaseOrderDetailOperationTree(rows: any[]): PoDetailTreeRow[] {
  return (rows || []).map((row) => {
    const rowKey = resolveOperationRowKey(row);
    row.rowKey = rowKey;
    row.isPoDetailHead = true;
    if (!row.moveType) {
      row.moveType = '101';
    }
    const bomList = hasPoDetailBomChildren(row) ? row.purchaseOrderBomScheduleVoList || [] : [];
    const children = bomList.length ? bomList.map((bom, index) => attachBomTreeChild(bom, rowKey, index, row)) : undefined;
    row.children = children?.length ? children : undefined;
    return row as PoDetailTreeRow;
  });
}

const TREE_ROW_META_KEYS = ['children', 'isPoDetailHead', 'rowKey', 'parentInboundRowKey'] as const;

function omitTreeRowMeta<T extends Record<string, any>>(row: T): T {
  const copy = { ...row };
  TREE_ROW_META_KEYS.forEach((key) => {
    delete copy[key];
  });
  return copy;
}

/** 暂存/提交前序列化：去掉树表元数据，保留用户编辑的数量与 BOM */
export function cloneInboundListForPersist(list: any[]) {
  const cleaned = (list || []).map((row) => ({
    ...omitTreeRowMeta(row),
    purchaseOrderBomScheduleVoList: (row.purchaseOrderBomScheduleVoList || []).map((bom: PurchaseOrderBomVO) => omitTreeRowMeta(bom as Record<string, any>))
  }));
  return JSON.parse(JSON.stringify(cleaned));
}

export function normalizeInboundListAfterLoad(list: any[]) {
  (list || []).forEach((row) => {
    row.receivePoQuantity = Number(row.receivePoQuantity ?? 0);
    row.inventoryQuantity = row.inventoryQuantity ?? (Number(row.receivePoQuantity || 0) * (Number(row.conversionRatio || 1) || 1)).toFixed(3);
    TREE_ROW_META_KEYS.forEach((key) => {
      delete row[key];
    });
    (row.purchaseOrderBomScheduleVoList || []).forEach((bom: PurchaseOrderBomVO) => {
      inheritPoItemNumberOnBom(bom, row);
      bom.consumeQuantity = Number(bom.consumeQuantity ?? 0);
      if (bom.inventoryQuantity == null || bom.inventoryQuantity === '') {
        const ratio = Number(bom.conversionRatio || 1) || 1;
        bom.inventoryQuantity = (Number(bom.consumeQuantity || 0) * ratio).toFixed(3);
      }
      TREE_ROW_META_KEYS.forEach((key) => {
        delete (bom as Record<string, any>)[key];
      });
    });
  });
  return list;
}

export function formatBomOpenOrderQuantity(bom: Pick<PurchaseOrderBomVO, 'openQuantity' | 'conversionRatio'>) {
  const ratio = Number(bom.conversionRatio || 1) || 1;
  return Number((Number(bom.openQuantity || 0) / ratio).toFixed(3));
}

export function findOperationParentRow(rows: any[], childRow: PoDetailTreeRow) {
  if (isPoDetailParentRow(childRow)) {
    return childRow;
  }
  const parentKey = childRow.parentInboundRowKey;
  if (parentKey) {
    return rows.find((item) => item.inboundRowKey === parentKey);
  }
  return undefined;
}
