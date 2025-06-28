export interface WorkCenterVO {
  /**
   * 记录唯一ID
   */
  id: string | number;

  /**
   * 数据行索引
   */
  handle: string;

  /**
   * 工作中心
   */
  workCenter: string;

  /**
   * 描述
   */
  description: string;

  /**
   * 状态
   */
  status: string;

  /**
   * 工作中心分类
   */
  wcCategory: string;

  /**
   * 工艺路线
   */
  routerBo: string;

  /**
   * 是否末级工作中心, true|false
   */
  isLastWorkCenter: string;

  /**
   * 是否ERP工作中心, true|false
   */
  isErpWorkCenter: string;

  /**
   * ERP工作中心
   */
  erpWorkCenter: string;

  /**
   * 生产供应区
   */
  productionSupplyArea: string;

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

export interface WorkCenterForm extends BaseEntity {
  /**
   * 记录唯一ID
   */
  id?: string | number;

  /**
   * 数据行索引
   */
  handle?: string;

  /**
   * 工作中心
   */
  workCenter?: string;

  /**
   * 描述
   */
  description?: string;

  /**
   * 状态
   */
  status?: string;

  /**
   * 工作中心分类
   */
  wcCategory?: string;

  /**
   * 工艺路线
   */
  routerBo?: string;

  /**
   * 是否末级工作中心, true|false
   */
  isLastWorkCenter?: string;

  /**
   * 是否ERP工作中心, true|false
   */
  isErpWorkCenter?: string;

  /**
   * ERP工作中心
   */
  erpWorkCenter?: string;

  /**
   * 生产供应区
   */
  productionSupplyArea?: string;

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

export interface WorkCenterQuery extends PageQuery {

  /**
   * 数据行索引
   */
  handle?: string;

  /**
   * 工作中心
   */
  workCenter?: string;

  /**
   * 描述
   */
  description?: string;

  /**
   * 状态
   */
  status?: string;

  /**
   * 工作中心分类
   */
  wcCategory?: string;

  /**
   * 工艺路线
   */
  routerBo?: string;

  /**
   * 是否末级工作中心, true|false
   */
  isLastWorkCenter?: string;

  /**
   * 是否ERP工作中心, true|false
   */
  isErpWorkCenter?: string;

  /**
   * ERP工作中心
   */
  erpWorkCenter?: string;

  /**
   * 生产供应区
   */
  productionSupplyArea?: string;

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
   * 租户组织ID
   */
  tenantOrgId?: string | number;

    /**
     * 日期范围参数
     */
    params?: any;
}



