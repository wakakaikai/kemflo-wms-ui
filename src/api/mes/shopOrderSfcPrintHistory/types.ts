export interface ShopOrderSfcPrintHistoryVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 追踪ID
   */
  traceId: string | number;

  /**
   * 工单号
   */
  shopOrder: string;

  /**
   * 条码
   */
  sfc: string;

  /**
   * 打印时间
   */
  dateTime: string;

  /**
   * 创建者
   */
  creator: string;

  /**
   * 更新者
   */
  updater: string;

  /**
   * 更新时间
   */
  modifyTime: string;

  /**
   * 租户组织ID
   */
  tenantOrgId: string | number;

  /**
   * 组织ID
   */
  belongOrgId: string | number;

  /**
   * 删除标识
   */
  deleteFlag: number;
}

export interface ShopOrderSfcPrintHistoryForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 追踪ID
   */
  traceId?: string | number;

  /**
   * 工单号
   */
  shopOrder?: string;

  /**
   * 条码
   */
  sfc?: string;

  /**
   * 打印时间
   */
  dateTime?: string;

  /**
   * 创建者
   */
  creator?: string;

  /**
   * 更新者
   */
  updater?: string;

  /**
   * 更新时间
   */
  modifyTime?: string;

  /**
   * 租户组织ID
   */
  tenantOrgId?: string | number;

  /**
   * 组织ID
   */
  belongOrgId?: string | number;

  /**
   * 删除标识
   */
  deleteFlag?: number;
}

export interface ShopOrderSfcPrintHistoryQuery extends PageQuery {
  /**
   * 追踪ID
   */
  traceId?: string | number;

  /**
   * 工单号
   */
  shopOrder?: string;

  /**
   * 条码
   */
  sfc?: string;

  /**
   * 打印时间
   */
  dateTime?: string;

  /**
   * 创建者
   */
  creator?: string;

  /**
   * 更新者
   */
  updater?: string;

  /**
   * 更新时间
   */
  modifyTime?: string;

  /**
   * 租户组织ID
   */
  tenantOrgId?: string | number;

  /**
   * 组织ID
   */
  belongOrgId?: string | number;

  /**
   * 删除标识
   */
  deleteFlag?: number;

  /**
   * 日期范围参数
   */
  params?: any;
}
