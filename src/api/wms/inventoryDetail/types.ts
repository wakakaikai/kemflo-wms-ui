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
   * 状态: 0-正常, 1-锁定, 2-冻结, 3-报废
   */
  status: number;

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
   * 库存类型
   */
  inventoryType?: string;

  /**
   * 数量
   */
  quantity?: number;

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
   * 库位名称
   */
  locationName?: string;

  /**
   * 库存状态
   */
  inventoryStatus?: string;

  /**
   * 入库状态
   */
  stockInStatus?: string;

  /**
   * 仓库名称
   */
  warehouseName?: string;

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
   * 批量物料编码（仅展示用，逗号拼接）
   */
  itemCodeStr?: string;

  /**
   * 批量物料编码列表
   */
  itemCodeList?: string[];

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
   * 库存类型
   */
  inventoryType?: string;

  /**
   * 数量
   */
  quantity?: number;

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
   * 库位名称
   */
  locationName?: string;

  /**
   * 库存状态
   */
  inventoryStatus?: string;

  /**
   * 入库状态
   */
  stockInStatus?: string;

  /**
   * 仓库名称
   */
  warehouseName?: string;

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

/** 库存移转行项目 */
export interface InventoryTransferLineBO {
  inventoryDetailId?: string | number | null;
  palletInventoryDetailId?: string | number;
  moveType?: string;
  targetWarehouseCode?: string;
  targetAreaCode?: string;
  targetLocationCode?: string;
  targetInventoryType?: string;
  targetBusinessCode?: string;
  transferQuantity?: number;
  specialInventoryFlag?: string;
  /** 移动原因编码 */
  moveReasonCode?: string;
  /** 移动原因描述 */
  moveReasonDesc?: string;
  /** 成本中心（Z01/Z03/201 部门领料） */
  costCenter?: string;
  /** 订单号（Z01 可选） */
  orderNo?: string;
  [key: string]: unknown;
}

/** 库存移转请求 */
export interface InventoryTransferForm {
  inventoryTransferBoList: InventoryTransferLineBO[];
  transferType: number;
  moveType?: string;
  /** 物料单 */
  mtsnr?: string;
  /** 凭证抬头文本 */
  bktxt?: string;
  /** 过账日期 */
  postingDate?: string;
  /** 是否只进行 WMS 移转（跳过 SAP） */
  skipSap?: boolean;
}

/** 库存移动冲销行（SAP 凭证） */
export interface InventoryCancelLineBO {
  sapMaterialDocYear?: number | string;
  sapMaterialOrderNo?: string;
  sapMaterialItem?: string;
}

/** 库存移动冲销提交 */
export interface InventoryCancelForm {
  /** SAP 物料凭证号 */
  sapMaterialOrderNo: string;
  sapMaterialDocYear?: number | string;
  /** SAP 物料凭证项次；为空则冲销该凭证全部未冲销项次 */
  sapMaterialItems?: string[];
  /** 物料单 */
  mtsnr?: string;
  /** 交货单 */
  lfsnr?: string;
  bktxt?: string;
  postingDate?: string;
}

/** 构建库存冲销批次选项 */
export interface InventoryCancelBatchOptions {
  mtsnr?: string;
  lfsnr?: string;
  bktxt?: string;
  postingDate?: string | null;
  sapMaterialDocYear?: number | string;
  /** SAP 物料凭证项次；为空则冲销该凭证全部未冲销项次 */
  sapMaterialItems?: string[];
}
