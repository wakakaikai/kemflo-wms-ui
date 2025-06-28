export interface AttachedVO {
  /**
   * 记录唯一ID
   */
  id: string | number;

  /**
   * 附加项目主表行号
   */
  attachmentBo: string;

  /**
   * 附加明细行号
   */
  attachedGbo: string;

  /**
   * 此次附加的对象个数
   */
  countTotal: number;

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

export interface AttachedForm extends BaseEntity {
  /**
   * 记录唯一ID
   */
  id?: string | number;

  /**
   * 附加项目主表行号
   */
  attachmentBo?: string;

  /**
   * 附加明细行号
   */
  attachedGbo?: string;

  /**
   * 此次附加的对象个数
   */
  countTotal?: number;

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

export interface AttachedQuery extends PageQuery {

  /**
   * 附加项目主表行号
   */
  attachmentBo?: string;

  /**
   * 附加明细行号
   */
  attachedGbo?: string;

  /**
   * 此次附加的对象个数
   */
  countTotal?: number;

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



