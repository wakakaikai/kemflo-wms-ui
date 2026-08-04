export interface ConnectionVO {
  /**
   * 连接配置ID
   */
  id: string | number;

  /**
   * 设备ID
   */
  deviceId: string | number;

  /**
   * 设备名称
   */
  deviceName?: string;

  /**
   * 连接类型
   */
  connectionType: string;

  /**
   * 主机地址
   */
  host?: string;

  /**
   * 端口
   */
  port?: number;

  /**
   * 连接参数JSON
   */
  connectionParamsJson?: string;

  /**
   * 状态（0正常 1停用）
   */
  status?: string;

  /**
   * 创建时间
   */
  createTime?: string;
}

export interface ConnectionForm extends BaseEntity {
  /**
   * 连接配置ID
   */
  id?: string | number;

  /**
   * 设备ID
   */
  deviceId?: string | number;

  /**
   * 连接类型
   */
  connectionType?: string;

  /**
   * 主机地址
   */
  host?: string;

  /**
   * 端口
   */
  port?: number;

  /**
   * 连接参数JSON
   */
  connectionParamsJson?: string;

  /**
   * 状态（0正常 1停用）
   */
  status?: string;
}

export interface ConnectionQuery extends PageQuery {
  /**
   * 设备ID
   */
  deviceId?: string | number;

  /**
   * 连接类型
   */
  connectionType?: string;

  /**
   * 状态（0正常 1停用）
   */
  status?: string;

  /**
   * 日期范围参数
   */
  params?: any;
}
