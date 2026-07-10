/** 库位来源：用户手动选择 / 系统 FIFO 推荐（前端展示用） */
export type PrepDemandLocationSource = 'MANUAL' | 'SYSTEM';

/** FIFO 库位推荐明细 */
export interface PrepLocationRecVO {
  id?: number;
  demandId?: number;
  demandLineId?: number;
  workOrderNo?: string;
  materialCode?: string;
  batchCode?: string;
  locationCode?: string;
  warehouseCode?: string;
  areaCode?: string;
  /** 仓别路由（与 demand line 一致，按库位拆分时以本记录为准） */
  warehouseRoute?: 'AUTO' | 'LINE' | 'FLAT' | 'SHORTAGE';
  /** 发料数量 */
  issueQty?: number;
  /** 实际发货数量 */
  actualIssueQty?: number;
  /** 已发数量（261领料累计，库存单位） */
  issuedQty?: number;
  inventoryUnit?: string;
  /** 平面仓目标需求库位 */
  targetDemandLocationCode?: string;
  targetDemandWarehouseCode?: string;
  fifoSequence?: number;
  lineStatus?: string;
  /** 推荐来源：USER_SELECTED / SYSTEM_RECOMMENDED */
  recommendationSource?: import('./locationSource').PrepLocationRecommendationSource | string;
  /** 推荐理由 */
  recommendationReason?: string;
  /** 行级备注 */
  remark?: string;
  locationSource?: PrepDemandLocationSource;
  reserveNo?: string;
  /** 预留单项次 */
  reserveItemNo?: string;
  /** 特殊库存标识 */
  specialInventoryFlag?: string;
  /** 业务合作伙伴编码 */
  businessCode?: string;
  /** 业务合作伙伴名称 */
  businessName?: string;
  /** 超领编码（SAP grund） */
  overPickCode?: string;
  /** 超领原因 */
  overPickReason?: string;
}

/** 备料需求工单下的一条 BOM 物料行 */
export interface PrepDemandLineVO {
  id?: number;
  demandId?: number;
  demandWoId?: number;
  workOrderNo: string;
  materialCode: string;
  materialName?: string;
  componentQty?: number;
  issuedQty?: number;
  /** 待发数量（已换算为库存单位） */
  pendingQty?: number;
  issueQty?: number;
  availableQty?: number;
  shortageQty?: number;
  kitRate?: number;
  inventoryUnit?: string;
  locationRecs?: PrepLocationRecVO[];
  /** 仓别路由：AUTO 自动仓 / LINE 线边仓 / FLAT 平面仓 / SHORTAGE 缺料 */
  warehouseRoute?: 'AUTO' | 'LINE' | 'FLAT' | 'SHORTAGE';
  lineType?: 'LOCATION' | 'SHORTAGE';
  /** 库位来源：MANUAL 用户选择 / SYSTEM 系统推荐 */
  locationSource?: PrepDemandLocationSource;
  /** 库存类型（特殊库存标识：N/E/K/W 等） */
  specialInventoryFlag?: string;
  shortageInventoryType?: 'UNRESTRICTED' | 'SALES_ORDER' | 'E' | string;
  /** BOM 绑定销售订单号 */
  salesOrderNo?: string;
  /** BOM 绑定销售订单项次 */
  salesOrderItem?: string;
  /** SAP 预留单号 */
  reserveNo?: string;
  /** SAP 预留单项次 */
  reserveItemNo?: string;
  /** 业务合作伙伴编码（K/W 寄售等） */
  businessCode?: string;
  /** 业务合作伙伴名称 */
  businessName?: string;
  /** BOM 行 ID */
  bomLineId?: number | string;
}

/** 备料需求关联的工单头 */
export interface PrepDemandWoVO {
  id?: number;
  demandId?: number;
  workOrderNo: string;
  item?: string;
  itemDesc?: string;
  /** 工单销售订单号（E 库存缺料推断） */
  salesOrderNo?: string;
  salesOrderItem?: string;
  plannedQty?: number;
  unit?: string;
  kitRate?: number;
  totalRequired?: number;
  totalAvailable?: number;
  totalShortage?: number;
  shortageLines?: number;
  checkPassed?: boolean;
  lines?: PrepDemandLineVO[];
}

/** 备料需求状态（字典 wms_prepare_demand_status，创建默认 WAIT_PICK） */
export type PrepDemandStatus = string;

/** 备料需求单据类型 */
export type PrepDemandType = 'NORMAL' | 'OVER_PICK';

