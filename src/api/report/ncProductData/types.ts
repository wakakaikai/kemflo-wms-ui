export type NcReportDimension = 'NC_ORDER' | 'STARTED_ORDER' | 'ALL_ORDER' | 'ITEM' | 'OPERATION' | 'NC_CODE' | 'DETAIL';

export interface NcReportQuery {
  dimension: NcReportDimension;
  beginTime: string;
  endTime: string;
  shopOrder?: string;
  item?: string;
  itemBo?: string;
  workCenter?: string;
  workCenterBo?: string;
  operation?: string;
  ncCode?: string;
  ncGroup?: string;
  ncState?: string;
  status?: string;
  shopOrderType?: string;
  shopOrderBo?: string;
  groupKey?: string;
  drillDimension?: NcReportDimension;
}

export interface NcReportOption {
  handle: string;
  code: string;
  description?: string;
  revision?: string;
}

export interface NcReportRow {
  id?: string | number;
  shopOrderBo?: string;
  shopOrder?: string;
  status?: string;
  shopOrderType?: string;
  plannedRouter?: string;
  plannedBom?: string;
  workCenter?: string;
  workCenterDescription?: string;
  item?: string;
  itemRevision?: string;
  itemDescription?: string;
  plannedStartDate?: string;
  plannedCompDate?: string;
  actualStartDate?: string;
  actualCompDate?: string;
  qtyToBuild?: number | string;
  qtyReleased?: number | string;
  qtyScrapped?: number | string;
  qtyDone?: number | string;
  ncQty?: number | string;
  recordCount?: number | string;
  sfcCount?: number | string;
  orderCount?: number | string;
  defectCount?: number | string;
  firstNcTime?: string;
  lastNcTime?: string;
  groupKey?: string;
  groupName?: string;
  groupDescription?: string;
  sfc?: string;
  dateTime?: string;
  ncCode?: string;
  ncCodeDescription?: string;
  ncGroup?: string;
  ncState?: string;
  ncCategory?: string;
  qty?: number | string;
  operation?: string;
  operationDescription?: string;
  resource?: string;
  resourceDescription?: string;
  creator?: string;
  createTime?: string;
  updater?: string;
  modifyTime?: string;
  remark?: string;
}

export interface NcReportPage {
  rows: NcReportRow[];
  total: number;
}
