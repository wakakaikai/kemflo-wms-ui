export interface SalesOrderDetailVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 销售订单号
   */
  salesOrderNo: string;

  /**
   * 销售订单项次
   */
  salesItemNo: string;

  /**
   * 物料号
   */
  materialCode: string;

  /**
   * 物料描述
   */
  materialDesc: string;

  /**
   * 订单数量
   */
  orderQuantity: number;

  /**
   * 订单单位
   */
  orderUnit: string;

}

export interface SalesOrderDetailForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 销售订单号
   */
  salesOrderNo?: string;

  /**
   * 销售订单项次
   */
  salesItemNo?: string;

  /**
   * 物料号
   */
  materialCode?: string;

  /**
   * 物料描述
   */
  materialDesc?: string;

  /**
   * 订单数量
   */
  orderQuantity?: number;

  /**
   * 订单单位
   */
  orderUnit?: string;

}

export interface SalesOrderDetailQuery extends PageQuery {

  /**
   * 销售订单号
   */
  salesOrderNo?: string;

  /**
   * 销售订单项次
   */
  salesItemNo?: string;

  /**
   * 物料号
   */
  materialCode?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



