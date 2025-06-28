export interface HookVO {
  /**
   * 记录唯一ID
   */
  id: string | number;

  /**
   * 数据行索引
   */
  handle: string;

  /**
   * 关联点
   */
  hookPoint: string;

  /**
   * 关联对象行号
   */
  contextGbo: string;

  /**
   * 顺序号
   */
  sequence: number;

  /**
   * 是否启用
   */
  enabled: string;

  /**
   * 用户参数
   */
  userArgument: string;

  /**
   * 作业行号
   */
  activityBo: string;

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

export interface HookForm extends BaseEntity {
  /**
   * 记录唯一ID
   */
  id?: string | number;

  /**
   * 数据行索引
   */
  handle?: string;

  /**
   * 关联点
   */
  hookPoint?: string;

  /**
   * 关联对象行号
   */
  contextGbo?: string;

  /**
   * 顺序号
   */
  sequence?: number;

  /**
   * 是否启用
   */
  enabled?: string;

  /**
   * 用户参数
   */
  userArgument?: string;

  /**
   * 作业行号
   */
  activityBo?: string;

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

export interface HookQuery extends PageQuery {

  /**
   * 数据行索引
   */
  handle?: string;

  /**
   * 关联点
   */
  hookPoint?: string;

  /**
   * 关联对象行号
   */
  contextGbo?: string;

  /**
   * 顺序号
   */
  sequence?: number;

  /**
   * 是否启用
   */
  enabled?: string;

  /**
   * 用户参数
   */
  userArgument?: string;

  /**
   * 作业行号
   */
  activityBo?: string;

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



