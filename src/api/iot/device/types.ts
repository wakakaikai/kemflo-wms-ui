export interface DeviceVO {
  /**
   * 设备ID
   */
  id: string | number;

  /**
   * 产品ID
   */
  productId: string | number;

  /**
   * 设备编码
   */
  deviceCode: string;

  /**
   * 设备名称
   */
  deviceName: string;

  /**
   * 状态（0正常 1停用）
   */
  status?: string;

  /**
   * 在线状态（0离线 1在线）
   */
  onlineStatus?: string;

  /**
   * 最后在线时间
   */
  lastOnlineTime?: string;

  /**
   * 设备位置
   */
  deviceLocation?: string;
}

export interface DeviceForm extends BaseEntity {
  /**
   * 设备ID
   */
  id?: string | number;

  /**
   * 产品ID
   */
  productId?: string | number;

  /**
   * 设备编码
   */
  deviceCode?: string;

  /**
   * 设备名称
   */
  deviceName?: string;

  /**
   * 状态（0正常 1停用）
   */
  status?: string;

  /**
   * 在线状态（0离线 1在线）
   */
  onlineStatus?: string;

  /**
   * 最后在线时间
   */
  lastOnlineTime?: string;

  /**
   * 设备位置
   */
  deviceLocation?: string;
}

export interface DeviceQuery extends PageQuery {
  /**
   * 产品ID
   */
  productId?: string | number;

  /**
   * 设备编码
   */
  deviceCode?: string;

  /**
   * 设备名称
   */
  deviceName?: string;

  /**
   * 在线状态（0离线 1在线）
   */
  onlineStatus?: string;

  /**
   * 状态（0正常 1停用）
   */
  status?: string;

  /**
   * 日期范围参数
   */
  params?: any;
}
