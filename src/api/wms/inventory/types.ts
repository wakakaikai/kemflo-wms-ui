export interface InventoryVO {
  /**
   * 唯一ID
   */
  id: string | number;

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
  batchCode: string;

  /**
   * 数量
   */
  qty: number;

  /**
   * 单位
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
   * 状态（0:待入库, 1:正常, 2:冻结, 3:报废）
   */
  status: number;

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
   * 供应商编号
   */
  vendorCode: string;

  /**
   * 供应商名称
   */
  vendorName: string;

  /**
   * 客户编号
   */
  customerCode: string;

  /**
   * 客户名称
   */
  customerName: string;

  /**
   * 成本中心
   */
  costCenter: string;

  /**
   * 特殊库存标识
   */
  specialInventoryFlag: string;

  /**
   * 生产日期
   */
  productDate: string;

  /**
   * 接收日期
   */
  receiptDate: string;

  /**
   * 失效日期
   */
  expireDate: string;

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

export interface InventoryForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

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
   * 数量
   */
  qty?: number;

  /**
   * 单位
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
   * 状态（0:待入库, 1:正常, 2:冻结, 3:报废）
   */
  status?: number;

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
   * 成本中心
   */
  costCenter?: string;

  /**
   * 特殊库存标识
   */
  specialInventoryFlag?: string;

  /**
   * 生产日期
   */
  productDate?: string;

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

export interface InventoryQuery extends PageQuery {

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
   * 数量
   */
  qty?: number;

  /**
   * 单位
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
   * 状态（0:待入库, 1:正常, 2:冻结, 3:报废）
   */
  status?: number;

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
   * 成本中心
   */
  costCenter?: string;

  /**
   * 特殊库存标识
   */
  specialInventoryFlag?: string;

  /**
   * 生产日期
   */
  productDate?: string;

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
     * 日期范围参数
     */
    params?: any;
}



