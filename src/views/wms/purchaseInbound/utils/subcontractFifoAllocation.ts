import { listInventoryDetailAll } from '@/api/wms/inventoryDetail/index';
import type { InventoryDetailVO } from '@/api/wms/inventoryDetail/types';
import type { PurchaseOrderBomVO } from '@/api/wms/purchaseOrderDetail/types';
import { inheritPoItemNumberOnBom } from '@/views/wms/purchaseOrderDetail/utils/purchaseOrderDetailTree';

export interface SubcontractBatchParent {
  supplierCode?: string;
  materialCode?: string;
  itemNumber?: string;
  purchaseOrderBomScheduleVoList?: PurchaseOrderBomVO[];
}

export interface SubcontractBatchShortage {
  parentMaterialCode: string;
  componentMaterial: string;
  shortageQty: number;
  reason: 'shortage' | 'queryFailed' | 'missingSupplier' | 'missingMaterial';
}

interface FifoPick {
  id: string | number;
  warehouseCode: string;
  areaCode: string;
  locationCode: string;
  batchCode: string;
  availableQuantity: number;
  pickQty: number;
  specialInventoryFlag: string;
  businessCode: string;
  rowKey: string;
}

interface PoolRow extends FifoPick {
  receivedDate: string;
  remaining: number;
}

interface PendingDemand {
  parent: SubcontractBatchParent;
  bom: PurchaseOrderBomVO;
  index: number;
  materialCode: string;
  supplierCode: string;
  demandQty: number;
  originBomKey: string;
  conversionRatio: number;
}

const toNumber = (value: unknown) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

const roundQty = (value: number) => Number(value.toFixed(3));

const normalizeCode = (value: unknown) => String(value ?? '').trim();

const getConversionRatio = (bom: PurchaseOrderBomVO) => {
  const ratio = toNumber(bom.conversionRatio || 1);
  return ratio > 0 ? ratio : 1;
};

const getDemandQty = (bom: PurchaseOrderBomVO) => {
  const inventoryQuantity = toNumber(bom.inventoryQuantity);
  if (inventoryQuantity > 0) {
    return roundQty(inventoryQuantity);
  }
  return roundQty(toNumber(bom.consumeQuantity) * getConversionRatio(bom));
};

const needsBatch = (bom: PurchaseOrderBomVO) => getDemandQty(bom) > 0 && !normalizeCode(bom.batchCode);

export const hasPendingSubcontractBatch = (parents: SubcontractBatchParent[]) => {
  return parents.some((parent) => (parent.purchaseOrderBomScheduleVoList || []).some((bom) => needsBatch(bom)));
};

const compareByReceivedDate = (left: PoolRow, right: PoolRow) => {
  const leftDate = left.receivedDate || '9999-12-31 23:59:59';
  const rightDate = right.receivedDate || '9999-12-31 23:59:59';
  return leftDate.localeCompare(rightDate) || left.batchCode.localeCompare(right.batchCode) || left.rowKey.localeCompare(right.rowKey);
};

const matchesSpecialInventoryFlag = (itemFlag: string | undefined, expected: string) => {
  return normalizeCode(itemFlag).toUpperCase() === expected.toUpperCase();
};

const collectDemands = (parents: SubcontractBatchParent[]) => {
  const demands: PendingDemand[] = [];
  parents.forEach((parent) => {
    (parent.purchaseOrderBomScheduleVoList || []).forEach((bom, index) => {
      if (!needsBatch(bom)) {
        return;
      }
      const originBomKey = bom.originBomKey || `${bom.scheduleNumber || ''}_${bom.componentMaterial || ''}_${bom.id ?? index}`;
      demands.push({
        parent,
        bom,
        index,
        materialCode: normalizeCode(bom.componentMaterial),
        supplierCode: normalizeCode(parent.supplierCode),
        demandQty: getDemandQty(bom),
        originBomKey,
        conversionRatio: getConversionRatio(bom)
      });
    });
  });
  return demands;
};

