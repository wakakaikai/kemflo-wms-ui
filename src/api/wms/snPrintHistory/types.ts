export interface SnPrintHistoryVO {
  /**
   * 工单号
   */
  workOrderNo: string;

  /**
   * 条码
   */
  sn: string;

  /**
   * 类型
   */
  type: number;

  /**
   * 操作时间
   */
  dateTime: string;

  /**
   * 打印数量
   */
  printQuantity: number;

}

export interface SnPrintHistoryForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 工单号
   */
  workOrderNo?: string;

  /**
   * 条码
   */
  sn?: string;

  /**
   * 类型
   */
  type?: number;

  /**
   * 操作时间
   */
  dateTime?: string;

  /**
   * 打印数量
   */
  printQuantity?: number;

}

export interface SnPrintHistoryQuery extends PageQuery {

  /**
   * 工单号
   */
  workOrderNo?: string;

  /**
   * 条码
   */
  sn?: string;

  /**
   * 类型
   */
  type?: number;

  /**
   * 操作时间
   */
  dateTime?: string;

  /**
   * 打印数量
   */
  printQuantity?: number;

    /**
     * 日期范围参数
     */
    params?: any;
}



