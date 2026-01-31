export interface WorkOrderVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 工单号
   */
  workOrderNo: string;

  /**
   * 工单状态
   */
  status: string;

  /**
   * 产品料号
   */
  item: string;

  /**
   * 产品描述
   */
  itemDesc: string;

  /**
   * 是否需要入库检
   */
  checkEnable: number;

  /**
   * 计划开工日期
   */
  plannedStartDate: string;

  /**
   * 计划完工日期
   */
  plannedEndDate: string;

  /**
   * 计划数量
   */
  plannedQty: number;

  /**
   * 已交货数量
   */
  deliveredQty: number;

  /**
   * 下达数量
   */
  issuedQty: number;

  /**
   * 单位
   */
  unit: string;

  /**
   * 销售订单号
   */
  salesOrderNo: string;

  /**
   * 销售订单项次
   */
  salesOrderItem: string;

  /**
   * 销售订单交货日
   */
  soDeliveryDate: string;

  /**
   * 上阶工单号
   */
  previousOrderNo: string;

  /**
   * 备注
   */
  remark: string;

  /**
   * 工单优先级
   */
  priority: number;
}

export interface WorkOrderForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 工单号
   */
  workOrderNo?: string;

  /**
   * 工单状态
   */
  status?: string;

  /**
   * 产品料号
   */
  item?: string;

  /**
   * 产品描述
   */
  itemDesc?: string;

  /**
   * 是否需要入库检
   */
  checkEnable?: number;

  /**
   * 计划开工日期
   */
  plannedStartDate?: string;

  /**
   * 计划完工日期
   */
  plannedEndDate?: string;

  /**
   * 计划数量
   */
  plannedQty?: number;

  /**
   * 已交货数量
   */
  deliveredQty?: number;

  /**
   * 下达数量
   */
  issuedQty?: number;

  /**
   * 单位
   */
  unit?: string;

  /**
   * 销售订单号
   */
  salesOrderNo?: string;

  /**
   * 销售订单项次
   */
  salesOrderItem?: string;

  /**
   * 销售订单交货日
   */
  soDeliveryDate?: string;

  /**
   * 上阶工单号
   */
  previousOrderNo?: string;

  /**
   * 备注
   */
  remark?: string;

  /**
   * 工单优先级
   */
  priority?: number;
}

export interface WorkOrderQuery extends PageQuery {
  /**
   * 工单号
   */
  workOrderNo?: string;

  /**
   * 工单状态
   */
  status?: string;

  /**
   * 产品料号
   */
  item?: string;

  /**
   * 产品描述
   */
  itemDesc?: string;

  /**
   * 是否需要入库检
   */
  checkEnable?: number;

  /**
   * 计划开工日期
   */
  plannedStartDate?: string;

  /**
   * 计划完工日期
   */
  plannedEndDate?: string;

  /**
   * 计划数量
   */
  plannedQty?: number;

  /**
   * 已交货数量
   */
  deliveredQty?: number;

  /**
   * 下达数量
   */
  issuedQty?: number;

  /**
   * 单位
   */
  unit?: string;

  /**
   * 销售订单号
   */
  salesOrderNo?: string;

  /**
   * 销售订单项次
   */
  salesOrderItem?: string;

  /**
   * 销售订单交货日
   */
  soDeliveryDate?: string;

  /**
   * 上阶工单号
   */
  previousOrderNo?: string;

  /**
   * 工单优先级
   */
  priority?: number;

  /**
   * 日期范围参数
   */
  params?: any;
}
