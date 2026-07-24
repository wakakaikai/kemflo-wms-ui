import {
  buildAutoPrepDemandItems,
  buildFlatPrepDemandItems,
  buildInventoryCheckLineResultIndex,
  buildInventoryCheckMaterialMap,
  buildLinePrepDemandItems,
  bomRequiresSalesOrderInventory,
  calcDefaultPrepIssueQty,
  checkMaterialInventory,
  classifyWorkOrders,
  enrichLocationRowsWithSalesOrderDefaults,
  getBomRowKey,
  getReserveLineKey,
  isClassifiedShortageRow,
  issueQtyToInventoryQty,
  normalizeCheckInventoryLocationRows,
  normalizeInventoryCheckMaterialCode,
  normalizePartSizeType,
  parseInventoryCheckPayload,
  refreshBomMaterialPoolMetrics,
  refreshBomRowRecommendations,
  resolveBomRowPoolQtyFromCheck,
  resolveBomSalesOrderConstraint,
  resolveInventoryCheckLineResultForBom,
  resolveInventoryCheckMaterialKey
} from '@/api/wms/allocation/index';
import type { BomIssueRow, InventoryCheckResultVO, WorkOrderMaterialIssueLine, WorkOrderVO } from '@/api/wms/allocation/types';
import { mapApiBomToOverPickRow, mergeOverPickLines, type OverPickLine } from '@/api/wms/workOrderOverPick/index';
import { PREP_DEMAND_TYPE_NORMAL } from '@/api/wms/workOrderPrepDemand/index';
import type { PrepDemandLineItem } from '@/api/wms/workOrderPrepDemand/types';
import type { WorkOrderBomVO } from '@/api/wms/workOrderBom/types';

/** 特殊工单领料行（普通领料，无需超领原因） */
export type SpecialIssueLine = BomIssueRow & {
  componentDesc?: string;
};

export { PREP_DEMAND_TYPE_NORMAL };

export function padWorkOrderNo(workOrderNo: string): string {
  const value = String(workOrderNo || '').trim();
  if (!value) return '';
  if (/^\d+$/.test(value) && value.length < 12) {
    return value.padStart(12, '0');
  }
  return value;
}

export function isSpecialIssueLineReady(row: SpecialIssueLine): boolean {
  return Number(row.issueQty ?? 0) > 0;
}

export function validateSpecialIssueLines(rows: SpecialIssueLine[]): string | null {
  const activeRows = rows.filter((row) => isSpecialIssueLineReady(row));
  if (!activeRows.length) {
    return '请先按料号添加物料并填写领料数量';
  }
  return null;
}

function resolveRequiredInventoryQty(row: SpecialIssueLine): number {
  return issueQtyToInventoryQty(Number(row.issueQty ?? 0), row.conversionRatio);
}

function sumLocationRecommendedQty(locations?: Array<{ recommendedQty?: number | string }>): number {
  if (!locations?.length) return 0;
  return locations.reduce((sum, loc) => sum + Number(loc.recommendedQty ?? 0), 0);
}

function resolveCoverInventoryQty(row: SpecialIssueLine): number {
  const manualQty = sumLocationRecommendedQty(row.manualLocationSelections);
  if (manualQty > 0) return manualQty;
  const fifoQty = sumLocationRecommendedQty(row.fifoRecommendedLocations);
  if (fifoQty > 0) return fifoQty;
  const checkQty = sumLocationRecommendedQty(row.checkInventoryRecommendedLocations);
  if (checkQty > 0) return checkQty;
  return Number(row.effectiveAvailableQty ?? row.materialPoolQty ?? row.availableQty ?? 0);
}

function resolvePickLine(materialCode: string, rows: SpecialIssueLine[]): SpecialIssueLine | undefined {
  const code = normalizeInventoryCheckMaterialCode(materialCode);
  if (!code) return undefined;
  return rows.find((row) => {
    if (!isSpecialIssueLineReady(row)) return false;
    const rowCode = normalizeInventoryCheckMaterialCode(row.componentMaterial);
    if (!rowCode) return false;
    return rowCode === code || resolveInventoryCheckMaterialKey(rowCode, [code]) === code || resolveInventoryCheckMaterialKey(code, [rowCode]) === rowCode;
  });
}

