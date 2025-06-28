export interface RecCheckDetailVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 检验批次
   */
  checkNo: string;

  /**
   * 条码
   */
  sfc: string;

  /**
   * 数量
   */
  qty?: number | string;

  /**
   * 工单号
   */
  shopOrder: string;

  /**
   * 物料
   */
  item: string;

  /**
   * 物料描述
   */
  itemDesc: string;

  /**
   * 备注
   */
  remark: string;
}

export interface RecCheckDetailForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 检验批次
   */
  checkNo?: string;

  /**
   * 条码
   */
  sfc?: string;

  /**
   * 数量
   */
  qty?: number | string;

  /**
   * 工单号
   */
  shopOrder?: string;

  /**
   * 物料
   */
  item?: string;

  /**
   * 物料描述
   */
  itemDesc?: string;

  /**
   * 备注
   */
  remark?: string;
}

export interface RecCheckDetailQuery extends PageQuery {
  /**
   * 检验批次
   */
  checkNo?: string;

  /**
   * 条码
   */
  sfc?: string;

  /**
   * 数量
   */
  qty?: number | string;

  /**
   * 工单号
   */
  shopOrder?: string;

  /**
   * 物料
   */
  item?: string;

  /**
   * 物料描述
   */
  itemDesc?: string;

  /**
   * 日期范围参数
   */
  params?: any;
}
