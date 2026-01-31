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
}

export interface AllocationRequest {
  workOrderNos: string[];
  strategyType?: string;
  generateMultiple?: boolean;
  isEmergency?: boolean;
  emergencyLevel?: number;
  emergencyReason?: string;
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
