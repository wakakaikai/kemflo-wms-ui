export interface PalletInventoryVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 栈板编号
   */
  palletCode: string;

  /**
   * 工单号
   */
  workOrderNo: string;

  /**
   * 物料标识卡条码
   */
  materialSn: string;

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
   * 料号
   */
  itemCode: string;

  /**
   * 产品物料名称/设备名称
   */
  itemName: string;

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
   * 凭证年度
   */
  materialDocYear: number;

  /**
   * 物料凭证号
   */
  materialOrderNo: string;

  /**
   * 物料文件项次
   */
  materialItem: string;

  /**
   * 生产日期
   */
  productDate: string;

  /**
   * 失效日期
   */
  expireDate: string;

  /**
   * 备注
   */
  remark: string;

}

export interface PalletInventoryForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 栈板编号
   */
  palletCode?: string;

  /**
   * 工单号
   */
  workOrderNo?: string;

  /**
   * 物料标识卡条码
   */
  materialSn?: string;

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
   * 料号
   */
  itemCode?: string;

  /**
   * 产品物料名称/设备名称
   */
  itemName?: string;

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
   * 凭证年度
   */
  materialDocYear?: number;

  /**
   * 物料凭证号
   */
  materialOrderNo?: string;

  /**
   * 物料文件项次
   */
  materialItem?: string;

  /**
   * 生产日期
   */
  productDate?: string;

  /**
   * 失效日期
   */
  expireDate?: string;

  /**
   * 备注
   */
  remark?: string;

}

export interface PalletInventoryQuery extends PageQuery {

  /**
   * 栈板编号
   */
  palletCode?: string;

  /**
   * 工单号
   */
  workOrderNo?: string;

  /**
   * 物料标识卡条码
   */
  materialSn?: string;

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
   * 料号
   */
  itemCode?: string;

  /**
   * 产品物料名称/设备名称
   */
  itemName?: string;

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
   * 凭证年度
   */
  materialDocYear?: number;

  /**
   * 物料凭证号
   */
  materialOrderNo?: string;

  /**
   * 物料文件项次
   */
  materialItem?: string;

  /**
   * 生产日期
   */
  productDate?: string;

  /**
   * 失效日期
   */
  expireDate?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



