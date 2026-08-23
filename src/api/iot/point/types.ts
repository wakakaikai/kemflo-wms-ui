export interface PointVO {
  id: string | number;
  deviceId: string | number;
  deviceName?: string;
  pointCode: string;
  pointName: string;
  tagAddress: string;
  dataType?: string;
  displayFormat?: string;
  byteOrder?: string;
  unit?: string;
  displayEnabled?: string;
  displayMode?: string;
  displayCategory?: string;
  displayType?: string;
  displayName?: string;
  displayOrder?: number;
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
  displayFormat?: string;
  byteOrder?: string;
  unit?: string;
  displayEnabled?: string;
  displayMode?: string;
  displayCategory?: string;
  displayType?: string;
  displayName?: string;
  displayOrder?: number;
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

export interface PointDisplayConfigForm {
  id?: string | number;
  displayEnabled?: string;
  displayMode?: string;
  displayCategory?: string;
  displayType?: string;
  displayName?: string;
  displayOrder?: number;
}
