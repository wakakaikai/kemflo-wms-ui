export interface PackingDetailSnVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 打包明细ID
   */
  packingDetailId: string | number;

  /**
   * 工单号
   */
  workOrderNo: string;

  /**
   * 条码
   */
  sn: string;

  /**
   * 数量
   */
  qty: number;

  /**
   * 生产日期
   */
  productDate: string;

  /**
   * 备注
   */
  remark: string;

}

export interface PackingDetailSnForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 打包明细ID
   */
  packingDetailId?: string | number;

  /**
   * 工单号
   */
  workOrderNo?: string;

  /**
   * 条码
   */
  sn?: string;

  /**
   * 数量
   */
  qty?: number;

  /**
   * 生产日期
   */
  productDate?: string;

  /**
   * 备注
   */
  remark?: string;

}

export interface PackingDetailSnQuery extends PageQuery {

  /**
   * 打包明细ID
   */
  packingDetailId?: string | number;

  /**
   * 工单号
   */
  workOrderNo?: string;

  /**
   * 条码
   */
  sn?: string;

  /**
   * 数量
   */
  qty?: number;

  /**
   * 生产日期
   */
  productDate?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



