import type { Node } from '@antv/x6';
import { getNodeConfig } from '../types';

export interface VariableOption {
  label: string;
  value: string;
  displayValue?: string;
  nodeId: string;
  nodeLabel: string;
  field: string;
}

export interface VariableOptionGroup {
  nodeId: string;
  label: string;
  options: VariableOption[];
}

function pushOption(
  options: VariableOption[],
  nodeId: string,
  nodeLabel: string,
  field: string,
  label?: string,
) {
  if (!field) return;
  options.push({
    nodeId,
    nodeLabel,
    field,
    label: label || `${nodeLabel} / ${field}`,
    value: `\${${field}}`,
    displayValue: `{{${field}}}`,
  });
}

function extractNodeOutputs(nodeId: string, nodeLabel: string, nodeType: string, config: Record<string, any>): VariableOption[] {
  const options: VariableOption[] = [];

  if (nodeType.includes('TRIGGER')) {
    const fields = config.inputFields || config.fields;
    if (Array.isArray(fields)) {
      fields.forEach((item: any) => {
        const name = item?.name || item?.field;
        const desc = item?.displayName || item?.description || name;
        if (name) pushOption(options, nodeId, nodeLabel, name, `${nodeLabel} / ${desc || name}`);
      });
    } else {
      ['content', 'history', 'images', 'question'].forEach((name) => pushOption(options, nodeId, nodeLabel, name));
    }
    return options;
  }

  if (nodeType === 'HTTP_CALL') {
    const mapping = config.outputMapping || config.responseMapping;
    if (mapping && typeof mapping === 'object') {
      Object.keys(mapping).forEach((key) => pushOption(options, nodeId, nodeLabel, key, `${nodeLabel} / ${key}`));
    }
    pushOption(options, nodeId, nodeLabel, config.outputVar || 'body', `${nodeLabel} / body`);
    pushOption(options, nodeId, nodeLabel, 'statusCode', `${nodeLabel} / statusCode`);
    return options;
  }

  if (nodeType === 'JDBC_CALL') {
    pushOption(options, nodeId, nodeLabel, config.outputVar || 'sqlResult', `${nodeLabel} / ${config.outputVar || 'sqlResult'}`);
    pushOption(options, nodeId, nodeLabel, 'rows', `${nodeLabel} / rows`);
    return options;
  }

  if (nodeType === 'CHAT_VAR_GET') {
    const vars = Array.isArray(config.variables) ? config.variables : [];
    vars.forEach((item: any) => {
      const name = item?.name || item?.field;
      if (name) pushOption(options, nodeId, nodeLabel, name, `${nodeLabel} / ${name}`);
    });
    return options;
  }

  if (nodeType.startsWith('AI_')) {
    pushOption(options, nodeId, nodeLabel, config.outputVar || 'result', `${nodeLabel} / ${config.outputVar || 'result'}`);
    if (config.promptVar) pushOption(options, nodeId, nodeLabel, config.promptVar, `${nodeLabel} / ${config.promptVar}`);
    return options;
  }

  if (config.outputVar) {
    pushOption(options, nodeId, nodeLabel, config.outputVar, `${nodeLabel} / ${config.outputVar}`);
  }

  pushOption(options, nodeId, nodeLabel, nodeId, `${nodeLabel} / 节点输出`);
  return options;
}

/** 收集当前节点所有上游节点的可引用变量（Jeecg 变量选择器数据源） */
export function collectUpstreamVariables(node: Node | null): VariableOption[] {
  if (!node) return [];
  const graph = node.model?.graph;
  if (!graph) return [];

  const visited = new Set<string>();
  const queue = [node.id];
  const all: VariableOption[] = [];

  while (queue.length) {
    const currentId = queue.shift()!;
    const incoming = graph.getIncomingEdges(currentId) || [];
    for (const edge of incoming) {
      const sourceId = edge.getSourceCellId();
      if (!sourceId || visited.has(sourceId)) continue;
      visited.add(sourceId);
      queue.push(sourceId);

      const sourceNode = graph.getCellById(sourceId);
      if (!sourceNode?.isNode()) continue;

      const data = sourceNode.getData() || {};
      const nodeType = data.nodeType || '';
      const nodeLabel = data.label || getNodeConfig(nodeType)?.label || nodeType;
      const config = data.config || {};
      all.push(...extractNodeOutputs(sourceId, nodeLabel, nodeType, config));
    }
  }

  const dedup = new Map<string, VariableOption>();
  all.forEach((item) => {
    if (!dedup.has(item.value)) dedup.set(item.value, item);
  });
  return Array.from(dedup.values());
}

export function groupVariableOptions(options: VariableOption[]): VariableOptionGroup[] {
  const groups = new Map<string, VariableOptionGroup>();
  options.forEach((opt) => {
    if (!groups.has(opt.nodeId)) {
      groups.set(opt.nodeId, { nodeId: opt.nodeId, label: opt.nodeLabel, options: [] });
    }
    groups.get(opt.nodeId)!.options.push(opt);
  });
  return Array.from(groups.values());
}

export interface InputMappingRow {
  name: string;
  source: string;
}

export function mapToInputRows(mapping?: Record<string, string> | null): InputMappingRow[] {
  if (!mapping || typeof mapping !== 'object') return [{ name: '', source: '' }];
  const rows = Object.entries(mapping).map(([name, source]) => ({
    name,
    source: String(source ?? ''),
  }));
  return rows.length ? rows : [{ name: '', source: '' }];
}

export function inputRowsToMap(rows: InputMappingRow[]): Record<string, string> {
  const result: Record<string, string> = {};
  rows.forEach((row) => {
    const name = row.name?.trim();
    if (!name) return;
    result[name] = row.source?.trim() || '';
  });
  return result;
}
