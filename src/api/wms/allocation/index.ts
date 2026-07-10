import request from '@/utils/request';
import { getDicts } from '@/api/system/dict/data';
import { useDictStore } from '@/store/modules/dict';
import { mapLocationSourceToRecommendationSource, PREP_LOCATION_REC_SYSTEM_RECOMMENDED } from '@/api/wms/workOrderPrepDemand/locationSource';
import type { MaterialUnitConversionVO } from '@/api/wms/materialUnitConversion/types';
import type { AllocationRequest, AllocationGenerateResult, AllocationPlanVO, AllocationDetailVO, AllocationPlanDetailVO, BomIssueRow, BomRecommendPickItem, BomLineResult, ClassifiedMaterialRow, ClassifyWorkOrdersResult, InventoryCheckRequest, InventoryCheckResultVO, InventoryCheckStatus, InventoryTreeNode, IssueUnitOption, LocationRec, MaterialDemandDetailRow, MaterialLocationRow, PartSizeType, SalesOrderInventoryConstraint, WarehouseRoute, WarehouseRouteContext, WorkOrderMaterialIssueLine, WorkOrderVO } from './types';

/** 生成单一分配方案 / 备料需求（工作台） */
export function generateAllocation(data: AllocationRequest) {
  return request<AllocationGenerateResult | AllocationPlanVO>({
    url: '/wms/materialIssueWorkbench/generate',
    method: 'post',
    data
  }).then((res: any) => {
    if (res.code === 200 && res.data) {
      if (res.data.demand != null || res.data.success != null) {
        return { ...res, data: res.data as AllocationGenerateResult };
      }
      if (res.data.plan) {
        return { ...res, data: res.data.plan as AllocationPlanVO };
      }
    }
    return res;
  });
}

/** 生成多种分配方案 */
export function generateMultiplePlans(data: AllocationRequest) {
  return request({
    url: '/wms/allocation/generateMultiplePlans',
    method: 'post',
    data
  });
}

/** 获取方案详情 */
export function getPlanDetail(planId: number | string) {
  return request({
    url: `/wms/allocation/planDetail/${planId}`,
    method: 'get'
  });
}

/** 确认分配方案 */
export function confirmAllocationPlan(planId: number | string, operator: string) {
  return request({
    url: `/wms/allocation/confirmPlan/${planId}`,
    method: 'put',
    params: { operator }
  });
}

/** 执行分配方案 */
export function executeAllocationPlan(planId: number | string, operator: string) {
  return request({
    url: `/wms/allocation/executePlan/${planId}`,
    method: 'post',
    params: { operator }
  });
}

/** 执行前检查 */
export function preCheckExecution(data: Record<string, unknown>) {
  return request({
    url: '/wms/allocation/preCheckExecution',
    method: 'post',
    data
  });
}

/** 检查物料库存 */
export function checkMaterialInventory(data: InventoryCheckRequest) {
  return request<InventoryCheckResultVO>({
    url: `/wms/inventoryDetail/checkInventory`,
    method: 'post',
    data
  });
}

/** 方案对比 */
export function comparePlans(planIds: (number | string)[]) {
  return request({
    url: '/wms/allocation/comparePlans',
    method: 'post',
    data: planIds
  });
}

/** 发料单预览 */
export function getMaterialIssuePreview(issueId: number | string) {
  return request({
    url: '/wms/allocation/materialIssuePreview',
    method: 'post',
    data: { issueId, includeBatchDetails: true, includeLocationDetails: true, includeMaterialDetails: true }
  });
}

import { listWorkOrder } from '@/api/wms/workOrder';
import { listWorkOrderBom } from '@/api/wms/workOrderBom';

/** 兼容旧页面：获取方案明细列表 */
export async function getPlanDetailList(planId: number | string) {
  const res = await getPlanDetail(planId);
  if (res.data?.allocationDetails) {
    return { ...res, data: res.data.allocationDetails };
  }
  return res;
}

/** 兼容：默认单一备料；仅当 generateMultiple === true 时生成多份 */
export function generateAllocationCompat(data: AllocationRequest) {
  if (data.generateMultiple === true) {
    return generateMultiplePlans(data);
  }
  return generateAllocation({
    ...data,
    generateMultiple: false
  });
}

/** 兼容旧方法名 */
export const confirmAllocation = confirmAllocationPlan;
export const executeAllocation = executeAllocationPlan;

export function getMaterialInventory(materialCode: string) {
  return request({
    url: `/wms/inventoryDetail/materialInventory/${materialCode}`,
    method: 'get'
  });
}

export function getMaterialLocations(materialCode: string) {
  return getMaterialInventory(materialCode);
}

export function getMaterialBatches(materialCode: string) {
  return getMaterialInventory(materialCode);
}

export function getWorkOrderBom(workOrderNo: string) {
  return listWorkOrderBom({ workOrderNo, pageNum: 1, pageSize: 500 } as any).then((res: any) => ({
    ...res,
    data: res.rows || []
  }));
}

export function getWorkOrderByNo(workOrderNo: string) {
  return listWorkOrder({ workOrderNo, pageNum: 1, pageSize: 1 } as any).then((res: any) => {
    const row = res.rows?.[0] || res.data?.[0];
    return { ...res, data: row };
  });
}

const AllocationApi = {
  generateAllocation: generateAllocationCompat,
  generateMultiplePlans,
  getPlanDetail: getPlanDetailList,
  confirmAllocation: confirmAllocationPlan,
  executeAllocation: executeAllocationPlan,
  preCheckExecution,
  checkMaterialInventory,
  comparePlans,
  getMaterialIssuePreview,
  getMaterialInventory,
  getMaterialLocations,
  getMaterialBatches,
  getWorkOrderBom,
  getWorkOrderByNo
};

export default AllocationApi;

export type { AllocationPlanDetailVO, AllocationDetailVO, AllocationPlanVO };

// ---------- allocation domain helpers ----------

// ----- locationMeta.ts -----
/**
 * 从库位编码或推荐行解析仓库、库区信息
 */
export function resolveLocationMeta(locationCode?: string, rec?: { warehouseCode?: string; areaCode?: string; locationName?: string }) {
  if (rec?.warehouseCode) {
    return {
      warehouseCode: rec.warehouseCode,
      areaCode: rec.areaCode || '-'
    };
  }
  const code = (locationCode || '').trim();
  if (!code || code === '-') {
    return { warehouseCode: '-', areaCode: '-' };
  }
  const parts = code.split(/[-_/]/).filter(Boolean);
  return {
    warehouseCode: parts[0] || code,
    areaCode: parts[1] || '-'
  };
}

// ----- locationInventory.ts -----
function pickNum(...values: unknown[]) {
  for (const v of values) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function pickStr(...values: unknown[]) {
  for (const v of values) {
    const s = String(v ?? '').trim();
    if (s) return s;
  }
  return '';
}

function pickBool(...values: unknown[]): boolean | undefined {
  for (const v of values) {
    if (v === true || v === 1 || v === '1' || v === 'true' || v === 'Y' || v === 'y') return true;
    if (v === false || v === 0 || v === '0' || v === 'false' || v === 'N' || v === 'n') return false;
  }
  return undefined;
}

export function buildRowKey(row: Record<string, unknown>, index: number) {
  const parts = [row.warehouseCode, row.areaCode, row.locationCode, row.batchCode].map((v) => String(v ?? '').trim()).filter(Boolean);
  const flag = String(row.specialInventoryFlag ?? '')
    .trim()
    .toUpperCase();
  if (flag && flag !== 'N') {
    const businessCode = String(row.businessCode ?? '').trim();
    const businessName = String(row.businessName ?? '').trim();
    if (businessCode) parts.push(businessCode);
    if (businessName) parts.push(businessName);
    parts.push(flag);
  }
  return parts.length ? parts.join('|') : `row-${index}`;
}

/** 库位分配扣减/他人线边仓池的稳定键（与 buildRowKey 一致） */
export function resolveLocationPickKey(loc: Record<string, unknown>, index = 0): string {
  const direct = String(loc.rowKey ?? '').trim();
  if (direct) return direct;
  return buildRowKey(
    {
      warehouseCode: loc.warehouseCode,
      areaCode: loc.areaCode,
      locationCode: loc.locationCode ?? loc.location,
      batchCode: loc.batchCode ?? loc.batchNo
    },
    index
  );
}

function resolveCheckApiRecommendedQty(row: Pick<MaterialLocationRow, 'fromCheckInventory' | 'systemRecommendedQty' | 'recommendedQty'>): number | undefined {
  if (!row.fromCheckInventory) return undefined;
  if (row.systemRecommendedQty !== undefined) {
    const n = Number(row.systemRecommendedQty);
    return Number.isFinite(n) ? Math.max(0, n) : undefined;
  }
  if (row.recommendedQty !== undefined) {
    const n = Number(row.recommendedQty);
    return Number.isFinite(n) ? Math.max(0, n) : undefined;
  }
  return undefined;
}

/** 深拷贝库位行供 FIFO/弹窗使用（重置分配标记，保留库存数量） */
export function cloneMaterialLocationRows(rows: MaterialLocationRow[]): MaterialLocationRow[] {
  return rows.map((r) => ({
    ...r,
    availableQuantity: Number(r.availableQuantity ?? 0),
    inspectionQty: Number(r.inspectionQty ?? 0),
    blockedQty: Number(r.blockedQty ?? 0),
    recommendedQty: undefined,
    isRecommended: false,
    systemRecommendedQty: r.fromCheckInventory ? (r.systemRecommendedQty !== undefined ? r.systemRecommendedQty : r.recommendedQty) : undefined
  }));
}

function splitStockQty(raw: Record<string, unknown>, availableQuantity: number) {
  const status = pickStr(raw.stockStatus, raw.inventoryStatus, raw.status).toUpperCase();
  const inspection = pickNum(raw.inspectionQty, raw.qualityInspectionQty, raw.qiQty);
  const blocked = pickNum(raw.blockedQty, raw.frozenQty);
  if (status.includes('QUALITY') || status.includes('INSPECTION') || status === 'QI') {
    return { unrestricted: 0, inspection: availableQuantity || inspection, blocked: 0 };
  }
  if (status.includes('BLOCK') || status.includes('FROZEN') || status.includes('FREEZE')) {
    return { unrestricted: 0, inspection: 0, blocked: availableQuantity || blocked };
  }
  if (inspection > 0 || blocked > 0) {
    return {
      unrestricted: Math.max(0, availableQuantity - inspection - blocked),
      inspection,
      blocked
    };
  }
  return { unrestricted: availableQuantity, inspection: 0, blocked: 0 };
}

/** 从 /materialInventory 等响应中提取库位列表 */
export function extractMaterialInventoryList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  const record = data as Record<string, unknown>;
  for (const key of ['locations', 'locationList', 'rows', 'list', 'data']) {
    const val = record[key];
    if (Array.isArray(val)) return val;
  }
  return [];
}

export function normalizeMaterialInventoryResponse(data: unknown): MaterialLocationRow[] {
  return normalizeMaterialLocationRows(extractMaterialInventoryList(data));
}

function inferSpecialInventoryFlag(fields: { specialInventoryFlag?: string; businessCode?: string; salesOrderNo?: string }): string | undefined {
  const existing = String(fields.specialInventoryFlag ?? '')
    .trim()
    .toUpperCase();
  if (existing) return existing;
  if (fields.salesOrderNo) return 'E';
  const code = String(fields.businessCode ?? '').trim();
  if (code && /[-/]/.test(code)) return 'E';
  return undefined;
}

export function normalizeMaterialLocationRows(raw: unknown): MaterialLocationRow[] {
  const list = Array.isArray(raw) ? raw : [];
  return list.map((item, index) => {
    const row = item as Record<string, unknown>;
    const availableQuantity = pickNum(row.availableQuantity, row.availableQty, row.qty, row.onHandQty);
    const stock = splitStockQty(row, availableQuantity);
    const businessCode = pickStr(row.businessCode, row.vendorCode, row.customerCode) || undefined;
    const businessName = pickStr(row.businessName, row.businessPartner) || undefined;
    const specialInventoryFlagRaw = pickStr(row.specialInventoryFlag, row.inventorySpecialFlag) || undefined;
    const soFields = resolveSalesOrderFieldsFromLocation({
      salesOrderNo: pickStr(row.salesOrderNo) || undefined,
      salesOrderItem: pickStr(row.salesOrderItem, row.salesOrderLine, row.soItem) || undefined,
      businessCode,
      businessName,
      businessPartner: pickStr(row.businessPartner) || undefined,
      specialInventoryFlag: specialInventoryFlagRaw
    });
    const specialInventoryFlag =
      inferSpecialInventoryFlag({
        specialInventoryFlag: specialInventoryFlagRaw,
        businessCode,
        salesOrderNo: soFields.salesOrderNo
      }) || undefined;
    const recommendedQtyRaw = row.recommendedQty ?? row.recommendedQuantity ?? row.allocatedQuantity ?? row.allocateQty ?? row.pickQty;
    const recommendedQty = recommendedQtyRaw != null ? pickNum(recommendedQtyRaw) : undefined;
    const normalizedRow = {
      warehouseCode: pickStr(row.warehouseCode, row.whCode) || undefined,
      areaCode: pickStr(row.areaCode) || undefined,
      locationCode: pickStr(row.locationCode, row.location) || undefined,
      batchCode: pickStr(row.batchCode, row.batchNo) || undefined,
      specialInventoryFlag,
      businessCode,
      businessName
    };
    return {
      rowKey: buildRowKey(normalizedRow, index),
      warehouseCode: pickStr(row.warehouseCode, row.whCode) || undefined,
      warehouseName: pickStr(row.warehouseName, row.warehouseDesc) || undefined,
      areaCode: pickStr(row.areaCode) || undefined,
      locationCode: pickStr(row.locationCode, row.location) || undefined,
      batchCode: pickStr(row.batchCode, row.batchNo) || undefined,
      receivedDate: pickStr(row.receivedDate, row.receiveDate, row.grDate, row.inboundDate, row.productionDate) || undefined,
      availableQuantity,
      inspectionQty: stock.inspection,
      blockedQty: stock.blocked,
      unit: pickStr(row.unit) || undefined,
      fifoSequence: pickNum(row.fifoSequence, row.sequence, row.priority, 999),
      isLineWarehouse: pickBool(row.isLineWarehouse, row.isOtherLineWarehouse),
      isUserLineWarehouse: pickBool(row.isUserLineWarehouse),
      isAutoWarehouse: pickBool(row.isAutoWarehouse),
      specialInventoryFlag,
      businessCode,
      businessName,
      salesOrderNo: soFields.salesOrderNo,
      salesOrderItem: soFields.salesOrderItem,
      recommendedQty: recommendedQty && recommendedQty > 0 ? recommendedQty : undefined
    };
  });
}

export function resolveLocationPickAvailableQty(row: MaterialLocationRow): number {
  const unrestricted = Math.max(0, row.availableQuantity - row.inspectionQty - row.blockedQty);
  const fromStock = unrestricted > 0 ? unrestricted : Number(row.availableQuantity ?? 0);
  if (!row.fromCheckInventory) return fromStock;
  const apiQty = resolveCheckApiRecommendedQty(row);
  if (fromStock > 0) return fromStock;
  if (apiQty != null && apiQty > 0) return apiQty;
  return fromStock;
}

