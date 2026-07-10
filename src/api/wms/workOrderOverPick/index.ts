import { bomRequiresSalesOrderInventory, resolveBomSalesOrderConstraint, resolveBomRowPoolQtyFromCheck, buildAutoPrepDemandItems, buildFlatPrepDemandItems, buildInventoryCheckLineResultIndex, buildInventoryCheckMaterialMap, buildLinePrepDemandItems, calcBomPendingInventoryQty, checkMaterialInventory, classifyWorkOrders, enrichLocationRowsWithSalesOrderDefaults, getBomRowKey, getReserveLineKey, isClassifiedShortageRow, issueQtyToInventoryQty, normalizeCheckInventoryLocationRows, normalizeInventoryCheckMaterialCode, normalizePartSizeType, parseInventoryCheckPayload, refreshBomMaterialPoolMetrics, refreshBomRowRecommendations, resolveInventoryCheckLineResultForBom, resolveInventoryCheckMaterialKey, syncBomPrepUnitConversion } from '@/api/wms/allocation/index';
import type { BomIssueRow, InventoryCheckResultVO, WorkOrderMaterialIssueLine, WorkOrderVO } from '@/api/wms/allocation/types';
import type { WorkOrderBomVO } from '@/api/wms/workOrderBom/types';
import type { PrepDemandLineItem } from '@/api/wms/workOrderPrepDemand/types';

export type OverPickLine = BomIssueRow & {
  componentDesc?: string;
  overPickCode?: string;
  overPickReason?: string;
};

export { PREP_DEMAND_TYPE_NORMAL, PREP_DEMAND_TYPE_OVER_PICK, isOverPickPrepDemand } from '@/api/wms/workOrderPrepDemand/index';

export function isOverPickLineReady(row: OverPickLine): boolean {
  return Number(row.issueQty ?? 0) > 0 && !!String(row.overPickCode ?? '').trim();
}

export function validateOverPickLines(rows: OverPickLine[]): string | null {
  const activeRows = rows.filter((row) => Number(row.issueQty ?? 0) > 0);
  if (!activeRows.length) {
    return '请先添加超领物料并填写数量';
  }
  const missingReason = activeRows.filter((row) => !String(row.overPickCode ?? '').trim());
  if (missingReason.length) {
    const codes = missingReason.map((row) => row.componentMaterial).join('、');
    return `请为物料 ${codes} 选择超领原因`;
  }
  return null;
}

function resolveOverPickRequiredInventoryQty(row: OverPickLine): number {
  return issueQtyToInventoryQty(Number(row.issueQty ?? 0), row.conversionRatio);
}

function sumLocationRecommendedQty(locations?: Array<{ recommendedQty?: number | string }>): number {
  if (!locations?.length) return 0;
  return locations.reduce((sum, loc) => sum + Number(loc.recommendedQty ?? 0), 0);
}

function resolveOverPickCoverInventoryQty(row: OverPickLine): number {
  const manualQty = sumLocationRecommendedQty(row.manualLocationSelections);
  if (manualQty > 0) return manualQty;
  const fifoQty = sumLocationRecommendedQty(row.fifoRecommendedLocations);
  if (fifoQty > 0) return fifoQty;
  const checkQty = sumLocationRecommendedQty(row.checkInventoryRecommendedLocations);
  if (checkQty > 0) return checkQty;
  return Number(row.effectiveAvailableQty ?? row.materialPoolQty ?? row.availableQty ?? 0);
}

function resolveOverPickPickLine(materialCode: string, rows: OverPickLine[]): OverPickLine | undefined {
  const code = normalizeInventoryCheckMaterialCode(materialCode);
  if (!code) return undefined;
  return rows.find((row) => {
    if (!isOverPickLineReady(row)) return false;
    const rowCode = normalizeInventoryCheckMaterialCode(row.componentMaterial);
    if (!rowCode) return false;
    return rowCode === code || resolveInventoryCheckMaterialKey(rowCode, [code]) === code || resolveInventoryCheckMaterialKey(code, [rowCode]) === rowCode;
  });
}

/** 超领仅能领取现有库存：检查发料数量是否被库存/库位分配覆盖 */
export function validateOverPickInventorySufficient(rows: OverPickLine[]): string | null {
  const insufficient = rows
    .filter((row) => isOverPickLineReady(row))
    .filter((row) => {
      const required = resolveOverPickRequiredInventoryQty(row);
      if (required <= 0) return false;
      return resolveOverPickCoverInventoryQty(row) < required;
    })
    .map((row) => row.componentMaterial);
  if (!insufficient.length) return null;
  return `物料 ${[...new Set(insufficient)].join('、')} 库存不足，超领仅能领取现有库存`;
}

export function isOverPickInventorySufficient(rows: OverPickLine[]): boolean {
  return !validateOverPickInventorySufficient(rows);
}

