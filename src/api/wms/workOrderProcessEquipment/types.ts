export interface WorkOrderProcessEquipmentVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 工单工序ID
   */
  workOrderProcessId: string | number;

  /**
   * 设备编码
   */
  equipmentCode: string;

  /**
   * 设备描述
   */
  equipmentDesc: string;

  /**
   * 备注
   */
  remark: string;

}

export interface WorkOrderProcessEquipmentForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 工单工序ID
   */
  workOrderProcessId?: string | number;

  /**
   * 设备编码
   */
  equipmentCode?: string;

  /**
   * 设备描述
   */
  equipmentDesc?: string;

  /**
   * 备注
   */
  remark?: string;

}

export interface WorkOrderProcessEquipmentQuery extends PageQuery {

  /**
   * 工单工序ID
   */
  workOrderProcessId?: string | number;

  /**
   * 设备编码
   */
  equipmentCode?: string;

  /**
   * 设备描述
   */
  equipmentDesc?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



