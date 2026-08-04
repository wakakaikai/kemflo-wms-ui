// 节点配置 - 所有节点的默认配置和表单定义
import { ALL_NODE_CONFIGS } from '../types';

// 根据类型获取默认配置
export function getDefaultConfig(type: string): Record<string, any> {
  const cfg = ALL_NODE_CONFIGS.find(n => n.type === type);
  return cfg?.defaultConfig ? JSON.parse(JSON.stringify(cfg.defaultConfig)) : {};
}

// 表单字段定义
export interface FormField {
  key: string;
  label: string;
  type: 'input' | 'number' | 'select' | 'switch' | 'textarea' | 'json';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: any }>;
  defaultValue?: any;
}

// 获取节点配置表单字段（不含节点名称，名称在面板顶部单独编辑）
export function getConfigFormFields(type: string): FormField[] {
  return getTypeSpecificFields(type);
}

function getTypeSpecificFields(type: string): FormField[] {
  const fields: Record<string, FormField[]> = {
    MANUAL_TRIGGER: [
      { key: 'description', label: '描述', type: 'textarea' },
    ],
    CRON_TRIGGER: [
      { key: 'cronExpression', label: 'Cron表达式', type: 'input', required: true, placeholder: '0 * * * * ?' },
      { key: 'timeZone', label: '时区', type: 'input', defaultValue: 'Asia/Shanghai' },
    ],
    WEBHOOK_TRIGGER: [
      { key: 'path', label: 'Webhook路径', type: 'input', required: true },
    ],
    DATA_TRIGGER: [
      { key: 'worksheetId', label: '工作表', type: 'input', required: true },
      { key: 'eventType', label: '事件类型', type: 'select', options: [
        { label: '新增', value: 'INSERT' },
        { label: '修改', value: 'UPDATE' },
        { label: '删除', value: 'DELETE' },
      ]},
    ],
    MESSAGE_TRIGGER: [
      { key: 'topic', label: '主题', type: 'input' },
      { key: 'queue', label: '队列', type: 'input' },
    ],
    DEVICE_PROPERTY_TRIGGER: [
      { key: 'productCode', label: '产品编码', type: 'input', required: true },
      { key: 'pointCode', label: '点位编码', type: 'input', required: true },
      { key: 'operator', label: '比较符', type: 'select', options: [
        { label: '>', value: '>' },
        { label: '>=', value: '>=' },
        { label: '<', value: '<' },
        { label: '<=', value: '<=' },
        { label: '==', value: '==' },
        { label: '!=', value: '!=' },
      ]},
      { key: 'threshold', label: '阈值', type: 'number', defaultValue: 0 },
    ],
    CONDITION: [
      { key: 'expression', label: '条件表达式', type: 'textarea', required: true, placeholder: 'trigger.value > 80' },
    ],
    SWITCH: [
      { key: 'expression', label: '表达式', type: 'textarea', required: true },
      { key: 'cases', label: '分支配置(JSON)', type: 'json' },
    ],
    LOOP: [
      { key: 'collectionExpression', label: '集合表达式', type: 'input', required: true },
      { key: 'variableName', label: '循环变量名', type: 'input', defaultValue: 'item' },
      { key: 'maxIterations', label: '最大循环次数', type: 'number', defaultValue: 100 },
    ],
    DELAY: [
      { key: 'delaySeconds', label: '延时(秒)', type: 'number', required: true, defaultValue: 60 },
    ],
    WAIT: [
      { key: 'waitType', label: '等待类型', type: 'select', options: [
        { label: '审批', value: 'APPROVAL' },
        { label: '事件', value: 'EVENT' },
        { label: '定时', value: 'SCHEDULE' },
        { label: '设备响应', value: 'DEVICE_RESPONSE' },
        { label: '消息', value: 'MESSAGE' },
      ]},
      { key: 'waitKey', label: '等待键', type: 'input' },
      { key: 'timeout', label: '超时(秒)', type: 'number', defaultValue: 86400 },
    ],
    DATA_QUERY: [
      { key: 'worksheetId', label: '工作表', type: 'input', required: true },
      { key: 'filterJson', label: '过滤条件(JSON)', type: 'json' },
      { key: 'sortJson', label: '排序(JSON)', type: 'json' },
      { key: 'pageSize', label: '分页大小', type: 'number', defaultValue: 100 },
    ],
    DATA_CREATE: [
      { key: 'worksheetId', label: '工作表', type: 'input', required: true },
      { key: 'mappingJson', label: '字段映射(JSON)', type: 'json' },
    ],
    DATA_UPDATE: [
      { key: 'worksheetId', label: '工作表', type: 'input', required: true },
      { key: 'filterJson', label: '过滤条件(JSON)', type: 'json' },
      { key: 'mappingJson', label: '字段映射(JSON)', type: 'json' },
    ],
    DATA_DELETE: [
      { key: 'worksheetId', label: '工作表', type: 'input', required: true },
      { key: 'filterJson', label: '过滤条件(JSON)', type: 'json' },
    ],
    DATA_MAPPING: [
      { key: 'mappingJson', label: '映射配置(JSON)', type: 'json', required: true },
    ],
    DATA_FILTER: [
      { key: 'expression', label: '过滤表达式', type: 'textarea', required: true },
    ],
    HTTP_CALL: [
      { key: 'operationCode', label: '操作编码', type: 'input', required: true },
      { key: 'inputMapping', label: '输入映射(JSON)', type: 'json' },
    ],
    JDBC_CALL: [
      { key: 'connectionId', label: '连接ID', type: 'input', required: true },
      { key: 'sql', label: 'SQL语句', type: 'textarea', required: true },
      { key: 'params', label: '参数(JSON)', type: 'json' },
    ],
    SAP_CALL: [
      { key: 'operationCode', label: '操作编码', type: 'input', required: true },
      { key: 'inputMapping', label: '输入映射(JSON)', type: 'json' },
    ],
    MQTT_CALL: [
      { key: 'connectionId', label: '连接ID', type: 'input', required: true },
      { key: 'topic', label: '主题', type: 'input', required: true },
      { key: 'payload', label: '消息体', type: 'textarea' },
    ],
    SFTP_CALL: [
      { key: 'connectionId', label: '连接ID', type: 'input', required: true },
      { key: 'action', label: '操作', type: 'select', options: [
        { label: '上传', value: 'UPLOAD' },
        { label: '下载', value: 'DOWNLOAD' },
        { label: '删除', value: 'DELETE' },
      ]},
      { key: 'remotePath', label: '远程路径', type: 'input' },
      { key: 'localPath', label: '本地路径', type: 'input' },
    ],
    MAIL_CALL: [
      { key: 'connectionId', label: '连接ID', type: 'input' },
      { key: 'to', label: '收件人', type: 'input', required: true },
      { key: 'subject', label: '主题', type: 'input', required: true },
      { key: 'body', label: '内容', type: 'textarea' },
    ],
    DEVICE_READ: [
      { key: 'deviceCode', label: '设备编码', type: 'input', required: true },
      { key: 'pointCode', label: '点位编码', type: 'input', required: true },
    ],
    DEVICE_WRITE: [
      { key: 'deviceCode', label: '设备编码', type: 'input', required: true },
      { key: 'pointCode', label: '点位编码', type: 'input', required: true },
      { key: 'value', label: '写入值', type: 'input', required: true },
    ],
    DEVICE_BATCH_READ: [
      { key: 'deviceCode', label: '设备编码', type: 'input', required: true },
      { key: 'pointCodes', label: '点位列表(JSON)', type: 'json' },
    ],
    DEVICE_COMMAND: [
      { key: 'deviceCode', label: '设备编码', type: 'input', required: true },
      { key: 'commandCode', label: '命令编码', type: 'input', required: true },
      { key: 'params', label: '参数(JSON)', type: 'json' },
    ],
    DEVICE_WAIT_RESPONSE: [
      { key: 'commandId', label: '命令ID', type: 'input', required: true },
      { key: 'timeout', label: '超时(秒)', type: 'number', defaultValue: 30 },
    ],
    DEVICE_STATUS: [
      { key: 'deviceCode', label: '设备编码', type: 'input', required: true },
    ],
    APPROVAL_START: [
      { key: 'flowCode', label: '流程编码', type: 'input', required: true },
      { key: 'businessKey', label: '业务Key', type: 'input' },
      { key: 'variables', label: '变量(JSON)', type: 'json' },
    ],
    APPROVAL_WAIT: [
      { key: 'approvalInstanceId', label: '审批实例ID', type: 'input', required: true },
      { key: 'timeout', label: '超时(秒)', type: 'number', defaultValue: 604800 },
    ],
    APPROVAL_TERMINATE: [
      { key: 'approvalInstanceId', label: '审批实例ID', type: 'input', required: true },
      { key: 'reason', label: '终止原因', type: 'input' },
    ],
  };

  return fields[type] || [];
}

// 切割逻辑：验证节点配置
export function validateConfig(type: string, config: Record<string, any>): string[] {
  const errors: string[] = [];
  const fields = getConfigFormFields(type);
  for (const field of fields) {
    if (field.required && (config[field.key] === undefined || config[field.key] === null || config[field.key] === '')) {
      errors.push(`${field.label} 不能为空`);
    }
  }
  return errors;
}
