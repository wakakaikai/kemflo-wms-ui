export interface PackingDetailVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 打包编号
   */
  packingCode: string;

  /**
   * 栈板编号
   */
  palletCode: string;

  /**
   * 工单号
   */
  workOrderNo: string;

  /**
   * 料号
   */
  item: string;

  /**
   * 数量
   */
  packingQty: number;

  /**
   * 物料凭证号
   */
  materialOrderNo: string;

  /**
   * 物料文件项次
   */
  materialItem: string;

  /**
   * 备注
   */
  remark: string;
}

export interface PackingDetailForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 打包编号
   */
  packingCode?: string;

  /**
   * 栈板编号
   */
  palletCode?: string;

  /**
   * 工单号
   */
  workOrderNo?: string;

  /**
   * 料号
   */
  item?: string;

  /**
   * 数量
   */
  packingQty?: number;

  /**
   * 物料凭证号
   */
  materialOrderNo?: string;

  /**
   * 物料文件项次
   */
  materialItem?: string;

  /**
   * 备注
   */
  remark?: string;
}

export interface PackingDetailQuery extends PageQuery {
  /**
   * 打包编号
   */
  packingCode?: string;

  /**
   * 栈板编号
   */
  palletCode?: string;

  /**
   * 工单号
   */
  workOrderNo?: string;

  /**
   * 料号
   */
  item?: string;

  /**
   * 数量
   */
  packingQty?: number;

  /**
   * 物料凭证号
   */
  materialOrderNo?: string;

  /**
   * 物料文件项次
   */
  materialItem?: string;

  /**
   * 日期范围参数
   */
  params?: any;
}
