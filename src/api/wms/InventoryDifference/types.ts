export interface InventoryDiffVO {
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
   * WMS库存数量
   */
  totalQuantity?: number;

  /**
   * SAP库存数量
   */
  sapQuantity?: number;

  /**
   * 差异数量
   */
  diffQuantity?: number;

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

export interface InventoryDiffQuery extends PageQuery {
  /**
   * 材料类型: 1-物料, 2-设备
   */
  itemType?: number;

  /**
   * 物料编码/设备编号
   */
  itemCode?: string;

  /**
   * 物料编码列表（批量查询）
   */
  itemCodeList?: string[];

  /**
   * 物料编码输入字符串（前端使用，支持逗号/空格分隔）
   */
  itemCodeStr?: string;

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
   * 对比维度: wms-WMS库存差异, sap-SAP库存差异
   */
  compareDimension?: string;

  /**
   * 仅显示差异物料
   */
  diffFlag?: boolean;

  /**
   * 日期范围参数
   */
  params?: any;
}
