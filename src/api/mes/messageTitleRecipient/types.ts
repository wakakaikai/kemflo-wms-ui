export interface MessageTitleRecipientVO {
  /**
   * 主键ID
   */
  id: string | number;

  /**
   * 关联的消息主题
   */
  messageTitle: string;

  /**
   * 接收者用户ID
   */
  recipientId: string | number;

  /**
   * 接收者用户名
   */
  recipientUserName?: string;

  /**
   * 备注
   */
  remark: string;
}

export interface MessageTitleRecipientForm extends BaseEntity {
  /**
   * 主键ID
   */
  id?: string | number;

  /**
   * 关联的消息主题
   */
  messageTitle?: string;

  /**
   * 接收者用户ID
   */
  recipientId?: string | number;

  /**
   * 接收者用户名
   */
  recipientUserName?: string;

  /**
   * 备注
   */
  remark?: string;
}

export interface MessageTitleRecipientQuery extends PageQuery {
  /**
   * 关联的消息主题
   */
  messageTitle?: string;

  /**
   * 接收者用户ID
   */
  recipientId?: string | number;

  /**
   * 接收者用户名
   */
  recipientUserName?: string;

  /**
   * 日期范围参数
   */
  params?: any;
}
