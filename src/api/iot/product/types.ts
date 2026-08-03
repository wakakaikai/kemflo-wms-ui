export interface ProductVO {
  /**
   * 产品ID
   */
  id: string | number;

  /**
   * 产品编码
   */
  productCode: string;

  /**
   * 产品名称
   */
  productName: string;

  /**
   * 协议类型
   */
  protocolType: string;

  /**
   * 厂商
   */
  manufacturer?: string;

  /**
   * 产品版本
   */
  productVersion?: string;

  /**
   * 状态（0正常 1停用）
   */
  status?: string;

  /**
   * 备注
   */
  remark?: string;
}

export interface ProductForm extends BaseEntity {
  /**
   * 产品ID
   */
  id?: string | number;

  /**
   * 产品编码
   */
  productCode?: string;

  /**
   * 产品名称
   */
  productName?: string;

  /**
   * 协议类型
   */
  protocolType?: string;

  /**
   * 厂商
   */
  manufacturer?: string;

  /**
   * 产品版本
   */
  productVersion?: string;

  /**
   * 状态（0正常 1停用）
   */
  status?: string;

  /**
   * 备注
   */
  remark?: string;
}

export interface ProductQuery extends PageQuery {
  /**
   * 产品编码
   */
  productCode?: string;

  /**
   * 产品名称
   */
  productName?: string;

  /**
   * 协议类型
   */
  protocolType?: string;

  /**
   * 状态（0正常 1停用）
   */
  status?: string;

  /**
   * 日期范围参数
   */
  params?: any;
}
