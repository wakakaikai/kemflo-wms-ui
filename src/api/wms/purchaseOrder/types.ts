export interface PurchaseOrderVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 采购订单号
   */
  poNumber: string;

  /**
   * 凭证类型
   */
  docType: string;

  /**
   * 采购组
   */
  purchasingGroup: string;

  /**
   * 采购组织
   */
  purchasingOrg: string;

  /**
   * 供应商代码
   */
  supplierCode: string;

  /**
   * 供应商名称
   */
  supplierName?: string;

  /**
   * 备注
   */
  remark: string;
}

export interface PurchaseOrderForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 采购订单号
   */
  poNumber?: string;

  /**
   * 凭证类型
   */
  docType?: string;

  /**
   * 采购组
   */
  purchasingGroup?: string;

  /**
   * 采购组织
   */
  purchasingOrg?: string;

  /**
   * 供应商代码
   */
  supplierCode?: string;

  /**
   * 供应商名称
   */
  supplierName?: string;

  /**
   * 备注
   */
  remark?: string;
}

export interface PurchaseOrderQuery extends PageQuery {
  /**
   * 采购订单号
   */
  poNumber?: string;

  /**
   * 凭证类型
   */
  docType?: string;

  /**
   * 采购组
   */
  purchasingGroup?: string;

  /**
   * 采购组织
   */
  purchasingOrg?: string;

  /**
   * 供应商代码
   */
  supplierCode?: string;

  /**
   * 供应商名称
   */
  supplierName?: string;

  /**
   * 日期范围参数
   */
  params?: any;
}
