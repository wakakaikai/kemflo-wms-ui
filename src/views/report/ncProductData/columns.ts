import type { NcReportDimension, NcReportRow } from '@/api/report/ncProductData/types';

export const orderDimensions: NcReportDimension[] = ['NC_ORDER', 'STARTED_ORDER', 'ALL_ORDER'];
export const tabs: { name: NcReportDimension; label: string }[] = [
  { name: 'NC_ORDER', label: '仅显示不良工单' },
  { name: 'STARTED_ORDER', label: '生产工单不良情况' },
  { name: 'ALL_ORDER', label: '全部工单不良情况' },
  { name: 'ITEM', label: '按物料汇总' },
  { name: 'OPERATION', label: '按工序汇总' },
  { name: 'NC_CODE', label: '按不合格代码汇总' },
  { name: 'DETAIL', label: '不合格明细' }
];
export const orderStatuses: Record<string, string> = { NEW: '新建', RELEASABLE: '可下达', RELEASED: '已下达', ACTIVE: '在制中', DONE: '已完成', CLOSED: '已关闭', HOLD: '已保留', SCRAP: '已报废' };
export const orderTypes: Record<string, string> = { PRODUCTION: '生产工单', 'PRODUCTION-ZZ': '生产-组装', 'PRODUCTION-YZ': '生产-预装', REWORK: '返工工单', REPETITIVE: '重复工单', 'TEST-ORDER': '测试订单', 'REWORK-CJ': '返工-拆解' };
export const ncStates: Record<string, string> = { O: '未关闭', C: '已关闭', P: 'P' };
export interface ReportColumn {
  prop: keyof NcReportRow;
  label: string;
  width: number;
  numeric?: boolean;
  link?: boolean;
}
const col = (prop: keyof NcReportRow, label: string, width = 140, numeric = false, link = false): ReportColumn => ({ prop, label, width, numeric, link });
export const detailColumns = [col('shopOrder', '工单', 165), col('sfc', '产品条码', 215), col('item', '物料', 160), col('itemDescription', '物料描述', 220), col('qty', '数量', 95, true), col('defectCount', '缺陷数量', 110, true), col('operation', '工序', 140), col('dateTime', '不合格记录时间', 175), col('ncCode', '不合格代码', 150), col('ncCodeDescription', '不合格代码描述', 200), col('ncGroup', '不合格组', 180), col('ncState', '状态', 95), col('workCenter', '工作中心', 150), col('resource', '资源', 150), col('creator', '作业人员', 120), col('remark', '备注', 240)];
const orderColumns = [col('shopOrder', '工单', 170, false, true), col('shopOrderType', '类型', 120), col('status', '状态', 95), col('item', '计划物料', 170), col('itemRevision', '物料版本', 95), col('itemDescription', '计划物料描述', 220), col('plannedBom', '计划物料清单', 170), col('plannedRouter', '计划工艺路线', 170), col('workCenter', '计划工作中心', 140), col('plannedStartDate', '计划开始时间', 175), col('plannedCompDate', '计划完成时间', 175), col('actualStartDate', '实际开始时间', 175), col('actualCompDate', '实际完成时间', 175), col('qtyToBuild', '计划数量', 110, true), col('qtyReleased', '已下达数量', 120, true), col('ncQty', '不良数量', 110, true), col('qtyScrapped', '报废数量', 110, true), col('qtyDone', '完工数量', 110, true), col('recordCount', '不合格记录数', 135, true), col('defectCount', '缺陷数量', 110, true), col('creator', '创建人', 120), col('createTime', '创建时间', 175), col('updater', '修改人', 120), col('modifyTime', '修改时间', 175)];
export function getColumns(dimension: NcReportDimension): ReportColumn[] {
  if (orderDimensions.includes(dimension)) return orderColumns;
  if (dimension === 'DETAIL') return detailColumns;
  return [col('groupName', dimension === 'ITEM' ? '物料' : dimension === 'OPERATION' ? '工序' : '不合格代码', 180, false, true), col('groupDescription', '描述', 240), ...(dimension === 'ITEM' ? [col('itemRevision', '物料版本', 100)] : []), col('orderCount', '工单数', 110, true), col('sfcCount', '不合格对象数', 135, true), col('ncQty', '不良数量', 110, true), col('recordCount', '不合格记录数', 135, true), col('defectCount', '缺陷数量', 110, true), col('firstNcTime', '首次不合格时间', 175), col('lastNcTime', '最近不合格时间', 175)];
}
export function formatCell(row: NcReportRow, prop: keyof NcReportRow): string | number {
  const value = row[prop];
  if (value === undefined || value === null || value === '') return '-';
  if (prop === 'status') return orderStatuses[String(value)] ?? value;
  if (prop === 'shopOrderType') return orderTypes[String(value)] ?? value;
  if (prop === 'ncState') return ncStates[String(value)] ?? value;
  return typeof value === 'string' ? value.replace(/^(\d{4}-\d{2}-\d{2})T/, '$1 ') : value;
}
