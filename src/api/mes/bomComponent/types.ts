export interface BomComponentVO {
  /**
   * 记录唯一ID
   */
  id: string | number;

  /**
   * 数据行索引
   */
  handle: string;

  /**
   * 物料清单行号
   */
  bomBo: string;

  /**
   * 顺序号
   */
  sequence: number;

  /**
   * 组件料号行号
   */
  componentGbo: string;

  /**
   * 物料组件类型
   */
  bomComponentType: string;

  /**
   * 启用物料清单替代料
   */
  useBomDefaults: string;

  /**
   * 装配数据类型行号
   */
  assyDataTypeBo: string;

  /**
   * 数量
   */
  qty: number;

  /**
   * 组件工序行号
   */
  assemblyOperationBo: string;

  /**
   * 组件最大使用次数
   */
  maximumUsage: number;

  /**
   * 参考点
   */
  refDes: string;

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

}

export interface BomComponentForm extends BaseEntity {
  /**
   * 记录唯一ID
   */
  id?: string | number;

  /**
   * 数据行索引
   */
  handle?: string;

  /**
   * 物料清单行号
   */
  bomBo?: string;

  /**
   * 顺序号
   */
  sequence?: number;

  /**
   * 组件料号行号
   */
  componentGbo?: string;

  /**
   * 物料组件类型
   */
  bomComponentType?: string;

  /**
   * 启用物料清单替代料
   */
  useBomDefaults?: string;

  /**
   * 装配数据类型行号
   */
  assyDataTypeBo?: string;

  /**
   * 数量
   */
  qty?: number;

  /**
   * 组件工序行号
   */
  assemblyOperationBo?: string;

  /**
   * 组件最大使用次数
   */
  maximumUsage?: number;

  /**
   * 参考点
   */
  refDes?: string;

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

}

export interface BomComponentQuery extends PageQuery {

  /**
   * 数据行索引
   */
  handle?: string;

  /**
   * 物料清单行号
   */
  bomBo?: string;

  /**
   * 顺序号
   */
  sequence?: number;

  /**
   * 组件料号行号
   */
  componentGbo?: string;

  /**
   * 物料组件类型
   */
  bomComponentType?: string;

  /**
   * 启用物料清单替代料
   */
  useBomDefaults?: string;

  /**
   * 装配数据类型行号
   */
  assyDataTypeBo?: string;

  /**
   * 数量
   */
  qty?: number;

  /**
   * 组件工序行号
   */
  assemblyOperationBo?: string;

  /**
   * 组件最大使用次数
   */
  maximumUsage?: number;

  /**
   * 参考点
   */
  refDes?: string;

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
     * 日期范围参数
     */
    params?: any;
}



