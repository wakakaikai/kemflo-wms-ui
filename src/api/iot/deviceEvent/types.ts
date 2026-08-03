export interface DeviceEventVO {
  /**
   * 设备事件ID
   */
  id: string | number;

  /**
   * 设备ID
   */
  deviceId: string | number;

  /**
   * 事件类型
   */
  eventType: string;

  /**
   * 事件数据JSON
   */
  eventDataJson?: string;

  /**
   * 事件时间
   */
  eventTime?: string;
}

export interface DeviceEventQuery extends PageQuery {
  /**
   * 设备ID
   */
  deviceId?: string | number;

  /**
   * 事件类型
   */
  eventType?: string;

  /**
   * 日期范围参数
   */
  params?: any;
}
