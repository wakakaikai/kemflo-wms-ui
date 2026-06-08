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
  soDeliveryDate: string;
  status: string;
  remark?: string;
  priority?: number;
  /** 部分发料：各物料本次发料数量（由 BOM 弹窗保存） */
  materialIssues?: WorkOrderMaterialIssueLine[];
}

/** 工单物料本次发料行 */
export interface WorkOrderMaterialIssueLine {
  materialCode: string;
  issueQty: number;
}

export interface WorkOrderBomVO {
  id: number;
  workOrderNo: string;
  componentMaterial: string;
  componentDesc: string;
  componentQty: number;
  issuedQty: number;
  unit: string;
  inventoryUnit: string;
  /** 待发 = componentQty - issuedQty */
  pendingQty?: number;
  /** 用户填写的本次发料数量 */
  issueQty?: number;
  availableQty?: number;
  batchCount?: number;
  locationCount?: number;
  inventoryStatus?: string;
}

export interface AllocationMaterialIssueItem {
  workOrderNo: string;
  materialCode: string;
  issueQty: number;
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
}

export interface EmergencyAllocationRequest {
  insertWorkOrderNo: string;
  existingOrderNos?: string[];
  emergencyLevel?: number;
  emergencyReason?: string;
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