export function normalizeCheckInventoryLocationRows(raw: unknown): MaterialLocationRow[] {
  return normalizeMaterialLocationRows(raw).map((row) => {
    const apiQty = row.recommendedQty;
    let availableQuantity = row.availableQuantity;
    if (availableQuantity <= 0 && apiQty != null && apiQty > 0) {
      availableQuantity = apiQty;
    }
    return { ...row, availableQuantity, fromCheckInventory: true };
  });
}

export function isNonUserLineWarehouse(row: Pick<MaterialLocationRow, 'isLineWarehouse' | 'isUserLineWarehouse'>): boolean {
  return row.isLineWarehouse === true && row.isUserLineWarehouse === false;
}

export function hasOtherLineWarehouseStock(row: MaterialLocationRow): boolean {
  if (!isNonUserLineWarehouse(row)) return false;
  const unrestricted = Math.max(0, row.availableQuantity - row.inspectionQty - row.blockedQty);
  return unrestricted > 0 || Number(row.availableQuantity ?? 0) > 0;
}

export function isAllocatableLocationRow(row: MaterialLocationRow): boolean {
  return true;
}

/** 汇总所有库位行的非限制库存 */
export function sumAllocatablePoolQty(rows: MaterialLocationRow[]): number {
  return rows.reduce((sum, row) => {
    return sum + resolveLocationPickAvailableQty(row);
  }, 0);
}

/** 按 checkInventory 推荐库位顺序及 API 推荐数量分配 */
export function recommendLocationsFromCheckApi(rows: MaterialLocationRow[], demandQty: number, options?: { canAllocate?: (row: MaterialLocationRow) => boolean }) {
  const canAllocate = options?.canAllocate ?? (() => true);
  const demand = Math.max(0, Number(demandQty));
  let remaining = demand;
  const recommendedKeys = new Set<string>();
  const recommendedRows: MaterialLocationRow[] = [];
  const useApiQty = rows.some((r) => r.fromCheckInventory);

  for (const row of rows) {
    const available = resolveLocationPickAvailableQty(row);

    if (!canAllocate(row)) {
      row.recommendedQty = 0;
      row.isRecommended = false;
      continue;
    }

    if (remaining <= 0) {
      row.recommendedQty = 0;
      row.isRecommended = false;
      continue;
    }

    const apiQty = useApiQty && row.fromCheckInventory ? resolveCheckApiRecommendedQty(row) : undefined;
    if (useApiQty && row.fromCheckInventory && apiQty === 0) {
      row.recommendedQty = 0;
      row.isRecommended = false;
      continue;
    }

    if (available <= 0 && !(apiQty != null && apiQty > 0)) {
      row.recommendedQty = 0;
      row.isRecommended = false;
      continue;
    }

    const pickQty = apiQty != null && apiQty > 0 ? Math.min(remaining, apiQty, available > 0 ? available : apiQty) : Math.min(remaining, available);
    row.recommendedQty = pickQty;
    row.isRecommended = pickQty > 0;
    if (pickQty > 0) {
      recommendedKeys.add(row.rowKey);
      recommendedRows.push({
        ...row,
        recommendedQty: pickQty,
        isRecommended: true,
        systemRecommendedQty: apiQty ?? pickQty
      });
      remaining -= pickQty;
    }
  }

  rows.forEach((row) => {
    if (!recommendedKeys.has(row.rowKey)) {
      row.recommendedQty = 0;
      row.isRecommended = false;
    }
  });

  if (useApiQty && !recommendedRows.length && demand > 0) {
    const fallback = buildCheckInventoryFifoFallback(rows, demand, options);
    fallback.forEach((row) => {
      recommendedKeys.add(row.rowKey);
      recommendedRows.push(row);
      remaining = Math.max(0, remaining - Number(row.recommendedQty ?? 0));
    });
  }

  return {
    recommendedKeys,
    recommendedRows,
    otherLineDisplayRows: [],
    shortageQty: Math.max(0, remaining)
  };
}

/** checkInventory 已返回推荐量但二次分配为空时，直接按 API 推荐量回填 FIFO */
function buildCheckInventoryFifoFallback(
  rows: MaterialLocationRow[],
  cap: number,
  options?: { canAllocate?: (row: MaterialLocationRow) => boolean }
): MaterialLocationRow[] {
  const canAllocate = options?.canAllocate ?? (() => true);
  let remaining = Math.max(0, Number(cap));
  const result: MaterialLocationRow[] = [];
  rows.forEach((row) => {
    if (remaining <= 0) return;
    if (!canAllocate(row)) return;
    const apiQty = resolveCheckApiRecommendedQty(row);
    if (!apiQty || apiQty <= 0) return;
    const pickQty = Math.min(remaining, apiQty);
    if (pickQty <= 0) return;
    result.push({
      ...row,
      recommendedQty: pickQty,
      isRecommended: true,
      systemRecommendedQty: apiQty
    });
    remaining -= pickQty;
  });
  return result;
}

export function shouldUseCheckInventoryRecommend(rows: MaterialLocationRow[]): boolean {
  return rows.some((r) => r.fromCheckInventory || r.isUserLineWarehouse !== undefined);
}

function sumNodes(rows: MaterialLocationRow[]) {
  return rows.reduce(
    (acc, row) => {
      const unrestricted = Math.max(0, row.availableQuantity - row.inspectionQty - row.blockedQty);
      acc.unrestrictedQty += unrestricted > 0 ? unrestricted : row.availableQuantity;
      acc.inspectionQty += row.inspectionQty;
      acc.blockedQty += row.blockedQty;
      return acc;
    },
    { unrestrictedQty: 0, inspectionQty: 0, blockedQty: 0 }
  );
}

function formatNodeLabel(code?: string, name?: string, fallback?: string) {
  const c = String(code || '').trim();
  const n = String(name || '').trim();
  if (c && n && c !== n) return `${c} ${n}`;
  return c || n || fallback || '-';
}

function upsertChild(parent: InventoryTreeNode, child: InventoryTreeNode): InventoryTreeNode {
  parent.children = parent.children || [];
  const existing = parent.children.find((c) => c.rowKey === child.rowKey);
  if (existing) {
    if (child.isLeaf && existing.isLeaf) {
      parent.children.push(child);
      parent.unrestrictedQty += child.unrestrictedQty;
      parent.inspectionQty += child.inspectionQty;
      parent.blockedQty += child.blockedQty;
      parent.recommendedQty = Number(parent.recommendedQty || 0) + Number(child.recommendedQty || 0);
      parent.isRecommended = parent.isRecommended || child.isRecommended;
      return child;
    }
    existing.unrestrictedQty += child.unrestrictedQty;
    existing.inspectionQty += child.inspectionQty;
    existing.blockedQty += child.blockedQty;
    existing.recommendedQty = Number(existing.recommendedQty || 0) + Number(child.recommendedQty || 0);
    existing.isRecommended = existing.isRecommended || child.isRecommended;
    return existing;
  }
  parent.children.push(child);
  parent.unrestrictedQty += child.unrestrictedQty;
  parent.inspectionQty += child.inspectionQty;
  parent.blockedQty += child.blockedQty;
  parent.recommendedQty = Number(parent.recommendedQty || 0) + Number(child.recommendedQty || 0);
  return child;
}

export function buildInventoryTree(rows: MaterialLocationRow[]): InventoryTreeNode[] {
  const totals = sumNodes(rows);
  const root: InventoryTreeNode = {
    rowKey: 'total',
    label: '汇总',
    level: 'total',
    ...totals,
    children: []
  };

  rows.forEach((row) => {
    const unrestricted = resolveLocationPickAvailableQty(row);
    const leaf: InventoryTreeNode = {
      rowKey: row.rowKey,
      label: formatNodeLabel(row.locationCode, undefined, '\u672a\u77e5\u5e93\u4f4d'),
      level: 'location',
      unrestrictedQty: unrestricted,
      inspectionQty: row.inspectionQty,
      blockedQty: row.blockedQty,
      batchCode: row.batchCode,
      receivedDate: row.receivedDate,
      recommendedQty: row.recommendedQty,
      isRecommended: row.isRecommended,
      specialInventoryFlag: row.specialInventoryFlag,
      businessCode: row.businessCode,
      isLeaf: true,
      sourceRow: row
    };

    const whKey = `wh|${row.warehouseCode || '__unknown__'}`;
    const whNode: InventoryTreeNode = {
      rowKey: whKey,
      label: formatNodeLabel(row.warehouseCode, row.warehouseName, '\u672a\u77e5\u4e93\u5e93'),
      level: 'warehouse',
      unrestrictedQty: 0,
      inspectionQty: 0,
      blockedQty: 0
    };
    upsertChild(upsertChild(root, whNode), leaf);
  });

  return [root];
}

export function deductLocationPicksFromStock(rows: MaterialLocationRow[], picks: Array<{ rowKey?: string; recommendedQty?: number }>) {
  const pickMap = new Map<string, number>();
  picks.forEach((pick) => {
    const key = String(pick.rowKey || '').trim();
    if (!key) return;
    pickMap.set(key, (pickMap.get(key) ?? 0) + Number(pick.recommendedQty ?? 0));
  });
  rows.forEach((row) => {
    const deduct = pickMap.get(row.rowKey) ?? 0;
    if (deduct > 0) {
      row.availableQuantity = Math.max(0, Number(row.availableQuantity ?? 0) - deduct);
    }
  });
}

export function recommendLocationsByFifo(rows: MaterialLocationRow[], demandQty: number, options?: { canAllocate?: (row: MaterialLocationRow) => boolean }) {
  const canAllocate = options?.canAllocate ?? (() => true);
  const demand = Math.max(0, Number(demandQty));
  let remaining = demand;
  const sorted = [...rows]
    .filter((row) => {
      if (!canAllocate(row)) return false;
      const unrestricted = Math.max(0, row.availableQuantity - row.inspectionQty - row.blockedQty);
      return unrestricted > 0;
    })
    .sort((a, b) => {
      const dateA = Date.parse(String(a.receivedDate || '')) || Number.MAX_SAFE_INTEGER;
      const dateB = Date.parse(String(b.receivedDate || '')) || Number.MAX_SAFE_INTEGER;
      if (dateA !== dateB) return dateA - dateB;
      return Number(a.fifoSequence ?? 999) - Number(b.fifoSequence ?? 999);
    });

  const recommendedKeys = new Set<string>();
  const recommendedRows: MaterialLocationRow[] = [];

  sorted.forEach((row) => {
    const unrestricted = Math.max(0, row.availableQuantity - row.inspectionQty - row.blockedQty);
    if (remaining <= 0 || unrestricted <= 0) {
      row.recommendedQty = 0;
      row.isRecommended = false;
      return;
    }
    const pickQty = Math.min(remaining, unrestricted);
    row.recommendedQty = pickQty;
    row.isRecommended = pickQty > 0;
    if (pickQty > 0) {
      recommendedKeys.add(row.rowKey);
      recommendedRows.push({ ...row, recommendedQty: pickQty, isRecommended: true });
      remaining -= pickQty;
    }
  });

  rows.forEach((row) => {
    if (!recommendedKeys.has(row.rowKey)) {
      row.recommendedQty = 0;
      row.isRecommended = false;
    }
  });

  return { recommendedKeys, recommendedRows, shortageQty: Math.max(0, remaining) };
}

export function clampPickQty(unrestricted: number, qty?: number) {
  const max = Math.max(0, Number(unrestricted));
  const n = Number(qty ?? 0);
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.min(max, Math.round(n * 10000) / 10000);
}

export function sumPickQty(rows: Array<{ recommendedQty?: number }>) {
  return rows.reduce((sum, row) => sum + Number(row.recommendedQty ?? 0), 0);
}

export function recalcTreePickTotals(nodes: InventoryTreeNode[]) {
  const walk = (list: InventoryTreeNode[]) => {
    list.forEach((node) => {
      if (node.isLeaf) return;
      node.recommendedQty = 0;
      node.children?.forEach((child) => {
        walk([child]);
        if (child.isLeaf) {
          node.recommendedQty = Number(node.recommendedQty || 0) + Number(child.recommendedQty || 0);
        }
      });
    });
  };
  walk(nodes);
}

export function collectLeafNodes(nodes: InventoryTreeNode[]): InventoryTreeNode[] {
  const leaves: InventoryTreeNode[] = [];
  const walk = (list: InventoryTreeNode[]) => {
    list.forEach((node) => {
      if (node.isLeaf) leaves.push(node);
      else if (node.children?.length) walk(node.children);
    });
  };
  walk(nodes);
  return leaves;
}

// ----- salesOrderInventory.ts -----
export function normalizeSalesOrderItem(item?: string | number | null): string {
  const raw = String(item ?? '').trim();
  if (!raw) return '';
  const n = Number(raw);
  if (!Number.isNaN(n)) return String(n);
  return raw.replace(/^0+/, '') || raw;
}

export function parseSalesOrderBusinessCode(businessCode?: string): { salesOrderNo?: string; salesOrderItem?: string } {
  const code = String(businessCode ?? '').trim();
  if (!code) return {};
  const split = code.split(/[-/]/);
  if (split.length >= 2) {
    return {
      salesOrderNo: split[0].trim(),
      salesOrderItem: normalizeSalesOrderItem(split.slice(1).join('-'))
    };
  }
  return { salesOrderNo: code };
}

/** 从库位/推荐接口字段解析销售订单号与项次（businessCode=订单号，businessName/businessPartner=项次） */
export function resolveSalesOrderFieldsFromLocation(raw: {
  salesOrderNo?: string;
  salesOrderItem?: string;
  salesOrderLine?: string;
  soItem?: string;
  businessCode?: string;
  businessName?: string;
  businessPartner?: string;
  specialInventoryFlag?: string;
}): { salesOrderNo?: string; salesOrderItem?: string } {
  const businessCode = String(raw.businessCode ?? '').trim();
  const businessName = String(raw.businessName ?? raw.businessPartner ?? '').trim();
  const parsedSo = parseSalesOrderBusinessCode(businessCode);
  const flag = String(raw.specialInventoryFlag ?? '')
    .trim()
    .toUpperCase();

  let salesOrderNo = String(raw.salesOrderNo ?? '').trim() || parsedSo.salesOrderNo || undefined;
  let salesOrderItem = String(raw.salesOrderItem ?? raw.salesOrderLine ?? raw.soItem ?? '').trim() || parsedSo.salesOrderItem || undefined;

  if (flag === 'E') {
    if (!salesOrderNo && businessCode) {
      salesOrderNo = businessCode;
    }
    if (!salesOrderItem && businessName) {
      salesOrderItem = businessName;
    }
  }

  return {
    salesOrderNo: salesOrderNo || undefined,
    salesOrderItem: salesOrderItem ? normalizeSalesOrderItem(salesOrderItem) : undefined
  };
}

