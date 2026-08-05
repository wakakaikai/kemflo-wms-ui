export interface PointVO {
  id: string | number;
  deviceId: string | number;
  deviceName?: string;
  pointCode: string;
  pointName: string;
  tagAddress: string;
  dataType?: string;
  unit?: string;
  rwMode?: string;
  scaleFactor?: number;
  offsetValue?: number;
  currentValue?: string;
  quality?: string;
  collectTime?: string;
  sortOrder?: number;
  status?: string;
  createTime?: string;
}

export interface PointForm extends BaseEntity {
  id?: string | number;
  deviceId?: string | number;
  pointCode?: string;
  pointName?: string;
  tagAddress?: string;
  dataType?: string;
  unit?: string;
  rwMode?: string;
  scaleFactor?: number;
  offsetValue?: number;
  sortOrder?: number;
  status?: string;
}

export interface PointQuery extends PageQuery {
  deviceId?: string | number;
  pointCode?: string;
  pointName?: string;
  status?: string;
}
