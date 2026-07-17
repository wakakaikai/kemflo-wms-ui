import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import type { PrepDemand261Route, PrepDemandDisplayRow } from '@/api/wms/workOrderPrepDemand/types';
import { resolveOverPickReasonLabel, resolvePrepRowLocationAdjustRemark } from '@/api/wms/workOrderPrepDemand/index';
import type { IssueTaskDemandGroup, IssueTaskDemandGroupVO, IssueTaskGroupLayoutMode, IssueTaskLineLayoutMode, IssueTaskLineVO, IssueTaskQuery, IssueTaskViewMode, IssueTaskWarehouseCache, PrepLocationRecIssueOutBatchBo, PrepLocationRecIssueOutBo } from './types';

type IssueTaskLineListResponse = {
  rows?: IssueTaskLineVO[];
  data?: IssueTaskLineVO[] | { rows?: IssueTaskLineVO[]; total?: number };
  total?: number;
};

const EMPTY_TOKEN = '-';

/** 分页查询发料任务聚合（按需求单汇总） */
export function listIssueTaskGroup(query?: IssueTaskQuery): AxiosPromise<IssueTaskDemandGroupVO[]> {
  return request({
    url: '/wms/materialIssueWorkbench/prepLocationRec/demandSummary/list',
    method: 'get',
    params: query
  });
}

/** 查询指定需求单的备料库位明细 */
export function listIssueTaskDemandDetail(demandNo: string, query?: IssueTaskQuery): AxiosPromise<IssueTaskLineVO[]> {
  return request({
    url: `/wms/materialIssueWorkbench/prepLocationRec/demand/${encodeURIComponent(demandNo)}/detail`,
    method: 'get',
    params: query
  });
}

/** 分页查询发料任务明细（库位行，明细视图） */
export function listIssueTaskDetail(query?: IssueTaskQuery): AxiosPromise<IssueTaskLineVO[]> {
  return request({
    url: '/wms/materialIssueWorkbench/prepLocationRec/list',
    method: 'get',
    params: query
  });
}

/** 获取发料任务行详情 */
export function getIssueTaskLine(id: number | string) {
  return request<IssueTaskLineVO>({
    url: `/wms/issueTask/${id}`,
    method: 'get'
  });
}

/** 备料库位明细 261 领料出库（PP06） */
export { isOverPickPrepDemand } from '@/api/wms/workOrderPrepDemand/index';

export function prepLocationRecIssueOut(data: PrepLocationRecIssueOutBatchBo) {
  return request({
    url: '/wms/materialIssueWorkbench/prepLocationRec/issueOut',
    method: 'post',
    data: {
      ...data,
      issueMode: data.issueMode ?? 'DIRECT_DEDUCT'
    }
  });
}

/** 备料库位明细实发扣料+超量移转（自动拆分261/311）；成功时凭证号在响应 msg 中 */
export function prepLocationRecActualDeductTransIssueOut(data: PrepLocationRecIssueOutBatchBo) {
  return request<void>({
    url: '/wms/materialIssueWorkbench/prepLocationRec/issueOut/actualDeductTrans',
    method: 'post',
    data: {
      ...data,
      issueMode: data.issueMode ?? 'ACTUAL_DEDUCT_TRANS'
    }
  });
}

export const WAREHOUSE_ROUTE_OPTIONS = [
  { value: 'AUTO', label: '自动仓' },
  { value: 'LINE', label: '线边仓' },
  { value: 'FLAT', label: '平面仓' },
  { value: 'SHORTAGE', label: '缺料' }
] as const;

const WAREHOUSE_ROUTE_LABEL: Record<string, string> = Object.fromEntries(WAREHOUSE_ROUTE_OPTIONS.map((item) => [item.value, item.label]));

const WAREHOUSE_ROUTE_TAG: Record<string, 'success' | 'warning' | 'primary' | 'danger' | 'info'> = {
  AUTO: 'success',
  LINE: 'warning',
  FLAT: 'primary',
  SHORTAGE: 'danger'
};

