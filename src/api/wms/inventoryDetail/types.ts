export interface InventoryDetailVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 材料类型: 1-物料, 2-设备
   */
  itemType: number;

  /**
   * 物料编码/设备编号
   */
  itemCode: string;

  /**
   * 物料名称/设备名称
   */
  itemName: string;

  /**
   * 批次号
   */
  batchCode: string;

  /**
   * 数量-非限制
   */
  availableQuantity: number;

  /**
   * 数量-质检
   */
  inspectionQuantity: number;

  /**
   * 数量-冻结
   */
  blockedQuantity: number;

  /**
   * 单位
   */
  unit: string;

  /**
   * 特殊库存标识
   */
  specialInventoryFlag: string;

  /**
   * 仓库编码
   */
  warehouseCode: string;

  /**
   * 库区编码
   */
  areaCode: string;

  /**
   * 库位编码
   */
  locationCode: string;

  /**
   * 业务伙伴
   */
  businessCode: string;

  /**
   * 业务伙伴名称
   */
  businessName: string;

  /**
   * 备注
   */
  remark: string;
}

export interface InventoryDetailForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 材料类型: 1-物料, 2-设备
   */
  itemType?: number;

  /**
   * 物料编码/设备编号
   */
  itemCode?: string;

  /**
   * 物料名称/设备名称
   */
  itemName?: string;

  /**
   * 批次号
   */
  batchCode?: string;

  /**
   * 数量-非限制
   */
  availableQuantity?: number;

  /**
   * 数量-质检
   */
  inspectionQuantity?: number;

  /**
   * 数量-冻结
   */
  blockedQuantity?: number;

  /**
   * 单位
   */
  unit?: string;

  /**
   * 特殊库存标识
   */
  specialInventoryFlag?: string;

  /**
   * 仓库编码
   */
  warehouseCode?: string;

  /**
   * 库区编码
   */
  areaCode?: string;

  /**
   * 库位编码
   */
  locationCode?: string;

  /**
   * 业务伙伴
   */
  businessCode?: string;

  /**
   * 业务伙伴名称
   */
  businessName?: string;

  /**
   * 备注
   */
  remark?: string;
}

export interface InventoryDetailQuery extends PageQuery {
  /**
   * 材料类型: 1-物料, 2-设备
   */
  itemType?: number;

  /**
   * 物料编码/设备编号
   */
  itemCode?: string;

  /**
   * 物料名称/设备名称
   */
  itemName?: string;

  /**
   * 批次号
   */
  batchCode?: string;

  /**
   * 数量-非限制
   */
  availableQuantity?: number;

  /**
   * 数量-质检
   */
  inspectionQuantity?: number;

  /**
   * 数量-冻结
   */
  blockedQuantity?: number;

  /**
   * 单位
   */
  unit?: string;

  /**
   * 特殊库存标识
   */
  specialInventoryFlag?: string;

  /**
   * 仓库编码
   */
  warehouseCode?: string;

  /**
   * 库区编码
   */
  areaCode?: string;

  /**
   * 库位编码
   */
  locationCode?: string;

  /**
   * 业务伙伴
   */
  businessCode?: string;

  /**
   * 业务伙伴名称
   */
  businessName?: string;

  /**
   * 日期范围参数
   */
  params?: any;
}
