export interface DeviceVO {
  id: string | number;
  deviceCode: string;
  deviceName: string;
  protocol: string;
  transportCode?: string;
  host?: string;
  port?: number;
  connectionUrl?: string;
  connectionParamsJson?: string;
  collectInterval?: number;
  connectTimeout?: number;
  reconnectInterval?: number;
  onlineStatus?: string;
  lastOnlineTime?: string;
  deviceLocation?: string;
  status?: string;
  createTime?: string;
}

export interface DeviceForm extends BaseEntity {
  id?: string | number;
  deviceCode?: string;
  deviceName?: string;
  protocol?: string;
  transportCode?: string;
  host?: string;
  port?: number;
  connectionUrl?: string;
  connectionParamsJson?: string;
  collectInterval?: number;
  connectTimeout?: number;
  reconnectInterval?: number;
  deviceLocation?: string;
  status?: string;
}

export interface DeviceQuery extends PageQuery {
  deviceCode?: string;
  deviceName?: string;
  protocol?: string;
  onlineStatus?: string;
  status?: string;
}