const LINE_STATUS_LABEL: Record<string, string> = {
  WAIT_PICK: '待拣货',
  PICKING: '拣货中',
  SHORTAGE: '缺料中',
  PICKED: '已拣货',
  COMPLETE: '已完成',
  CANCELLED: '已取消',
  // 兼容旧状态码
  PICK_COMPLETE: '已拣货',
  HANDOVER_COMPLETE: '已完成'
};

const LINE_STATUS_TAG: Record<string, 'info' | 'success' | 'warning' | 'primary' | 'danger'> = {
  WAIT_PICK: 'info',
  PICKING: 'warning',
  SHORTAGE: 'danger',
  PICKED: 'success',
  COMPLETE: 'success',
  CANCELLED: 'danger',
  PICK_COMPLETE: 'success',
  HANDOVER_COMPLETE: 'success'
};

const LINE_STATUS_BADGE_COLOR: Record<string, string> = {
  WAIT_PICK: '#909399',
  PICKING: '#e6a23c',
  SHORTAGE: '#f56c6c',
  PICKED: '#67c23a',
  COMPLETE: '#67c23a',
  CANCELLED: '#f56c6c',
  PICK_COMPLETE: '#67c23a',
  HANDOVER_COMPLETE: '#67c23a'
};

export const ALL_TAB_BADGE_COLOR = '#67c23a';

export const ISSUE_TASK_LINE_STATUSES = ['WAIT_PICK', 'PICKING', 'SHORTAGE', 'PICKED', 'COMPLETE', 'CANCELLED'] as const;

/** 发料任务列表状态 Tab（仅待拣货、已完成） */
export const ISSUE_TASK_STATUS_TAB_OPTIONS = [
  { value: 'WAIT_PICK', label: '待拣货' },
  { value: 'COMPLETE', label: '已完成' }
] as const;

export function warehouseRouteLabel(route?: string) {
  return WAREHOUSE_ROUTE_LABEL[String(route || '').toUpperCase()] || route || '-';
}

export function warehouseRouteTag(route?: string): 'success' | 'warning' | 'primary' | 'danger' | 'info' {
  return WAREHOUSE_ROUTE_TAG[String(route || '').toUpperCase()] || 'info';
}

export function lineStatusLabel(status?: string) {
  const key = String(status || '').toUpperCase();
  return LINE_STATUS_LABEL[key] || status || '-';
}

export function lineStatusTag(status?: string): 'info' | 'success' | 'warning' | 'primary' | 'danger' {
  const key = String(status || '').toUpperCase();
  return LINE_STATUS_TAG[key] || 'info';
}

export function lineStatusBadgeColor(status?: string) {
  const key = String(status || '').toUpperCase();
  return LINE_STATUS_BADGE_COLOR[key] || '#909399';
}

export const ISSUE_TASK_ISSUEABLE_STATUSES = ['WAIT_PICK', 'PICKING'] as const;

/** 是否可显示/执行 261 领料与 311 移转（仅待拣货、拣货中） */
export function isIssueTaskLineIssueable(lineStatus?: string) {
  const status = String(lineStatus || 'WAIT_PICK').toUpperCase();
  return (ISSUE_TASK_ISSUEABLE_STATUSES as readonly string[]).includes(status);
}

export function canIssueTaskLine261(row: { lineStatus?: string }) {
  return isIssueTaskLineIssueable(row.lineStatus);
}

/** 发料行是否已完成（操作栏展示备注） */
export function isIssueTaskLineCompleted(lineStatus?: string) {
  const status = String(lineStatus || '').toUpperCase();
  return status === 'COMPLETE' || status === 'PICKED';
}

export function resolveIssueTaskLineRemark(row: Pick<IssueTaskLineVO, 'remark'>): string {
  return String(row.remark ?? '').trim();
}

export function canExecuteIssueTaskLine261(row: { lineStatus?: string; locationCode?: string; demandId?: number | string }) {
  const locationCode = String(row.locationCode || '').trim();
  return canIssueTaskLine261(row) && !!locationCode && locationCode !== '-' && row.demandId != null && row.demandId !== '';
}

/** 是否可编辑实发数量（仅待拣货、拣货中且待发数量有效） */
export function canEditIssueTaskLineActualIssue(row: Pick<IssueTaskLineVO, 'lineStatus' | 'issueQty'>): boolean {
  if (!canIssueTaskLine261(row)) return false;
  return !!normalizeQty(row.issueQty);
}

