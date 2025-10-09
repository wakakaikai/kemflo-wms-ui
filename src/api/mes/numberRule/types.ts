export interface NumberRuleVO {
  /**
   * 记录唯一ID
   */
  id: string | number;

  /**
   * 编码规则行号
   */
  nextNumberBo: string;

  /**
   * 顺序号
   */
  sequence: number;

  /**
   * 类型
   */
  partType: string;

  /**
   * 变量类型
   */
  variableType: string;

  /**
   * 固定值
   */
  fixedValue: string;

  /**
   * 最小序列
   */
  minSequence: number;

  /**
   * 最大序列
   */
  maxSequence: number;

  /**
   * 序列长度
   */
  sequenceLength: number;

  /**
   * 当前序列
   */
  currentSequence: number;

  /**
   * 警告阈值
   */
  warningThreshold: number;

  /**
   * 重置规则
   */
  resetRule: string;

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

export interface NumberRuleForm extends BaseEntity {
  /**
   * 记录唯一ID
   */
  id?: string | number;

  /**
   * 编码规则行号
   */
  nextNumberBo?: string;

  /**
   * 顺序号
   */
  sequence?: number;

  /**
   * 类型
   */
  partType?: string;

  /**
   * 变量类型
   */
  variableType?: string;

  /**
   * 固定值
   */
  fixedValue?: string;

  /**
   * 最小序列
   */
  minSequence?: number;

  /**
   * 最大序列
   */
  maxSequence?: number;

  /**
   * 序列长度
   */
  sequenceLength?: number;

  /**
   * 当前序列
   */
  currentSequence?: number;

  /**
   * 警告阈值
   */
  warningThreshold?: number;

  /**
   * 重置规则
   */
  resetRule?: string;

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

export interface NumberRuleQuery extends PageQuery {

  /**
   * 编码规则行号
   */
  nextNumberBo?: string;

  /**
   * 顺序号
   */
  sequence?: number;

  /**
   * 类型
   */
  partType?: string;

  /**
   * 变量类型
   */
  variableType?: string;

  /**
   * 固定值
   */
  fixedValue?: string;

  /**
   * 最小序列
   */
  minSequence?: number;

  /**
   * 最大序列
   */
  maxSequence?: number;

  /**
   * 序列长度
   */
  sequenceLength?: number;

  /**
   * 当前序列
   */
  currentSequence?: number;

  /**
   * 警告阈值
   */
  warningThreshold?: number;

  /**
   * 重置规则
   */
  resetRule?: string;

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



