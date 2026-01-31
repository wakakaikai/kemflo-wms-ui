export interface WorkOrderScadaPrintHistoryVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 工单号
   */
  workOrderNo: string;

  /**
   * 产品料号
   */
  item: string;

  /**
   * 产品描述
   */
  itemDesc: string;

  /**
   * 计划数量
   */
  plannedQty: number;

  /**
   * 看板卡数量
   */
  scadaQty: number;

  /**
   * 单位
   */
  unit: string;

  /**
   * 销售订单号
   */
  salesOrderNo: string;

  /**
   * 交货日
   */
  soDeliveryDate: string;

  /**
   * 工序
   */
  process: string;

  /**
   * 工序短文本
   */
  processShortDesc: string;

  /**
   * 工作中心
   */
  workCenter: string;

  /**
   * 前一制程工单号
   */
  previousStepOrderNo: string;

  /**
   * 前一制程工作中心
   */
  previousStepWorkCenter: string;

  /**
   * 前一制程完工时间
   */
  previousStepCompleteTime: string;

  /**
   * 下一制程工单号
   */
  nextStepOrderNo: string;

  /**
   * 下一制程工作中心
   */
  nextStepWorkCenter: string;

  /**
   * 下一制程开工时间
   */
  nextStepStartTime: string;

  /**
   * 标准人数
   */
  standardPerson: number;

  /**
   * 标准产能
   */
  standardCapacity: number;

  /**
   * 计划开工日期
   */
  plannedStartDate: string;

  /**
   * 计划完工日期
   */
  plannedEndDate: string;

  /**
   * 请求参数
   */
  requestParam: string;

}

export interface WorkOrderScadaPrintHistoryForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 工单号
   */
  workOrderNo?: string;

  /**
   * 产品料号
   */
  item?: string;

  /**
   * 产品描述
   */
  itemDesc?: string;

  /**
   * 计划数量
   */
  plannedQty?: number;

  /**
   * 看板卡数量
   */
  scadaQty?: number;

  /**
   * 单位
   */
  unit?: string;

  /**
   * 销售订单号
   */
  salesOrderNo?: string;

  /**
   * 交货日
   */
  soDeliveryDate?: string;

  /**
   * 工序
   */
  process?: string;

  /**
   * 工序短文本
   */
  processShortDesc?: string;

  /**
   * 工作中心
   */
  workCenter?: string;

  /**
   * 前一制程工单号
   */
  previousStepOrderNo?: string;

  /**
   * 前一制程工作中心
   */
  previousStepWorkCenter?: string;

  /**
   * 前一制程完工时间
   */
  previousStepCompleteTime?: string;

  /**
   * 下一制程工单号
   */
  nextStepOrderNo?: string;

  /**
   * 下一制程工作中心
   */
  nextStepWorkCenter?: string;

  /**
   * 下一制程开工时间
   */
  nextStepStartTime?: string;

  /**
   * 标准人数
   */
  standardPerson?: number;

  /**
   * 标准产能
   */
  standardCapacity?: number;

  /**
   * 计划开工日期
   */
  plannedStartDate?: string;

  /**
   * 计划完工日期
   */
  plannedEndDate?: string;

  /**
   * 请求参数
   */
  requestParam?: string;

}

export interface WorkOrderScadaPrintHistoryQuery extends PageQuery {

  /**
   * 工单号
   */
  workOrderNo?: string;

  /**
   * 产品料号
   */
  item?: string;

  /**
   * 产品描述
   */
  itemDesc?: string;

  /**
   * 计划数量
   */
  plannedQty?: number;

  /**
   * 看板卡数量
   */
  scadaQty?: number;

  /**
   * 单位
   */
  unit?: string;

  /**
   * 销售订单号
   */
  salesOrderNo?: string;

  /**
   * 交货日
   */
  soDeliveryDate?: string;

  /**
   * 工序
   */
  process?: string;

  /**
   * 工序短文本
   */
  processShortDesc?: string;

  /**
   * 工作中心
   */
  workCenter?: string;

  /**
   * 前一制程工单号
   */
  previousStepOrderNo?: string;

  /**
   * 前一制程工作中心
   */
  previousStepWorkCenter?: string;

  /**
   * 前一制程完工时间
   */
  previousStepCompleteTime?: string;

  /**
   * 下一制程工单号
   */
  nextStepOrderNo?: string;

  /**
   * 下一制程工作中心
   */
  nextStepWorkCenter?: string;

  /**
   * 下一制程开工时间
   */
  nextStepStartTime?: string;

  /**
   * 标准人数
   */
  standardPerson?: number;

  /**
   * 标准产能
   */
  standardCapacity?: number;

  /**
   * 计划开工日期
   */
  plannedStartDate?: string;

  /**
   * 计划完工日期
   */
  plannedEndDate?: string;

  /**
   * 请求参数
   */
  requestParam?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



