// X6 Vue 节点组件注册
import '@antv/x6-vue-shape';
import { register } from '@antv/x6-vue-shape';
import { ALL_NODE_CONFIGS } from '../types';
import BaseNode from './BaseNode.vue';

const COLOR_PORT_GRAY = '#C2C8D5';
const PORT_DOT_RADIUS = 3;

const basePortAttrs = {
  r: PORT_DOT_RADIUS,
  magnet: true,
  stroke: COLOR_PORT_GRAY,
  strokeWidth: 1,
  fill: COLOR_PORT_GRAY,
  style: { visibility: 'hidden' },
};

const createPortGroup = (position: 'top' | 'right' | 'bottom' | 'left') => ({
  position,
  attrs: { circle: { ...basePortAttrs } },
});

export const AGENT_PORTS = {
  groups: {
    top: createPortGroup('top'),
    right: createPortGroup('right'),
    bottom: createPortGroup('bottom'),
    left: createPortGroup('left'),
  },
  items: [
    { id: 'top', group: 'top' },
    { id: 'right', group: 'right' },
    { id: 'bottom', group: 'bottom' },
    { id: 'left', group: 'left' },
  ],
};

export const CARD_WIDTH = 260;
export const CARD_HEIGHT = 96;

/** 统一使用 Agent Card 风格节点 */
export function getNodeComponent(_type: string): any {
  return BaseNode;
}

/**
 * 必须使用 @antv/x6-vue-shape 的 register()，
 * 才会同时写入 shapeMaps；仅 Graph.registerNode 会导致节点可选中但组件不渲染。
 */
export function registerVueNodes() {
  ALL_NODE_CONFIGS.forEach((cfg) => {
    register({
      shape: cfg.type + '-vue',
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      component: BaseNode,
      data: {
        nodeType: cfg.type,
        label: cfg.label,
        color: cfg.color,
        config: { ...(cfg.defaultConfig || {}) },
      },
      ports: AGENT_PORTS,
    });
  });
}
