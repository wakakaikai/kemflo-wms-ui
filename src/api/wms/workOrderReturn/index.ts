import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import type { WorkOrderCancelLineBO, WorkOrderReturnBatchOptions, WorkOrderReturnForm, WorkOrderReturnLineBO, WorkOrderReturnMaterialRow, WorkOrderReturnSourceRow } from './types';
import { WORK_ORDER_SOURCE_DOC_TYPE } from './types';

export { WORK_ORDER_SOURCE_DOC_TYPE };
export type { WorkOrderCancelLineBO, WorkOrderReturnForm, WorkOrderReturnLineBO };

/** 冲销标识�?0-正常 1-已冲销 2-冲销记录 */
export const INVENTORY_MOVEMENT_REVERSAL_FLAG = {
  NORMAL: 0,
  REVERSED: 1,
  REVERSAL: 2
} as const;

const REVERSAL_FLAG_LABEL: Record<number, string> = {
  [INVENTORY_MOVEMENT_REVERSAL_FLAG.NORMAL]: '正常',
  [INVENTORY_MOVEMENT_REVERSAL_FLAG.REVERSED]: '已冲销',
  [INVENTORY_MOVEMENT_REVERSAL_FLAG.REVERSAL]: '冲销记录'
};

export function isInventoryMovementReversed(row: { reversalFlag?: number | null }): boolean {
  return row.reversalFlag === INVENTORY_MOVEMENT_REVERSAL_FLAG.REVERSED;
}

export function formatInventoryMovementReversalFlag(flag?: number | null): string {
  if (flag == null) {
    return REVERSAL_FLAG_LABEL[INVENTORY_MOVEMENT_REVERSAL_FLAG.NORMAL];
  }
  return REVERSAL_FLAG_LABEL[flag] ?? String(flag);
}

export function getInventoryMovementReversalTagType(flag?: number | null): 'success' | 'warning' | 'info' {
  if (flag === INVENTORY_MOVEMENT_REVERSAL_FLAG.REVERSED) {
    return 'info';
  }
  if (flag === INVENTORY_MOVEMENT_REVERSAL_FLAG.REVERSAL) {
    return 'warning';
  }
  return 'success';
}

/**
 * 工单退�?/冲销
 */
export const returnWorkOrderInventory = (data: WorkOrderReturnForm): AxiosPromise<void> => {
  return request({
    url: '/wms/inventoryDetail/workOrderReturn',
    method: 'post',
    data
  });
};

/** sourceDocType=WO �? sourceDocCode 即工单号 */
export function resolveWorkOrderNo(row: WorkOrderReturnSourceRow): string {
  if (row.sourceDocType === WORK_ORDER_SOURCE_DOC_TYPE) {
    return String(row.sourceDocCode ?? '').trim();
  }
  return String(row.workOrderNo ?? row.sourceDocCode ?? '').trim();
}

/** 物料编码：itemCode 映射 materialCode */
export function resolveMaterialCode(row: WorkOrderReturnMaterialRow): string {
  return String(row.materialCode ?? row.itemCode ?? '').trim();
}

export function enrichWorkOrderReturnRow<T extends Record<string, unknown>>(row: T) {
  const sourceDocType = (row.sourceDocType as string | undefined) || WORK_ORDER_SOURCE_DOC_TYPE;
  return {
    ...row,
    sourceDocType,
    workOrderNo: resolveWorkOrderNo({ ...row, sourceDocType }),
    materialCode: resolveMaterialCode(row as WorkOrderReturnMaterialRow),
    sourceWarehouseCode: row.warehouseCode,
    sourceAreaCode: row.areaCode,
    sourceLocationCode: row.locationCode
  };
}

function formatPostingDate(postingDate?: string | null): string | undefined {
  if (!postingDate) {
    return undefined;
  }
  return postingDate.includes(' ') ? postingDate : `${postingDate} 00:00:00`;
}

export function buildWorkOrderReturnBo(item: Record<string, unknown>, extra?: Partial<WorkOrderReturnLineBO>): WorkOrderReturnLineBO {
  const sourceDocType = (item.sourceDocType as string | undefined) || WORK_ORDER_SOURCE_DOC_TYPE;
  const targetLocationCode = (item.targetLocationCode ?? item.locationCode) as string | undefined;
  return {
    moveType: item.moveType as string | undefined,
    batchCode: item.batchCode as string | undefined,
    businessCode: item.businessCode as string | undefined,
    businessName: item.businessName as string | undefined,
    workOrderNo: resolveWorkOrderNo({ ...item, sourceDocType }),
    materialCode: resolveMaterialCode(item as WorkOrderReturnMaterialRow),
    materialName: (item.materialName ?? item.itemName) as string | undefined,
    locationCode: targetLocationCode,
    sourceDocCode: item.sourceDocCode as string | undefined,
    sourceDocType,
    returnQuantity: item.returnQuantity as number | string | undefined,
    unit: item.unit as string | undefined,
    specialInventoryFlag: item.specialInventoryFlag as string | undefined,
    ...extra
  };
}

/** 工单冲销行：仅提�? SAP �?证字�? */
export function buildWorkOrderCancelLineBo(item: Record<string, unknown>): WorkOrderCancelLineBO {
  return {
    sapMaterialDocYear: item.sapMaterialDocYear as number | string | undefined,
    sapMaterialOrderNo: String(item.sapMaterialOrderNo ?? '').trim() || undefined,
    sapMaterialItem: String(item.sapMaterialItem ?? '').trim() || undefined
  };
}

function resolveBatchBktxt(bktxt?: string | null): string | undefined {
  const value = bktxt?.trim();
  return value || undefined;
}

export function buildWorkOrderReturnPayload(lines: WorkOrderReturnLineBO[], options: WorkOrderReturnBatchOptions): WorkOrderReturnForm {
  return {
    returnType: options.returnType,
    bktxt: resolveBatchBktxt(options.bktxt),
    postingDate: formatPostingDate(options.postingDate),
    workOrderReturnBoList: lines
  };
}

export function buildWorkOrderCancelPayload(lines: WorkOrderCancelLineBO[], options: WorkOrderReturnBatchOptions): WorkOrderReturnForm {
  return {
    returnType: 2,
    bktxt: resolveBatchBktxt(options.bktxt),
    postingDate: formatPostingDate(options.postingDate),
    workOrderReturnBoList: lines
  };
}