export function isSalesOrderInventoryRow(row: Pick<MaterialLocationRow, 'specialInventoryFlag'>): boolean {
  return String(row.specialInventoryFlag ?? '').toUpperCase() === 'E';
}

/** 合并 BOM 行与库存检查行上的销售订单约束（仅行级字段，不含工单头） */
export function resolveBomSalesOrderConstraint(
  bom?: SalesOrderInventoryConstraint | null,
  lineResult?: SalesOrderInventoryConstraint | null
): SalesOrderInventoryConstraint {
  const salesOrderNo = String(bom?.salesOrderNo ?? lineResult?.salesOrderNo ?? '').trim() || undefined;
  const salesOrderItem = String(bom?.salesOrderItem ?? lineResult?.salesOrderItem ?? '').trim() || undefined;
  const specialInventoryFlag = String(bom?.specialInventoryFlag ?? lineResult?.specialInventoryFlag ?? '').trim() || undefined;
  return { salesOrderNo, salesOrderItem, specialInventoryFlag };
}

/** 同一物料共享库存池的分组键（非限制库存 vs 销售订单 E 库存分开扣减） */
export function buildBomMaterialPoolKey(row: Pick<BomIssueRow, 'componentMaterial' | 'salesOrderNo' | 'salesOrderItem' | 'specialInventoryFlag'>): string {
  const code = String(row.componentMaterial || '').trim();
  const so = resolveBomSalesOrderConstraint(row);
  if (!bomRequiresSalesOrderInventory(so)) {
    return `mat:${code}|unrestricted`;
  }
  const item = normalizeSalesOrderItem(so.salesOrderItem);
  return `mat:${code}|so:${so.salesOrderNo}|${item}`;
}

export function isSameBomMaterialPoolGroup(a: BomIssueRow, b: BomIssueRow): boolean {
  return buildBomMaterialPoolKey(a) === buildBomMaterialPoolKey(b);
}

/** BOM / 发料行是否需要绑定销售订单的 E 类型（仅当行数据同时含销售订单号与项次） */
export function bomRequiresSalesOrderInventory(row?: SalesOrderInventoryConstraint | null): boolean {
  if (!row) return false;
  const so = String(row.salesOrderNo ?? '').trim();
  const item = String(row.salesOrderItem ?? '').trim();
  return !!so && !!item;
}

/** 工单是否应按销售订单库存（E）做检查（任一 BOM 行自身绑定销售订单） */
export function orderRequiresSalesOrderInventory(_order?: SalesOrderInventoryConstraint | null, bomRows?: SalesOrderInventoryConstraint[]): boolean {
  return !!bomRows?.some((row) => bomRequiresSalesOrderInventory(row));
}

/** 缺料行所缺的库存类型 */
export function resolveShortageInventoryType(constraint?: SalesOrderInventoryConstraint | null): import('./types').ShortageInventoryType {
  return bomRequiresSalesOrderInventory(constraint) ? 'SALES_ORDER' : 'UNRESTRICTED';
}

export function formatShortageInventoryTypeLabel(type?: import('./types').ShortageInventoryType | string): string {
  const normalized = String(type ?? '')
    .trim()
    .toUpperCase();
  if (type === 'SALES_ORDER' || normalized === 'E') return '销售订单库存(E)';
  if (normalized === 'N' || normalized === 'UNRESTRICTED' || normalized === 'NON_RESTRICTED') return '非限制库存';
  return '非限制库存';
}

/** 分类/备料行展示用特殊库存标识（非限制为 N） */
export function resolveDemandRowInventoryFlag(row: Pick<import('./types').MaterialDemandDetailRow, 'specialInventoryFlag' | 'shortageInventoryType'>): string {
  const flag = String(row.specialInventoryFlag ?? '')
    .trim()
    .toUpperCase();
  if (flag) return flag;
  if (row.shortageInventoryType === 'SALES_ORDER') return 'E';
  return 'N';
}

function buildShortageDemandInventoryMeta(salesOrderConstraint?: SalesOrderInventoryConstraint | null, shortageInventoryType?: import('./types').ShortageInventoryType): Pick<import('./types').MaterialDemandDetailRow, 'shortageInventoryType' | 'specialInventoryFlag' | 'businessCode' | 'businessName'> {
  const type = shortageInventoryType ?? resolveShortageInventoryType(salesOrderConstraint);
  const flagRaw = String(salesOrderConstraint?.specialInventoryFlag ?? '')
    .trim()
    .toUpperCase();
  const specialInventoryFlag = flagRaw && flagRaw !== 'N' ? flagRaw : type === 'SALES_ORDER' ? 'E' : 'N';
  const isSpecial = specialInventoryFlag !== 'N';
  return {
    shortageInventoryType: type,
    specialInventoryFlag,
    businessCode: isSpecial && specialInventoryFlag === 'E' ? String(salesOrderConstraint?.salesOrderNo ?? '').trim() || undefined : undefined,
    businessName: isSpecial && specialInventoryFlag === 'E' ? String(salesOrderConstraint?.salesOrderItem ?? '').trim() || undefined : undefined
  };
}

export function resolveLocationSalesOrder(loc: Pick<MaterialLocationRow, 'salesOrderNo' | 'salesOrderItem' | 'businessCode' | 'businessName' | 'specialInventoryFlag'>) {
  return resolveSalesOrderFieldsFromLocation(loc);
}

/** 库存行是否匹配 BOM 绑定的销售订单 */
export function matchesSalesOrderInventory(bom: SalesOrderInventoryConstraint, loc: Pick<MaterialLocationRow, 'specialInventoryFlag' | 'businessCode' | 'businessName' | 'salesOrderNo' | 'salesOrderItem'>): boolean {
  const bomSo = String(bom.salesOrderNo ?? '').trim();
  const bomItem = normalizeSalesOrderItem(bom.salesOrderItem);
  if (!bomSo) return false;

  const locSoNo = String(loc.salesOrderNo ?? '').trim();
  const locSoItem = normalizeSalesOrderItem(loc.salesOrderItem);
  if (locSoNo === bomSo) {
    if (!bomItem) return true;
    if (locSoItem && locSoItem === bomItem) return true;
  }

  const flag = String(loc.specialInventoryFlag ?? '').toUpperCase();
  if (flag && !['E', 'N', ''].includes(flag)) return false;

  const locCode = String(loc.businessCode ?? '').trim();
  const locItemRaw = String(loc.businessName ?? '').trim();
  if (locCode === bomSo) {
    if (!bomItem) return true;
    if (locItemRaw && normalizeSalesOrderItem(locItemRaw) === bomItem) return true;
  }

  const locSo = resolveLocationSalesOrder(loc);
  if (locSo.salesOrderNo !== bomSo) return false;
  if (bomItem && locSo.salesOrderItem && locSo.salesOrderItem !== bomItem) return false;
  if (bomItem && !locSo.salesOrderItem) return false;
  return true;
}

/** 推荐/操作时可选中的库位（与其他库位同一套规则，仅展示层区分线边仓） */
export function isOperatableLocationForBom(bom: SalesOrderInventoryConstraint, loc: MaterialLocationRow): boolean {
  if (!bomRequiresSalesOrderInventory(bom)) return true;
  const flag = String(loc.specialInventoryFlag ?? '').toUpperCase();
  if (flag === 'N') return false;
  return matchesSalesOrderInventory(bom, loc);
}

/** 从库存检查行结果解析本行可用库存池（库存单位） */
export function resolveBomRowPoolQtyFromCheck(
  soConstraint: SalesOrderInventoryConstraint,
  checkRows: MaterialLocationRow[] | undefined,
  lineResult?: Pick<InventoryCheckLineResult, 'availableQty'>,
  inventory?: { availableQty?: number }
): number {
  if (checkRows?.length) {
    const summed = bomRequiresSalesOrderInventory(soConstraint)
      ? sumSalesOrderAllocatablePoolQty(soConstraint, checkRows)
      : sumAllocatablePoolQty(checkRows);
    if (summed > 0) return summed;
  }
  const lineAvailable = Number(lineResult?.availableQty);
  if (Number.isFinite(lineAvailable) && lineAvailable >= 0) return lineAvailable;
  return Number(inventory?.availableQty ?? 0);
}

/** 实时查库存：补全销售订单行的 E 标识 */
export function enrichLocationRowsWithSalesOrderDefaults(rows: MaterialLocationRow[], bom: SalesOrderInventoryConstraint): MaterialLocationRow[] {
  const bomSo = String(bom.salesOrderNo ?? '').trim();
  const bomItem = normalizeSalesOrderItem(bom.salesOrderItem);
  if (!bomSo) return rows;
  const defaultBusinessCode = bomItem ? `${bomSo}-${bomItem}` : bomSo;
  return rows.map((row) => ({
    ...row,
    specialInventoryFlag: row.specialInventoryFlag || 'E',
    salesOrderNo: row.salesOrderNo || bomSo,
    salesOrderItem: row.salesOrderItem || String(bom.salesOrderItem ?? '').trim() || bomItem || row.salesOrderItem,
    businessCode: row.businessCode || defaultBusinessCode,
    businessName: row.businessName || (bomItem ? String(bom.salesOrderItem ?? '').trim() || bomItem : row.businessName)
  }));
}

export function sumSalesOrderAllocatablePoolQty(bom: SalesOrderInventoryConstraint, rows: MaterialLocationRow[]): number {
  return rows.reduce((sum, row) => {
    if (!isOperatableLocationForBom(bom, row)) return sum;
    return sum + resolveLocationPickAvailableQty(row);
  }, 0);
}

export function formatSalesOrderInventoryLabel(bom: SalesOrderInventoryConstraint): string {
  const so = String(bom.salesOrderNo ?? '').trim();
  const item = String(bom.salesOrderItem ?? '').trim();
  if (!so) return '';
  return item ? `${so} / 项次 ${item}` : so;
}

// ----- workOrderMaterialIssue.ts -----

/** SAP 预留单号+项次稳定行键（BOM 同步后 bomLineId 会变，预留键不变） */
export function getReserveLineKey(row: { workOrderNo?: string; reserveNo?: string; reserveItemNo?: string }, options?: { includeWorkOrder?: boolean }): string | undefined {
  const reserveNo = String(row.reserveNo || '').trim();
  const reserveItemNo = String(row.reserveItemNo || '').trim();
  if (!reserveNo || !reserveItemNo) return undefined;
  const base = `rsv:${reserveNo}:${reserveItemNo}`;
  if (options?.includeWorkOrder) {
    const wo = String(row.workOrderNo || '').trim();
    if (wo) return `wo:${wo}:${base}`;
  }
  return base;
}

export function getBomRowKey(row: BomIssueRow, index?: number): string {
  const reserveKey = getReserveLineKey(row, { includeWorkOrder: true });
  if (reserveKey) return reserveKey;
  const wo = String(row.workOrderNo || '').trim();
  const woPrefix = wo ? `wo:${wo}:` : '';
  if (row.id != null && row.id !== '') {
    return `${woPrefix}bom:${row.id}`;
  }
  const mat = String(row.componentMaterial || '').trim();
  return index != null ? `${woPrefix}mat:${mat}:${index}` : `${woPrefix}mat:${mat}`;
}

export function getIssueLineKey(line: WorkOrderMaterialIssueLine): string {
  const reserveKey = getReserveLineKey(line);
  if (reserveKey) return reserveKey;
  if (line.bomLineId != null && line.bomLineId !== '') {
    return `bom:${line.bomLineId}`;
  }
  return `mat:${String(line.materialCode || '').trim()}`;
}

export function getDemandDetailLineKey(detail: Pick<MaterialDemandDetailRow, 'reserveNo' | 'reserveItemNo' | 'bomLineId' | 'materialCode'>): string {
  const reserveKey = getReserveLineKey(detail);
  if (reserveKey) return reserveKey;
  if (detail.bomLineId != null && detail.bomLineId !== '') {
    return `bom:${detail.bomLineId}`;
  }
  return `mat:${String(detail.materialCode || '').trim()}`;
}

/** 用户已勾选且数量>0 的备料行键集合 */
export function buildSelectedIssueLineKeySet(order: WorkOrderVO): Set<string> {
  return new Set((order.materialIssues || []).filter((line) => Number(line.issueQty) > 0).map((line) => getIssueLineKey(line)));
}

/** 分类拆分行是否属于用户勾选的备料行 */
export function isSelectedDemandDetail(order: WorkOrderVO, detail: MaterialDemandDetailRow): boolean {
  const selected = buildSelectedIssueLineKeySet(order);
  if (!selected.size) return false;
  return selected.has(getDemandDetailLineKey(detail));
}

function forEachSelectedDemandDetail(orders: WorkOrderVO[], visitor: (order: WorkOrderVO, line: MaterialDemandDetailRow) => void) {
  orders.forEach((order) => {
    order.materialDemandDetails?.forEach((line) => {
      if (Number(line.issueQty) > 0 && isSelectedDemandDetail(order, line)) {
        visitor(order, line);
      }
    });
  });
}

export function getRowAllocatedInventoryQty(row: BomIssueRow): number {
  const manual = row.manualLocationSelections;
  if (manual?.length) {
    const picked = manual.reduce((sum, loc) => sum + Number(loc.recommendedQty ?? 0), 0);
    if (picked > 0) return picked;
  }
  return issueQtyToInventoryQty(Number(row.issueQty ?? 0), row.conversionRatio);
}

export function getPeerReservedInventoryQty(rows: BomIssueRow[], rowIndex: number): number {
  const current = rows[rowIndex];
  if (!current) return 0;
  let sum = 0;
  rows.forEach((row, idx) => {
    if (idx >= rowIndex) return;
    if (!isSameBomMaterialPoolGroup(row, current)) return;
    sum += getRowAllocatedInventoryQty(row);
  });
  return sum;
}

function resolveLocationPickRowKey(loc: Record<string, unknown>): string {
  return resolveLocationPickKey(loc);
}

function normalizeOtherLineDisplayLocation(loc: MaterialLocationRow): MaterialLocationRow {
  const stock = resolveOtherLineAvailableQty(loc);
  return {
    ...loc,
    availableQuantity: stock,
    inspectionQty: 0,
    blockedQty: 0,
    recommendedQty: 0,
    isRecommended: false
  };
}

/** 收集同物料靠前 BOM 行的库位分配（手动或 FIFO），用于按库位扣减共享池 */
export function collectPeerLocationPicks(rows: BomIssueRow[], rowIndex: number): Array<Record<string, unknown>> {
  const current = rows[rowIndex];
  if (!current) return [];
  const picks: Array<Record<string, unknown>> = [];
  rows.forEach((row, idx) => {
    if (idx >= rowIndex) return;
    if (!isSameBomMaterialPoolGroup(row, current)) return;
    const manual = row.manualLocationSelections?.filter((loc) => Number(loc.recommendedQty ?? 0) > 0);
    if (manual?.length) {
      picks.push(...manual);
      return;
    }
    const fifo = row.fifoRecommendedLocations?.filter((loc) => Number(loc.recommendedQty ?? 0) > 0);
    if (fifo?.length) picks.push(...fifo);
  });
  return picks.map((loc) => {
    const rowKey = resolveLocationPickRowKey(loc);
    return rowKey ? { ...loc, rowKey } : loc;
  });
}