export function syncIssueTaskLineActualIssueDefault(row: IssueTaskLineVO) {
  if (!canEditIssueTaskLineActualIssue(row)) return;
  const pendingQty = normalizeQty(row.issueQty);
  if (!pendingQty) return;
  const current = row.actualIssueQty;
  if (current == null || current === '' || Number(current) <= 0) {
    row.actualIssueQty = pendingQty;
  }
}

export function syncIssueTaskLineActualIssueDefaults(rows: IssueTaskLineVO[]) {
  rows.forEach(syncIssueTaskLineActualIssueDefault);
}

export function formatIssueTaskQtyWithUnit(qty: number | string, unit?: string): string {
  const unitText = normalizeField(unit);
  return unitText ? `${qty} ${unitText}` : String(qty);
}

export function formatIssueTaskLineActualIssueDisplay(row: Pick<IssueTaskLineVO, 'actualIssueQty' | 'issueQty' | 'inventoryUnit' | 'unit'>): string {
  const pendingQty = normalizeQty(row.issueQty);
  const qty = resolveLineActualIssueQty(row);
  if (!pendingQty && qty <= 0) return '-';
  const unit = normalizeField(row.inventoryUnit) || normalizeField(row.unit) || '';
  return formatIssueTaskQtyWithUnit(qty, unit);
}

/** 解析发料任务行已发数量（261 累计；兼容已完成但 issued_qty 未回写的历史数据） */
export function resolveLineIssuedQty(row: Pick<IssueTaskLineVO, 'issuedQty' | 'actualIssueQty' | 'lineStatus'>): number {
  if (row.issuedQty != null && row.issuedQty !== '') {
    const issued = Number(row.issuedQty);
    if (Number.isFinite(issued) && issued >= 0) {
      return issued;
    }
  }
  const status = String(row.lineStatus || '').toUpperCase();
  if (status === 'COMPLETE' || status === 'HANDOVER_COMPLETE') {
    const actual = row.actualIssueQty;
    if (actual != null && actual !== '') {
      const actualNum = Number(actual);
      if (Number.isFinite(actualNum) && actualNum > 0) {
        return actualNum;
      }
    }
  }
  return 0;
}

export function formatIssueTaskLineIssuedDisplay(row: Pick<IssueTaskLineVO, 'issuedQty' | 'actualIssueQty' | 'lineStatus' | 'inventoryUnit' | 'unit'>): string {
  const qty = resolveLineIssuedQty(row);
  const unit = normalizeField(row.inventoryUnit) || normalizeField(row.unit) || '';
  return formatIssueTaskQtyWithUnit(qty, unit);
}

/** 解析发料任务行有效实发数量（未填或 ≤0 时回退待发） */
export function resolveLineActualIssueQty(row: Pick<IssueTaskLineVO, 'actualIssueQty' | 'issueQty'>): number {
  const pendingQty = normalizeQty(row.issueQty);
  if (row.actualIssueQty == null || row.actualIssueQty === '') {
    return pendingQty ?? 0;
  }
  const num = Number(row.actualIssueQty);
  if (!Number.isFinite(num) || num <= 0) {
    return pendingQty ?? 0;
  }
  return num;
}

/** 实发是否超过待发数量 */
export function isIssueQtyExceedingPending(row: Pick<IssueTaskLineVO, 'actualIssueQty' | 'issueQty'>): boolean {
  const pendingQty = normalizeQty(row.issueQty);
  if (!pendingQty) return false;
  return resolveLineActualIssueQty(row) > pendingQty;
}

/** 是否需要同时执行 311 移转（实发超待发且存在目标库位） */
export function hasIssueTaskLine311Transfer(row: Pick<IssueTaskLineVO, 'actualIssueQty' | 'issueQty' | 'targetDemandLocationCode'>): boolean {
  if (!isIssueQtyExceedingPending(row)) return false;
  return !!normalizeField(row.targetDemandLocationCode);
}

