import type { MaterialUnitConversionVO } from '@/api/wms/materialUnitConversion/types';

export interface WorkOrderVO {
  id: number;
  workOrderNo: string;
  item: string;
  itemDesc: string;
  plannedStartDate: string;
  plannedEndDate: string;
  plannedQty: number;
  issuedQty: number;
  unit: string;
  salesOrderNo: string;
  /** 销售订单项次 */
  salesOrderItem?: string;
  soDeliveryDate: string;
  status: string;
  remark?: string;
  priority?: number;
  /** 部分发料：各物料本次发料数量（由 BOM 弹窗保存） */
  materialIssues?: WorkOrderMaterialIssueLine[];
  /** 工作台：系统推荐仓别路由 */
  warehouseRoute?: 'AUTO' | 'LINE' | 'FLAT' | 'SHORTAGE' | 'OTHER_LINE';
  /** 工作台：FIFO 推荐涉及的仓别 */
  recommendedWarehouses?: string[];
  /** 工作台：按库位拆分后的备料需求明细 */
  materialDemandDetails?: MaterialDemandDetailRow[];
}

/** 备料需求拆分行：按 FIFO 库位分配，部分缺料单独成行 */
export type MaterialDemandLineType = 'LOCATION' | 'SHORTAGE';

/** 缺料行所缺的库存类型 */
export type ShortageInventoryType = 'UNRESTRICTED' | 'SALES_ORDER';

export interface MaterialDemandDetailRow {
  workOrderNo: string;
  materialCode: string;
  /** 对应 BOM 行 ID（与用户勾选备料行一致） */
  bomLineId?: number | string;
  /** SAP 预留单号 */
  reserveNo?: string;
  /** SAP 预留单项次 */
  reserveItemNo?: string;
  issueQty: number;
  issueUnit?: string;
  /** 本次备料数量（库存单位，库位/缺料拆分行） */
  prepInventoryQty?: number;
  /** 库位信息中的 warehouseCode */
  recommendedWarehouse?: string;
  recommendedLocation?: string;
  /** 平面仓：物料备妥后送达的目标需求库位 */
  targetDemandLocationCode?: string;
  targetDemandWarehouseCode?: string;
  targetDemandLocationName?: string;
  /** 手动调整仓别/库位数量原因（生成备料时写入 prepItems.remark） */
  locationOverrideReason?: string;
  warehouseRoute: 'AUTO' | 'LINE' | 'FLAT' | 'SHORTAGE' | 'OTHER_LINE';
  lineType: MaterialDemandLineType;
  /** 缺料行：缺的是非限制库存还是销售订单库存(E) */
  shortageInventoryType?: ShortageInventoryType;
  areaCode?: string;
  batchCode?: string;
  fifoSequence?: number;
  /** 库位来源：MANUAL 用户选择 / SYSTEM 系统推荐 */
  locationSource?: import('@/api/wms/workOrderPrepDemand/types').PrepDemandLocationSource;
  /** 库位特殊库存标识 */
  specialInventoryFlag?: string;
  businessCode?: string;
  businessName?: string;
}

/** 工单物料本次发料行 */
export interface WorkOrderMaterialIssueLine {
  /** BOM 行 ID，同工单重复物料时区分各行 */
  bomLineId?: number | string;
  /** SAP 预留单号 */
  reserveNo?: string;
  /** SAP 预留单项次 */
  reserveItemNo?: string;
  materialCode: string;
  issueQty: number;
  /** 发料单位（可选计量单位） */
  issueUnit?: string;
  /** 换算比例：库存单位数量 = 发料单位数量 × conversionRatio */
  conversionRatio?: number;
  /** 用户确认的库位分配（库存单位数量） */
  manualLocationSelections?: Array<Record<string, unknown>>;
  /** 系统 FIFO 推荐库位（库存单位数量，备料保存时持久化） */
  fifoRecommendedLocations?: Array<Record<string, unknown>>;
  /** 非本人线边仓库存（仅展示，不可分配） */
  otherLineWarehouseLocations?: Array<Record<string, unknown>>;
  /** 与系统推荐不一致时的调整原因 */
  locationOverrideReason?: string;
  /** BOM 绑定销售订单（E 库存） */
  salesOrderNo?: string;
  salesOrderItem?: string;
  specialInventoryFlag?: string;
  /** 超领编码（字典 wms_material_over_pick） */
  overPickCode?: string;
  /** 超领原因 */
  overPickReason?: string;
  /** 工作台：按 FIFO 推荐仓别分类后的路由 */
  warehouseRoute?: 'AUTO' | 'LINE' | 'FLAT' | 'SHORTAGE' | 'OTHER_LINE';
  /** 工作台：FIFO 推荐主仓别编码 */
  recommendedWarehouse?: string;
}

