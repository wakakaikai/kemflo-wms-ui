import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import type { BomIssueRow, InventoryCheckRequest, InventoryCheckResultVO, MaterialLocationRow, WorkOrderBomVO } from '@/api/wms/allocation/types';
import {
  bomRequiresSalesOrderInventory,
  buildInventoryCheckLineResultIndex,
  checkMaterialInventory,
  enrichLocationRowsWithSalesOrderDefaults,
  isOperatableLocationForBom,
  normalizeCheckInventoryLocationRows,
  parseInventoryCheckPayload,
  resolveBomRowPoolQtyFromCheck,
  resolveBomSalesOrderConstraint,
  resolveInventoryCheckLineResultForBom
} from '@/api/wms/allocation/index';
import type { IssueTaskLineVO } from '@/api/wms/issueTask';
import { isIssueTaskLineIssueable } from '@/api/wms/issueTask';
import { resolvePrepRowBusinessPartner, resolvePrepRowInventoryFlag, resolvePrepRowSalesOrderFields } from '@/api/wms/workOrderPrepDemand/index';
import {
  mapLocationSourceToRecommendationSource,
  PREP_LOCATION_REC_SYSTEM_RECOMMENDED,
  PREP_LOCATION_REC_USER_SELECTED
} from '@/api/wms/workOrderPrepDemand/locationSource';
import type { PrepDemandLineItem } from '@/api/wms/workOrderPrepDemand/types';
import type {
  ShortageFulfillmentDemandResult,
  ShortageFulfillmentLineResult,
  ShortageCheckInventoryGroupBy,
  ShortageCheckInventoryRequest,
  ShortageFulfillmentSimulationOptions,
  ShortageFulfillmentSimulationResult,
  ShortageFulfillmentStatus,
  ShortageInventoryPoolSnapshot,
  ShortageRecommendedInventoryItem,
  ShortageTaskDemandGroup,
  ShortageTaskDemandGroupVO,
  ShortageTaskGeneratePrepRequest,
  ShortageTaskGeneratePrepResult,
  ShortageTaskLineVO,
  ShortageTaskQuery
} from './types';
import type { PrepDemandLineItem } from '@/api/wms/workOrderPrepDemand/types';

/** 分页查询缺料任务聚合（按需求单汇总） */
export function listShortageTaskGroup(query?: ShortageTaskQuery): AxiosPromise<ShortageTaskDemandGroupVO[]> {
  return request({
    url: '/wms/shortageTask/demandSummary/list',
    method: 'get',
    params: query
  });
}

/** 分页查询缺料任务明细（缺料行） */
export function listShortageTaskDetail(query?: ShortageTaskQuery): AxiosPromise<ShortageTaskLineVO[]> {
  return request({
    url: '/wms/shortageTask/list',
    method: 'get',
    params: query
  });
}

/** 获取缺料任务行详情 */
export function getShortageTaskLine(id: number | string) {
  return request<ShortageTaskLineVO>({
    url: `/wms/shortageTask/${id}`,
    method: 'get'
  });
}

/** 缺料任务：在原备料需求单上补充库位备料 */
export function generateShortagePrep(data: ShortageTaskGeneratePrepRequest) {
  return request<ShortageTaskGeneratePrepResult>({
    url: '/wms/materialIssueWorkbench/generateShortagePrepareDemand',
    method: 'post',
    data
  });
}

const LINE_STATUS_LABEL: Record<string, string> = {
  WAIT_PICK: '待拣货',
  PICKING: '拣货中',
  SHORTAGE: '缺料中',
  COMPLETE: '已完成',
  PENDING: '待跟进',
  FOLLOWING: '跟进中',
  ARRIVED: '已到料',
  NOTIFIED: '已通知',
  FULFILLED: '已满足',
  CLOSED: '已关闭',
  CANCELLED: '已取消'
};

const LINE_STATUS_TAG: Record<string, 'info' | 'success' | 'warning' | 'primary' | 'danger'> = {
  WAIT_PICK: 'info',
  PICKING: 'warning',
  SHORTAGE: 'danger',
  COMPLETE: 'success',
  PENDING: 'danger',
  FOLLOWING: 'warning',
  ARRIVED: 'primary',
  NOTIFIED: 'warning',
  FULFILLED: 'success',
  CLOSED: 'info',
  CANCELLED: 'info'
};

const LINE_STATUS_BADGE_COLOR: Record<string, string> = {
  WAIT_PICK: '#909399',
  PICKING: '#e6a23c',
  SHORTAGE: '#f56c6c',
  COMPLETE: '#67c23a',
  PENDING: '#f56c6c',
  FOLLOWING: '#e6a23c',
  ARRIVED: '#409eff',
  NOTIFIED: '#e6a23c',
  FULFILLED: '#67c23a',
  CLOSED: '#909399',
  CANCELLED: '#909399'
};

export const ALL_TAB_BADGE_COLOR = '#f56c6c';

export const SHORTAGE_TASK_LINE_STATUSES = ['PENDING', 'FOLLOWING', 'ARRIVED', 'NOTIFIED', 'FULFILLED', 'CLOSED'] as const;

export const LINE_STATUS_OPTIONS = SHORTAGE_TASK_LINE_STATUSES.map((value) => ({
  value,
  label: LINE_STATUS_LABEL[value]
}));

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

export function isShortageTaskOpen(row: { lineStatus?: string }) {
  const status = String(row.lineStatus || '').toUpperCase();
  return status !== 'FULFILLED' && status !== 'CLOSED' && status !== 'CANCELLED';
}

export function normalizeShortageTaskGroup(row: ShortageTaskDemandGroupVO): ShortageTaskDemandGroup {
  const key =
    row.demandId != null && row.demandId !== ''
      ? `id:${row.demandId}`
      : row.demandNo
        ? `no:${row.demandNo}`
        : `group:${Date.now()}`;
  return {
    ...row,
    key,
    shortageLineCount: Number(row.shortageLineCount) || 0,
    workOrderCount: Number(row.workOrderCount) || 0
  };
}

type ShortageTaskLineListResponse = {
  rows?: ShortageTaskLineVO[];
  data?: ShortageTaskLineVO[] | { rows?: ShortageTaskLineVO[]; total?: number };
  total?: number;
};

/** 兼容分页 rows/total 与非分页 data 数组两种返回结构 */
export function normalizeShortageTaskLineListResponse(res?: ShortageTaskLineListResponse | ShortageTaskLineVO[]) {
  if (!res) return { rows: [] as ShortageTaskLineVO[], total: 0 };
  if (Array.isArray(res)) return { rows: res, total: res.length };
  if (Array.isArray(res.data)) return { rows: res.data, total: res.data.length };
  if (res.data && Array.isArray(res.data.rows)) {
    return { rows: res.data.rows, total: Number(res.data.total) || res.data.rows.length };
  }
  const rows = res.rows || [];
  return { rows, total: Number(res.total) || rows.length };
}

type ShortageInventoryType = 'UNRESTRICTED' | 'SALES_ORDER';

const CLOSED_STATUSES = new Set(['FULFILLED', 'CLOSED', 'CANCELLED']);

function toNumber(value?: number | string | null): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function normalizeShortageInventoryType(raw?: string): ShortageInventoryType {
  const value = String(raw ?? '')
    .trim()
    .toUpperCase();
  if (value === 'SALES_ORDER' || value === 'E') return 'SALES_ORDER';
  return 'UNRESTRICTED';
}

function resolveLineInventoryType(line: ShortageTaskLineVO): ShortageInventoryType {
  const explicit = normalizeShortageInventoryType(line.shortageInventoryType);
  if (line.shortageInventoryType) return explicit;
  const flag = String(line.specialInventoryFlag ?? '')
    .trim()
    .toUpperCase();
  if (flag === 'E') return 'SALES_ORDER';
  return 'UNRESTRICTED';
}

function resolveLineSalesOrder(line: ShortageTaskLineVO): { salesOrderNo: string; salesOrderItem: string } {
  const so = resolvePrepRowSalesOrderFields(line);
  return {
    salesOrderNo: so.salesOrderNo || '',
    salesOrderItem: so.salesOrderItem || ''
  };
}

type PoolPartner = { businessCode?: string; businessName?: string };

