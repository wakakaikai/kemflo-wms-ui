export interface PackingVO {
  packingDetailVoList: any[];
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 打包编号(系统生成)
   */
  packingCode: string;

  /**
   * 栈板编号
   */
  palletCode: string;

  /**
   * 目的仓库
   */
  warehouseCode: string;

  /**
   * 状态
   */
  status: number;

  /**
   * 备注
   */
  remark: string;
}

export interface PackingForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 打包编号(系统生成)
   */
  packingCode?: string;

  /**
   * 栈板编号
   */
  palletCode?: string;

  /**
   * 目的仓库
   */
  warehouseCode?: string;

  /**
   * 状态
   */
  status?: number;

  /**
   * 备注
   */
  remark?: string;

  /**
   * 打包明细
   */
  packingDetailBoList?: any;
}

export interface PackingQuery extends PageQuery {
  /**
   * 打包编号(系统生成)
   */
  packingCode?: string;

  /**
   * 栈板编号
   */
  palletCode?: string;

  /**
   * 目的仓库
   */
  warehouseCode?: string;

  /**
   * 状态
   */
  status?: number;

  /**
   * 日期范围参数
   */
  params?: any;

  /**
   * 打包明细
   */
  packingDetailBoList?: any;
}
