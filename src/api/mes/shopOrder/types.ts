export interface ShopOrderVO {
  /**
   * 记录唯一ID
   */
  id: string | number;

  /**
   * 数据行索引
   */
  handle: string;

  /**
   * 工单
   */
  shopOrder: string;

  /**
   * 状态
   */
  status: string;

  /**
   * 工单类型
   */
  shopOrderType: string;

  /**
   * 工单优先级
   */
  priority: number;

  /**
   * 计划工作中心
   */
  plannedWorkCenterBo: string;

  /**
   * 计划物料
   */
  plannedItemBo: string;

  /**
   * 计划BOM
   */
  plannedBomBo: string;

  /**
   * 计划工艺路线
   */
  plannedRouterBo: string;

  /**
   * 实际物料
   */
  itemBo: string;

  /**
   * 实际BOM
   */
  bomBo: string;

  /**
   * 实际工艺路线
   */
  routerBo: string;

  /**
   * 计划生产数量
   */
  qtyToBuild: number;

  /**
   * 下达数量
   */
  qtyReleased: number;

  /**
   * 计划开始时间
   */
  plannedStartDate: string;

  /**
   * 计划完成时间
   */
  plannedCompDate: string;

  /**
   * 第一条码下达时间
   */
  releasedDate: string;

  /**
   * 完成数量
   */
  qtyDone: number;

  /**
   * 报废数量
   */
  qtyScrapped: number;

  /**
   * 实际开始时间
   */
  actualStartDate: string;

  /**
   * 实际完成时间
   */
  actualCompDate: string;

  /**
   * 客户编号
   */
  customer: string;

  /**
   * 客户订单号
   */
  customerOrder: string;

  /**
   * 超产比例
   */
  overDeliveryTolerance: number;

  /**
   * 考虑报废数量
   */
  considerScrap: string | number;

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

export interface ShopOrderForm extends BaseEntity {
  /**
   * 记录唯一ID
   */
  id?: string | number;

  /**
   * 数据行索引
   */
  handle?: string;

  /**
   * 工单
   */
  shopOrder?: string;

  /**
   * 状态
   */
  status?: string;

  /**
   * 工单类型
   */
  shopOrderType?: string;

  /**
   * 工单优先级
   */
  priority?: number;

  /**
   * 计划工作中心
   */
  plannedWorkCenterBo?: string;

  /**
   * 计划物料
   */
  plannedItemBo?: string;

  /**
   * 计划BOM
   */
  plannedBomBo?: string;

  /**
   * 计划工艺路线
   */
  plannedRouterBo?: string;

  /**
   * 实际物料
   */
  itemBo?: string;

  /**
   * 实际BOM
   */
  bomBo?: string;

  /**
   * 实际工艺路线
   */
  routerBo?: string;

  /**
   * 计划生产数量
   */
  qtyToBuild?: number;

  /**
   * 下达数量
   */
  qtyReleased?: number;

  /**
   * 计划开始时间
   */
  plannedStartDate?: string;

  /**
   * 计划完成时间
   */
  plannedCompDate?: string;

  /**
   * 第一条码下达时间
   */
  releasedDate?: string;

  /**
   * 完成数量
   */
  qtyDone?: number;

  /**
   * 报废数量
   */
  qtyScrapped?: number;

  /**
   * 实际开始时间
   */
  actualStartDate?: string;

  /**
   * 实际完成时间
   */
  actualCompDate?: string;

  /**
   * 客户编号
   */
  customer?: string;

  /**
   * 客户订单号
   */
  customerOrder?: string;

  /**
   * 超产比例
   */
  overDeliveryTolerance?: number;

  /**
   * 考虑报废数量
   */
  considerScrap?: string | number;

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

export interface ShopOrderQuery extends PageQuery {

  /**
   * 数据行索引
   */
  handle?: string;

  /**
   * 工单
   */
  shopOrder?: string;

  /**
   * 状态
   */
  status?: string;

  /**
   * 工单类型
   */
  shopOrderType?: string;

  /**
   * 工单优先级
   */
  priority?: number;

  /**
   * 计划工作中心
   */
  plannedWorkCenterBo?: string;

  /**
   * 计划物料
   */
  plannedItemBo?: string;

  /**
   * 计划BOM
   */
  plannedBomBo?: string;

  /**
   * 计划工艺路线
   */
  plannedRouterBo?: string;

  /**
   * 实际物料
   */
  itemBo?: string;

  /**
   * 实际BOM
   */
  bomBo?: string;

  /**
   * 实际工艺路线
   */
  routerBo?: string;

  /**
   * 计划生产数量
   */
  qtyToBuild?: number;

  /**
   * 下达数量
   */
  qtyReleased?: number;

  /**
   * 计划开始时间
   */
  plannedStartDate?: string;

  /**
   * 计划完成时间
   */
  plannedCompDate?: string;

  /**
   * 第一条码下达时间
   */
  releasedDate?: string;

  /**
   * 完成数量
   */
  qtyDone?: number;

  /**
   * 报废数量
   */
  qtyScrapped?: number;

  /**
   * 实际开始时间
   */
  actualStartDate?: string;

  /**
   * 实际完成时间
   */
  actualCompDate?: string;

  /**
   * 客户编号
   */
  customer?: string;

  /**
   * 客户订单号
   */
  customerOrder?: string;

  /**
   * 超产比例
   */
  overDeliveryTolerance?: number;

  /**
   * 考虑报废数量
   */
  considerScrap?: string | number;

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
     * 日期范围参数
     */
    params?: any;
}



