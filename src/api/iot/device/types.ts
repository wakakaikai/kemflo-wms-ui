export interface DeviceVO {
  id: string | number;
  deviceCode: string;
  deviceName: string;
  deviceBrand?: string;
  systemBrand?: string;
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
  lastOfflineTime?: string;
  deviceLocation?: string;
  displayView?: string;
  status?: string;
  createTime?: string;
}

export interface DeviceForm extends BaseEntity {
  id?: string | number;
  deviceCode?: string;
  deviceName?: string;
  deviceBrand?: string;
  systemBrand?: string;
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
  displayView?: string;
  status?: string;
}

export interface DeviceQuery extends PageQuery {
  deviceCode?: string;
  deviceName?: string;
  deviceBrand?: string;
  systemBrand?: string;
  protocol?: string;
  onlineStatus?: string;
  status?: string;
}

export interface DeviceCopyForm {
  sourceDeviceId?: string | number;
  deviceCode?: string;
  deviceName?: string;
  copyPoints?: boolean;
}

export interface DeviceStatusEvent {
  messageType: 'iot-device-status';
  deviceId: string | number;
  deviceCode?: string;
  onlineStatus: string;
  lastOnlineTime?: string;
  lastOfflineTime?: string;
}

export interface TcpMessageEvent {
  messageType: 'iot-tcp-message';
  deviceId: string | number;
  deviceCode?: string;
  receiveTime?: string;
  tcpMessageType?: string;
  payload?: string;
}
