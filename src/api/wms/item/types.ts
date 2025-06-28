export interface ItemVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 物料
   */
  item: string;

  /**
   * 描述
   */
  itemDesc: string;

  /**
   * 旧料号
   */
  oldItem: string;

  /**
   * 物料组
   */
  itemGroup: string;

  /**
   * 计量单位
   */
  unit: string;

  /**
   * 条码正则
   */
  sfcRegular: string;

  /**
   * 启用质检结果：0: 正常 1: 停用
   */
  checkEnable: number | string;

  /**
   * 备注
   */
  remark: string;
}

export interface ItemForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 物料
   */
  item?: string;

  /**
   * 描述
   */
  itemDesc?: string;

  /**
   * 旧料号
   */
  oldItem?: string;

  /**
   * 物料组
   */
  itemGroup?: string;

  /**
   * 条码正则
   */
  sfcRegular: string;

  /**
   * 计量单位
   */
  unit?: string;

  /**
   * 启用质检结果：0: 正常 1: 停用
   */
  checkEnable?: number | string;

  /**
   * 备注
   */
  remark?: string;
}

export interface ItemQuery extends PageQuery {
  /**
   * 物料
   */
  item?: string;

  /**
   * 描述
   */
  itemDesc?: string;

  /**
   * 旧料号
   */
  oldItem?: string;

  /**
   * 物料组
   */
  itemGroup?: string;

  /**
   * 条码正则
   */
  sfcRegular: string;

  /**
   * 计量单位
   */
  unit?: string;

  /**
   * 启用质检结果：0: 正常 1: 停用
   */
  checkEnable?: number | string;

  /**
   * 日期范围参数
   */
  params?: any;
}
