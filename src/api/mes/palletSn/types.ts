export interface PalletSnVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 栈板号
   */
  palletNo: string;

  /**
   * 序号
   */
  sequence: number;

  /**
   * SN码
   */
  sfc: string;
}

export interface PalletSnForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 栈板号
   */
  palletNo?: string;

  /**
   * 序号
   */
  sequence?: number;

  /**
   * SN码
   */
  sfc?: string;
}

export interface PalletSnQuery extends PageQuery {
  /**
   * 栈板号
   */
  palletNo?: string;

  /**
   * 序号
   */
  sequence?: number;

  /**
   * SN码
   */
  sfc?: string;

  /**
   * 日期范围参数
   */
  params?: any;
}
