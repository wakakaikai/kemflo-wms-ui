export interface ReceiptOrderDetailVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 入库单号
   */
  receiptOrderId: string | number;

  /**
   * 物料
   */
  item: string;

  /**
   * 计划数量
   */
  planQuantity: number;

  /**
   * 收货数量
   */
  realQuantity: number;

  /**
   * 计量单位
   */
  unit: string;

  /**
   * 入库状态
   */
  receiptOrderStatus: number;

  /**
   * 所属仓库
   */
  warehouseId: string | number;

  /**
   * 所属库区
   */
  areaId: string | number;

  /**
   * 所属货架
   */
  rackId: string | number;

  /**
   * 备注
   */
  remark: string;

}

export interface ReceiptOrderDetailForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 入库单号
   */
  receiptOrderId?: string | number;

  /**
   * 物料
   */
  item?: string;

  /**
   * 计划数量
   */
  planQuantity?: number;

  /**
   * 收货数量
   */
  realQuantity?: number;

  /**
   * 计量单位
   */
  unit?: string;

  /**
   * 入库状态
   */
  receiptOrderStatus?: number;

  /**
   * 所属仓库
   */
  warehouseId?: string | number;

  /**
   * 所属库区
   */
  areaId?: string | number;

  /**
   * 所属货架
   */
  rackId?: string | number;

  /**
   * 备注
   */
  remark?: string;

}

export interface ReceiptOrderDetailQuery extends PageQuery {

  /**
   * 入库单号
   */
  receiptOrderId?: string | number;

  /**
   * 物料
   */
  item?: string;

  /**
   * 计划数量
   */
  planQuantity?: number;

  /**
   * 收货数量
   */
  realQuantity?: number;

  /**
   * 计量单位
   */
  unit?: string;

  /**
   * 入库状态
   */
  receiptOrderStatus?: number;

  /**
   * 所属仓库
   */
  warehouseId?: string | number;

  /**
   * 所属库区
   */
  areaId?: string | number;

  /**
   * 所属货架
   */
  rackId?: string | number;

    /**
     * 日期范围参数
     */
    params?: any;
}