/** 分类后不应存在缺料行；结合 checkInventory 回写结果复核，避免误报 */
export function validateOverPickClassifiedOrder(order: WorkOrderVO, rows?: OverPickLine[]): string | null {
  const shortageDetails = (order.materialDemandDetails || []).filter((line) => isClassifiedShortageRow(line));
  if (!shortageDetails.length) return null;
  const insufficient = shortageDetails.filter((detail) => {
    const materialCode = String(detail.materialCode || '').trim();
    if (!materialCode) return true;
    if (!rows?.length) return true;
    const pickLine = resolveOverPickPickLine(materialCode, rows);
    if (!pickLine) return true;
    const required = resolveOverPickRequiredInventoryQty(pickLine);
    if (required <= 0) return false;
    return resolveOverPickCoverInventoryQty(pickLine) < required;
  });
  if (!insufficient.length) return null;
  const codes = [...new Set(insufficient.map((line) => line.materialCode).filter(Boolean))].join('、');
  return `物料 ${codes} 库存不足，无法生成超领备料计划`;
}

export function applyOverPickReasonOption(row: OverPickLine, code: string | number, options: DictDataOption[]): OverPickLine {
  const normalizedCode = String(code ?? '').trim();
  const hit = options.find((item) => String(item.value) === normalizedCode);
  return {
    ...row,
    overPickCode: normalizedCode || undefined,
    overPickReason: hit?.label || undefined
  };
}

export function getOverPickLineKey(row: OverPickLine, index?: number): string {
  const reserveKey = getReserveLineKey(row, { includeWorkOrder: true });
  if (reserveKey) return reserveKey;
  return getBomRowKey(row, index);
}

export function mapApiBomToOverPickRow(bom: WorkOrderBomVO, workOrder: WorkOrderVO): OverPickLine {
  const base = syncBomPrepUnitConversion({
    id: bom.id,
    workOrderNo: workOrder.workOrderNo,
    reserveNo: bom.reserveNo,
    reserveItemNo: bom.reserveItemNo,
    componentMaterial: bom.componentMaterial,
    componentDesc: bom.componentDesc,
    componentQty: Number(bom.componentQty ?? 0),
    issuedQty: Number(bom.issuedQty ?? 0),
    unit: bom.unit,
    inventoryUnit: (bom as { inventoryUnit?: string }).inventoryUnit,
    salesOrderNo: String(bom.salesOrderNo ?? '').trim() || undefined,
    salesOrderItem: String(bom.salesOrderItem ?? '').trim() || undefined,
    specialInventoryFlag: bom.specialInventoryFlag,
    issueQty: 0,
    pendingQty: calcBomPendingInventoryQty({
      componentQty: Number(bom.componentQty ?? 0),
      issuedQty: Number(bom.issuedQty ?? 0)
    })
  });
  return {
    ...base,
    componentDesc: bom.componentDesc
  };
}

export function mergeOverPickLines(existing: OverPickLine[], incoming: OverPickLine[]): OverPickLine[] {
  const map = new Map<string, OverPickLine>();
  existing.forEach((row, index) => map.set(getOverPickLineKey(row, index), { ...row }));
  incoming.forEach((row, index) => {
    const key = getOverPickLineKey(row, index);
    const prev = map.get(key);
    if (prev) {
      map.set(key, {
        ...prev,
        ...row,
        issueQty: Number(row.issueQty ?? prev.issueQty ?? 0),
        overPickCode: row.overPickCode ?? prev.overPickCode,
        overPickReason: row.overPickReason ?? prev.overPickReason,
        manualLocationSelections: row.manualLocationSelections ?? prev.manualLocationSelections,
        fifoRecommendedLocations: row.fifoRecommendedLocations ?? prev.fifoRecommendedLocations,
        locationOverrideReason: row.locationOverrideReason ?? prev.locationOverrideReason
      });
    } else {
      map.set(key, { ...row });
    }
  });
  return [...map.values()];
}

function mapOverPickRowToIssueLine(row: OverPickLine): WorkOrderMaterialIssueLine {
  const overPickReason = String(row.overPickReason ?? '').trim();
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
    specialInventoryFlag: row.specialInventoryFlag,
    overPickCode: row.overPickCode,
    overPickReason: overPickReason || undefined
  };
}

function resolveOverPickBomSalesOrderConstraint(row: OverPickLine) {
  return {
    salesOrderNo: String(row.salesOrderNo ?? '').trim() || undefined,
    salesOrderItem: String(row.salesOrderItem ?? '').trim() || undefined,
    specialInventoryFlag: String(row.specialInventoryFlag ?? '').trim() || undefined
  };
}