/** 发料任务行操作按钮文案 */
export function getIssueTaskLineActionLabel(row: Pick<IssueTaskLineVO, 'actualIssueQty' | 'issueQty' | 'targetDemandLocationCode'>): string {
  return hasIssueTaskLine311Transfer(row) ? '261领料+311移转' : '261领料';
}

/** 发料任务行领料确认表格行 */
export interface IssueTaskLineIssueConfirmRow {
  action: string;
  locationCode: string;
  materialCode: string;
  qtyText: string;
  targetLocationCode?: string;
}

/** 发料任务行领料确认弹窗视图 */
export interface IssueTaskLineIssueConfirmView {
  title: string;
  rows: IssueTaskLineIssueConfirmRow[];
}

function formatIssueConfirmQtyText(qty: number | string, unit: string) {
  return unit ? `${qty} ${unit}` : String(qty);
}

/** 构建发料任务行领料确认弹窗视图 */
export function buildIssueTaskLineIssueConfirmView(row: Pick<IssueTaskLineVO, 'locationCode' | 'materialCode' | 'inventoryUnit'>, issueBo: PrepLocationRecIssueOutBo): IssueTaskLineIssueConfirmView {
  const locationCode = normalizeField(row.locationCode) || '-';
  const materialCode = normalizeField(row.materialCode) || '-';
  const unit = normalizeField(issueBo.issueUnit) || normalizeField(row.inventoryUnit) || '';
  const issueQtyText = formatIssueConfirmQtyText(issueBo.issueQuantity ?? '-', unit);
  const transferQty = normalizeQty(issueBo.transferQuantity);
  const targetLocation = normalizeField(issueBo.targetLocationCode);

  if (transferQty && targetLocation) {
    return {
      title: '确认 261领料+311移转',
      rows: [
        { action: '261领料', locationCode, materialCode, qtyText: issueQtyText },
        {
          action: '311移转',
          locationCode,
          materialCode,
          qtyText: formatIssueConfirmQtyText(transferQty, unit),
          targetLocationCode: targetLocation
        }
      ]
    };
  }

  return {
    title: '确认 261 领料',
    rows: [{ action: '261领料', locationCode, materialCode, qtyText: issueQtyText }]
  };
}

export function normalizeIssueTaskGroup(row: IssueTaskDemandGroupVO): IssueTaskDemandGroup {
  const key = row.demandId != null && row.demandId !== '' ? `id:${row.demandId}` : row.demandNo ? `no:${row.demandNo}` : `group:${Date.now()}`;
  return {
    ...row,
    key,
    lineCount: Number(row.lineCount) || 0,
    workOrderCount: Number(row.workOrderCount) || 0,
    pendingPickCount: Number(row.pendingPickCount) || 0
  };
}

export function normalizeIssueTaskLine(row: IssueTaskLineVO): IssueTaskLineVO {
  const raw = row as IssueTaskLineVO & {
    issued_qty?: number | string;
    actual_issue_qty?: number | string;
    issue_qty?: number | string;
    inventory_unit?: string;
    line_status?: string;
  };
  const lineStatus = String(row.lineStatus ?? raw.line_status ?? '').toUpperCase();
  const rawIssued = row.issuedQty ?? raw.issued_qty;
  const issuedQty = lineStatus === 'WAIT_PICK' ? 0 : rawIssued;
  return {
    ...row,
    issueQty: row.issueQty ?? raw.issue_qty,
    actualIssueQty: row.actualIssueQty ?? raw.actual_issue_qty,
    issuedQty,
    inventoryUnit: row.inventoryUnit ?? raw.inventory_unit
  };
}

/** 兼容分页 rows/total 与非分页 data 数组两种返回结构 */
export function normalizeIssueTaskLineListResponse(res?: IssueTaskLineListResponse | IssueTaskLineVO[]) {
  if (!res) return { rows: [] as IssueTaskLineVO[], total: 0 };
  if (Array.isArray(res)) {
    const rows = res.map((row) => normalizeIssueTaskLine(row));
    return { rows, total: rows.length };
  }

  if (Array.isArray(res.data)) {
    const rows = res.data.map((row) => normalizeIssueTaskLine(row));
    return { rows, total: rows.length };
  }

  if (res.data && Array.isArray(res.data.rows)) {
    const rows = res.data.rows.map((row) => normalizeIssueTaskLine(row));
    return { rows, total: Number(res.data.total) || rows.length };
  }

  const rows = (res.rows || []).map((row) => normalizeIssueTaskLine(row));
  return { rows, total: Number(res.total) || rows.length };
}

