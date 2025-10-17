export interface BatchVO {
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
   * 数量
   */
  quantity: number;

  /**
   * 单位
   */
  unit: string;

  /**
   * 供应商批次号
   */
  supplierBatchNo: string;

  /**
   * 批次号
   */
  batchCode: string;

  /**
   * 根批次号
   */
  rootBatchCode: string;

  /**
   * 序号
   */
  sequence: number;

  /**
   * 批次状态(
1-可用：正常可出库 
2-冻结：因盘点、质检等原因暂时锁定
3-不合格：质检不合格，禁止出库
4-已耗尽：库存为0，历史记录
 )
   */
  batchStatus: number;

  /**
   * 接收日期
   */
  receivedDate: string;

  /**
   * 过期日期
   */
  expirationDate: string;

  /**
   * 业务伙伴
   */
  businessCode: string;

  /**
   * 业务伙伴名称
   */
  businessName: string;

  /**
   * 单号类型(
1-采购入库：从供应商采购
2-生产入库：自制生产
3-调拨入库：从其他仓库调来
4-拆分生成：从其他批次拆分产生
)
   */
  orderType: number;

  /**
   * 来源单号
   */
  orderNo: string;

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
   * 备注
   */
  remark: string;

}

export interface BatchForm extends BaseEntity {
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
   * 数量
   */
  quantity?: number;

  /**
   * 单位
   */
  unit?: string;

  /**
   * 供应商批次号
   */
  supplierBatchNo?: string;

  /**
   * 批次号
   */
  batchCode?: string;

  /**
   * 根批次号
   */
  rootBatchCode?: string;

  /**
   * 序号
   */
  sequence?: number;

  /**
   * 批次状态(
1-可用：正常可出库 
2-冻结：因盘点、质检等原因暂时锁定
3-不合格：质检不合格，禁止出库
4-已耗尽：库存为0，历史记录
 )
   */
  batchStatus?: number;

  /**
   * 接收日期
   */
  receivedDate?: string;

  /**
   * 过期日期
   */
  expirationDate?: string;

  /**
   * 业务伙伴
   */
  businessCode?: string;

  /**
   * 业务伙伴名称
   */
  businessName?: string;

  /**
   * 单号类型(
1-采购入库：从供应商采购
2-生产入库：自制生产
3-调拨入库：从其他仓库调来
4-拆分生成：从其他批次拆分产生
)
   */
  orderType?: number;

  /**
   * 来源单号
   */
  orderNo?: string;

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
   * 备注
   */
  remark?: string;

}

export interface BatchQuery extends PageQuery {

  /**
   * 物料编码
   */
  itemCode?: string;

  /**
   * 产品物料名称
   */
  itemName?: string;

  /**
   * 数量
   */
  quantity?: number;

  /**
   * 单位
   */
  unit?: string;

  /**
   * 供应商批次号
   */
  supplierBatchNo?: string;

  /**
   * 批次号
   */
  batchCode?: string;

  /**
   * 根批次号
   */
  rootBatchCode?: string;

  /**
   * 序号
   */
  sequence?: number;

  /**
   * 批次状态(
1-可用：正常可出库 
2-冻结：因盘点、质检等原因暂时锁定
3-不合格：质检不合格，禁止出库
4-已耗尽：库存为0，历史记录
 )
   */
  batchStatus?: number;

  /**
   * 接收日期
   */
  receivedDate?: string;

  /**
   * 过期日期
   */
  expirationDate?: string;

  /**
   * 业务伙伴
   */
  businessCode?: string;

  /**
   * 业务伙伴名称
   */
  businessName?: string;

  /**
   * 单号类型(
1-采购入库：从供应商采购
2-生产入库：自制生产
3-调拨入库：从其他仓库调来
4-拆分生成：从其他批次拆分产生
)
   */
  orderType?: number;

  /**
   * 来源单号
   */
  orderNo?: string;

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
     * 日期范围参数
     */
    params?: any;
}



