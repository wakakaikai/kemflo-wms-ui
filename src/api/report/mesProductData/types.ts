export interface MesProductDataForm extends BaseEntity {
  /**
   * 客户出货通知ID
   */
  shippingCustomerNoticeId: string | number;

  /**
   * 物料
   */
  item?: string;

  /**
   * 产品条码
   */
  sfcStr?: string;

  /**
   * 产品条码列表
   */
  sfcList?: Array<string>;
}

export interface MesProductDataQuery extends PageQuery {
  /**
   * 工单号
   */
  shopOrder?: string;

  /**
   * 物料
   */
  item?: string;

  /**
   * 扫码时间范围
   */
  dateTimeRange?: string[];

  /**
   * 客户出货通知ID
   */
  shippingCustomerNoticeId: string | number;

  /**
   * 客户代码
   */
  customerCode?: string;

  /**
   * 产品条码
   */
  sfcStr?: string;

  /**
   * 产品条码列表
   */
  sfcList?: Array<string>;

  /**
   * 日期范围参数
   */
  params?: any;
}