export interface WorkOrderBomVO {
  id: number;
  workOrderNo: string;
  /** SAP 预留单号 */
  reserveNo?: string;
  /** SAP 预留单项次 */
  reserveItemNo?: string;
  /** 销售订单号（绑定销售订单库存 E 时使用） */
  salesOrderNo?: string;
  /** 销售订单项次 */
  salesOrderItem?: string;
  /** 特殊库存标识：E=销售订单库存 */
  specialInventoryFlag?: string;
  componentMaterial: string;
  componentDesc: string;
  componentQty: number;
  issuedQty: number;
  /** 已预约数量 */
  reservedQty?: number;
  unit: string;
  inventoryUnit: string;
  /** 发料单位数量（整单） */
  issueUomQty?: number;
  /** 换算比例：库存单位数量 = 发料单位数量 × conversionRatio */
  conversionRatio?: number;
  /** 待发（库存单位）= componentQty - issuedQty */
  pendingQty?: number;
  /** 用户填写的本次发料数量 */
  issueQty?: number;
  availableQty?: number;
  batchCount?: number;
  locationCount?: number;
  inventoryStatus?: string;
  /** 尺寸分类：LARGE-大件, SMALL-小件（物料主数据 sizeCategory） */
  sizeCategory?: string;
  /** 件型：大件 / 小件（由 sizeCategory 归一化，兼容旧字段） */
  partSizeType?: 'LARGE' | 'SMALL';
  /** 物料计量单位转换列表（发料单位可选） */
  materialUnitConversionList?: MaterialUnitConversionVO[];
  /** 当前选中的发料单位换算记录 ID */
  issueUnitConversionId?: string | number;
  /** 限定自动仓时：该物料在配置仓别的可用库存 */
  autoWarehouseAvailableQty?: number;
  /** 用户手动选择的库位明细 */
  manualLocationSelections?: Array<Record<string, unknown>>;
  /** 与系统推荐弹框一致的 FIFO 推荐库位明细（库存单位分配量） */
  fifoRecommendedLocations?: Array<Record<string, unknown>>;
  otherLineWarehouseLocations?: Array<Record<string, unknown>>;
  /** 与系统推荐不一致时的调整原因 */
  locationOverrideReason?: string;
  /** 物料级共享库存池（库存单位） */
  materialPoolQty?: number;
  /** 扣除前序同物料占用后的可用量（库存单位） */
  effectiveAvailableQty?: number;
  /** checkInventory 按 BOM 行返回的推荐库位（各行独立，不按物料合并） */
  checkInventoryRecommendedLocations?: MaterialLocationRow[];
}

export interface AllocationMaterialIssueItem {
  workOrderNo: string;
  materialCode: string;
  issueQty: number;
  warehouseCode?: string;
  locationCode?: string;
}

