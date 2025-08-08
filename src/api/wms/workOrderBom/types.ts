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
