export interface SupplierDeliveryDetail {
  id?: string | number;
  deliveryOrderId?: string | number;
  deliveryOrderNo?: string;
  lineNo?: number;
  labelCode?: string;
  poNumber: string;
  itemNumber: string;
  scheduleNumber?: string;
  materialCode: string;
  materialDesc?: string;
  quantity: number;
  unit?: string;
  batchCode: string;
  productionDate?: string;
  expiryDate?: string;
  packageNo?: number;
  packageCount?: number;
  specification?: string;
  packageMethod?: string;
  receivedQuantity?: number;
  status?: number;
  receiptNo?: string;
  receivedTime?: string;
  locationCode?: string;
  printCount?: number;
  lastPrintTime?: string;
  remark?: string;
}

export interface SupplierDeliveryOrder {
  id?: string | number;
  deliveryOrderNo?: string;
  supplierCode: string;
  supplierName?: string;
  shippingDate?: string;
  plannedArrivalDate?: string;
  contactPerson?: string;
  contactPhone?: string;
  carrier?: string;
  trackingNo?: string;
  vehicleNo?: string;
  status?: number;
  totalPackages?: number;
  totalQuantity?: number;
  receiptNo?: string;
  receivedTime?: string;
  remark?: string;
  createTime?: string;
  details: SupplierDeliveryDetail[];
}

export interface PurchaseLine {
  id: string | number;
  poNumber: string;
  itemNumber: string;
  scheduleNumber?: string;
  materialCode: string;
  materialDesc?: string;
  deliveryDate?: string;
  orderQuantity?: number;
  orderUnit?: string;
  receivedQuantity?: number;
  openQuantity?: number;
  inventoryUnit?: string;
  conversionRatio?: number;
  supplierCode?: string;
  supplierName?: string;
}