export interface AllocationRequest {
  workOrderNos: string[];
  strategyType?: string;
  generateMultiple?: boolean;
  isEmergency?: boolean;
  emergencyLevel?: number;
  emergencyReason?: string;
  /** 部分发料明细，不传则按 BOM 待发满额分配 */
  materialIssueItems?: AllocationMaterialIssueItem[];
  /** 工作台模式：AUTO 自动仓 / FLAT 平面仓 */
  workbenchMode?: 'AUTO' | 'FLAT';
  /** 自动仓仓别编码列表 */
  autoWarehouseCodes?: string[];
  /** 按库位拆分的备料明细（工作台生成备料需求） */
  prepItems?: import('@/api/wms/workOrderPrepDemand/types').PrepDemandLineItem[];
  /** 单据类型：NORMAL-普通领料单, OVER_PICK-超领单 */
  demandType?: import('@/api/wms/workOrderPrepDemand/types').PrepDemandType | string;
  /** 需求人员编码（字典 wms_material_user） */
  materialUserCode?: string;
  /** 需求人员姓名 */
  materialUserName?: string;
  /** 平面仓目标需求库位（头表） */
  targetDemandLocationCode?: string;
  targetDemandWarehouseCode?: string;
  remark?: string;
}

/** 工作台生成备料需求/分配方案接口返回 */
export interface AllocationGenerateResult {
  success?: boolean;
  message?: string;
  demand?: import('@/api/wms/workOrderPrepDemand/types').WorkOrderPrepDemandVO;
  plan?: AllocationPlanVO;
  inventoryCheck?: unknown;
}

/** 物料库存查询返回（/wms/inventoryDetail/materialInventory/{materialCode}） */
export interface MaterialInventoryResultVO {
  locations?: unknown[];
  batches?: unknown[];
  /** 自动仓编码列表（字典 wms_warehouse_auto） */
  autoWarehouses?: string[];
}

/** 库存检查接口返回（/wms/inventoryDetail/checkInventory） */
export interface InventoryCheckResultVO {
  sufficient?: boolean;
  checkPassed?: boolean;
  kitRate?: number;
  totalRequired?: number;
  totalAvailable?: number;
  totalShortage?: number;
  /** 缺料物料种类数 */
  shortageSkuCount?: number;
  /** 零库存缺料物料种类数 */
  zeroStockSkuCount?: number;
  /** 零库存断料占比 0~100 */
  zeroStockShortageRate?: number;
  /** 重复缺料物料种类数 */
  repeatMaterialSkuCount?: number;
  /** 重复物料占比 0~100 */
  repeatMaterialRate?: number;
  analysis?: Record<string, unknown>;
  materials?: Array<{
    materialCode?: string;
    materialName?: string;
    availableQty?: number;
    shortageQty?: number;
    status?: string;
    batchCount?: number;
    locationCount?: number;
  }>;
  lineResults?: Array<{
    /** BOM 行 ID，与 WorkOrderBomVO.id 对应（雪花 ID 须为字符串；勿用检查结果 id） */
    bomLineId?: number | string;
    id?: number | string;
    /** SAP 预留单号 */
    reserveNo?: string;
    /** SAP 预留单项次 */
    reserveItemNo?: string;
    salesOrderNo?: string;
    salesOrderItem?: string;
    materialCode?: string;
    componentMaterial?: string;
    pendingQty?: number;
    availableQty?: number;
    shortageQty?: number;
    status?: string;
    recommendedLocations?: Array<{
      locationCode?: string;
      warehouseCode?: string;
      areaCode?: string;
      availableQty?: number;
      recommendedQty?: number;
      fifoSequence?: number;
      pickSequence?: number;
      batchCode?: string;
      isLineWarehouse?: boolean;
      isUserLineWarehouse?: boolean;
      isAutoWarehouse?: boolean;
    }>;
  }>;
  /** 自动仓编码列表（字典 wms_warehouse_auto） */
  autoWarehouses?: string[];
}

export interface InventoryCheckRequest {
  workOrderNo: string;
  materialCodes?: string[];
  /** 缺料行数按物料编码统计（SCADA 重复物料占比） */
  materialShortageLineCounts?: Record<string, number>;
  /** 需求人工号 */
  demandUserNo?: string;
  /** 销售订单库存检查 */
  salesOrderNo?: string;
  salesOrderItem?: string;
  specialInventoryFlag?: string;
}

