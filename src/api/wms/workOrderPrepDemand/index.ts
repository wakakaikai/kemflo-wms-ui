import request from '@/utils/request';
import { formatQtyWithUnit } from '@/utils/ruoyi';
import { AxiosPromise } from 'axios';
import type { MaterialDemandDetailRow, WarehouseRouteContext, WorkOrderMaterialIssueLine } from '@/api/wms/allocation/types';
import { parseSalesOrderBusinessCode, resolveLocationMeta, resolveRouteByWarehouse, resolveShortageInventoryType } from '@/api/wms/allocation/index';
import { useDictStore } from '@/store/modules/dict';
import type { PrepDemand261Route, PrepDemandDisplayRow, PrepDemandLineVO, PrepDemandLocationSource, PrepDemandShortageType, PrepDemandWoVO, PrepLocationRecVO, WorkOrderPrepDemandForm, WorkOrderPrepDemandQuery, WorkOrderPrepDemandVO } from './types';
import { mapRecommendationSourceToLocationSource, resolvePrepLocationRecommendationSource } from './locationSource';

export { PREP_LOCATION_REC_USER_SELECTED, PREP_LOCATION_REC_SYSTEM_RECOMMENDED, mapLocationSourceToRecommendationSource, mapRecommendationSourceToLocationSource, isPrepLocationUserSelected, isPrepLocationSystemRecommended, resolvePrepLocationRecommendationSource } from './locationSource';
export type { PrepLocationRecommendationSource } from './locationSource';
export type { PrepDemandDisplayRow, PrepDemand261Route, PrepDemandShortageType, PrepDemandStatus } from './types';

/** 备料需求单据类型字典 */
export const PREP_DEMAND_TYPE_DICT = 'wms_prepare_demand_type';

/** 备料需求状态字典 */
export const PREP_DEMAND_STATUS_DICT = 'wms_prepare_demand_status';

/** 超领原因字典（SAP grund） */
export const MATERIAL_OVER_PICK_DICT = 'wms_material_over_pick';

/** 创建备料需求默认状态 */
export const DEFAULT_PREP_DEMAND_STATUS = 'WAIT_PICK';

/** 普通领料单 */
export const PREP_DEMAND_TYPE_NORMAL = 'NORMAL';
/** 超领单 */
export const PREP_DEMAND_TYPE_OVER_PICK = 'OVER_PICK';

const OVER_PICK_LEGACY_REMARK = '工单超领';

export function isOverPickPrepDemand(source?: { demandType?: string | null; remark?: string | null } | null): boolean {
  if (!source) return false;
  if (
    String(source.demandType ?? '')
      .trim()
      .toUpperCase() === PREP_DEMAND_TYPE_OVER_PICK
  )
    return true;
  return String(source.remark ?? '').includes(OVER_PICK_LEGACY_REMARK);
}

type PrepDemandKitRateSource = {
  demandType?: string | null;
  remark?: string | null;
  kitRate?: number | string | null;
  totalRequired?: number | string | null;
  totalShortage?: number | string | null;
  workOrders?: Array<{
    kitRate?: number | string | null;
    lines?: Array<{
      issueQty?: number | string | null;
      kitRate?: number | string | null;
      locationRecs?: Array<{ issueQty?: number | string | null }>;
    }>;
  }>;
};

function resolveLineLocationCoveredKitRate(line: { issueQty?: number | string | null; locationRecs?: Array<{ issueQty?: number | string | null }> }): number {
  const issueQty = Number(line.issueQty ?? 0);
  if (issueQty <= 0) return 1;
  const coveredQty = (line.locationRecs ?? []).reduce((sum, rec) => sum + Number(rec.issueQty ?? 0), 0);
  return Math.min(coveredQty / issueQty, 1);
}

/** 超领单按库位分配量/发料量展示齐套率；普通单用头表 kitRate */
export function resolvePrepDemandKitRate(demand?: PrepDemandKitRateSource | null): number {
  if (!demand) return 0;
  if (!isOverPickPrepDemand(demand)) {
    return Number(demand.kitRate ?? 0);
  }
  const lines = (demand.workOrders ?? []).flatMap((wo) => wo.lines ?? []);
  if (lines.length) {
    return lines.reduce((min, line) => Math.min(min, resolveLineLocationCoveredKitRate(line)), 1);
  }
  const stored = Number(demand.kitRate ?? 0);
  if (stored > 0) return stored;
  if (Number(demand.totalShortage ?? 0) === 0 && Number(demand.totalRequired ?? 0) > 0) {
    return 1;
  }
  return stored;
}

export function resolvePrepDemandWoKitRate(
  wo: {
    kitRate?: number | string | null;
    lines?: Array<{
      issueQty?: number | string | null;
      locationRecs?: Array<{ issueQty?: number | string | null }>;
    }>;
  },
  demand?: PrepDemandKitRateSource | null
): number {
  if (demand && isOverPickPrepDemand(demand)) {
    const lines = wo.lines ?? [];
    if (lines.length) {
      return lines.reduce((min, line) => Math.min(min, resolveLineLocationCoveredKitRate(line)), 1);
    }
    return 1;
  }
  return Number(wo.kitRate ?? 0);
}

// prep demand display & status helpers

type DictTagType = 'info' | 'success' | 'warning' | 'primary' | 'danger';

function resolveDemandTypeOptions(options?: DictDataOption[]) {
  return options ?? useDictStore().getDict(PREP_DEMAND_TYPE_DICT) ?? [];
}

function findDemandTypeOption(type?: string, options?: DictDataOption[]) {
  const normalized = String(type ?? '').trim();
  if (!normalized) return undefined;
  return resolveDemandTypeOptions(options).find((item) => String(item.value) === normalized);
}

export function demandTypeLabel(type?: string, options?: DictDataOption[]) {
  const hit = findDemandTypeOption(type, options);
  const normalized = String(type ?? '').trim();
  return hit?.label || normalized || '-';
}

export function demandTypeTag(type?: string, options?: DictDataOption[]): DictTagType {
  const hit = findDemandTypeOption(type, options);
  const tag = hit?.elTagType;
  if (tag === 'primary' || tag === 'success' || tag === 'info' || tag === 'warning' || tag === 'danger') {
    return tag;
  }
  return 'info';
}

export function resolveDemandStatusOptions(options?: DictDataOption[]) {
  return options ?? useDictStore().getDict(PREP_DEMAND_STATUS_DICT) ?? [];
}

