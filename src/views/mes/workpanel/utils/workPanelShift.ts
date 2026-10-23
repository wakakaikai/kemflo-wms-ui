import type { WorkPanelProductionShiftBreakVO, WorkPanelProductionShiftVO } from '@/api/mes/workpanel/types';

const compareTime = (left?: string, right?: string) => {
  if (!left || !right) return 0;
  return left.localeCompare(right);
};

export const formatShiftWorkSegments = (shift?: WorkPanelProductionShiftVO) => {
  if (!shift?.startTime || !shift?.endTime) return '';
  const breaks = [...(shift.shiftBreaksList || [])]
    .filter((item) => item.breakStart && item.breakEnd)
    .sort((a, b) => compareTime(a.breakStart, b.breakStart));

  if (!breaks.length) {
    return `${shift.startTime}~${shift.endTime}`;
  }

  const segments: string[] = [];
  let cursor = shift.startTime;
  for (const item of breaks) {
    if (compareTime(cursor, item.breakStart!) < 0) {
      segments.push(`${cursor}~${item.breakStart}`);
    }
    cursor = item.breakEnd!;
  }
  if (compareTime(cursor, shift.endTime) < 0) {
    segments.push(`${cursor}~${shift.endTime}`);
  }
  return segments.join(' || ');
};

export const formatShiftDetail = (shift?: WorkPanelProductionShiftVO) => {
  if (!shift) return '-';
  const segments = formatShiftWorkSegments(shift);
  const title = [shift.shiftId, shift.shiftDesc].filter(Boolean).join(' ');
  return segments ? `${title} ${segments}` : title;
};

export const formatShiftLabel = (shift?: WorkPanelProductionShiftVO) => {
  if (!shift) return '';
  return shift.shiftDesc ? `${shift.shiftId} ${shift.shiftDesc}` : shift.shiftId;
};

const parseShiftTime = (value?: string) => {
  if (!value) return null;
  const parts = value.trim().split(':').map((part) => Number(part));
  if (parts.length < 2 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }
  return { hour: parts[0], minute: parts[1], second: parts[2] || 0 };
};

export const isDateTimeWithinShift = (dateTime: string, startTime?: string, endTime?: string) => {
  const start = parseShiftTime(startTime);
  const end = parseShiftTime(endTime);
  if (!start || !end) return true;
  const current = new Date(dateTime.replace(/-/g, '/'));
  if (Number.isNaN(current.getTime())) return true;

  const buildRange = (offsetDay: number) => {
    const rangeStart = new Date(current);
    rangeStart.setDate(rangeStart.getDate() + offsetDay);
    rangeStart.setHours(start.hour, start.minute, start.second, 0);
    const rangeEnd = new Date(current);
    rangeEnd.setDate(rangeEnd.getDate() + offsetDay);
    rangeEnd.setHours(end.hour, end.minute, end.second, 0);
    if (rangeEnd <= rangeStart) {
      rangeEnd.setDate(rangeEnd.getDate() + 1);
    }
    return { rangeStart, rangeEnd };
  };

  return [-1, 0, 1].some((offset) => {
    const { rangeStart, rangeEnd } = buildRange(offset);
    return current >= rangeStart && current <= rangeEnd;
  });
};

export const findProductionShiftByDateTime = (shiftList: WorkPanelProductionShiftVO[], dateTime: string) =>
  shiftList.find((shift) => isDateTimeWithinShift(dateTime, shift.startTime, shift.endTime));

export const parsePanelDateTime = (value?: string) => {
  if (!value) return null;
  const date = new Date(value.replace(/-/g, '/'));
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const createStartDateDisabledFn = (minStartDateTime?: string, maxStartDateTime?: string) => {
  return (date: Date) => {
    const day = startOfDay(date);
    const min = parsePanelDateTime(minStartDateTime);
    const max = parsePanelDateTime(maxStartDateTime);
    const today = startOfDay(new Date());
    // 前端默认不允许选今天之后；若后端有上限则取更早的那天
    const maxDay = max && startOfDay(max) < today ? startOfDay(max) : today;
    if (min && day < startOfDay(min)) {
      return true;
    }
    return day > maxDay;
  };
};

export const isStartDateTimeWithinLimit = (dateTime: string, minStartDateTime?: string, maxStartDateTime?: string) => {
  const current = parsePanelDateTime(dateTime);
  if (!current) {
    return { valid: false, message: '开工时间格式不正确' };
  }
  const min = parsePanelDateTime(minStartDateTime);
  const max = parsePanelDateTime(maxStartDateTime);
  if (min && current < min) {
    return { valid: false, message: `开工时间不能早于SAP会计期间(${minStartDateTime})` };
  }
  if (max && current > max) {
    return { valid: false, message: `开工时间不能晚于${maxStartDateTime}` };
  }
  if (startOfDay(current) > startOfDay(new Date())) {
    return { valid: false, message: '开工时间不能选择今天之后的日期' };
  }
  return { valid: true, message: '' };
};