/** 物料库存池分组键：同物料 + 同特殊库存标识 + 同业务伙伴共用一个池 */
function buildSpecialInventoryPoolKey(materialCode: string, specialInventoryFlag: string, partner: PoolPartner = {}): string {
  const code = String(materialCode ?? '')
    .trim()
    .toUpperCase();
  if (!code) return '';
  const flag = String(specialInventoryFlag ?? 'N')
    .trim()
    .toUpperCase() || 'N';
  if (flag === 'N') return `${code}|UNRESTRICTED`;
  if (flag === 'E') {
    const salesOrderNo = String(partner.businessCode ?? '').trim();
    const salesOrderItem = String(partner.businessName ?? '').trim();
    return `${code}|SALES_ORDER|${salesOrderNo}|${salesOrderItem}`;
  }
  const businessCode = String(partner.businessCode ?? '').trim();
  const businessName = String(partner.businessName ?? '').trim();
  return `${code}|${flag}|${businessCode}|${businessName}`;
}

function resolveLinePoolPartner(line: Pick<ShortageTaskLineVO, 'specialInventoryFlag' | 'shortageInventoryType' | 'businessCode' | 'businessName' | 'salesOrderNo' | 'salesOrderItem'>) {
  const flag = resolvePrepRowInventoryFlag(line);
  if (flag === 'E') {
    const so = resolvePrepRowSalesOrderFields(line);
    return {
      businessCode: so.salesOrderNo,
      businessName: so.salesOrderItem
    };
  }
  return resolvePrepRowBusinessPartner(line);
}

/** 缺料行对应的库存池 key（与库存明细、发料任务占用同一套分组规则） */
export function resolveShortagePoolKey(
  line: Pick<ShortageTaskLineVO, 'materialCode' | 'shortageInventoryType' | 'specialInventoryFlag' | 'salesOrderNo' | 'salesOrderItem' | 'businessCode' | 'businessName'>
): string {
  const flag = resolvePrepRowInventoryFlag(line);
  const partner = resolveLinePoolPartner(line as ShortageTaskLineVO);
  return buildSpecialInventoryPoolKey(String(line.materialCode ?? ''), flag, partner);
}

function shortageLineToBomRow(line: ShortageTaskLineVO): BomIssueRow {
  const so = resolvePrepRowSalesOrderFields(line);
  return {
    id: line.id != null ? Number(line.id) || line.id : undefined,
    workOrderNo: String(line.workOrderNo || ''),
    componentMaterial: String(line.materialCode || ''),
    componentQty: toNumber(line.componentQty),
    salesOrderNo: so.salesOrderNo ?? line.salesOrderNo,
    salesOrderItem: so.salesOrderItem ?? line.salesOrderItem,
    specialInventoryFlag: resolvePrepRowInventoryFlag(line)
  };
}

type CheckRecommendationPoolState = {
  entries: Array<{ loc: MaterialLocationRow; remaining: number }>;
  templateRows: MaterialLocationRow[];
  materialName?: string;
  unit?: string;
};

function resolveDemandUserNoForLines(
  lines: ShortageTaskLineVO[],
  demandMetaMap: Map<string, ShortageTaskDemandGroupVO>
): string | undefined {
  for (const line of lines) {
    const direct = String(line.materialUserCode || '').trim();
    if (direct) return direct;
    const demandKey = String(line.demandNo || line.demandId || '').trim();
    const meta =
      demandMetaMap.get(demandKey) ||
      demandMetaMap.get(String(line.demandNo || '').trim()) ||
      demandMetaMap.get(String(line.demandId || '').trim());
    const metaCode = String(meta?.materialUserCode || '').trim();
    if (metaCode) return metaCode;
  }
  return undefined;
}

function resolveCheckPayloadLookupKey(line: ShortageTaskLineVO, groupBy: ShortageCheckInventoryGroupBy): string {
  if (groupBy === 'material') {
    return String(line.materialCode || '').trim();
  }
  return String(line.workOrderNo || '').trim();
}

function resolveMaterialUseIndexBucketKey(line: ShortageTaskLineVO, groupBy: ShortageCheckInventoryGroupBy): string {
  if (groupBy === 'material') return '__material__';
  return String(line.workOrderNo || '').trim();
}

/** 缺料行数按物料编码统计（用于 checkInventory 重复物料占比） */
export function buildMaterialShortageLineCounts(lines: ShortageTaskLineVO[]): Record<string, number> {
  const counts: Record<string, number> = {};
  lines.forEach((line) => {
    const code = String(line.materialCode || '').trim();
    if (!code || toNumber(line.shortageQty) <= 0) return;
    counts[code] = (counts[code] ?? 0) + 1;
  });
  return counts;
}

function pickCheckInventoryMetricFromPayloads(
  checkPayloadMap: Map<string, InventoryCheckResultVO>,
  field: 'zeroStockShortageRate' | 'repeatMaterialRate'
): number | undefined {
  const uniquePayloads = new Set<InventoryCheckResultVO>();
  checkPayloadMap.forEach((payload) => uniquePayloads.add(payload));
  for (const payload of uniquePayloads) {
    const value = payload[field];
    if (value != null && Number.isFinite(Number(value))) {
      return Math.round(Number(value));
    }
  }
  return undefined;
}

async function fetchCheckInventoryPayloadsByMaterial(
  lines: ShortageTaskLineVO[],
  checkInventoryApi: (data: ShortageCheckInventoryRequest) => ReturnType<typeof checkMaterialInventory> = checkMaterialInventory
): Promise<Map<string, InventoryCheckResultVO>> {
  const materialCodes = [...new Set(lines.map((line) => String(line.materialCode || '').trim()).filter(Boolean))];
  if (!materialCodes.length) return new Map();

  const response = await checkInventoryApi({
    materialCodes,
    materialShortageLineCounts: buildMaterialShortageLineCounts(lines)
  });
  if (response.code !== 200) return new Map();
  const payload = parseInventoryCheckPayload(response.data);
  if (!payload) return new Map();

  const result = new Map<string, InventoryCheckResultVO>();
  materialCodes.forEach((code) => result.set(code, payload));
  return result;
}

function collectAvailableQtyFromCheckPayloads(checkPayloadMap: Map<string, InventoryCheckResultVO>) {
  const availableByCode = new Map<string, number>();
  const uniquePayloads = new Set<InventoryCheckResultVO>();
  checkPayloadMap.forEach((payload) => uniquePayloads.add(payload));

  uniquePayloads.forEach((payload) => {
    payload.materials?.forEach((mat) => {
      const code = String(mat.materialCode || '').trim();
      if (!code) return;
      const qty = toNumber(mat.availableQty);
      availableByCode.set(code, Math.max(availableByCode.get(code) ?? 0, qty));
    });
    payload.lineResults?.forEach((line) => {
      const code = String(line.materialCode || line.componentMaterial || '').trim();
      if (!code) return;
      const qty = toNumber(line.availableQty);
      availableByCode.set(code, Math.max(availableByCode.get(code) ?? 0, qty));
    });
  });

  return availableByCode;
}

/** 零库存断料占比 = checkInventory 可用库存为 0 的缺料物料种类 / 缺料物料种类 */
export function computeZeroStockShortageRateFromCheckInventory(
  lines: ShortageTaskLineVO[],
  checkPayloadMap: Map<string, InventoryCheckResultVO>
) {
  const fromApi = pickCheckInventoryMetricFromPayloads(checkPayloadMap, 'zeroStockShortageRate');
  if (fromApi != null) return fromApi;

  const shortageSkus = new Set<string>();
  lines.forEach((line) => {
    const code = String(line.materialCode || '').trim();
    if (!code || toNumber(line.shortageQty) <= 0) return;
    shortageSkus.add(code);
  });

  const shortageSkuCount = shortageSkus.size;
  if (!shortageSkuCount || !checkPayloadMap.size) return 0;

  const availableByCode = collectAvailableQtyFromCheckPayloads(checkPayloadMap);
  let zeroStockSkuCount = 0;
  shortageSkus.forEach((code) => {
    if ((availableByCode.get(code) ?? 0) === 0) zeroStockSkuCount += 1;
  });

  return Math.round((zeroStockSkuCount / shortageSkuCount) * 100);
}

