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
  type: 'input' | 'number' | 'select' | 'radio' | 'switch' | 'textarea' | 'json' | 'keyValueList';
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
      { key: 'inputFields', label: '输入字段(JSON)', type: 'json', placeholder: '[{"name":"question","description":"用户问题"}]' },
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
      { key: 'expression', label: '筛选条件', type: 'textarea', required: true, placeholder: '例如: loadingTime == null' },
      { key: 'alias', label: '节点别名', type: 'input', placeholder: '可选' },
      { key: 'description', label: '节点说明', type: 'textarea', placeholder: '可选' },
    ],
    SWITCH: [
      { key: 'expression', label: '分支表达式', type: 'textarea', required: true },
      { key: 'cases', label: '分支配置(JSON)', type: 'json', placeholder: '[{"label":"CASE 1","type":"CASE","value":"A","remarks":"分支A"},{"label":"DEFAULT","type":"DEFAULT","value":"default","remarks":"默认分支"}]' },
      { key: 'alias', label: '节点别名', type: 'input', placeholder: '可选' },
      { key: 'description', label: '节点说明', type: 'textarea', placeholder: '可选' },
    ],
    LOOP: [
      { key: 'loopType', label: '循环模式', type: 'select', defaultValue: 'counted', options: [
        { label: '次数循环', value: 'counted' },
        { label: '迭代循环', value: 'array' },
        { label: '无限循环', value: 'infinite' },
      ]},
      { key: 'maxLoopTimes', label: '最大循环次数', type: 'number', defaultValue: 3 },
      { key: 'collectionExpression', label: '集合表达式', type: 'input', placeholder: '${items}' },
      { key: 'variableName', label: '循环变量名', type: 'input', defaultValue: 'item' },
      { key: 'loopParams', label: '循环变量(JSON)', type: 'json', placeholder: '[{"name":"index","value":"${index}"}]' },
      { key: 'outputVar', label: '输出变量名', type: 'input', defaultValue: 'loopResult' },
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
    AI_PROMPT_TEMPLATE: [
      { key: 'systemPrompt', label: '系统提示词', type: 'textarea', placeholder: '定义模型角色、边界和输出要求' },
      { key: 'userPrompt', label: '用户提示词模板', type: 'textarea', required: true, placeholder: '可用 ${变量名} 引用流程变量' },
      { key: 'variables', label: '输入变量(JSON)', type: 'json', placeholder: '[{"field":"orderId","description":"订单号","required":true}]' },
      { key: 'outputVar', label: '输出变量名', type: 'input', defaultValue: 'prompt' },
    ],
    AI_LLM_CHAT: [
      { key: 'modelId', label: '模型ID', type: 'input', required: true, placeholder: '配置中心中的模型ID' },
      { key: 'modelName', label: '模型名称', type: 'input', placeholder: '例如 gpt-4.1 / qwen-plus' },
      { key: 'promptVar', label: '提示词变量', type: 'input', defaultValue: 'prompt' },
      { key: 'temperature', label: '温度', type: 'number', defaultValue: 0.7 },
      { key: 'maxTokens', label: '最大Token', type: 'number', defaultValue: 2048 },
      { key: 'stream', label: '流式输出', type: 'switch', defaultValue: false },
      { key: 'outputVar', label: '输出变量名', type: 'input', defaultValue: 'aiResponse' },
    ],
    AI_KNOWLEDGE_RETRIEVE: [
      { key: 'knowledgeIds', label: '知识库ID(JSON)', type: 'json', required: true, placeholder: '["kb-1","kb-2"]' },
      { key: 'queryExpression', label: '检索问题', type: 'textarea', required: true, placeholder: '${input}' },
      { key: 'topK', label: '召回数量', type: 'number', defaultValue: 4 },
      { key: 'similarity', label: '相似度阈值', type: 'number', defaultValue: 0.76 },
      { key: 'outputVar', label: '输出变量名', type: 'input', defaultValue: 'knowledgeContext' },
    ],
    AI_MCP_TOOL: [
      { key: 'mcpId', label: 'MCP服务ID', type: 'input', required: true },
      { key: 'toolName', label: '工具名称', type: 'input', required: true },
      { key: 'arguments', label: '工具参数(JSON)', type: 'json', placeholder: '{"orderId":"${orderId}"}' },
      { key: 'outputVar', label: '输出变量名', type: 'input', defaultValue: 'toolResult' },
    ],
    AI_FLOW_CALL: [
      { key: 'flowId', label: '流程ID', type: 'input', required: true },
      { key: 'inputMapping', label: '输入映射(JSON)', type: 'json', placeholder: '{"input":"${input}"}' },
      { key: 'outputVar', label: '输出变量名', type: 'input', defaultValue: 'flowResult' },
    ],
    AI_MEMORY: [
      { key: 'memoryKey', label: '记忆Key', type: 'input', required: true, placeholder: '${sessionId}' },
      { key: 'writeMode', label: '写入模式', type: 'select', defaultValue: 'APPEND', options: [
        { label: '追加', value: 'APPEND' },
        { label: '替换', value: 'REPLACE' },
      ]},
      { key: 'contentExpression', label: '记忆内容', type: 'textarea', placeholder: '${aiResponse.content}' },
      { key: 'outputVar', label: '输出变量名', type: 'input', defaultValue: 'memory' },
    ],
    CHAT_VAR_GET: [
      { key: 'variables', label: '读取变量(JSON)', type: 'json', required: true, placeholder: '[{"name":"question","description":"用户问题"}]' },
      { key: 'outputVar', label: '输出变量名', type: 'input', defaultValue: 'chatVars' },
    ],
    CHAT_VAR_SET: [
      { key: 'variables', label: '赋值变量(JSON)', type: 'json', required: true, placeholder: '[{"name":"answer","valueExpression":"${aiResponse.content}"}]' },
      { key: 'outputVar', label: '输出变量名', type: 'input', defaultValue: 'chatVars' },
    ],
    AI_RESPONSE: [
      { key: 'responseTemplate', label: '回复模板', type: 'textarea', required: true, placeholder: '${aiResponse.content}' },
      { key: 'includeSources', label: '包含来源', type: 'switch', defaultValue: true },
      { key: 'outputVar', label: '输出变量名', type: 'input', defaultValue: 'response' },
    ],
    HTTP_CALL: [
      { key: 'inputMapping', label: '输入变量(JSON)', type: 'json', placeholder: '{"name":"${content}"}' },
      { key: 'url', label: '请求URL', type: 'input', required: true, placeholder: '{{domainURL}}/api/path' },
      { key: 'method', label: '请求方法', type: 'select', defaultValue: 'GET', options: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'DELETE', value: 'DELETE' },
      ]},
      { key: 'contentType', label: 'Content-Type', type: 'select', defaultValue: 'application/json', options: [
        { label: 'application/json', value: 'application/json' },
        { label: 'application/x-www-form-urlencoded', value: 'application/x-www-form-urlencoded' },
        { label: 'text/plain', value: 'text/plain' },
        { label: 'multipart/form-data', value: 'multipart/form-data' },
        { label: '自定义(见Headers)', value: 'custom' },
      ]},
      { key: 'headers', label: '请求头', type: 'keyValueList', placeholder: 'Authorization' },
      { key: 'queryParams', label: 'Query参数(JSON)', type: 'json', placeholder: '{"page":1,"size":10}' },
      { key: 'bodyType', label: '请求体类型', type: 'select', defaultValue: 'json', options: [
        { label: 'JSON', value: 'json' },
        { label: 'Form', value: 'form' },
        { label: 'Raw文本', value: 'raw' },
        { label: '无', value: 'none' },
      ]},
      { key: 'body', label: '请求体', type: 'textarea', placeholder: 'JSON / 文本；可用 ${变量名} 引用流程变量' },
      { key: 'timeoutMs', label: '超时(毫秒)', type: 'number', defaultValue: 30000 },
      { key: 'successCodes', label: '成功状态码', type: 'input', defaultValue: '200,201,204', placeholder: '200,201,204' },
      { key: 'responseType', label: '响应解析', type: 'select', defaultValue: 'json', options: [
        { label: 'JSON', value: 'json' },
        { label: '文本', value: 'text' },
      ]},
      { key: 'outputVar', label: '输出变量名', type: 'input', defaultValue: 'httpResponse', placeholder: '写入流程变量的键名' },
    ],
    JDBC_CALL: [
      { key: 'dataSourceName', label: '数据源名称', type: 'input', placeholder: 'master / 业务数据源' },
      { key: 'connectionId', label: '连接ID', type: 'input', placeholder: '可选，兼容旧配置' },
      { key: 'sql', label: 'SQL语句', type: 'textarea', required: true },
      { key: 'params', label: '参数(JSON)', type: 'json', placeholder: '["${orderId}"]' },
      { key: 'outputVar', label: '输出变量名', type: 'input', defaultValue: 'sqlResult' },
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