/** 备料需求头 */
export interface WorkOrderPrepDemandVO {
  id: number;
  demandNo: string;
  /** 单据类型：NORMAL-普通领料单, OVER_PICK-超领单 */
  demandType?: PrepDemandType | string;
  demandStatus?: PrepDemandStatus | string;
  workOrderCount?: number;
  issueId?: number;
  taskId?: number;
  totalRequired?: number;
  totalIssuedQty?: number;
  totalAvailable?: number;
  totalShortage?: number;
  kitRate?: number;
  checkPassed?: boolean;
  totalLines?: number;
  shortageLines?: number;
  partialLines?: number;
  kittedLines?: number;
  isEmergency?: boolean;
  emergencyLevel?: number;
  emergencyReason?: string;
  remark?: string;
  /** 平面仓目标需求库位（头表） */
  targetDemandLocationCode?: string;
  targetDemandWarehouseCode?: string;
  createTime?: string;
  workOrders?: PrepDemandWoVO[];
}

/** 生成备料需求时提交的明细行（按库位拆分或缺料行） */
export interface PrepDemandLineItem {
  workOrderNo: string;
  materialCode: string;
  prepQty: number;
  warehouseCode?: string;
  locationCode?: string;
  batchCode?: string;
  businessCode?: string;
  businessName?: string;
  /** 推荐来源：USER_SELECTED / SYSTEM_RECOMMENDED */
  recommendationSource?: import('./locationSource').PrepLocationRecommendationSource | string;
  /** 推荐理由 */
  recommendationReason?: string;
  /** 缺料行备注 */
  remark?: string;
  /** 超领编码（SAP grund） */
  overPickCode?: string;
  /** 超领原因 */
  overPickReason?: string;
  /** 目标需求库位（备料送达库位） */
  targetDemandLocationCode?: string;
  targetDemandWarehouseCode?: string;
  lineType?: 'LOCATION' | 'SHORTAGE';
  warehouseRoute?: 'AUTO' | 'LINE' | 'FLAT' | 'SHORTAGE';
  bomLineId?: number | string;
  /** SAP 预留单号 */
  reserveNo?: string;
  /** SAP 预留单项次 */
  reserveItemNo?: string;
  /** 库存类型（特殊库存标识：N/E/K/W 等） */
  specialInventoryFlag?: string;
}

/** 备料需求列表查询 */
export interface WorkOrderPrepDemandQuery extends PageQuery {
  demandNo?: string;
  demandType?: PrepDemandType | string;
  demandStatus?: PrepDemandStatus | string;
  checkPassed?: boolean;
  isEmergency?: boolean;
  /** 物料编码（模糊） */
  materialCode?: string;
  params?: {
    beginCreateTime?: string;
    endCreateTime?: string;
  };
}

/** 新增/修改备料需求头信息 */
export interface WorkOrderPrepDemandForm {
  id?: number;
  demandNo?: string;
  demandType?: PrepDemandType | string;
  demandStatus?: PrepDemandStatus | string;
  workOrderCount?: number;
  issueId?: number;
  taskId?: number;
  totalRequired?: number;
  kitRate?: number;
  checkPassed?: boolean;
  isEmergency?: boolean;
  emergencyLevel?: number;
  emergencyReason?: string;
  remark?: string;
}

/** 备料缺料库存类型 */
export type PrepDemandShortageType = 'UNRESTRICTED' | 'SALES_ORDER';

/** 备料需求清单展示行 */
export interface PrepDemandDisplayRow {
  rowKey: string;
  locationRecId?: number | string;
  warehouseRoute: 'AUTO' | 'LINE' | 'FLAT' | 'SHORTAGE';
  lineType: 'LOCATION' | 'SHORTAGE';
  lineStatus?: string;
  workOrderNo: string;
  materialCode: string;
  materialName: string;
  issueQty: number;
  /** BOM 总需求数量 componentQty（库存单位） */
  bomComponentQty?: number;
  /** 已发数量（261 领料累计，库存单位；新建备料需求默认为 0） */
  issuedQty?: number;
  /** 本次备料数量（库存单位） */
  prepQty?: number;
  /** 缺料数量 shortageQty（库存单位） */
  shortageQty?: number;
  availableQty: number;
  unit: string;
  /** 库存单位 inventoryUnit */
  inventoryUnit?: string;
  warehouseCode: string;
  locationCode: string;
  areaCode: string;
  batchCode: string;
  locationSource?: PrepDemandLocationSource;
  recommendationSource?: string;
  recommendationReason?: string;
  locationRemark?: string;
  shortageInventoryType?: PrepDemandShortageType;
  salesOrderNo?: string;
  salesOrderItem?: string;
  specialInventoryFlag?: string;
  businessCode?: string;
  businessName?: string;
  reserveNo?: string;
  reserveItemNo?: string;
  overPickCode?: string;
  overPickReason?: string;
}

/** 261 发料仓别路由 */
export type PrepDemand261Route = 'AUTO' | 'LINE';
