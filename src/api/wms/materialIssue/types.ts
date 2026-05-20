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

/** 发料单详情（含明细） */
export interface MaterialIssueWithDetailsVO {
  issue: MaterialIssueVO;
  details: MaterialIssueDetailLineVO[];
  pickingTask?: Record<string, unknown>;
  progress?: {
    totalLines: number;
    issuedLines: number;
    pendingLines: number;
  };
}

export interface MaterialIssueDetailLineVO {
  id: number | string;
  issueId: number | string;
  issueNo?: string;
  workOrderNo: string;
  materialCode: string;
  batchCode: string;
  locationCode: string;
  requiredQuantity: number;
  issuedQuantity?: number;
  unit?: string;
  issueStatus: string;
  issueTime?: string;
  remark?: string;
}

export interface MaterialIssueReceiverDTO {
  receiverId: number | string;
  receiverName?: string;
  receiverDept?: string;
}

export interface ConfirmIssueDetailItemDTO {
  detailId: number | string;
  issuedQuantity: number;
  remark?: string;
}

export interface ConfirmIssueDetailsRequest {
  details: ConfirmIssueDetailItemDTO[];
  allowShortIssue?: boolean;
}

export interface ConfirmIssueDetailsResult {
  success?: boolean;
  message?: string;
  issueId?: number;
  issueStatus?: string;
  confirmedCount?: number;
}

export interface CompleteIssueResult {
  success?: boolean;
  message?: string;
  issueId?: number;
  issueNo?: string;
  issueStatus?: string;
  confirmTime?: string;
  bomUpdatedCount?: number;
}

export interface EmergencyIssueRequest {
  workOrderNo: string;
  remark?: string;
  receiverId?: number | string;
  receiverName?: string;
  receiverDept?: string;
}

export interface CancelIssueRequest {
  reason?: string;
}

export interface SapSyncResult {
  success?: boolean;
  message?: string;
  sapResponse?: string;
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



