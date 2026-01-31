export interface MaterialIssueVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 发料单号
   */
  issueNo: string;

  /**
   * 工单号
   */
  workOrderNo: string;

  /**
   * 方案ID
   */
  planId: string | number;

  /**
   * 任务ID
   */
  taskId: string | number;

  /**
   * 发料类型(NORMAL-正常发料, EMERGENCY-紧急发料)
   */
  issueType: string;

  /**
   * 发料状态(PENDING-待发料, ISSUING-发料中, COMPLETED-已完成, CANCELLED-已取消)
   */
  issueStatus: string;

  /**
   * 总物料项数
   */
  totalItems: number;

  /**
   * 总数量
   */
  totalQuantity: number;

  /**
   * 发料日期
   */
  issueDate: string;

  /**
   * 领料人ID
   */
  receiverId: string | number;

  /**
   * 领料人姓名
   */
  receiverName: string;

  /**
   * 领料部门
   */
  receiverDept: string;

  /**
   * 发料时间
   */
  issueTime: string;

  /**
   * 确认时间
   */
  confirmTime: string;

  /**
   * 备注
   */
  remark: string;

}

export interface MaterialIssueForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 发料单号
   */
  issueNo?: string;

  /**
   * 工单号
   */
  workOrderNo?: string;

  /**
   * 方案ID
   */
  planId?: string | number;

  /**
   * 任务ID
   */
  taskId?: string | number;

  /**
   * 发料类型(NORMAL-正常发料, EMERGENCY-紧急发料)
   */
  issueType?: string;

  /**
   * 发料状态(PENDING-待发料, ISSUING-发料中, COMPLETED-已完成, CANCELLED-已取消)
   */
  issueStatus?: string;

  /**
   * 总物料项数
   */
  totalItems?: number;

  /**
   * 总数量
   */
  totalQuantity?: number;

  /**
   * 发料日期
   */
  issueDate?: string;

  /**
   * 领料人ID
   */
  receiverId?: string | number;

  /**
   * 领料人姓名
   */
  receiverName?: string;

  /**
   * 领料部门
   */
  receiverDept?: string;

  /**
   * 发料时间
   */
  issueTime?: string;

  /**
   * 确认时间
   */
  confirmTime?: string;

  /**
   * 备注
   */
  remark?: string;

}

export interface MaterialIssueQuery extends PageQuery {

  /**
   * 发料单号
   */
  issueNo?: string;

  /**
   * 工单号
   */
  workOrderNo?: string;

  /**
   * 方案ID
   */
  planId?: string | number;

  /**
   * 任务ID
   */
  taskId?: string | number;

  /**
   * 发料类型(NORMAL-正常发料, EMERGENCY-紧急发料)
   */
  issueType?: string;

  /**
   * 发料状态(PENDING-待发料, ISSUING-发料中, COMPLETED-已完成, CANCELLED-已取消)
   */
  issueStatus?: string;

  /**
   * 总物料项数
   */
  totalItems?: number;

  /**
   * 总数量
   */
  totalQuantity?: number;

  /**
   * 发料日期
   */
  issueDate?: string;

  /**
   * 领料人ID
   */
  receiverId?: string | number;

  /**
   * 领料人姓名
   */
  receiverName?: string;

  /**
   * 领料部门
   */
  receiverDept?: string;

  /**
   * 发料时间
   */
  issueTime?: string;

  /**
   * 确认时间
   */
  confirmTime?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



