export interface ShopOrderReportVO {
  /**
   * 记录唯一ID
   */
  id: string | number;

  /**
   * 工单号
   */
  shopOrder: string;

  /**
   * 工作中心
   */
  workCenter: string;

  /**
   * 班次
   */
  productionShift: string;

  /**
   * 作业人数
   */
  personNumber: number;

  /**
   * 机台数
   */
  machineNumber: number;

  /**
   * 模取数
   */
  moduleNumber: number;

  /**
   * 开工时间
   */
  startDateTime: string;

  /**
   * 完工时间
   */
  endDateTime: string;

  /**
   * 良品数
   */
  qtyReport: number;

  /**
   * 报废数
   */
  qtyScrapped: number;

  /**
   * 状态：-1：删除，0：开工，1：完工，2：MES->SAP同步报工中，3：MES->SAP同步报工成功，4：MES->SAP同步报工失败，5：MES取消报工，6：MES->SAP同步取消中，7：MES->SAP同步取消报工成功，8：MES->SAP同步取消报工失败


   */
  status: number;

  /**
   * 报工类型：1：组装报工，2：预装报工，3：注塑报工
   */
  businessType: number;

  /**
   * SAP工单号
   */
  erpShopOrder: string;

  /**
   * SAP工序
   */
  erpOperation: string;

  /**
   * 起迄时长
   */
  totalDuration: number;

  /**
   * 休息时长
   */
  restDuration: number;

  /**
   * 操作时长
   */
  operationDuration: number;

  /**
   * 停止时间
   */
  stopDuration: number;

  /**
   * 负荷时间
   */
  loadDuration: number;

  /**
   * 例外时间
   */
  abnormalDuration: number;

  /**
   * 有效时长
   */
  effectiveDuration: number;

  /**
   * 实际人时
   */
  personTime: number;

  /**
   * 报工结果
   */
  reportResult: string;

  /**
   * 报工结果描述
   */
  reportMessage: string;

  /**
   * 报工次数
   */
  reportCount: number;

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
   * 实际员工出勤时长
   */
  employeeTotalDuration: number;

  /**
   * 实际人员操作时长
   */
  employeeOperationDuration: number;

}

export interface ShopOrderReportForm extends BaseEntity {
  /**
   * 记录唯一ID
   */
  id?: string | number;

  /**
   * 工单号
   */
  shopOrder?: string;

  /**
   * 工作中心
   */
  workCenter?: string;

  /**
   * 班次
   */
  productionShift?: string;

  /**
   * 作业人数
   */
  personNumber?: number;

  /**
   * 机台数
   */
  machineNumber?: number;

  /**
   * 模取数
   */
  moduleNumber?: number;

  /**
   * 开工时间
   */
  startDateTime?: string;

  /**
   * 完工时间
   */
  endDateTime?: string;

  /**
   * 良品数
   */
  qtyReport?: number;

  /**
   * 报废数
   */
  qtyScrapped?: number;

  /**
   * 状态：-1：删除，0：开工，1：完工，2：MES->SAP同步报工中，3：MES->SAP同步报工成功，4：MES->SAP同步报工失败，5：MES取消报工，6：MES->SAP同步取消中，7：MES->SAP同步取消报工成功，8：MES->SAP同步取消报工失败


   */
  status?: number;

  /**
   * 报工类型：1：组装报工，2：预装报工，3：注塑报工
   */
  businessType?: number;

  /**
   * SAP工单号
   */
  erpShopOrder?: string;

  /**
   * SAP工序
   */
  erpOperation?: string;

  /**
   * 起迄时长
   */
  totalDuration?: number;

  /**
   * 休息时长
   */
  restDuration?: number;

  /**
   * 操作时长
   */
  operationDuration?: number;

  /**
   * 停止时间
   */
  stopDuration?: number;

  /**
   * 负荷时间
   */
  loadDuration?: number;

  /**
   * 例外时间
   */
  abnormalDuration?: number;

  /**
   * 有效时长
   */
  effectiveDuration?: number;

  /**
   * 实际人时
   */
  personTime?: number;

  /**
   * 报工结果
   */
  reportResult?: string;

  /**
   * 报工结果描述
   */
  reportMessage?: string;

  /**
   * 报工次数
   */
  reportCount?: number;

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
   * 实际员工出勤时长
   */
  employeeTotalDuration?: number;

  /**
   * 实际人员操作时长
   */
  employeeOperationDuration?: number;

}

export interface ShopOrderReportQuery extends PageQuery {

  /**
   * 工单号
   */
  shopOrder?: string;

  /**
   * 工作中心
   */
  workCenter?: string;

  /**
   * 班次
   */
  productionShift?: string;

  /**
   * 作业人数
   */
  personNumber?: number;

  /**
   * 机台数
   */
  machineNumber?: number;

  /**
   * 模取数
   */
  moduleNumber?: number;

  /**
   * 开工时间
   */
  startDateTime?: string;

  /**
   * 完工时间
   */
  endDateTime?: string;

  /**
   * 良品数
   */
  qtyReport?: number;

  /**
   * 报废数
   */
  qtyScrapped?: number;

  /**
   * 状态：-1：删除，0：开工，1：完工，2：MES->SAP同步报工中，3：MES->SAP同步报工成功，4：MES->SAP同步报工失败，5：MES取消报工，6：MES->SAP同步取消中，7：MES->SAP同步取消报工成功，8：MES->SAP同步取消报工失败


   */
  status?: number;

  /**
   * 报工类型：1：组装报工，2：预装报工，3：注塑报工
   */
  businessType?: number;

  /**
   * SAP工单号
   */
  erpShopOrder?: string;

  /**
   * SAP工序
   */
  erpOperation?: string;

  /**
   * 起迄时长
   */
  totalDuration?: number;

  /**
   * 休息时长
   */
  restDuration?: number;

  /**
   * 操作时长
   */
  operationDuration?: number;

  /**
   * 停止时间
   */
  stopDuration?: number;

  /**
   * 负荷时间
   */
  loadDuration?: number;

  /**
   * 例外时间
   */
  abnormalDuration?: number;

  /**
   * 有效时长
   */
  effectiveDuration?: number;

  /**
   * 实际人时
   */
  personTime?: number;

  /**
   * 报工结果
   */
  reportResult?: string;

  /**
   * 报工结果描述
   */
  reportMessage?: string;

  /**
   * 报工次数
   */
  reportCount?: number;

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
   * 实际员工出勤时长
   */
  employeeTotalDuration?: number;

  /**
   * 实际人员操作时长
   */
  employeeOperationDuration?: number;

    /**
     * 日期范围参数
     */
    params?: any;
}



