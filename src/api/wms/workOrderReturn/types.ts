/** 工单来源单据类型 */
export const WORK_ORDER_SOURCE_DOC_TYPE = 'WO';

/** 工单退料行 */
export interface WorkOrderReturnLineBO {
  moveType?: string;
  batchCode?: string;
  businessCode?: string;
  businessName?: string;
  workOrderNo?: string;
  materialCode?: string;
  materialName?: string;
  locationCode?: string;
  sourceDocCode?: string;
  sourceDocType?: string;
  returnQuantity?: number | string;
  unit?: string;
  specialInventoryFlag?: string;
  /** 前端表单字段，提交时映射为 locationCode */
  targetLocationCode?: string;
}

/** 工单冲销行（仅 SAP 凭证） */
export interface WorkOrderCancelLineBO {
  sapMaterialDocYear?: number | string;
  sapMaterialOrderNo?: string;
  sapMaterialItem?: string;
}

/** 工单退料/冲销提交 */
export interface WorkOrderReturnForm {
  workOrderReturnBoList: Array<WorkOrderReturnLineBO | WorkOrderCancelLineBO>;
  /** 1-退料 2-冲销 */
  returnType: 1 | 2;
  bktxt?: string;
  postingDate?: string;
}

/** 构建批量提交参数时的批次选项 */
export interface WorkOrderReturnBatchOptions {
  returnType: 1 | 2;
  bktxt?: string;
  postingDate?: string | null;
}

/** 解析工单号时的行字段 */
export interface WorkOrderReturnSourceRow {
  sourceDocType?: string;
  sourceDocCode?: string;
  workOrderNo?: string;
}

/** 解析物料编码时的行字段 */
export interface WorkOrderReturnMaterialRow {
  itemCode?: string;
  materialCode?: string;
}
