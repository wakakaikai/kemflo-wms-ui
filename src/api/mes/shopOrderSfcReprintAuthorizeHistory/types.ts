export interface ShopOrderSfcReprintAuthorizeHistoryVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 追踪ID
   */
  traceId: string | number;

  /**
   * 打印类型：1-普通标签 2-即扫即打标签
   */
  type: number;

  /**
   * 工单号
   */
  shopOrder: string;

  /**
   * 条码
   */
  sfc: string;

  /**
   * 授权时间
   */
  dateTime: string;

  /**
   * 授权补打次数
   */
  reprintQuantity: number;

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

  /**
   * 备注
   */
  remark: string;
}

export interface ShopOrderSfcReprintAuthorizeHistoryForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 追踪ID
   */
  traceId?: string | number;

  /**
   * 打印类型：1-普通标签 2-即扫即打标签
   */
  type?: number;

  /**
   * 工单号
   */
  shopOrder?: string;

  /**
   * 条码
   */
  sfc?: string;

  /**
   * 授权时间
   */
  dateTime?: string;

  /**
   * 授权补打次数
   */
  reprintQuantity?: number;

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
   * 备注
   */
  remark?: string;
}

export interface ShopOrderSfcReprintAuthorizeHistoryQuery extends PageQuery {
  /**
   * 追踪ID
   */
  traceId?: string | number;

  /**
   * 打印类型：1-普通标签 2-即扫即打标签
   */
  type?: number;

  /**
   * 工单号
   */
  shopOrder?: string;

  /**
   * 条码
   */
  sfc?: string;

  /**
   * 授权时间
   */
  dateTime?: string;

  /**
   * 授权补打次数
   */
  reprintQuantity?: number;

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
