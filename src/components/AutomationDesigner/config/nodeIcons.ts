import { NodeCategory, NodeCategoryLabels } from '../types';

/** 明道云风格分类配色 */
export const CATEGORY_THEME: Record<string, { color: string; label: string }> = {
  [NodeCategory.TRIGGER]: { color: '#ff9a2e', label: NodeCategoryLabels[NodeCategory.TRIGGER] },
  [NodeCategory.DATA]: { color: '#ff9a2e', label: '数据处理' },
  [NodeCategory.INTEGRATION]: { color: '#5b8ff9', label: '集成' },
  [NodeCategory.CONTROL]: { color: '#597ef7', label: '构件' },
  [NodeCategory.DEVICE]: { color: '#36cfc9', label: '设备' },
  [NodeCategory.APPROVAL]: { color: '#9254de', label: '人工' },
};

/** 节点类型 → 圆形图标字符 */
export const NODE_ICON_CHAR: Record<string, string> = {
  MANUAL_TRIGGER: '▶',
  CRON_TRIGGER: '⏱',
  WEBHOOK_TRIGGER: '🔗',
  DATA_TRIGGER: '表',
  MESSAGE_TRIGGER: '✉',
  DEVICE_PROPERTY_TRIGGER: '⚡',
  CONDITION: '◇',
  SWITCH: '⑂',
  LOOP: '↻',
  DELAY: '⏳',
  WAIT: '⏸',
  END: '■',
  DATA_QUERY: '🔍',
  DATA_CREATE: '＋',
  DATA_UPDATE: '✎',
  DATA_DELETE: '🗑',
  DATA_MAPPING: '⇄',
  DATA_FILTER: '⎘',
  HTTP_CALL: '⎔',
  JDBC_CALL: '⛁',
  SAP_CALL: '☁',
  MQTT_CALL: '📡',
  SFTP_CALL: '📁',
  MAIL_CALL: '✉',
  DEVICE_READ: '↓',
  DEVICE_WRITE: '↑',
  DEVICE_BATCH_READ: '☰',
  DEVICE_COMMAND: '⌘',
  DEVICE_WAIT_RESPONSE: '…',
  DEVICE_STATUS: '●',
  APPROVAL_START: '✓',
  APPROVAL_WAIT: '⏳',
  APPROVAL_TERMINATE: '✕',
};

export function getNodeIconChar(type: string, label?: string): string {
  return NODE_ICON_CHAR[type] || (label ? label.charAt(0) : '?');
}

export function getCategoryColor(category: string, fallback = '#5b8ff9'): string {
  return CATEGORY_THEME[category]?.color || fallback;
}
