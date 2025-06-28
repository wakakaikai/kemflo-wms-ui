export interface CustomerProfileVO {
  /**
   * 主键
   */
  id: string | number;
  /**
   * 公司
   */
  bukrs: string;

  /**
   * 客户代码
   */
  kunnr: string;

  /**
   * 名称
   */
  name: string;

  /**
   * 地址
   */
  address: string;

  /**
   * 国家
   */
  country: string;

  /**
   * 城市
   */
  city: string;

  /**
   * 语言
   */
  language: string;

  /**
   * 电话号码
   */
  telNumber: string;

  /**
   * 邮箱地址
   */
  smtpAddr: string;

  /**
   * 科目
   */
  akont: string;

  /**
   * 付款条件
   */
  zterm: string;

  /**
   * 删除标识
   */
  loevm: string;

  /**
   * 销售地区
   */
  bzirk: string;

  /**
   * 客户组
   */
  kdgrp: string;

  /**
   * 币别
   */
  waers: string;

  /**
   * 贸易条件1
   */
  inco1: string;

  /**
   * 付款条件2
   */
  inco2: string;

  /**
   * 账户分配组
   */
  ktgrd: string;

  /**
   * 税分类
   */
  taxkd: string;

  /**
   * 标记
   */
  flag: number;
}

export interface CustomerProfileForm extends BaseEntity {
  /**
   * 主键
   */
  id: string | number;

  /**
   * 公司
   */
  bukrs?: string;

  /**
   * 客户代码
   */
  kunnr?: string;

  /**
   * 名称
   */
  name?: string;

  /**
   * 地址
   */
  address?: string;

  /**
   * 国家
   */
  country?: string;

  /**
   * 城市
   */
  city?: string;

  /**
   * 语言
   */
  language?: string;

  /**
   * 电话号码
   */
  telNumber?: string;

  /**
   * 邮箱地址
   */
  smtpAddr?: string;

  /**
   * 科目
   */
  akont?: string;

  /**
   * 付款条件
   */
  zterm?: string;

  /**
   * 删除标识
   */
  loevm?: string;

  /**
   * 销售地区
   */
  bzirk?: string;

  /**
   * 客户组
   */
  kdgrp?: string;

  /**
   * 币别
   */
  waers?: string;

  /**
   * 贸易条件1
   */
  inco1?: string;

  /**
   * 付款条件2
   */
  inco2?: string;

  /**
   * 账户分配组
   */
  ktgrd?: string;

  /**
   * 税分类
   */
  taxkd?: string;

  /**
   * 标记
   */
  flag?: number;
}

export interface CustomerProfileQuery extends PageQuery {
  /**
   * 主键
   */
  id: string | number;

  /**
   * 公司
   */
  bukrs?: string;

  /**
   * 客户代码
   */
  kunnr?: string;

  /**
   * 名称
   */
  name?: string;

  /**
   * 地址
   */
  address?: string;

  /**
   * 国家
   */
  country?: string;

  /**
   * 城市
   */
  city?: string;

  /**
   * 语言
   */
  language?: string;

  /**
   * 电话号码
   */
  telNumber?: string;

  /**
   * 邮箱地址
   */
  smtpAddr?: string;

  /**
   * 科目
   */
  akont?: string;

  /**
   * 付款条件
   */
  zterm?: string;

  /**
   * 删除标识
   */
  loevm?: string;

  /**
   * 销售地区
   */
  bzirk?: string;

  /**
   * 客户组
   */
  kdgrp?: string;

  /**
   * 币别
   */
  waers?: string;

  /**
   * 贸易条件1
   */
  inco1?: string;

  /**
   * 付款条件2
   */
  inco2?: string;

  /**
   * 账户分配组
   */
  ktgrd?: string;

  /**
   * 税分类
   */
  taxkd?: string;

  /**
   * 标记
   */
  flag?: number;

  /**
   * 日期范围参数
   */
  params?: any;
}
