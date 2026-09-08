// X6 Vue 节点组件注册
import '@antv/x6-vue-shape';
import { register } from '@antv/x6-vue-shape';
import { ALL_NODE_CONFIGS } from '../types';
import BaseNode from './BaseNode.vue';

const COLOR_PORT_GRAY = '#C2C8D5';
const PORT_DOT_RADIUS = 4;

const basePortAttrs = {
  r: PORT_DOT_RADIUS,
  magnet: true,
  stroke: COLOR_PORT_GRAY,
  strokeWidth: 1,
  fill: '#fff',
  style: { visibility: 'hidden' },
};

/** Jeecg 横向流程：左右端口，分支节点支持多出口 */
export const HORIZONTAL_PORTS = {
  groups: {
    left: {
      position: 'left',
      attrs: { circle: { ...basePortAttrs } },
    },
    right: {
      position: 'right',
      attrs: { circle: { ...basePortAttrs } },
    },
    'right-top': {
      position: { name: 'absolute', args: { x: '100%', y: '32%' } },
      attrs: { circle: { ...basePortAttrs } },
    },
    'right-bottom': {
      position: { name: 'absolute', args: { x: '100%', y: '68%' } },
      attrs: { circle: { ...basePortAttrs } },
    },
    'right-case-1': {
      position: { name: 'absolute', args: { x: '100%', y: '28%' } },
      attrs: { circle: { ...basePortAttrs } },
    },
    'right-case-2': {
      position: { name: 'absolute', args: { x: '100%', y: '48%' } },
      attrs: { circle: { ...basePortAttrs } },
    },
    'right-case-3': {
      position: { name: 'absolute', args: { x: '100%', y: '68%' } },
      attrs: { circle: { ...basePortAttrs } },
    },
    'right-default': {
      position: { name: 'absolute', args: { x: '100%', y: '88%' } },
      attrs: { circle: { ...basePortAttrs } },
    },
  },
  items: [
    { id: 'left', group: 'left' },
    { id: 'right', group: 'right' },
  ],
};

/** @deprecated 兼容旧竖向流程端口命名 */
export const VERTICAL_PORTS = HORIZONTAL_PORTS;
export const AGENT_PORTS = HORIZONTAL_PORTS;

export const CARD_WIDTH = 360;
export const CARD_HEIGHT = 132;
export const BRANCH_CARD_WIDTH = 360;
export const BRANCH_CARD_HEIGHT = 108;
export const END_CARD_WIDTH = 360;
export const END_CARD_HEIGHT = 120;

function isBranchType(type: string) {
  return type === 'CONDITION' || type === 'SWITCH';
}

function isTriggerType(type: string) {
  return type.includes('TRIGGER');
}

/** 兼容旧设计 JSON 中的 top/bottom 端口 */
export function normalizePortId(port?: string) {
  if (!port) return 'right';
  if (port === 'bottom' || port === 'right') return 'right';
  if (port === 'top' || port === 'left') return 'left';
  if (port === 'right-case-1') return 'right-if';
  if (port === 'right-default') return 'right-else';
  return port;
}

export function getBranchPorts(branchCount = 2) {
  const count = Math.max(2, branchCount);
  const groups: Record<string, any> = {
    left: HORIZONTAL_PORTS.groups.left,
    right: HORIZONTAL_PORTS.groups.right,
  };
  const items: Array<{ id: string; group: string }> = [{ id: 'left', group: 'left' }];
  for (let i = 0; i < count; i++) {
    const y = Math.round(((i + 1) / (count + 1)) * 100);
    const id = i === count - 1 ? 'right-else' : i === 0 ? 'right-if' : `right-case-${i + 1}`;
    groups[id] = {
      position: { name: 'absolute', args: { x: '100%', y: `${y}%` } },
      attrs: { circle: { ...basePortAttrs } },
    };
    items.push({ id, group: id });
  }
  return { groups, items };
}

export function syncBranchPorts(node: any) {
  const type = node?.getData?.()?.nodeType;
  if (type !== 'SWITCH' && type !== 'CONDITION') return;
  const cfg = node.getData()?.config || {};
  const branches = Array.isArray(cfg.branches) && cfg.branches.length
    ? cfg.branches
    : Array.isArray(cfg.cases) && cfg.cases.length
      ? cfg.cases
      : [{}, {}];
  const count = type === 'CONDITION' ? 2 : Math.max(2, branches.length);
  node.setProp('ports', getBranchPorts(count));
}

export function getNodePorts(type: string): any {
  if (type === 'END') {
    return { groups: HORIZONTAL_PORTS.groups, items: [{ id: 'left', group: 'left' }] };
  }
  if (isTriggerType(type)) {
    return { groups: HORIZONTAL_PORTS.groups, items: [{ id: 'right', group: 'right' }] };
  }
  if (type === 'CONDITION' || type === 'SWITCH') {
    return getBranchPorts(2);
  }
  return HORIZONTAL_PORTS;
}

export function getDefaultSourcePort(type: string) {
  if (isTriggerType(type)) return 'right';
  if (type === 'CONDITION' || type === 'SWITCH') return 'right-if';
  return 'right';
}

export function getDefaultTargetPort(_type?: string) {
  return 'left';
}

export function getNodeComponent(_type: string): any {
  return BaseNode;
}

export function registerVueNodes() {
  ALL_NODE_CONFIGS.forEach((cfg) => {
    const isEnd = cfg.type === 'END';
    const isBranch = isBranchType(cfg.type);
    register({
      shape: cfg.type + '-vue',
      width: isEnd ? END_CARD_WIDTH : isBranch ? BRANCH_CARD_WIDTH : CARD_WIDTH,
      height: isEnd ? END_CARD_HEIGHT : isBranch ? BRANCH_CARD_HEIGHT : CARD_HEIGHT,
      component: BaseNode,
      data: {
        nodeType: cfg.type,
        label: cfg.label,
        color: cfg.color,
        config: { ...(cfg.defaultConfig || {}) },
      },
      ports: getNodePorts(cfg.type),
    });
  });
}
