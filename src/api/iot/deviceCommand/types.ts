export interface DeviceCommandVO {
  /**
   * 设备命令ID
   */
  id: string | number;

  /**
   * 设备ID
   */
  deviceId: string | number;

  /**
   * 命令编码
   */
  commandCode: string;

  /**
   * 命令参数JSON
   */
  commandParamsJson?: string;

  /**
   * 状态（PENDING/SENT/SUCCESS/FAILED）
   */
  status?: string;

  /**
   * 发送时间
   */
  sentTime?: string;

  /**
   * 响应JSON
   */
  responseJson?: string;
}

export interface DeviceCommandForm extends BaseEntity {
  /**
   * 设备命令ID
   */
  id?: string | number;

  /**
   * 设备ID
   */
  deviceId?: string | number;

  /**
   * 命令编码
   */
  commandCode?: string;

  /**
   * 命令参数JSON
   */
  commandParamsJson?: string;

  /**
   * 状态（PENDING/SENT/SUCCESS/FAILED）
   */
  status?: string;

  /**
   * 发送时间
   */
  sentTime?: string;

  /**
   * 响应JSON
   */
  responseJson?: string;
}

export interface DeviceCommandQuery extends PageQuery {
  /**
   * 设备ID
   */
  deviceId?: string | number;

  /**
   * 命令编码
   */
  commandCode?: string;

  /**
   * 状态（PENDING/SENT/SUCCESS/FAILED）
   */
  status?: string;

  /**
   * 日期范围参数
   */
  params?: any;
}
