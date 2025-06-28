export interface ShippingDetailVO {
  /**
   * 主键
   */
  id: string | number;

  /**
   * 客户出货通知ID
   */
  shippingCustomerNoticeId: string | number;

  /**
   * 出货通知ID
   */
  shippingNoticeId: string | number;

  /**
   * 客户代码
   */
  customerCode: string;

  /**
   * 客户名称
   */
  customerName: string;

  /**
   * 客户订单号
   */
  customerNo: string;

  /**
   * 出货单号
   */
  shipmentNo: string;

  /**
   * 出货目的地和仓库
   */
  shipmentDestination: string;

  /**
   * 物料
   */
  item: string;

  /**
   * 物料描述
   */
  itemDesc: string;

  /**
   * 条码
   */
  sfc: string;

  /**
   * 扫码时间
   */
  dateTime: string;

  /**
   * 工单号
   */
  shopOrder: string;

  /**
   * 备注
   */
  remark: string;

  /**
   * 状态
   */
  status: number | string;
}

export interface ShippingDetailForm extends BaseEntity {
  /**
   * 主键
   */
  id?: string | number;

  /**
   * 客户出货通知ID
   */
  shippingCustomerNoticeId?: string | number;

  /**
   * 出货通知ID
   */
  shippingNoticeId?: string | number;

  /**
   * 客户代码
   */
  customerCode?: string;

  /**
   * 客户名称
   */
  customerName?: string;

  /**
   * 客户订单号
   */
  customerNo?: string;

  /**
   * 出货单号
   */
  shipmentNo?: string;

  /**
   * 出货目的地和仓库
   */
  shipmentDestination?: string;

  /**
   * 物料
   */
  item?: string;

  /**
   * 物料描述
   */
  itemDesc?: string;

  /**
   * 条码
   */
  sfc?: string;

  /**
   * 扫码时间
   */
  dateTime?: string;

  /**
   * 工单号
   */
  shopOrder?: string;

  /**
   * 备注
   */
  remark?: string;

  /**
   * 状态
   */
  status: number | string;
}

export interface ShippingDetailQuery extends PageQuery {
  /**
   * 客户出货通知ID
   */
  shippingCustomerNoticeId?: string | number;

  /**
   * 出货通知ID
   */
  shippingNoticeId?: string | number;

  /**
   * 客户代码
   */
  customerCode?: string;

  /**
   * 客户名称
   */
  customerName?: string;

  /**
   * 客户订单号
   */
  customerNo?: string;

  /**
   * 出货单号
   */
  shipmentNo?: string;

  /**
   * 出货目的地和仓库
   */
  shipmentDestination?: string;

  /**
   * 物料
   */
  item?: string;

  /**
   * 物料描述
   */
  itemDesc?: string;

  /**
   * 条码
   */
  sfc?: string;

  /**
   * 扫码时间
   */
  dateTime?: string;

  /**
   * 工单号
   */
  shopOrder?: string;

  /**
   * 其他参数
   */
  params?: any;

  /**
   * 状态
   */
  status: number | string;
}
