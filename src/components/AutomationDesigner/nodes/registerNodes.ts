// X6 Vue 节点组件注册
import { Graph } from '@antv/x6';
// 显式导入侧效应模块以确保 vue-shape 基础节点注册不被 Vite tree-shake 移除
// （@antv/x6-vue-shape 的 package.json 未声明 sideEffects，侧效应会被树摇掉）
import '@antv/x6-vue-shape/es/node';
import '@antv/x6-vue-shape/es/view';
import { ALL_NODE_CONFIGS, NodeCategory } from '../types';

// 导入 Vue 节点组件
import BaseNode from './BaseNode.vue';
import TriggerNode from './TriggerNode.vue';
import ControlNode from './ControlNode.vue';
import DataNode from './DataNode.vue';
import IntegrationNode from './IntegrationNode.vue';
import DeviceNode from './DeviceNode.vue';
import ApprovalNode from './ApprovalNode.vue';

// 节点类型到 Vue 组件的映射
const nodeComponentMap: Record<string, any> = {
  // 触发节点 - 使用 TriggerNode
  MANUAL_TRIGGER: TriggerNode,
  CRON_TRIGGER: TriggerNode,
  WEBHOOK_TRIGGER: TriggerNode,
  DATA_TRIGGER: TriggerNode,
  MESSAGE_TRIGGER: TriggerNode,
  DEVICE_PROPERTY_TRIGGER: TriggerNode,
  // 控制节点 - 使用 ControlNode
  CONDITION: ControlNode,
  SWITCH: ControlNode,
  LOOP: ControlNode,
  DELAY: ControlNode,
  WAIT: ControlNode,
  END: ControlNode,
  // 数据节点 - 使用 DataNode
  DATA_QUERY: DataNode,
  DATA_CREATE: DataNode,
  DATA_UPDATE: DataNode,
  DATA_DELETE: DataNode,
  DATA_MAPPING: DataNode,
  DATA_FILTER: DataNode,
  // 集成节点 - 使用 IntegrationNode
  HTTP_CALL: IntegrationNode,
  JDBC_CALL: IntegrationNode,
  SAP_CALL: IntegrationNode,
  MQTT_CALL: IntegrationNode,
  SFTP_CALL: IntegrationNode,
  MAIL_CALL: IntegrationNode,
  // 设备节点 - 使用 DeviceNode
  DEVICE_READ: DeviceNode,
  DEVICE_WRITE: DeviceNode,
  DEVICE_BATCH_READ: DeviceNode,
  DEVICE_COMMAND: DeviceNode,
  DEVICE_WAIT_RESPONSE: DeviceNode,
  DEVICE_STATUS: DeviceNode,
  // 审批节点 - 使用 ApprovalNode
  APPROVAL_START: ApprovalNode,
  APPROVAL_WAIT: ApprovalNode,
  APPROVAL_TERMINATE: ApprovalNode,
};

// 获取节点对应的 Vue 组件
export function getNodeComponent(type: string): any {
  return nodeComponentMap[type] || BaseNode;
}

// 注册所有 Vue 节点到 X6
export function registerVueNodes() {
  ALL_NODE_CONFIGS.forEach((cfg) => {
    const component = getNodeComponent(cfg.type);
    const isDiamond = cfg.shape === 'diamond' || cfg.type === 'CONDITION' || cfg.type === 'SWITCH';

    Graph.registerNode(cfg.type + '-vue', {
      inherit: 'vue-shape',
      width: 140,
      height: 56,
      component,
      data: {
        nodeType: cfg.type,
        label: cfg.label,
        config: { ...(cfg.defaultConfig || {}) },
      },
      ports: {
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
      },
    });
  });
}