function findDemandStatusOption(status?: string, options?: DictDataOption[]) {
  const normalized = String(status ?? '').trim();
  if (!normalized) return undefined;
  return resolveDemandStatusOptions(options).find((item) => String(item.value) === normalized);
}

export function demandStatusLabel(status?: string, options?: DictDataOption[]) {
  const hit = findDemandStatusOption(status, options);
  const normalized = String(status ?? '').trim();
  return hit?.label || normalized || '-';
}

export function demandStatusTag(status?: string, options?: DictDataOption[]): DictTagType {
  const hit = findDemandStatusOption(status, options);
  const tag = hit?.elTagType;
  if (tag === 'primary' || tag === 'success' || tag === 'info' || tag === 'warning' || tag === 'danger') {
    return tag;
  }
  return 'info';
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

function pickInventoryFields(source: { specialInventoryFlag?: string; businessCode?: string; businessName?: string; salesOrderNo?: string; salesOrderItem?: string; shortageInventoryType?: PrepDemandShortageType }): Pick<PrepDemandDisplayRow, 'specialInventoryFlag' | 'businessCode' | 'businessName'> {
  const flag = String(source.specialInventoryFlag ?? '')
    .trim()
    .toUpperCase();
  const shortageIsSo = source.shortageInventoryType === 'SALES_ORDER';
  const resolvedFlag = flag && flag !== 'N' ? flag : shortageIsSo ? 'E' : 'N';
  const businessCode = String(source.businessCode ?? '').trim() || (resolvedFlag === 'E' ? String(source.salesOrderNo ?? '').trim() : '') || undefined;
  // 销售订单库存：合作伙伴名称取 businessName 原值，不用 salesOrderItem / businessCode 拆分项次
  const businessName = String(source.businessName ?? '').trim() || undefined;
  return {
    specialInventoryFlag: resolvedFlag === 'N' ? undefined : resolvedFlag,
    businessCode,
    businessName
  };
}

/** 备料行展示用特殊库存标识（优先 specialInventoryFlag，非限制为 N） */
export function resolvePrepRowInventoryFlag(row: Pick<PrepDemandDisplayRow, 'specialInventoryFlag' | 'shortageInventoryType'>): string {
  const flag = String(row.specialInventoryFlag ?? '')
    .trim()
    .toUpperCase();
  if (flag) return flag;
  if (row.shortageInventoryType === 'SALES_ORDER') return 'E';
  return 'N';
}

export function isPrepRowSpecialInventory(row: PrepDemandDisplayRow): boolean {
  return resolvePrepRowInventoryFlag(row) !== 'N';
}

export function resolvePrepRowBusinessPartner(row: PrepDemandDisplayRow): { businessCode?: string; businessName?: string } {
  if (!isPrepRowSpecialInventory(row)) return {};
  const isSalesOrder = resolvePrepRowInventoryFlag(row) === 'E';
  return {
    businessCode: String(row.businessCode ?? (isSalesOrder ? row.salesOrderNo : '') ?? '').trim() || undefined,
    businessName: isSalesOrder
      ? String(row.businessName ?? '').trim() || undefined
      : String(row.businessName ?? row.salesOrderItem ?? '').trim() || undefined
  };
}

/** 销售订单库存：订单号与项次（与合作伙伴名称展示分离，项次可从 businessCode 拆分） */
export function resolvePrepRowSalesOrderFields(
  row: Pick<PrepDemandDisplayRow, 'specialInventoryFlag' | 'shortageInventoryType' | 'businessCode' | 'salesOrderNo' | 'salesOrderItem'>
): { salesOrderNo?: string; salesOrderItem?: string } {
  if (resolvePrepRowInventoryFlag(row) !== 'E') return {};
  const parsed = parseSalesOrderBusinessCode(row.businessCode);
  const salesOrderNo = String(row.salesOrderNo ?? '').trim() || parsed.salesOrderNo || String(row.businessCode ?? '').trim() || undefined;
  const salesOrderItem = String(row.salesOrderItem ?? '').trim() || parsed.salesOrderItem || undefined;
  return { salesOrderNo, salesOrderItem };
}

export function resolvePrepRowLocationAdjustRemark(row: Pick<PrepDemandDisplayRow, 'recommendationReason' | 'overPickReason'>): string {
  const text = String(row.recommendationReason ?? '').trim();
  const overPickReason = String(row.overPickReason ?? '').trim();
  if (!text) return '';
  if (overPickReason && text === overPickReason) return '';
  return text;
}

export function hasPrepRowAdjustRemark(rows: PrepDemandDisplayRow[]): boolean {
  return rows.some((row) => resolvePrepRowLocationAdjustRemark(row).length > 0);
}

export function resolvePrepRowRemark(row: Pick<PrepDemandDisplayRow, 'locationRemark'> & { remark?: string }): string {
  return String(row.locationRemark ?? row.remark ?? '').trim();
}

export function hasPrepRowRemark(rows: Array<Pick<PrepDemandDisplayRow, 'locationRemark'> & { remark?: string }>): boolean {
  return rows.some((row) => resolvePrepRowRemark(row).length > 0);
}

export function hasPrepRowOverPickInfo(rows: Pick<PrepDemandDisplayRow, 'overPickCode' | 'overPickReason'>[]): boolean {
  return rows.some((row) => String(row.overPickCode ?? '').trim());
}

function resolveMaterialOverPickOptions(options?: DictDataOption[]) {
  return options ?? useDictStore().getDict(MATERIAL_OVER_PICK_DICT) ?? [];
}

export function resolveOverPickReasonLabel(code?: string | number | null, options?: DictDataOption[]): string {
  const normalized = String(code ?? '').trim();
  if (!normalized) return '';
  const hit = resolveMaterialOverPickOptions(options).find((item) => String(item.value) === normalized);
  return String(hit?.label ?? '').trim();
}

/** 超领编码/原因合并展示（原因走字典，避免后端 overPickReason 乱码） */
export function formatPrepRowOverPickDisplay(row: Pick<PrepDemandDisplayRow, 'overPickCode' | 'overPickReason'>, options?: DictDataOption[]): string {
  const code = String(row.overPickCode ?? '').trim();
  const reasonLabel = resolveOverPickReasonLabel(code, options);
  if (code && reasonLabel) return `${code}-${reasonLabel}`;
  if (code) return code;
  if (reasonLabel) return reasonLabel;
  return '-';
}

export function hasPrepRowBusinessCode(rows: PrepDemandDisplayRow[]): boolean {
  return rows.some((row) => Boolean(resolvePrepRowBusinessPartner(row).businessCode));
}

export function hasPrepRowBusinessName(rows: PrepDemandDisplayRow[]): boolean {
  return rows.some((row) => Boolean(resolvePrepRowBusinessPartner(row).businessName));
}

export function formatPrepQtyWithUnit(row: Pick<PrepDemandDisplayRow, 'prepQty' | 'issueQty'  | 'warehouseRoute' | 'lineType' | 'unit' | 'inventoryUnit'>): string {
  const unit = row.inventoryUnit;
  const qty = row.prepQty ?? row.issueQty;
  return formatQtyWithUnit(qty, unit);
}

interface ShortageMeta {
  shortageInventoryType: PrepDemandShortageType;
  salesOrderNo?: string;
  salesOrderItem?: string;
}

function normalizeShortageInventoryType(raw?: string): PrepDemandShortageType | undefined {
  if (!raw) return undefined;
  const value = String(raw).trim().toUpperCase();
  if (value === 'SALES_ORDER' || value === 'E') return 'SALES_ORDER';
  if (value === 'UNRESTRICTED' || value === 'N' || value === 'NON_RESTRICTED') return 'UNRESTRICTED';
  if (String(raw).includes('销售订单')) return 'SALES_ORDER';
  if (String(raw).includes('非限制')) return 'UNRESTRICTED';
  return undefined;
}

function pickLineSalesOrderFields(line: Pick<PrepDemandLineVO, 'salesOrderNo' | 'salesOrderItem'>, wo?: Pick<PrepDemandWoVO, 'salesOrderNo' | 'salesOrderItem'>, lineOnly = false): { salesOrderNo?: string; salesOrderItem?: string } {
  const salesOrderNo = String((lineOnly ? line.salesOrderNo : (line.salesOrderNo ?? wo?.salesOrderNo)) ?? '').trim() || undefined;
  const salesOrderItem = String((lineOnly ? line.salesOrderItem : (line.salesOrderItem ?? wo?.salesOrderItem)) ?? '').trim() || undefined;
  return { salesOrderNo, salesOrderItem };
}

function bumpShortageMeta(map: Map<string, ShortageMeta>, workOrderNo: string, materialCode: string, partial: Partial<ShortageMeta>) {
  if (!workOrderNo || !materialCode) return;
  const key = `${workOrderNo}|${materialCode}`;
  const prev = map.get(key);
  let nextType: PrepDemandShortageType;
  if (partial.shortageInventoryType === 'SALES_ORDER') {
    nextType = 'SALES_ORDER';
  } else if (partial.shortageInventoryType === 'UNRESTRICTED') {
    nextType = 'UNRESTRICTED';
  } else {
    nextType = prev?.shortageInventoryType ?? 'UNRESTRICTED';
  }
  map.set(key, {
    shortageInventoryType: nextType,
    salesOrderNo: nextType === 'SALES_ORDER' ? partial.salesOrderNo || prev?.salesOrderNo : undefined,
    salesOrderItem: nextType === 'SALES_ORDER' ? partial.salesOrderItem || prev?.salesOrderItem : undefined
  });
}

function resolveShortageTypeForLine(line: Pick<PrepDemandLineVO, 'workOrderNo' | 'materialCode' | 'shortageInventoryType' | 'salesOrderNo' | 'salesOrderItem' | 'specialInventoryFlag'>, wo?: Pick<PrepDemandWoVO, 'salesOrderNo' | 'salesOrderItem'>, index?: Map<string, ShortageMeta>): PrepDemandShortageType {
  const flag = String(line.specialInventoryFlag ?? '')
    .trim()
    .toUpperCase();
  if (flag === 'E') return 'SALES_ORDER';
  if (flag === 'N') return 'UNRESTRICTED';
  const fromFlag = normalizeShortageInventoryType(flag);
  if (fromFlag) return fromFlag;
  const explicit = normalizeShortageInventoryType(line.shortageInventoryType);
  if (explicit) return explicit;
  return index?.get(`${line.workOrderNo}|${line.materialCode}`)?.shortageInventoryType ?? 'UNRESTRICTED';
}

function resolveShortageMetaForLine(line: Pick<PrepDemandLineVO, 'workOrderNo' | 'materialCode' | 'shortageInventoryType' | 'salesOrderNo' | 'salesOrderItem' | 'specialInventoryFlag'>, wo?: Pick<PrepDemandWoVO, 'salesOrderNo' | 'salesOrderItem'>, index?: Map<string, ShortageMeta>): ShortageMeta {
  const explicitType = normalizeShortageInventoryType(line.shortageInventoryType);
  const shortageInventoryType = explicitType ?? resolveShortageTypeForLine(line, wo, index);
  if (shortageInventoryType === 'UNRESTRICTED') {
    return { shortageInventoryType: 'UNRESTRICTED' };
  }
  const lineSo = pickLineSalesOrderFields(line, undefined, true);
  const fromIndex = index?.get(`${line.workOrderNo}|${line.materialCode}`);
  return {
    shortageInventoryType: 'SALES_ORDER',
    salesOrderNo: lineSo.salesOrderNo ?? fromIndex?.salesOrderNo,
    salesOrderItem: lineSo.salesOrderItem ?? fromIndex?.salesOrderItem
  };
}

function buildShortageMetaIndex(demand: WorkOrderPrepDemandVO, locationHints?: MaterialDemandDetailRow[], issueLineHints?: Array<WorkOrderMaterialIssueLine & { workOrderNo: string }>): Map<string, ShortageMeta> {
  const map = new Map<string, ShortageMeta>();

  // API demand lines are authoritative (specialInventoryFlag N/E/K/W etc.)
  demand.workOrders?.forEach((wo) => {
    wo.lines?.forEach((line) => {
      const isShortageLine = line.lineType === 'SHORTAGE' || line.warehouseRoute === 'SHORTAGE' || Number(line.shortageQty ?? 0) > 0 || !!line.shortageInventoryType || !!String(line.specialInventoryFlag ?? '').trim();
      if (!isShortageLine && !line.specialInventoryFlag) return;
      const type = resolveShortageTypeForLine(line, wo);
      const partial: Partial<ShortageMeta> = { shortageInventoryType: type };
      if (type === 'SALES_ORDER') {
        const so = pickLineSalesOrderFields(line, undefined, true);
        partial.salesOrderNo = so.salesOrderNo;
        partial.salesOrderItem = so.salesOrderItem;
      }
      bumpShortageMeta(map, line.workOrderNo, line.materialCode, partial);
    });
  });

  // Session/BOM hints only fill gaps; must not override demand API shortage type
  issueLineHints?.forEach((line) => {
    const key = `${line.workOrderNo}|${line.materialCode}`;
    if (map.has(key)) return;
    const type = resolveShortageInventoryType({
      salesOrderNo: line.salesOrderNo,
      salesOrderItem: line.salesOrderItem,
      specialInventoryFlag: line.specialInventoryFlag
    });
    const partial: Partial<ShortageMeta> = { shortageInventoryType: type };
    if (type === 'SALES_ORDER') {
      const so = pickLineSalesOrderFields(line, undefined, true);
      partial.salesOrderNo = so.salesOrderNo;
      partial.salesOrderItem = so.salesOrderItem;
    }
    bumpShortageMeta(map, line.workOrderNo, line.materialCode, partial);
  });

  locationHints?.forEach((hint) => {
    if (hint.lineType === 'SHORTAGE' || hint.warehouseRoute === 'SHORTAGE' || hint.warehouseRoute === 'OTHER_LINE') {
      const key = `${hint.workOrderNo}|${hint.materialCode}`;
      if (map.has(key)) return;
      bumpShortageMeta(map, hint.workOrderNo, hint.materialCode, {
        shortageInventoryType: normalizeShortageInventoryType(hint.shortageInventoryType)
      });
    }
  });

  return map;
}

function normalizeRoute(route?: string, lineType?: string): PrepDemandDisplayRow['warehouseRoute'] {
  if (lineType === 'SHORTAGE' || route === 'SHORTAGE' || route === 'OTHER_LINE') return 'SHORTAGE';
  if (route === 'AUTO' || route === 'LINE' || route === 'FLAT') return route;
  return 'FLAT';
}

function mapHintRow(h: MaterialDemandDetailRow, idx: number, nameMap: Map<string, string>, issueUnitMap: Map<string, string>): PrepDemandDisplayRow {
  const key = `${h.workOrderNo}|${h.materialCode}`;
  const unit = h.issueUnit || issueUnitMap.get(key) || '';
  const issueQty = Number(h.prepInventoryQty ?? h.issueQty);
  const isShortage = h.lineType === 'SHORTAGE' || h.warehouseRoute === 'SHORTAGE';
  return {
    rowKey: `hint-${idx}`,
    warehouseRoute: normalizeRoute(h.warehouseRoute, h.lineType),
    lineType: h.lineType,
    workOrderNo: h.workOrderNo,
    materialCode: h.materialCode,
    materialName: nameMap.get(`${h.workOrderNo}|${h.materialCode}`) || '',
    issueQty,
    prepQty: issueQty,
    shortageQty: isShortage ? issueQty : undefined,
    bomComponentQty: undefined,
    issuedQty: undefined,
    availableQty: isShortage ? 0 : issueQty,
    unit,
    inventoryUnit: unit,
    warehouseCode: h.recommendedWarehouse || '-',
    locationCode: h.recommendedLocation || '-',
    areaCode: h.areaCode || '-',
    batchCode: h.batchCode || '-',
    locationSource: h.locationSource ?? 'SYSTEM',
    locationRemark: h.locationOverrideReason,
    shortageInventoryType: normalizeShortageInventoryType(h.shortageInventoryType),
    ...pickInventoryFields({
      specialInventoryFlag: h.specialInventoryFlag,
      businessCode: h.businessCode,
      businessName: h.businessName,
      shortageInventoryType: normalizeShortageInventoryType(h.shortageInventoryType)
    })
  };
}

function resolveDisplayUnit(line: PrepDemandLineVO, inventoryUnitMap: Map<string, string>, wo?: PrepDemandWoVO): string {
  return String(line.inventoryUnit ?? '').trim() || inventoryUnitMap.get(`${line.workOrderNo}|${line.materialCode}`) || String(wo?.unit ?? '').trim();
}

function buildNameMap(demand: WorkOrderPrepDemandVO) {
  const nameMap = new Map<string, string>();
  demand.workOrders?.forEach((wo) => {
    wo.lines?.forEach((line) => {
      if (line.materialCode && line.materialName) {
        nameMap.set(`${line.workOrderNo}|${line.materialCode}`, line.materialName);
      }
    });
  });
  return nameMap;
}

function buildIssueUnitMap(demand: WorkOrderPrepDemandVO) {
  const inventoryUnitMap = new Map<string, string>();
  demand.workOrders?.forEach((wo) => {
    wo.lines?.forEach((line) => {
      const key = `${line.workOrderNo}|${line.materialCode}`;
      const inventoryUnit = String(line.inventoryUnit ?? '').trim();
      if (inventoryUnit) inventoryUnitMap.set(key, inventoryUnit);
    });
  });
  return inventoryUnitMap;
}

function isShortagePrepLine(line: { warehouseRoute?: string; lineType?: string; shortageQty?: number; issueQty?: number; pendingQty?: number; locationRecs?: PrepLocationRecVO[] }): boolean {
  const dedicated = line.lineType === 'SHORTAGE' || line.warehouseRoute === 'SHORTAGE';
  if (dedicated) {
    return resolveShortageQty(line, true) > 0;
  }
  if (Number(line.shortageQty ?? 0) > 0) return true;
  if (hasComputedShortage(line)) return true;
  const recs = line.locationRecs?.filter((rec) => Number(rec.issueQty ?? 0) > 0) ?? [];
  const pending = resolvePendingInventoryQty(line);
  if (pending > 0 && recs.length === 0) {
    // standalone shortage row: issueQty only, backend may omit lineType / shortageQty
    return line.lineType !== 'LOCATION' && line.warehouseRoute !== 'AUTO' && line.warehouseRoute !== 'LINE' && line.warehouseRoute !== 'FLAT';
  }
  return false;
}

/** 本次备料需求数量（优先 issueQty，pendingQty 为工单 BOM 待发，不能用于备料缺料计算） */
function resolvePendingInventoryQty(line: { pendingQty?: number; issueQty?: number }): number {
  const issueQty = Number(line.issueQty ?? 0);
  if (issueQty > 0) return issueQty;
  const pending = Number(line.pendingQty ?? 0);
  if (pending > 0) return pending;
  return 0;
}

function resolvePrepLineInventoryUnit(line: Pick<PrepDemandLineVO, 'inventoryUnit'>): string {
  return String(line.inventoryUnit ?? '').trim();
}

/** 备料需求已发数量：仅统计库位行 261 累计，不使用 BOM 已发料 */
function resolvePrepDemandLineIssuedQty(line: Pick<PrepDemandLineVO, 'locationRecs'>): number {
  const recs = line.locationRecs ?? [];
  if (!recs.length) return 0;
  return recs.reduce((sum, rec) => {
    const issued = Number(rec.issuedQty ?? 0);
    return sum + (Number.isFinite(issued) && issued > 0 ? issued : 0);
  }, 0);
}

function calcPrepDemandTotalIssuedQty(workOrders?: PrepDemandWoVO[]): number {
  return (workOrders ?? []).reduce((orderSum, wo) => {
    const lineSum = (wo.lines ?? []).reduce((sum, line) => sum + resolvePrepDemandLineIssuedQty(line), 0);
    return orderSum + lineSum;
  }, 0);
}

/** 规范化备料需求数量：已发默认 0，不从 BOM 已发料累加 */
export function normalizePrepDemand(demand: WorkOrderPrepDemandVO): WorkOrderPrepDemandVO {
  const workOrders = (demand.workOrders ?? []).map((wo) => ({
    ...wo,
    lines: (wo.lines ?? []).map((line) => ({
      ...line,
      issuedQty: resolvePrepDemandLineIssuedQty(line)
    }))
  }));
  const hasLines = workOrders.some((wo) => (wo.lines?.length ?? 0) > 0);
  const status = String(demand.demandStatus ?? '')
    .trim()
    .toUpperCase();
  const totalIssuedQty = hasLines ? calcPrepDemandTotalIssuedQty(workOrders) : status === 'WAIT_PICK' ? 0 : Number(demand.totalIssuedQty ?? 0);
  return {
    ...demand,
    workOrders: hasLines ? workOrders : demand.workOrders,
    totalIssuedQty
  };
}

/** 从 demand line 复制数量（缺料行等无 locationRecs 的场景） */
function mapLineQtyFields(line: PrepDemandLineVO, wo: PrepDemandWoVO, issueUnitMap: Map<string, string>): Pick<PrepDemandDisplayRow, 'bomComponentQty' | 'issuedQty' | 'prepQty' | 'shortageQty' | 'availableQty' | 'unit' | 'inventoryUnit'> {
  const unit = resolveDisplayUnit(line, issueUnitMap, wo);
  const inventoryUnit = resolvePrepLineInventoryUnit(line) || unit;
  return {
    bomComponentQty: Number(line.componentQty ?? 0),
    issuedQty: resolvePrepDemandLineIssuedQty(line),
    prepQty: Number(line.issueQty ?? 0),
    shortageQty: Number(line.shortageQty ?? 0),
    availableQty: Number(line.availableQty ?? 0),
    unit,
    inventoryUnit
  };
}

/** 从 locationRecs 复制库位行数量（发料数量=issueQty，可用取需求行 availableQty） */
function mapLocationRecQtyFields(rec: PrepLocationRecVO, line: PrepDemandLineVO, wo: PrepDemandWoVO, issueUnitMap: Map<string, string>): Pick<PrepDemandDisplayRow, 'bomComponentQty' | 'issuedQty' | 'prepQty' | 'shortageQty' | 'availableQty' | 'unit' | 'inventoryUnit' | 'issueQty'> {
  const unit = resolveDisplayUnit(line, issueUnitMap, wo);
  const inventoryUnit = String(rec.inventoryUnit ?? '').trim() || resolvePrepLineInventoryUnit(line);
  const recPrepQty = Number(rec.issueQty ?? 0);
  const issued = Number(rec.issuedQty ?? 0);
  return {
    bomComponentQty: Number(line.componentQty ?? 0),
    issuedQty: Number.isFinite(issued) && issued > 0 ? issued : 0,
    prepQty: recPrepQty,
    issueQty: recPrepQty,
    shortageQty: 0,
    availableQty: Number(line.availableQty ?? 0),
    unit,
    inventoryUnit
  };
}

function resolveLocationRecRoute(rec: PrepLocationRecVO, line: PrepDemandLineVO, warehouseCode: string, ctx: WarehouseRouteContext): PrepDemandDisplayRow['warehouseRoute'] {
  const recRoute = rec.warehouseRoute;
  if (recRoute === 'AUTO' || recRoute === 'LINE' || recRoute === 'FLAT') return recRoute;
  const lineRoute = line.warehouseRoute;
  if (lineRoute && lineRoute !== 'SHORTAGE') return lineRoute;
  return resolveRouteByWarehouse(warehouseCode === '-' ? undefined : warehouseCode, ctx, rec);
}

function shouldEmitShortageRow(_line: PrepDemandLineVO, computedShortageQty: number, _isDedicatedShortageLine: boolean): boolean {
  return computedShortageQty > 0;
}

function resolveShortageQty(
  line: {
    shortageQty?: number;
    pendingQty?: number;
    issueQty?: number;
    availableQty?: number;
    locationRecs?: PrepLocationRecVO[];
  },
  isDedicatedShortageLine: boolean
): number {
  const explicit = Number(line.shortageQty ?? 0);
  if (explicit > 0) return explicit;

  if (!isDedicatedShortageLine && line.shortageQty !== undefined && line.shortageQty !== null && String(line.shortageQty).trim() !== '') {
    return 0;
  }

  const prepQty = resolvePendingInventoryQty(line);
  const available = Number(line.availableQty ?? 0);
  if (prepQty > 0) {
    const byAvailable = Math.max(0, prepQty - available);
    if (byAvailable > 0) return byAvailable;
  }

  const recs = line.locationRecs?.filter((rec) => Number(rec.issueQty ?? 0) > 0) ?? [];
  if (recs.length && prepQty > 0) {
    const allocated = recs.reduce((sum, rec) => sum + Number(rec.issueQty ?? 0), 0);
    return Math.max(0, prepQty - allocated);
  }

  if (isDedicatedShortageLine && prepQty > 0) return prepQty;
  return 0;
}

function hasComputedShortage(line: { shortageQty?: number; pendingQty?: number; issueQty?: number; availableQty?: number; locationRecs?: PrepLocationRecVO[]; lineType?: string; warehouseRoute?: string }): boolean {
  if (Number(line.shortageQty ?? 0) > 0) return true;
  if (line.lineType !== 'SHORTAGE' && line.warehouseRoute !== 'SHORTAGE' && line.shortageQty !== undefined && line.shortageQty !== null && String(line.shortageQty).trim() !== '') {
    return false;
  }
  const prepQty = resolvePendingInventoryQty(line);
  const recs = line.locationRecs?.filter((rec) => Number(rec.issueQty ?? 0) > 0) ?? [];
  if (recs.length > 0) {
    const allocated = recs.reduce((sum, rec) => sum + Number(rec.issueQty ?? 0), 0);
    return prepQty > allocated;
  }
  const available = Number(line.availableQty ?? 0);
  return prepQty > available;
}

function getPrepDemandLineMergeKey(line: Pick<PrepDemandLineVO, 'workOrderNo' | 'materialCode' | 'reserveNo' | 'reserveItemNo' | 'bomLineId'>): string {
  return `${line.workOrderNo}|${line.reserveNo ?? ''}|${line.reserveItemNo ?? ''}|${line.bomLineId ?? ''}|${line.materialCode}`;
}

function dedupeLocationRecs(recs: PrepLocationRecVO[]): PrepLocationRecVO[] {
  const seen = new Set<string>();
  return recs.filter((rec) => {
    if (Number(rec.issueQty ?? 0) <= 0) return false;
    const key = `${rec.id ?? ''}|${rec.warehouseCode ?? ''}|${rec.locationCode ?? ''}|${rec.batchCode ?? ''}|${rec.issueQty ?? 0}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** 合并后端返回的重复物料行，避免库位明细与空头行重复展示 */
function mergePrepDemandLines(lines: PrepDemandLineVO[]): PrepDemandLineVO[] {
  const map = new Map<string, PrepDemandLineVO>();
  lines.forEach((line) => {
    const key = getPrepDemandLineMergeKey(line);
    const prev = map.get(key);
    if (!prev) {
      map.set(key, { ...line, locationRecs: dedupeLocationRecs(line.locationRecs ?? []) });
      return;
    }
    const mergedRecs = dedupeLocationRecs([...(prev.locationRecs ?? []), ...(line.locationRecs ?? [])]);
    map.set(key, {
      ...prev,
      ...line,
      locationRecs: mergedRecs.length ? mergedRecs : prev.locationRecs?.length ? prev.locationRecs : line.locationRecs
    });
  });
  return [...map.values()];
}

function joinDisplayCodes(codes: Set<string>, fallback = '-'): string {
  const list = [...codes].filter((code) => code && code !== '-').sort((a, b) => a.localeCompare(b));
  return list.length ? list.join(', ') : fallback;
}

/** 超领单全部明细：按物料汇总库位行，避免同一物料重复计数 */
export function aggregateOverPickAllDetailRows(rows: PrepDemandDisplayRow[]): PrepDemandDisplayRow[] {
  const map = new Map<string, PrepDemandDisplayRow & { _locationCodes: Set<string>; _warehouseCodes: Set<string>; _batchCodes: Set<string>; _remarks: Set<string> }>();
  rows.forEach((row) => {
    if (row.lineType === 'SHORTAGE' || row.warehouseRoute === 'SHORTAGE') return;
    const key = `${row.workOrderNo}|${row.reserveNo ?? ''}|${row.reserveItemNo ?? ''}|${row.materialCode}`;
    const loc = String(row.locationCode ?? '').trim();
    const wh = String(row.warehouseCode ?? '').trim();
    const batch = String(row.batchCode ?? '').trim();
    const remark = resolvePrepRowRemark(row);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        ...row,
        _locationCodes: new Set(loc && loc !== '-' ? [loc] : []),
        _warehouseCodes: new Set(wh && wh !== '-' ? [wh] : []),
        _batchCodes: new Set(batch && batch !== '-' ? [batch] : []),
        _remarks: new Set(remark ? [remark] : [])
      });
      return;
    }
    const prepQty = Number(existing.prepQty ?? 0) + Number(row.prepQty ?? 0);
    const issueQty = Number(existing.issueQty ?? 0) + Number(row.issueQty ?? 0);
    if (loc && loc !== '-') existing._locationCodes.add(loc);
    if (wh && wh !== '-') existing._warehouseCodes.add(wh);
    if (batch && batch !== '-') existing._batchCodes.add(batch);
    if (remark) existing._remarks.add(remark);
    map.set(key, {
      ...existing,
      prepQty,
      issueQty,
      overPickCode: existing.overPickCode ?? row.overPickCode,
      overPickReason: existing.overPickReason ?? row.overPickReason,
      _locationCodes: existing._locationCodes,
      _warehouseCodes: existing._warehouseCodes,
      _batchCodes: existing._batchCodes,
      _remarks: existing._remarks
    });
  });
  return [...map.values()].map(({ _locationCodes, _warehouseCodes, _batchCodes, _remarks, ...row }) => ({
    ...row,
    warehouseCode: joinDisplayCodes(_warehouseCodes, row.warehouseCode || '-'),
    locationCode: joinDisplayCodes(_locationCodes, row.locationCode || '-'),
    batchCode: joinDisplayCodes(_batchCodes, row.batchCode || '-'),
    locationRemark: [..._remarks].join('；') || row.locationRemark
  }));
}

function buildRowsFromDemand(demand: WorkOrderPrepDemandVO, ctx: WarehouseRouteContext, _nameMap: Map<string, string>, issueUnitMap: Map<string, string>, shortageMetaIndex: Map<string, ShortageMeta>): PrepDemandDisplayRow[] {
  const rows: PrepDemandDisplayRow[] = [];
  let seq = 0;
  const lineUnit = (line: PrepDemandLineVO, wo: PrepDemandWoVO) => resolveDisplayUnit(line, issueUnitMap, wo);

  demand.workOrders?.forEach((wo) => {
    mergePrepDemandLines(wo.lines ?? []).forEach((line) => {
      const explicitRoute = line.warehouseRoute;
      const explicitLineType = line.lineType;
      const recs = line.locationRecs?.filter((rec) => Number(rec.issueQty ?? 0) > 0) ?? [];
      const isDedicatedShortageLine = explicitLineType === 'SHORTAGE' || explicitRoute === 'SHORTAGE';
      const shortageQty = resolveShortageQty(line, isDedicatedShortageLine);
      const shouldShowShortage = shortageQty > 0 || isShortagePrepLine(line);

      if (recs.length) {
        recs.forEach((rec) => {
          const meta = resolveLocationMeta(rec.locationCode, rec);
          const warehouseCode = String(rec.warehouseCode || meta.warehouseCode || '').trim() || '-';
          const route = resolveLocationRecRoute(rec, line, warehouseCode, ctx);

          rows.push({
            rowKey: `rec-${seq++}`,
            locationRecId: rec.id,
            warehouseRoute: route,
            lineType: 'LOCATION',
            lineStatus: rec.lineStatus,
            workOrderNo: line.workOrderNo,
            materialCode: line.materialCode,
            materialName: line.materialName || '',
            ...mapLocationRecQtyFields(rec, line, wo, issueUnitMap),
            warehouseCode,
            locationCode: rec.locationCode || '-',
            areaCode: rec.areaCode || meta.areaCode || '-',
            batchCode: rec.batchCode || '-',
            locationSource: mapRecommendationSourceToLocationSource(resolvePrepLocationRecommendationSource(rec)),
            recommendationSource: rec.recommendationSource,
            recommendationReason: rec.recommendationReason,
            locationRemark: rec.remark,
            reserveNo: rec.reserveNo ?? line.reserveNo,
            reserveItemNo: rec.reserveItemNo ?? line.reserveItemNo,
            overPickCode: rec.overPickCode,
            overPickReason: rec.overPickReason,
            ...pickInventoryFields({
              specialInventoryFlag: rec.specialInventoryFlag ?? line.specialInventoryFlag,
              businessCode: rec.businessCode ?? line.businessCode,
              businessName: rec.businessName ?? line.businessName,
              salesOrderNo: line.salesOrderNo,
              salesOrderItem: line.salesOrderItem
            })
          });
        });
      }

      if (shouldShowShortage) {
        if (!shouldEmitShortageRow(line, shortageQty, isDedicatedShortageLine)) return;
        const shortageMeta = resolveShortageMetaForLine(line, wo, shortageMetaIndex);
        rows.push({
          rowKey: `short-${seq++}`,
          warehouseRoute: 'SHORTAGE',
          lineType: 'SHORTAGE',
          workOrderNo: line.workOrderNo,
          materialCode: line.materialCode,
          materialName: line.materialName || '',
          issueQty: shortageQty,
          ...mapLineQtyFields(line, wo, issueUnitMap),
          prepQty: shortageQty,
          shortageQty,
          warehouseCode: '-',
          locationCode: '-',
          areaCode: '-',
          batchCode: '-',
          shortageInventoryType: shortageMeta.shortageInventoryType,
          salesOrderNo: shortageMeta.salesOrderNo,
          salesOrderItem: shortageMeta.salesOrderItem,
          ...pickInventoryFields({
            specialInventoryFlag: line.specialInventoryFlag,
            businessCode: line.businessCode,
            businessName: line.businessName,
            salesOrderNo: shortageMeta.salesOrderNo,
            salesOrderItem: shortageMeta.salesOrderItem,
            shortageInventoryType: shortageMeta.shortageInventoryType
          })
        });
        return;
      }

      if (!recs.length && resolvePendingInventoryQty(line) > 0) {
        const alreadyHasLocationRecRows = rows.some((r) => r.workOrderNo === line.workOrderNo && r.materialCode === line.materialCode && r.lineType === 'LOCATION' && r.locationRecId != null && (r.reserveNo ?? '') === (line.reserveNo ?? '') && (r.reserveItemNo ?? '') === (line.reserveItemNo ?? ''));
        if (alreadyHasLocationRecRows) return;
        const route = normalizeRoute(explicitRoute, explicitLineType);
        if (route === 'SHORTAGE') {
          const shortageMeta = resolveShortageMetaForLine(line, wo, shortageMetaIndex);
          const computedShortage = resolveShortageQty(line, true);
          if (!shouldEmitShortageRow(line, computedShortage, isDedicatedShortageLine)) return;
          rows.push({
            rowKey: `short-${seq++}`,
            warehouseRoute: 'SHORTAGE',
            lineType: 'SHORTAGE',
            workOrderNo: line.workOrderNo,
            materialCode: line.materialCode,
            materialName: line.materialName || '',
            issueQty: computedShortage,
            ...mapLineQtyFields(line, wo, issueUnitMap),
            prepQty: computedShortage,
            shortageQty: computedShortage,
            warehouseCode: '-',
            locationCode: '-',
            areaCode: '-',
            batchCode: '-',
            shortageInventoryType: shortageMeta.shortageInventoryType,
            salesOrderNo: shortageMeta.salesOrderNo,
            salesOrderItem: shortageMeta.salesOrderItem,
            ...pickInventoryFields({
              specialInventoryFlag: line.specialInventoryFlag,
              businessCode: line.businessCode,
              businessName: line.businessName,
              salesOrderNo: shortageMeta.salesOrderNo,
              salesOrderItem: shortageMeta.salesOrderItem,
              shortageInventoryType: shortageMeta.shortageInventoryType
            })
          });
          return;
        }
        rows.push({
          rowKey: `line-${seq++}`,
          warehouseRoute: route,
          lineType: 'LOCATION',
          workOrderNo: line.workOrderNo,
          materialCode: line.materialCode,
          materialName: line.materialName || '',
          issueQty: Number(line.issueQty ?? 0),
          ...mapLineQtyFields(line, wo, issueUnitMap),
          warehouseCode: '-',
          locationCode: '-',
          areaCode: '-',
          batchCode: '-',
          locationSource: line.locationSource,
          ...pickInventoryFields(line)
        });
      }
    });
  });

  return rows.sort((a, b) => a.warehouseRoute.localeCompare(b.warehouseRoute) || a.workOrderNo.localeCompare(b.workOrderNo) || a.materialCode.localeCompare(b.materialCode));
}

export function flattenPrepDemandDisplayRows(demand: WorkOrderPrepDemandVO, routeCtx?: WarehouseRouteContext, locationHints?: MaterialDemandDetailRow[], issueLineHints?: Array<WorkOrderMaterialIssueLine & { workOrderNo: string }>): PrepDemandDisplayRow[] {
  const nameMap = buildNameMap(demand);
  const issueUnitMap = buildIssueUnitMap(demand);
  const ctx: WarehouseRouteContext = routeCtx ?? { autoWarehouseCodes: [], lineSideWarehouseCodes: [] };
  const shortageMetaIndex = buildShortageMetaIndex(demand, locationHints, issueLineHints);
  const fromDemand = buildRowsFromDemand(demand, ctx, nameMap, issueUnitMap, shortageMetaIndex);
  const hintRows = locationHints?.length ? locationHints.map((h, idx) => mapHintRow(h, idx, nameMap, issueUnitMap)) : [];
  const shortageKey = (row: Pick<PrepDemandDisplayRow, 'workOrderNo' | 'materialCode' | 'issueQty'>) => `${row.workOrderNo}|${row.materialCode}|${row.issueQty}`;
  const demandShortageKeys = new Set(fromDemand.filter((r) => r.warehouseRoute === 'SHORTAGE' || r.lineType === 'SHORTAGE').map(shortageKey));
  const supplementalShortage = hintRows.filter((r) => (r.warehouseRoute === 'SHORTAGE' || r.lineType === 'SHORTAGE') && !demandShortageKeys.has(shortageKey(r)));
  const merged = fromDemand.length ? [...fromDemand, ...supplementalShortage] : hintRows;
  return merged
    .map((row) => {
      const displayUnit = issueUnitMap.get(`${row.workOrderNo}|${row.materialCode}`) || row.inventoryUnit || row.unit;
      if (row.lineType !== 'SHORTAGE' && row.warehouseRoute !== 'SHORTAGE') {
        return { ...row, unit: displayUnit };
      }
      const meta = shortageMetaIndex.get(`${row.workOrderNo}|${row.materialCode}`);
      const shortageInventoryType = normalizeShortageInventoryType(row.shortageInventoryType) ?? meta?.shortageInventoryType ?? 'UNRESTRICTED';
      if (shortageInventoryType === 'UNRESTRICTED') {
        return {
          ...row,
          shortageInventoryType,
          salesOrderNo: undefined,
          salesOrderItem: undefined,
          unit: displayUnit,
          ...pickInventoryFields({ shortageInventoryType })
        };
      }
      return {
        ...row,
        shortageInventoryType,
        salesOrderNo: row.salesOrderNo ?? meta?.salesOrderNo,
        salesOrderItem: row.salesOrderItem ?? meta?.salesOrderItem,
        unit: displayUnit,
        ...pickInventoryFields({
          specialInventoryFlag: row.specialInventoryFlag,
          businessCode: row.businessCode,
          businessName: row.businessName,
          salesOrderNo: row.salesOrderNo ?? meta?.salesOrderNo,
          salesOrderItem: row.salesOrderItem ?? meta?.salesOrderItem,
          shortageInventoryType
        })
      };
    })
    .sort((a, b) => a.warehouseRoute.localeCompare(b.warehouseRoute) || a.workOrderNo.localeCompare(b.workOrderNo) || a.materialCode.localeCompare(b.materialCode));
}

export function groupFlatRowsByWarehouse(rows: PrepDemandDisplayRow[]) {
  const map = new Map<string, PrepDemandDisplayRow[]>();
  rows.forEach((row) => {
    const key = row.warehouseCode && row.warehouseCode !== '-' ? row.warehouseCode : '未指定仓';
    const list = map.get(key) || [];
    list.push(row);
    map.set(key, list);
  });
  return [...map.entries()].map(([warehouseCode, items]) => ({ warehouseCode, items, count: items.length })).sort((a, b) => a.warehouseCode.localeCompare(b.warehouseCode));
}

export function removeDisplayRowsByRoutes(rows: PrepDemandDisplayRow[], routes: PrepDemand261Route[]): PrepDemandDisplayRow[] {
  const routeSet = new Set(routes);
  return rows.filter((r) => !routeSet.has(r.warehouseRoute as PrepDemand261Route));
}

type PrepDemandDetailExt = WorkOrderPrepDemandVO & {
  workOrderList?: PrepDemandWoVO[];
  demandWoList?: PrepDemandWoVO[];
  lines?: PrepDemandLineVO[];
};

function aggregateWorkOrdersFromLines(lines: PrepDemandLineVO[]): PrepDemandWoVO[] {
  const map = new Map<string, PrepDemandWoVO & { _required: number; _available: number; _shortage: number; _shortageLines: number }>();
  lines.forEach((line) => {
    const woNo = String(line.workOrderNo ?? '').trim();
    if (!woNo) return;
    let agg = map.get(woNo);
    if (!agg) {
      agg = { workOrderNo: woNo, lines: [], _required: 0, _available: 0, _shortage: 0, _shortageLines: 0 };
      map.set(woNo, agg);
    }
    agg.lines!.push(line);
    agg._required += resolvePendingInventoryQty(line);
    agg._available += Number(line.availableQty ?? 0);
    const dedicated = line.lineType === 'SHORTAGE' || line.warehouseRoute === 'SHORTAGE';
    const shortageQty = resolveShortageQty(line, dedicated);
    if (shortageQty > 0) {
      agg._shortage += shortageQty;
      agg._shortageLines += 1;
    }
  });
  return [...map.values()].map(({ _required, _available, _shortage, _shortageLines, lines: woLines, ...wo }) => ({
    ...wo,
    lines: woLines,
    totalRequired: _required,
    totalAvailable: _available,
    totalShortage: _shortage,
    shortageLines: _shortageLines
  }));
}

/** Resolve work order list from detail API (supports alternate field names / flat lines). */
export function resolvePrepDemandWorkOrders(demand?: WorkOrderPrepDemandVO | null): PrepDemandWoVO[] {
  if (!demand) return [];
  const ext = demand as PrepDemandDetailExt;
  const nested = demand.workOrders ?? ext.workOrderList ?? ext.demandWoList;
  if (nested?.length) {
    return nested.filter((wo) => String(wo.workOrderNo ?? '').trim());
  }
  if (ext.lines?.length) {
    return aggregateWorkOrdersFromLines(ext.lines);
  }
  return [];
}

/** 分页查询备料需求列表 */
export function listWorkOrderPrepDemand(query?: WorkOrderPrepDemandQuery): AxiosPromise<WorkOrderPrepDemandVO[]> {
  return request({
    url: '/wms/workOrderPrepDemand/list',
    method: 'get',
    params: query
  }).then((res) => {
    if (Array.isArray(res.rows)) {
      res.rows = res.rows.map((row) => normalizePrepDemand(row));
    }
    return res;
  });
}

/** 获取备料需求详情（含工单、BOM 行、FIFO 库位推荐） */
export function getPrepDemand(id: number | string) {
  return request<WorkOrderPrepDemandVO>({
    url: `/wms/workOrderPrepDemand/${id}`,
    method: 'get'
  }).then((res) => {
    if (res.data) {
      res.data = normalizePrepDemand(res.data);
    }
    return res;
  });
}

/** 新增备料需求 */
export function addWorkOrderPrepDemand(data: WorkOrderPrepDemandForm) {
  return request({
    url: '/wms/workOrderPrepDemand',
    method: 'post',
    data
  });
}

/** 修改备料需求 */
export function updateWorkOrderPrepDemand(data: WorkOrderPrepDemandForm) {
  return request({
    url: '/wms/workOrderPrepDemand',
    method: 'put',
    data
  });
}

/** 删除备料需求 */
export function delWorkOrderPrepDemand(id: string | number | Array<string | number>) {
  return request({
    url: `/wms/workOrderPrepDemand/${id}`,
    method: 'delete'
  });
}
