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

/** 小米栈板标签查询参数 */
export interface MiPalletSnPrintQuery {
  palletNo?: string;
  sfc?: string;
}

/** 小米栈板标签打印数据 */
export interface MiPalletSnPrintVO {
  palletNo: string;
  customerPo?: string;
  item?: string;
  productId?: string;
  sku?: string;
  productName?: string;
  productTime?: string;
  palletNumber?: number;
  palletGrossWeight?: number;
  snList: string[];
  total: number;
}
