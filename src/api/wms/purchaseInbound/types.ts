// 采购入库查询参数类型
export interface PurchaseInboundQuery extends PageQuery {
  inboundNo?: string;
  purchaseOrderNo?: string;
  supplierName?: string;
  status?: string;
}

// 采购入库明细表类型
export interface PurchaseInboundItem {
  id?: string | number;
  inboundId?: string | number;
  productCode?: string;
  productName?: string;
  productSpec?: string;
  unit?: string;
  purchasePrice?: number;
  purchaseQuantity?: number;
  inboundQuantity?: number;
  amount?: number;
  warehouseLocation?: string;
  purchaseOrderDetailId?: string | number;
}

// 采购入库表单类型
export interface PurchaseInboundForm {
  id?: string | number;
  inboundNo?: string;
  purchaseOrderId?: string | number;
  purchaseOrderNo?: string;
  supplierId?: string | number;
  supplierName?: string;
  inboundDate?: string;
  warehouseId?: string | number;
  warehouseName?: string;
  status?: string;
  totalAmount?: number;
  totalQuantity?: number;
  remark?: string;
  details?: PurchaseInboundItem[];
}

// 采购入库视图对象类型
export interface PurchaseInboundVO extends PurchaseInboundForm {
  id: string | number;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
}
