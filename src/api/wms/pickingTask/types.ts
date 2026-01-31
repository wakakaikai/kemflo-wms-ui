export interface PickingTaskVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 任务编号
   */
  taskNo: string;

  /**
   * 方案ID
   */
  planId: string | number;

  /**
   * 任务类型(NORMAL-正常, EMERGENCY-紧急)
   */
  taskType: string;

  /**
   * 任务状态(PENDING-待处理, ASSIGNED-已分配, PICKING-拣货中, COMPLETED-已完成, CANCELLED-已取消)
   */
  taskStatus: string;

  /**
   * 拣货员ID
   */
  pickerId: string | number;

  /**
   * 拣货员姓名
   */
  pickerName: string;

  /**
   * 起始位置
   */
  startLocation: string;

  /**
   * 结束位置
   */
  endLocation: string;

  /**
   * 总物料项数
   */
  totalItems: number;

  /**
   * 总数量
   */
  totalQuantity: number;

  /**
   * 预计行走距离
   */
  estimatedDistance: number;

  /**
   * 预计用时(分钟)
   */
  estimatedTime: number;

  /**
   * 实际开始时间
   */
  actualStartTime: string;

  /**
   * 实际结束时间
   */
  actualEndTime: string;

  /**
   * 实际行走距离
   */
  actualDistance: number;

  /**
   * 实际用时(分钟)
   */
  actualTime: number;

  /**
   * 备注
   */
  remark: string;

}

export interface PickingTaskForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 任务编号
   */
  taskNo?: string;

  /**
   * 方案ID
   */
  planId?: string | number;

  /**
   * 任务类型(NORMAL-正常, EMERGENCY-紧急)
   */
  taskType?: string;

  /**
   * 任务状态(PENDING-待处理, ASSIGNED-已分配, PICKING-拣货中, COMPLETED-已完成, CANCELLED-已取消)
   */
  taskStatus?: string;

  /**
   * 拣货员ID
   */
  pickerId?: string | number;

  /**
   * 拣货员姓名
   */
  pickerName?: string;

  /**
   * 起始位置
   */
  startLocation?: string;

  /**
   * 结束位置
   */
  endLocation?: string;

  /**
   * 总物料项数
   */
  totalItems?: number;

  /**
   * 总数量
   */
  totalQuantity?: number;

  /**
   * 预计行走距离
   */
  estimatedDistance?: number;

  /**
   * 预计用时(分钟)
   */
  estimatedTime?: number;

  /**
   * 实际开始时间
   */
  actualStartTime?: string;

  /**
   * 实际结束时间
   */
  actualEndTime?: string;

  /**
   * 实际行走距离
   */
  actualDistance?: number;

  /**
   * 实际用时(分钟)
   */
  actualTime?: number;

  /**
   * 备注
   */
  remark?: string;

}

export interface PickingTaskQuery extends PageQuery {

  /**
   * 任务编号
   */
  taskNo?: string;

  /**
   * 方案ID
   */
  planId?: string | number;

  /**
   * 任务类型(NORMAL-正常, EMERGENCY-紧急)
   */
  taskType?: string;

  /**
   * 任务状态(PENDING-待处理, ASSIGNED-已分配, PICKING-拣货中, COMPLETED-已完成, CANCELLED-已取消)
   */
  taskStatus?: string;

  /**
   * 拣货员ID
   */
  pickerId?: string | number;

  /**
   * 拣货员姓名
   */
  pickerName?: string;

  /**
   * 起始位置
   */
  startLocation?: string;

  /**
   * 结束位置
   */
  endLocation?: string;

  /**
   * 总物料项数
   */
  totalItems?: number;

  /**
   * 总数量
   */
  totalQuantity?: number;

  /**
   * 预计行走距离
   */
  estimatedDistance?: number;

  /**
   * 预计用时(分钟)
   */
  estimatedTime?: number;

  /**
   * 实际开始时间
   */
  actualStartTime?: string;

  /**
   * 实际结束时间
   */
  actualEndTime?: string;

  /**
   * 实际行走距离
   */
  actualDistance?: number;

  /**
   * 实际用时(分钟)
   */
  actualTime?: number;

    /**
     * 日期范围参数
     */
    params?: any;
}



