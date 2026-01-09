export interface DeliveryOrderVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 交货单号
   */
  deliveryOrderNo: string;

  /**
   * 客户编号
   */
  customerNo: string;

  /**
   * 售达方
   */
  recipient: string;

  /**
   * 销售组织
   */
  salesOrg: string;

  /**
   * 装运点/收货点
   */
  shippingPoint: string;

  /**
   * 装运条件
   */
  shippingCondition: string;

  /**
   * 凭证类型
   */
  docType: string;

  /**
   * 拣配日期
   */
  pickingDate: string;

  /**
   * 装货日期
   */
  loadingDate: string;

  /**
   * 交货日期
   */
  deliveryDate: string;

  /**
   * 运输计划日期
   */
  transportPlanDate: string;

  /**
   * 发货日期
   */
  goodsIssueDate: string;

  /**
   * 备注
   */
  remark: string;

}

export interface DeliveryOrderForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 交货单号
   */
  deliveryOrderNo?: string;

  /**
   * 客户编号
   */
  customerNo?: string;

  /**
   * 售达方
   */
  recipient?: string;

  /**
   * 销售组织
   */
  salesOrg?: string;

  /**
   * 装运点/收货点
   */
  shippingPoint?: string;

  /**
   * 装运条件
   */
  shippingCondition?: string;

  /**
   * 凭证类型
   */
  docType?: string;

  /**
   * 拣配日期
   */
  pickingDate?: string;

  /**
   * 装货日期
   */
  loadingDate?: string;

  /**
   * 交货日期
   */
  deliveryDate?: string;

  /**
   * 运输计划日期
   */
  transportPlanDate?: string;

  /**
   * 发货日期
   */
  goodsIssueDate?: string;

  /**
   * 备注
   */
  remark?: string;

}

export interface DeliveryOrderQuery extends PageQuery {

  /**
   * 交货单号
   */
  deliveryOrderNo?: string;

  /**
   * 客户编号
   */
  customerNo?: string;

  /**
   * 售达方
   */
  recipient?: string;

  /**
   * 销售组织
   */
  salesOrg?: string;

  /**
   * 装运点/收货点
   */
  shippingPoint?: string;

  /**
   * 装运条件
   */
  shippingCondition?: string;

  /**
   * 凭证类型
   */
  docType?: string;

  /**
   * 拣配日期
   */
  pickingDate?: string;

  /**
   * 装货日期
   */
  loadingDate?: string;

  /**
   * 交货日期
   */
  deliveryDate?: string;

  /**
   * 运输计划日期
   */
  transportPlanDate?: string;

  /**
   * 发货日期
   */
  goodsIssueDate?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



