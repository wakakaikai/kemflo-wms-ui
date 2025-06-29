export interface MessageRecipientVO {
  /**
   * 主键ID
   */
  id: string | number;

  /**
   * 关联的消息ID
   */
  messageId: string | number;

  /**
   * 接收者用户ID
   */
  recipientId: string | number;

  /**
   * 是否已确认阅读
   */
  readStatus: number;

  /**
   * 阅读确认时间
   */
  readTime: string;

  /**
   * 备注
   */
  remark: string;

}

export interface MessageRecipientForm extends BaseEntity {
  /**
   * 主键ID
   */
  id?: string | number;

  /**
   * 关联的消息ID
   */
  messageId?: string | number;

  /**
   * 接收者用户ID
   */
  recipientId?: string | number;

  /**
   * 是否已确认阅读
   */
  readStatus?: number;

  /**
   * 阅读确认时间
   */
  readTime?: string;

  /**
   * 备注
   */
  remark?: string;

}

export interface MessageRecipientQuery extends PageQuery {

  /**
   * 关联的消息ID
   */
  messageId?: string | number;

  /**
   * 接收者用户ID
   */
  recipientId?: string | number;

  /**
   * 是否已确认阅读
   */
  readStatus?: number;

  /**
   * 阅读确认时间
   */
  readTime?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



