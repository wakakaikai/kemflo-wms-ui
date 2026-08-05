/**
 * 特殊工单领料（ZP92-拆解 / ZP93-粉碎）接口调用
 * 仅暴露接口，页面逻辑见 src/views/wms/workOrderSpecialIssue/components/
 */
import { bomRequiresSalesOrderInventory, buildInventoryCheckLineResultIndex, buildInventoryCheckMaterialMap, checkMaterialInventory, enrichLocationRowsWithSalesOrderDefaults, normalizeCheckInventoryLocationRows, normalizeInventoryCheckMaterialCode, normalizePartSizeType, parseInventoryCheckPayload, refreshBomMaterialPoolMetrics, refreshBomRowRecommendations, resolveBomRowPoolQtyFromCheck, resolveBomSalesOrderConstraint, resolveInventoryCheckLineResultForBom, resolveInventoryCheckMaterialKey } from '@/api/wms/allocation/index';
import type { BomIssueRow, InventoryCheckResultVO } from '@/api/wms/allocation/types';

export { getWorkOrderBom, checkMaterialInventory, classifyWorkOrders, generateAllocation } from '@/api/wms/allocation/index';
export { getPrepDemand, PREP_DEMAND_TYPE_NORMAL } from '@/api/wms/workOrderPrepDemand/index';
export { listItem } from '@/api/wms/item';

function groupSpecialIssueRowsForInventoryCheck(activeRows: BomIssueRow[]) {
  const groups = new Map<string, { materialCodes: Set<string>; salesOrderNo?: string; salesOrderItem?: string }>();
  activeRows.forEach((row) => {
    const code = normalizeInventoryCheckMaterialCode(row.componentMaterial);
    if (!code) return;
    const so = resolveBomSalesOrderConstraint(row);
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

function mergeSpecialIssueInventoryCheckPayloads(payloads: InventoryCheckResultVO[]): InventoryCheckResultVO | null {
  if (!payloads.length) return null;
  if (payloads.length === 1) return payloads[0];
  return {
    materials: payloads.flatMap((payload) => payload.materials ?? []),
    lineResults: payloads.flatMap((payload) => payload.lineResults ?? []),
    analysis: payloads[payloads.length - 1]?.analysis
  };
}

async function fetchSpecialIssueInventoryCheckPayload(activeRows: BomIssueRow[], demandUserNo: string) {
  const groups = groupSpecialIssueRowsForInventoryCheck(activeRows);
  const payloads: InventoryCheckResultVO[] = [];
  for (const group of groups) {
    const materialCodes = [...group.materialCodes];
    if (!materialCodes.length) continue;
    const response = await checkMaterialInventory({
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
  return mergeSpecialIssueInventoryCheckPayloads(payloads);
}

function applySpecialIssueInventoryCheckPayloadToRows(rows: BomIssueRow[], checkPayload: InventoryCheckResultVO | null, checkedMaterialCodes: Set<string>): BomIssueRow[] {
  const inventoryMap = buildInventoryCheckMaterialMap(checkPayload?.materials as Array<Record<string, unknown> & { materialCode?: string }> | undefined);
  const lineResultIndex = buildInventoryCheckLineResultIndex(checkPayload?.lineResults);
  const materialLineUseIndex = new Map<string, number>();

  const updated = rows.map((bom, bomIndex) => {
    if (!checkedMaterialCodes.has(bom.componentMaterial)) return bom;

    const lineResult = resolveInventoryCheckLineResultForBom(bom, bomIndex, lineResultIndex, materialLineUseIndex, checkPayload?.lineResults);
    const soConstraint = resolveBomSalesOrderConstraint(bom);
    const inventory = inventoryMap.get(bom.componentMaterial) ?? inventoryMap.get(resolveInventoryCheckMaterialKey(bom.componentMaterial, inventoryMap.keys()));
    const partSizeType = bom.partSizeType ?? (inventory ? normalizePartSizeType(inventory) : undefined);

    let checkInventoryRecommendedLocations: import('@/api/wms/allocation/types').MaterialLocationRow[] | undefined;
    if (lineResult?.recommendedLocations?.length) {
      // 特殊工单领料仅领用一般库存：过滤销售订单(E)库存
      let locRows = normalizeCheckInventoryLocationRows(lineResult.recommendedLocations).filter(
        (loc) =>
          String(loc.specialInventoryFlag ?? '')
            .trim()
            .toUpperCase() !== 'E'
      );
      if (bomRequiresSalesOrderInventory(soConstraint)) {
        locRows = enrichLocationRowsWithSalesOrderDefaults(locRows, soConstraint);
      }
      checkInventoryRecommendedLocations = locRows;
    }

    const checkRows = checkInventoryRecommendedLocations;
    const poolQty = checkRows?.length ? resolveBomRowPoolQtyFromCheck(soConstraint, checkRows, lineResult, inventory) : 0;

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

/** 批量检查当前清单中已填写数量的物料的库存，回写可用量/库存状态/推荐库位（无需工单号） */
export async function checkSpecialIssueInventory(rows: BomIssueRow[], demandUserNo: string): Promise<BomIssueRow[]> {
  const activeRows = rows.filter((row) => Number(row.issueQty ?? 0) > 0);
  const materialCodes = [...new Set(activeRows.map((row) => normalizeInventoryCheckMaterialCode(row.componentMaterial)).filter(Boolean))];
  if (!materialCodes.length) return rows;
  const checkPayload = await fetchSpecialIssueInventoryCheckPayload(activeRows, demandUserNo);
  return applySpecialIssueInventoryCheckPayloadToRows(rows, checkPayload, new Set(materialCodes));
}
