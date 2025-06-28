export interface BomVO {
  /**
   * 记录唯一ID
   */
  id: string | number;

  /**
   * 数据行索引
   */
  handle: string;

  /**
   * 物料清单
   */
  bom: string;

  /**
   * 物料清单类型
   */
  bomType: string;

  /**
   * 资源描述
   */
  description: string;

  /**
   * 状态
   */
  status: string;

  /**
   * 版本
   */
  revision: string;

  /**
   * 当前版本
   */
  currentRevision: string;

  /**
   * 有效期自
   */
  validFrom: string | number;

  /**
   * 有效期至
   */
  validTo: string | number;

  /**
   * 是否被使用
   */
  hasBeenUsed: string;

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

export interface BomForm extends BaseEntity {
  /**
   * 记录唯一ID
   */
  id?: string | number;

  /**
   * 数据行索引
   */
  handle?: string;

  /**
   * 物料清单
   */
  bom?: string;

  /**
   * 物料清单类型
   */
  bomType?: string;

  /**
   * 资源描述
   */
  description?: string;

  /**
   * 状态
   */
  status?: string;

  /**
   * 版本
   */
  revision?: string;

  /**
   * 当前版本
   */
  currentRevision?: string;

  /**
   * 有效期自
   */
  validFrom?: string | number;

  /**
   * 有效期至
   */
  validTo?: string | number;

  /**
   * 是否被使用
   */
  hasBeenUsed?: string;

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

export interface BomQuery extends PageQuery {

  /**
   * 数据行索引
   */
  handle?: string;

  /**
   * 物料清单
   */
  bom?: string;

  /**
   * 物料清单类型
   */
  bomType?: string;

  /**
   * 资源描述
   */
  description?: string;

  /**
   * 状态
   */
  status?: string;

  /**
   * 版本
   */
  revision?: string;

  /**
   * 当前版本
   */
  currentRevision?: string;

  /**
   * 有效期自
   */
  validFrom?: string | number;

  /**
   * 有效期至
   */
  validTo?: string | number;

  /**
   * 是否被使用
   */
  hasBeenUsed?: string;

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



