export interface WarehouseLocationVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 编码
   */
  code: string;

  /**
   * 名称
   */
  name: string;

  /**
   * 父ID
   */
  parentId: string | number;

  /**
   * 祖级列表
   */
  ancestors: string;

  /**
   * 显示顺序
   */
  orderNum: number;

  /**
   * 层级：1-仓库，2-库区，3-货架，4-库位
   */
  level: number;

  /**
   * 仓库类型
   */
  warehouseType: number;

  /**
   * 库位条码（可用于扫码）
   */
  barcode: string;

  /**
   * 是否允许产品混放
   */
  productMixing: string;

  /**
   * 是否允许批次混放
   */
  batchMixing: string;

  /**
   * 是否启用
   */
  enableFlag: string;

  /**
   * 状态
   */
  status: number;

  /**
   * X坐标（可选，用于路径规划）
   */
  xAxis: number;

  /**
   * Y坐标
   */
  yAxis: number;

  /**
   * Z坐标
   */
  zAxis: number;

  /**
   * 备注
   */
  remark: string;
}

export interface WarehouseLocationForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 编码
   */
  code?: string;

  /**
   * 名称
   */
  name?: string;

  /**
   * 父ID
   */
  parentId?: string | number;

  /**
   * 祖级列表
   */
  ancestors?: string;

  /**
   * 显示顺序
   */
  orderNum?: number;

  /**
   * 层级：1-仓库，2-库区，3-货架，4-库位
   */
  level?: number;

  /**
   * 仓库类型
   */
  warehouseType?: number;

  /**
   * 库位条码（可用于扫码）
   */
  barcode?: string;

  /**
   * 是否允许产品混放
   */
  productMixing?: string;

  /**
   * 是否允许批次混放
   */
  batchMixing?: string;

  /**
   * 是否启用
   */
  enableFlag?: string;

  /**
   * 状态
   */
  status?: number;

  /**
   * X坐标（可选，用于路径规划）
   */
  xAxis?: number;

  /**
   * Y坐标
   */
  yAxis?: number;

  /**
   * Z坐标
   */
  zAxis?: number;

  /**
   * 备注
   */
  remark?: string;
}

export interface WarehouseLocationQuery extends PageQuery {
  /**
   * 编码
   */
  code?: string;

  /**
   * 名称
   */
  name?: string;

  /**
   * 父ID
   */
  parentId?: number;

  /**
   * 祖级列表
   */
  ancestors?: string;

  /**
   * 显示顺序
   */
  orderNum?: number;

  /**
   * 层级：1-仓库，2-库区，3-货架，4-库位
   */
  level?: number;

  /**
   * 仓库类型
   */
  warehouseType?: number;

  /**
   * 库位条码（可用于扫码）
   */
  barcode?: string;

  /**
   * 是否允许产品混放
   */
  productMixing?: string;

  /**
   * 是否允许批次混放
   */
  batchMixing?: string;

  /**
   * 是否启用
   */
  enableFlag?: string;

  /**
   * 状态
   */
  status?: number;

  /**
   * X坐标（可选，用于路径规划）
   */
  xAxis?: number;

  /**
   * Y坐标
   */
  yAxis?: number;

  /**
   * Z坐标
   */
  zAxis?: number;

  /**
   * 日期范围参数
   */
  params?: any;
}
