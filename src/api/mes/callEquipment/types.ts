export interface CallEquipmentVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 设备编码
   */
  equipmentId: string | number;

  /**
   * 用户名称
   */
  userName: string;

  /**
   * 工作岗位
   */
  workStation: string;

  /**
   * 工作中心
   */
  workCenter: string;

  /**
   * 备注
   */
  remark: string;

}

export interface CallEquipmentForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 设备编码
   */
  equipmentId?: string | number;

  /**
   * 用户名称
   */
  userName?: string;

  /**
   * 工作岗位
   */
  workStation?: string;

  /**
   * 工作中心
   */
  workCenter?: string;

  /**
   * 备注
   */
  remark?: string;

}

export interface CallEquipmentQuery extends PageQuery {

  /**
   * 设备编码
   */
  equipmentId?: string | number;

  /**
   * 用户名称
   */
  userName?: string;

  /**
   * 工作岗位
   */
  workStation?: string;

  /**
   * 工作中心
   */
  workCenter?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