export function refreshBomMaterialPoolMetrics<T extends BomIssueRow>(rows: T[]): T[] {
  const poolByKey = new Map<string, number>();
  rows.forEach((row) => {
    const pool = Number(row.materialPoolQty ?? row.availableQty ?? 0);
    const key = buildBomMaterialPoolKey(row);
    const prev = poolByKey.get(key);
    if (prev === undefined || pool > prev) {
      poolByKey.set(key, pool);
    }
  });
  return rows.map((row, index) => {
    const key = buildBomMaterialPoolKey(row);
    const pool = poolByKey.get(key) ?? Number(row.materialPoolQty ?? row.availableQty ?? 0);
    const peerReserved = getPeerReservedInventoryQty(rows, index);
    return {
      ...row,
      materialPoolQty: pool,
      effectiveAvailableQty: Math.max(0, pool - peerReserved)
    };
  });
}

function sumLocationPickInventoryQty(locations?: Array<Record<string, unknown>> | null): number {
  if (!locations?.length) return 0;
  return locations.reduce((sum, loc) => sum + Number(loc.recommendedQty ?? 0), 0);
}

/** 本行可用于齐套/状态展示的库存量（库存单位，非本次推荐分配量） */
export function resolveRowAvailableQty(material: {
  manualLocationSelections?: Array<Record<string, unknown>>;
  effectiveAvailableQty?: number;
  materialPoolQty?: number;
  availableQty?: number;
}): number | undefined {
  const manualPicked = sumLocationPickInventoryQty(material.manualLocationSelections);
  if (manualPicked > 0) {
    return manualPicked;
  }
  if (material.effectiveAvailableQty !== undefined && material.effectiveAvailableQty !== null) {
    return Math.max(0, Number(material.effectiveAvailableQty));
  }
  const pool = material.materialPoolQty ?? material.availableQty;
  if (pool !== undefined && pool !== null) {
    return Math.max(0, Number(pool));
  }
  return undefined;
}

export function calcRowKitRate(material: { effectiveAvailableQty?: number; availableQty?: number; issueQty?: number; componentQty?: number; issuedQty?: number; conversionRatio?: number }) {
  const available = resolveRowAvailableQty(material);
  if (available === undefined || available === null) return 0;
  const required = getOrderRequiredQty(material);
  if (required <= 0) return 1;
  return Math.min(Number(available) / required, 1);
}

export function buildInventoryAnalysisFromRows(rows: BomIssueRow[]) {
  const scope = rows.filter((row) => Number(row.issueQty ?? 0) > 0);
  let kitted = 0;
  let partial = 0;
  let shortage = 0;
  scope.forEach((row) => {
    const status = resolveRowInventoryStatus(row);
    if (status === 'SUFFICIENT') kitted += 1;
    else if (status === 'PARTIAL') partial += 1;
    else if (status === 'SHORTAGE') shortage += 1;
  });
  const total = scope.length;
  return {
    totalMaterials: total,
    kittedMaterials: kitted,
    partialMaterials: partial,
    shortageMaterials: shortage,
    kitRate: total > 0 ? kitted / total : 0
  };
}

export function resolveRowInventoryStatus(material: { effectiveAvailableQty?: number; availableQty?: number; issueQty?: number; componentQty?: number; issuedQty?: number; conversionRatio?: number }): InventoryCheckStatus {
  const available = resolveRowAvailableQty(material);
  if (available === undefined || available === null) return 'UNKNOWN';
  const required = getOrderRequiredQty(material);
  if (required <= 0) return 'SUFFICIENT';
  if (available >= required) return 'SUFFICIENT';
  if (available > 0) return 'PARTIAL';
  return 'SHORTAGE';
}

export function computeRecommendCapInventoryQty(row: BomIssueRow, peerReservedInventoryQty = 0): number {
  const rowDemand = issueQtyToInventoryQty(Number(row.issueQty ?? 0), row.conversionRatio);
  const pool = Number(row.materialPoolQty ?? row.availableQty ?? 0);
  const remainingPool = Math.max(0, pool - Number(peerReservedInventoryQty ?? 0));
  if (pool > 0) {
    return Math.min(rowDemand, remainingPool);
  }
  return rowDemand;
}

export function computeFifoRecommendedLocations(flatRows: MaterialLocationRow[], row: BomIssueRow, peerReservedInventoryQty = 0): MaterialLocationRow[] {
  const cap = computeRecommendCapInventoryQty(row, peerReservedInventoryQty);
  if (cap <= 0 || !flatRows.length) return [];
  const fifoInput = flatRows.map((r) => ({ ...r }));
  const allocateOptions = { canAllocate: (loc: MaterialLocationRow) => isOperatableLocationForBom(row, loc) };
  return recommendLocationsByFifo(fifoInput, cap, allocateOptions).recommendedRows.filter((loc) => Number(loc.recommendedQty ?? 0) > 0);
}

export type InventoryCheckLineResult = NonNullable<InventoryCheckResultVO['lineResults']>[number];

export function normalizeInventoryCheckMaterialCode(code?: string): string {
  return String(code ?? '').trim();
}

/** 在 checkInventory 返回物料编码中解析 BOM 行可命中的键（兼容 13014818601-05 / 13014818601） */
export function resolveInventoryCheckMaterialKey(materialCode: string, knownCodes: Iterable<string>): string {
  const code = normalizeInventoryCheckMaterialCode(materialCode);
  if (!code) return code;
  const codes = [...new Set([...knownCodes].map(normalizeInventoryCheckMaterialCode).filter(Boolean))];
  if (codes.includes(code)) return code;
  const dashIdx = code.lastIndexOf('-');
  if (dashIdx > 0) {
    const base = code.slice(0, dashIdx);
    if (codes.includes(base)) return base;
    const baseHit = codes.find((candidate) => candidate.startsWith(`${base}-`));
    if (baseHit) return baseHit;
  }
  const fuzzyHit = codes.find((candidate) => candidate === code || candidate.startsWith(`${code}-`) || code.startsWith(`${candidate}-`));
  return fuzzyHit || code;
}

export function buildInventoryCheckMaterialMap(
  materials?: Array<Record<string, unknown> & { materialCode?: string }>
): Map<string, Record<string, unknown>> {
  const map = new Map<string, Record<string, unknown>>();
  if (!materials?.length) return map;
  const payloadCodes = materials.map((mat) => normalizeInventoryCheckMaterialCode(mat.materialCode)).filter(Boolean);
  materials.forEach((mat) => {
    const payloadCode = normalizeInventoryCheckMaterialCode(mat.materialCode);
    if (!payloadCode) return;
    payloadCodes.forEach((requestCode) => {
      const resolved = resolveInventoryCheckMaterialKey(requestCode, [payloadCode]);
      if (resolved === payloadCode && !map.has(requestCode)) {
        map.set(requestCode, mat);
      }
    });
    if (!map.has(payloadCode)) {
      map.set(payloadCode, mat);
    }
  });
  return map;
}

function resolveInventoryCheckLineResultsByMaterial(
  materialCode: string,
  indexMaps: ReturnType<typeof buildInventoryCheckLineResultIndex>
): InventoryCheckLineResult[] | undefined {
  const code = normalizeInventoryCheckMaterialCode(materialCode);
  if (!code) return undefined;
  const direct = indexMaps.byMaterial.get(code);
  if (direct?.length) return direct;
  const alias = resolveInventoryCheckMaterialKey(code, indexMaps.byMaterial.keys());
  if (alias !== code) {
    return indexMaps.byMaterial.get(alias);
  }
  return undefined;
}

export function buildInventoryCheckLineResultIndex(lineResults?: InventoryCheckLineResult[]) {
  const byReserveKey = new Map<string, InventoryCheckLineResult>();
  const byMaterialReserveKey = new Map<string, InventoryCheckLineResult>();
  const byBomLineId = new Map<string, InventoryCheckLineResult>();
  const byMaterial = new Map<string, InventoryCheckLineResult[]>();
  lineResults?.forEach((line) => {
    const code = String(line.materialCode || line.componentMaterial || '').trim();
    const reserveKey = getReserveLineKey(line);
    if (reserveKey) {
      byReserveKey.set(reserveKey, line);
      if (code) {
        byMaterialReserveKey.set(`${code}|${reserveKey}`, line);
      }
    }
    const bomLineId = line.bomLineId;
    if (bomLineId != null && bomLineId !== '') {
      byBomLineId.set(String(bomLineId).trim(), line);
    }
    if (code) {
      const list = byMaterial.get(code) || [];
      list.push(line);
      byMaterial.set(code, list);
    }
  });
  return { byReserveKey, byMaterialReserveKey, byBomLineId, byMaterial };
}

function matchInventoryCheckLineByReserve(bom: BomIssueRow, lines: InventoryCheckLineResult[]): InventoryCheckLineResult | undefined {
  const reserveNo = String(bom.reserveNo ?? '').trim();
  const reserveItemNo = String(bom.reserveItemNo ?? '').trim();
  if (!reserveNo || !reserveItemNo) return undefined;
  const code = String(bom.componentMaterial || '').trim();
  return lines.find((line) => {
    if (String(line.reserveNo ?? '').trim() !== reserveNo) return false;
    if (String(line.reserveItemNo ?? '').trim() !== reserveItemNo) return false;
    if (!code) return true;
    return String(line.materialCode || line.componentMaterial || '').trim() === code;
  });
}

export function resolveInventoryCheckLineResultForBom(
  bom: BomIssueRow,
  index: number,
  indexMaps: ReturnType<typeof buildInventoryCheckLineResultIndex>,
  materialUseIndex: Map<string, number>,
  lineResults?: InventoryCheckLineResult[]
): InventoryCheckLineResult | undefined {
  const reserveKey = getReserveLineKey(bom);
  const code = String(bom.componentMaterial || '').trim();
  if (reserveKey) {
    const byRsv = indexMaps.byReserveKey.get(reserveKey);
    if (byRsv) return byRsv;
    if (code) {
      const byMaterialReserve = indexMaps.byMaterialReserveKey.get(`${code}|${reserveKey}`);
      if (byMaterialReserve) return byMaterialReserve;
    }
  }
  if (bom.id != null && bom.id !== '') {
    const byId = indexMaps.byBomLineId.get(String(bom.id).trim());
    if (byId) return byId;
  }
  if (!code) return undefined;
  const list = resolveInventoryCheckLineResultsByMaterial(code, indexMaps);
  if (!list?.length) {
    if (!lineResults?.length) return undefined;
    const byReserve = matchInventoryCheckLineByReserve(bom, lineResults);
    if (byReserve) return byReserve;
    const withRecommendations = lineResults.filter(
      (line) => String(line.materialCode || line.componentMaterial || '').trim() === code && line.recommendedLocations?.length
    );
    return withRecommendations.length === 1 ? withRecommendations[0] : undefined;
  }
  if (list.length === 1) return list[0];
  const soConstraint = resolveBomSalesOrderConstraint(bom);
  if (bomRequiresSalesOrderInventory(soConstraint)) {
    const bySo = list.find((line) => {
      const lineSo = resolveBomSalesOrderConstraint(line);
      return (
        lineSo.salesOrderNo === soConstraint.salesOrderNo &&
        normalizeSalesOrderItem(lineSo.salesOrderItem) === normalizeSalesOrderItem(soConstraint.salesOrderItem)
      );
    });
    if (bySo) return bySo;
  }
  const byReserve = matchInventoryCheckLineByReserve(bom, list);
  if (byReserve) return byReserve;
  const useIdx = materialUseIndex.get(code) ?? 0;
  const line = list[Math.min(useIdx, list.length - 1)];
  materialUseIndex.set(code, useIdx + 1);
  return line;
}

/** 对单行 BOM 应用 checkInventory 推荐库位（按行 API 结果） */
export function applyBomRowCheckInventoryRecommendations<T extends BomIssueRow>(allRows: T[], rowIndex: number): T[] {
  const updated = [...allRows];
  const row = updated[rowIndex];
  if (!row) return updated;

  if (Number(row.issueQty ?? 0) <= 0) {
    updated[rowIndex] = { ...row, fifoRecommendedLocations: undefined, otherLineWarehouseLocations: undefined };
    return updated;
  }

  const manualPicks = row.manualLocationSelections?.filter((loc) => Number(loc.recommendedQty ?? 0) > 0);
  if (manualPicks?.length) {
    updated[rowIndex] = { ...row, otherLineWarehouseLocations: undefined };
    return updated;
  }

  const flatRows = row.checkInventoryRecommendedLocations;
  if (!flatRows?.length || !flatRows.some((r) => r.fromCheckInventory)) {
    return updated;
  }

  const peerPicks = collectPeerLocationPicks(updated, rowIndex);
  let working = cloneMaterialLocationRows(flatRows);
  deductLocationPicksFromStock(working, peerPicks);
  const soConstraint = resolveBomSalesOrderConstraint(row);
  if (bomRequiresSalesOrderInventory(soConstraint)) {
    working = enrichLocationRowsWithSalesOrderDefaults(working, soConstraint);
  }

  const allocateOptions = { canAllocate: (loc: MaterialLocationRow) => isOperatableLocationForBom(soConstraint, loc) };

  const peerReserved = getPeerReservedInventoryQty(updated, rowIndex);
  const cap = computeRecommendCapInventoryQty(row, peerReserved);
  const checkResult = recommendLocationsFromCheckApi(working, cap, allocateOptions);
  const recommended = checkResult.recommendedRows.filter((loc) => Number(loc.recommendedQty ?? 0) > 0);

  updated[rowIndex] = {
    ...row,
    fifoRecommendedLocations: recommended.map((loc) => ({ ...loc })),
    otherLineWarehouseLocations: undefined
  };
  return updated;
}

/** 刷新全部 BOM 行的 FIFO 推荐库位（优先按行 checkInventory，否则按物料 FIFO） */
export function refreshBomRowRecommendations<T extends BomIssueRow>(rows: T[], materialLocationCache?: Map<string, MaterialLocationRow[]>): T[] {
  let updated = [...rows];
  const materialsNeedingFifo = new Set<string>();

  for (let index = 0; index < updated.length; index++) {
    const row = updated[index];
    if (Number(row.issueQty ?? 0) <= 0) {
      updated[index] = { ...row, fifoRecommendedLocations: undefined, otherLineWarehouseLocations: undefined };
      continue;
    }
    if (row.checkInventoryRecommendedLocations?.some((r) => r.fromCheckInventory)) {
      updated = applyBomRowCheckInventoryRecommendations(updated, index);
    } else {
      materialsNeedingFifo.add(row.componentMaterial);
    }
  }

  materialsNeedingFifo.forEach((code) => {
    const flatRows = materialLocationCache?.get(code);
    if (flatRows?.length) {
      updated = applyFifoRecommendationsForMaterial(updated, code, flatRows);
    }
  });

  return updated;
}

