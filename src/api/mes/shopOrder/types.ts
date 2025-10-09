export interface ShopOrderVO {
  /**
   * 记录唯一ID
   */
  id: string | number;

  /**
   * 数据行索引
   */
  handle: string;

  /**
   * 工单
   */
  shopOrder: string;

  /**
   * 状态
   */
  status: string;

  /**
   * 工单类型
   */
  shopOrderType: string;

  /**
   * 工单优先级
   */
  priority: number;

  /**
   * 计划工作中心
   */
  plannedWorkCenterBo: string;

  /**
   * 计划物料
   */
  plannedItemBo: string;

  /**
   * 计划BOM
   */
  plannedBomBo: string;

  /**
   * 计划工艺路线
   */
  plannedRouterBo: string;

  /**
   * 实际物料
   */
  itemBo: string;

  /**
   * 实际BOM
   */
  bomBo: string;

  /**
   * 实际工艺路线
   */
  routerBo: string;

  /**
   * 计划生产数量
   */
  qtyToBuild: number;

  /**
   * 已下达数量
   */
  qtyReleased: number;

  /**
   * 下达数量
   */
  releaseQty: number;

  /**
   * 计划开始时间
   */
  plannedStartDate: string;

  /**
   * 计划完成时间
   */
  plannedCompDate: string;

  /**
   * 第一条码下达时间
   */
  releasedDate: string;

  /**
   * 完成数量
   */
  qtyDone: number;

  /**
   * 报废数量
   */
  qtyScrapped: number;

  /**
   * 实际开始时间
   */
  actualStartDate: string;

  /**
   * 实际完成时间
   */
  actualCompDate: string;

  /**
   * 客户编号
   */
  customer: string;

  /**
   * 客户订单号
   */
  customerOrder: string;

  /**
   * 超产比例
   */
  overDeliveryTolerance: number;

  /**
   * 考虑报废数量
   */
  considerScrap: string | number;

  /**
   * 备注
   */
  remark: string;
}

export interface ShopOrderForm extends BaseEntity {
  /**
   * 记录唯一ID
   */
  id?: string | number;

  /**
   * 数据行索引
   */
  handle?: string;

  /**
   * 工单
   */
  shopOrder?: string;

  /**
   * 是否条码样本
   */
  sample: boolean;

  /**
   * 状态
   */
  status?: string;

  /**
   * 状态描述
   */
  statusDesc?: string;

  /**
   * 工单类型
   */
  shopOrderType?: string;

  /**
   * 工单优先级
   */
  priority?: number;

  /**
   * 计划工作中心
   */
  plannedWorkCenterBo?: string;

  /**
   * 计划物料
   */
  plannedItemBo?: string;

  /**
   * 计划BOM
   */
  plannedBomBo?: string;

  /**
   * 计划工艺路线
   */
  plannedRouterBo?: string;

  /**
   * 实际物料
   */
  itemBo?: string;

  /**
   * 实际BOM
   */
  bomBo?: string;

  /**
   * 实际工艺路线
   */
  routerBo?: string;

  /**
   * 计划生产数量
   */
  qtyToBuild?: number;

  /**
   * 下达数量
   */
  releaseQty?: number;

  /**
   * 已下达数量
   */
  qtyReleased?: number;

  /**
   * 计划开始时间
   */
  plannedStartDate?: string;

  /**
   * 计划完成时间
   */
  plannedCompDate?: string;

  /**
   * 第一条码下达时间
   */
  releasedDate?: string;

  /**
   * 完成数量
   */
  qtyDone?: number;

  /**
   * 报废数量
   */
  qtyScrapped?: number;

  /**
   * 实际开始时间
   */
  actualStartDate?: string;

  /**
   * 实际完成时间
   */
  actualCompDate?: string;

  /**
   * 客户编号
   */
  customer?: string;

  /**
   * 客户订单号
   */
  customerOrder?: string;

  /**
   * 超产比例
   */
  overDeliveryTolerance?: number;

  /**
   * 考虑报废数量
   */
  considerScrap?: string | number;

  /**
   * 备注
   */
  remark?: string;
}

export interface ShopOrderQuery extends PageQuery {
  /**
   * 数据行索引
   */
  handle?: string;

  /**
   * 工单
   */
  shopOrder?: string;

  /**
   * 状态
   */
  status?: string;

  /**
   * 工单类型
   */
  shopOrderType?: string;

  /**
   * 工单优先级
   */
  priority?: number;

  /**
   * 计划工作中心
   */
  plannedWorkCenterBo?: string;

  /**
   * 计划物料
   */
  plannedItemBo?: string;

  /**
   * 计划BOM
   */
  plannedBomBo?: string;

  /**
   * 计划工艺路线
   */
  plannedRouterBo?: string;

  /**
   * 实际物料
   */
  itemBo?: string;

  /**
   * 实际BOM
   */
  bomBo?: string;

  /**
   * 实际工艺路线
   */
  routerBo?: string;

  /**
   * 计划生产数量
   */
  qtyToBuild?: number;

  /**
   * 下达数量
   */
  qtyReleased?: number;

  /**
   * 计划开始时间
   */
  plannedStartDate?: string;

  /**
   * 计划完成时间
   */
  plannedCompDate?: string;

  /**
   * 第一条码下达时间
   */
  releasedDate?: string;

  /**
   * 完成数量
   */
  qtyDone?: number;

  /**
   * 报废数量
   */
  qtyScrapped?: number;

  /**
   * 实际开始时间
   */
  actualStartDate?: string;

  /**
   * 实际完成时间
   */
  actualCompDate?: string;

  /**
   * 客户编号
   */
  customer?: string;

  /**
   * 客户订单号
   */
  customerOrder?: string;

  /**
   * 超产比例
   */
  overDeliveryTolerance?: number;

  /**
   * 考虑报废数量
   */
  considerScrap?: string | number;

  /**
   * 日期范围参数
   */
  params?: any;
}
export interface SfcPreviewVO {
  /**
   * 工单号
   */
  shopOrder: string;

  /**
   * 条码批次数量
   */
  qty: number;

  /**
   * 下达数量
   */
  releaseQty: number;

  /**
   * 条码样例
   */
  sfc: string;
  /**
   * 是否样例
   */
  sample?: boolean;
}
