export interface MoveTypeReasonVO {
  /**
   * 唯一ID
   */
  id: string | number;

  /**
   * 移动类型
   */
  moveType: string;

  /**
   * 移动原因
   */
  moveReasonCode: string;

  /**
   * 移动原因描述
   */
  moveReasonDesc: string;

  /**
   * 状态
   */
  status: number;

  /**
   * 备注
   */
  remark: string;

}

export interface MoveTypeReasonForm extends BaseEntity {
  /**
   * 唯一ID
   */
  id?: string | number;

  /**
   * 移动类型
   */
  moveType?: string;

  /**
   * 移动原因
   */
  moveReasonCode?: string;

  /**
   * 移动原因描述
   */
  moveReasonDesc?: string;

  /**
   * 状态
   */
  status?: number;

  /**
   * 备注
   */
  remark?: string;

}

export interface MoveTypeReasonQuery extends PageQuery {

  /**
   * 移动类型
   */
  moveType?: string;

  /**
   * 移动原因
   */
  moveReasonCode?: string;

  /**
   * 移动原因描述
   */
  moveReasonDesc?: string;

  /**
   * 状态
   */
  status?: number;

    /**
     * 日期范围参数
     */
    params?: any;
}



