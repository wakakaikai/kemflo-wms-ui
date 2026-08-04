export interface DeviceShadowVO {
  id: string | number;
  deviceId: string | number;
  deviceName?: string;
  propertiesJson?: string;
  version?: number;
  lastReportTime?: string;
  createTime?: string;
}

export interface DeviceShadowForm extends BaseEntity {
  id?: string | number;
  deviceId?: string | number;
  propertiesJson?: string;
  version?: number;
}

export interface DeviceShadowQuery extends PageQuery {
  deviceId?: string | number;
  params?: any;
}
