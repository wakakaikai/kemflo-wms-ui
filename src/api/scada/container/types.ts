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

export interface ContainerDiffQuery extends PageQuery {
  itemCode?: string;
  warehouseCode?: string;
  businessCode?: string;
  dateTimeRange?: string[];
  params?: any;
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
