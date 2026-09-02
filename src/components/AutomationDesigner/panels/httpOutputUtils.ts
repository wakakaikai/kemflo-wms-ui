export type HttpOutputVarType = 'string' | 'number' | 'object' | 'string[]' | 'number[]' | 'object[]';

export interface HttpOutputVariable {
  name: string;
  displayName: string;
  type: HttpOutputVarType;
  sourcePath: string;
  description?: string;
  builtin?: boolean;
}

export const HTTP_OUTPUT_TYPE_OPTIONS: Array<{ label: string; value: HttpOutputVarType }> = [
  { label: '文本', value: 'string' },
  { label: '数字', value: 'number' },
  { label: '对象', value: 'object' },
  { label: '文本数组', value: 'string[]' },
  { label: '数字数组', value: 'number[]' },
  { label: '对象数组', value: 'object[]' },
];

export const DEFAULT_HTTP_OUTPUT_VARS: HttpOutputVariable[] = [
  {
    name: 'statusCode',
    displayName: 'statusCode',
    type: 'number',
    sourcePath: 'result.status',
    description: 'HTTP请求返回的状态码',
    builtin: true,
  },
  {
    name: 'body',
    displayName: 'body',
    type: 'string',
    sourcePath: 'result.body',
    description: 'HTTP请求的返回结果',
    builtin: true,
  },
];

export function typeBadge(type: HttpOutputVarType) {
  if (type === 'number' || type === 'number[]') return '123';
  if (type === 'object' || type === 'object[]') return '{}';
  if (type === 'string[]') return '[T]';
  return 'T';
}

export function outputVarsToMapping(vars: HttpOutputVariable[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  vars.forEach((item) => {
    if (item.name?.trim()) {
      mapping[item.name.trim()] = item.sourcePath || '';
    }
  });
  return mapping;
}

export function loadOutputVariables(cfg: Record<string, any>): HttpOutputVariable[] {
  if (Array.isArray(cfg.outputVariables) && cfg.outputVariables.length) {
    return cfg.outputVariables.map(normalizeOutputVar);
  }
  const mapping = cfg.outputMapping || cfg.responseMapping || {};
  const builtins = DEFAULT_HTTP_OUTPUT_VARS.map((item) => ({ ...item }));
  if (!mapping || typeof mapping !== 'object') return builtins;
  const custom: HttpOutputVariable[] = [];
  Object.entries(mapping).forEach(([name, path]) => {
    const builtin = builtins.find((item) => item.name === name);
    if (builtin) {
      builtin.sourcePath = String(path ?? builtin.sourcePath);
      return;
    }
    custom.push({
      name,
      displayName: name,
      type: 'string',
      sourcePath: String(path ?? ''),
      description: '',
      builtin: false,
    });
  });
  return [...builtins, ...custom];
}

function normalizeOutputVar(raw: any): HttpOutputVariable {
  return {
    name: raw.name || '',
    displayName: raw.displayName || raw.name || '',
    type: raw.type || 'string',
    sourcePath: raw.sourcePath || raw.path || '',
    description: raw.description || '',
    builtin: !!raw.builtin,
  };
}