const ISSUE_TASK_VIEW_MODE_STORAGE_KEY = 'issueTaskViewMode';

export function saveIssueTaskViewMode(routePath: string, mode: IssueTaskViewMode) {
  const preObj = JSON.parse(localStorage.getItem(ISSUE_TASK_VIEW_MODE_STORAGE_KEY) || '{}');
  localStorage.setItem(
    ISSUE_TASK_VIEW_MODE_STORAGE_KEY,
    JSON.stringify({
      ...preObj,
      [routePath]: mode
    })
  );
}

export function getIssueTaskViewMode(routePath: string): IssueTaskViewMode {
  const raw = localStorage.getItem(ISSUE_TASK_VIEW_MODE_STORAGE_KEY);
  if (!raw) return 'group';
  const mode = JSON.parse(raw)[routePath];
  return mode === 'detail' ? 'detail' : 'group';
}

const ISSUE_TASK_LINE_LAYOUT_STORAGE_KEY = 'issueTaskLineLayout';

export function saveIssueTaskLineLayout(routePath: string, mode: IssueTaskLineLayoutMode) {
  const preObj = JSON.parse(localStorage.getItem(ISSUE_TASK_LINE_LAYOUT_STORAGE_KEY) || '{}');
  localStorage.setItem(
    ISSUE_TASK_LINE_LAYOUT_STORAGE_KEY,
    JSON.stringify({
      ...preObj,
      [routePath]: mode
    })
  );
}

export function getIssueTaskLineLayout(routePath: string): IssueTaskLineLayoutMode {
  const raw = localStorage.getItem(ISSUE_TASK_LINE_LAYOUT_STORAGE_KEY);
  if (!raw) return 'card';
  const mode = JSON.parse(raw)[routePath];
  return mode === 'table' ? 'table' : 'card';
}

const ISSUE_TASK_GROUP_LAYOUT_STORAGE_KEY = 'issueTaskGroupLayout';

export function saveIssueTaskGroupLayout(routePath: string, mode: IssueTaskGroupLayoutMode) {
  const preObj = JSON.parse(localStorage.getItem(ISSUE_TASK_GROUP_LAYOUT_STORAGE_KEY) || '{}');
  localStorage.setItem(
    ISSUE_TASK_GROUP_LAYOUT_STORAGE_KEY,
    JSON.stringify({
      ...preObj,
      [routePath]: mode
    })
  );
}

export function getIssueTaskGroupLayout(routePath: string): IssueTaskGroupLayoutMode {
  const raw = localStorage.getItem(ISSUE_TASK_GROUP_LAYOUT_STORAGE_KEY);
  if (!raw) return 'card';
  const mode = JSON.parse(raw)[routePath];
  return mode === 'table' ? 'table' : 'card';
}

const ISSUE_TASK_WAREHOUSE_STORAGE_KEY = 'issueTaskWarehouse';

/** 发料任务列表页路由（仓别筛选缓存 key） */
export const ISSUE_TASK_LIST_ROUTE_PATH = '/wms/issueTask';

export function formatIssueTaskWarehouseLabel(code?: string, name?: string): string {
  const warehouseCode = normalizeField(code);
  if (!warehouseCode) return '-';
  const warehouseName = normalizeField(name);
  return warehouseName && warehouseName !== warehouseCode ? `${warehouseCode} (${warehouseName})` : warehouseCode;
}

