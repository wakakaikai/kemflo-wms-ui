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
  itemNumber: string;

  /**
   * DN单号
   */
  dnNumber: string;

  /**
   * 排程行号
   */
  scheduleNumber: string;

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
   * 已收数量
   */
  receivedQuantity: number;

  /**
   * 未清数量
   */
  openQuantity: number;

  /**
   * 库存单位
   */
  inventoryUnit: string;

  /**
   * 换算比例
   */
  conversionRatio: number;

  /**
   * 采购类别
   */
  poCategory: string;

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
   * 最早交货日期
   */
  earlyDeliveryDate: string;

  /**
   * 是否同步SAP
   */
  enableSapSync?: boolean;

  /**
   * 收货类型
   */
  receiveType?: string;
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
  itemNumber?: string;

  /**
   * DN单号
   */
  dnNumber?: string;

  /**
   * 排程行号
   */
  scheduleNumber?: string;

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
  orderQuantity?: number;

  /**
   * 订单单位
   */
  orderUnit?: string;

  /**
   * 退货标识
   */
  returnFlag?: string;

  /**
   * 已收数量
   */
  receivedQuantity?: number;

  /**
   * 未清数量
   */
  openQuantity?: number;

  /**
   * 库存单位
   */
  inventoryUnit?: string;

  /**
   * 换算比例
   */
  conversionRatio?: number;

  /**
   * 采购类别
   */
  poCategory?: string;

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

  /**
   * 最早交货日期
   */
  earlyDeliveryDate?: string;

  /**
   * 是否同步SAP
   */
  enableSapSync?: any;

  /**
   * 收货类型
   */
  receiveType?: string;
}

export interface PurchaseOrderDetailQuery extends PageQuery {
  /**
   * 采购订单号
   */
  poNumber?: string;

  /**
   * 行项目号
   */
  itemNumber?: string;

  /**
   * DN单号
   */
  dnNumber?: string;

  /**
   * 排程行号
   */
  scheduleNumber?: string;

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
  orderQuantity?: number;

  /**
   * 订单单位
   */
  orderUnit?: string;

  /**
   * 退货标识
   */
  returnFlag?: string;

  /**
   * 已收数量
   */
  receivedQuantity?: number;

  /**
   * 未清数量
   */
  openQuantity?: number;

  /**
   * 库存单位
   */
  inventoryUnit?: string;

  /**
   * 换算比例
   */
  conversionRatio?: number;

  /**
   * 采购类别
   */
  poCategory?: string;

  /**
   * 删除标识：L-删除
   */
  itemDeleteFlag?: string;

  /**
   * 已完成标识：X-已完成
   */
  completedFlag?: string;

  /**
   * 最早交货日期
   */
  earlyDeliveryDate?: string;

  /**
   * 是否同步SAP
   */
  enableSapSync?: boolean;

  /**
   * 收货类型
   */
  receiveType?: string;

  /**
   * 日期范围参数
   */
  params?: any;
}