/** 重复物料占比 = 在多条缺料行中出现的物料种类 / 缺料物料种类 */
export function computeRepeatMaterialRateFromCheckInventory(
  lines: ShortageTaskLineVO[],
  checkPayloadMap: Map<string, InventoryCheckResultVO>
) {
  const fromApi = pickCheckInventoryMetricFromPayloads(checkPayloadMap, 'repeatMaterialRate');
  if (fromApi != null) return fromApi;

  const lineCountByMaterial = buildMaterialShortageLineCounts(lines);
  const totalSkuCount = Object.keys(lineCountByMaterial).length;
  if (!totalSkuCount) return 0;

  let repeatSkuCount = 0;
  Object.values(lineCountByMaterial).forEach((count) => {
    if (count > 1) repeatSkuCount += 1;
  });

  return Math.round((repeatSkuCount / totalSkuCount) * 100);
}

async function fetchCheckInventoryPayloadsByWorkOrder(
  lines: ShortageTaskLineVO[],
  demandMetaMap: Map<string, ShortageTaskDemandGroupVO>,
  checkInventoryApi: (data: ShortageCheckInventoryRequest) => ReturnType<typeof checkMaterialInventory> = checkMaterialInventory
): Promise<Map<string, InventoryCheckResultVO>> {
  const grouped = new Map<string, ShortageTaskLineVO[]>();
  lines.forEach((line) => {
    const workOrderNo = String(line.workOrderNo || '').trim();
    if (!workOrderNo) return;
    const bucket = grouped.get(workOrderNo) || [];
    bucket.push(line);
    grouped.set(workOrderNo, bucket);
  });

  const result = new Map<string, InventoryCheckResultVO>();
  for (const [workOrderNo, woLines] of grouped) {
    const materialCodes = [...new Set(woLines.map((line) => String(line.materialCode || '').trim()).filter(Boolean))];
    if (!materialCodes.length) continue;

    const pseudoRows = woLines.map(shortageLineToBomRow);
    const needsSalesOrderInventory = pseudoRows.some((row) =>
      bomRequiresSalesOrderInventory(resolveBomSalesOrderConstraint(row))
    );
    const soLine = pseudoRows.find((row) => bomRequiresSalesOrderInventory(resolveBomSalesOrderConstraint(row)));
    const soConstraint = soLine ? resolveBomSalesOrderConstraint(soLine) : resolveBomSalesOrderConstraint(pseudoRows[0]);
    const demandUserNo = resolveDemandUserNoForLines(woLines, demandMetaMap);

    const response = await checkInventoryApi({
      workOrderNo,
      materialCodes,
      ...(demandUserNo ? { demandUserNo } : {}),
      ...(needsSalesOrderInventory && soConstraint.salesOrderNo
        ? {
            salesOrderNo: soConstraint.salesOrderNo,
            ...(soConstraint.salesOrderItem ? { salesOrderItem: soConstraint.salesOrderItem } : {}),
            specialInventoryFlag: 'E'
          }
        : {})
    });
    if (response.code !== 200) continue;
    const payload = parseInventoryCheckPayload(response.data);
    if (payload) result.set(workOrderNo, payload);
  }
  return result;
}

function resolveCheckLineContext(
  line: ShortageTaskLineVO,
  lineIndexInWorkOrder: number,
  checkPayload: InventoryCheckResultVO | undefined,
  materialUseIndex: Map<string, number>
) {
  const bomRow = shortageLineToBomRow(line);
  const indexMaps = buildInventoryCheckLineResultIndex(checkPayload?.lineResults);
  const lineResult = checkPayload
    ? resolveInventoryCheckLineResultForBom(bomRow, lineIndexInWorkOrder, indexMaps, materialUseIndex, checkPayload.lineResults)
    : undefined;
  const soConstraint = resolveBomSalesOrderConstraint(bomRow, lineResult);
  const inventory = checkPayload?.materials?.find(
    (mat) => String(mat.materialCode || '').trim() === String(line.materialCode || '').trim()
  );
  let checkRows: MaterialLocationRow[] = [];
  if (lineResult?.recommendedLocations?.length) {
    checkRows = normalizeCheckInventoryLocationRows(lineResult.recommendedLocations);
    if (bomRequiresSalesOrderInventory(soConstraint)) {
      checkRows = enrichLocationRowsWithSalesOrderDefaults(checkRows, soConstraint);
    }
  }
  const poolQty = resolveBomRowPoolQtyFromCheck(soConstraint, checkRows, lineResult, inventory);
  return { bomRow, lineResult, soConstraint, checkRows, poolQty, inventory };
}

function initCheckRecommendationPoolState(checkRows: MaterialLocationRow[], poolQty: number, line?: ShortageTaskLineVO): CheckRecommendationPoolState {
  const entries = checkRows.map((loc) => ({
    loc: { ...loc },
    remaining: Math.max(0, Number(loc.recommendedQty ?? loc.systemRecommendedQty ?? loc.availableQuantity ?? 0))
  }));
  const hasEntryQty = entries.some((entry) => entry.remaining > 0);
  const initialQty = hasEntryQty ? entries.reduce((sum, entry) => sum + entry.remaining, 0) : Math.max(0, poolQty);
  if (!hasEntryQty && initialQty > 0 && entries.length) {
    let left = initialQty;
    entries.forEach((entry) => {
      if (left <= 0) return;
      const available = Math.max(0, Number(entry.loc.availableQuantity ?? 0));
      const take = Math.min(left, available);
      entry.remaining = take;
      left -= take;
    });
  }
  return {
    entries,
    templateRows: checkRows.map((row) => ({ ...row })),
    materialName: line?.materialName,
    unit: line?.unit
  };
}

function getOrResolveCheckLineContext(
  line: ShortageTaskLineVO,
  lineIndexInWorkOrder: number,
  checkPayloadMap: Map<string, InventoryCheckResultVO>,
  materialUseIndexByBucket: Map<string, Map<string, number>>,
  cache: Map<string, ReturnType<typeof resolveCheckLineContext>>,
  groupBy: ShortageCheckInventoryGroupBy = 'workOrder'
) {
  const key = String(line.id);
  const cached = cache.get(key);
  if (cached) return cached;
  const lookupKey = resolveCheckPayloadLookupKey(line, groupBy);
  const checkPayload = lookupKey ? checkPayloadMap.get(lookupKey) : undefined;
  const bucketKey = resolveMaterialUseIndexBucketKey(line, groupBy);
  const materialUseIndex = materialUseIndexByBucket.get(bucketKey) || new Map<string, number>();
  materialUseIndexByBucket.set(bucketKey, materialUseIndex);
  const ctx = resolveCheckLineContext(line, lineIndexInWorkOrder, checkPayload, materialUseIndex);
  cache.set(key, ctx);
  return ctx;
}

function ensureCheckRecommendationPool(
  line: ShortageTaskLineVO,
  lineIndexInWorkOrder: number,
  checkPayloadMap: Map<string, InventoryCheckResultVO>,
  materialUseIndexByBucket: Map<string, Map<string, number>>,
  lineCheckContextCache: Map<string, ReturnType<typeof resolveCheckLineContext>>,
  sharedPools: Map<string, CheckRecommendationPoolState>,
  groupBy: ShortageCheckInventoryGroupBy = 'workOrder'
) {
  const poolKey = resolveShortagePoolKey(line);
  if (!poolKey || sharedPools.has(poolKey)) return;
  const { checkRows, poolQty } = getOrResolveCheckLineContext(
    line,
    lineIndexInWorkOrder,
    checkPayloadMap,
    materialUseIndexByBucket,
    lineCheckContextCache,
    groupBy
  );
  sharedPools.set(poolKey, initCheckRecommendationPoolState(checkRows, poolQty, line));
}

function sumCheckPoolRemaining(entries: Array<{ remaining: number }>) {
  return entries.reduce((sum, entry) => sum + entry.remaining, 0);
}