/** 对指定物料的全部 BOM 行批量刷新 FIFO 推荐（含同行占用扣减） */
export function applyFifoRecommendationsForMaterial<T extends BomIssueRow>(allRows: T[], materialCode: string, flatRows: MaterialLocationRow[]): T[] {
  const updated = [...allRows];
  const working = flatRows.map((r) => ({
    ...r,
    availableQuantity: Number(r.availableQuantity ?? 0),
    inspectionQty: Number(r.inspectionQty ?? 0),
    blockedQty: Number(r.blockedQty ?? 0),
    recommendedQty: undefined,
    isRecommended: false,
    systemRecommendedQty: resolveCheckApiRecommendedQty(r)
  }));

  allRows.forEach((row, index) => {
    if (row.componentMaterial !== materialCode) return;

    if (Number(row.issueQty ?? 0) <= 0) {
      updated[index] = { ...updated[index], fifoRecommendedLocations: undefined, otherLineWarehouseLocations: undefined };
      return;
    }

    const manualPicks = updated[index].manualLocationSelections?.filter((loc) => Number(loc.recommendedQty ?? 0) > 0);
    if (manualPicks?.length) {
      deductLocationPicksFromStock(working, manualPicks);
      updated[index] = {
        ...updated[index],
        otherLineWarehouseLocations: undefined
      };
      return;
    }

    const peerReserved = getPeerReservedInventoryQty(updated, index);
    const cap = computeRecommendCapInventoryQty(updated[index], peerReserved);
    const bomRow = updated[index];
    const soConstraint = resolveBomSalesOrderConstraint(bomRow);
    let fifoInput = working.map((r) => ({ ...r }));
    if (bomRequiresSalesOrderInventory(soConstraint)) {
      fifoInput = enrichLocationRowsWithSalesOrderDefaults(fifoInput, soConstraint);
    }
    const useCheckOrder = shouldUseCheckInventoryRecommend(flatRows);
    const allocateOptions = { canAllocate: (loc: MaterialLocationRow) => isOperatableLocationForBom(soConstraint, loc) };
    let recommended: MaterialLocationRow[] = [];
    if (useCheckOrder) {
      const checkResult = recommendLocationsFromCheckApi(fifoInput, cap, allocateOptions);
      recommended = checkResult.recommendedRows.filter((loc) => Number(loc.recommendedQty ?? 0) > 0);
    } else {
      const fifoResult = recommendLocationsByFifo(fifoInput, cap, allocateOptions);
      recommended = fifoResult.recommendedRows.filter((loc) => Number(loc.recommendedQty ?? 0) > 0);
    }

    updated[index] = {
      ...updated[index],
      fifoRecommendedLocations: recommended.map((loc) => ({ ...loc })),
      otherLineWarehouseLocations: undefined
    };
    deductLocationPicksFromStock(working, recommended);
  });

  return updated;
}

type LineWarehouseFlags = Pick<MaterialLocationRow, 'isLineWarehouse' | 'isUserLineWarehouse'>;

const locationPickKey = resolveLocationPickKey;

function formatPickInventoryQty(val: number): string {
  const n = Number(val);
  if (Number.isNaN(n)) return '0';
  return String(Math.round(n * 10000) / 10000);
}

function resolveOtherLineAvailableQty(loc: Record<string, unknown>): number {
  const inspection = Number(loc.inspectionQty ?? 0);
  const blocked = Number(loc.blockedQty ?? 0);
  const base = Number(loc.availableQuantity ?? loc.availableQty ?? 0);
  const unrestricted = Math.max(0, base - inspection - blocked);
  return unrestricted > 0 ? unrestricted : base;
}

/** 同物料靠前行的他人线边仓分配（库存单位），按库位键汇总 */
function collectPeerOtherLinePickQtyByKey(rows: BomIssueRow[], rowIndex: number): Map<string, number> {
  const current = rows[rowIndex];
  if (!current) return new Map();
  const totals = new Map<string, number>();
  rows.forEach((row, idx) => {
    if (idx >= rowIndex) return;
    if (row.componentMaterial !== current.componentMaterial) return;
    const hasManual = row.manualLocationSelections?.some((loc) => Number(loc.recommendedQty ?? 0) > 0);
    const picks = hasManual ? row.manualLocationSelections : row.fifoRecommendedLocations;
    picks?.forEach((loc) => {
      if (!isNonUserLineWarehouse(loc as LineWarehouseFlags)) return;
      const qty = Number(loc.recommendedQty ?? 0);
      if (qty <= 0) return;
      const key = locationPickKey(loc);
      totals.set(key, (totals.get(key) ?? 0) + qty);
    });
  });
  return totals;
}

function resolveRemainingOtherLineDisplayRows(row: BomIssueRow, peerPickedByKey: Map<string, number>, currentOtherLinePicks: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  const usedByKey = new Map(peerPickedByKey);
  currentOtherLinePicks.forEach((loc) => {
    const qty = Number(loc.recommendedQty ?? 0);
    if (qty <= 0) return;
    const key = locationPickKey(loc);
    usedByKey.set(key, (usedByKey.get(key) ?? 0) + qty);
  });

  const remaining: Array<Record<string, unknown>> = [];
  row.otherLineWarehouseLocations?.forEach((loc, locIndex) => {
    const key = locationPickKey(loc, locIndex);
    const available = resolveOtherLineAvailableQty(loc);
    const used = usedByKey.get(key) ?? 0;
    const left = Math.max(0, available - used);
    if (left > 0) {
      remaining.push({
        ...loc,
        availableQuantity: left,
        availableQty: left,
        recommendedQty: 0
      });
    }
  });
  return remaining;
}

function splitLocationPicks(locations?: Array<Record<string, unknown>> | null) {
  const allocated: Array<Record<string, unknown>> = [];
  const otherLineAllocated: Array<Record<string, unknown>> = [];
  locations?.forEach((loc) => {
    if (Number(loc.recommendedQty ?? 0) <= 0) return;
    if (isNonUserLineWarehouse(loc as LineWarehouseFlags)) {
      otherLineAllocated.push(loc);
    } else {
      allocated.push(loc);
    }
  });
  return { allocated, otherLineAllocated };
}

function resolveOwnWarehouseAllocatedQty(row: BomIssueRow): number {
  const hasManual = row.manualLocationSelections?.some((loc) => Number(loc.recommendedQty ?? 0) > 0);
  if (hasManual) {
    return sumLocationPickInventoryQty(row.manualLocationSelections);
  }
  if (row.fifoRecommendedLocations?.length) {
    return sumLocationPickInventoryQty(row.fifoRecommendedLocations);
  }
  const pool = Number(row.effectiveAvailableQty ?? row.availableQty ?? 0);
  const required = getOrderRequiredQty(row);
  return Math.min(pool, required);
}

function buildBomRecommendPickItems(row: BomIssueRow, locations?: Array<Record<string, unknown>> | null, options?: { displayOnly?: boolean }): BomRecommendPickItem[] {
  if (!locations?.length) return [];
  /** 库位分配数量均为库存单位（与系统推荐弹窗一致） */
  const unit = String(row.inventoryUnit || row.unit || '').trim();
  return locations
    .filter((loc) => options?.displayOnly || Number(loc.recommendedQty ?? 0) > 0)
    .map((loc) => {
      const location = String(loc.locationCode || loc.location || loc.locCode || '-').trim();
      const batch = String(loc.batchCode ?? loc.batchNo ?? '').trim() || '-';
      const invQty = Number(loc.recommendedQty ?? 0);
      const qty = formatPickInventoryQty(invQty);
      const isOtherLine = isNonUserLineWarehouse(loc as LineWarehouseFlags);
      return { location, batch, qty, unit, isOtherLine };
    });
}

/** 已分配数量（手动/FIFO/推荐），不含其他线边仓参考库存 */
export function resolveAllocatableAllocatedQty(row: BomIssueRow): number {
  return resolveOwnWarehouseAllocatedQty(row);
}

export function shouldShowOtherLineWarehouseInfo(row: BomIssueRow, contextRows?: BomIssueRow[], rowIndex?: number): boolean {
  const rows = contextRows?.length ? contextRows : [row];
  const index = rowIndex ?? rows.findIndex((candidate) => candidate === row);
  const required = getOrderRequiredQty(row);
  if (required <= 0) return false;
  if (!row.otherLineWarehouseLocations?.length) return false;
  if (resolveOwnWarehouseAllocatedQty(row) >= required) return false;
  const { otherLineAllocated } = splitLocationPicks(row.manualLocationSelections?.some((loc) => Number(loc.recommendedQty ?? 0) > 0) ? row.manualLocationSelections : row.fifoRecommendedLocations);
  const remaining = resolveRemainingOtherLineDisplayRows(row, collectPeerOtherLinePickQtyByKey(rows, index >= 0 ? index : 0), otherLineAllocated);
  return remaining.length > 0;
}

export function resolveBomRecommendPickLocations(row: BomIssueRow): Array<Record<string, unknown>> | null {
  const demand = getOrderRequiredQty(row);
  if (demand <= 0) return null;

  const manual = row.manualLocationSelections?.filter((loc) => Number(loc.recommendedQty ?? 0) > 0);
  if (manual?.length) {
    return capBomRecommendPickLocations(manual, demand);
  }
  const fifo = row.fifoRecommendedLocations?.filter((loc) => Number(loc.recommendedQty ?? 0) > 0);
  if (fifo?.length) {
    return capBomRecommendPickLocations(fifo, demand);
  }
  const check = row.checkInventoryRecommendedLocations;
  if (!check?.length) return null;

  const soConstraint = resolveBomSalesOrderConstraint(row);
  const working = cloneMaterialLocationRows(check);
  const allocateOptions = { canAllocate: (loc: MaterialLocationRow) => isOperatableLocationForBom(soConstraint, loc) };
  const result = recommendLocationsFromCheckApi(working, demand, allocateOptions);
  const recommended = result.recommendedRows.filter((loc) => Number(loc.recommendedQty ?? 0) > 0);
  return recommended.length ? recommended : null;
}

function capBomRecommendPickLocations(locations: Array<Record<string, unknown>>, demandInventoryQty: number): Array<Record<string, unknown>> {
  let remaining = Math.max(0, Number(demandInventoryQty));
  const result: Array<Record<string, unknown>> = [];
  locations.forEach((loc) => {
    if (remaining <= 0) return;
    const maxQty = Number(loc.recommendedQty ?? 0);
    if (maxQty <= 0) return;
    const pickQty = Math.min(remaining, maxQty);
    result.push({ ...loc, recommendedQty: pickQty });
    remaining -= pickQty;
  });
  return result;
}

export function getBomRecommendInfoItems(row: BomIssueRow, contextRows?: BomIssueRow[], rowIndex?: number): BomRecommendPickItem[] {
  const rows = contextRows?.length ? contextRows : [row];
  const index = rowIndex ?? rows.findIndex((candidate, i) => candidate === row || getBomRowKey(candidate, i) === getBomRowKey(row));
  const effectiveIndex = index >= 0 ? index : 0;

  const pickSource = resolveBomRecommendPickLocations(row);

  const result: BomRecommendPickItem[] = [];

  if (pickSource?.length) {
    result.push(
      ...buildBomRecommendPickItems(row, pickSource).map((item) => ({
        ...item,
        isAllocated: true
      }))
    );
  }

  return result;
}

export function formatBomRecommendPickLine(item: BomRecommendPickItem): string {
  return item.unit ? `${item.location} ${item.batch} ${item.qty}${item.unit}` : `${item.location} ${item.batch} ${item.qty}`;
}

export function formatBomLocationRecommendLines(row: BomIssueRow, locations?: Array<Record<string, unknown>> | null): string[] {
  return buildBomRecommendPickItems(row, locations).map((item) => formatBomRecommendPickLine(item));
}

export function getBomRecommendInfoLines(row: BomIssueRow, contextRows?: BomIssueRow[], rowIndex?: number): string[] {
  return getBomRecommendInfoItems(row, contextRows, rowIndex).map((item) => formatBomRecommendPickLine(item));
}

export function buildSavedIssueLineMatcher(lines?: WorkOrderMaterialIssueLine[]) {
  const byReserveKey = new Map<string, WorkOrderMaterialIssueLine>();
  const byBomLineId = new Map<string, WorkOrderMaterialIssueLine>();
  const legacyByMaterial = new Map<string, WorkOrderMaterialIssueLine[]>();
  lines?.forEach((line) => {
    const reserveKey = getReserveLineKey(line);
    if (reserveKey) {
      byReserveKey.set(reserveKey, line);
      return;
    }
    if (line.bomLineId != null && line.bomLineId !== '') {
      byBomLineId.set(String(line.bomLineId), line);
      return;
    }
    const list = legacyByMaterial.get(line.materialCode) || [];
    list.push(line);
    legacyByMaterial.set(line.materialCode, list);
  });
  const legacyUsed = new Map<string, number>();

  return (bom: BomIssueRow, index?: number): WorkOrderMaterialIssueLine | undefined => {
    const reserveKey = getReserveLineKey(bom);
    if (reserveKey) {
      const byRsv = byReserveKey.get(reserveKey);
      if (byRsv) return byRsv;
    }
    if (bom.id != null && bom.id !== '') {
      const byId = byBomLineId.get(String(bom.id));
      if (byId) return byId;
    }
    const legacy = legacyByMaterial.get(bom.componentMaterial);
    if (!legacy?.length) return undefined;
    const usedIdx = legacyUsed.get(bom.componentMaterial) ?? 0;
    const line = legacy[usedIdx];
    if (line) legacyUsed.set(bom.componentMaterial, usedIdx + 1);
    return line;
  };
}

export function calcConversionRate(conversion?: { numerator?: number | string; denominator?: number | string; conversionRate?: number | string }) {
  if (!conversion) return 1;
  const rate = Number(conversion.conversionRate);
  if (rate > 0 && !Number.isNaN(rate)) return rate;
  const num = Number(conversion.numerator);
  const den = Number(conversion.denominator);
  if (num > 0 && !Number.isNaN(num) && den > 0 && !Number.isNaN(den)) {
    return num / den;
  }
  return 1;
}

export function resolveBomBaseUnit(row: BomIssueRow) {
  const list = row.materialUnitConversionList;
  if (list?.length) {
    const base = list.find((item) => item.baseUnit)?.baseUnit;
    if (base) return base;
  }
  return row.inventoryUnit || row.unit || '';
}

export function findUnitConversion(row: BomIssueRow, altUnit: string) {
  const list = row.materialUnitConversionList;
  if (!list?.length || !altUnit) return undefined;
  return list.find((item) => item.altUnit === altUnit) || list.find((item) => item.altUnit === item.baseUnit && item.baseUnit === altUnit);
}

export function getIssueUnitOptions(row: BomIssueRow): IssueUnitOption[] {
  const list = row.materialUnitConversionList;
  if (list?.length) {
    const map = new Map<string, MaterialUnitConversionVO>();
    list.forEach((item) => {
      const alt = String(item.altUnit || '').trim();
      if (alt && !map.has(alt)) {
        map.set(alt, item);
      }
    });
    if (map.size > 0) {
      return Array.from(map.entries()).map(([value, conversion]) => ({
        label: value,
        value,
        conversion
      }));
    }
  }
  const fallback = row.unit || row.inventoryUnit;
  return fallback ? [{ label: fallback, value: fallback }] : [];
}

