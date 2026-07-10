import type { AxiosPromise } from 'axios';
import type { InventoryCheckRequest, InventoryCheckResultVO, MaterialLocationRow } from '@/api/wms/allocation/types';
import type { PrepDemandLineItem } from '@/api/wms/workOrderPrepDemand/types';

/** 缺料任务行（来自 wms_work_order_prep_demand_line，shortage_qty > 0） */
export interface ShortageTaskLineVO {
  id: number | string;
  demandId?: number | string;
  demandNo?: string;
  demandStatus?: string;
  /** 需求创建时间（用于满足分析排序） */
  createTime?: string;
  demandWoId?: number | string;
  workOrderNo?: string;
  reserveNo?: string;
  reserveItemNo?: string;
  materialCode?: string;
  materialName?: string;
  /** 缺料数量 */
  shortageQty?: number | string;
  pendingQty?: number | string;
  availableQty?: number | string;
  componentQty?: number | string;
  issuedQty?: number | string;
  unit?: string;
  lineType?: 'LOCATION' | 'SHORTAGE';
  warehouseRoute?: 'SHORTAGE' | string;
  lineStatus?: string;
  inventoryStatus?: string;
  shortageInventoryType?: 'UNRESTRICTED' | 'SALES_ORDER' | 'E' | string;
  specialInventoryFlag?: string;
  salesOrderNo?: string;
  salesOrderItem?: string;
  businessCode?: string;
  businessName?: string;
  materialUserCode?: string;
  materialUserName?: string;
  /** 平面仓目标需求库位（头表） */
  targetDemandLocationCode?: string;
  targetDemandWarehouseCode?: string;
  updateTime?: string;
}

/** 缺料任务需求单聚合 */
export interface ShortageTaskDemandGroupVO {
  demandId?: number | string;
  demandNo?: string;
  demandStatus?: string;
  workOrderCount?: number;
  materialUserCode?: string;
  materialUserName?: string;
  targetDemandLocationCode?: string;
  targetDemandWarehouseCode?: string;
  kitRate?: number | string;
  totalShortage?: number | string;
  shortageLineCount?: number;
  createTime?: string;
}

export interface ShortageTaskDemandGroup extends ShortageTaskDemandGroupVO {
  key: string;
}

/** 缺料任务列表查询 */
export interface ShortageTaskQuery extends PageQuery {
  demandId?: number | string;
  demandNo?: string;
  workOrderNo?: string;
  materialCode?: string;
  lineStatus?: string;
}

/** 需求满足状态（按需求时间 + 库存池模拟） */
export type ShortageFulfillmentStatus = 'FULL' | 'PARTIAL' | 'NONE';

export interface ShortageFulfillmentLineResult {
  lineId: number | string;
  workOrderNo?: string;
  materialCode?: string;
  materialName?: string;
  /** 原始缺料数量 */
  shortageQty: number;
  /** 发料任务待发/拣货中已占用数量 */
  issueTaskPendingQty: number;
  /** 扣除发料任务占用后的待分配缺料 */
  netShortageQty: number;
  /** 从库存池新分配数量 */
  poolAllocatedQty: number;
  /** 合计已覆盖量 = 发料任务占用 + 库存池分配 */
  allocatedQty: number;
  remainingQty: number;
  unit?: string;
  /** 特殊库存标识（N/E/K/W 等） */
  specialInventoryFlag?: string;
  shortageInventoryType?: string;
  salesOrderNo?: string;
  salesOrderItem?: string;
  /** 轮到本行时库存池可用量（已扣发料任务占用） */
  poolAvailableBefore: number;
  lineStatus?: string;
  fulfillmentStatus: ShortageFulfillmentStatus;
  recommendedInventories: ShortageRecommendedInventoryItem[];
  /** checkInventory 返回的推荐库位（与 BOM 一致） */
  checkInventoryRecommendedLocations?: MaterialLocationRow[];
  /** 用户在系统推荐弹窗中确认的手动库位选择 */
  manualLocationSelections?: MaterialLocationRow[];
  /** 手动调整库位/数量原因 */
  locationOverrideReason?: string;
  /** 平面仓目标需求库位 */
  targetDemandLocationCode?: string;
  targetDemandWarehouseCode?: string;
}