/** 领料仅能领取现有库存：检查发料数量是否被库存/库位分配覆盖 */
export function validateSpecialInventorySufficient(rows: SpecialIssueLine[]): string | null {
  const insufficient = rows
    .filter((row) => isSpecialIssueLineReady(row))
    .filter((row) => {
      const required = resolveRequiredInventoryQty(row);
      if (required <= 0) return false;
      return resolveCoverInventoryQty(row) < required;
    })
    .map((row) => row.componentMaterial);
  if (!insufficient.length) return null;
  return `物料 ${[...new Set(insufficient)].join('\u3001')} 库存不足，无法生成领料备料计划`;
}

export function isSpecialInventorySufficient(rows: SpecialIssueLine[]): boolean {
  return !validateSpecialInventorySufficient(rows);
}

export function validateSpecialClassifiedOrder(order: WorkOrderVO, rows?: SpecialIssueLine[]): string | null {
  const shortageDetails = (order.materialDemandDetails || []).filter((line) => isClassifiedShortageRow(line));
  if (!shortageDetails.length) return null;
  const insufficient = shortageDetails.filter((detail) => {
    const materialCode = String(detail.materialCode || '').trim();
    if (!materialCode) return true;
    if (!rows?.length) return true;
    const pickLine = resolvePickLine(materialCode, rows);
    if (!pickLine) return true;
    const required = resolveRequiredInventoryQty(pickLine);
    if (required <= 0) return false;
    return resolveCoverInventoryQty(pickLine) < required;
  });
  if (!insufficient.length) return null;
  const codes = [...new Set(insufficient.map((line) => line.materialCode).filter(Boolean))].join('\u3001');
  return `物料 ${codes} 库存不足，无法生成领料备料计划`;
}

export function getSpecialIssueLineKey(row: SpecialIssueLine, index?: number): string {
  const reserveKey = getReserveLineKey(row, { includeWorkOrder: true });
  if (reserveKey) return reserveKey;
  return getBomRowKey(row, index);
}

export function mapApiBomToSpecialIssueRow(bom: WorkOrderBomVO, workOrder: WorkOrderVO): SpecialIssueLine {
  const row = mapApiBomToOverPickRow(bom, workOrder) as SpecialIssueLine;
  const defaultQty = calcDefaultPrepIssueQty(row);
  return {
    ...row,
    issueQty: defaultQty > 0 ? defaultQty : 0
  };
}

export function mergeSpecialIssueLines(existing: SpecialIssueLine[], incoming: SpecialIssueLine[]): SpecialIssueLine[] {
  return mergeOverPickLines(existing as OverPickLine[], incoming as OverPickLine[]) as SpecialIssueLine[];
}

function mapRowToIssueLine(row: SpecialIssueLine): WorkOrderMaterialIssueLine {
  return {
    bomLineId: row.id,
    reserveNo: row.reserveNo,
    reserveItemNo: row.reserveItemNo,
    materialCode: row.componentMaterial,
    issueQty: Number(row.issueQty ?? 0),
    issueUnit: row.unit,
    conversionRatio: row.conversionRatio,
    manualLocationSelections: row.manualLocationSelections,
    fifoRecommendedLocations: row.fifoRecommendedLocations,
    otherLineWarehouseLocations: row.otherLineWarehouseLocations,
    locationOverrideReason: row.locationOverrideReason,
    salesOrderNo: row.salesOrderNo,
    salesOrderItem: row.salesOrderItem,
    specialInventoryFlag: row.specialInventoryFlag
  };
}

function resolveBomSoConstraint(row: SpecialIssueLine) {
  return {
    salesOrderNo: String(row.salesOrderNo ?? '').trim() || undefined,
    salesOrderItem: String(row.salesOrderItem ?? '').trim() || undefined,
    specialInventoryFlag: String(row.specialInventoryFlag ?? '').trim() || undefined
  };
}

