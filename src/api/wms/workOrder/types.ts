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
   * 产品料号
   */
  item: string;

  /**
   * 产品描述
   */
  itemDesc: string;

  /**
   * 入库检
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
   * 待入库数量
   */
  waitStockQty?: number;

  /**
   * 备注
   */
  remark: string;

  /**
   * 是否编辑状态
   */
  isEditing?: boolean;
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
   * 仓库编号
   */
  warehouseCode?: string;

  /**
   * 产品料号
   */
  item?: string;

  /**
   * 产品描述
   */
  itemDesc?: string;

  /**
   * 入库检
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
   * 待入库数量
   */
  waitStockQty?: number;

  /**
   * 打包数量
   */
  packingQty?: number;

  /**
   * 修改前原始打包数量
   */
  originPackingQty?: number;

  /**
   * 其他打包数量
   */
  otherPackingQty?: number;

  /**
   * 备注
   */
  remark?: string;
  /**
   * 最大可入库数量
   */
  inboundValue?: number;

  /**
   * 栈板编号
   */
  palletCode?: string;

  /**
   * 打包明细
   */
  packingDetailBoList: any[];

  /**
   * 是否编辑状态
   */
  isEditing?: boolean;
}

export interface WorkOrderQuery extends PageQuery {
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
   * 入库检
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
   * 待入库数量
   */
  waitStockQty?: number;

  /**
   * 打包数量
   */
  packingQty?: number;

  /**
   * 日期范围参数
   */
  params?: any;
}