function allocateFromCheckPool(
  entries: Array<{ loc: MaterialLocationRow; remaining: number }>,
  needQty: number,
  soConstraint: ReturnType<typeof resolveBomSalesOrderConstraint>
): { poolAllocatedQty: number; items: ShortageRecommendedInventoryItem[] } {
  let left = needQty;
  const items: ShortageRecommendedInventoryItem[] = [];
  entries.forEach((entry) => {
    if (left <= 0 || entry.remaining <= 0) return;
    if (!isOperatableLocationForBom(soConstraint, entry.loc)) return;
    const take = Math.min(left, entry.remaining);
    entry.remaining -= take;
    left -= take;
    const locExtra = entry.loc as MaterialLocationRow & { inventoryDetailId?: string | number; id?: string | number };
    items.push({
      inventoryDetailId: locExtra.inventoryDetailId ?? locExtra.id,
      warehouseCode: entry.loc.warehouseCode,
      locationCode: entry.loc.locationCode,
      batchCode: entry.loc.batchCode,
      allocatedQty: take,
      unit: entry.loc.unit,
      businessCode: entry.loc.businessCode
    });
  });
  return { poolAllocatedQty: needQty - left, items };
}

function buildWorkOrderLineIndexMap(lines: ShortageTaskLineVO[]) {
  const counters = new Map<string, number>();
  const indexMap = new Map<string, number>();
  lines.forEach((line) => {
    const workOrderNo = String(line.workOrderNo || '').trim();
    const idx = counters.get(workOrderNo) || 0;
    indexMap.set(String(line.id), idx);
    counters.set(workOrderNo, idx + 1);
  });
  return indexMap;
}

function parsePoolKey(poolKey: string) {
  const parts = poolKey.split('|');
  const materialCode = parts[0] || '';
  const head = parts[1] || '';
  if (head === 'UNRESTRICTED') {
    return {
      materialCode,
      specialInventoryFlag: 'N',
      shortageInventoryType: 'UNRESTRICTED' as ShortageInventoryType
    };
  }
  if (head === 'SALES_ORDER') {
    return {
      materialCode,
      specialInventoryFlag: 'E',
      shortageInventoryType: 'SALES_ORDER' as ShortageInventoryType,
      salesOrderNo: parts[2] || undefined,
      salesOrderItem: parts[3] || undefined
    };
  }
  return {
    materialCode,
    specialInventoryFlag: head,
    shortageInventoryType: head,
    salesOrderNo: parts[2] || undefined,
    salesOrderItem: parts[3] || undefined
  };
}

function resolveFulfillmentStatus(allocated: number, shortage: number): ShortageFulfillmentStatus {
  if (shortage <= 0 || allocated >= shortage) return 'FULL';
  if (allocated > 0) return 'PARTIAL';
  return 'NONE';
}

function compareDemandTime(a?: string, b?: string) {
  const ta = a ? new Date(a).getTime() : Number.MAX_SAFE_INTEGER;
  const tb = b ? new Date(b).getTime() : Number.MAX_SAFE_INTEGER;
  if (ta !== tb) return ta - tb;
  return String(a || '').localeCompare(String(b || ''));
}

async function fetchAllShortageLines(query?: ShortageTaskQuery): Promise<ShortageTaskLineVO[]> {
  const pageSize = 500;
  let pageNum = 1;
  const all: ShortageTaskLineVO[] = [];
  let total = 0;
  do {
    const res = await listShortageTaskDetail({ ...query, pageNum, pageSize });
    const normalized = normalizeShortageTaskLineListResponse(res);
    all.push(...normalized.rows);
    total = normalized.total;
    if (!normalized.rows.length || all.length >= total) break;
    pageNum += 1;
  } while (pageNum <= 20);
  return all;
}

/** 分页拉取全部缺料明细行 */
export { fetchAllShortageLines };

function buildDemandMetaMapFromLines(lines: ShortageTaskLineVO[]): Map<string, ShortageTaskDemandGroupVO> {
  const map = new Map<string, ShortageTaskDemandGroupVO>();
  const workOrderCountByDemand = new Map<string, Set<string>>();

  lines.forEach((line) => {
    const demandNo = String(line.demandNo ?? '').trim();
    const demandId = String(line.demandId ?? '').trim();
    const demandKey = demandNo || demandId;
    if (!demandKey) return;

    const workOrderNo = String(line.workOrderNo ?? '').trim();
    if (workOrderNo) {
      const workOrders = workOrderCountByDemand.get(demandKey) || new Set<string>();
      workOrders.add(workOrderNo);
      workOrderCountByDemand.set(demandKey, workOrders);
    }

    const existing = map.get(demandKey);
    const meta: ShortageTaskDemandGroupVO = {
      demandId: line.demandId,
      demandNo: line.demandNo,
      demandStatus: line.demandStatus,
      createTime: existing?.createTime || line.createTime,
      materialUserCode: existing?.materialUserCode || line.materialUserCode,
      materialUserName: existing?.materialUserName || line.materialUserName,
      targetDemandLocationCode: existing?.targetDemandLocationCode || line.targetDemandLocationCode,
      targetDemandWarehouseCode: existing?.targetDemandWarehouseCode || line.targetDemandWarehouseCode,
      workOrderCount: workOrderCountByDemand.get(demandKey)?.size
    };

    if (demandNo) map.set(demandNo, meta);
    if (demandId) map.set(demandId, meta);
  });

  return map;
}

async function fetchDemandMetaMap(query?: ShortageTaskQuery): Promise<Map<string, ShortageTaskDemandGroupVO>> {
  const pageSize = 500;
  let pageNum = 1;
  const map = new Map<string, ShortageTaskDemandGroupVO>();
  let total = 0;
  do {
    const res = await listShortageTaskGroup({ ...query, pageNum, pageSize });
    const rows = (res.rows || []) as ShortageTaskDemandGroupVO[];
    rows.forEach((row) => {
      const demandNo = String(row.demandNo ?? '').trim();
      const demandId = String(row.demandId ?? '').trim();
      if (demandNo) map.set(demandNo, row);
      if (demandId) map.set(demandId, row);
    });
    total = Number(res.total) || rows.length;
    if (!rows.length || map.size >= total) break;
    pageNum += 1;
  } while (pageNum <= 20);
  return map;
}

function sumPoolAllocated(initial: number, remaining: number) {
  return Math.max(0, initial - remaining);
}

function buildShortageComboKey(line: Pick<ShortageTaskLineVO, 'demandId' | 'workOrderNo' | 'materialCode'>) {
  return [
    String(line.demandId ?? '').trim(),
    String(line.workOrderNo ?? '').trim().toUpperCase(),
    String(line.materialCode ?? '').trim().toUpperCase()
  ].join('|');
}

function isActiveIssueTaskLine(line: IssueTaskLineVO) {
  const status = String(line.lineStatus || '').toUpperCase();
  if (status === 'CANCELLED') return false;
  const route = String(line.warehouseRoute || '').toUpperCase();
  return route !== 'SHORTAGE';
}

function isPendingIssueTaskLine(line: IssueTaskLineVO) {
  if (!isActiveIssueTaskLine(line)) return false;
  return isIssueTaskLineIssueable(line.lineStatus);
}

/** 匹配缺料行对应的发料任务行（待发/拣货中） */
export function resolveMatchingIssueTaskLines(shortageLine: ShortageTaskLineVO, issueLines: IssueTaskLineVO[]) {
  const shortageId = String(shortageLine.id ?? '').trim();
  const comboKey = buildShortageComboKey(shortageLine);
  return issueLines.filter((issue) => {
    if (!isPendingIssueTaskLine(issue)) return false;
    const demandLineId = String(issue.demandLineId ?? '').trim();
    if (shortageId && demandLineId && shortageId === demandLineId) return true;
    return buildShortageComboKey(issue) === comboKey;
  });
}

/** 缺料行是否已有发料任务待发记录 */
export function isShortageLineCoveredByIssueTask(shortageLine: ShortageTaskLineVO, issueLines: IssueTaskLineVO[]) {
  return resolveMatchingIssueTaskLines(shortageLine, issueLines).length > 0;
}

