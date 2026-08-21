export interface PurchaseOrderBomVO {
  id?: string | number;
  poNumber?: string;
  itemNumber?: string;
  scheduleNumber?: string;
  componentMaterial?: string;
  componentDesc?: string;
  componentQty?: number;
  issueUomQty?: number;
  receivedQuantity?: number;
  openQuantity?: number;
  orderUnit?: string;
  conversionRatio?: number;
  inventoryUnit?: string;
  supplierCode?: string;
  supplierName?: string;
  remark?: string;
}

export interface PurchaseOrderBomQuery extends PageQuery {
  poNumber?: string;
  itemNumber?: string;
  componentMaterial?: string;
  componentDesc?: string;
  orderUnit?: string;
  inventoryUnit?: string;
  showOpenQuantityZero?: boolean;
  params?: any;
}

export interface PurchaseOrderSubcontractIssueForm {
  issueMode?: 'PO' | 'MATERIAL';
  poNumber?: string;
  itemNumber?: string;
  materialCode?: string;
  materialDesc?: string;
  supplierCode?: string;
  supplierName?: string;
  issueQuantity?: number;
  unit?: string;
  locationCode?: string;
  warehouseCode?: string;
  areaCode?: string;
  batchCode?: string;
  specialInventoryFlag?: string;
  postingDate?: string;
  remark?: string;
}

export interface PurchaseOrderSubcontractIssueBatchForm {
  purchaseOrderSubcontractIssueBoList: PurchaseOrderSubcontractIssueForm[];
  bktxt?: string;
  mtsnr?: string;
  postingDate?: string;
}
