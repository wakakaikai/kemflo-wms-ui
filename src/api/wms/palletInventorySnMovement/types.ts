export interface PalletInventorySnMovementVO {
  /**
   * 移动记录ID
   */
  id: string | number;

  /**
   * 移动类型
   */
  moveType: string;

  /**
   * 产品条码
   */
  productSn: string;

  /**
   * 物料编码
   */
  itemCode: string;

  /**
   * 产品物料名称
   */
  itemName: string;

  /**
   * 批次号
   */
  batchNo: string;

  /**
   * 库存方向
   */
  inventoryDirection: number;

  /**
   * 关联的移动ID
   */
  relatedMoveId: string | number;

  /**
   * 数量
   */
  quantity: number;

  /**
   * 基本单位
   */
  unit: string;

  /**
   * 单据类型
   */
  sourceDocType: string;

  /**
   * 单据编号
   */
  sourceDocCode: string;

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
   * 打包编号
   */
  packingCode: string;

  /**
   * 特殊库存标识
   */
  specialInventoryFlag: string;

  /**
   * 移动时间
   */
  moveDate: string;

  /**
   * 业务伙伴
   */
  businessCode: string;

  /**
   * 业务伙伴名称
   */
  businessName: string;

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

export interface PalletInventorySnMovementForm extends BaseEntity {
  /**
   * 移动记录ID
   */
  id?: string | number;

  /**
   * 移动类型
   */
  moveType?: string;

  /**
   * 产品条码
   */
  productSn?: string;

  /**
   * 物料编码
   */
  itemCode?: string;

  /**
   * 产品物料名称
   */
  itemName?: string;

  /**
   * 批次号
   */
  batchNo?: string;

  /**
   * 库存方向
   */
  inventoryDirection?: number;

  /**
   * 关联的移动ID
   */
  relatedMoveId?: string | number;

  /**
   * 数量
   */
  quantity?: number;

  /**
   * 基本单位
   */
  unit?: string;

  /**
   * 单据类型
   */
  sourceDocType?: string;

  /**
   * 单据编号
   */
  sourceDocCode?: string;

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
   * 打包编号
   */
  packingCode?: string;

  /**
   * 特殊库存标识
   */
  specialInventoryFlag?: string;

  /**
   * 移动时间
   */
  moveDate?: string;

  /**
   * 业务伙伴
   */
  businessCode?: string;

  /**
   * 业务伙伴名称
   */
  businessName?: string;

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

export interface PalletInventorySnMovementQuery extends PageQuery {

  /**
   * 移动类型
   */
  moveType?: string;

  /**
   * 产品条码
   */
  productSn?: string;

  /**
   * 物料编码
   */
  itemCode?: string;

  /**
   * 产品物料名称
   */
  itemName?: string;

  /**
   * 批次号
   */
  batchNo?: string;

  /**
   * 库存方向
   */
  inventoryDirection?: number;

  /**
   * 关联的移动ID
   */
  relatedMoveId?: string | number;

  /**
   * 数量
   */
  quantity?: number;

  /**
   * 基本单位
   */
  unit?: string;

  /**
   * 单据类型
   */
  sourceDocType?: string;

  /**
   * 单据编号
   */
  sourceDocCode?: string;

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
   * 打包编号
   */
  packingCode?: string;

  /**
   * 特殊库存标识
   */
  specialInventoryFlag?: string;

  /**
   * 移动时间
   */
  moveDate?: string;

  /**
   * 业务伙伴
   */
  businessCode?: string;

  /**
   * 业务伙伴名称
   */
  businessName?: string;

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



