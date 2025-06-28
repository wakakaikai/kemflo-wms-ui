export interface RecCheckVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 检验单号
   */
  checkNo: string;

  /**
   * 入库单号-物料凭证号
   */
  receiptOrderNo: string;

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
   * 开始条码
   */
  startSfc: string;

  /**
   * 结束条码
   */
  endSfc: string;

  /**
   * 质检人
   */
  checkUser: string;

  /**
   * 质检时间
   */
  checkTime: string;

  /**
   * 检验批数量
   */
  checkQuantity: number | string;

  /**
   * 抽样数量
   */
  samplingQuantity: number | string;

  /**
   * 质检结果
   */
  result: string;

  /**
   * 备注
   */
  remark: string;
}

export interface RecCheckForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 检验单号
   */
  checkNo?: string;

  /**
   * 入库单号-物料凭证号
   */
  receiptOrderNo?: string;

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
   * 开始条码
   */
  startSfc?: string;

  /**
   * 结束条码
   */
  endSfc?: string;

  /**
   * 质检人
   */
  checkUser?: string;

  /**
   * 质检时间
   */
  checkTime?: string;

  /**
   * 检验批数量
   */
  checkQuantity?: number | string;

  /**
   * 抽样数量
   */
  samplingQuantity?: number | string;

  /**
   * 质检结果
   */
  result?: string;

  /**
   * 备注
   */
  remark?: string;
}

export interface RecCheckQuery extends PageQuery {
  /**
   * 检验单号
   */
  checkNo?: string;

  /**
   * 入库单号-物料凭证号
   */
  receiptOrderNo?: string;

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
   * 开始条码
   */
  startSfc?: string;

  /**
   * 结束条码
   */
  endSfc?: string;

  /**
   * 质检人
   */
  checkUser?: string;

  /**
   * 质检时间
   */
  checkTime?: string;

  /**
   * 检验批数量
   */
  checkQuantity?: number | string;

  /**
   * 抽样数量
   */
  samplingQuantity?: number | string;

  /**
   * 质检结果
   */
  result?: string;

  /**
   * 日期范围参数
   */
  params?: any;
}