const collectReservedQty = (parents: SubcontractBatchParent[], pendingBoms: Set<PurchaseOrderBomVO>) => {
  const reserved = new Map<string, number>();
  parents.forEach((parent) => {
    (parent.purchaseOrderBomScheduleVoList || []).forEach((bom) => {
      if (pendingBoms.has(bom) || bom.inventoryDetailId === undefined || bom.inventoryDetailId === null || bom.inventoryDetailId === '') {
        return;
      }
      const key = String(bom.inventoryDetailId);
      reserved.set(key, roundQty((reserved.get(key) || 0) + toNumber(bom.inventoryQuantity)));
    });
  });
  return reserved;
};

const poolKey = (materialCode: string, supplierCode: string) => `${materialCode}\u0000${supplierCode}`;

/** 一次查出全部组件物料，再按物料 + 供应商拆成共享库存池。 */
const loadSharedPools = async (demands: PendingDemand[], reserved: Map<string, number>) => {
  const itemQueryMap = new Map<string, { itemCode: string; specialInventoryFlag: string; businessCode: string }>();
  demands.forEach((demand) => {
    const key = poolKey(demand.materialCode, demand.supplierCode);
    if (!itemQueryMap.has(key)) {
      itemQueryMap.set(key, {
        itemCode: demand.materialCode,
        specialInventoryFlag: 'O',
        businessCode: demand.supplierCode
      });
    }
  });
  const res = await listInventoryDetailAll({
    itemQueryList: Array.from(itemQueryMap.values())
  });
  const list = ((res as { data?: InventoryDetailVO[] }).data ?? []) as InventoryDetailVO[];
  const pools = new Map<string, PoolRow[]>();
  const seenIds = new Set<string>();
  list.forEach((item, index) => {
    const materialCode = normalizeCode(item.itemCode);
    const supplierCode = normalizeCode(item.businessCode);
    if (!itemQueryMap.has(poolKey(materialCode, supplierCode)) || !matchesSpecialInventoryFlag(item.specialInventoryFlag, 'O')) {
      return;
    }
    const availableQuantity = toNumber(item.availableQuantity);
    if (availableQuantity <= 0) {
      return;
    }
    const id = item.id ?? `inv_${index}`;
    const idKey = String(id);
    if (seenIds.has(idKey)) {
      return;
    }
    seenIds.add(idKey);
    const reservedQty = reserved.get(idKey) || 0;
    const consumedReservation = Math.min(availableQuantity, reservedQty);
    reserved.set(idKey, roundQty(Math.max(0, reservedQty - consumedReservation)));
    const remaining = roundQty(Math.max(0, availableQuantity - consumedReservation));
    if (remaining <= 0) {
      return;
    }
    const key = poolKey(materialCode, supplierCode);
    const pool = pools.get(key) || [];
    pool.push({
      rowKey: `inv_${idKey}`,
      id,
      warehouseCode: item.warehouseCode ?? '',
      areaCode: item.areaCode ?? '',
      locationCode: item.locationCode ?? '',
      batchCode: item.batchCode ?? '',
      receivedDate: item.receivedDate ?? '',
      availableQuantity,
      pickQty: 0,
      specialInventoryFlag: item.specialInventoryFlag ?? 'O',
      businessCode: item.businessCode ?? supplierCode,
      remaining
    });
    pools.set(key, pool);
  });
  pools.forEach((pool) => pool.sort(compareByReceivedDate));
  return pools;
};

const takeSharedPicks = (pool: PoolRow[], demandQty: number) => {
  let need = demandQty;
  const picks: FifoPick[] = [];
  for (const row of pool) {
    if (need <= 0.001) {
      break;
    }
    const pickQty = roundQty(Math.min(row.remaining, need));
    if (pickQty <= 0) {
      continue;
    }
    row.remaining = roundQty(row.remaining - pickQty);
    need = roundQty(need - pickQty);
    picks.push({ ...row, pickQty });
  }
  return { picks, shortageQty: need > 0.001 ? need : 0 };
};

