export interface CustomerVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 客户代码
   */
  customerCode: string;

  /**
   * 客户名称
   */
  customerName: string;

  /**
   * 国家代码
   */
  countryCode: string;

  /**
   * 国家名称
   */
  countryName: string;

  /**
   * 语言
   */
  language: string;

  /**
   * 地址
   */
  address: string;

  /**
   * 城市
   */
  city: string;

  /**
   * 地区
   */
  region: string;

  /**
   * 邮政编码
   */
  postalCode: string;

  /**
   * 联系人
   */
  contactPerson: string;

  /**
   * 电话
   */
  phone: string;

  /**
   * 传真
   */
  fax: string;

  /**
   * 分机号
   */
  extension: string;

  /**
   * 电子邮件
   */
  email: string;

  /**
   * 状态：1-有效 0-无效
   */
  status: number;

  /**
   * 备注
   */
  remark: string;

}

export interface CustomerForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 客户代码
   */
  customerCode?: string;

  /**
   * 客户名称
   */
  customerName?: string;

  /**
   * 国家代码
   */
  countryCode?: string;

  /**
   * 国家名称
   */
  countryName?: string;

  /**
   * 语言
   */
  language?: string;

  /**
   * 地址
   */
  address?: string;

  /**
   * 城市
   */
  city?: string;

  /**
   * 地区
   */
  region?: string;

  /**
   * 邮政编码
   */
  postalCode?: string;

  /**
   * 联系人
   */
  contactPerson?: string;

  /**
   * 电话
   */
  phone?: string;

  /**
   * 传真
   */
  fax?: string;

  /**
   * 分机号
   */
  extension?: string;

  /**
   * 电子邮件
   */
  email?: string;

  /**
   * 状态：1-有效 0-无效
   */
  status?: number;

  /**
   * 备注
   */
  remark?: string;

}

export interface CustomerQuery extends PageQuery {

  /**
   * 客户代码
   */
  customerCode?: string;

  /**
   * 客户名称
   */
  customerName?: string;

  /**
   * 国家代码
   */
  countryCode?: string;

  /**
   * 国家名称
   */
  countryName?: string;

  /**
   * 语言
   */
  language?: string;

  /**
   * 地址
   */
  address?: string;

  /**
   * 城市
   */
  city?: string;

  /**
   * 地区
   */
  region?: string;

  /**
   * 邮政编码
   */
  postalCode?: string;

  /**
   * 联系人
   */
  contactPerson?: string;

  /**
   * 电话
   */
  phone?: string;

  /**
   * 传真
   */
  fax?: string;

  /**
   * 分机号
   */
  extension?: string;

  /**
   * 电子邮件
   */
  email?: string;

  /**
   * 状态：1-有效 0-无效
   */
  status?: number;

    /**
     * 日期范围参数
     */
    params?: any;
}



