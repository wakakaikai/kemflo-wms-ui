export interface WorkOrderProcessVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 工单号
   */
  workOrderNo: string;

  /**
   * 工艺路线
   */
  router: string;

  /**
   * 工序
   */
  process: string;

  /**
   * 工序短文本
   */
  processShortDesc: string;

  /**
   * 控制码
   */
  controlCode: string;

  /**
   * 工作中心
   */
  workCenter: string;

  /**
   * 工序状态
   */
  processStatus: string;

  /**
   * 基本数量
   */
  baseQty: number;

  /**
   * 员工人数
   */
  personNumber: number;

  /**
   * 机器时间
   */
  machineTime: number;

  /**
   * 机器时间单位
   */
  machineTimeUnit: string;

  /**
   * 人工时间
   */
  personTime: number;

  /**
   * 人工时间单位
   */
  personTimeUnit: string;

  /**
   * 仅排程
   */
  schedulingTime: number;

  /**
   * 仅排程单位
   */
  schedulingTimeUnit: string;

  /**
   * 模取数
   */
  moduleQty: number;

  /**
   * 模取数单位
   */
  moduleUnit: string;

  /**
   * 备注
   */
  remark: string;
}

export interface WorkOrderProcessForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 工单号
   */
  workOrderNo?: string;

  /**
   * 工艺路线
   */
  router?: string;

  /**
   * 工序
   */
  process?: string;

  /**
   * 工序短文本
   */
  processShortDesc?: string;

  /**
   * 控制码
   */
  controlCode?: string;

  /**
   * 工作中心
   */
  workCenter?: string;

  /**
   * 工序状态
   */
  processStatus?: string;

  /**
   * 基本数量
   */
  baseQty?: number;

  /**
   * 员工人数
   */
  personNumber?: number;

  /**
   * 机器时间
   */
  machineTime?: number;

  /**
   * 机器时间单位
   */
  machineTimeUnit?: string;

  /**
   * 人工时间
   */
  personTime?: number;

  /**
   * 人工时间单位
   */
  personTimeUnit?: string;

  /**
   * 仅排程
   */
  schedulingTime?: number;

  /**
   * 仅排程单位
   */
  schedulingTimeUnit?: string;

  /**
   * 模取数
   */
  moduleQty?: number;

  /**
   * 模取数单位
   */
  moduleUnit?: string;

  /**
   * 备注
   */
  remark?: string;
}

export interface WorkOrderProcessQuery extends PageQuery {
  /**
   * 工单号
   */
  workOrderNo?: string;

  /**
   * 工艺路线
   */
  router?: string;

  /**
   * 工序
   */
  process?: string;

  /**
   * 工序短文本
   */
  processShortDesc?: string;

  /**
   * 控制码
   */
  controlCode?: string;

  /**
   * 工作中心
   */
  workCenter?: string;

  /**
   * 工序状态
   */
  processStatus?: string;

  /**
   * 基本数量
   */
  baseQty?: number;

  /**
   * 员工人数
   */
  personNumber?: number;

  /**
   * 机器时间
   */
  machineTime?: number;

  /**
   * 机器时间单位
   */
  machineTimeUnit?: string;

  /**
   * 人工时间
   */
  personTime?: number;

  /**
   * 人工时间单位
   */
  personTimeUnit?: string;

  /**
   * 仅排程
   */
  schedulingTime?: number;

  /**
   * 仅排程单位
   */
  schedulingTimeUnit?: string;

  /**
   * 模取数
   */
  moduleQty?: number;

  /**
   * 模取数单位
   */
  moduleUnit?: string;

  /**
   * 日期范围参数
   */
  params?: any;
}
