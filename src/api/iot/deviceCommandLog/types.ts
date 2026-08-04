export interface DeviceCommandLogVO {
  id: string | number;
  commandId: string | number;
  requestJson?: string;
  responseJson?: string;
  status?: string;
  durationMs?: number;
  errorMessage?: string;
  createTime?: string;
}

export interface DeviceCommandLogQuery extends PageQuery {
  commandId?: string | number;
  status?: string;
  params?: any;
}