export function resolveIssueTaskCurrentWarehouseLabel(warehouseCode?: string, warehouseName?: string, listRoutePath = ISSUE_TASK_LIST_ROUTE_PATH): string {
  const code = normalizeField(warehouseCode);
  if (!code) return '-';
  let name = normalizeField(warehouseName);
  if (!name) {
    const cached = getIssueTaskWarehouse(listRoutePath);
    if (normalizeField(cached?.warehouseCode) === code) {
      name = normalizeField(cached?.warehouseName);
    }
  }
  if (!name) {
    const raw = localStorage.getItem(ISSUE_TASK_WAREHOUSE_STORAGE_KEY);
    if (raw) {
      const obj = JSON.parse(raw) as Record<string, IssueTaskWarehouseCache | null>;
      for (const item of Object.values(obj)) {
        if (normalizeField(item?.warehouseCode) === code) {
          name = normalizeField(item?.warehouseName);
          if (name) break;
        }
      }
    }
  }
  return formatIssueTaskWarehouseLabel(code, name);
}

export function resolveIssueTaskTargetWarehouseCode(rows: Array<Pick<IssueTaskLineVO, 'targetDemandWarehouseCode'>>): string | undefined {
  for (const row of rows) {
    const code = normalizeField(row.targetDemandWarehouseCode);
    if (code) return code;
  }
  return undefined;
}

export function saveIssueTaskWarehouse(routePath: string, warehouse: IssueTaskWarehouseCache | null) {
  const preObj = JSON.parse(localStorage.getItem(ISSUE_TASK_WAREHOUSE_STORAGE_KEY) || '{}');
  const currentObj = {
    ...preObj,
    [routePath]: warehouse
  };
  localStorage.setItem(ISSUE_TASK_WAREHOUSE_STORAGE_KEY, JSON.stringify(currentObj));
}

export function getIssueTaskWarehouse(routePath: string): IssueTaskWarehouseCache | null {
  const raw = localStorage.getItem(ISSUE_TASK_WAREHOUSE_STORAGE_KEY);
  if (!raw) return null;
  const obj = JSON.parse(raw) as Record<string, IssueTaskWarehouseCache | null>;
  return obj[routePath] ?? null;
}

export function removeIssueTaskWarehouse(routePath: string) {
  saveIssueTaskWarehouse(routePath, null);
}

function normalizeField(value?: string | null) {
  const text = String(value ?? '').trim();
  return text && text !== EMPTY_TOKEN ? text : undefined;
}

function normalizeQty(value?: number | string | null) {
  if (value == null || value === '') return undefined;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : undefined;
}

/** 备料计划自动仓/线边仓库位行（含已完成 261，用于展示） */
export function isPrepWarehouse261DisplayRow(row: Pick<PrepDemandDisplayRow, 'lineType' | 'warehouseRoute' | 'locationCode'>, route?: 'AUTO' | 'LINE') {
  if (row.lineType !== 'LOCATION') return false;
  if (row.warehouseRoute !== 'AUTO' && row.warehouseRoute !== 'LINE') return false;
  if (route && row.warehouseRoute !== route) return false;
  const loc = normalizeField(row.locationCode);
  return !!loc && loc !== '-';
}

/** 是否可执行 261 领料的库位行 */
export function isIssuablePrepLocationRecRow(row: Pick<PrepDemandDisplayRow, 'lineType' | 'warehouseRoute' | 'locationCode' | 'lineStatus'>) {
  if (row.lineType !== 'LOCATION') return false;
  if (row.warehouseRoute !== 'AUTO' && row.warehouseRoute !== 'LINE') return false;
  if (!normalizeField(row.locationCode)) return false;
  return isIssueTaskLineIssueable(row.lineStatus);
}

function resolveIssueUnit(row: Pick<PrepDemandDisplayRow, 'inventoryUnit'>): string | undefined {
  return normalizeField(row.inventoryUnit);
}

export function buildPrepLocationRecIssueOutBoFromDisplayRow(row: PrepDemandDisplayRow): PrepLocationRecIssueOutBo {
  return {
    locationCode: normalizeField(row.locationCode)!,
    materialCode: normalizeField(row.materialCode),
    batchCode: normalizeField(row.batchCode),
    reserveNo: normalizeField(row.reserveNo),
    reserveItemNo: normalizeField(row.reserveItemNo),
    specialInventoryFlag: normalizeField(row.specialInventoryFlag),
    businessCode: normalizeField(row.businessCode),
    issueQuantity: normalizeQty(row.issueQty),
    issueUnit: resolveIssueUnit(row),
    remark: normalizeField(resolvePrepRowLocationAdjustRemark(row)),
    overPickCode: normalizeField(row.overPickCode),
    overPickReason: normalizeField(resolveOverPickReasonLabel(row.overPickCode) || row.overPickReason)
  };
}