function sortActiveLinesByDemandTime(
  activeLines: ShortageTaskLineVO[],
  demandMetaMap: Map<string, ShortageTaskDemandGroupVO>
) {
  const demandLineMap = new Map<string, ShortageTaskLineVO[]>();
  activeLines.forEach((line) => {
    const demandKey = String(line.demandNo || line.demandId || '').trim();
    if (!demandKey) return;
    const bucket = demandLineMap.get(demandKey) || [];
    bucket.push(line);
    demandLineMap.set(demandKey, bucket);
  });

  const demandEntries = [...demandLineMap.entries()].map(([demandKey, demandLines]) => {
    const meta =
      demandMetaMap.get(demandKey) ||
      demandMetaMap.get(String(demandLines[0]?.demandNo || '').trim()) ||
      demandMetaMap.get(String(demandLines[0]?.demandId || '').trim());
    const demandCreateTime = meta?.createTime || demandLines[0]?.createTime;
    return { demandKey, demandLines, demandCreateTime };
  });

  demandEntries.sort((a, b) => compareDemandTime(a.demandCreateTime, b.demandCreateTime));
  return demandEntries.flatMap(({ demandLines }) =>
    demandLines.slice().sort((a, b) => compareDemandTime(a.createTime, b.createTime))
  );
}

function filterAnalyzableShortageLines(lines: ShortageTaskLineVO[]) {
  return lines.filter((line) => {
    const status = String(line.lineStatus || '').toUpperCase();
    if (status && CLOSED_STATUSES.has(status)) return false;
    return toNumber(line.shortageQty) > 0;
  });
}

/** 按需求时间顺序、共享 checkInventory 推荐池模拟可满足量 */
export function simulateShortageFulfillment(
  lines: ShortageTaskLineVO[],
  checkPayloadMap: Map<string, InventoryCheckResultVO>,
  demandMetaMap: Map<string, ShortageTaskDemandGroupVO>,
  checkInventoryGroupBy: ShortageCheckInventoryGroupBy = 'workOrder'
): ShortageFulfillmentSimulationResult {
  const activeLines = filterAnalyzableShortageLines(lines);
  const workOrderLineIndexMap = buildWorkOrderLineIndexMap(activeLines);
  const materialUseIndexByBucket = new Map<string, Map<string, number>>();
  const lineCheckContextCache = new Map<string, ReturnType<typeof resolveCheckLineContext>>();
  const sharedPools = new Map<string, CheckRecommendationPoolState>();

  sortActiveLinesByDemandTime(activeLines, demandMetaMap).forEach((line) => {
    const lineIndexInWorkOrder = workOrderLineIndexMap.get(String(line.id)) ?? 0;
    ensureCheckRecommendationPool(
      line,
      lineIndexInWorkOrder,
      checkPayloadMap,
      materialUseIndexByBucket,
      lineCheckContextCache,
      sharedPools,
      checkInventoryGroupBy
    );
  });

  const poolInitialQty = new Map<string, number>();
  sharedPools.forEach((pool, poolKey) => {
    poolInitialQty.set(poolKey, sumCheckPoolRemaining(pool.entries));
  });

  const lineMap: Record<string, ShortageFulfillmentLineResult> = {};

  const demandLineMap = new Map<string, ShortageTaskLineVO[]>();
  activeLines.forEach((line) => {
    const demandKey = String(line.demandNo || line.demandId || '').trim();
    if (!demandKey) return;
    const bucket = demandLineMap.get(demandKey) || [];
    bucket.push(line);
    demandLineMap.set(demandKey, bucket);
  });

  const demandEntries = [...demandLineMap.entries()].map(([demandKey, demandLines]) => {
    const meta =
      demandMetaMap.get(demandKey) ||
      demandMetaMap.get(String(demandLines[0]?.demandNo || '').trim()) ||
      demandMetaMap.get(String(demandLines[0]?.demandId || '').trim());
    const demandCreateTime = meta?.createTime || demandLines[0]?.createTime;
    return { demandKey, demandLines, meta, demandCreateTime };
  });

  demandEntries.sort((a, b) => compareDemandTime(a.demandCreateTime, b.demandCreateTime));

  const demands: ShortageFulfillmentDemandResult[] = demandEntries.map(({ demandKey, demandLines, meta, demandCreateTime }, index) => {
    const lineResults: ShortageFulfillmentLineResult[] = demandLines
      .slice()
      .sort((a, b) => compareDemandTime(a.createTime, b.createTime))
      .map((line) => {
        const poolKey = resolveShortagePoolKey(line);
        const shortageQty = toNumber(line.shortageQty);
        const inventoryFlag = resolvePrepRowInventoryFlag(line);
        const netShortageQty = shortageQty;

        const lineIndexInWorkOrder = workOrderLineIndexMap.get(String(line.id)) ?? 0;
        const { soConstraint, checkRows } = getOrResolveCheckLineContext(
          line,
          lineIndexInWorkOrder,
          checkPayloadMap,
          materialUseIndexByBucket,
          lineCheckContextCache,
          checkInventoryGroupBy
        );

        const poolState = sharedPools.get(poolKey);
        const poolAvailableBefore = poolState ? sumCheckPoolRemaining(poolState.entries) : 0;
        const { poolAllocatedQty, items } = poolState
          ? allocateFromCheckPool(poolState.entries, netShortageQty, soConstraint)
          : { poolAllocatedQty: 0, items: [] as ShortageRecommendedInventoryItem[] };
        const allocatedQty = poolAllocatedQty;
        const remainingQty = Math.max(0, shortageQty - poolAllocatedQty);
        const fulfillmentStatus = resolveFulfillmentStatus(allocatedQty, shortageQty);
        const salesOrder = resolveLineSalesOrder(line);
        const targetDemandLocationCode =
          String(line.targetDemandLocationCode || meta?.targetDemandLocationCode || '').trim() || undefined;
        const targetDemandWarehouseCode =
          String(line.targetDemandWarehouseCode || meta?.targetDemandWarehouseCode || '').trim() ||
          targetDemandLocationCode;
        const allocatedLocationRows = mapShortageRecommendedToLocationRows(items, line);
        const lineResult: ShortageFulfillmentLineResult = {
          lineId: line.id,
          workOrderNo: line.workOrderNo,
          materialCode: line.materialCode,
          materialName: line.materialName,
          shortageQty,
          issueTaskPendingQty: 0,
          netShortageQty,
          poolAllocatedQty,
          allocatedQty,
          remainingQty,
          unit: line.unit,
          specialInventoryFlag: inventoryFlag,
          shortageInventoryType: resolveLineInventoryType(line),
          salesOrderNo: salesOrder.salesOrderNo || undefined,
          salesOrderItem: salesOrder.salesOrderItem || undefined,
          poolAvailableBefore,
          lineStatus: line.lineStatus,
          fulfillmentStatus,
          recommendedInventories: items,
          checkInventoryRecommendedLocations: checkRows.length
            ? overlayAllocatedLocationRows(checkRows, allocatedLocationRows)
            : allocatedLocationRows.length
              ? allocatedLocationRows
              : undefined,
          ...(targetDemandLocationCode
            ? { targetDemandLocationCode, targetDemandWarehouseCode }
            : {})
        };
        lineMap[String(line.id)] = lineResult;
        return lineResult;
      });

    const totalShortageQty = lineResults.reduce((sum, item) => sum + item.shortageQty, 0);
    const totalAllocatedQty = lineResults.reduce((sum, item) => sum + item.allocatedQty, 0);
    const totalRemainingQty = lineResults.reduce((sum, item) => sum + item.remainingQty, 0);
    const fulfilledLineCount = lineResults.filter((item) => item.remainingQty <= 0).length;

    return {
      demandId: meta?.demandId ?? demandLines[0]?.demandId,
      demandNo: meta?.demandNo ?? demandLines[0]?.demandNo ?? demandKey,
      demandCreateTime,
      demandStatus: meta?.demandStatus ?? demandLines[0]?.demandStatus,
      materialUserCode: meta?.materialUserCode ?? demandLines[0]?.materialUserCode,
      materialUserName: meta?.materialUserName ?? demandLines[0]?.materialUserName,
      targetDemandLocationCode: meta?.targetDemandLocationCode ?? demandLines[0]?.targetDemandLocationCode,
      targetDemandWarehouseCode: meta?.targetDemandWarehouseCode ?? demandLines[0]?.targetDemandWarehouseCode,
      workOrderCount: meta?.workOrderCount,
      sortOrder: index + 1,
      lineCount: lineResults.length,
      totalShortageQty,
      totalAllocatedQty,
      totalRemainingQty,
      fulfillmentStatus: resolveFulfillmentStatus(totalAllocatedQty, totalShortageQty),
      fulfilledLineCount,
      fulfillmentRate: totalShortageQty > 0 ? (totalAllocatedQty / totalShortageQty) * 100 : 100,
      lines: lineResults
    };
  });

  const poolsSnapshot: ShortageInventoryPoolSnapshot[] = [...poolInitialQty.entries()].map(([poolKey, initialQty]) => {
    const remainingQty = sharedPools.has(poolKey) ? sumCheckPoolRemaining(sharedPools.get(poolKey)!.entries) : 0;
    const allocatedQty = sumPoolAllocated(initialQty, remainingQty);
    const parsed = parsePoolKey(poolKey);
    const poolState = sharedPools.get(poolKey);
    return {
      poolKey,
      materialCode: parsed.materialCode,
      materialName: poolState?.materialName,
      specialInventoryFlag: parsed.specialInventoryFlag,
      shortageInventoryType: parsed.shortageInventoryType,
      salesOrderNo: parsed.salesOrderNo,
      salesOrderItem: parsed.salesOrderItem,
      initialQty,
      allocatedQty,
      remainingQty,
      unit: poolState?.unit
    };
  });

  poolsSnapshot.sort((a, b) => a.materialCode.localeCompare(b.materialCode));

  const allLineResults = Object.values(lineMap);
  const summary = {
    demandCount: demands.length,
    shortageLineCount: activeLines.length,
    pageLineCount: lines.length,
    excludedByIssueTaskCount: 0,
    fullCount: demands.filter((item) => item.fulfillmentStatus === 'FULL').length,
    partialCount: demands.filter((item) => item.fulfillmentStatus === 'PARTIAL').length,
    noneCount: demands.filter((item) => item.fulfillmentStatus === 'NONE').length,
    fullLineCount: allLineResults.filter((item) => item.fulfillmentStatus === 'FULL').length,
    partialLineCount: allLineResults.filter((item) => item.fulfillmentStatus === 'PARTIAL').length,
    noneLineCount: allLineResults.filter((item) => item.fulfillmentStatus === 'NONE').length,
    poolMaterialCount: poolsSnapshot.length,
    totalShortageQty: demands.reduce((sum, item) => sum + item.totalShortageQty, 0),
    totalAllocatedQty: demands.reduce((sum, item) => sum + item.totalAllocatedQty, 0),
    totalRemainingQty: demands.reduce((sum, item) => sum + item.totalRemainingQty, 0)
  };

  return { demands, pools: poolsSnapshot, lineMap, summary, excludedIssueTaskLineIds: [] };
}

