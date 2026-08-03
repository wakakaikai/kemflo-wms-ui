export interface DevicePointVO {
  /**
   * 设备点位ID
   */
  id: string | number;

  /**
   * 设备ID
   */
  deviceId: string | number;

  /**
   * 点位ID
   */
  pointId: string | number;

  /**
   * 当前值
   */
  currentValue?: string;

  /**
   * 质量（GOOD/BAD/UNCERTAIN）
   */
  quality?: string;

  /**
   * 采集时间
   */
  collectTime?: string;
}

export interface DevicePointQuery extends PageQuery {
  /**
   * 设备ID
   */
  deviceId?: string | number;

  /**
   * 点位ID
   */
  pointId?: string | number;

  /**
   * 日期范围参数
   */
  params?: any;
}