export function applyIssueUnitSelection<T extends BomIssueRow>(row: T, altUnit: string): T {
  const conversion = findUnitConversion(row, altUnit);
  const baseUnit = conversion?.baseUnit || resolveBomBaseUnit(row);
  const ratio = conversion ? calcConversionRate(conversion) : 1;
  const currentInvQty = issueQtyToInventoryQty(Number(row.issueQty ?? 0), row.conversionRatio);
  const next: T = {
    ...row,
    unit: altUnit,
    inventoryUnit: baseUnit,
    conversionRatio: ratio,
    issueUnitConversionId: conversion?.id
  };
  next.issueQty = clampIssueQty(inventoryQtyToIssueQty(currentInvQty, ratio), calcMaxIssueQty(next));
  return next;
}

/** 默认发货/发料单位：BOM 发货单位优先，否则取与基本单位不同的换算单位 */
export function resolveDefaultIssueUnit(row: BomIssueRow) {
  const baseUnit = resolveBomBaseUnit(row);
  const bomUnit = String(row.unit || '').trim();
  if (bomUnit && Number(row.issueUomQty ?? 0) > 0) {
    return bomUnit;
  }
  if (bomUnit && bomUnit !== baseUnit) return bomUnit;
  const options = getIssueUnitOptions(row);
  const preferredAlt = options.find((opt) => opt.value && opt.value !== baseUnit);
  return preferredAlt?.value || bomUnit || options[0]?.value || baseUnit;
}

/** 备料模式默认单位：库存/基本单位 */
export function resolveDefaultPrepIssueUnit(row: BomIssueRow) {
  return resolveBomBaseUnit(row) || String(row.inventoryUnit ?? '').trim() || String(row.unit ?? '').trim();
}

export function syncBomUnitConversion<T extends BomIssueRow>(row: T): T {
  const options = getIssueUnitOptions(row);
  const altUnit = resolveDefaultIssueUnit(row);
  const matchedOption = options.find((opt) => opt.value === altUnit) || options[0];
  const conversion = matchedOption?.conversion || findUnitConversion(row, altUnit);
  const baseUnit = conversion?.baseUnit || row.inventoryUnit || resolveBomBaseUnit(row);
  const ratio = resolveBomIssueConversionRatio({ ...row, unit: altUnit }, altUnit);
  return {
    ...row,
    unit: altUnit,
    inventoryUnit: baseUnit || row.inventoryUnit,
    conversionRatio: ratio,
    issueUnitConversionId: conversion?.id ?? row.issueUnitConversionId
  };
}

/** 备料模式：默认以库存单位录入，换算比例 1 */
export function syncBomPrepUnitConversion<T extends BomIssueRow>(row: T): T {
  const baseUnit = resolveDefaultPrepIssueUnit(row);
  const conversion = findUnitConversion(row, baseUnit);
  return {
    ...row,
    unit: baseUnit,
    inventoryUnit: baseUnit,
    conversionRatio: 1,
    issueUnitConversionId: conversion?.id ?? row.issueUnitConversionId
  };
}

/** 换算比例：库存单位数量 = 发料单位数量 × conversionRatio */
export function getConversionRatio(row?: { conversionRatio?: number }) {
  const ratio = Number(row?.conversionRatio);
  return ratio > 0 && !Number.isNaN(ratio) ? ratio : 1;
}

/** 待发数量（基本单位）= 需求数量 - 已发料数量（两值均为基本单位时） */
export function calcPendingInventoryQty(componentQty: number, issuedQty = 0) {
  return Math.max(0, Number(componentQty) - Number(issuedQty || 0));
}

/** 已发料数量（基本单位）；与需求数量 componentQty 同单位 */
export function calcIssuedInventoryQty(row: Pick<BomIssueRow, 'issuedQty'>) {
  const issued = Number(row.issuedQty || 0);
  return issued > 0 ? issued : 0;
}

/** 需求数量（基本单位） */
export function calcBomRequiredInventoryQty(row: Pick<BomIssueRow, 'componentQty'>) {
  return Math.max(0, Number(row.componentQty || 0));
}

/** 解析发货单位换算比例：库存单位数量 = 发货单位数量 × ratio */
export function resolveBomIssueConversionRatio(row: Pick<BomIssueRow, 'conversionRatio' | 'componentQty' | 'issueUomQty' | 'materialUnitConversionList' | 'unit' | 'inventoryUnit'>, issueUnit?: string) {
  const unit = issueUnit || resolveDefaultIssueUnit(row as BomIssueRow);
  const baseUnit = resolveBomBaseUnit(row as BomIssueRow);
  if (unit && baseUnit && unit === baseUnit) return 1;
  const conversion = findUnitConversion(row as BomIssueRow, unit);
  if (conversion) return calcConversionRate(conversion);

  const fromRow = getConversionRatio(row);
  if (fromRow !== 1) return fromRow;

  const issueUomQty = Number(row.issueUomQty ?? 0);
  const componentQty = Number(row.componentQty ?? 0);
  if (issueUomQty > 0 && componentQty > 0) {
    return componentQty / issueUomQty;
  }
  return 1;
}

/** 待发数量（基本单位）= 需求数量 - 已发料数量 */
export function calcBomPendingInventoryQty(row: Pick<BomIssueRow, 'componentQty' | 'issuedQty'>) {
  return Math.max(0, calcBomRequiredInventoryQty(row) - calcIssuedInventoryQty(row));
}

/** 库存单位数量 → 发料单位数量 */
export function inventoryQtyToIssueQty(inventoryQty: number, conversionRatio?: number) {
  const ratio = getConversionRatio({ conversionRatio });
  const qty = Number(inventoryQty) / ratio;
  if (Number.isNaN(qty) || qty < 0) return 0;
  return Math.round(qty * 10000) / 10000;
}

/** 发料单位数量 → 库存单位数量 */
export function issueQtyToInventoryQty(issueQty: number, conversionRatio?: number) {
  const ratio = getConversionRatio({ conversionRatio });
  const qty = Number(issueQty) * ratio;
  if (Number.isNaN(qty) || qty < 0) return 0;
  return Math.round(qty * 10000) / 10000;
}

export function calcMaxIssueInventoryQty(row: BomIssueRow) {
  return calcBomPendingInventoryQty(row);
}

export function clampInventoryQty(inventoryQty: number, maxInventoryQty: number) {
  const max = Math.max(0, maxInventoryQty);
  const n = Number(inventoryQty);
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.min(n, max);
}

/** 本次发料默认数量（发货单位）= (需求数量 - 已发料数量)[基本单位] ÷ 换算比例 */
export function calcDefaultIssueQty(row: BomIssueRow) {
  const pendingInv = calcBomPendingInventoryQty(row);
  const ratio = resolveBomIssueConversionRatio(row, row.unit);
  return inventoryQtyToIssueQty(pendingInv, ratio);
}

/** 本次备料默认数量（库存单位）= 需求数量 - 已发料数量 */
export function calcDefaultPrepIssueQty(row: BomIssueRow) {
  return calcBomPendingInventoryQty(row);
}

export function calcMaxIssueQty(row: BomIssueRow) {
  return calcDefaultIssueQty(row);
}

/** 按发料套数计算数量；当前单位为库存单位时直接返回库存单位数量 */
function calcIssueQtyBySetForRowUnit(row: BomIssueRow, issueSetCount: number, plannedQty: number) {
  const planned = Number(plannedQty);
  if (!planned || planned <= 0) return 0;
  const targetInvQty = (Number(row.componentQty) * Number(issueSetCount)) / planned;
  const pendingInv = Math.max(0, targetInvQty - calcIssuedInventoryQty(row));
  const baseUnit = resolveBomBaseUnit(row);
  if (String(row.unit || '').trim() === baseUnit) return pendingInv;
  return inventoryQtyToIssueQty(pendingInv, resolveBomIssueConversionRatio(row, row.unit));
}

/** 备料模式本次发料上限：待发与套数计算取较大值（默认库存单位） */
export function calcPrepMaxIssueQty(row: BomIssueRow, issueSetCount?: number, plannedQty?: number): number {
  const pendingMax = calcDefaultPrepIssueQty(row);
  const planned = Number(plannedQty ?? 0);
  const setCount = Number(issueSetCount ?? 0);
  if (planned > 0 && setCount >= 0) {
    return Math.max(pendingMax, calcIssueQtyBySetForRowUnit(row, setCount, planned));
  }
  return pendingMax;
}

export function clampIssueQty(issueQty: number, maxIssueQty: number) {
  const max = Math.max(0, maxIssueQty);
  const n = Number(issueQty);
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.min(n, max);
}

/** 按发料套数计算本次发料（发料单位） */
export function calcIssueQtyBySet(row: BomIssueRow, issueSetCount: number, plannedQty: number) {
  return calcIssueQtyBySetForRowUnit(row, issueSetCount, plannedQty);
}

export function initBomIssueRow<T extends BomIssueRow>(bom: T, savedIssueQty?: number, savedIssueUnit?: string): T {
  const withUnit = savedIssueUnit ? applyIssueUnitSelection({ ...bom, issueQty: savedIssueQty ?? bom.issueQty ?? 0 }, savedIssueUnit) : syncBomUnitConversion(bom);
  const pendingQty = calcBomPendingInventoryQty(withUnit);
  const maxIssueQty = calcMaxIssueQty(withUnit);
  const defaultQty = maxIssueQty <= 0 ? 0 : (savedIssueQty ?? maxIssueQty);
  const issueQty = clampIssueQty(defaultQty, maxIssueQty);
  return { ...withUnit, pendingQty, issueQty };
}

/** 备料模式初始化 BOM 行：默认库存单位与待发数量（库存单位） */
export function initBomPrepIssueRow<T extends BomIssueRow>(bom: T, savedIssueQty?: number, savedIssueUnit?: string): T {
  const withUnit = savedIssueUnit ? applyIssueUnitSelection({ ...bom, issueQty: savedIssueQty ?? bom.issueQty ?? 0 }, savedIssueUnit) : syncBomPrepUnitConversion(bom);
  const pendingQty = calcBomPendingInventoryQty(withUnit);
  const maxIssueQty = calcDefaultPrepIssueQty(withUnit);
  const defaultQty = maxIssueQty <= 0 ? 0 : (savedIssueQty ?? maxIssueQty);
  const issueQty = clampIssueQty(defaultQty, maxIssueQty);
  return { ...withUnit, pendingQty, issueQty };
}

/** 是否仍有待发需求 */
export function needsIssue(row: BomIssueRow) {
  return calcBomPendingInventoryQty(row) > 0;
}

function mapBomRowToIssueLine(r: BomIssueRow): WorkOrderMaterialIssueLine {
  return {
    bomLineId: r.id,
    reserveNo: r.reserveNo,
    reserveItemNo: r.reserveItemNo,
    materialCode: r.componentMaterial,
    issueQty: Number(r.issueQty),
    issueUnit: r.unit,
    conversionRatio: r.conversionRatio,
    manualLocationSelections: r.manualLocationSelections,
    fifoRecommendedLocations: r.fifoRecommendedLocations,
    otherLineWarehouseLocations: r.otherLineWarehouseLocations,
    locationOverrideReason: r.locationOverrideReason,
    salesOrderNo: r.salesOrderNo,
    salesOrderItem: r.salesOrderItem,
    specialInventoryFlag: r.specialInventoryFlag
  };
}

export function bomRowsToIssueLines(rows: BomIssueRow[], selectedKeys?: Set<string> | string[]): WorkOrderMaterialIssueLine[] {
  const keySet = selectedKeys instanceof Set ? selectedKeys : selectedKeys ? new Set(selectedKeys) : null;

  return rows
    .map((r, index) => ({ r, index }))
    .filter(({ r, index }) => {
      if ((r.issueQty ?? 0) <= 0) return false;
      if (keySet) return keySet.has(getBomRowKey(r, index));
      return true;
    })
    .map(({ r }) => mapBomRowToIssueLine(r));
}

/** 将勾选的 BOM 行按工单拆分为发料行（合并备料保存） */
export function bomRowsToIssueLinesByWorkOrder(rows: BomIssueRow[], selectedKeys?: Set<string> | string[]): Record<string, WorkOrderMaterialIssueLine[]> {
  const keySet = selectedKeys instanceof Set ? selectedKeys : selectedKeys ? new Set(selectedKeys) : null;
  const result: Record<string, WorkOrderMaterialIssueLine[]> = {};

  rows
    .map((r, index) => ({ r, index }))
    .filter(({ r, index }) => {
      if ((r.issueQty ?? 0) <= 0) return false;
      if (keySet && !keySet.has(getBomRowKey(r, index))) return false;
      return !!String(r.workOrderNo || '').trim();
    })
    .forEach(({ r }) => {
      const wo = String(r.workOrderNo).trim();
      (result[wo] ||= []).push(mapBomRowToIssueLine(r));
    });

  return result;
}

/** 保留合并 BOM 行中物料首次出现顺序（用于跨工单 FIFO） */
export function collectMaterialCodesInBomOrder(rows: BomIssueRow[]): string[] {
  const codes: string[] = [];
  const seen = new Set<string>();
  rows.forEach((row) => {
    const code = String(row.componentMaterial || '').trim();
    if (!code || seen.has(code)) return;
    seen.add(code);
    codes.push(code);
  });
  return codes;
}

export function buildAllocationMaterialIssueItems(orders: WorkOrderVO[]) {
  const items: { workOrderNo: string; materialCode: string; issueQty: number }[] = [];
  orders.forEach((order) => {
    order.materialIssues?.forEach((line) => {
      if (line.issueQty > 0) {
        items.push({
          workOrderNo: order.workOrderNo,
          materialCode: line.materialCode,
          issueQty: line.issueQty
        });
      }
    });
  });
  return items.length > 0 ? items : undefined;
}

/** 由按库位拆分的自动仓需求行构建 261 发料明细 */
export function buildAutoWarehouseIssueItems(orders: WorkOrderVO[]) {
  const items: {
    workOrderNo: string;
    materialCode: string;
    issueQty: number;
    warehouseCode?: string;
    locationCode?: string;
  }[] = [];
  forEachSelectedDemandDetail(orders, (order, line) => {
    if (line.warehouseRoute === 'AUTO' && line.lineType === 'LOCATION') {
      items.push({
        workOrderNo: order.workOrderNo,
        materialCode: line.materialCode,
        issueQty: line.issueQty,
        warehouseCode: line.recommendedWarehouse,
        locationCode: line.recommendedLocation
      });
    }
  });
  return items.length > 0 ? items : undefined;
}

