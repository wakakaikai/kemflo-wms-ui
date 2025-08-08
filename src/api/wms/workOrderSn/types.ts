export interface WorkOrderSnVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 公司名称
   */
  companyName: string;

  /**
   * 工单号
   */
  workOrderNo: string;

  /**
   * 条码
   */
  sn: string;

  /**
   * 数量
   */
  qty: number;

  /**
   * 顺序
   */
  sequence: number;

  /**
   * 生产线别
   */
  productLine: string;

  /**
   * 生产日期
   */
  productDate: string;

  /**
   * 状态
   */
  status: number;

  /**
   * 单位
   */
  unit: string;

  /**
   * 备注
   */
  remark: string;
}

export interface WorkOrderSnForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 公司名称
   */
  companyName?: string;

  /**
   * 工单号
   */
  workOrderNo?: string;

  /**
   * 条码
   */
  sn?: string;

  /**
   * 数量
   */
  qty?: number;

  /**
   * 顺序
   */
  sequence?: number;

  /**
   * 生产线别
   */
  productLine?: string;

  /**
   * 生产日期
   */
  productDate?: string;

  /**
   * 状态
   */
  status?: number;

  /**
   * 单位
   */
  unit: string;

  /**
   * 备注
   */
  remark?: string;
}

export interface WorkOrderSnQuery extends PageQuery {
  /**
   * 公司名称
   */
  companyName?: string;

  /**
   * 工单号
   */
  workOrderNo?: string;

  /**
   * 条码
   */
  sn?: string;

  /**
   * 数量
   */
  qty?: number;

  /**
   * 顺序
   */
  sequence?: number;

  /**
   * 生产线别
   */
  productLine?: string;

  /**
   * 生产日期
   */
  productDate?: string;

  /**
   * 状态
   */
  status?: number;

  /**
   * 单位
   */
  unit: string;

  /**
   * 日期范围参数
   */
  params?: any;
}
