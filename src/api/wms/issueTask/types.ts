import type { PrepDemandLocationSource } from '@/api/wms/workOrderPrepDemand/types';
import type { PrepLocationRecommendationSource } from '@/api/wms/workOrderPrepDemand/locationSource';

/** 发料任务行（工单备料库位明细） */
export interface IssueTaskLineVO {
  id: number | string;
  demandId?: number | string;
  demandNo?: string;
  /** 单据类型：NORMAL-普通领料单, OVER_PICK-超领单 */
  demandType?: string;
  demandStatus?: string;
  demandLineId?: number | string;
  taskId?: number | string;
  taskNo?: string;
  issueId?: number | string;
  issueNo?: string;
  workOrderNo?: string;
  materialCode?: string;
  materialName?: string;
  warehouseCode?: string;
  warehouseName?: string;
  areaCode?: string;
  locationCode?: string;
  locationName?: string;
  batchCode?: string;
  /** 发料数量 */
  issueQty?: number | string;
  /** 实际发货数量 */
  actualIssueQty?: number | string;
  /** 已发数量（261领料累计，库存单位） */
  issuedQty?: number | string;
  inventoryUnit?: string;
  fifoSequence?: number;
  /** 行状态：WAIT_PICK-待拣货, PICKING-拣货中, SHORTAGE-缺料中, PICKED-已拣货, COMPLETE-已完成, CANCELLED-已取消 */
  lineStatus?: string;
  warehouseRoute?: 'AUTO' | 'LINE' | 'FLAT' | 'SHORTAGE';
  recommendationSource?: PrepLocationRecommendationSource | string;
  /** 推荐理由 */
  recommendationReason?: string;
  locationSource?: PrepDemandLocationSource;
  remark?: string;
  specialInventoryFlag?: string;
  businessCode?: string;
  businessName?: string;
  salesOrderNo?: string;
  salesOrderItem?: string;
  targetDemandLocationCode?: string;
  targetDemandWarehouseCode?: string;
  reserveNo?: string;
  reserveItemNo?: string;
  /** 超领编码（SAP grund） */
  overPickCode?: string;
  /** 超领原因 */
  overPickReason?: string;
  createTime?: string;
  issueTime?: string;
  receiveTime?: string;
}

/** 备料库位明细 261 领料单行 */
export interface PrepLocationRecIssueOutBo {
  locationCode: string;
  materialCode?: string;
  batchCode?: string;
  reserveNo?: string;
  reserveItemNo?: string;
  specialInventoryFlag?: string;
  businessCode?: string;
  businessName?: string;
  issueQuantity?: number | string;
  /** 实发数量（ACTUAL_DEDUCT_TRANS 模式，库存单位） */
  actualIssueQuantity?: number | string;
  /** 311 移转数量（实发超过待发时超出部分） */
  transferQuantity?: number | string;
  /** 311 移转目标库位 */
  targetLocationCode?: string;
  /** 领料单位（未传默认取库存单位 inventoryUnit） */
  issueUnit?: string;
  postingDate?: string;
  remark?: string;
  /** 超领编码（SAP grund） */
  overPickCode?: string;
  /** 超领原因 */
  overPickReason?: string;
}

/** 备料领料出库结果（/issueOut 接口 data） */
export interface PrepLocationRecIssueOutResultVo {
  /** 261扣账凭证号 */
  deduct261VoucherNo?: string;
  /** 311移转凭证号 */
  transfer311VoucherNo?: string;
  /** 结果说明 */
  message?: string;
}

/** 备料领料出库模式 */
export type PrepIssueMode = 'DIRECT_DEDUCT' | 'ACTUAL_DEDUCT_TRANS';

/** 备料库位明细领料批量请求 */
export interface PrepLocationRecIssueOutBatchBo {
  demandId: number | string;
  demandNo?: string;
  /** DIRECT_DEDUCT-直领全额扣料；ACTUAL_DEDUCT_TRANS-实发扣料+超量移转 */
  issueMode?: PrepIssueMode;
  issueOutBoList: PrepLocationRecIssueOutBo[];
}

/** 发料任务需求单聚合（需求汇总列表） */
export interface IssueTaskDemandGroupVO {
  demandId?: number | string;
  demandNo?: string;
  /** 单据类型：NORMAL-普通领料单, OVER_PICK-超领单 */
  demandType?: string;
  demandStatus?: string;
  workOrderCount?: number;
  materialUserCode?: string;
  materialUserName?: string;
  kitRate?: number | string;
  totalRequired?: number | string;
  totalShortage?: number | string;
  lineCount?: number;
  totalIssueQty?: number | string;
  totalIssuedQty?: number | string;
  pendingPickCount?: number;
  isEmergency?: boolean;
  /** 平面仓目标需求库位 */
  targetDemandLocationCode?: string;
  /** 平面仓目标需求库位描述 */
  targetDemandLocationCodeDesc?: string;
  targetDemandWarehouseCode?: string;
  createTime?: string;
}

/** 发料任务需求单聚合（带前端 key） */
export interface IssueTaskDemandGroup extends IssueTaskDemandGroupVO {
  key: string;
}

/** 发料任务列表查询 */
export interface IssueTaskQuery extends PageQuery {
  /** 仓别编码（主筛选） */
  warehouseCode?: string;
  demandId?: number | string;
  demandNo?: string;
  workOrderNo?: string;
  materialCode?: string;
  lineStatus?: string;
  warehouseRoute?: string;
}

/** 发料任务仓别选择缓存 */
export interface IssueTaskWarehouseCache {
  warehouseCode: string;
  warehouseName?: string;
}

export type IssueTaskViewMode = 'group' | 'detail';

export type IssueTaskLineLayoutMode = 'card' | 'table';

export type IssueTaskGroupLayoutMode = 'card' | 'table';
