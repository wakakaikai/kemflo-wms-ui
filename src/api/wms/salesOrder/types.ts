export interface SalesOrderVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 销售订单号
   */
  salesOrderNo: string;

  /**
   * 凭证日期
   */
  voucherDate: string;

  /**
   * 凭证类型
   */
  voucherType: string;

  /**
   * 销售组织
   */
  salesOrg: string;

  /**
   * 分销渠道
   */
  salesChannel: string;

  /**
   * 产品组
   */
  productGroup: string;

  /**
   * 售达方
   */
  sellerParty: string;

}

export interface SalesOrderForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 销售订单号
   */
  salesOrderNo?: string;

  /**
   * 凭证日期
   */
  voucherDate?: string;

  /**
   * 凭证类型
   */
  voucherType?: string;

  /**
   * 销售组织
   */
  salesOrg?: string;

  /**
   * 分销渠道
   */
  salesChannel?: string;

  /**
   * 产品组
   */
  productGroup?: string;

  /**
   * 售达方
   */
  sellerParty?: string;

}

export interface SalesOrderQuery extends PageQuery {

  /**
   * 销售订单号
   */
  salesOrderNo?: string;

  /**
   * 凭证日期
   */
  voucherDate?: string;

  /**
   * 凭证类型
   */
  voucherType?: string;

  /**
   * 销售组织
   */
  salesOrg?: string;

  /**
   * 分销渠道
   */
  salesChannel?: string;

  /**
   * 产品组
   */
  productGroup?: string;

  /**
   * 售达方
   */
  sellerParty?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



