// AntV X6 节点类型和配置定义
export enum NodeCategory {
  TRIGGER = 'trigger',
  CONTROL = 'control',
  AI = 'ai',
  DATA = 'data',
  INTEGRATION = 'integration',
  DEVICE = 'device',
  APPROVAL = 'approval',
}

export const NodeCategoryLabels: Record<NodeCategory, string> = {
  [NodeCategory.TRIGGER]: '触发',
  [NodeCategory.CONTROL]: '控制',
  [NodeCategory.AI]: 'AI',
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
  { type: 'MANUAL_TRIGGER', category: NodeCategory.TRIGGER, label: '开始', icon: 'Hand', color: '#1677ff', shape: 'ellipse', defaultConfig: { description: '', inputFields: [{ name: 'content', displayName: '用户问题', type: 'text', required: true }, { name: 'history', displayName: '对话历史', type: 'text', required: false }, { name: 'images', displayName: '图片', type: 'image', required: false }] } },
  { type: 'CRON_TRIGGER', category: NodeCategory.TRIGGER, label: '定时触发', icon: 'Clock', color: '#1677ff', shape: 'ellipse', defaultConfig: { cronExpression: '0 * * * * ?', timeZone: 'Asia/Shanghai' } },
  { type: 'WEBHOOK_TRIGGER', category: NodeCategory.TRIGGER, label: 'Webhook触发', icon: 'Link', color: '#1677ff', shape: 'ellipse', defaultConfig: { path: '/webhook/' } },
  { type: 'DATA_TRIGGER', category: NodeCategory.TRIGGER, label: '数据触发', icon: 'DataBoard', color: '#1677ff', shape: 'ellipse', defaultConfig: { worksheetId: '', eventType: 'INSERT' } },
  { type: 'MESSAGE_TRIGGER', category: NodeCategory.TRIGGER, label: '消息触发', icon: 'Message', color: '#1677ff', shape: 'ellipse', defaultConfig: { topic: '', queue: '' } },
  { type: 'DEVICE_PROPERTY_TRIGGER', category: NodeCategory.TRIGGER, label: '设备触发', icon: 'Monitor', color: '#1677ff', shape: 'ellipse', defaultConfig: { productCode: '', pointCode: '', operator: '>', threshold: 0 } },
];

// 控制节点
const controlNodes: NodeConfigItem[] = [
  { type: 'CONDITION', category: NodeCategory.CONTROL, label: '分支', icon: 'QuestionFilled', color: '#5b8ff9', shape: 'rect', defaultConfig: { expression: '', alias: '', description: '' } },
  { type: 'SWITCH', category: NodeCategory.CONTROL, label: '条件分支', icon: 'Share', color: '#5b8ff9', shape: 'rect', defaultConfig: { expression: '', branches: [], cases: [{ value: '', label: 'IF', type: 'IF', remarks: 'IF' }, { value: 'default', label: 'ELSE', type: 'DEFAULT', remarks: '默认分支' }], alias: '', description: '' } },
  { type: 'LOOP', category: NodeCategory.CONTROL, label: '循环', icon: 'Refresh', color: '#fa8c16', shape: 'rect', defaultConfig: { loopType: 'counted', maxLoopTimes: 3, collectionExpression: '', variableName: 'item', loopParams: [], inputMapping: {}, outputVar: 'loopResult' } },
  { type: 'DELAY', category: NodeCategory.CONTROL, label: '延时等待', icon: 'Timer', color: '#fa8c16', shape: 'rect', defaultConfig: { delaySeconds: 60 } },
  { type: 'WAIT', category: NodeCategory.CONTROL, label: '等待事件', icon: 'Stopwatch', color: '#fa8c16', shape: 'rect', defaultConfig: { waitType: 'APPROVAL', waitKey: '', timeout: 86400 } },
  { type: 'END', category: NodeCategory.CONTROL, label: '结束', icon: 'CircleCloseFilled', color: '#fa8c16', shape: 'ellipse', defaultConfig: {} },
];

