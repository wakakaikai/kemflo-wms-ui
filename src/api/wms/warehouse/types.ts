export interface WarehouseVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 仓库编码
   */
  warehouseCode: string;

  /**
   * 仓库名称
   */
  warehouseName: string;

  /**
   * 是否启用
   */
  enableFlag: string;

  /**
   * 是否启用布尔类型
   */
  enableFlagBoolean: boolean;

  /**
   * 备注
   */
  remark: string;
}

export interface WarehouseForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 仓库编码
   */
  warehouseCode?: string;

  /**
   * 仓库名称
   */
  warehouseName?: string;

  /**
   * 是否启用
   */
  enableFlag?: string;

  /**
   * 是否启用布尔类型
   */
  enableFlagBoolean: boolean;

  /**
   * 备注
   */
  remark?: string;
}

export interface WarehouseQuery extends PageQuery {
  /**
   * 仓库编码
   */
  warehouseCode?: string;

  /**
   * 仓库名称
   */
  warehouseName?: string;

  /**
   * 是否启用
   */
  enableFlag?: string;

  /**
   * 是否启用布尔类型
   */
  enableFlagBoolean: boolean;

  /**
   * 日期范围参数
   */
  params?: any;
}
