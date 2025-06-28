export interface ShippingCustomerNoticeVO {
  /**
   * 主键
   */
  id: string | number;

  /**
   * 客户代码
   */
  customerCode: string;

  /**
   * 客户名称
   */
  customerName: string;

  /**
   * 发货日期
   */
  deliveryTime: string;

  /**
   * 计划总数量
   */
  totalQty: number;
}

export interface ShippingCustomerNoticeForm extends BaseEntity {
  /**
   * 主键
   */
  id?: string | number;

  /**
   * 客户代码
   */
  customerCode?: string;

  /**
   * 客户名称
   */
  customerName?: string;

  /**
   * 发货日期
   */
  deliveryTime?: string;

  /**
   * 计划总数量
   */
  totalQty?: number;
}

export interface ShippingCustomerNoticeQuery extends PageQuery {
  /**
   * 客户代码
   */
  customerCode?: string;

  /**
   * 客户名称
   */
  customerName?: string;

  /**
   * 发货日期
   */
  deliveryTime?: string;

  /**
   * 计划总数量
   */
  totalQty?: number;

  /**
   * 日期范围参数
   */
  params?: any;
}
