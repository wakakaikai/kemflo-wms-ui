export interface PurchaseOrderDetailVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 采购订单号
   */
  poNumber: string;

  /**
   * 行项目号
   */
  itemNumber: number;

  /**
   * 物料号
   */
  materialCode: string;

  /**
   * 物料描述
   */
  materialDesc: string;

  /**
   * 短文本
   */
  shortText: string;

  /**
   * 交货日期
   */
  deliveryDate: string;

  /**
   * 订单数量
   */
  orderQuantity: number;

  /**
   * 订单单位
   */
  orderUnit: string;

  /**
   * 退货标识
   */
  returnFlag: string;

  /**
   * 已收货数量
   */
  receivedQuantity: number | string;

  /**
   * 未清数量
   */
  openQuantity: number | string;

  /**
   * 库存单位
   */
  inventoryUnit: string;

  /**
   * 换算比例
   */
  conversionRatio: number | string;

  /**
   * 删除标识：L-删除
   */
  itemDeleteFlag: string;

  /**
   * 已完成标识：X-已完成
   */
  completedFlag: string;

  /**
   * 备注
   */
  remark: string;
  /**
   * 是否同步SAP
   */
  enableSapSync: boolean;
}

export interface PurchaseOrderDetailForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 采购订单号
   */
  poNumber?: string;

  /**
   * 行项目号
   */
  itemNumber?: number;

  /**
   * 物料号
   */
  materialCode?: string;

  /**
   * 物料描述
   */
  materialDesc?: string;

  /**
   * 短文本
   */
  shortText?: string;

  /**
   * 交货日期
   */
  deliveryDate?: string;

  /**
   * 订单数量
   */
  orderQuantity?: number | string;

  /**
   * 订单单位
   */
  orderUnit?: string;

  /**
   * 退货标识
   */
  returnFlag?: string;

  /**
   * 已收货数量
   */
  receivedQuantity?: number | string;

  /**
   * 未清数量
   */
  openQuantity?: number | string;

  /**
   * 库存单位
   */
  inventoryUnit?: string;

  /**
   * 换算比例
   */
  conversionRatio?: number;

  /**
   * 删除标识：L-删除
   */
  itemDeleteFlag?: string;

  /**
   * 已完成标识：X-已完成
   */
  completedFlag?: string;

  /**
   * 备注
   */
  remark?: string;
}

export interface PurchaseOrderDetailQuery extends PageQuery {
  /**
   * 采购订单号
   */
  poNumber?: string;

  /**
   * 行项目号
   */
  itemNumber?: number;

  /**
   * 物料号
   */
  materialCode?: string;

  /**
   * 物料描述
   */
  materialDesc?: string;

  /**
   * 短文本
   */
  shortText?: string;

  /**
   * 交货日期
   */
  deliveryDate?: string;

  /**
   * 订单数量
   */
  orderQuantity?: number | string;

  /**
   * 订单单位
   */
  orderUnit?: string;

  /**
   * 退货标识
   */
  returnFlag?: string;

  /**
   * 已收货数量
   */
  receivedQuantity?: number | string;

  /**
   * 未清数量
   */
  openQuantity?: number | string;

  /**
   * 库存单位
   */
  inventoryUnit?: string;

  /**
   * 换算比例
   */
  conversionRatio?: number;

  /**
   * 删除标识：L-删除
   */
  itemDeleteFlag?: string;

  /**
   * 已完成标识：X-已完成
   */
  completedFlag?: string;

  /**
   * 日期范围参数
   */
  params?: any;
}
