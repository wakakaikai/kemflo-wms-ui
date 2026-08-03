// 节点配置 - 所有节点的默认配置和表单定义
import { ALL_NODE_CONFIGS, NodeCategory, RuntimeNode, NodeConfigItem } from '../types';

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

// 获取节点配置表单字段
export function getConfigFormFields(type: string): FormField[] {
  const commonFields: FormField[] = [
    { key: 'name', label: '节点名称', type: 'input', required: true },
  ];

  const configFields = getTypeSpecificFields(type);
  return [...commonFields, ...configFields];
}

function getTypeSpecificFields(type: string): FormField[] {
  const fields: Record<string, FormField[]> = {
    // 触发节点
    MANUAL_TRIGGER: [],
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
    // 控制节点
    CONDITION: [
      { key: 'expression', label: '条件表达式', type: 'textarea', required: true, placeholder: 'trigger.value > 80' },
    ],
    SWITCH: [
      { key: 'expression', label: '表达式', type: 'textarea', required: true },
    ],
    DELAY: [
      { key: 'delaySeconds', label: '延时(秒)', type: 'number', required: true, defaultValue: 60 },
    ],
    WAIT: [
      { key: 'waitType', label: '等待类型', type: 'select', options: [
        { label: '审批', value: 'APPROVAL' },
        { label: '事件', value: 'EVENT' },
        { label: '定时', value: 'SCHEDULE' },
      ]},
      { key: 'timeout', label: '超时(秒)', type: 'number', defaultValue: 86400 },
    ],
    // 集成节点
    HTTP_CALL: [
      { key: 'operationCode', label: '操作编码', type: 'input', required: true },
      { key: 'inputMapping', label: '输入映射(JSON)', type: 'json' },
    ],
    JDBC_CALL: [
      { key: 'connectionId', label: '连接ID', type: 'input', required: true },
      { key: 'sql', label: 'SQL语句', type: 'textarea', required: true },
    ],
    MAIL_CALL: [
      { key: 'to', label: '收件人', type: 'input', required: true },
      { key: 'subject', label: '主题', type: 'input', required: true },
      { key: 'body', label: '内容', type: 'textarea' },
    ],
    // 设备节点
    DEVICE_READ: [
      { key: 'deviceCode', label: '设备编码', type: 'input', required: true },
      { key: 'pointCode', label: '点位编码', type: 'input', required: true },
    ],
    DEVICE_WRITE: [
      { key: 'deviceCode', label: '设备编码', type: 'input', required: true },
      { key: 'pointCode', label: '点位编码', type: 'input', required: true },
      { key: 'value', label: '写入值', type: 'input', required: true },
    ],
    DEVICE_COMMAND: [
      { key: 'deviceCode', label: '设备编码', type: 'input', required: true },
      { key: 'commandCode', label: '命令编码', type: 'input', required: true },
    ],
    // 审批节点
    APPROVAL_START: [
      { key: 'flowCode', label: '流程编码', type: 'input', required: true },
      { key: 'businessKey', label: '业务Key', type: 'input' },
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
    if (field.required && !config[field.key]) {
      errors.push(`${field.label} 不能为空`);
    }
  }
  return errors;
}
