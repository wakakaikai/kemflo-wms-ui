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

/** 明道云竖向流程：仅上下端口 */
export const VERTICAL_PORTS = {
  groups: {
    top: {
      position: 'top',
      attrs: { circle: { ...basePortAttrs } },
    },
    bottom: {
      position: 'bottom',
      attrs: { circle: { ...basePortAttrs } },
    },
  },
  items: [
    { id: 'top', group: 'top' },
    { id: 'bottom', group: 'bottom' },
  ],
};

/** @deprecated 保留兼容 */
export const AGENT_PORTS = VERTICAL_PORTS;

export const CARD_WIDTH = 300;
export const CARD_HEIGHT = 128;
export const BRANCH_CARD_WIDTH = 220;
export const BRANCH_CARD_HEIGHT = 96;
export const END_CARD_WIDTH = 148;
export const END_CARD_HEIGHT = 44;

function isBranchType(type: string) {
  return type === 'CONDITION' || type === 'SWITCH';
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
      ports: isEnd
        ? { groups: VERTICAL_PORTS.groups, items: [{ id: 'top', group: 'top' }] }
        : VERTICAL_PORTS,
    });
  });
}
