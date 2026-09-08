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
   * 状态列表
   */
  statusList: Array<string>;

  /**
   * 工单类型
   */
  shopOrderType: string;

  /**
   * 工单类型列表
   */
  shopOrderTypeList: Array<string>;

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
   * 计划物料
   */
  plannedItem: string;

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

  /**
   * 工单资源
   */
  resource: string;
}

export interface ImmediateShopOrderQuery extends PageQuery {
  shopOrder?: string;
  plannedItem?: string;
  plannedWorkCenter?: string;
  status?: string;
  shopOrderType?: string;
  plannedStartDateFrom?: string;
  plannedStartDateTo?: string;
  plannedCompDateFrom?: string;
  plannedCompDateTo?: string;
  actualStartDateFrom?: string;
  actualStartDateTo?: string;
  actualCompDateFrom?: string;
  actualCompDateTo?: string;
}

export interface ImmediateShopOrderVO {
  id: string | number;
  handle: string;
  shopOrder: string;
  status: string;
  shopOrderType: string;
  priority: number;
  plannedWorkCenterBo: string;
  plannedWorkCenter: string;
  plannedItemBo: string;
  plannedItem: string;
  plannedItemRevision: string;
  plannedItemDesc: string;
  plannedBomBo: string;
  plannedBom: string;
  plannedRouterBo: string;
  plannedRouter: string;
  qtyToBuild: number;
  qtyReleased: number;
  qtyScrapped: number;
  qtyDone: number;
  plannedStartDate: string;
  plannedCompDate: string;
  actualStartDate: string;
  actualCompDate: string;
  creator: string;
  createTime: string;
  updater: string;
  modifyTime: string;
}

export interface ImmediateOperationQuery extends PageQuery {
  shopOrderRef?: string;
}

export interface ImmediateOperationVO {
  id: string | number;
  operation: string;
  operationBo: string;
  operationDescription: string;
  stepId: string;
  routerBo: string;
  router: string;
  routerRevision: string;
  qtyInQueue: number;
  qtyInWork: number;
  qtyCompleted: number;
  stepSequence: number;
}

export interface ImmediateSfcQuery extends PageQuery {
  shopOrderRef?: string;
  operationRef?: string;
  routerRef?: string;
}

export interface ImmediateSfcVO {
  id: string | number;
  sfcBo: string;
  sfc: string;
  status: string;
  itemBo: string;
  item: string;
  itemRevision: string;
  itemDescription: string;
  shopOrder: string;
  routerBo: string;
  router: string;
  routerRevision: string;
  qty: number;
  operationBo: string;
  qtyInQueue: number;
  qtyInWork: number;
  qtyCompleted: number;
  sfcInWorkDateTime?: string;
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
   * 状态列表
   */
  statusList: Array<string>;

  /**
   * 状态描述
   */
  statusDesc?: string;

  /**
   * 工单类型
   */
  shopOrderType?: string;

  /**
   * 工单类型列表
   */
  shopOrderTypeList: Array<string>;

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

  /**
   * 资源
   */
  resource?: string;
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
   * 状态列表
   */
  statusList: Array<string>;

  /**
   * 工单类型
   */
  shopOrderType?: string;

  /**
   * 工单类型列表
   */
  shopOrderTypeList: Array<string>;

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
