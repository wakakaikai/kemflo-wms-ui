export interface PalletVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 栈板编号
   */
  palletCode: string;

  /**
   * 栈板描述
   */
  description: string;

  /**
   * 状态
   */
  status: number;

  /**
   * 仓库编码
   */
  warehouseCode: string;

  /**
   * 备注
   */
  remark: string;

}

export interface PalletForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 栈板编号
   */
  palletCode?: string;

  /**
   * 栈板描述
   */
  description?: string;

  /**
   * 状态
   */
  status?: number;

  /**
   * 仓库编码
   */
  warehouseCode?: string;

  /**
   * 备注
   */
  remark?: string;

}

export interface PalletQuery extends PageQuery {

  /**
   * 栈板编号
   */
  palletCode?: string;

  /**
   * 栈板描述
   */
  description?: string;

  /**
   * 状态
   */
  status?: number;

  /**
   * 仓库编码
   */
  warehouseCode?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