/** 分析指定缺料行的库存满足情况（调用 checkInventory，发料任务待发占用从缺料量与推荐池扣减） */
export async function loadShortageFulfillmentSimulation(
  options: ShortageFulfillmentSimulationOptions
): Promise<ShortageFulfillmentSimulationResult> {
  const pageLines = options.lines || [];
  const analyzableLines = filterAnalyzableShortageLines(pageLines);

  const demandMetaMap =
    options.demandMetaMap ??
    (pageLines.length ? buildDemandMetaMapFromLines(pageLines) : await fetchDemandMetaMap(options.query));

  const checkInventoryApi = options.checkInventoryApi ?? checkMaterialInventory;
  const checkInventoryGroupBy = options.checkInventoryGroupBy ?? 'workOrder';
  const checkPayloadMap = analyzableLines.length
    ? checkInventoryGroupBy === 'material'
      ? await fetchCheckInventoryPayloadsByMaterial(analyzableLines, checkInventoryApi)
      : await fetchCheckInventoryPayloadsByWorkOrder(analyzableLines, demandMetaMap, checkInventoryApi)
    : new Map<string, InventoryCheckResultVO>();

  const result = simulateShortageFulfillment(analyzableLines, checkPayloadMap, demandMetaMap, checkInventoryGroupBy);
  result.summary.pageLineCount = pageLines.length;
  result.summary.excludedByIssueTaskCount = 0;
  result.summary.zeroStockShortageRate = computeZeroStockShortageRateFromCheckInventory(analyzableLines, checkPayloadMap);
  result.summary.repeatMaterialRate = computeRepeatMaterialRateFromCheckInventory(analyzableLines, checkPayloadMap);
  result.excludedIssueTaskLineIds = [];
  return result;
}

export function shortageFulfillmentStatusLabel(status: ShortageFulfillmentStatus): string {
  const map: Record<ShortageFulfillmentStatus, string> = {
    FULL: '完全满足',
    PARTIAL: '部分满足',
    NONE: '完全缺料'
  };
  return map[status] || status;
}

export function formatShortageRecommendedInventory(
  items?: ShortageRecommendedInventoryItem[],
  fallbackUnit?: string
): string {
  if (!items?.length) return '-';
  return items
    .map((item) => {
      const wh = String(item.warehouseCode || '').trim();
      const loc = String(item.locationCode || '').trim();
      const batch = String(item.batchCode || '').trim();
      const unit = String(item.unit || fallbackUnit || '').trim();
      const qty = item.allocatedQty;
      const locText = [wh, loc].filter(Boolean).join('/');
      const batchText = batch ? ` 批${batch}` : '';
      const qtyText = unit ? `${qty} ${unit}` : String(qty);
      return `${locText || '-'}${batchText} ${qtyText}`.trim();
    })
    .join('；');
}

export function resolveShortageLineFulfillment(
  lineMap: Record<string, ShortageFulfillmentLineResult> | undefined,
  lineId?: number | string
): ShortageFulfillmentLineResult | undefined {
  if (!lineMap || lineId == null || lineId === '') return undefined;
  return lineMap[String(lineId)];
}

function buildShortageLocationRowKey(
  source: { warehouseCode?: string; locationCode?: string; batchCode?: string; inventoryDetailId?: string | number },
  index: number
): string {
  const wh = String(source.warehouseCode ?? '').trim();
  const loc = String(source.locationCode ?? '').trim();
  const batch = String(source.batchCode ?? '').trim();
  const id = String(source.inventoryDetailId ?? index).trim();
  return [wh, loc, batch, id].filter(Boolean).join('|');
}

/** 将库存池实际分配量覆盖到 checkInventory 推荐库位行（避免展示/生成备料使用原始 API 推荐量） */
function overlayAllocatedLocationRows(
  checkRows: MaterialLocationRow[] | undefined,
  allocatedRows: MaterialLocationRow[]
): MaterialLocationRow[] {
  if (!allocatedRows.length) {
    return checkRows?.map((row) => ({ ...row })) || [];
  }
  if (!checkRows?.length) {
    return allocatedRows.map((row) => ({ ...row }));
  }
  const allocatedByKey = new Map<string, MaterialLocationRow>();
  allocatedRows.forEach((row, index) => {
    const key = String(row.rowKey || buildShortageLocationRowKey(row, index)).trim();
    if (key) allocatedByKey.set(key, row);
  });
  const merged = checkRows.map((row, index) => {
    const key = String(row.rowKey || buildShortageLocationRowKey(row, index)).trim();
    const allocated = key ? allocatedByKey.get(key) : undefined;
    const qty = toNumber(allocated?.recommendedQty ?? allocated?.systemRecommendedQty ?? 0);
    if (qty <= 0) {
      return {
        ...row,
        recommendedQty: 0,
        systemRecommendedQty: 0,
        isRecommended: false
      };
    }
    return {
      ...row,
      recommendedQty: qty,
      systemRecommendedQty: qty,
      isRecommended: true
    };
  });
  allocatedRows.forEach((row, index) => {
    const key = String(row.rowKey || buildShortageLocationRowKey(row, index)).trim();
    if (!key || merged.some((item) => String(item.rowKey || '').trim() === key)) return;
    merged.push({ ...row });
  });
  return merged;
}

/** 缺料行实际可分配数量（与系统推荐弹窗分配合计一致） */
export function resolveShortageLineAllocatedQty(fulfillment: ShortageFulfillmentLineResult): number {
  if (fulfillment.manualLocationSelections?.length) {
    return fulfillment.manualLocationSelections.reduce((sum, loc) => sum + toNumber(loc.recommendedQty), 0);
  }
  if (fulfillment.recommendedInventories?.length) {
    return fulfillment.recommendedInventories.reduce((sum, item) => sum + toNumber(item.allocatedQty), 0);
  }
  return toNumber(fulfillment.poolAllocatedQty);
}

