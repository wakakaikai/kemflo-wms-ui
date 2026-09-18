export interface InventoryMovementVO {
  /** 预留单号 */
  reserveNo?: string;

  /** 预留单项次 */
  reserveItemNo?: string;

  /** 后端按凭证年度、物料凭证号及项次生成的分组键。 */
  groupKey?: string;

  /** 同一凭证项下的原始移动记录。 */
  movements?: InventoryMovementVO[];

  /** 同一凭证项下的出库记录。 */
  outMovement?: InventoryMovementVO;

  /** 同一凭证项下的入库记录。 */
  inMovement?: InventoryMovementVO;

  /** 是否同时存在出库和入库记录。 */
  hasPair?: boolean;

  /**
   * 冲销标识：0-正常 1-已冲销 2-冲销记录
   */
  reversalFlag?: number;

  /**
   * 移动原因编码
   */
  moveReasonCode?: string;

  /**
   * 移动原因描述
   */
  moveReasonDesc?: string;

}

export interface InventoryMovementForm extends BaseEntity {
  /**
   * 移动记录ID
   */
  id?: string | number;

  /**
   * 移动类型
   */
  moveType?: string;

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
  batchCode?: string;

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
  qty?: number;

  /**
   * 基本单位
   */
  unit?: string;

  /**
   * 预留单号
   */
  reserveNo?: string;

  /**
   * 预留单项次
   */
  reserveItemNo?: string;

  /**
   * 单据类型
   */
  sourceDocType?: string;

  /**
   * 单据编号
   */
  sourceDocCode?: string;

  /**
   * 单据项次
   */
  sourceDocItem?: string;

  /**
   * 订单数量
   */
  orderQuantity?: number;

  /**
   * 订单单位
   */
  orderUnit?: string;

  /**
   * 换算比例
   */
  conversionRatio?: number;

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
   * 成本中心
   */
  costCenter?: string;

  /**
   * 特殊库存标识
   */
  specialInventoryFlag?: string;

  /**
   * 供应商编号
   */
  vendorCode?: string;

  /**
   * 供应商名称
   */
  vendorName?: string;

  /**
   * 客户编号
   */
  customerCode?: string;

  /**
   * 客户名称
   */
  customerName?: string;

  /**
   * 资产号
   */
  assetNo?: string;

  /**
   * 资产子编号
   */
  assetNoItem?: string;

  /**
   * 移动时间
   */
  moveDate?: string;

  /**
   * 接收日期
   */
  receiptDate?: string;

  /**
   * 失效日期
   */
  expireDate?: string;

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

export interface InventoryMovementQuery extends PageQuery {

  /**
   * 移动类型
   */
  moveType?: string;

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
  batchCode?: string;

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
  qty?: number;

  /**
   * 基本单位
   */
  unit?: string;

  /**
   * 单据类型
   */
  sourceDocType?: string;

  /**
   * 单据类型列表
   */
  sourceDocTypeList?: string[];

  /**
   * 单据编号
   */
  sourceDocCode?: string;

  /**
   * 单据项次
   */
  sourceDocItem?: string;

  /**
   * 订单数量
   */
  orderQuantity?: number;

  /**
   * 订单单位
   */
  orderUnit?: string;

  /**
   * 换算比例
   */
  conversionRatio?: number;

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
   * 成本中心
   */
  costCenter?: string;

  /**
   * 特殊库存标识
   */
  specialInventoryFlag?: string;

  /**
   * 供应商编号
   */
  vendorCode?: string;

  /**
   * 供应商名称
   */
  vendorName?: string;

  /**
   * 客户编号
   */
  customerCode?: string;

  /**
   * 客户名称
   */
  customerName?: string;

  /**
   * 资产号
   */
  assetNo?: string;

  /**
   * 资产子编号
   */
  assetNoItem?: string;

  /**
   * 移动时间
   */
  moveDate?: string;

  /**
   * 接收日期
   */
  receiptDate?: string;

  /**
   * 失效日期
   */
  expireDate?: string;

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
   * SAP物料凭证号是否为空
   */
  sapMaterialOrderNoEmpty?: boolean;

  /** 是否由后端按凭证年度、物料凭证号及项次合并。 */
  groupBySapDocumentItem?: boolean;

    /**
     * 日期范围参数
     */
    params?: any;
}



