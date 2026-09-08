export interface ContainerScadaQuery extends PageQuery {
  businessCode?: string;
  scrapBusinessCodes?: string[];
  warehouseCode?: string;
  itemCode?: string;
  dateTimeRange?: string[];
  params?: any;
}

export interface ContainerOverviewVO {
  inventoryTotal: number;
  inventoryYesterdayTotal: number;
  inventoryChangeRate: number;
  inboundTotal: number;
  inboundYesterdayTotal: number;
  inboundChangeRate: number;
  outboundTotal: number;
  outboundYesterdayTotal: number;
  outboundChangeRate: number;
  diffTotal: number;
  diffYesterdayTotal: number;
  diffChangeRate: number;
  scrapTotal: number;
  scrapYesterdayTotal: number;
  scrapChangeRate: number;
}

export interface ContainerFooterVO {
  customerTotal: number;
  insideQuantity: number;
  outsideQuantity: number;
  transitQuantity: number;
}

export interface ContainerTrendVO {
  date: string;
  inbound: number;
  outbound: number;
  diff: number;
}

export interface ContainerInventorySummaryVO {
  itemCode: string;
  itemName: string;
  inventoryQty: number;
  diffQty: number;
  percent: number;
}

export interface ContainerRegionVO {
  regionName: string;
  quantity: number;
  usageRate: number;
}

export interface ContainerPartnerTurnoverVO {
  businessName: string;
  itemName: string;
  itemCode: string;
  businessCode: string;
  inventoryQuantity: number;
  beginQuantity: number;
  inboundQuantity: number;
  outboundQuantity: number;
  diffQuantity: number;
  endQuantity: number;
  status: 'high' | 'recovery' | 'normal';
  updateTime: string;
}

/** @deprecated use ContainerScadaQuery */
export interface ContainerDiffQuery extends ContainerScadaQuery {}

/** @deprecated use ContainerPartnerTurnoverVO fields */
export interface ContainerDiffVO {
  itemCode: string;
  itemName: string;
  warehouseCode: string;
  businessCode: string;
  businessName: string;
  inboundQuantity: number;
  outboundQuantity: number;
  diffQuantity: number;
}

export interface ContainerMovementVO {
  id: string | number;
  itemName: string;
  moveType: string;
  inventoryDirection: number;
  quantity: number;
  unit: string;
  warehouseCode: string;
  locationCode: string;
  businessCode: string;
  businessName: string;
  moveDate: string;
}