/** 缺料行生成备料/系统推荐共用的库位明细（库存池扣减后的分配量） */
export function resolveShortagePrepLocationRows(
  fulfillment: ShortageFulfillmentLineResult,
  line: ShortageTaskLineVO
): MaterialLocationRow[] {
  if (fulfillment.manualLocationSelections?.length) {
    return fulfillment.manualLocationSelections.filter((loc) => toNumber(loc.recommendedQty) > 0);
  }
  const allocatedRows = fulfillment.recommendedInventories?.length
    ? mapShortageRecommendedToLocationRows(fulfillment.recommendedInventories, line)
    : [];
  if (fulfillment.checkInventoryRecommendedLocations?.length) {
    return overlayAllocatedLocationRows(fulfillment.checkInventoryRecommendedLocations, allocatedRows);
  }
  return allocatedRows;
}

/** 将缺料分析推荐库存转为库位明细行（与 BOM checkInventory 推荐结构一致） */
export function mapShortageRecommendedToLocationRows(
  items: ShortageRecommendedInventoryItem[],
  line?: ShortageTaskLineVO
): MaterialLocationRow[] {
  return items.map((item, index) => {
    const qty = toNumber(item.allocatedQty);
    const rowKey = buildShortageLocationRowKey(
      {
        warehouseCode: item.warehouseCode,
        locationCode: item.locationCode,
        batchCode: item.batchCode,
        inventoryDetailId: item.inventoryDetailId
      },
      index
    );
    return {
      rowKey,
      warehouseCode: item.warehouseCode,
      locationCode: item.locationCode,
      batchCode: item.batchCode,
      availableQuantity: qty,
      inspectionQty: 0,
      blockedQty: 0,
      unit: item.unit || line?.unit,
      recommendedQty: qty,
      systemRecommendedQty: qty,
      isRecommended: qty > 0,
      fromCheckInventory: true,
      businessCode: item.businessCode,
      specialInventoryFlag: line ? resolvePrepRowInventoryFlag(line) : undefined
    };
  });
}

/** 构建缺料行库存状态展示数据（对齐 BOM 物料清单 InventoryStatus） */
export function buildShortageLineInventoryMaterial(
  line: ShortageTaskLineVO,
  options?: {
    fulfillment?: ShortageFulfillmentLineResult;
    analyzed?: boolean;
  }
): WorkOrderBomVO {
  const shortageQty = toNumber(line.shortageQty);
  const unit = String(line.unit || '').trim();
  const inventoryFlag = resolvePrepRowInventoryFlag(line);
  const partner = resolvePrepRowBusinessPartner(line);
  const so = resolvePrepRowSalesOrderFields(line);
  const base: WorkOrderBomVO = {
    id: Number(line.id) || 0,
    workOrderNo: String(line.workOrderNo || ''),
    componentMaterial: String(line.materialCode || ''),
    componentDesc: String(line.materialName || ''),
    componentQty: toNumber(line.componentQty),
    issuedQty: toNumber(line.issuedQty),
    unit,
    inventoryUnit: unit,
    issueQty: shortageQty > 0 ? shortageQty : toNumber(line.pendingQty),
    pendingQty: toNumber(line.pendingQty),
    salesOrderNo: so.salesOrderNo ?? line.salesOrderNo,
    salesOrderItem: so.salesOrderItem ?? line.salesOrderItem,
    businessCode: partner.businessCode ?? line.businessCode,
    businessName: partner.businessName ?? line.businessName,
    specialInventoryFlag: inventoryFlag
  };

  if (!options?.analyzed) {
    return base;
  }

  const fulfillment = options?.fulfillment;
  if (!fulfillment) {
    return base;
  }

  const coveredQty = resolveShortageLineAllocatedQty(fulfillment);
  return {
    ...base,
    issueQty: fulfillment.shortageQty > 0 ? fulfillment.shortageQty : base.issueQty,
    availableQty: coveredQty,
    effectiveAvailableQty: coveredQty,
    materialPoolQty: fulfillment.poolAvailableBefore
  };
}

function mapLocationRowsToRecommendedItems(locations: MaterialLocationRow[]): ShortageRecommendedInventoryItem[] {
  return locations
    .filter((loc) => toNumber(loc.recommendedQty) > 0)
    .map((loc) => {
      const locExtra = loc as MaterialLocationRow & { inventoryDetailId?: string | number; id?: string | number };
      return {
        inventoryDetailId: locExtra.inventoryDetailId ?? locExtra.id,
        warehouseCode: loc.warehouseCode,
        locationCode: loc.locationCode,
        batchCode: loc.batchCode,
        allocatedQty: toNumber(loc.recommendedQty),
        unit: loc.unit,
        businessCode: loc.businessCode
      };
    });
}

/** 系统推荐弹窗确认后，按用户选择的库位/数量回写可用量与缺料量 */
export function applyShortageFulfillmentLocationSelection(
  fulfillment: ShortageFulfillmentLineResult,
  line: ShortageTaskLineVO,
  payload: {
    locations: MaterialLocationRow[];
    recommendedLocations?: MaterialLocationRow[];
    overrideReason?: string;
  }
): ShortageFulfillmentLineResult {
  const shortageQty = toNumber(line.shortageQty);
  const normalizedLocations = payload.locations
    .filter((loc) => toNumber(loc.recommendedQty) > 0)
    .map((loc) => ({
      ...loc,
      recommendedQty: toNumber(loc.recommendedQty),
      locationSource: 'MANUAL' as const
    }));
  const poolAllocatedQty = normalizedLocations.reduce((sum, loc) => sum + toNumber(loc.recommendedQty), 0);
  const allocatedQty = poolAllocatedQty;
  const remainingQty = Math.max(0, shortageQty - poolAllocatedQty);
  const overrideReason = String(payload.overrideReason || '').trim() || undefined;
  return {
    ...fulfillment,
    poolAllocatedQty,
    allocatedQty,
    remainingQty,
    netShortageQty: shortageQty,
    recommendedInventories: mapLocationRowsToRecommendedItems(normalizedLocations),
    manualLocationSelections: normalizedLocations.length ? normalizedLocations : undefined,
    locationOverrideReason: overrideReason,
    checkInventoryRecommendedLocations: payload.recommendedLocations?.length
      ? payload.recommendedLocations.map((loc) => ({ ...loc }))
      : fulfillment.checkInventoryRecommendedLocations,
    fulfillmentStatus: resolveFulfillmentStatus(allocatedQty, shortageQty)
  };
}

/** 将缺料行转为发料工作台 BOM 行，供系统推荐抽屉使用 */
export function buildShortageLineBomMaterial(line: ShortageTaskLineVO, fulfillment?: ShortageFulfillmentLineResult): WorkOrderBomVO {
  const recommendedRows = fulfillment ? resolveShortagePrepLocationRows(fulfillment, line) : undefined;
  const recommendQty = toNumber(line.shortageQty) || toNumber(line.pendingQty);
  return {
    ...buildShortageLineInventoryMaterial(line, { fulfillment, analyzed: !!fulfillment }),
    issueQty: recommendQty,
    checkInventoryRecommendedLocations: recommendedRows,
    manualLocationSelections: fulfillment?.manualLocationSelections,
    locationOverrideReason: fulfillment?.locationOverrideReason
  };
}

/** 列表「缺料需求」展示：始终为原始缺料量，分析前后不变 */
export function resolveShortageLineDisplayDemandQty(line: ShortageTaskLineVO): number | string | undefined {
  return line.shortageQty;
}

/** 列表「缺料数量」展示：缺料需求 - 可用数量（分析后） */
export function resolveShortageLineDisplayRemainingQty(
  line: ShortageTaskLineVO,
  fulfillment?: ShortageFulfillmentLineResult
): number | string | undefined {
  if (!fulfillment) return undefined;
  const demand = toNumber(line.shortageQty);
  const available = resolveShortageLineAllocatedQty(fulfillment);
  return Math.max(0, demand - available);
}

