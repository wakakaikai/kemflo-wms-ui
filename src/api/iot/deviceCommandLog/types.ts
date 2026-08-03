export interface DeviceCommandLogVO {
  /**
   * 命令日志ID
   */
  id: string | number;

  /**
   * 命令ID
   */
  commandId: string | number;

  /**
   * 请求JSON
   */
  requestJson?: string;

  /**
   * 响应JSON
   */
  responseJson?: string;

  /**
   * 状态
   */
  status?: string;

  /**
   * 执行时长(ms)
   */
  durationMs?: number;

  /**
   * 错误信息
   */
  errorMessage?: string;
}

export interface DeviceCommandLogQuery extends PageQuery {
  /**
   * 命令ID
   */
  commandId?: string | number;

  /**
   * 日期范围参数
   */
  params?: any;
}
