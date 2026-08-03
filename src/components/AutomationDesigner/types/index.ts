// AntV X6 节点类型和配置定义
export enum NodeCategory {
  TRIGGER = 'trigger',
  CONTROL = 'control',
  DATA = 'data',
  INTEGRATION = 'integration',
  DEVICE = 'device',
  APPROVAL = 'approval',
}

export const NodeCategoryLabels: Record<NodeCategory, string> = {
  [NodeCategory.TRIGGER]: '触发',
  [NodeCategory.CONTROL]: '控制',
  [NodeCategory.DATA]: '数据',
  [NodeCategory.INTEGRATION]: '集成',
  [NodeCategory.DEVICE]: '设备',
  [NodeCategory.APPROVAL]: '审批',
};

export interface NodeConfigItem {
  type: string;
  category: NodeCategory;
  label: string;
  icon: string;
  color: string;
  shape: string;
  defaultConfig?: Record<string, any>;
}

// 触发节点
const triggerNodes: NodeConfigItem[] = [
  { type: 'MANUAL_TRIGGER', category: NodeCategory.TRIGGER, label: '手工触发', icon: 'Hand', color: '#1677ff', shape: 'ellipse', defaultConfig: { description: '' } },
  { type: 'CRON_TRIGGER', category: NodeCategory.TRIGGER, label: '定时触发', icon: 'Clock', color: '#1677ff', shape: 'ellipse', defaultConfig: { cronExpression: '0 * * * * ?', timeZone: 'Asia/Shanghai' } },
  { type: 'WEBHOOK_TRIGGER', category: NodeCategory.TRIGGER, label: 'Webhook触发', icon: 'Link', color: '#1677ff', shape: 'ellipse', defaultConfig: { path: '/webhook/' } },
  { type: 'DATA_TRIGGER', category: NodeCategory.TRIGGER, label: '数据触发', icon: 'DataBoard', color: '#1677ff', shape: 'ellipse', defaultConfig: { worksheetId: '', eventType: 'INSERT' } },
  { type: 'MESSAGE_TRIGGER', category: NodeCategory.TRIGGER, label: '消息触发', icon: 'Message', color: '#1677ff', shape: 'ellipse', defaultConfig: { topic: '', queue: '' } },
  { type: 'DEVICE_PROPERTY_TRIGGER', category: NodeCategory.TRIGGER, label: '设备触发', icon: 'Monitor', color: '#1677ff', shape: 'ellipse', defaultConfig: { productCode: '', pointCode: '', operator: '>', threshold: 0 } },
];

// 控制节点
const controlNodes: NodeConfigItem[] = [
  { type: 'CONDITION', category: NodeCategory.CONTROL, label: '条件判断', icon: 'QuestionFilled', color: '#fa8c16', shape: 'diamond', defaultConfig: { expression: '' } },
  { type: 'SWITCH', category: NodeCategory.CONTROL, label: 'Switch分支', icon: 'Share', color: '#fa8c16', shape: 'diamond', defaultConfig: { expression: '', cases: [{ value: '', label: '分支1' }] } },
  { type: 'LOOP', category: NodeCategory.CONTROL, label: '循环', icon: 'Refresh', color: '#fa8c16', shape: 'rect', defaultConfig: { collectionExpression: '', variableName: 'item', maxIterations: 100 } },
  { type: 'DELAY', category: NodeCategory.CONTROL, label: '延时等待', icon: 'Timer', color: '#fa8c16', shape: 'rect', defaultConfig: { delaySeconds: 60 } },
  { type: 'WAIT', category: NodeCategory.CONTROL, label: '等待事件', icon: 'Stopwatch', color: '#fa8c16', shape: 'rect', defaultConfig: { waitType: 'APPROVAL', waitKey: '', timeout: 86400 } },
  { type: 'END', category: NodeCategory.CONTROL, label: '结束', icon: 'CircleCloseFilled', color: '#fa8c16', shape: 'ellipse', defaultConfig: {} },
];

// 数据节点
const dataNodes: NodeConfigItem[] = [
  { type: 'DATA_QUERY', category: NodeCategory.DATA, label: '数据查询', icon: 'Search', color: '#52c41a', shape: 'rect', defaultConfig: { worksheetId: '', filterJson: '', sortJson: '', pageSize: 100 } },
  { type: 'DATA_CREATE', category: NodeCategory.DATA, label: '数据新增', icon: 'Plus', color: '#52c41a', shape: 'rect', defaultConfig: { worksheetId: '', mappingJson: '' } },
  { type: 'DATA_UPDATE', category: NodeCategory.DATA, label: '数据更新', icon: 'Edit', color: '#52c41a', shape: 'rect', defaultConfig: { worksheetId: '', filterJson: '', mappingJson: '' } },
  { type: 'DATA_DELETE', category: NodeCategory.DATA, label: '数据删除', icon: 'Delete', color: '#52c41a', shape: 'rect', defaultConfig: { worksheetId: '', filterJson: '' } },
  { type: 'DATA_MAPPING', category: NodeCategory.DATA, label: '数据映射', icon: 'Transform', color: '#52c41a', shape: 'rect', defaultConfig: { mappingJson: '' } },
  { type: 'DATA_FILTER', category: NodeCategory.DATA, label: '数据过滤', icon: 'Filter', color: '#52c41a', shape: 'rect', defaultConfig: { expression: '' } },
];

