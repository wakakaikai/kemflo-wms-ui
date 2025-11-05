export interface StorageLocationVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 库位编码
   */
  locationCode: string;

  /**
   * 库位名称
   */
  locationName: string;

  /**
   * 库区ID
   */
  areaId: string | number;

  /**
   * 库区编码
   */
  areaCode: string;

  /**
   * 仓库编码
   */
  warehouseCode: string;

  /**
   * 面积
   */
  area: number;

  /**
   * 库位位置X
   */
  positionX: number;

  /**
   * 库位位置Y
   */
  positionY: number;

  /**
   * 库位位置Z
   */
  positionZ: number;

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

export interface StorageLocationForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 库位编码
   */
  locationCode?: string;

  /**
   * 库位名称
   */
  locationName?: string;

  /**
   * 库区ID
   */
  areaId?: string | number;

  /**
   * 库区编码
   */
  areaCode: string;

  /**
   * 仓库编码
   */
  warehouseCode: string;

  /**
   * 面积
   */
  area?: number;

  /**
   * 库位位置X
   */
  positionX?: number;

  /**
   * 库位位置Y
   */
  positionY?: number;

  /**
   * 库位位置Z
   */
  positionZ?: number;

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

export interface StorageLocationQuery extends PageQuery {
  /**
   * 库位编码
   */
  locationCode?: string;

  /**
   * 库位名称
   */
  locationName?: string;

  /**
   * 库区ID
   */
  areaId?: string | number;

  /**
   * 库区编码
   */
  areaCode: string;

  /**
   * 仓库编码
   */
  warehouseCode: string;

  /**
   * 面积
   */
  area?: number;

  /**
   * 库位位置X
   */
  positionX?: number;

  /**
   * 库位位置Y
   */
  positionY?: number;

  /**
   * 库位位置Z
   */
  positionZ?: number;

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
