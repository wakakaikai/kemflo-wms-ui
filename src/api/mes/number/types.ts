export interface NumberVO {
  /**
   * 记录唯一ID
   */
  id: string | number;

  /**
   * 数据行索引
   */
  handle: string;

  /**
   * 编号定义类型
   */
  nextNumberType: string;

  /**
   * 编号定义方式
   */
  definedBy: string;

  /**
   * 编码对象
   */
  contextBo: string;

  /**
   * 描述
   */
  description: string;

  /**
   * 立即提交编号规则更改, true|false
   */
  commitImmediately: string;

  /**
   * 样例
   */
  example: string;

  /**
   * 条码产生最后提交时间
   */
  lastCommitDate: string;

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

  /**
   * 主数据修改时间
   */
  dataModifyTime: string;

  /**
   * 主数据修改用户
   */
  dataModifyUser: string;

}

export interface NumberForm extends BaseEntity {
  /**
   * 记录唯一ID
   */
  id?: string | number;

  /**
   * 数据行索引
   */
  handle?: string;

  /**
   * 编号定义类型
   */
  nextNumberType?: string;

  /**
   * 编号定义方式
   */
  definedBy?: string;

  /**
   * 编码对象
   */
  contextBo?: string;

  /**
   * 描述
   */
  description?: string;

  /**
   * 立即提交编号规则更改, true|false
   */
  commitImmediately?: string;

  /**
   * 样例
   */
  example?: string;

  /**
   * 条码产生最后提交时间
   */
  lastCommitDate?: string;

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

  /**
   * 主数据修改时间
   */
  dataModifyTime?: string;

  /**
   * 主数据修改用户
   */
  dataModifyUser?: string;

}

export interface NumberQuery extends PageQuery {

  /**
   * 数据行索引
   */
  handle?: string;

  /**
   * 编号定义类型
   */
  nextNumberType?: string;

  /**
   * 编号定义方式
   */
  definedBy?: string;

  /**
   * 编码对象
   */
  contextBo?: string;

  /**
   * 描述
   */
  description?: string;

  /**
   * 立即提交编号规则更改, true|false
   */
  commitImmediately?: string;

  /**
   * 样例
   */
  example?: string;

  /**
   * 条码产生最后提交时间
   */
  lastCommitDate?: string;

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
   * 主数据修改时间
   */
  dataModifyTime?: string;

  /**
   * 主数据修改用户
   */
  dataModifyUser?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



