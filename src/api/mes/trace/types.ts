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

/** 不良记录（NcDataVo） */
export interface NcDataVO {
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

/** 栈板 WMS 出货绑定（追溯） */
export interface SfcTracePalletOutboundVO {
  shippingNo?: string;
  palletNo?: string;
  destWarehouseCode?: string;
  destWarehouseName?: string;
  /** 0-草稿 1-绑定中 2-已确认 3-已取消 */
  status?: number;
  confirmTime?: string;
}

/** 条码追溯结果 */
export interface ProductTraceVO {
  transferSfc?: string;
  oldSfc?: string;
  palletSnVo?: PalletSnEntityVO;
  /** 栈板已绑 WMS 出货单时的目的地等信息 */
  palletOutboundVoList?: SfcTracePalletOutboundVO[];
  /** 条码状态（sfc.status） */
  sfcStatus?: string;
  /** 条码状态描述 */
  sfcStatusDesc?: string;
  shopOrderVo?: ShopOrderEntityVO;
  itemDesc?: string;
  qty?: number | string;
  fqcSfc?: string;
  sfcStep?: number;
  sfcStepVoList?: SfcStepVO[];
  bomComponentVoList?: BomComponentVO[];
  shopOrderVoList?: ShopOrderHistoryVO[];
  operationActivityLogVoList?: ActivityLogVO[][];
  sfcAssyVoList?: SfcAssyVO[];
  operationParametricMeasureVoList?: ParametricMeasureVO[][];
  activityLogVoList?: ActivityLogVO[];
  ncDataVoList?: NcDataVO[];
}

export interface ProductTraceQuery {
  sfc: string;
}
