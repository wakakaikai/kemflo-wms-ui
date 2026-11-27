/** 栈板来源：1-WMS 2-MES */
export const PALLET_OUTBOUND_BIND_SOURCE_WMS = 1;
export const PALLET_OUTBOUND_BIND_SOURCE_MES = 2;

export interface PalletOutboundBindDetailVO {
  id: string | number;
  shippingNo: string;
  palletNo: string;
  sequence?: number;
  materialCode?: string;
  /** 物料描述（item_pallet.description） */
  materialDesc?: string;
}

export interface PalletOutboundBindVO {
  id: string | number;
  shippingNo: string;
  shippingFactory?: string;
  carrier?: string;
  vehicleType?: string;
  channel?: string;
  planNo?: string;
  lineItem?: string;
  customerItemCode?: string;
  customerItemDesc?: string;
  productId?: string;
  purchaseOrderNo?: string;
  purchaseLineNo?: string;
  qty?: number;
  receiveProvince?: string;
  receiveCity?: string;
  destWarehouseCode: string;
  destWarehouseName: string;
  address?: string;
  contactPerson?: string;
  ecommercePhone?: string;
  directOrderNo?: string;
  jdPurchaseOrderNo?: string;
  sourceType: number;
  status: number;
  palletCount: number;
  snCount: number;
  confirmTime?: string;
  createTime?: string;
  createByName?: string;
  remark?: string;
  detailList: PalletOutboundBindDetailVO[];
  palletNos: string[];
}

export interface PalletOutboundBindForm {
  destWarehouseCode: string;
  destWarehouseName: string;
  sourceType: number;
  remark?: string;
}

export interface PalletOutboundBindQuery extends PageQuery {
  orderByColumn?: string;
  isAsc?: string;
  shippingNo?: string;
  planNo?: string;
  customerItemCode?: string;
  purchaseOrderNo?: string;
  destWarehouseCode?: string;
  destWarehouseName?: string;
  sourceType?: number;
  status?: number;
  /** 按明细栈板号模糊查询主单 */
  palletNo?: string;
  /** 创建时间范围（最近绑定记录等场景） */
  params?: {
    beginCreateTime?: string;
    endCreateTime?: string;
  };
}