function groupRowsForInventoryCheck(activeRows: SpecialIssueLine[]) {
  const groups = new Map<string, { materialCodes: Set<string>; salesOrderNo?: string; salesOrderItem?: string }>();
  activeRows.forEach((row) => {
    const code = normalizeInventoryCheckMaterialCode(row.componentMaterial);
    if (!code) return;
    const so = resolveBomSoConstraint(row);
    const key = bomRequiresSalesOrderInventory(so) ? `so:${so.salesOrderNo}|${so.salesOrderItem}` : 'unrestricted';
    const group = groups.get(key) ?? { materialCodes: new Set<string>() };
    group.materialCodes.add(code);
    if (bomRequiresSalesOrderInventory(so)) {
      group.salesOrderNo = so.salesOrderNo;
      group.salesOrderItem = so.salesOrderItem;
    }
    groups.set(key, group);
  });
  return [...groups.values()];
}

function mergeInventoryCheckPayloads(payloads: InventoryCheckResultVO[]): InventoryCheckResultVO | null {
  if (!payloads.length) return null;
  if (payloads.length === 1) return payloads[0];
  return {
    materials: payloads.flatMap((payload) => payload.materials ?? []),
    lineResults: payloads.flatMap((payload) => payload.lineResults ?? []),
    analysis: payloads[payloads.length - 1]?.analysis
  };
}

async function fetchInventoryCheckPayload(workOrder: WorkOrderVO, activeRows: SpecialIssueLine[], demandUserNo: string) {
  const groups = groupRowsForInventoryCheck(activeRows);
  const payloads: InventoryCheckResultVO[] = [];
  for (const group of groups) {
    const materialCodes = [...group.materialCodes];
    if (!materialCodes.length) continue;
    const response = await checkMaterialInventory({
      workOrderNo: workOrder.workOrderNo,
      materialCodes,
      demandUserNo,
      ...(group.salesOrderNo
        ? {
            salesOrderNo: group.salesOrderNo,
            ...(group.salesOrderItem ? { salesOrderItem: group.salesOrderItem } : {}),
            specialInventoryFlag: 'E'
          }
        : {})
    });
    if (response.code !== 200) {
      throw new Error(response.msg || '库存检查失败');
    }
    const payload = parseInventoryCheckPayload(response.data);
    if (payload) payloads.push(payload);
  }
  return mergeInventoryCheckPayloads(payloads);
}

function applyInventoryCheckPayloadToRows(rows: SpecialIssueLine[], checkPayload: InventoryCheckResultVO | null, workOrderNo: string, checkedMaterialCodes: Set<string>): SpecialIssueLine[] {
  const inventoryMap = buildInventoryCheckMaterialMap(checkPayload?.materials as Array<Record<string, unknown> & { materialCode?: string }> | undefined);
  const lineResultIndex = buildInventoryCheckLineResultIndex(checkPayload?.lineResults);
  const materialLineUseIndex = new Map<string, number>();

  const updated = rows.map((bom, bomIndex) => {
    if (bom.workOrderNo !== workOrderNo) return bom;
    if (!checkedMaterialCodes.has(bom.componentMaterial)) return bom;

    const lineResult = resolveInventoryCheckLineResultForBom(bom, bomIndex, lineResultIndex, materialLineUseIndex, checkPayload?.lineResults);
    const soConstraint = resolveBomSalesOrderConstraint(bom);
    const inventory = inventoryMap.get(bom.componentMaterial) ?? inventoryMap.get(resolveInventoryCheckMaterialKey(bom.componentMaterial, inventoryMap.keys()));
    const partSizeType = bom.partSizeType ?? (inventory ? normalizePartSizeType(inventory) : undefined);

    let checkInventoryRecommendedLocations: import('@/api/wms/allocation/types').MaterialLocationRow[] | undefined;
    if (lineResult?.recommendedLocations?.length) {
      let locRows = normalizeCheckInventoryLocationRows(lineResult.recommendedLocations);
      if (bomRequiresSalesOrderInventory(soConstraint)) {
        locRows = enrichLocationRowsWithSalesOrderDefaults(locRows, soConstraint);
      }
      checkInventoryRecommendedLocations = locRows;
    }

    const checkRows = checkInventoryRecommendedLocations;
    const poolQty = resolveBomRowPoolQtyFromCheck(soConstraint, checkRows, lineResult, inventory);

    return {
      ...bom,
      reserveNo: bom.reserveNo ?? lineResult?.reserveNo,
      reserveItemNo: bom.reserveItemNo ?? lineResult?.reserveItemNo,
      salesOrderNo: soConstraint.salesOrderNo,
      salesOrderItem: soConstraint.salesOrderItem,
      specialInventoryFlag: bomRequiresSalesOrderInventory(soConstraint) ? bom.specialInventoryFlag || 'E' : bom.specialInventoryFlag,
      checkInventoryRecommendedLocations,
      materialPoolQty: poolQty,
      availableQty: poolQty,
      batchCount: Number(inventory?.batchCount ?? 0),
      locationCount: Number(inventory?.locationCount ?? 0),
      inventoryStatus: String(inventory?.status || lineResult?.status || 'UNKNOWN'),
      partSizeType
    };
  });

  return refreshBomMaterialPoolMetrics(refreshBomRowRecommendations(updated));
}

