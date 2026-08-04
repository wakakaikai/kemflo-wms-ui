export interface ProductPointVO {
  /**
   * 产品物模型ID
   */
  id: string | number;

  /**
   * 产品ID
   */
  productId: string | number;

  /**
   * 产品名称
   */
  productName?: string;

  /**
   * 点位编码
   */
  pointCode: string;

  /**
   * 点位名称
   */
  pointName: string;

  /**
   * 数据类型
   */
  dataType: string;

  /**
   * 单位
   */
  unit?: string;

  /**
   * 读写类型（R/RW/W）
   */
  readWrite?: string;

  /**
   * 最小值
   */
  minValue?: number;

  /**
   * 最大值
   */
  maxValue?: number;

  /**
   * 排序
   */
  sortOrder?: number;
}

export interface ProductPointForm extends BaseEntity {
  /**
   * 产品物模型ID
   */
  id?: string | number;

  /**
   * 产品ID
   */
  productId?: string | number;

  /**
   * 点位编码
   */
  pointCode?: string;

  /**
   * 点位名称
   */
  pointName?: string;

  /**
   * 数据类型
   */
  dataType?: string;

  /**
   * 单位
   */
  unit?: string;

  /**
   * 读写类型（R/RW/W）
   */
  readWrite?: string;

  /**
   * 最小值
   */
  minValue?: number;

  /**
   * 最大值
   */
  maxValue?: number;

  /**
   * 排序
   */
  sortOrder?: number;
}

export interface ProductPointQuery extends PageQuery {
  /**
   * 产品ID
   */
  productId?: string | number;

  /**
   * 点位编码
   */
  pointCode?: string;

  /**
   * 点位名称
   */
  pointName?: string;

  /**
   * 日期范围参数
   */
  params?: any;
}