// AI 节点
const aiNodes: NodeConfigItem[] = [
  {
    type: 'AI_PROMPT_TEMPLATE',
    category: NodeCategory.AI,
    label: '提示词模板',
    icon: 'ChatLineRound',
    color: '#2f6fed',
    shape: 'rect',
    defaultConfig: {
      systemPrompt: '你是企业流程自动化助手，请基于输入变量完成任务。',
      userPrompt: '请处理以下业务输入：${input}',
      variables: [{ field: 'input', description: '用户输入或上游节点输出', required: true }],
      outputVar: 'prompt',
    },
  },
  {
    type: 'AI_LLM_CHAT',
    category: NodeCategory.AI,
    label: '大模型对话',
    icon: 'ChatDotRound',
    color: '#2f6fed',
    shape: 'rect',
    defaultConfig: {
      modelId: '',
      modelName: '',
      promptVar: 'prompt',
      temperature: 0.7,
      maxTokens: 2048,
      stream: false,
      outputVar: 'aiResponse',
    },
  },
  {
    type: 'AI_KNOWLEDGE_RETRIEVE',
    category: NodeCategory.AI,
    label: '知识库检索',
    icon: 'Reading',
    color: '#00a870',
    shape: 'rect',
    defaultConfig: {
      knowledgeIds: [],
      queryExpression: '${input}',
      topK: 4,
      similarity: 0.76,
      outputVar: 'knowledgeContext',
    },
  },
  {
    type: 'AI_MCP_TOOL',
    category: NodeCategory.AI,
    label: 'MCP工具',
    icon: 'Tools',
    color: '#7b61ff',
    shape: 'rect',
    defaultConfig: {
      mcpId: '',
      toolName: '',
      arguments: {},
      outputVar: 'toolResult',
    },
  },
  {
    type: 'AI_FLOW_CALL',
    category: NodeCategory.AI,
    label: 'AI流程调用',
    icon: 'Operation',
    color: '#13a8a8',
    shape: 'rect',
    defaultConfig: {
      flowId: '',
      inputMapping: {},
      outputVar: 'flowResult',
    },
  },
  {
    type: 'AI_MEMORY',
    category: NodeCategory.AI,
    label: '上下文记忆',
    icon: 'Notebook',
    color: '#fa8c16',
    shape: 'rect',
    defaultConfig: {
      memoryKey: '${sessionId}',
      writeMode: 'APPEND',
      contentExpression: '${aiResponse.content}',
      outputVar: 'memory',
    },
  },
  {
    type: 'CHAT_VAR_GET',
    category: NodeCategory.AI,
    label: '变量读取',
    icon: 'Download',
    color: '#13c2c2',
    shape: 'rect',
    defaultConfig: {
      variables: [{ name: 'question', description: '用户问题' }],
      outputVar: 'chatVars',
    },
  },
  {
    type: 'CHAT_VAR_SET',
    category: NodeCategory.AI,
    label: '变量赋值',
    icon: 'Upload',
    color: '#13c2c2',
    shape: 'rect',
    defaultConfig: {
      variables: [{ name: 'answer', valueExpression: '${aiResponse.content}' }],
      outputVar: 'chatVars',
    },
  },
  {
    type: 'AI_RESPONSE',
    category: NodeCategory.AI,
    label: '回复输出',
    icon: 'Finished',
    color: '#ff7a45',
    shape: 'rect',
    defaultConfig: {
      responseTemplate: '${aiResponse.content}',
      includeSources: true,
      outputVar: 'response',
    },
  },
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
  { type: 'HTTP_CALL', category: NodeCategory.INTEGRATION, label: 'HTTP 请求', icon: 'Connection', color: '#1677ff', shape: 'rect', defaultConfig: {
    method: 'GET',
    url: '',
    contentType: 'application/json',
    headers: {},
    queryParams: {},
    inputMapping: {},
    bodyType: 'none',
    body: '',
    formBody: {},
    timeoutMs: 120000,
    successCodes: '200,201,204',
    responseType: 'json',
    outputVar: 'body',
    outputMapping: { statusCode: 'result.status', body: 'result.body' },
    outputVariables: [
      { name: 'statusCode', displayName: 'statusCode', type: 'number', sourcePath: 'result.status', description: 'HTTP请求返回的状态码', builtin: true },
      { name: 'body', displayName: 'body', type: 'string', sourcePath: 'result.body', description: 'HTTP请求的返回结果', builtin: true },
    ],
  }},
  { type: 'JDBC_CALL', category: NodeCategory.INTEGRATION, label: '自定义 SQL', icon: 'Coin', color: '#722ed1', shape: 'rect', defaultConfig: { dataSourceName: '', connectionId: '', sql: '', params: [], inputMapping: {}, outputType: 'object[]', outputVar: 'sqlResult' } },
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
  ...aiNodes,
  ...dataNodes,
  ...integrationNodes,
  ...deviceNodes,
  ...approvalNodes,
];

// 按类型查找
export function getNodeConfig(type: string): NodeConfigItem | undefined {
  return ALL_NODE_CONFIGS.find(n => n.type === type);
}

// 端口定义（默认隐藏，悬停/已连接时显示）
const portCircle = {
  r: 3,
  magnet: true,
  stroke: '#C2C8D5',
  strokeWidth: 1,
  fill: '#C2C8D5',
  style: { visibility: 'hidden' as const },
};
export const NODE_PORTS = {
  groups: {
    top: { position: 'top', attrs: { circle: { ...portCircle } } },
    bottom: { position: 'bottom', attrs: { circle: { ...portCircle } } },
    left: { position: 'left', attrs: { circle: { ...portCircle } } },
    right: { position: 'right', attrs: { circle: { ...portCircle } } },
  },
  items: [
    { id: 'top', group: 'top' },
    { id: 'bottom', group: 'bottom' },
    { id: 'left', group: 'left' },
    { id: 'right', group: 'right' },
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
