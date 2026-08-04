export interface DeviceEventVO {
  id: string | number;
  deviceId: string | number;
  deviceName?: string;
  eventType: string;
  eventDataJson?: string;
  eventTime?: string;
  createTime?: string;
}

export interface DeviceEventForm extends BaseEntity {
  id?: string | number;
  deviceId?: string | number;
  eventType?: string;
  eventDataJson?: string;
}

export interface DeviceEventQuery extends PageQuery {
  deviceId?: string | number;
  eventType?: string;
  params?: any;
}
