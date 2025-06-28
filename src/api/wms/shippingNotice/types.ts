export interface TableColumns {
  /**
   * 表格列索引
   */
  key: number;

  /**
   * 表格列名
   */
  label: string;

  /**
   * 是否显示
   */
  visible: boolean;
}
export interface ShippingNoticeVO {
  /**
   * 主键
   */
  id: string | number;

  /**
   * 客户出货通知ID
   */
  shippingCustomerNoticeId: string | number;

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
   * 发货目的地
   */
  deliveryDestination: string;

  /**
   * 发货日期
   */
  deliveryTime: string | Date;

  /**
   * 物料
   */
  item: string;

  /**
   * 旧料号
   */
  oldItem: string;

  /**
   * 物料描述
   */
  itemDesc: string;

  /**
   * 数量
   */
  qty: number;

  /**
   * 数量备注
   */
  qtyRemark: string;

  /**
   * 状态（0代表默认 1代表新增 2代表修改 3代表删除）
   */
  status: number;

  /**
   * 备注
   */
  remark: string;

  /**
   * 二维码内容
   */
  qrCode: QRCodeContent;

  /**
   * 客户编码相同的数量
   */
  customerCodeCount: number | string;

  /**
   * 客户编码是否显示
   */
  customerCodeShow: number | string;
}

export interface ShippingNoticeForm extends BaseEntity {
  /**
   * 主键
   */
  id?: string | number;

  /**
   * 客户出货通知ID
   */
  shippingCustomerNoticeId?: string | number;

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
   * 发货目的地
   */
  deliveryDestination?: string;

  /**
   * 发货日期
   */
  deliveryTime?: string | Date;

  /**
   * 物料
   */
  item?: string;

  /**
   * 旧料号
   */
  oldItem?: string;

  /**
   * 物料描述
   */
  itemDesc?: string;

  /**
   * 数量
   */
  qty?: number;

  /**
   * 数量备注
   */
  qtyRemark?: string;

  /**
   * 状态（0代表默认 1代表新增 2代表修改 3代表删除）
   */
  status?: number;

  /**
   * 备注
   */
  remark?: string;
}

export interface ShippingNoticeQuery extends PageQuery {
  /**
   * 客户出货通知ID
   */
  shippingCustomerNoticeId?: string | number;

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
   * 发货目的地
   */
  deliveryDestination?: string;

  /**
   * 发货日期
   */
  deliveryTime?: string | Date;

  /**
   * 物料
   */
  item?: string;

  /**
   * 旧料号
   */
  oldItem?: string;

  /**
   * 物料描述
   */
  itemDesc?: string;

  /**
   * 数量
   */
  qty?: number;

  /**
   * 状态（0代表默认 1代表新增 2代表修改 3代表删除）
   */
  status?: number;

  /**
   * 状态列表
   */
  statusList: [];

  /**
   * 数量备注
   */
  qtyRemark?: string;

  /**
   * 日期范围参数
   */
  params?: any;
}

export interface QRCodeContent {
  value: string; // 二维码的内容值。
  size?: number; // 二维码大小。
  margin?: number; // 定义空白区的宽度应该是多少。
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'; // 维码的容错能力等级，取值为 'L', 'M', 'Q', 'H' 之一。
  dark?: string;
  light?: string;
}
