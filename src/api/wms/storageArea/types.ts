export interface StorageAreaVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 库区编码
   */
  areaCode: string;

  /**
   * 库区名称
   */
  areaName: string;

  /**
   * 仓库ID
   */
  warehouseId: string | number;

  /**
   * 面积
   */
  area: number;

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

export interface StorageAreaForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 库区编码
   */
  areaCode?: string;

  /**
   * 库区名称
   */
  areaName?: string;

  /**
   * 仓库ID
   */
  warehouseId?: string | number;

  /**
   * 面积
   */
  area?: number;

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

export interface StorageAreaQuery extends PageQuery {
  /**
   * 库区编码
   */
  areaCode?: string;

  /**
   * 库区名称
   */
  areaName?: string;

  /**
   * 仓库ID
   */
  warehouseId?: string | number;

  /**
   * 面积
   */
  area?: number;

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
