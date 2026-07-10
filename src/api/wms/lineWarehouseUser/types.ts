export interface LineWarehouseUserVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 仓库编码
   */
  warehouseCode: string;

  /**
   * 仓库名称
   */
  warehouseName: string;

  /**
   * 系统用户ID(关联员工表)
   */
  userId: string | number;

  /**
   * 用户账号
   */
  userName: string;

  /**
   * 用户昵称
   */
  nickName: string;

  /**
   * 备注
   */
  remark: string;

}

export interface LineWarehouseUserForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 仓库编码
   */
  warehouseCode?: string;

  /**
   * 仓库名称
   */
  warehouseName?: string;

  /**
   * 系统用户ID(关联员工表)
   */
  userId?: string | number;

  /**
   * 用户账号
   */
  userName?: string;

  /**
   * 用户昵称
   */
  nickName?: string;

  /**
   * 备注
   */
  remark?: string;

}

export interface LineWarehouseUserQuery extends PageQuery {

  /**
   * 仓库编码
   */
  warehouseCode?: string;

  /**
   * 用户账号
   */
  userName?: string;

  /**
   * 用户昵称
   */
  nickName?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