/** 列表「可用数量」展示：未分析前为 0，分析后为 checkInventory 可分配量 */
export function resolveShortageLineDisplayAvailableQty(
  line: ShortageTaskLineVO,
  fulfillment?: ShortageFulfillmentLineResult
): number | string | undefined {
  if (!fulfillment) {
    return 0;
  }
  return resolveShortageLineAllocatedQty(fulfillment);
}

export function canOpenShortageRecommendDrawer(
  lineMap: Record<string, ShortageFulfillmentLineResult> | undefined,
  line: ShortageTaskLineVO
): boolean {
  return !!resolveShortageLineFulfillment(lineMap, line.id);
}

function resolveLocationWarehouseRoute(loc: MaterialLocationRow): 'AUTO' | 'LINE' | 'FLAT' {
  if (loc.isAutoWarehouse) return 'AUTO';
  if (loc.isLineWarehouse) return 'LINE';
  return 'FLAT';
}

function isShortageFulfillmentUserSelected(fulfillment: ShortageFulfillmentLineResult): boolean {
  if (String(fulfillment.locationOverrideReason || '').trim()) {
    return true;
  }
  return !!fulfillment.manualLocationSelections?.some((loc) => toNumber(loc.recommendedQty) > 0);
}

function resolveShortagePrepRecommendationSource(
  fulfillment: ShortageFulfillmentLineResult,
  loc: MaterialLocationRow
): typeof PREP_LOCATION_REC_USER_SELECTED | typeof PREP_LOCATION_REC_SYSTEM_RECOMMENDED {
  if (loc.locationSource) {
    return mapLocationSourceToRecommendationSource(loc.locationSource);
  }
  return isShortageFulfillmentUserSelected(fulfillment)
    ? PREP_LOCATION_REC_USER_SELECTED
    : PREP_LOCATION_REC_SYSTEM_RECOMMENDED;
}

/** 平面仓备料是否缺少目标需求库位 */
export function findShortagePrepItemsMissingTargetLocation(items: PrepDemandLineItem[]): PrepDemandLineItem[] {
  return items.filter(
    (item) =>
      item.lineType === 'LOCATION' &&
      item.warehouseRoute === 'FLAT' &&
      !String(item.targetDemandLocationCode || '').trim()
  );
}

/** 为平面仓备料行写入目标需求库位 */
export function applyTargetDemandLocationToShortagePrepItems(
  items: PrepDemandLineItem[],
  selection: { locationCode: string; warehouseCode?: string }
): PrepDemandLineItem[] {
  const locationCode = String(selection.locationCode || '').trim();
  const warehouseCode = String(selection.warehouseCode || '').trim() || undefined;
  if (!locationCode) return items;
  return items.map((item) =>
    item.lineType === 'LOCATION'
      ? {
          ...item,
          targetDemandLocationCode: locationCode,
          targetDemandWarehouseCode: warehouseCode || locationCode
        }
      : item
  );
}

function resolveShortagePrepTargetDemandLocation(
  line: ShortageTaskLineVO,
  fulfillment?: ShortageFulfillmentLineResult,
  demandMeta?: ShortageTaskDemandGroupVO
): { targetDemandLocationCode?: string; targetDemandWarehouseCode?: string } {
  const targetDemandLocationCode =
    String(fulfillment?.targetDemandLocationCode || '').trim() ||
    String(line.targetDemandLocationCode || '').trim() ||
    String(demandMeta?.targetDemandLocationCode || '').trim() ||
    undefined;
  if (!targetDemandLocationCode) {
    return {};
  }
  const targetDemandWarehouseCode =
    String(fulfillment?.targetDemandWarehouseCode || '').trim() ||
    String(line.targetDemandWarehouseCode || '').trim() ||
    String(demandMeta?.targetDemandWarehouseCode || '').trim() ||
    targetDemandLocationCode;
  return { targetDemandLocationCode, targetDemandWarehouseCode };
}

export function resolveShortageDemandMetaForLine(
  result: ShortageFulfillmentSimulationResult | null | undefined,
  line: ShortageTaskLineVO
): ShortageTaskDemandGroupVO | undefined {
  if (!result) return undefined;
  const demandNo = String(line.demandNo || '').trim();
  const demandId = String(line.demandId || '').trim();
  const demand = result.demands.find(
    (item) =>
      (demandNo && String(item.demandNo || '').trim() === demandNo) ||
      (demandId && String(item.demandId || '').trim() === demandId)
  );
  if (!demand) return undefined;
  return {
    demandId: demand.demandId,
    demandNo: demand.demandNo,
    materialUserCode: demand.materialUserCode,
    materialUserName: demand.materialUserName,
    targetDemandLocationCode: demand.targetDemandLocationCode,
    targetDemandWarehouseCode: demand.targetDemandWarehouseCode
  };
}

/** 根据库存分析结果构建补充库位备料明细 */
export function buildShortageGeneratePrepItems(
  line: ShortageTaskLineVO,
  fulfillment: ShortageFulfillmentLineResult,
  demandMeta?: ShortageTaskDemandGroupVO
): PrepDemandLineItem[] {
  const locations = resolveShortagePrepLocationRows(fulfillment, line);

  const partner = resolvePrepRowBusinessPartner(line);
  const reserveNo = String(line.reserveNo || '').trim();
  const reserveItemNo = String(line.reserveItemNo || '').trim();
  if (!reserveNo || !reserveItemNo) {
    return [];
  }

  const recommendationReason = String(fulfillment.locationOverrideReason || '').trim() || undefined;
  const { targetDemandLocationCode, targetDemandWarehouseCode } = resolveShortagePrepTargetDemandLocation(
    line,
    fulfillment,
    demandMeta
  );

  return locations
    .map((loc) => {
      const prepQty = toNumber(loc.recommendedQty ?? loc.systemRecommendedQty ?? 0);
      if (prepQty <= 0) return null;
      const warehouseRoute = resolveLocationWarehouseRoute(loc);
      const recommendationSource = resolveShortagePrepRecommendationSource(fulfillment, loc);
      return {
        workOrderNo: String(line.workOrderNo || ''),
        materialCode: String(line.materialCode || ''),
        reserveNo,
        reserveItemNo,
        prepQty,
        warehouseCode: loc.warehouseCode,
        locationCode: loc.locationCode,
        batchCode: loc.batchCode,
        lineType: 'LOCATION' as const,
        warehouseRoute,
        recommendationSource,
        recommendationReason: recommendationSource === PREP_LOCATION_REC_USER_SELECTED ? recommendationReason : undefined,
        specialInventoryFlag: resolvePrepRowInventoryFlag(line),
        businessCode: loc.businessCode ?? partner.businessCode,
        businessName: loc.businessName ?? partner.businessName,
        ...(targetDemandLocationCode
          ? { targetDemandLocationCode, targetDemandWarehouseCode }
          : {})
      } satisfies PrepDemandLineItem;
    })
    .filter((item): item is PrepDemandLineItem => !!item);
}

export function canGenerateShortagePrep(
  lineMap: Record<string, ShortageFulfillmentLineResult> | undefined,
  line: ShortageTaskLineVO
): boolean {
  const fulfillment = resolveShortageLineFulfillment(lineMap, line.id);
  if (!fulfillment || fulfillment.poolAllocatedQty <= 0) return false;
  return buildShortageGeneratePrepItems(line, fulfillment).length > 0;
}

export function shortageFulfillmentStatusTag(status: ShortageFulfillmentStatus): 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<ShortageFulfillmentStatus, 'success' | 'warning' | 'danger'> = {
    FULL: 'success',
    PARTIAL: 'warning',
    NONE: 'danger'
  };
  return map[status] || 'info';
}

export type {
  ShortageFulfillmentDemandResult,
  ShortageFulfillmentLineResult,
  ShortageCheckInventoryGroupBy,
  ShortageCheckInventoryRequest,
  ShortageFulfillmentSimulationOptions,
  ShortageFulfillmentSimulationResult,
  ShortageFulfillmentStatus,
  ShortageInventoryPoolSnapshot,
  ShortageRecommendedInventoryItem,
  ShortageTaskDemandGroup,
  ShortageTaskDemandGroupVO,
  ShortageTaskGeneratePrepRequest,
  ShortageTaskGeneratePrepResult,
  ShortageTaskLineVO,
  ShortageTaskQuery
} from './types';
