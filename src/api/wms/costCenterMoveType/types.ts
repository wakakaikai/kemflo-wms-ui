export interface CostCenterMoveTypeVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 移动类型
   */
  moveType: string;

  /**
   * 成本中心
   */
  costCenter: string;

  /**
   * 成本中心名称
   */
  costCenterName: string;

}

export interface CostCenterMoveTypeForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 移动类型
   */
  moveType?: string;

  /**
   * 成本中心
   */
  costCenter?: string;

  /**
   * 成本中心名称
   */
  costCenterName?: string;

}

export interface CostCenterMoveTypeQuery extends PageQuery {

  /**
   * 移动类型
   */
  moveType?: string;

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



