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
   * 产品物料名称/设备名称
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
   * 数量-报废
   */
  scrappedQuantity: number;

  /**
   * 单位
   */
  unit: string;

  /**
   * 库存类型: N-正常, K-供应商寄售, W-客户寄售, P-工单库存WIP
   */
  inventoryType: string;

  /**
   * 库存状态（0:非限制, 1:质检 2-冻结 3-已报废）
   */
  inventoryStatus: number;

  /**
   * 入库状态（0:待入库, 1:已入库）
   */
  stockInStatus: number;

  /**
   * 仓库编码
   */
  warehouseCode: string;

  /**
   * 仓库名称
   */
  warehouseName: string;

  /**
   * 库区编码
   */
  areaCode: string;

  /**
   * 库区名称
   */
  areaName: string;

  /**
   * 库位编码
   */
  locationCode: string;

  /**
   * 库位名称
   */
  locationName: string;

  /**
   * 栈板编号
   */
  palletCode: string;

  /**
   * 业务伙伴
   */
  businessCode: string;

  /**
   * 业务伙伴名称
   */
  businessName: string;

  /**
   * 接收日期
   */
  receiptDate: string;

  /**
   * SAP凭证年度
   */
  sapMaterialDocYear: number;

  /**
   * SAP物料凭证号
   */
  sapMaterialOrderNo: string;

  /**
   * SAP物料文件项次
   */
  sapMaterialItem: string;

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
   * 产品物料名称/设备名称
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
   * 数量-报废
   */
  scrappedQuantity?: number;

  /**
   * 单位
   */
  unit?: string;

  /**
   * 库存类型: N-正常, K-供应商寄售, W-客户寄售, P-工单库存WIP
   */
  inventoryType?: string;

  /**
   * 库存状态（0:非限制, 1:质检 2-冻结 3-已报废）
   */
  inventoryStatus?: number;

  /**
   * 入库状态（0:待入库, 1:已入库）
   */
  stockInStatus?: number;

  /**
   * 仓库编码
   */
  warehouseCode?: string;

  /**
   * 仓库名称
   */
  warehouseName?: string;

  /**
   * 库区编码
   */
  areaCode?: string;

  /**
   * 库区名称
   */
  areaName?: string;

  /**
   * 库位编码
   */
  locationCode?: string;

  /**
   * 库位名称
   */
  locationName?: string;

  /**
   * 栈板编号
   */
  palletCode?: string;

  /**
   * 业务伙伴
   */
  businessCode?: string;

  /**
   * 业务伙伴名称
   */
  businessName?: string;

  /**
   * 接收日期
   */
  receiptDate?: string;

  /**
   * SAP凭证年度
   */
  sapMaterialDocYear?: number;

  /**
   * SAP物料凭证号
   */
  sapMaterialOrderNo?: string;

  /**
   * SAP物料文件项次
   */
  sapMaterialItem?: string;

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
   * 产品物料名称/设备名称
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
   * 数量-报废
   */
  scrappedQuantity?: number;

  /**
   * 单位
   */
  unit?: string;

  /**
   * 库存类型: N-正常, K-供应商寄售, W-客户寄售, P-工单库存WIP
   */
  inventoryType?: string;

  /**
   * 库存状态（0:非限制, 1:质检 2-冻结 3-已报废）
   */
  inventoryStatus?: number;

  /**
   * 入库状态（0:待入库, 1:已入库）
   */
  stockInStatus?: number;

  /**
   * 仓库编码
   */
  warehouseCode?: string;

  /**
   * 仓库名称
   */
  warehouseName?: string;

  /**
   * 库区编码
   */
  areaCode?: string;

  /**
   * 库区名称
   */
  areaName?: string;

  /**
   * 库位编码
   */
  locationCode?: string;

  /**
   * 库位名称
   */
  locationName?: string;

  /**
   * 栈板编号
   */
  palletCode?: string;

  /**
   * 业务伙伴
   */
  businessCode?: string;

  /**
   * 业务伙伴名称
   */
  businessName?: string;

  /**
   * 接收日期
   */
  receiptDate?: string;

  /**
   * SAP凭证年度
   */
  sapMaterialDocYear?: number;

  /**
   * SAP物料凭证号
   */
  sapMaterialOrderNo?: string;

  /**
   * SAP物料文件项次
   */
  sapMaterialItem?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