/** 备料需求库存检查返回（/wms/workOrderPrepDemand/checkInventory） */
export interface PrepDemandCheckInventoryResultVO {
  inventoryCheck?: InventoryCheckResultVO;
  autoWarehouses?: string[];
}

export interface AllocationPlanDetailVO {
  planInfo?: AllocationPlanVO;
  allocationDetails?: AllocationDetailVO[];
  workOrders?: WorkOrderVO[];
  statistics?: Record<string, unknown>;
}

export interface AllocationExecuteResult {
  success?: boolean;
  message?: string;
  pickingTask?: { id: number; taskNo: string };
  issueOrder?: { id: number; issueNo: string };
  planId?: number;
}

export interface AllocationPlanVO {
  id: number;
  planNo: string;
  planName: string;
  strategyType: string;
  strategyTypeDesc: string;
  workOrderCount: number;
  totalQuantity: number;
  pickLocationCount: number;
  totalDistance: number;
  avgKitRate: number;
  totalScore: number;
  planStatus: string;
  description: string;
  createTime: string;
  workOrderNos: string[];
  workOrders?: WorkOrderVO[];
}

export interface AllocationDetailVO {
  id: number;
  planNo: string;
  workOrderNo: string;
  materialCode: string;
  materialName: string;
  batchCode: string;
  locationCode: string;
  areaCode: string;
  warehouseCode: string;
  requiredQuantity: number;
  allocatedQuantity: number;
  pickSequence: number;
  distance: number;
  productionDate: string;
  allocationStatus: string;
  unit: string;
  expirationDate?: string;
  supplierBatchNo?: string;
  positionX?: number;
  positionY?: number;
  positionZ?: number;
}

export interface MaterialInventoryVO {
  materialCode: string;
  materialName: string;
  batchCode: string;
  locationCode: string;
  availableQuantity: number;
  unit: string;
  productionDate?: string;
  expirationDate?: string;
  supplierBatchNo?: string;
  distance?: number;
}
/** ---------- 发料工作台领域类型（自 views/allocation/utils 迁入） ---------- */

/** 发料工作台仓别路由 */
export type WarehouseRoute = 'AUTO' | 'LINE' | 'FLAT' | 'SHORTAGE' | 'OTHER_LINE';

export const FLAT_ISSUE_MOVEMENT = { transfer: '311', issue: '261' } as const;

export interface AutoWarehouseConfig {
  warehouseCodes: string[];
  movementType: string;
}

export const AUTO_ISSUE_MOVEMENT_TYPE = '261';

export const WORKBENCH_SUBTITLE = '选择工单并勾选备料清单，为物料分配库位后确认分类，按库位拆分自动仓、线边仓、平面仓、缺料需求';

export type DemandAggregateMode = 'material' | 'warehouse' | 'area' | 'location';

export const DEMAND_AGGREGATE_OPTIONS: { value: DemandAggregateMode; label: string }[] = [
  { value: 'material', label: '按物料' },
  { value: 'warehouse', label: '按仓别' },
  { value: 'area', label: '按库区' },
  { value: 'location', label: '按库位' }
];

export type InventoryCheckStatus = 'UNKNOWN' | 'SUFFICIENT' | 'PARTIAL' | 'SHORTAGE';

export type PartSizeType = 'LARGE' | 'SMALL';

