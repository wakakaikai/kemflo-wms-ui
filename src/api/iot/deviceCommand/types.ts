export interface DeviceCommandVO {
  id: string | number;
  deviceId: string | number;
  deviceName?: string;
  commandCode: string;
  commandParamsJson?: string;
  status?: string;
  sentTime?: string;
  responseJson?: string;
  createTime?: string;
}

export interface DeviceCommandForm extends BaseEntity {
  id?: string | number;
  deviceId?: string | number;
  commandCode?: string;
  commandParamsJson?: string;
  status?: string;
}

export interface DeviceCommandQuery extends PageQuery {
  deviceId?: string | number;
  commandCode?: string;
  status?: string;
  params?: any;
}
