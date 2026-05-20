export interface ShopOrderReportEmployeeVO {
  /**
   * 记录唯一ID
   */
  id: string | number;

  /**
   * 报工ID
   */
  reportId: string | number;

  /**
   * 工作中心
   */
  workCenter: string;

  /**
   * 工单号
   */
  shopOrder: string;

  /**
   * 员工工号
   */
  employeeId: string | number;

  /**
   * 员工姓名
   */
  employeeName: string;

  /**
   * 上线时间
   */
  onLineTime: string;

  /**
   * 下线时间
   */
  offLineTime: string;

  /**
   * 员工上线ID
   */
  employeeBindingId: string | number;

  /**
   * 出勤时长
   */
  duration: number;

  /**
   * 有效时长
   */
  effectiveDuration: number;

  /**
   * 所属组织ID
   */
  belongOrgId: string | number;

  /**
   * 租户组织ID
   */
  tenantOrgId: string | number;

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
   * 操作时长
   */
  operationDuration: number;

}

export interface ShopOrderReportEmployeeForm extends BaseEntity {
  /**
   * 记录唯一ID
   */
  id?: string | number;

  /**
   * 报工ID
   */
  reportId?: string | number;

  /**
   * 工作中心
   */
  workCenter?: string;

  /**
   * 工单号
   */
  shopOrder?: string;

  /**
   * 员工工号
   */
  employeeId?: string | number;

  /**
   * 员工姓名
   */
  employeeName?: string;

  /**
   * 上线时间
   */
  onLineTime?: string;

  /**
   * 下线时间
   */
  offLineTime?: string;

  /**
   * 员工上线ID
   */
  employeeBindingId?: string | number;

  /**
   * 出勤时长
   */
  duration?: number;

  /**
   * 有效时长
   */
  effectiveDuration?: number;

  /**
   * 所属组织ID
   */
  belongOrgId?: string | number;

  /**
   * 租户组织ID
   */
  tenantOrgId?: string | number;

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
   * 操作时长
   */
  operationDuration?: number;

}

export interface ShopOrderReportEmployeeQuery extends PageQuery {

  /**
   * 报工ID
   */
  reportId?: string | number;

  /**
   * 工作中心
   */
  workCenter?: string;

  /**
   * 工单号
   */
  shopOrder?: string;

  /**
   * 员工工号
   */
  employeeId?: string | number;

  /**
   * 员工姓名
   */
  employeeName?: string;

  /**
   * 上线时间
   */
  onLineTime?: string;

  /**
   * 下线时间
   */
  offLineTime?: string;

  /**
   * 员工上线ID
   */
  employeeBindingId?: string | number;

  /**
   * 出勤时长
   */
  duration?: number;

  /**
   * 有效时长
   */
  effectiveDuration?: number;

  /**
   * 所属组织ID
   */
  belongOrgId?: string | number;

  /**
   * 租户组织ID
   */
  tenantOrgId?: string | number;

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
   * 操作时长
   */
  operationDuration?: number;

    /**
     * 日期范围参数
     */
    params?: any;
}



