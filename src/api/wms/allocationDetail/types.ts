export interface AllocationDetailVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 方案ID
   */
  planId: string | number;

  /**
   * 方案编号
   */
  planNo: string;

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
   * 分配数量
   */
  allocatedQuantity: number;

  /**
   * 拣货顺序
   */
  pickSequence: number;

  /**
   * 拣货路径组
   */
  pickPathGroup: string;

  /**
   * 库位距离
   */
  distance: number;

  /**
   * 生产日期
   */
  productionDate: string;

  /**
   * FIFO顺序
   */
  fifoSequence: number;

  /**
   * 分配状态(ALLOCATED-已分配, LOCKED-已锁定, PICKING-拣货中, PICKED-已拣货, ISSUED-已发料)
   */
  allocationStatus: string;

  /**
   * 备注
   */
  remark: string;

}

export interface AllocationDetailForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 方案ID
   */
  planId?: string | number;

  /**
   * 方案编号
   */
  planNo?: string;

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
   * 分配数量
   */
  allocatedQuantity?: number;

  /**
   * 拣货顺序
   */
  pickSequence?: number;

  /**
   * 拣货路径组
   */
  pickPathGroup?: string;

  /**
   * 库位距离
   */
  distance?: number;

  /**
   * 生产日期
   */
  productionDate?: string;

  /**
   * FIFO顺序
   */
  fifoSequence?: number;

  /**
   * 分配状态(ALLOCATED-已分配, LOCKED-已锁定, PICKING-拣货中, PICKED-已拣货, ISSUED-已发料)
   */
  allocationStatus?: string;

  /**
   * 备注
   */
  remark?: string;

}

export interface AllocationDetailQuery extends PageQuery {

  /**
   * 方案ID
   */
  planId?: string | number;

  /**
   * 方案编号
   */
  planNo?: string;

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
   * 分配数量
   */
  allocatedQuantity?: number;

  /**
   * 拣货顺序
   */
  pickSequence?: number;

  /**
   * 拣货路径组
   */
  pickPathGroup?: string;

  /**
   * 库位距离
   */
  distance?: number;

  /**
   * 生产日期
   */
  productionDate?: string;

  /**
   * FIFO顺序
   */
  fifoSequence?: number;

  /**
   * 分配状态(ALLOCATED-已分配, LOCKED-已锁定, PICKING-拣货中, PICKED-已拣货, ISSUED-已发料)
   */
  allocationStatus?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



