export interface ShopOrderReportAbnormalTimeVO {
  /**
   * 记录唯一ID
   */
  id: string | number;

  /**
   * 报工ID
   */
  reportId: string | number;

  /**
   * 工作中心
   */
  workCenter: string;

  /**
   * 工单号
   */
  shopOrder: string;

  /**
   * 停机开始时间
   */
  shutdownStartTime: string;

  /**
   * 停机结束时间
   */
  shutdownEndTime: string;

  /**
   * 停机大类
   */
  abnormalClass: string;

  /**
   * 停机类型
   */
  abnormalType: string;

  /**
   * 停机原因
   */
  shutdownReason: string;

  /**
   * 例外时间ID
   */
  abnormalId: string | number;

  /**
   * 停机时长
   */
  shutdownDuration: number;

  /**
   * 有效停机时长
   */
  effectiveShutdownDuration: number;

}

export interface ShopOrderReportAbnormalTimeForm extends BaseEntity {
  /**
   * 记录唯一ID
   */
  id?: string | number;

  /**
   * 报工ID
   */
  reportId?: string | number;

  /**
   * 工作中心
   */
  workCenter?: string;

  /**
   * 工单号
   */
  shopOrder?: string;

  /**
   * 停机开始时间
   */
  shutdownStartTime?: string;

  /**
   * 停机结束时间
   */
  shutdownEndTime?: string;

  /**
   * 停机大类
   */
  abnormalClass?: string;

  /**
   * 停机类型
   */
  abnormalType?: string;

  /**
   * 停机原因
   */
  shutdownReason?: string;

  /**
   * 例外时间ID
   */
  abnormalId?: string | number;

  /**
   * 停机时长
   */
  shutdownDuration?: number;

  /**
   * 有效停机时长
   */
  effectiveShutdownDuration?: number;

}

export interface ShopOrderReportAbnormalTimeQuery extends PageQuery {

  /**
   * 报工ID
   */
  reportId?: string | number;

  /**
   * 工作中心
   */
  workCenter?: string;

  /**
   * 工单号
   */
  shopOrder?: string;

  /**
   * 停机开始时间
   */
  shutdownStartTime?: string;

  /**
   * 停机结束时间
   */
  shutdownEndTime?: string;

  /**
   * 停机大类
   */
  abnormalClass?: string;

  /**
   * 停机类型
   */
  abnormalType?: string;

  /**
   * 停机原因
   */
  shutdownReason?: string;

  /**
   * 例外时间ID
   */
  abnormalId?: string | number;

  /**
   * 停机时长
   */
  shutdownDuration?: number;

  /**
   * 有效停机时长
   */
  effectiveShutdownDuration?: number;

    /**
     * 日期范围参数
     */
    params?: any;
}