const buildSplitRows = (demand: PendingDemand, picks: FifoPick[]) => {
  let remaining = demand.demandQty;
  const rows: PurchaseOrderBomVO[] = [];
  picks.forEach((location, index) => {
    const inventoryQuantity = roundQty(Math.max(0, Math.min(location.pickQty, location.availableQuantity, remaining)));
    remaining = roundQty(Math.max(0, remaining - inventoryQuantity));
    if (inventoryQuantity <= 0) {
      return;
    }
    const batchCode = location.batchCode || '';
    rows.push(
      inheritPoItemNumberOnBom(
        {
          ...demand.bom,
          originBomKey: demand.originBomKey,
          moveType: '543',
          inventoryDetailId: location.id,
          warehouseCode: location.warehouseCode,
          areaCode: location.areaCode,
          locationCode: location.locationCode,
          batchCode,
          specialInventoryFlag: location.specialInventoryFlag || 'O',
          businessCode: location.businessCode || demand.supplierCode,
          consumeQuantity: roundQty(inventoryQuantity / demand.conversionRatio),
          inventoryQuantity: inventoryQuantity.toFixed(3),
          inventorySplitKey: `${demand.originBomKey}_${batchCode || 'batch'}_${location.rowKey || location.id || index}`
        },
        { itemNumber: demand.parent.itemNumber || '' }
      )
    );
  });
  if (remaining > 0.001) {
    rows.push(
      inheritPoItemNumberOnBom(
        {
          ...demand.bom,
          originBomKey: demand.originBomKey,
          moveType: '543',
          inventoryDetailId: undefined,
          warehouseCode: undefined,
          areaCode: undefined,
          locationCode: undefined,
          batchCode: undefined,
          specialInventoryFlag: undefined,
          businessCode: undefined,
          inventorySplitKey: `${demand.originBomKey}_unassigned`,
          consumeQuantity: roundQty(remaining / demand.conversionRatio),
          inventoryQuantity: remaining.toFixed(3)
        },
        { itemNumber: demand.parent.itemNumber || '' }
      )
    );
  }
  return rows;
};

const allocateNow = async (parents: SubcontractBatchParent[]) => {
  const demands = collectDemands(parents);
  const shortages: SubcontractBatchShortage[] = [];
  if (!demands.length) {
    return shortages;
  }

  const pendingBoms = new Set(demands.map((demand) => demand.bom));
  const reserved = collectReservedQty(parents, pendingBoms);
  const allocatableDemands: PendingDemand[] = [];
  demands.forEach((demand) => {
    if (!demand.materialCode) {
      shortages.push({
        parentMaterialCode: demand.parent.materialCode || '',
        componentMaterial: '',
        shortageQty: demand.demandQty,
        reason: 'missingMaterial'
      });
      return;
    }
    if (!demand.supplierCode) {
      shortages.push({
        parentMaterialCode: demand.parent.materialCode || '',
        componentMaterial: demand.materialCode,
        shortageQty: demand.demandQty,
        reason: 'missingSupplier'
      });
      return;
    }
    allocatableDemands.push(demand);
  });

  const replacements = new Map<PurchaseOrderBomVO, PurchaseOrderBomVO[]>();
  if (!allocatableDemands.length) {
    return shortages;
  }

  let pools = new Map<string, PoolRow[]>();
  try {
    pools = await loadSharedPools(allocatableDemands, reserved);
  } catch {
    allocatableDemands.forEach((demand) => {
      shortages.push({
        parentMaterialCode: demand.parent.materialCode || '',
        componentMaterial: demand.materialCode,
        shortageQty: demand.demandQty,
        reason: 'queryFailed'
      });
    });
    return shortages;
  }

  allocatableDemands.forEach((demand) => {
    const pool = pools.get(poolKey(demand.materialCode, demand.supplierCode)) || [];
    const { picks, shortageQty } = takeSharedPicks(pool, demand.demandQty);
    if (shortageQty > 0) {
      shortages.push({
        parentMaterialCode: demand.parent.materialCode || '',
        componentMaterial: demand.materialCode,
        shortageQty,
        reason: 'shortage'
      });
    }
    const rows = buildSplitRows(demand, picks);
    if (rows.some((row) => normalizeCode(row.batchCode))) {
      replacements.set(demand.bom, rows);
    }
  });

  parents.forEach((parent) => {
    const list = parent.purchaseOrderBomScheduleVoList;
    if (!list?.length) {
      return;
    }
    for (let index = list.length - 1; index >= 0; index -= 1) {
      const nextRows = replacements.get(list[index]);
      if (!nextRows?.length) {
        continue;
      }
      list.splice(index, 1, ...nextRows);
    }
  });

  return shortages;
};

