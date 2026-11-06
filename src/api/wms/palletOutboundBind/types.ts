/** 栈板来源：1-WMS 2-MES */
export const PALLET_OUTBOUND_BIND_SOURCE_WMS = 1;
export const PALLET_OUTBOUND_BIND_SOURCE_MES = 2;

export interface PalletOutboundBindDetailVO {
  id: string | number;
  shippingNo: string;
  palletNo: string;
  sequence?: number;
  materialCode?: string;
}

export interface PalletOutboundBindVO {
  id: string | number;
  shippingNo: string;
  destWarehouseCode: string;
  destWarehouseName: string;
  sourceType: number;
  status: number;
  palletCount: number;
  snCount: number;
  confirmTime?: string;
  createTime?: string;
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
  shippingNo?: string;
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