export function buildPrepLocationRecIssueOutBoFromLine(row: IssueTaskLineVO): PrepLocationRecIssueOutBo {
  const pendingQty = normalizeQty(row.issueQty) ?? 0;
  const actualQty = resolveLineActualIssueQty(row);
  const targetLocation = normalizeField(row.targetDemandLocationCode);
  let issue261Qty = actualQty;
  let transfer311Qty: number | undefined;

  if (actualQty > pendingQty && pendingQty > 0 && targetLocation) {
    issue261Qty = pendingQty;
    transfer311Qty = actualQty - pendingQty;
  }

  const issueOutBo: PrepLocationRecIssueOutBo = {
    locationCode: normalizeField(row.locationCode)!,
    materialCode: normalizeField(row.materialCode),
    batchCode: normalizeField(row.batchCode),
    reserveNo: normalizeField(row.reserveNo),
    reserveItemNo: normalizeField(row.reserveItemNo),
    specialInventoryFlag: normalizeField(row.specialInventoryFlag),
    businessCode: normalizeField(row.businessCode),
    issueQuantity: issue261Qty,
    issueUnit: normalizeField(row.inventoryUnit),
    remark: normalizeField(row.remark),
    overPickCode: normalizeField(row.overPickCode),
    overPickReason: normalizeField(resolveOverPickReasonLabel(row.overPickCode) || row.overPickReason)
  };

  if (transfer311Qty && transfer311Qty > 0) {
    issueOutBo.transferQuantity = transfer311Qty;
    issueOutBo.targetLocationCode = targetLocation;
  }

  return issueOutBo;
}

/** 由发料任务行构建实发扣料+超量移转明细 */
export function buildPrepLocationRecActualDeductTransBoFromLine(row: IssueTaskLineVO): PrepLocationRecIssueOutBo {
  return {
    locationCode: normalizeField(row.locationCode)!,
    materialCode: normalizeField(row.materialCode),
    batchCode: normalizeField(row.batchCode),
    reserveNo: normalizeField(row.reserveNo),
    reserveItemNo: normalizeField(row.reserveItemNo),
    specialInventoryFlag: normalizeField(row.specialInventoryFlag),
    businessCode: normalizeField(row.businessCode),
    actualIssueQuantity: resolveLineActualIssueQty(row),
    issueUnit: normalizeField(row.inventoryUnit),
    remark: normalizeField(row.remark),
    overPickCode: normalizeField(row.overPickCode),
    overPickReason: normalizeField(resolveOverPickReasonLabel(row.overPickCode) || row.overPickReason)
  };
}

/** 发料任务行执行领料：261 走 issueOut；261+311 走 issueOut/actualDeductTrans */
export function executeIssueTaskLineIssueOut(row: IssueTaskLineVO) {
  const batch: PrepLocationRecIssueOutBatchBo = {
    demandId: row.demandId!,
    demandNo: row.demandNo,
    issueOutBoList: hasIssueTaskLine311Transfer(row) ? [buildPrepLocationRecActualDeductTransBoFromLine(row)] : [buildPrepLocationRecIssueOutBoFromLine(row)]
  };
  if (hasIssueTaskLine311Transfer(row)) {
    return prepLocationRecActualDeductTransIssueOut({
      ...batch,
      issueMode: 'ACTUAL_DEDUCT_TRANS'
    });
  }
  return prepLocationRecIssueOut({
    ...batch,
    issueMode: 'DIRECT_DEDUCT'
  });
}

/** 由备料计划展示行构建 261 领料明细 */
export function buildPrepLocationRecIssueOutBoList(rows: PrepDemandDisplayRow[], routes: PrepDemand261Route[]): PrepLocationRecIssueOutBo[] {
  const routeSet = new Set(routes);
  return rows.filter((row) => isIssuablePrepLocationRecRow(row) && routeSet.has(row.warehouseRoute as PrepDemand261Route)).map((row) => buildPrepLocationRecIssueOutBoFromDisplayRow(row));
}