export interface BomIssueRow {
  id?: number | string;
  workOrderNo?: string;
  /** SAP 预留单号 */
  reserveNo?: string;
  /** SAP 预留单项次 */
  reserveItemNo?: string;
  salesOrderNo?: string;
  salesOrderItem?: string;
  specialInventoryFlag?: string;
  componentMaterial: string;
  componentQty: number;
  issuedQty?: number;
  /** 已预约数量 */
  reservedQty?: number;
  pendingQty?: number;
  issueQty?: number;
  availableQty?: number;
  materialPoolQty?: number;
  effectiveAvailableQty?: number;
  conversionRatio?: number;
  issueUomQty?: number;
  unit?: string;
  inventoryUnit?: string;
  partSizeType?: PartSizeType;
  materialUnitConversionList?: MaterialUnitConversionVO[];
  issueUnitConversionId?: string | number;
  manualLocationSelections?: Array<Record<string, unknown>>;
  fifoRecommendedLocations?: Array<Record<string, unknown>>;
  otherLineWarehouseLocations?: Array<Record<string, unknown>>;
  locationOverrideReason?: string;
  checkInventoryRecommendedLocations?: MaterialLocationRow[];
}

export interface IssueUnitOption {
  label: string;
  value: string;
  conversion?: MaterialUnitConversionVO;
}

export interface BomRecommendPickItem {
  location: string;
  batch: string;
  qty: string;
  unit: string;
  specialInventoryFlag?: string;
  isOtherLine?: boolean;
  isAllocated?: boolean;
}

export interface MaterialLocationRow {
  rowKey: string;
  warehouseCode?: string;
  warehouseName?: string;
  areaCode?: string;
  locationCode?: string;
  batchCode?: string;
  receivedDate?: string;
  availableQuantity: number;
  inspectionQty: number;
  blockedQty: number;
  unit?: string;
  fifoSequence?: number;
  recommendedQty?: number;
  systemRecommendedQty?: number;
  isRecommended?: boolean;
  isLineWarehouse?: boolean;
  isUserLineWarehouse?: boolean;
  isAutoWarehouse?: boolean;
  fromCheckInventory?: boolean;
  specialInventoryFlag?: string;
  businessCode?: string;
  /** SAP E 库存：项次，与 businessCode（订单号）成对 */
  businessName?: string;
  salesOrderNo?: string;
  salesOrderItem?: string;
}

export interface InventoryTreeNode {
  rowKey: string;
  label: string;
  level: 'total' | 'warehouse' | 'location' | 'detail';
  unrestrictedQty: number;
  inspectionQty: number;
  blockedQty: number;
  batchCode?: string;
  receivedDate?: string;
  recommendedQty?: number;
  isLeaf?: boolean;
  isRecommended?: boolean;
  specialInventoryFlag?: string;
  businessCode?: string;
  sourceRow?: MaterialLocationRow;
  children?: InventoryTreeNode[];
}

export interface SalesOrderInventoryConstraint {
  salesOrderNo?: string;
  salesOrderItem?: string;
  specialInventoryFlag?: string;
}

export interface ClassifyMaterialInput {
  materialCode: string;
  issueQty: number;
}

export type ClassifiedMaterialRow = MaterialDemandDetailRow;

export interface WarehouseRouteContext {
  autoWarehouseCodes: string[];
  lineSideWarehouseCodes: string[];
}

export interface ClassifyWorkOrdersResult {
  orders: WorkOrderVO[];
  autoWarehouseCodes: string[];
  lineSideWarehouseCodes: string[];
}

/** workbenchClassify 内部库位行 */
export interface LocationRec {
  locationCode?: string;
  locationName?: string;
  warehouseCode?: string;
  areaCode?: string;
  availableQty?: number;
  recommendedQty?: number;
  fifoSequence?: number;
  batchCode?: string;
  isLineWarehouse?: boolean;
  isUserLineWarehouse?: boolean;
  isAutoWarehouse?: boolean;
  specialInventoryFlag?: string;
  businessCode?: string;
}

export interface BomLineResult {
  materialCode?: string;
  recommendedLocations?: LocationRec[];
  otherLineWarehouseLocations?: LocationRec[];
  /** 推荐库位来源：用户手动选择或系统 FIFO 推荐 */
  locationSource?: import('@/api/wms/workOrderPrepDemand/types').PrepDemandLocationSource;
}
