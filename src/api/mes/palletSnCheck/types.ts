export interface PalletSnCheckVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 栈板号
   */
  palletNo: string;

  /**
   * 核验时间
   */
  checkTime: string;

  /**
   * 核验数量
   */
  checkQuantity: number;

  /**
   * 创建者
   */
  creator: string;

  /**
   * 创建时间
   */
  createTime: string;

  /**
   * 更新者
   */
  updater: string;

  /**
   * 更新时间
   */
  modifyTime: string;

}

export interface PalletSnCheckForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 栈板号
   */
  palletNo?: string;

  /**
   * 核验时间
   */
  checkTime?: string;

  /**
   * 核验数量
   */
  checkQuantity?: number;

  /**
   * 创建者
   */
  creator?: string;

}

export interface PalletSnCheckQuery extends PageQuery {

  /**
   * 栈板号
   */
  palletNo?: string;

  /**
   * 核验时间
   */
  checkTime?: string;

  /**
   * 核验数量
   */
  checkQuantity?: number;

  /**
   * 创建者
   */
  creator?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



