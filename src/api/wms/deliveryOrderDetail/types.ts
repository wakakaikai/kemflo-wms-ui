export interface DeliveryOrderDetailVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 交货单号
   */
  deliveryOrderNo: string;

  /**
   * 交货单行号
   */
  deliveryItemNo: string;

  /**
   * 交货项目类别
   */
  itemCategory: string;

  /**
   * 采购单号
   */
  purchaseOrderNo: string;

  /**
   * 采购单行号
   */
  purchaseItemNo: string;

  /**
   * 物料号
   */
  materialCode: string;

  /**
   * 物料描述
   */
  materialDesc: string;

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
   * 备注
   */
  remark: string;

}

export interface DeliveryOrderDetailForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 交货单号
   */
  deliveryOrderNo?: string;

  /**
   * 交货单行号
   */
  deliveryItemNo?: string;

  /**
   * 交货项目类别
   */
  itemCategory?: string;

  /**
   * 采购单号
   */
  purchaseOrderNo?: string;

  /**
   * 采购单行号
   */
  purchaseItemNo?: string;

  /**
   * 物料号
   */
  materialCode?: string;

  /**
   * 物料描述
   */
  materialDesc?: string;

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
   * 备注
   */
  remark?: string;

}

export interface DeliveryOrderDetailQuery extends PageQuery {

  /**
   * 交货单号
   */
  deliveryOrderNo?: string;

  /**
   * 交货单行号
   */
  deliveryItemNo?: string;

  /**
   * 交货项目类别
   */
  itemCategory?: string;

  /**
   * 采购单号
   */
  purchaseOrderNo?: string;

  /**
   * 采购单行号
   */
  purchaseItemNo?: string;

  /**
   * 物料号
   */
  materialCode?: string;

  /**
   * 物料描述
   */
  materialDesc?: string;

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
     * 日期范围参数
     */
    params?: any;
}



