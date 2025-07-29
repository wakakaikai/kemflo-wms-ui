export interface HrDeptRoleVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 组织代码
   */
  orgCode: string;

  /**
   * 部门ID
   */
  departmentId: string | number;

  /**
   * 部门描述
   */
  departmentName: string;

  /**
   * 角色ID
   */
  roleId: string | number;

  /**
   * 部门id
   */
  deptId: string | number;

  /**
   * 备注
   */
  remark: string;
}

export interface HrDeptRoleForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 组织代码
   */
  orgCode?: string;

  /**
   * 部门ID
   */
  departmentId?: string | number;

  /**
   * 部门描述
   */
  departmentName?: string;

  /**
   * 角色ID
   */
  roleId?: string | number;

  /**
   * 部门id
   */
  deptId?: string | number;

  /**
   * 备注
   */
  remark?: string;
}

export interface HrDeptRoleQuery extends PageQuery {
  /**
   * 组织代码
   */
  orgCode?: string;

  /**
   * 部门ID
   */
  departmentId?: string | number;

  /**
   * 部门描述
   */
  departmentName?: string;

  /**
   * 角色ID
   */
  roleId?: string | number;

  /**
   * 部门id
   */
  deptId?: string | number;

  /**
   * 日期范围参数
   */
  params?: any;
}
