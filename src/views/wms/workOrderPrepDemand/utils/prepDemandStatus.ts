import type { PrepDemandStatus } from '@/api/wms/workOrderPrepDemand/types';

/** 备料需求状态列表（创建默认 CONFIRMED） */
export const PREP_DEMAND_STATUS: PrepDemandStatus[] = ['CONFIRMED', 'EXECUTING', 'COMPLETED', 'CANCELLED'];
export const DEFAULT_PREP_DEMAND_STATUS: PrepDemandStatus = 'CONFIRMED';

const DEMAND_STATUS_LABEL: Record<PrepDemandStatus, string> = {
  CONFIRMED: '已确认',
  EXECUTING: '执行中',
  COMPLETED: '已完成',
  CANCELLED: '已取消'
};

const DEMAND_STATUS_TAG: Record<PrepDemandStatus, 'info' | 'success' | 'warning' | 'primary' | 'danger'> = {
  CONFIRMED: 'success',
  EXECUTING: 'warning',
  COMPLETED: 'primary',
  CANCELLED: 'danger'
};

export const DEMAND_STATUS_OPTIONS = PREP_DEMAND_STATUS.map((value) => ({
  value,
  label: DEMAND_STATUS_LABEL[value]
}));

export function demandStatusLabel(status?: string) {
  return DEMAND_STATUS_LABEL[status as PrepDemandStatus] || status || '-';
}

export function demandStatusTag(status?: string): 'info' | 'success' | 'warning' | 'primary' | 'danger' {
  return DEMAND_STATUS_TAG[status as PrepDemandStatus] || 'info';
}

export function formatKitRate(rate?: number) {
  const n = Number(rate ?? 0);
  return (n > 1 ? n : n * 100).toFixed(1);
}

/** 齐套率 0~100（兼容 0~1 小数） */
export function kitRatePercentValue(rate?: number) {
  const n = Number(rate ?? 0);
  return Math.min(100, Math.max(0, n > 1 ? n : n * 100));
}

export function kitRateColor(rate?: number) {
  const percent = kitRatePercentValue(rate);
  if (percent >= 100) return '#67c23a';
  if (percent >= 80) return '#409eff';
  if (percent >= 50) return '#e6a23c';
  return '#f56c6c';
}

export type { PrepDemandStatus };
