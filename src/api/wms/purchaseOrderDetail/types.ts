export interface PurchaseOrderBomVO {
  id?: string | number;
  poNumber?: string;
  itemNumber?: string;
  scheduleNumber?: string;
  componentMaterial: string;
  componentDesc?: string;
  componentQty?: number;
  issueUomQty?: number;
  receivedQuantity?: number;
  openQuantity?: number;
  orderUnit?: string;
  conversionRatio?: number;
  inventoryUnit?: string;
  /** 托外扣料移动类型，入库列表展示为 543 */
  moveType?: string;
  /** 本次扣料数量（发料单位），用户可改，不限制上限 */
  consumeQuantity?: number;
  /** 本次扣料库存单位数量 = consumeQuantity * conversionRatio，提交后台扣料用此值 */
  inventoryQuantity?: number | string;
  /** 543 扣料所选库存明细 */
  inventoryDetailId?: string | number;
  warehouseCode?: string;
  areaCode?: string;
  locationCode?: string;
  batchCode?: string;
  specialInventoryFlag?: string;
  businessCode?: string;
  /** 同一 BOM 拆行分组键 */
  originBomKey?: string;
  inventorySplitKey?: string;
}

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
   * 入库检
   */
  receiptInspectionFlag: boolean;

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

  /** 当前采购排程对应的 BOM */
  purchaseOrderBomScheduleVoList?: PurchaseOrderBomVO[];
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
   * 入库检
   */
  receiptInspectionFlag?: boolean;

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
   * 入库检
   */
  receiptInspectionFlag?: boolean;

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
