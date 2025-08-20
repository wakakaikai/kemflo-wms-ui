export interface SfcVO {
  /**
   * 记录唯一ID
   */
  id: string | number;

  /**
   * 行号
   */
  handle: string;

  /**
   * 站点
   */
  site: string;

  /**
   * 产品条码
   */
  sfc: string;

  /**
   * 状态
   */
  status: string;

  /**
   *
   */
  shopOrderBo: string;

  /**
   * 条码数量
   */
  qty: number;

  /**
   * 条码完成数量
   */
  qtyDone: number;

  /**
   * 条码报废数量
   */
  qtyScrapped: number;

  /**
   *
   */
  itemBo: string;

  /**
   * 优先级, 继承工单
   */
  priority: number;

  /**
   * 优先级, 继承工单
   */
  actualCompDate: string;

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
   *
   */
  currentOperationBo: string;

  /**
   *
   */
  currentResourceBo: string;
}

export interface SfcForm extends BaseEntity {
  /**
   * 记录唯一ID
   */
  id?: string | number;

  /**
   * 行号
   */
  handle?: string;

  /**
   * 站点
   */
  site?: string;

  /**
   * 产品条码
   */
  sfc?: string;

  /**
   * 状态
   */
  status?: string;

  /**
   *
   */
  shopOrderBo?: string;

  /**
   * 条码数量
   */
  qty?: number;

  /**
   * 条码完成数量
   */
  qtyDone?: number;

  /**
   * 条码报废数量
   */
  qtyScrapped?: number;

  /**
   *
   */
  itemBo?: string;

  /**
   * 优先级, 继承工单
   */
  priority?: number;

  /**
   * 优先级, 继承工单
   */
  actualCompDate?: string;

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
   *
   */
  currentOperationBo?: string;

  /**
   *
   */
  currentResourceBo?: string;
}

export interface SfcQuery extends PageQuery {
  /**
   * 行号
   */
  handle?: string;

  /**
   * 站点
   */
  site?: string;

  /**
   * 产品条码
   */
  sfc?: string;

  /**
   * 状态
   */
  status?: string;

  /**
   *
   */
  shopOrderBo?: string;

  /**
   * 条码数量
   */
  qty?: number;

  /**
   * 条码完成数量
   */
  qtyDone?: number;

  /**
   * 条码报废数量
   */
  qtyScrapped?: number;

  /**
   *
   */
  itemBo?: string;

  /**
   * 优先级, 继承工单
   */
  priority?: number;

  /**
   * 优先级, 继承工单
   */
  actualCompDate?: string;

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
   *
   */
  currentOperationBo?: string;

  /**
   *
   */
  currentResourceBo?: string;

  /**
   * 日期范围参数
   */
  params?: any;
}
