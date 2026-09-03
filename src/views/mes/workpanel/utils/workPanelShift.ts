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
