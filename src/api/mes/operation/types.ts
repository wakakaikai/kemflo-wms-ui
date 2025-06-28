export interface OperationVO {
  /**
   * 记录唯一ID
   */
  id: string | number;

  /**
   * 数据行索引
   */
  handle: string;

  /**
   * 工序编码
   */
  operation: string;

  /**
   * 描述
   */
  description: string;

  /**
   * 状态
   */
  status: string;

  /**
   * 工序类型
   */
  type: string;

  /**
   *
   */
  specialRouterBo: string;

  /**
   *
   */
  defaultResourceBo: string;

  /**
   *
   */
  resourceTypeBo: string;

  /**
   * 最大过站次数
   */
  maxLoop: number;

  /**
   * 前工序间隔时长
   */
  beforeIntervalDuration: number;

  /**
   * 处理时长
   */
  requiredTimeInProcess: number;

  /**
   * 备注
   */
  remark: string;

  /**
   * 记录创建者ID
   */
  createUserId: string | number;

  /**
   * 记录创建者
   */
  creator: string;

  /**
   * 记录最后更新者ID
   */
  modifyUserId: string | number;

  /**
   * 记录最后更新者
   */
  updater: string;

  /**
   * 记录最后更新时间
   */
  modifyTime: string;

  /**
   * 删除标记
   */
  deleteFlag: number;

  /**
   * 锁版本
   */
  auditDataVersion: number;

  /**
   * 数据归属组织id
   */
  secBuId: string | number;

  /**
   * 数据归属雇员id
   */
  secUserId: string | number;

  /**
   * 数据归属公司id
   */
  secOuId: string | number;

  /**
   * 所属组织ID
   */
  belongOrgId: string | number;

  /**
   * 租户组织ID
   */
  tenantOrgId: string | number;
}

export interface OperationForm extends BaseEntity {
  /**
   * 记录唯一ID
   */
  id?: string | number;

  /**
   * 数据行索引
   */
  handle?: string;

  /**
   * 工序编码
   */
  operation?: string;

  /**
   * 描述
   */
  description?: string;

  /**
   * 状态
   */
  status?: string;

  /**
   * 工序类型
   */
  type?: string;

  /**
   *
   */
  specialRouterBo?: string;

  /**
   *
   */
  defaultResourceBo?: string;

  /**
   *
   */
  resourceTypeBo?: string;

  /**
   * 最大过站次数
   */
  maxLoop?: number;

  /**
   * 前工序间隔时长
   */
  beforeIntervalDuration?: number;

  /**
   * 处理时长
   */
  requiredTimeInProcess?: number;

  /**
   * 备注
   */
  remark?: string;

  /**
   * 记录创建者ID
   */
  createUserId?: string | number;

  /**
   * 记录创建者
   */
  creator?: string;

  /**
   * 记录最后更新者ID
   */
  modifyUserId?: string | number;

  /**
   * 记录最后更新者
   */
  updater?: string;

  /**
   * 记录最后更新时间
   */
  modifyTime?: string;

  /**
   * 删除标记
   */
  deleteFlag?: number;

  /**
   * 锁版本
   */
  auditDataVersion?: number;

  /**
   * 数据归属组织id
   */
  secBuId?: string | number;

  /**
   * 数据归属雇员id
   */
  secUserId?: string | number;

  /**
   * 数据归属公司id
   */
  secOuId?: string | number;

  /**
   * 所属组织ID
   */
  belongOrgId?: string | number;

  /**
   * 租户组织ID
   */
  tenantOrgId?: string | number;
}

export interface OperationQuery extends PageQuery {
  /**
   * 数据行索引
   */
  handle?: string;

  /**
   * 工序编码
   */
  operation?: string;

  /**
   * 描述
   */
  description?: string;

  /**
   * 状态
   */
  status?: string;

  /**
   * 工序类型
   */
  type?: string;

  /**
   *
   */
  specialRouterBo?: string;

  /**
   *
   */
  defaultResourceBo?: string;

  /**
   *
   */
  resourceTypeBo?: string;

  /**
   * 最大过站次数
   */
  maxLoop?: number;

  /**
   * 前工序间隔时长
   */
  beforeIntervalDuration?: number;

  /**
   * 处理时长
   */
  requiredTimeInProcess?: number;

  /**
   * 记录创建者ID
   */
  createUserId?: string | number;

  /**
   * 记录创建者
   */
  creator?: string;

  /**
   * 记录最后更新者ID
   */
  modifyUserId?: string | number;

  /**
   * 记录最后更新者
   */
  updater?: string;

  /**
   * 记录最后更新时间
   */
  modifyTime?: string;

  /**
   * 删除标记
   */
  deleteFlag?: number;

  /**
   * 锁版本
   */
  auditDataVersion?: number;

  /**
   * 数据归属组织id
   */
  secBuId?: string | number;

  /**
   * 数据归属雇员id
   */
  secUserId?: string | number;

  /**
   * 数据归属公司id
   */
  secOuId?: string | number;

  /**
   * 所属组织ID
   */
  belongOrgId?: string | number;

  /**
   * 租户组织ID
   */
  tenantOrgId?: string | number;

  /**
   * 日期范围参数
   */
  params?: any;
}