function groupOverPickRowsForInventoryCheck(activeRows: OverPickLine[]) {
  const groups = new Map<string, { materialCodes: Set<string>; salesOrderNo?: string; salesOrderItem?: string }>();
  activeRows.forEach((row) => {
    const code = normalizeInventoryCheckMaterialCode(row.componentMaterial);
    if (!code) return;
    const so = resolveOverPickBomSalesOrderConstraint(row);
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

async function fetchOverPickInventoryCheckPayload(workOrder: WorkOrderVO, activeRows: OverPickLine[], demandUserNo: string) {
  const groups = groupOverPickRowsForInventoryCheck(activeRows);
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

function applyInventoryCheckPayloadToRows(rows: OverPickLine[], checkPayload: InventoryCheckResultVO | null, workOrderNo: string, checkedMaterialCodes: Set<string>): OverPickLine[] {
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

export async function checkOverPickInventory(workOrder: WorkOrderVO, rows: OverPickLine[], demandUserNo: string): Promise<OverPickLine[]> {
  const validationError = validateOverPickLines(rows);
  if (validationError) {
    throw new Error(validationError);
  }

  const activeRows = rows.filter((row) => Number(row.issueQty ?? 0) > 0);
  const materialCodes = [...new Set(activeRows.map((row) => normalizeInventoryCheckMaterialCode(row.componentMaterial)).filter(Boolean))];
  const checkPayload = await fetchOverPickInventoryCheckPayload(workOrder, activeRows, demandUserNo);
  return applyInventoryCheckPayloadToRows(rows, checkPayload, workOrder.workOrderNo, new Set(materialCodes));
}

export function buildWorkOrderFromOverPickLines(workOrder: WorkOrderVO, rows: OverPickLine[]): WorkOrderVO {
  const materialIssues = rows.filter((row) => isOverPickLineReady(row)).map((row) => mapOverPickRowToIssueLine(row));
  return {
    ...workOrder,
    materialIssues,
    materialDemandDetails: [],
    warehouseRoute: undefined,
    recommendedWarehouses: []
  };
}

export async function classifyOverPickWorkOrder(workOrder: WorkOrderVO): Promise<WorkOrderVO> {
  const result = await classifyWorkOrders([workOrder]);
  return result.orders[0] ?? workOrder;
}

export function buildOverPickPrepItems(order: WorkOrderVO): PrepDemandLineItem[] {
  const reasonMap = new Map<string, string>();
  const codeMap = new Map<string, string>();
  (order.materialIssues || []).forEach((line) => {
    const code = String(line.overPickCode ?? '').trim();
    const reason = String(line.overPickReason ?? '').trim();
    const keys: string[] = [];
    if (line.reserveNo && line.reserveItemNo) {
      keys.push(`${order.workOrderNo}|${line.reserveNo}|${line.reserveItemNo}`);
    }
    if (line.bomLineId != null && line.bomLineId !== '') {
      keys.push(`bom:${line.bomLineId}`);
    }
    keys.push(`mat:${line.materialCode}`);
    keys.forEach((key) => {
      if (code) codeMap.set(key, code);
      if (reason) reasonMap.set(key, reason);
    });
  });

  const resolveByItem = (item: PrepDemandLineItem, map: Map<string, string>) => {
    if (item.reserveNo && item.reserveItemNo) {
      const byReserve = map.get(`${item.workOrderNo}|${item.reserveNo}|${item.reserveItemNo}`);
      if (byReserve) return byReserve;
    }
    if (item.bomLineId != null && item.bomLineId !== '') {
      const byBom = map.get(`bom:${item.bomLineId}`);
      if (byBom) return byBom;
    }
    return map.get(`mat:${item.materialCode}`);
  };

  const orders = [order];
  const baseItems = [...buildAutoPrepDemandItems(orders), ...buildLinePrepDemandItems(orders), ...buildFlatPrepDemandItems(orders)];
  const itemMap = new Map<string, PrepDemandLineItem>();

  baseItems.forEach((item) => {
    const overPickCode = resolveByItem(item, codeMap);
    const overPickReason = resolveByItem(item, reasonMap);
    const enriched: PrepDemandLineItem = {
      ...item,
      overPickCode: overPickCode || undefined,
      overPickReason: overPickReason || undefined
    };
    const key = [enriched.workOrderNo, enriched.materialCode, enriched.warehouseRoute ?? '', enriched.lineType ?? 'LOCATION', enriched.warehouseCode ?? '', enriched.locationCode ?? '', String(enriched.bomLineId ?? ''), enriched.reserveNo ?? '', enriched.reserveItemNo ?? ''].join('|');
    const prev = itemMap.get(key);
    if (!prev) {
      itemMap.set(key, enriched);
      return;
    }
    itemMap.set(key, {
      ...prev,
      prepQty: Number(prev.prepQty ?? 0) + Number(enriched.prepQty ?? 0)
    });
  });

  return [...itemMap.values()];
}
