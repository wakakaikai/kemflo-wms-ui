export interface DeviceShadowVO {
  /**
   * 设备影子ID
   */
  id: string | number;

  /**
   * 设备ID
   */
  deviceId: string | number;

  /**
   * 属性JSON
   */
  propertiesJson?: string;

  /**
   * 版本
   */
  version?: number;

  /**
   * 最后上报时间
   */
  lastReportTime?: string;
}

export interface DeviceShadowQuery extends PageQuery {
  /**
   * 设备ID
   */
  deviceId?: string | number;

  /**
   * 日期范围参数
   */
  params?: any;
}
