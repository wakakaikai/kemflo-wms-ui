export interface ScCollectDeviceVO {
  id: string | number;
  deviceCode: string;
  deviceName: string;
  protocolCode: string;
  transportCode?: string;
  host?: string;
  port?: number;
  connectionParams?: string;
  connectionUrl?: string;
  collectInterval?: number;
  connectTimeout?: number;
  reconnectInterval?: number;
  status?: number;
  remark?: string;
}

export interface ScCollectDeviceForm extends BaseEntity {
  id?: string | number;
  deviceCode?: string;
  deviceName?: string;
  protocolCode?: string;
  transportCode?: string;
  host?: string;
  port?: number;
  connectionParams?: string;
  connectionUrl?: string;
  collectInterval?: number;
  connectTimeout?: number;
  reconnectInterval?: number;
  status?: number;
  remark?: string;
}

export interface ScCollectDeviceQuery extends PageQuery {
  deviceCode?: string;
  deviceName?: string;
  protocolCode?: string;
  host?: string;
  status?: number;
  params?: any;
}
