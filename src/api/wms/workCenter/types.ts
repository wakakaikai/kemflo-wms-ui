export interface WorkCenterVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 工作中心
   */
  workCenter: string;

  /**
   * 描述
   */
  description: string;

  /**
   * 成本中心
   */
  costCenter: string;

  /**
   * 部门编码
   */
  deptCode: string;

  /**
   * 部门名称
   */
  deptName: string;

  /**
   * 负责人
   */
  manager: string;

  /**
   * 状态
   */
  status: number;

  /**
   * 备注
   */
  remark: string;
}

export interface WorkCenterForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 工作中心
   */
  workCenter?: string;

  /**
   * 描述
   */
  description?: string;

  /**
   * 成本中心
   */
  costCenter?: string;

  /**
   * 部门编码
   */
  deptCode?: string;

  /**
   * 部门名称
   */
  deptName?: string;

  /**
   * 负责人
   */
  manager?: string;

  /**
   * 状态
   */
  status?: number;

  /**
   * 备注
   */
  remark?: string;
}

export interface WorkCenterQuery extends PageQuery {
  /**
   * 工作中心
   */
  workCenter?: string;

  /**
   * 描述
   */
  description?: string;

  /**
   * 成本中心
   */
  costCenter?: string;

  /**
   * 部门编码
   */
  deptCode?: string;

  /**
   * 部门名称
   */
  deptName?: string;

  /**
   * 负责人
   */
  manager?: string;

  /**
   * 状态
   */
  status?: number;

  /**
   * 日期范围参数
   */
  params?: any;
}
