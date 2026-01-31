export interface MaterialIssueDetailVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 发料单ID
   */
  issueId: string | number;

  /**
   * 发料单号
   */
  issueNo: string;

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
   * 实发数量
   */
  issuedQuantity: number;

  /**
   * 单位
   */
  unit: string;

  /**
   * 发料状态(PENDING-待发料, ISSUED-已发料)
   */
  issueStatus: string;

  /**
   * 发料时间
   */
  issueTime: string;

  /**
   * 备注
   */
  remark: string;

}

export interface MaterialIssueDetailForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 发料单ID
   */
  issueId?: string | number;

  /**
   * 发料单号
   */
  issueNo?: string;

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
   * 实发数量
   */
  issuedQuantity?: number;

  /**
   * 单位
   */
  unit?: string;

  /**
   * 发料状态(PENDING-待发料, ISSUED-已发料)
   */
  issueStatus?: string;

  /**
   * 发料时间
   */
  issueTime?: string;

  /**
   * 备注
   */
  remark?: string;

}

export interface MaterialIssueDetailQuery extends PageQuery {

  /**
   * 发料单ID
   */
  issueId?: string | number;

  /**
   * 发料单号
   */
  issueNo?: string;

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
   * 实发数量
   */
  issuedQuantity?: number;

  /**
   * 单位
   */
  unit?: string;

  /**
   * 发料状态(PENDING-待发料, ISSUED-已发料)
   */
  issueStatus?: string;

  /**
   * 发料时间
   */
  issueTime?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



