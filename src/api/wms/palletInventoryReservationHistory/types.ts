export interface PalletInventoryReservationHistoryVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 预约编号
   */
  reservationCode: string;

  /**
   * 预约时间
   */
  reservationDate: string;

  /**
   * 预约状态-1-取消预约 1-已预约 
   */
  reservationStatus: number;

  /**
   * 已发货时间
   */
  shippedDate: string;

  /**
   * 已发货状态 0-未发货 1-已发货
   */
  shippedStatus: number;

  /**
   * 操作状态：0-失败 1-成功 
   */
  shippedResultStatus: number;

  /**
   * 操作结果
   */
  shippedResultMsg: string;

  /**
   * 预约数量
   */
  reservationQuantity: number;

  /**
   * 实际数量
   */
  actualQuantity: number;

  /**
   * 栈板库存记录ID
   */
  palletInventoryId: string | number;

  /**
   * 栈板编号
   */
  palletCode: string;

  /**
   * 打包编号
   */
  packingCode: string;

  /**
   * 物料标识卡SN
   */
  materialSn: string;

  /**
   * 物料编码
   */
  itemCode: string;

  /**
   * 物料名称
   */
  itemName: string;

  /**
   * 批次号
   */
  batchCode: string;

  /**
   * 特殊库存标识
   */
  specialInventoryFlag: string;

  /**
   * 单位
   */
  unit: string;

  /**
   * 预约人
   */
  reservedBy: number;

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
   * 库区编码
   */
  areaCode: string;

  /**
   * 库位编码
   */
  locationCode: string;

  /**
   * 目标仓库编码
   */
  targetWarehouseCode: string;

  /**
   * 目标库区编码
   */
  targetAreaCode: string;

  /**
   * 目标库位编码
   */
  targetLocationCode: string;

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

export interface PalletInventoryReservationHistoryForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 预约编号
   */
  reservationCode?: string;

  /**
   * 预约时间
   */
  reservationDate?: string;

  /**
   * 预约状态-1-取消预约 1-已预约 
   */
  reservationStatus?: number;

  /**
   * 已发货时间
   */
  shippedDate?: string;

  /**
   * 已发货状态 0-未发货 1-已发货
   */
  shippedStatus?: number;

  /**
   * 操作状态：0-失败 1-成功 
   */
  shippedResultStatus?: number;

  /**
   * 操作结果
   */
  shippedResultMsg?: string;

  /**
   * 预约数量
   */
  reservationQuantity?: number;

  /**
   * 实际数量
   */
  actualQuantity?: number;

  /**
   * 栈板库存记录ID
   */
  palletInventoryId?: string | number;

  /**
   * 栈板编号
   */
  palletCode?: string;

  /**
   * 打包编号
   */
  packingCode?: string;

  /**
   * 物料标识卡SN
   */
  materialSn?: string;

  /**
   * 物料编码
   */
  itemCode?: string;

  /**
   * 物料名称
   */
  itemName?: string;

  /**
   * 批次号
   */
  batchCode?: string;

  /**
   * 特殊库存标识
   */
  specialInventoryFlag?: string;

  /**
   * 单位
   */
  unit?: string;

  /**
   * 预约人
   */
  reservedBy?: number;

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
   * 库区编码
   */
  areaCode?: string;

  /**
   * 库位编码
   */
  locationCode?: string;

  /**
   * 目标仓库编码
   */
  targetWarehouseCode?: string;

  /**
   * 目标库区编码
   */
  targetAreaCode?: string;

  /**
   * 目标库位编码
   */
  targetLocationCode?: string;

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

export interface PalletInventoryReservationHistoryQuery extends PageQuery {

  /**
   * 预约编号
   */
  reservationCode?: string;

  /**
   * 预约时间
   */
  reservationDate?: string;

  /**
   * 预约状态-1-取消预约 1-已预约 
   */
  reservationStatus?: number;

  /**
   * 已发货时间
   */
  shippedDate?: string;

  /**
   * 已发货状态 0-未发货 1-已发货
   */
  shippedStatus?: number;

  /**
   * 操作状态：0-失败 1-成功 
   */
  shippedResultStatus?: number;

  /**
   * 操作结果
   */
  shippedResultMsg?: string;

  /**
   * 预约数量
   */
  reservationQuantity?: number;

  /**
   * 实际数量
   */
  actualQuantity?: number;

  /**
   * 栈板库存记录ID
   */
  palletInventoryId?: string | number;

  /**
   * 栈板编号
   */
  palletCode?: string;

  /**
   * 打包编号
   */
  packingCode?: string;

  /**
   * 物料标识卡SN
   */
  materialSn?: string;

  /**
   * 物料编码
   */
  itemCode?: string;

  /**
   * 物料名称
   */
  itemName?: string;

  /**
   * 批次号
   */
  batchCode?: string;

  /**
   * 特殊库存标识
   */
  specialInventoryFlag?: string;

  /**
   * 单位
   */
  unit?: string;

  /**
   * 预约人
   */
  reservedBy?: number;

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
   * 库区编码
   */
  areaCode?: string;

  /**
   * 库位编码
   */
  locationCode?: string;

  /**
   * 目标仓库编码
   */
  targetWarehouseCode?: string;

  /**
   * 目标库区编码
   */
  targetAreaCode?: string;

  /**
   * 目标库位编码
   */
  targetLocationCode?: string;

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