export async function checkSpecialIssueInventory(workOrder: WorkOrderVO, rows: SpecialIssueLine[], demandUserNo: string): Promise<SpecialIssueLine[]> {
  const validationError = validateSpecialIssueLines(rows);
  if (validationError) {
    throw new Error(validationError);
  }

  const activeRows = rows.filter((row) => isSpecialIssueLineReady(row));
  const materialCodes = [...new Set(activeRows.map((row) => normalizeInventoryCheckMaterialCode(row.componentMaterial)).filter(Boolean))];
  const checkPayload = await fetchInventoryCheckPayload(workOrder, activeRows, demandUserNo);
  return applyInventoryCheckPayloadToRows(rows, checkPayload, workOrder.workOrderNo, new Set(materialCodes));
}

export function buildWorkOrderFromSpecialIssueLines(workOrder: WorkOrderVO, rows: SpecialIssueLine[]): WorkOrderVO {
  const materialIssues = rows.filter((row) => isSpecialIssueLineReady(row)).map((row) => mapRowToIssueLine(row));
  return {
    ...workOrder,
    materialIssues,
    materialDemandDetails: [],
    warehouseRoute: undefined,
    recommendedWarehouses: []
  };
}

export async function classifySpecialIssueWorkOrder(workOrder: WorkOrderVO): Promise<WorkOrderVO> {
  const result = await classifyWorkOrders([workOrder]);
  return result.orders[0] ?? workOrder;
}

export function buildSpecialPrepItems(order: WorkOrderVO): PrepDemandLineItem[] {
  const orders = [order];
  const baseItems = [...buildAutoPrepDemandItems(orders), ...buildLinePrepDemandItems(orders), ...buildFlatPrepDemandItems(orders)];
  const itemMap = new Map<string, PrepDemandLineItem>();

  baseItems.forEach((item) => {
    const key = [item.workOrderNo, item.materialCode, item.warehouseRoute ?? '', item.lineType ?? 'LOCATION', item.warehouseCode ?? '', item.locationCode ?? '', String(item.bomLineId ?? ''), item.reserveNo ?? '', item.reserveItemNo ?? ''].join('|');
    const prev = itemMap.get(key);
    if (!prev) {
      itemMap.set(key, item);
      return;
    }
    itemMap.set(key, {
      ...prev,
      prepQty: Number(prev.prepQty ?? 0) + Number(item.prepQty ?? 0)
    });
  });

  return [...itemMap.values()];
}

/** 按料号从 BOM 匹配行并转为领料行 */
export function matchBomRowsByMaterialCode(bomList: WorkOrderBomVO[], workOrder: WorkOrderVO, materialCode: string): SpecialIssueLine[] {
  const code = String(materialCode || '')
    .trim()
    .toUpperCase();
  if (!code) return [];
  return bomList
    .filter((bom) =>
      String(bom.componentMaterial || '')
        .trim()
        .toUpperCase() === code
    )
    .map((bom) => mapApiBomToSpecialIssueRow(bom, workOrder));
}