// 集成节点
const integrationNodes: NodeConfigItem[] = [
  { type: 'HTTP_CALL', category: NodeCategory.INTEGRATION, label: 'HTTP调用', icon: 'Connection', color: '#722ed1', shape: 'rect', defaultConfig: { operationCode: '', inputMapping: {} } },
  { type: 'JDBC_CALL', category: NodeCategory.INTEGRATION, label: 'JDBC查询', icon: 'Coin', color: '#722ed1', shape: 'rect', defaultConfig: { connectionId: '', sql: '', params: [] } },
  { type: 'SAP_CALL', category: NodeCategory.INTEGRATION, label: 'SAP调用', icon: 'Cloud', color: '#722ed1', shape: 'rect', defaultConfig: { operationCode: '', inputMapping: {} } },
  { type: 'MQTT_CALL', category: NodeCategory.INTEGRATION, label: 'MQTT发布', icon: 'Send', color: '#722ed1', shape: 'rect', defaultConfig: { connectionId: '', topic: '', payload: '' } },
  { type: 'SFTP_CALL', category: NodeCategory.INTEGRATION, label: 'SFTP操作', icon: 'FolderOpened', color: '#722ed1', shape: 'rect', defaultConfig: { connectionId: '', action: 'UPLOAD', remotePath: '', localPath: '' } },
  { type: 'MAIL_CALL', category: NodeCategory.INTEGRATION, label: '发送邮件', icon: 'Message', color: '#722ed1', shape: 'rect', defaultConfig: { connectionId: '', to: '', subject: '', body: '' } },
];

// 设备节点
const deviceNodes: NodeConfigItem[] = [
  { type: 'DEVICE_READ', category: NodeCategory.DEVICE, label: '设备读取', icon: 'Download', color: '#13c2c2', shape: 'rect', defaultConfig: { deviceCode: '', pointCode: '' } },
  { type: 'DEVICE_WRITE', category: NodeCategory.DEVICE, label: '设备写入', icon: 'Upload', color: '#13c2c2', shape: 'rect', defaultConfig: { deviceCode: '', pointCode: '', value: '' } },
  { type: 'DEVICE_BATCH_READ', category: NodeCategory.DEVICE, label: '批量读取', icon: 'FolderOpened', color: '#13c2c2', shape: 'rect', defaultConfig: { deviceCode: '', pointCodes: [] } },
  { type: 'DEVICE_COMMAND', category: NodeCategory.DEVICE, label: '设备命令', icon: 'Cpu', color: '#13c2c2', shape: 'rect', defaultConfig: { deviceCode: '', commandCode: '', params: {} } },
  { type: 'DEVICE_WAIT_RESPONSE', category: NodeCategory.DEVICE, label: '等待响应', icon: 'Clock', color: '#13c2c2', shape: 'rect', defaultConfig: { commandId: '', timeout: 30 } },
  { type: 'DEVICE_STATUS', category: NodeCategory.DEVICE, label: '设备状态', icon: 'Monitor', color: '#13c2c2', shape: 'rect', defaultConfig: { deviceCode: '' } },
];

// 审批节点
const approvalNodes: NodeConfigItem[] = [
  { type: 'APPROVAL_START', category: NodeCategory.APPROVAL, label: '发起审批', icon: 'Document', color: '#eb2f96', shape: 'rect', defaultConfig: { flowCode: '', businessKey: '', variables: {} } },
  { type: 'APPROVAL_WAIT', category: NodeCategory.APPROVAL, label: '等待审批', icon: 'Clock', color: '#eb2f96', shape: 'rect', defaultConfig: { approvalInstanceId: '', timeout: 604800 } },
  { type: 'APPROVAL_TERMINATE', category: NodeCategory.APPROVAL, label: '终止审批', icon: 'CircleClose', color: '#eb2f96', shape: 'rect', defaultConfig: { approvalInstanceId: '', reason: '' } },
];

// 所有节点配置
export const ALL_NODE_CONFIGS: NodeConfigItem[] = [
  ...triggerNodes,
  ...controlNodes,
  ...dataNodes,
  ...integrationNodes,
  ...deviceNodes,
  ...approvalNodes,
];

// 按类型查找
export function getNodeConfig(type: string): NodeConfigItem | undefined {
  return ALL_NODE_CONFIGS.find(n => n.type === type);
}

// 端口定义
export const NODE_PORTS = {
  groups: {
    top: { position: 'top', attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', strokeWidth: 1, fill: '#fff' } } },
    bottom: { position: 'bottom', attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', strokeWidth: 1, fill: '#fff' } } },
    left: { position: 'left', attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', strokeWidth: 1, fill: '#fff' } } },
    right: { position: 'right', attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', strokeWidth: 1, fill: '#fff' } } },
  },
  items: [
    { group: 'top' }, { group: 'bottom' },
    { group: 'left' }, { group: 'right' },
  ],
};

// 流程定义运行时接口类型
export interface RuntimeTrigger {
  id: string;
  type: string;
  config: Record<string, any>;
}

export interface RuntimeNode {
  id: string;
  type: string;
  name: string;
  config: Record<string, any>;
  failStrategy?: string;
  retry?: { maxRetryCount: number; retryInterval: number };
  timeout?: number;
  inputMapping?: Record<string, string>;
  outputMapping?: Record<string, string>;
}

export interface RuntimeDefinition {
  automationCode: string;
  version: number;
  trigger: RuntimeTrigger;
  nodes: RuntimeNode[];
  edges: Array<{ id: string; source: string; target: string; label?: string; condition?: string }>;
}