/** 由按库位拆分的线边仓需求行构建 261 发料明细 */
export function buildLineSideWarehouseIssueItems(orders: WorkOrderVO[]) {
  const items: {
    workOrderNo: string;
    materialCode: string;
    issueQty: number;
    warehouseCode?: string;
    locationCode?: string;
  }[] = [];
  forEachSelectedDemandDetail(orders, (order, line) => {
    if (line.warehouseRoute === 'LINE' && line.lineType === 'LOCATION') {
      items.push({
        workOrderNo: order.workOrderNo,
        materialCode: line.materialCode,
        issueQty: line.issueQty,
        warehouseCode: line.recommendedWarehouse,
        locationCode: line.recommendedLocation
      });
    }
  });
  return items.length > 0 ? items : undefined;
}

function toPrepDemandLineItem(order: WorkOrderVO, line: MaterialDemandDetailRow): import('@/api/wms/workOrderPrepDemand/types').PrepDemandLineItem {
  const item: import('@/api/wms/workOrderPrepDemand/types').PrepDemandLineItem = {
    workOrderNo: order.workOrderNo,
    materialCode: line.materialCode,
    bomLineId: line.bomLineId,
    reserveNo: line.reserveNo,
    reserveItemNo: line.reserveItemNo,
    prepQty: line.prepInventoryQty ?? line.issueQty,
    warehouseRoute: line.warehouseRoute,
    lineType: line.lineType
  };
  if (line.lineType === 'LOCATION') {
    item.warehouseCode = line.recommendedWarehouse;
    item.locationCode = line.recommendedLocation;
    item.recommendationSource = mapLocationSourceToRecommendationSource(line.locationSource) ?? PREP_LOCATION_REC_SYSTEM_RECOMMENDED;
    const reason = String(line.locationOverrideReason ?? '').trim();
    if (reason) item.recommendationReason = reason;
  }
  const targetLoc = String(line.targetDemandLocationCode || '').trim();
  if (targetLoc) {
    item.targetDemandLocationCode = targetLoc;
    item.targetDemandWarehouseCode = line.targetDemandWarehouseCode;
  }
  item.specialInventoryFlag = resolveDemandRowInventoryFlag(line);
  return item;
}

/** 从备料明细中提取头表目标需求库位 */
export function resolvePrepDemandTargetLocationFromItems(
  prepItems: import('@/api/wms/workOrderPrepDemand/types').PrepDemandLineItem[]
): { targetDemandLocationCode?: string; targetDemandWarehouseCode?: string } {
  const flat = prepItems.find(
    (item) => item.warehouseRoute === 'FLAT' && String(item.targetDemandLocationCode || '').trim()
  );
  if (!flat) return {};
  return {
    targetDemandLocationCode: String(flat.targetDemandLocationCode || '').trim() || undefined,
    targetDemandWarehouseCode: String(flat.targetDemandWarehouseCode || '').trim() || undefined
  };
}

/** 由按库位拆分的需求行构建自动仓备料明细 */
export function buildAutoPrepDemandItems(orders: WorkOrderVO[]) {
  const items: import('@/api/wms/workOrderPrepDemand/types').PrepDemandLineItem[] = [];
  forEachSelectedDemandDetail(orders, (order, line) => {
    if (line.warehouseRoute === 'AUTO' && line.lineType === 'LOCATION') {
      items.push(toPrepDemandLineItem(order, line));
    }
  });
  return items;
}

/** 由按库位拆分的需求行构建线边仓备料明细 */
export function buildLinePrepDemandItems(orders: WorkOrderVO[]) {
  const items: import('@/api/wms/workOrderPrepDemand/types').PrepDemandLineItem[] = [];
  forEachSelectedDemandDetail(orders, (order, line) => {
    if (line.warehouseRoute === 'LINE' && line.lineType === 'LOCATION') {
      items.push(toPrepDemandLineItem(order, line));
    }
  });
  return items;
}

/** 平面仓备料行未填写目标需求库位 */
export function findFlatRowsMissingTargetDemandLocation(orders: WorkOrderVO[]): MaterialDemandDetailRow[] {
  const missing: MaterialDemandDetailRow[] = [];
  forEachSelectedDemandDetail(orders, (_order, line) => {
    if (line.warehouseRoute === 'FLAT' && line.lineType === 'LOCATION') {
      if (!String(line.targetDemandLocationCode || '').trim()) {
        missing.push(line);
      }
    }
  });
  return missing;
}

/** 由按库位拆分的需求行构建平面仓备料明细 */
export function buildFlatPrepDemandItems(orders: WorkOrderVO[]) {
  const items: import('@/api/wms/workOrderPrepDemand/types').PrepDemandLineItem[] = [];
  forEachSelectedDemandDetail(orders, (order, line) => {
    if (line.warehouseRoute === 'FLAT' && line.lineType === 'LOCATION') {
      items.push(toPrepDemandLineItem(order, line));
    }
  });
  return items;
}

/** 由分类后的缺料/紧急需求行构建备料明细 */
export function buildShortagePrepDemandItems(orders: WorkOrderVO[]) {
  const items: import('@/api/wms/workOrderPrepDemand/types').PrepDemandLineItem[] = [];
  forEachSelectedDemandDetail(orders, (order, line) => {
    if (isClassifiedShortageRow(line)) {
      items.push(toPrepDemandLineItem(order, line));
    }
  });
  return items;
}

/** 构建完整备料计划：自动仓 + 线边仓 + 平面仓 + 缺料（单次请求） */
export function buildPrepDemandItems(orders: WorkOrderVO[]) {
  return [...buildAutoPrepDemandItems(orders), ...buildLinePrepDemandItems(orders), ...buildFlatPrepDemandItems(orders), ...buildShortagePrepDemandItems(orders)];
}

/** BOM 待发需求（基本单位）= 需求数量 - 已发料数量 */
export function getPendingDemandQty(material: { componentQty?: number; issuedQty?: number }) {
  return calcBomPendingInventoryQty({
    componentQty: Number(material.componentQty || 0),
    issuedQty: material.issuedQty
  });
}

/** 本次发料检查用需求（库存单位）；未填写则回退待发需求 */
export function getOrderRequiredQty(material: { issueQty?: number; componentQty?: number; issuedQty?: number; conversionRatio?: number }) {
  const issue = Number(material.issueQty);
  if (issue > 0) {
    return issueQtyToInventoryQty(issue, material.conversionRatio);
  }
  return getPendingDemandQty(material);
}

/** 齐套率 = 可用库存 / 待发需求（库存单位） */
export function calcKitRate(material: { availableQty?: number; componentQty?: number; issuedQty?: number }) {
  const available = material.availableQty;
  if (available === undefined || available === null) {
    return 0;
  }
  const pending = getPendingDemandQty(material);
  if (pending <= 0) {
    return 1;
  }
  return Math.min(Number(available) / pending, 1);
}

export function resolveInventoryStatus(material: { availableQty?: number; componentQty?: number; issuedQty?: number }): InventoryCheckStatus {
  const available = material.availableQty;
  if (available === undefined || available === null) {
    return 'UNKNOWN';
  }
  const pending = getPendingDemandQty(material);
  if (pending <= 0) {
    return 'SUFFICIENT';
  }
  if (available >= pending) {
    return 'SUFFICIENT';
  }
  if (available > 0) {
    return 'PARTIAL';
  }
  return 'SHORTAGE';
}

export function isInventorySufficient(material: BomIssueRow) {
  return resolveInventoryStatus(material) === 'SUFFICIENT';
}

export function normalizePartSizeType(source: Record<string, unknown>): PartSizeType | undefined {
  const raw = source.sizeCategory;
  if (raw === undefined || raw === null || raw === '') {
    return undefined;
  }
  const text = String(raw).trim();
  const upper = text.toUpperCase();
  if (upper === 'LARGE' || text === '大件' || upper === 'BULK' || text === '1') {
    return 'LARGE';
  }
  if (upper === 'SMALL' || text === '小件' || text === '2') {
    return 'SMALL';
  }
  return undefined;
}

export function partSizeTypeLabel(type?: PartSizeType) {
  if (type === 'LARGE') return '大件';
  if (type === 'SMALL') return '小件';
  return '-';
}

export function issueLineMap(lines?: WorkOrderMaterialIssueLine[]) {
  const qtyMap = new Map<string, number>();
  const unitMap = new Map<string, string>();
  const locationMap = new Map<string, Array<Record<string, unknown>>>();
  const reasonMap = new Map<string, string>();
  const ratioMap = new Map<string, number>();
  lines?.forEach((l) => {
    qtyMap.set(l.materialCode, l.issueQty);
    if (l.issueUnit) {
      unitMap.set(l.materialCode, l.issueUnit);
    }
    if (l.manualLocationSelections?.length) {
      locationMap.set(l.materialCode, l.manualLocationSelections);
    }
    if (l.locationOverrideReason) {
      reasonMap.set(l.materialCode, l.locationOverrideReason);
    }
    if (l.conversionRatio != null) {
      ratioMap.set(l.materialCode, l.conversionRatio);
    }
  });
  return { qtyMap, unitMap, locationMap, reasonMap, ratioMap };
}

// ----- workbenchClassify.ts -----

export function parseInventoryCheckPayload(data: unknown): InventoryCheckResultVO | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  if (record.lineResults || record.materials || record.analysis) {
    return record as InventoryCheckResultVO;
  }
  const nested = record.inventoryCheck;
  if (nested && typeof nested === 'object') {
    return nested as InventoryCheckResultVO;
  }
  return record as InventoryCheckResultVO;
}

function normalizeLocationRec(raw: unknown): LocationRec | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const locationCode = String(record.locationCode ?? record.location ?? record.locCode ?? '').trim() || undefined;
  const meta = resolveLocationMeta(locationCode, {
    warehouseCode: record.warehouseCode as string | undefined,
    areaCode: record.areaCode as string | undefined,
    locationName: record.locationName as string | undefined
  });
  const warehouseCode = String(record.warehouseCode ?? record.warehouse ?? record.whCode ?? '').trim() || (meta.warehouseCode !== '-' ? meta.warehouseCode : undefined);
  const availableQty = Number(record.availableQty ?? record.availableQuantity ?? record.qty ?? record.stockQty ?? record.onHandQty ?? record.quantity ?? 0);
  const recommendedQtyRaw = record.recommendedQty ?? record.recommendedQuantity ?? record.allocatedQuantity ?? record.allocateQty ?? record.pickQty;
  const recommendedQty = recommendedQtyRaw != null ? Number(recommendedQtyRaw) : undefined;
  const businessCode = String(record.businessCode ?? record.vendorCode ?? record.customerCode ?? '').trim() || undefined;
  const businessName = String(record.businessName ?? '').trim() || undefined;

  if (!locationCode && !warehouseCode) return null;

  return {
    locationCode,
    locationName: String(record.locationName ?? '').trim() || undefined,
    warehouseCode,
    areaCode: String(record.areaCode ?? '').trim() || (meta.areaCode !== '-' ? meta.areaCode : undefined),
    availableQty: Number.isFinite(availableQty) ? availableQty : 0,
    recommendedQty: recommendedQty != null && Number.isFinite(recommendedQty) ? recommendedQty : undefined,
    fifoSequence: Number(record.fifoSequence ?? record.sequence ?? record.priority ?? 999),
    batchCode: String(record.batchCode ?? record.batchNo ?? '').trim() || undefined,
    isLineWarehouse: parseBoolFlag(record.isLineWarehouse ?? record.isOtherLineWarehouse),
    isUserLineWarehouse: parseBoolFlag(record.isUserLineWarehouse),
    isAutoWarehouse: parseBoolFlag(record.isAutoWarehouse),
    specialInventoryFlag: String(record.specialInventoryFlag ?? record.inventorySpecialFlag ?? '').trim() || undefined,
    businessCode,
    businessName: businessName || undefined
  };
}

function normalizeLocationList(rawList: unknown[] | undefined): LocationRec[] {
  if (!rawList?.length) return [];
  return rawList.map(normalizeLocationRec).filter((loc): loc is LocationRec => !!loc);
}

export function parseAutoWarehousesFromCheckData(data: unknown): string[] {
  if (!data || typeof data !== 'object') return [];
  const record = data as Record<string, unknown>;
  const direct = record.autoWarehouses;
  if (Array.isArray(direct)) {
    return [...new Set(direct.map((code) => String(code).trim()).filter(Boolean))];
  }
  const nested = record.inventoryCheck;
  if (nested && typeof nested === 'object') {
    const nestedAuto = (nested as Record<string, unknown>).autoWarehouses;
    if (Array.isArray(nestedAuto)) {
      return [...new Set(nestedAuto.map((code) => String(code).trim()).filter(Boolean))];
    }
  }
  return [];
}

function normalizeWarehouseCode(code?: string) {
  return String(code || '')
    .trim()
    .toUpperCase();
}

function parseBoolFlag(value: unknown): boolean | undefined {
  if (value === true || value === 1 || value === '1' || value === 'true' || value === 'Y' || value === 'y') return true;
  if (value === false || value === 0 || value === '0' || value === 'false' || value === 'N' || value === 'n') return false;
  return undefined;
}

type LocationWarehouseRoute = Exclude<WarehouseRoute, 'SHORTAGE' | 'OTHER_LINE'>;

function hasOtherLineWarehouseStockInList(locations: LocationRec[]): boolean {
  return locations.some((loc) => loc.isLineWarehouse === true && loc.isUserLineWarehouse === false && Number(loc.availableQty ?? 0) > 0);
}

export function resolveRouteByWarehouse(warehouseCode: string | undefined, ctx: WarehouseRouteContext, loc?: Pick<LocationRec, 'isLineWarehouse' | 'isUserLineWarehouse' | 'isAutoWarehouse'>): LocationWarehouseRoute {
  if (loc?.isAutoWarehouse) return 'AUTO';
  if (loc?.isLineWarehouse && loc?.isUserLineWarehouse !== false) return 'LINE';
  if (!warehouseCode) return 'FLAT';
  const normalized = normalizeWarehouseCode(warehouseCode);
  const autoSet = new Set(ctx.autoWarehouseCodes.map(normalizeWarehouseCode).filter(Boolean));
  const lineSet = new Set(ctx.lineSideWarehouseCodes.map(normalizeWarehouseCode).filter(Boolean));
  if (autoSet.has(normalized)) return 'AUTO';
  if (lineSet.has(normalized)) return 'LINE';
  return 'FLAT';
}

function resolveWarehouseAndLocation(loc: LocationRec) {
  const locationCode = String(loc.locationCode || '').trim() || undefined;
  const meta = resolveLocationMeta(locationCode, loc);
  const warehouseCode = String(loc.warehouseCode || '').trim() || (meta.warehouseCode !== '-' ? meta.warehouseCode : undefined);
  const areaCode = String(loc.areaCode || '').trim() || (meta.areaCode !== '-' ? meta.areaCode : undefined);
  return { warehouseCode, locationCode, areaCode };
}

