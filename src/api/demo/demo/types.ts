export interface DemoVO {
  /**
   * 主键
   */
  id: string | number;

  /**
   * 部门id
   */
  deptId: string | number;

  /**
   * 用户id
   */
  userId: string | number;

  /**
   * 排序号
   */
  orderNum: number;

  /**
   * key键
   */
  testKey: string;

  /**
   * 值
   */
  value: string;
}

export interface DemoForm extends BaseEntity {
  /**
   * 主键
   */
  id?: string | number;

  /**
   * 部门id
   */
  deptId?: string | number;

  /**
   * 用户id
   */
  userId?: string | number;

  /**
   * 排序号
   */
  orderNum?: number;

  /**
   * key键
   */
  testKey?: string;

  /**
   * 值
   */
  value?: string;
}

export interface ShippingNoticeQuery extends PageQuery {
  /**
   * 客户代码
   */
  customerCode?: string;

  /**
   * 客户名称
   */
  customerName?: string

  /**
   * 客户订单号
   */
  customerOrder?: string;

  /**
   * 物料
   */
  item?: string;

  /**
   * 物料描述
   */
  itemDesc?: string;
}
