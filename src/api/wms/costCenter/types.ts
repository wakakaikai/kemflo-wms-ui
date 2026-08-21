export interface CostCenterVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 成本中心
   */
  costCenter: string;

  /**
   * 成本中心名称
   */
  costCenterName: string;

  /**
   * 备注
   */
  remark: string;

}

export interface CostCenterForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 成本中心
   */
  costCenter?: string;

  /**
   * 成本中心名称
   */
  costCenterName?: string;

  /**
   * 备注
   */
  remark?: string;

}

export interface CostCenterQuery extends PageQuery {

  /**
   * 成本中心
   */
  costCenter?: string;

  /**
   * 成本中心名称
   */
  costCenterName?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



