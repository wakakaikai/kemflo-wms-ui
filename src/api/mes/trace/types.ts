/** 工艺路线步骤 */
export interface SfcStepVO {
  operation: string;
  operationDescription: string;
}

/** 工单信息 */
export interface ShopOrderEntityVO {
  shopOrder: string;
  itemBo: string;
  plannedRouterBo: string;
  routerBo: string;
  plannedWorkCenterBo: string;
  qtyToBuild: number | string;
  qtyDone: number | string;
}

/** 栈板信息 */
export interface PalletSnEntityVO {
  palletNo?: string;
}

/** 操作记录 */
export interface ActivityLogVO {
  dateTime?: string;
  actionCode?: string;
  actionDetail?: string;
  item?: string;
  itemRevision?: string;
  operation?: string;
  operationDesc?: string;
  resrce?: string;
  workCenter?: string;
  shopOrderBo?: string;
  userId?: string;
}

/** 关键件记录 */
export interface SfcAssyVO {
  componentBo?: string;
  componentDesc?: string;
  inventoryBo?: string;
  qty?: number | string;
  operationBo?: string;
  removed?: string;
}

/** 不良记录 */
export interface NcDataReportVO {
  sfc?: string;
  operation?: string;
  dateTime?: string;
  ncCode?: string;
  ncCodeDescription?: string;
  userId?: string;
  remark?: string;
}

/** 测试记录 */
export interface ParametricMeasureVO {
  measureStatus?: string;
  testDateTime?: string;
  userId?: string;
  measureName?: string;
  measureNameDesc?: string;
  highLimit?: number | string;
  lowLimit?: number | string;
  actual?: number | string;
  testStatus?: string;
  operation?: string;
}

/** BOM 组件 */
export interface BomComponentVO {
  sequence?: number | string;
  componentGbo?: string;
  componentDesc?: string;
  assemblyOperationBo?: string;
  operationDesc?: string;
  qty?: number | string;
}

/** 工单流转历史 */
export interface ShopOrderHistoryVO {
  shopOrder?: string;
  createTime?: string;
}

/** 条码追溯结果 */
export interface ProductTraceVO {
  transferSfc?: string;
  oldSfc?: string;
  palletSnEntity?: PalletSnEntityVO;
  shopOrderEntity?: ShopOrderEntityVO;
  itemDesc?: string;
  qty?: number | string;
  fqcSfc?: string;
  sfcStep?: number;
  sfcStepList?: SfcStepVO[];
  bomComponentEntityList?: BomComponentVO[];
  shopOrderEntityList?: ShopOrderHistoryVO[];
  operationActivityLogList?: ActivityLogVO[][];
  sfcAssyList?: SfcAssyVO[];
  operationParametricMeasureList?: ParametricMeasureVO[][];
  activityLogList?: ActivityLogVO[];
  ncDataReportVOList?: NcDataReportVO[];
}

export interface ProductTraceQuery {
  sfc: string;
}
