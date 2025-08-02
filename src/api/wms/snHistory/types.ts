export interface SnHistoryVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 条码
   */
  sn: string;

  /**
   * 类型：0：工单
   */
  snType: number;

  /**
   * 备注
   */
  remark: string;

}

export interface SnHistoryForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 条码
   */
  sn?: string;

  /**
   * 类型：0：工单
   */
  snType?: number;

  /**
   * 备注
   */
  remark?: string;

}

export interface SnHistoryQuery extends PageQuery {

  /**
   * 条码
   */
  sn?: string;

  /**
   * 类型：0：工单
   */
  snType?: number;

    /**
     * 日期范围参数
     */
    params?: any;
}



