export interface PickingTaskDetailVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 任务ID
   */
  taskId: string | number;

  /**
   * 任务编号
   */
  taskNo: string;

  /**
   * 方案ID
   */
  planId: string | number;

  /**
   * 分配明细ID
   */
  allocationDetailId: string | number;

  /**
   * 工单号
   */
  workOrderNo: string;

  /**
   * 物料编码
   */
  materialCode: string;

  /**
   * 批次号
   */
  batchCode: string;

  /**
   * 库位编码
   */
  locationCode: string;

  /**
   * 需求数量
   */
  requiredQuantity: number;

  /**
   * 已拣数量
   */
  pickedQuantity: number;

  /**
   * 拣货顺序
   */
  pickSequence: number;

  /**
   * 拣货状态(PENDING-待拣货, PICKING-拣货中, PICKED-已拣货, CONFIRMED-已确认)
   */
  pickStatus: string;

  /**
   * 拣货员ID
   */
  pickerId: string | number;

  /**
   * 拣货时间
   */
  pickTime: string;

  /**
   * 确认时间
   */
  confirmTime: string;

  /**
   * 备注
   */
  remark: string;

}

export interface PickingTaskDetailForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 任务ID
   */
  taskId?: string | number;

  /**
   * 任务编号
   */
  taskNo?: string;

  /**
   * 方案ID
   */
  planId?: string | number;

  /**
   * 分配明细ID
   */
  allocationDetailId?: string | number;

  /**
   * 工单号
   */
  workOrderNo?: string;

  /**
   * 物料编码
   */
  materialCode?: string;

  /**
   * 批次号
   */
  batchCode?: string;

  /**
   * 库位编码
   */
  locationCode?: string;

  /**
   * 需求数量
   */
  requiredQuantity?: number;

  /**
   * 已拣数量
   */
  pickedQuantity?: number;

  /**
   * 拣货顺序
   */
  pickSequence?: number;

  /**
   * 拣货状态(PENDING-待拣货, PICKING-拣货中, PICKED-已拣货, CONFIRMED-已确认)
   */
  pickStatus?: string;

  /**
   * 拣货员ID
   */
  pickerId?: string | number;

  /**
   * 拣货时间
   */
  pickTime?: string;

  /**
   * 确认时间
   */
  confirmTime?: string;

  /**
   * 备注
   */
  remark?: string;

}

export interface PickingTaskDetailQuery extends PageQuery {

  /**
   * 任务ID
   */
  taskId?: string | number;

  /**
   * 任务编号
   */
  taskNo?: string;

  /**
   * 方案ID
   */
  planId?: string | number;

  /**
   * 分配明细ID
   */
  allocationDetailId?: string | number;

  /**
   * 工单号
   */
  workOrderNo?: string;

  /**
   * 物料编码
   */
  materialCode?: string;

  /**
   * 批次号
   */
  batchCode?: string;

  /**
   * 库位编码
   */
  locationCode?: string;

  /**
   * 需求数量
   */
  requiredQuantity?: number;

  /**
   * 已拣数量
   */
  pickedQuantity?: number;

  /**
   * 拣货顺序
   */
  pickSequence?: number;

  /**
   * 拣货状态(PENDING-待拣货, PICKING-拣货中, PICKED-已拣货, CONFIRMED-已确认)
   */
  pickStatus?: string;

  /**
   * 拣货员ID
   */
  pickerId?: string | number;

  /**
   * 拣货时间
   */
  pickTime?: string;

  /**
   * 确认时间
   */
  confirmTime?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



