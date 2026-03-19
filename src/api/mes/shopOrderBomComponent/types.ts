export interface ShopOrderBomComponentVO {
  /**
   * 记录唯一ID
   */
  id: string | number;

  /**
   * 工单号
   */
  shopOrder: string;

  /**
   * BOM料号
   */
  bomItem: string;

  /**
   * 组件料号
   */
  componentItem: string;

  /**
   * 顺序号
   */
  sequence: number;

  /**
   * 组件类型0：唯一码 1：固定码
   */
  type: number;

  /**
   * 组件数量
   */
  quantity: number;

  /**
   * 组件工序
   */
  operation: string;

  /**
   * 条码规则
   */
  snRegex: string;

  /**
   * 备注
   */
  remark: string;

  /**
   * 记录创建者
   */
  creator: string;

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
   * 所属组织ID
   */
  belongOrgId: string | number;

  /**
   * 租户组织ID
   */
  tenantOrgId: string | number;

}

export interface ShopOrderBomComponentForm extends BaseEntity {
  /**
   * 记录唯一ID
   */
  id?: string | number;

  /**
   * 工单号
   */
  shopOrder?: string;

  /**
   * BOM料号
   */
  bomItem?: string;

  /**
   * 组件料号
   */
  componentItem?: string;

  /**
   * 顺序号
   */
  sequence?: number;

  /**
   * 组件类型0：唯一码 1：固定码
   */
  type?: number;

  /**
   * 组件数量
   */
  quantity?: number;

  /**
   * 组件工序
   */
  operation?: string;

  /**
   * 条码规则
   */
  snRegex?: string;

  /**
   * 备注
   */
  remark?: string;

  /**
   * 记录创建者
   */
  creator?: string;

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
   * 所属组织ID
   */
  belongOrgId?: string | number;

  /**
   * 租户组织ID
   */
  tenantOrgId?: string | number;

}

export interface ShopOrderBomComponentQuery extends PageQuery {

  /**
   * 工单号
   */
  shopOrder?: string;

  /**
   * BOM料号
   */
  bomItem?: string;

  /**
   * 组件料号
   */
  componentItem?: string;

  /**
   * 顺序号
   */
  sequence?: number;

  /**
   * 组件类型0：唯一码 1：固定码
   */
  type?: number;

  /**
   * 组件数量
   */
  quantity?: number;

  /**
   * 组件工序
   */
  operation?: string;

  /**
   * 条码规则
   */
  snRegex?: string;

  /**
   * 记录创建者
   */
  creator?: string;

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



