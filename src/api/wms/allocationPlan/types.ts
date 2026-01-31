export interface AllocationPlanVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 方案编号
   */
  planNo: string;

  /**
   * 方案名称
   */
  planName: string;

  /**
   * 策略类型(FIFO_STRICT-严格FIFO, HIGH_KIT-高齐套率, EFFICIENCY-效率优先, BALANCED-平衡策略)
   */
  strategyType: string;

  /**
   * 工单号列表(JSON数组)
   */
  workOrderNos: string;

  /**
   * 工单数量
   */
  workOrderCount: number;

  /**
   * 总分配数量
   */
  totalQuantity: number;

  /**
   * 拣货库位列表(JSON数组)
   */
  pickLocations: string;

  /**
   * 拣货点数量
   */
  pickLocationCount: number;

  /**
   * 总行走距离
   */
  totalDistance: number;

  /**
   * 平均齐套率
   */
  avgKitRate: number;

  /**
   * FIFO符合度得分
   */
  fifoScore: number;

  /**
   * 效率得分
   */
  efficiencyScore: number;

  /**
   * 综合得分
   */
  totalScore: number;

  /**
   * 方案状态(DRAFT-草稿, CONFIRMED-已确认, EXECUTING-执行中, COMPLETED-已完成, CANCELLED-已取消)
   */
  planStatus: string;

  /**
   * 方案描述
   */
  description: string;

  /**
   * 备注
   */
  remark: string;

}

export interface AllocationPlanForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 方案编号
   */
  planNo?: string;

  /**
   * 方案名称
   */
  planName?: string;

  /**
   * 策略类型(FIFO_STRICT-严格FIFO, HIGH_KIT-高齐套率, EFFICIENCY-效率优先, BALANCED-平衡策略)
   */
  strategyType?: string;

  /**
   * 工单号列表(JSON数组)
   */
  workOrderNos?: string;

  /**
   * 工单数量
   */
  workOrderCount?: number;

  /**
   * 总分配数量
   */
  totalQuantity?: number;

  /**
   * 拣货库位列表(JSON数组)
   */
  pickLocations?: string;

  /**
   * 拣货点数量
   */
  pickLocationCount?: number;

  /**
   * 总行走距离
   */
  totalDistance?: number;

  /**
   * 平均齐套率
   */
  avgKitRate?: number;

  /**
   * FIFO符合度得分
   */
  fifoScore?: number;

  /**
   * 效率得分
   */
  efficiencyScore?: number;

  /**
   * 综合得分
   */
  totalScore?: number;

  /**
   * 方案状态(DRAFT-草稿, CONFIRMED-已确认, EXECUTING-执行中, COMPLETED-已完成, CANCELLED-已取消)
   */
  planStatus?: string;

  /**
   * 方案描述
   */
  description?: string;

  /**
   * 备注
   */
  remark?: string;

}

export interface AllocationPlanQuery extends PageQuery {

  /**
   * 方案编号
   */
  planNo?: string;

  /**
   * 方案名称
   */
  planName?: string;

  /**
   * 策略类型(FIFO_STRICT-严格FIFO, HIGH_KIT-高齐套率, EFFICIENCY-效率优先, BALANCED-平衡策略)
   */
  strategyType?: string;

  /**
   * 工单号列表(JSON数组)
   */
  workOrderNos?: string;

  /**
   * 工单数量
   */
  workOrderCount?: number;

  /**
   * 总分配数量
   */
  totalQuantity?: number;

  /**
   * 拣货库位列表(JSON数组)
   */
  pickLocations?: string;

  /**
   * 拣货点数量
   */
  pickLocationCount?: number;

  /**
   * 总行走距离
   */
  totalDistance?: number;

  /**
   * 平均齐套率
   */
  avgKitRate?: number;

  /**
   * FIFO符合度得分
   */
  fifoScore?: number;

  /**
   * 效率得分
   */
  efficiencyScore?: number;

  /**
   * 综合得分
   */
  totalScore?: number;

  /**
   * 方案状态(DRAFT-草稿, CONFIRMED-已确认, EXECUTING-执行中, COMPLETED-已完成, CANCELLED-已取消)
   */
  planStatus?: string;

  /**
   * 方案描述
   */
  description?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