let allocationQueue: Promise<void> = Promise.resolve();

/** 为尚未选择批次的 543 扣料按接收日期先进先出自动分配，已选批次占用的库存不会重复使用。 */
export const assignMissingSubcontractBatches = (parents: SubcontractBatchParent[]) => {
  const job = allocationQueue.then(() => allocateNow(parents));
  allocationQueue = job.then(
    () => undefined,
    () => undefined
  );
  return job;
};

export const formatSubcontractBatchShortageMessage = (shortages: SubcontractBatchShortage[]) => {
  const lines = shortages.map((item) => {
    const label = `${item.parentMaterialCode || '-'} / 组件 ${item.componentMaterial || '-'}`;
    if (item.reason === 'missingMaterial') {
      return `${label}：缺少组件料号`;
    }
    if (item.reason === 'missingSupplier') {
      return `${label}：缺少供应商代码`;
    }
    if (item.reason === 'queryFailed') {
      return `${label}：库存查询失败`;
    }
    return `${label}：缺口 ${item.shortageQty}`;
  });
  const hasError = shortages.some((item) => item.reason !== 'shortage');
  const title = hasError ? '以下扣料无法自动分配批次：' : '以下扣料按先进先出分配后仍有缺口：';
  return `${title}\n${lines.join('\n')}`;
};

export interface SubcontractDialogPick {
  id?: string | number;
  batchCode?: string;
  locationCode?: string;
  warehouseCode?: string;
  pickQty?: number;
  quantity?: number;
}

/**
 * 手动打开批次弹框时，同一原始 BOM 拆出的全部批次作为一个编辑组带入。
 * 编辑组以外的行才作为已占用库存，确保用户可以取消任意一个系统推荐批次。
 */
export const collectSubcontractDialogPicks = (parents: SubcontractBatchParent[], currentBom: PurchaseOrderBomVO) => {
  const owner = parents.find((parent) => (parent.purchaseOrderBomScheduleVoList || []).includes(currentBom));
  const supplierCode = normalizeCode(owner?.supplierCode);
  const materialCode = normalizeCode(currentBom.componentMaterial);
  const originBomKey = normalizeCode(currentBom.originBomKey);
  const isCurrentGroup = (bom: PurchaseOrderBomVO) => bom === currentBom || (!!originBomKey && normalizeCode(bom.originBomKey) === originBomKey);
  const currentGroup = (owner?.purchaseOrderBomScheduleVoList || []).filter(isCurrentGroup);
  const initialPicks: SubcontractDialogPick[] = [];
  currentGroup.forEach((bom) => {
    if (bom.inventoryDetailId || normalizeCode(bom.batchCode)) {
      initialPicks.push({
        id: bom.inventoryDetailId,
        batchCode: bom.batchCode,
        locationCode: bom.locationCode,
        warehouseCode: bom.warehouseCode,
        pickQty: getDemandQty(bom)
      });
    }
  });
  const reservedPicks: SubcontractDialogPick[] = [];
  parents.forEach((parent) => {
    if (normalizeCode(parent.supplierCode) !== supplierCode) {
      return;
    }
    (parent.purchaseOrderBomScheduleVoList || []).forEach((bom) => {
      if ((parent === owner && isCurrentGroup(bom)) || normalizeCode(bom.componentMaterial) !== materialCode) {
        return;
      }
      if (!bom.inventoryDetailId && !normalizeCode(bom.batchCode)) {
        return;
      }
      reservedPicks.push({
        id: bom.inventoryDetailId,
        batchCode: bom.batchCode,
        locationCode: bom.locationCode,
        warehouseCode: bom.warehouseCode,
        quantity: getDemandQty(bom)
      });
    });
  });
  const demandQty = roundQty((currentGroup.length ? currentGroup : [currentBom]).reduce((sum, bom) => sum + getDemandQty(bom), 0));
  return { initialPicks, reservedPicks, demandQty };
};
