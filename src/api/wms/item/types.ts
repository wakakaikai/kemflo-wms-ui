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
   * 尺寸分类：LARGE-大件, SMALL-小件
   */
  sizeCategory?: string;

  /**
   * 条码正则
   */
  sfcRegular: string;

  /**
   * 入库检标识
   */
  receiptInspectionFlag: boolean;

  /**
   * 启用质检结果：0: 正常 1: 停用
   */
  outboundInspectionCheck: boolean;

  /**
   * 栈板检查：0: 正常 1: 停用
   */
  palletCheckFlag?: number | string;

  /**
   * 出货数量校验
   */
  outboundQuantityCheck?: number | string;

  /**
   * 客户参考检查
   */
  customerRefCheck?: number | string;

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
   * 尺寸分类：LARGE-大件, SMALL-小件
   */
  sizeCategory?: string;

  /**
   * 入库检标识
   */
  receiptInspectionFlag?: boolean;

  /**
   * 启用质检结果：0: 正常 1: 停用
   */
  outboundInspectionCheck?: boolean;

  /**
   * 栈板检查：0: 正常 1: 停用
   */
  palletCheckFlag?: number | string;

  /**
   * 出货数量校验
   */
  outboundQuantityCheck?: number | string;

  /**
   * 客户参考检查
   */
  customerRefCheck?: number | string;

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
   * 尺寸分类：LARGE-大件, SMALL-小件
   */
  sizeCategory?: string;

  /**
   * 入库检标识
   */
  receiptInspectionFlag?: boolean;

  /**
   * 启用质检结果：0: 正常 1: 停用
   */
  outboundInspectionCheck?: boolean;

  /**
   * 栈板检查：0: 正常 1: 停用
   */
  palletCheckFlag?: number | string;

  /**
   * 客户参考检查
   */
  customerRefCheck?: number | string;

  /**
   * 日期范围参数
   */
  params?: any;
}
