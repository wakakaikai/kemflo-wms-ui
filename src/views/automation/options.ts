/** 自动化模块前端展示选项（字典未配置时兜底，保证列表能显示标签） */

export interface AutoDictOption {
  label: string;
  value: string;
  elTagType?: string;
}

export const AUTO_TRIGGER_TYPE_OPTIONS: AutoDictOption[] = [
  { label: '手工触发', value: 'MANUAL_TRIGGER', elTagType: 'primary' },
  { label: '定时触发', value: 'CRON_TRIGGER', elTagType: 'success' },
  { label: 'Webhook触发', value: 'WEBHOOK_TRIGGER', elTagType: 'warning' },
  { label: '数据触发', value: 'DATA_TRIGGER', elTagType: 'info' },
  { label: '消息触发', value: 'MESSAGE_TRIGGER', elTagType: '' },
  { label: '设备触发', value: 'DEVICE_PROPERTY_TRIGGER', elTagType: 'danger' }
];

export const AUTO_DEFINITION_STATUS_OPTIONS: AutoDictOption[] = [
  { label: '草稿', value: 'DRAFT', elTagType: 'info' },
  { label: '已发布', value: 'PUBLISHED', elTagType: 'success' },
  { label: '已停用', value: 'DISABLED', elTagType: 'warning' },
  { label: '已归档', value: 'ARCHIVED', elTagType: 'danger' }
];

export const AUTO_PUBLISH_STATUS_OPTIONS: AutoDictOption[] = [
  { label: '草稿', value: 'DRAFT', elTagType: 'info' },
  { label: '已发布', value: 'PUBLISHED', elTagType: 'success' }
];

export const AUTO_INSTANCE_STATUS_OPTIONS: AutoDictOption[] = [
  { label: '已创建', value: 'CREATED', elTagType: 'info' },
  { label: '运行中', value: 'RUNNING', elTagType: 'primary' },
  { label: '等待中', value: 'WAITING', elTagType: 'warning' },
  { label: '成功', value: 'SUCCESS', elTagType: 'success' },
  { label: '失败', value: 'FAILED', elTagType: 'danger' },
  { label: '已取消', value: 'CANCELLED', elTagType: 'info' },
  { label: '已终止', value: 'TERMINATED', elTagType: 'danger' }
];

export const AUTO_TASK_STATUS_OPTIONS: AutoDictOption[] = [
  { label: '待执行', value: 'PENDING', elTagType: 'info' },
  { label: '运行中', value: 'RUNNING', elTagType: 'primary' },
  { label: '成功', value: 'SUCCESS', elTagType: 'success' },
  { label: '失败', value: 'FAILED', elTagType: 'danger' },
  { label: '已取消', value: 'CANCELLED', elTagType: 'info' }
];

export const AUTO_NODE_STATUS_OPTIONS: AutoDictOption[] = [
  { label: '待执行', value: 'PENDING', elTagType: 'info' },
  { label: '运行中', value: 'RUNNING', elTagType: 'primary' },
  { label: '等待中', value: 'WAITING', elTagType: 'warning' },
  { label: '成功', value: 'SUCCESS', elTagType: 'success' },
  { label: '失败', value: 'FAILED', elTagType: 'danger' },
  { label: '已跳过', value: 'SKIPPED', elTagType: 'info' },
  { label: '已取消', value: 'CANCELLED', elTagType: 'info' }
];

export const AUTO_WAIT_STATUS_OPTIONS: AutoDictOption[] = [
  { label: '等待中', value: 'WAITING', elTagType: 'warning' },
  { label: '已恢复', value: 'RESUMED', elTagType: 'success' },
  { label: '已超时', value: 'TIMEOUT', elTagType: 'danger' },
  { label: '已取消', value: 'CANCELLED', elTagType: 'info' }
];

export const AUTO_OUTBOX_STATUS_OPTIONS: AutoDictOption[] = [
  { label: '待消费', value: 'PENDING', elTagType: 'info' },
  { label: '消费中', value: 'CONSUMING', elTagType: 'primary' },
  { label: '已消费', value: 'CONSUMED', elTagType: 'success' },
  { label: '失败', value: 'FAILED', elTagType: 'danger' }
];

/** 优先使用系统字典，未配置时回退本地选项 */
export function resolveDictOptions(dictOptions: any, fallback: AutoDictOption[]): AutoDictOption[] {
  return Array.isArray(dictOptions) && dictOptions.length > 0 ? dictOptions : fallback;
}