function locationRecToFifoInput(loc: LocationRec, index: number): MaterialLocationRow {
  const unrestricted = Math.max(0, Number(loc.availableQty ?? 0));
  return {
    rowKey: resolveLocationPickKey(loc as Record<string, unknown>, index),
    warehouseCode: loc.warehouseCode,
    locationCode: loc.locationCode,
    areaCode: loc.areaCode,
    batchCode: loc.batchCode,
    availableQuantity: unrestricted,
    inspectionQty: 0,
    blockedQty: 0,
    fifoSequence: loc.fifoSequence,
    specialInventoryFlag: loc.specialInventoryFlag,
    businessCode: loc.businessCode,
    businessName: loc.businessName,
    isLineWarehouse: loc.isLineWarehouse,
    isUserLineWarehouse: loc.isUserLineWarehouse,
    isAutoWarehouse: loc.isAutoWarehouse
  };
}

/** 分类时解析可分配库位：优先已保存推荐量，否则按 FIFO 在可用库存上拆分 */
function capLocationPicksToInventoryDemand(picks: LocationRec[], demandInventoryQty: number): LocationRec[] {
  const demand = Math.max(0, Number(demandInventoryQty));
  if (demand <= 0 || !picks.length) return [];

  const ordered = [...picks].sort((a, b) => Number(a.fifoSequence ?? 999) - Number(b.fifoSequence ?? 999));
  let remaining = demand;
  const result: LocationRec[] = [];

  for (const loc of ordered) {
    if (remaining <= 0) break;
    const qty = Number(loc.recommendedQty ?? 0);
    if (qty <= 0) continue;
    const pick = Math.min(qty, remaining);
    result.push({ ...loc, recommendedQty: pick });
    remaining -= pick;
  }

  return result;
}

/** 分类时解析可分配库位：优先已保存推荐量，否则按 FIFO 在可用库存上拆分 */
function resolveClassifyLocationPicks(locations: LocationRec[], demandInventoryQty: number, salesOrderConstraint?: SalesOrderInventoryConstraint): LocationRec[] {
  const explicit = locations.filter((loc) => Number(loc.recommendedQty ?? 0) > 0);
  if (explicit.length) {
    return capLocationPicksToInventoryDemand(explicit, demandInventoryQty);
  }

  const stockLocs = locations.filter((loc) => Number(loc.availableQty ?? 0) > 0);
  if (!stockLocs.length || demandInventoryQty <= 0) return [];

  const constraint = salesOrderConstraint || {};
  const fifoInput = stockLocs.map((loc, index) => locationRecToFifoInput(loc, index));
  const { recommendedRows } = recommendLocationsByFifo(fifoInput, demandInventoryQty, {
    canAllocate: (row) => isOperatableLocationForBom(constraint, row)
  });
  return recommendedRows
    .map((row, index) =>
      normalizeLocationRec({
        ...row,
        availableQty: row.availableQuantity,
        recommendedQty: row.recommendedQty,
        rowKey: row.rowKey || resolveLocationPickKey(row as Record<string, unknown>, index)
      })
    )
    .filter((loc): loc is LocationRec => !!loc);
}

function appendLocationDemandRows(
  rows: MaterialDemandDetailRow[],
  picks: LocationRec[],
  ctx: {
    workOrderNo: string;
    materialCode: string;
    issueUnit?: string;
    routeCtx: WarehouseRouteContext;
    conversionRatio?: number;
    locationSource?: import('@/api/wms/workOrderPrepDemand/types').PrepDemandLocationSource;
    attachMeta: (row: MaterialDemandDetailRow) => MaterialDemandDetailRow;
  }
): number {
  let allocatedInventory = 0;
  for (const loc of picks) {
    const pickInventory = Number(loc.recommendedQty ?? 0);
    if (pickInventory <= 0) continue;
    const pickIssue = inventoryQtyToIssueQty(pickInventory, ctx.conversionRatio);
    if (pickIssue <= 0) continue;

    const { warehouseCode, locationCode, areaCode } = resolveWarehouseAndLocation(loc);
    rows.push(
      ctx.attachMeta({
        workOrderNo: ctx.workOrderNo,
        materialCode: ctx.materialCode,
        issueQty: pickIssue,
        prepInventoryQty: pickInventory,
        issueUnit: ctx.issueUnit,
        recommendedWarehouse: warehouseCode,
        recommendedLocation: locationCode,
        warehouseRoute: resolveRouteByWarehouse(warehouseCode, ctx.routeCtx, loc),
        lineType: 'LOCATION',
        areaCode,
        batchCode: loc.batchCode,
        fifoSequence: loc.fifoSequence,
        locationSource: ctx.locationSource ?? 'SYSTEM',
        specialInventoryFlag: loc.specialInventoryFlag,
        businessCode: loc.businessCode,
        businessName: loc.businessName
      })
    );
    allocatedInventory += pickInventory;
  }
  return allocatedInventory;
}

export function isClassifiedShortageRow(row: Pick<import('./types').MaterialDemandDetailRow, 'lineType' | 'warehouseRoute'>): boolean {
  return row.lineType === 'SHORTAGE' || row.warehouseRoute === 'SHORTAGE';
}

export function expandMaterialToDemandRows(workOrderNo: string, materialCode: string, issueQty: number, issueUnit: string | undefined, bomLine: BomLineResult | undefined, routeCtx: WarehouseRouteContext, conversionRatio?: number, salesOrderConstraint?: SalesOrderInventoryConstraint, bomLineId?: number | string, reserveNo?: string, reserveItemNo?: string, locationOverrideReason?: string): MaterialDemandDetailRow[] {
  const rows: MaterialDemandDetailRow[] = [];
  const totalIssueQty = Number(issueQty);
  if (totalIssueQty <= 0) return rows;

  const attachMeta = (row: MaterialDemandDetailRow): MaterialDemandDetailRow => {
    const meta: MaterialDemandDetailRow = { ...row };
    if (bomLineId != null && bomLineId !== '') meta.bomLineId = bomLineId;
    if (reserveNo) meta.reserveNo = reserveNo;
    if (reserveItemNo) meta.reserveItemNo = reserveItemNo;
    const remark = String(locationOverrideReason ?? '').trim();
    if (remark) meta.locationOverrideReason = remark;
    return meta;
  };

  const shortageInventoryType = resolveShortageInventoryType(salesOrderConstraint);
  const demandInventoryQty = issueQtyToInventoryQty(totalIssueQty, conversionRatio);
  const locations = bomLine?.recommendedLocations || [];
  const picks = resolveClassifyLocationPicks(locations, demandInventoryQty, salesOrderConstraint);

  if (picks.length > 0) {
    const allocatedInventory = appendLocationDemandRows(rows, picks, {
      workOrderNo,
      materialCode,
      issueUnit,
      routeCtx,
      conversionRatio,
      locationSource: bomLine?.locationSource ?? 'SYSTEM',
      attachMeta
    });

    const shortageInventory = Math.max(0, demandInventoryQty - allocatedInventory);
    if (shortageInventory > 0) {
      rows.push(
        attachMeta({
          workOrderNo,
          materialCode,
          issueQty: inventoryQtyToIssueQty(shortageInventory, conversionRatio),
          prepInventoryQty: shortageInventory,
          issueUnit,
          recommendedWarehouse: undefined,
          recommendedLocation: undefined,
          warehouseRoute: 'SHORTAGE',
          lineType: 'SHORTAGE',
          ...buildShortageDemandInventoryMeta(salesOrderConstraint, shortageInventoryType)
        })
      );
    }
    return rows;
  }

  rows.push(
    attachMeta({
      workOrderNo,
      materialCode,
      issueQty: totalIssueQty,
      prepInventoryQty: demandInventoryQty,
      issueUnit,
      recommendedWarehouse: undefined,
      recommendedLocation: undefined,
      warehouseRoute: 'SHORTAGE',
      lineType: 'SHORTAGE',
      ...buildShortageDemandInventoryMeta(salesOrderConstraint, shortageInventoryType)
    })
  );
  return rows;
}

function summarizeMaterialRoute(details: MaterialDemandDetailRow[]): WarehouseRoute | undefined {
  const routes = new Set(details.map((d) => d.warehouseRoute));
  if (routes.size === 1) return details[0]?.warehouseRoute;
  return undefined;
}

function buildBomLineFromIssueLine(line: WorkOrderMaterialIssueLine): BomLineResult {
  const otherLine = normalizeLocationList(line.otherLineWarehouseLocations);
  const manual = normalizeLocationList(line.manualLocationSelections);
  const hasManual = manual.some((loc) => Number(loc.recommendedQty ?? 0) > 0);
  if (hasManual) {
    return {
      materialCode: line.materialCode,
      recommendedLocations: manual,
      otherLineWarehouseLocations: otherLine,
      locationSource: 'MANUAL'
    };
  }
  const fifo = normalizeLocationList(line.fifoRecommendedLocations);
  return {
    materialCode: line.materialCode,
    recommendedLocations: fifo,
    otherLineWarehouseLocations: otherLine,
    locationSource: 'SYSTEM'
  };
}

function buildMaterialLocationContextForOrder(materialIssues: WorkOrderMaterialIssueLine[]): Map<string, BomLineResult> {
  const lineResultMap = new Map<string, BomLineResult>();
  materialIssues
    .filter((line) => Number(line.issueQty) > 0)
    .forEach((line) => {
      lineResultMap.set(getIssueLineKey(line), buildBomLineFromIssueLine(line));
    });
  return lineResultMap;
}

function resolveIssueLineSalesOrderConstraint(line: WorkOrderMaterialIssueLine, _order?: Pick<WorkOrderVO, 'salesOrderNo' | 'salesOrderItem'>): SalesOrderInventoryConstraint {
  return resolveBomSalesOrderConstraint(line);
}

function classifyMaterialIssues(materialIssues: WorkOrderMaterialIssueLine[], lineResultMap: Map<string, BomLineResult>, routeCtx: WarehouseRouteContext, workOrderNo: string, order?: Pick<WorkOrderVO, 'salesOrderNo' | 'salesOrderItem'>): { materialIssues: WorkOrderMaterialIssueLine[]; materialDemandDetails: MaterialDemandDetailRow[] } {
  const allDetails: MaterialDemandDetailRow[] = [];

  const updatedIssues = materialIssues.map((line) => {
    if (Number(line.issueQty) <= 0) {
      return { ...line, warehouseRoute: undefined, recommendedWarehouse: undefined };
    }
    const bomLine = lineResultMap.get(getIssueLineKey(line));
    const details = expandMaterialToDemandRows(workOrderNo, line.materialCode, Number(line.issueQty), line.issueUnit, bomLine, routeCtx, line.conversionRatio, resolveIssueLineSalesOrderConstraint(line, order), line.bomLineId, line.reserveNo, line.reserveItemNo, line.locationOverrideReason);
    allDetails.push(...details);

    const primaryWh = details.find((d) => d.lineType === 'LOCATION')?.recommendedWarehouse;
    return {
      ...line,
      warehouseRoute: summarizeMaterialRoute(details),
      recommendedWarehouse: primaryWh
    };
  });

  return { materialIssues: updatedIssues, materialDemandDetails: allDetails };
}

async function loadDictCodes(dictType: string): Promise<string[]> {
  const cached = useDictStore().getDict(dictType);
  if (cached?.length) {
    return [...new Set(cached.map((d) => String(d.value).trim()).filter(Boolean))];
  }
  const resp = await getDicts(dictType);
  const options = resp.data.map(
    (p): DictDataOption => ({
      label: p.dictLabel,
      value: p.dictValue,
      elTagType: p.listClass,
      elTagClass: p.cssClass
    })
  );
  useDictStore().setDict(dictType, options);
  return [...new Set(options.map((d) => String(d.value).trim()).filter(Boolean))];
}

export async function loadWarehouseRouteContext(): Promise<WarehouseRouteContext> {
  const [autoWarehouseCodes, lineSideWarehouseCodes] = await Promise.all([loadDictCodes('wms_warehouse_auto'), loadDictCodes('wms_warehouse_line')]);
  return { autoWarehouseCodes, lineSideWarehouseCodes };
}

function classifySingleOrder(order: WorkOrderVO, routeCtx: WarehouseRouteContext): WorkOrderVO {
  const materialIssues = order.materialIssues || [];
  const activeLines = materialIssues.filter((line) => Number(line.issueQty) > 0);
  if (activeLines.length === 0) {
    return {
      ...order,
      warehouseRoute: undefined,
      recommendedWarehouses: [],
      materialDemandDetails: []
    } as WorkOrderVO;
  }

  const lineResultMap = buildMaterialLocationContextForOrder(materialIssues);
  const { materialIssues: updatedIssues, materialDemandDetails } = classifyMaterialIssues(materialIssues, lineResultMap, routeCtx, order.workOrderNo, order);
  const recommendedWarehouses = [...new Set(materialDemandDetails.map((line) => line.recommendedWarehouse).filter((code): code is string => !!code))];

  return {
    ...order,
    materialIssues: updatedIssues,
    materialDemandDetails,
    warehouseRoute: summarizeMaterialRoute(materialDemandDetails),
    recommendedWarehouses
  } as WorkOrderVO;
}

export async function classifyWorkOrders(orders: WorkOrderVO[]): Promise<ClassifyWorkOrdersResult> {
  const routeCtx = await loadWarehouseRouteContext();
  const classifiedOrders = orders.map((order) => classifySingleOrder(order, routeCtx));

  return {
    orders: classifiedOrders,
    autoWarehouseCodes: routeCtx.autoWarehouseCodes,
    lineSideWarehouseCodes: routeCtx.lineSideWarehouseCodes
  };
}

export function flattenClassifiedMaterials(orders: WorkOrderVO[]): ClassifiedMaterialRow[] {
  const rows: ClassifiedMaterialRow[] = [];
  forEachSelectedDemandDetail(orders, (_order, line) => {
    rows.push(line);
  });
  return rows;
}

export function findIssueLineForDemandDetail(order: Pick<WorkOrderVO, 'materialIssues'>, row: Pick<MaterialDemandDetailRow, 'reserveNo' | 'reserveItemNo' | 'materialCode'>): WorkOrderMaterialIssueLine | undefined {
  const issues = order.materialIssues || [];
  const reserveNo = String(row.reserveNo ?? '').trim();
  const reserveItemNo = String(row.reserveItemNo ?? '').trim();
  if (reserveNo && reserveItemNo) {
    const matched = issues.find((line) => String(line.reserveNo ?? '').trim() === reserveNo && String(line.reserveItemNo ?? '').trim() === reserveItemNo);
    if (matched) return matched;
  }
  return issues.find((line) => line.materialCode === row.materialCode);
}

/** 分类行本次备料数量（库存单位） */
export function resolveDemandDetailPrepQty(row: Pick<MaterialDemandDetailRow, 'issueQty'>, issueLine?: Pick<WorkOrderMaterialIssueLine, 'conversionRatio'>): number {
  return issueQtyToInventoryQty(Number(row.issueQty ?? 0), issueLine?.conversionRatio);
}

export function formatDemandDetailPrepQty(row: Pick<MaterialDemandDetailRow, 'issueQty' | 'issueUnit'>, issueLine?: Pick<WorkOrderMaterialIssueLine, 'conversionRatio' | 'issueUnit'>): string {
  const qty = resolveDemandDetailPrepQty(row, issueLine);
  const unit = String(row.issueUnit || issueLine?.issueUnit || '').trim();
  return unit ? `${qty} ${unit}` : String(qty);
}
