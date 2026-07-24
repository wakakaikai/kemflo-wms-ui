export interface ScCollectParamVO {
  id: string | number;
  deviceId: string | number;
  deviceCode?: string;
  deviceName?: string;
  protocolCode?: string;
  paramCode: string;
  paramName: string;
  description?: string;
  tagAddress: string;
  dataType?: string;
  dataLength?: number;
  unit?: string;
  unitDesc?: string;
  scaleFactor?: number;
  offsetValue?: number;
  sortOrder?: number;
  status?: number;
  remark?: string;
}

export interface ScCollectParamForm extends BaseEntity {
  id?: string | number;
  deviceId?: string | number;
  paramCode?: string;
  paramName?: string;
  description?: string;
  tagAddress?: string;
  dataType?: string;
  dataLength?: number;
  unit?: string;
  unitDesc?: string;
  scaleFactor?: number;
  offsetValue?: number;
  sortOrder?: number;
  status?: number;
  remark?: string;
}

export interface ScCollectParamQuery extends PageQuery {
  deviceId?: string | number;
  paramCode?: string;
  paramName?: string;
  dataType?: string;
  status?: number;
  params?: any;
}
