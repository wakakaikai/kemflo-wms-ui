/** 货物移动行项目 */
export interface GoodsMovementLineVO {
  lineNo?: number;
  moveType?: string;
  itemCode?: string;
  itemName?: string;
  batchCode?: string;
  qty?: number;
  unit?: string;
  /** 源工厂 */
  plantCode?: string;
  plantName?: string;
  /** 源库位 */
  sourceWarehouseCode?: string;
  sourceAreaCode?: string;
  sourceLocationCode?: string;
  sourceLocationName?: string;
  /** 目标库位 */
  targetWarehouseCode?: string;
  targetAreaCode?: string;
  targetLocationCode?: string;
  targetLocationName?: string;
  /** 源库存类型 N-非限制 X-质检 S-冻结 */
  sourceInventoryType?: string;
  /** 目标库存类型 */
  targetInventoryType?: string;
  specialInventoryFlag?: string;
  businessCode?: string;
  businessName?: string;
  sourceDocType?: string;
  sourceDocCode?: string;
  sourceDocItem?: string;
  sapMaterialOrderNo?: string;
  sapMaterialItem?: string;
  sapMaterialDocYear?: number;
  inventoryDetailId?: string | number;
  remark?: string;
}

/** 货物移动抬头 */
export interface GoodsMovementHeaderVO {
  actionType: string;
  referenceType: string;
  referenceNo?: string;
  moveType: string;
  moveTypeDesc?: string;
  documentDate: string;
  postingDate: string;
  materialDocNo?: string;
  headerText?: string;
  printSlip?: string;
}

/** 显示物料凭证查询 */
export interface GoodsMovementDisplayQuery {
  sapMaterialOrderNo: string;
  sapMaterialDocYear?: number;
  pageNum?: number;
  pageSize?: number;
}

/** 过账请求 */
export interface GoodsMovementPostForm {
  header: GoodsMovementHeaderVO;
  lines: GoodsMovementLineVO[];
}

/** 检查结果 */
export interface GoodsMovementCheckResult {
  valid: boolean;
  messages: string[];
  warnings: string[];
}

/** 过账结果 */
export interface GoodsMovementPostResult {
  sapMaterialOrderNo?: string;
  sapMaterialDocYear?: number;
  message?: string;
}
