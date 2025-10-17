export interface PalletInventorySnVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 栈板编号
   */
  palletCode: string;

  /**
   * 工单号
   */
  orderNo: string;

  /**
   * 条码
   */
  sn: string;

  /**
   * 数量
   */
  quantity: number;

  /**
   * 单位
   */
  unit: string;

  /**
   * 生产日期
   */
  productDate: string;

  /**
   * 备注
   */
  remark: string;

}

export interface PalletInventorySnForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 栈板编号
   */
  palletCode?: string;

  /**
   * 工单号
   */
  orderNo?: string;

  /**
   * 条码
   */
  sn?: string;

  /**
   * 数量
   */
  quantity?: number;

  /**
   * 单位
   */
  unit?: string;

  /**
   * 生产日期
   */
  productDate?: string;

  /**
   * 备注
   */
  remark?: string;

}

export interface PalletInventorySnQuery extends PageQuery {

  /**
   * 栈板编号
   */
  palletCode?: string;

  /**
   * 工单号
   */
  orderNo?: string;

  /**
   * 条码
   */
  sn?: string;

  /**
   * 数量
   */
  quantity?: number;

  /**
   * 单位
   */
  unit?: string;

  /**
   * 生产日期
   */
  productDate?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