export interface ShortageRecommendedInventoryItem {
  inventoryDetailId?: string | number;
  warehouseCode?: string;
  locationCode?: string;
  batchCode?: string;
  allocatedQty: number;
  unit?: string;
  businessCode?: string;
}

export interface ShortageFulfillmentDemandResult {
  demandId?: number | string;
  demandNo?: string;
  demandCreateTime?: string;
  demandStatus?: string;
  materialUserCode?: string;
  materialUserName?: string;
  targetDemandLocationCode?: string;
  targetDemandWarehouseCode?: string;
  workOrderCount?: number;
  sortOrder: number;
  lineCount: number;
  totalShortageQty: number;
  totalAllocatedQty: number;
  totalRemainingQty: number;
  fulfillmentStatus: ShortageFulfillmentStatus;
  fulfilledLineCount: number;
  fulfillmentRate: number;
  lines: ShortageFulfillmentLineResult[];
}

export interface ShortageInventoryPoolSnapshot {
  poolKey: string;
  materialCode: string;
  materialName?: string;
  specialInventoryFlag?: string;
  shortageInventoryType: string;
  salesOrderNo?: string;
  salesOrderItem?: string;
  initialQty: number;
  allocatedQty: number;
  remainingQty: number;
  unit?: string;
}

/** 库存检查请求（工单模式传 workOrderNo；物料模式仅传 materialCodes） */
export type ShortageCheckInventoryRequest = Omit<InventoryCheckRequest, 'workOrderNo'> & {
  workOrderNo?: string;
};

/** checkInventory 分组方式：按工单或按物料 */
export type ShortageCheckInventoryGroupBy = 'workOrder' | 'material';

export interface ShortageFulfillmentSimulationOptions {
  /** 待分析的缺料行（通常为当前列表页） */
  lines: ShortageTaskLineVO[];
  /** 用于补充需求单元数据 */
  query?: ShortageTaskQuery;
  /** 是否排除发料任务中已存在的行，默认 true */
  excludeIssueTaskLines?: boolean;
  /** 已构建的需求元数据（传入后不再请求 demandSummary/list） */
  demandMetaMap?: Map<string, ShortageTaskDemandGroupVO>;
  /** checkInventory 分组方式，默认 workOrder；SCADA 看板使用 material */
  checkInventoryGroupBy?: ShortageCheckInventoryGroupBy;
  /** 库存检查接口（SCADA 看板使用 /wms/scada/shortageTask/checkInventory） */
  checkInventoryApi?: (data: ShortageCheckInventoryRequest) => AxiosPromise<InventoryCheckResultVO>;
}

export interface ShortageFulfillmentSimulationResult {
  demands: ShortageFulfillmentDemandResult[];
  pools: ShortageInventoryPoolSnapshot[];
  /** 缺料行 id -> 满足分析结果 */
  lineMap: Record<string, ShortageFulfillmentLineResult>;
  /** 因发料任务已存在而排除的缺料行 id */
  excludedIssueTaskLineIds: string[];
  summary: {
    demandCount: number;
    shortageLineCount: number;
    /** 当前页传入行数 */
    pageLineCount: number;
    /** 因发料任务已存在而排除的行数 */
    excludedByIssueTaskCount: number;
    fullCount: number;
    partialCount: number;
    noneCount: number;
    fullLineCount: number;
    partialLineCount: number;
    noneLineCount: number;
    poolMaterialCount: number;
    totalShortageQty: number;
    totalAllocatedQty: number;
    totalRemainingQty: number;
    /** 零库存断料占比（来自 checkInventory 返回的可用库存） */
    zeroStockShortageRate?: number;
    /** 重复物料占比（来自 checkInventory 返回的缺料行统计） */
    repeatMaterialRate?: number;
  };
}

/** 缺料任务-在原需求单上补充库位备料 */
export interface ShortageTaskGeneratePrepRequest {
  demandLineId: number | string;
  prepItems: PrepDemandLineItem[];
}

export interface ShortageTaskGeneratePrepResult {
  success?: boolean;
  message?: string;
  demandId?: number | string;
  demandLineId?: number | string;
  allocatedQty?: number | string;
  remainingShortageQty?: number | string;
}
