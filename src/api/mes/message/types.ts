export interface MessageVO {
  /**
   * 消息唯一ID
   */
  id: string | number;

  /**
   * 工作中心
   */
  workCenter: string;

  /**
   * 工位
   */
  workStation: string;

  /**
   * 消息标题
   */
  title: string;

  /**
   * 消息内容
   */
  content: string;

  /**
   * 消息类型：1-异常呼叫通知,2-警报,3-私信,4-任务,5-系统
   */
  messageType: number;

  /**
   * 优先级0-9，数字越大优先级越高
   */
  priority: number;

  /**
   * 消息状态：0-草稿,1-活跃,2-已失效
   */
  status: number;

  /**
   * 消息发送时间
   */
  sendTime: string;

  /**
   * 消息发送人
   */
  sendUser: string;

  /**
   * 消息确认时间
   */
  confirmTime: string;

  /**
   * 消息确认人
   */
  confirmUser: string;

  /**
   * 备注
   */
  remark: string;
}

export interface MessageForm extends BaseEntity {
  /**
   * 消息唯一ID
   */
  id?: string | number;

  /**
   * 工作中心
   */
  workCenter?: string;

  /**
   * 工位
   */
  workStation?: string;

  /**
   * 工位描述
   */
  workStationDesc?: string;

  /**
   * 消息标题
   */
  title?: string;

  /**
   * 消息内容
   */
  content?: string;

  /**
   * 消息类型：1-异常呼叫通知,2-警报,3-私信,4-任务,5-系统
   */
  messageType?: number;

  /**
   * 优先级0-9，数字越大优先级越高
   */
  priority?: number;

  /**
   * 消息状态：0-草稿,1-活跃,2-已失效
   */
  status?: number;

  /**
   * 消息发送时间
   */
  sendTime?: string;

  /**
   * 时间范围
   */
  sendTimeRange?: any;

  /**
   * 时间范围
   */
  dateTimeRange?: any;

  /**
   * 消息发送人
   */
  sendUser?: string;

  /**
   * 消息确认时间
   */
  confirmTime?: string;

  /**
   * 消息确认人
   */
  confirmUser?: string;

  /**
   * 备注
   */
  remark?: string;
}

export interface MessageQuery extends PageQuery {
  /**
   * 工作中心
   */
  workCenter?: string;

  /**
   * 工位
   */
  workStation?: string;

  /**
   * 消息标题
   */
  title?: string;

  /**
   * 消息内容
   */
  content?: string;

  /**
   * 消息类型：1-异常呼叫通知,2-警报,3-私信,4-任务,5-系统
   */
  messageType?: number;

  /**
   * 优先级0-9，数字越大优先级越高
   */
  priority?: number;

  /**
   * 消息状态：0-草稿,1-活跃,2-已失效
   */
  status?: number;

  /**
   * 消息发送时间
   */
  sendTime?: string;

  /**
   * 时间范围
   */
  dateTimeRange?: any;

  /**
   * 消息发送人
   */
  sendUser?: string;

  /**
   * 消息确认时间
   */
  confirmTime?: string;

  /**
   * 消息确认人
   */
  confirmUser?: string;

  /**
   * 日期范围参数
   */
  params?: any;
}
