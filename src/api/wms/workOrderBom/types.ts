export interface WorkOrderBomVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 工单号
   */
  workOrderNo: string;

  /**
   * 组件料号
   */
  componentMaterial: string;

  /**
   * 组件描述
   */
  componentDesc?: string;

  /**
   * 预留单号
   */
  reserveNo?: string;

  /**
   * 预留单项次
   */
  reserveItemNo?: string;

  /**
   * 销售订单号
   */
  salesOrderNo?: string;

  /**
   * 销售订单项次
   */
  salesOrderItem?: string;

  /**
   * 特殊库存标识
   */
  specialInventoryFlag?: string;

  /**
   * 组件数量
   */
  componentQty: number;

  /**
   * 发料数量
   */
  issuedQty: number;

  /**
   * 单位
   */
  unit: string;

  /**
   * 备注
   */
  remark: string;
}

export interface WorkOrderBomForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 工单号
   */
  workOrderNo?: string;

  /**
   * 组件料号
   */
  componentMaterial?: string;

  /**
   * 组件数量
   */
  componentQty?: number;

  /**
   * 发料数量
   */
  issuedQty?: number;

  /**
   * 单位
   */
  unit?: string;

  /**
   * 备注
   */
  remark?: string;
}

export interface WorkOrderBomQuery extends PageQuery {
  /**
   * 工单号
   */
  workOrderNo?: string;

  /**
   * 组件料号
   */
  componentMaterial?: string;

  /**
   * 组件数量
   */
  componentQty?: number;

  /**
   * 发料数量
   */
  issuedQty?: number;

  /**
   * 单位
   */
  unit?: string;

  /**
   * 日期范围参数
   */
  params?: any;
}
