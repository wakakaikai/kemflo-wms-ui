export interface WarehouseTemplateVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 模板名称
   */
  name: string;

  /**
   * 仓库ID
   */
  warehouseId: string | number;

  /**
   * 模板内容
   */
  templateJson: string;

  /**
   * 备注
   */
  remark: string;

}

export interface WarehouseTemplateForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 模板名称
   */
  name?: string;

  /**
   * 仓库ID
   */
  warehouseId?: string | number;

  /**
   * 模板内容
   */
  templateJson?: string;

  /**
   * 备注
   */
  remark?: string;

}

export interface WarehouseTemplateQuery extends PageQuery {

  /**
   * 模板名称
   */
  name?: string;

  /**
   * 仓库ID
   */
  warehouseId?: string | number;

  /**
   * 模板内容
   */
  templateJson?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



