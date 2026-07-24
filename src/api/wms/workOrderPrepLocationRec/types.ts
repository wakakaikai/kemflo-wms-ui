export interface WorkOrderPrepLocationRecVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 备料需求ID
   */
  demandId: string | number;

  /**
   * 备料需求单号
   */
  demandNo: string;

  /**
   * 备料需求明细ID
   */
  demandLineId: string | number;

  /**
   * 工单号
   */
  workOrderNo: string;

  /**
   * 预留单号
   */
  reserveNo: string;

  /**
   * 预留单项次
   */
  reserveItemNo: string;

  /**
   * 物料编码
   */
  materialCode: string;

  /**
   * 物料名称
   */
  materialName: string;

  /**
   * 批次号
   */
  batchCode: string;

  /**
   * 仓库编码
   */
  warehouseCode: string;

  /**
   * 库位编码
   */
  locationCode: string;

  /**
   * 仓别路线(AUTO/LINE/FLAT/SHORTAGE)
   */
  warehouseRoute: string;

  /**
   * 特殊库存标识
   */
  specialInventoryFlag: string;

  /**
   * 业务伙伴
   */
  businessCode: string;

  /**
   * 业务伙伴名称
   */
  businessName: string;

  /**
   * 目标需求仓库编码
   */
  targetDemandWarehouseCode: string;

  /**
   * 目标需求库位编码
   */
  targetDemandLocationCode: string;

  /**
   * 发料数量
   */
  issueQty: number;

  /**
   * 已发数量
   */
  issuedQty: number;

  /**
   * 实际发货数量
   */
  actualIssueQty: number;

  /**
   * 库存单位
   */
  inventoryUnit: string;

  /**
   * 换算比例
   */
  conversionRatio: number;

  /**
   * FIFO序号(接收日期越早序号越小)
   */
  fifoSequence: number;

  /**
   * 状态(WAIT_PICK-待拣货,PICKING-拣货中,COMPLETE-已完成,CANCELLED-已取消,CLOSED-已关闭)
   */
  lineStatus: string;

  /**
   * 推荐来源(USER_SELECTED-用户选择,SYSTEM_RECOMMENDED-系统推荐)
   */
  recommendationSource: string;

  /**
   * 推荐理由
   */
  recommendationReason: string;

  /**
   * 备注
   */
  remark: string;

  /**
   * 超领编码
   */
  overPickCode: string;

  /**
   * 超领原因
   */
  overPickReason: string;

}

export interface WorkOrderPrepLocationRecForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 备料需求ID
   */
  demandId?: string | number;

  /**
   * 备料需求单号
   */
  demandNo?: string;

  /**
   * 备料需求明细ID
   */
  demandLineId?: string | number;

  /**
   * 工单号
   */
  workOrderNo?: string;

  /**
   * 预留单号
   */
  reserveNo?: string;

  /**
   * 预留单项次
   */
  reserveItemNo?: string;

  /**
   * 物料编码
   */
  materialCode?: string;

  /**
   * 物料名称
   */
  materialName?: string;

  /**
   * 批次号
   */
  batchCode?: string;

  /**
   * 仓库编码
   */
  warehouseCode?: string;

  /**
   * 库位编码
   */
  locationCode?: string;

  /**
   * 仓别路线(AUTO/LINE/FLAT/SHORTAGE)
   */
  warehouseRoute?: string;

  /**
   * 特殊库存标识
   */
  specialInventoryFlag?: string;

  /**
   * 业务伙伴
   */
  businessCode?: string;

  /**
   * 业务伙伴名称
   */
  businessName?: string;

  /**
   * 目标需求仓库编码
   */
  targetDemandWarehouseCode?: string;

  /**
   * 目标需求库位编码
   */
  targetDemandLocationCode?: string;

  /**
   * 发料数量
   */
  issueQty?: number;

  /**
   * 已发数量
   */
  issuedQty?: number;

  /**
   * 实际发货数量
   */
  actualIssueQty?: number;

  /**
   * 库存单位
   */
  inventoryUnit?: string;

  /**
   * 换算比例
   */
  conversionRatio?: number;

  /**
   * FIFO序号(接收日期越早序号越小)
   */
  fifoSequence?: number;

  /**
   * 状态(WAIT_PICK-待拣货,PICKING-拣货中,COMPLETE-已完成,CANCELLED-已取消,CLOSED-已关闭)
   */
  lineStatus?: string;

  /**
   * 推荐来源(USER_SELECTED-用户选择,SYSTEM_RECOMMENDED-系统推荐)
   */
  recommendationSource?: string;

  /**
   * 推荐理由
   */
  recommendationReason?: string;

  /**
   * 备注
   */
  remark?: string;

  /**
   * 超领编码
   */
  overPickCode?: string;

  /**
   * 超领原因
   */
  overPickReason?: string;

}

export interface WorkOrderPrepLocationRecQuery extends PageQuery {

  /**
   * 备料需求ID
   */
  demandId?: string | number;

  /**
   * 备料需求单号
   */
  demandNo?: string;

  /**
   * 备料需求明细ID
   */
  demandLineId?: string | number;

  /**
   * 工单号
   */
  workOrderNo?: string;

  /**
   * 预留单号
   */
  reserveNo?: string;

  /**
   * 预留单项次
   */
  reserveItemNo?: string;

  /**
   * 物料编码
   */
  materialCode?: string;

  /**
   * 物料名称
   */
  materialName?: string;

  /**
   * 批次号
   */
  batchCode?: string;

  /**
   * 仓库编码
   */
  warehouseCode?: string;

  /**
   * 库位编码
   */
  locationCode?: string;

  /**
   * 仓别路线(AUTO/LINE/FLAT/SHORTAGE)
   */
  warehouseRoute?: string;

  /**
   * 特殊库存标识
   */
  specialInventoryFlag?: string;

  /**
   * 业务伙伴
   */
  businessCode?: string;

  /**
   * 业务伙伴名称
   */
  businessName?: string;

  /**
   * 目标需求仓库编码
   */
  targetDemandWarehouseCode?: string;

  /**
   * 目标需求库位编码
   */
  targetDemandLocationCode?: string;

  /**
   * 发料数量
   */
  issueQty?: number;

  /**
   * 已发数量
   */
  issuedQty?: number;

  /**
   * 实际发货数量
   */
  actualIssueQty?: number;

  /**
   * 库存单位
   */
  inventoryUnit?: string;

  /**
   * 换算比例
   */
  conversionRatio?: number;

  /**
   * FIFO序号(接收日期越早序号越小)
   */
  fifoSequence?: number;

  /**
   * 状态(WAIT_PICK-待拣货,PICKING-拣货中,COMPLETE-已完成,CANCELLED-已取消,CLOSED-已关闭)
   */
  lineStatus?: string;

  /**
   * 推荐来源(USER_SELECTED-用户选择,SYSTEM_RECOMMENDED-系统推荐)
   */
  recommendationSource?: string;

  /**
   * 推荐理由
   */
  recommendationReason?: string;

  /**
   * 超领编码
   */
  overPickCode?: string;

  /**
   * 超领原因
   */
  overPickReason?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



