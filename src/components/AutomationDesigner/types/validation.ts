import type { Graph } from '@antv/x6';
import type { AutoDesignValidationVo } from '@/api/automation/definition/types';

export type FlowIssueLevel = 'error' | 'warning';

export interface FlowDesignIssue {
  id: string;
  level: FlowIssueLevel;
  title: string;
  description: string;
  nodeId?: string;
  nodeLabel?: string;
  edgeId?: string;
  source?: 'editor' | 'server';
}

export function mapServerValidationIssues(report: AutoDesignValidationVo): FlowDesignIssue[] {
  const convert = (level: FlowIssueLevel, item: AutoDesignValidationVo['errors'][number], index: number): FlowDesignIssue => ({
    id: `server:${level}:${item.code}:${item.nodeId || item.edgeId || index}`,
    level,
    title: item.message,
    description: `服务端规则 ${item.code}`,
    nodeId: item.nodeId,
    edgeId: item.edgeId,
    source: 'server'
  });
  return [
    ...(report.errors || []).map((item, index) => convert('error', item, index)),
    ...(report.warnings || []).map((item, index) => convert('warning', item, index))
  ];
}

function nodeName(data: Record<string, any>, fallback: string) {
  return data.label || data.name || data.nodeType || fallback;
}

/**
 * Runs the fast, editor-side checks used by the issue drawer. The server remains
 * the source of truth for compilation; these checks are intentionally limited to
 * graph problems that can be explained and located in the canvas.
 */
export function collectFlowIssues(graph: Graph): FlowDesignIssue[] {
  const issues: FlowDesignIssue[] = [];
  const nodes = graph.getNodes();
  const edges = graph.getEdges();

  if (nodes.length === 0) {
    return [
      {
        id: 'empty-flow',
        level: 'error',
        title: '流程为空',
        description: '请先添加开始节点、执行节点和结束节点。',
        source: 'editor'
      }
    ];
  }

  const triggers = nodes.filter((node) => String(node.getData()?.nodeType || '').includes('TRIGGER'));
  const ends = nodes.filter((node) => node.getData()?.nodeType === 'END');

  if (triggers.length === 0) {
    issues.push({
      id: 'missing-trigger',
      level: 'error',
      title: '缺少开始节点',
      description: '流程必须包含一个触发节点作为入口。',
      source: 'editor'
    });
  } else if (triggers.length > 1) {
    issues.push({
      id: 'multiple-triggers',
      level: 'error',
      title: '存在多个开始节点',
      description: '独立流程建议只保留一个触发入口，避免运行入口不明确。',
      source: 'editor'
    });
  }

  if (ends.length === 0) {
    issues.push({
      id: 'missing-end',
      level: 'error',
      title: '缺少结束节点',
      description: '请添加结束节点并连接到流程出口。',
      source: 'editor'
    });
  }

  nodes.forEach((node) => {
    const data = node.getData() || {};
    const type = String(data.nodeType || '');
    const label = nodeName(data, node.id);
    const incoming = graph.getIncomingEdges(node) || [];
    const outgoing = graph.getOutgoingEdges(node) || [];

    if (!type.includes('TRIGGER') && incoming.length === 0) {
      issues.push({
        id: `no-input:${node.id}`,
        level: 'error',
        title: `${label} 未连接上游节点`,
        description: '该节点不会被执行，请将它连接到流程入口。',
        nodeId: node.id,
        nodeLabel: label,
        source: 'editor'
      });
    }

    if (type !== 'END' && outgoing.length === 0) {
      issues.push({
        id: `no-output:${node.id}`,
        level: 'error',
        title: `${label} 未连接下一个节点`,
        description: '请继续连接后续节点或连接到结束节点。',
        nodeId: node.id,
        nodeLabel: label,
        source: 'editor'
      });
    }

    if ((type === 'SWITCH' || type === 'CONDITION') && outgoing.length < 2) {
      issues.push({
        id: `branch-count:${node.id}`,
        level: 'error',
        title: `${label} 的分支不足`,
        description: '分支节点至少应连接两个出口。',
        nodeId: node.id,
        nodeLabel: label,
        source: 'editor'
      });
    }
  });

  edges.forEach((edge) => {
    if (!edge.getSourceCellId() || !edge.getTargetCellId()) {
      issues.push({
        id: `dangling-edge:${edge.id}`,
        level: 'error',
        title: '存在未完成的连线',
        description: '请删除悬空连线，或将它连接到有效节点。',
        source: 'editor'
      });
    }
  });

  return issues;
}
