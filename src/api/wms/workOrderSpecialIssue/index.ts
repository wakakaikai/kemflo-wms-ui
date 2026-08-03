import { applyIssueUnitSelection, buildAutoPrepDemandItems, buildFlatPrepDemandItems, buildInventoryCheckLineResultIndex, buildInventoryCheckMaterialMap, buildLinePrepDemandItems, bomRequiresSalesOrderInventory, calcDefaultPrepIssueQty, checkMaterialInventory, classifyWorkOrders, enrichLocationRowsWithSalesOrderDefaults, generateAllocation, getBomRowKey, getReserveLineKey, getWorkOrderBom, isClassifiedShortageRow, issueQtyToInventoryQty, normalizeCheckInventoryLocationRows, normalizeInventoryCheckMaterialCode, normalizePartSizeType, parseInventoryCheckPayload, refreshBomMaterialPoolMetrics, refreshBomRowRecommendations, resolveBomRowPoolQtyFromCheck, resolveBomSalesOrderConstraint, resolveInventoryCheckLineResultForBom, resolveInventoryCheckMaterialKey, resolvePrepDemandTargetLocationFromItems, type AllocationGenerateResult } from '@/api/wms/allocation/index';
import { computed, getCurrentInstance, nextTick, ref, toRefs, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { HttpStatus } from '@/enums/RespEnum';
import type { HistoryConfig } from '@/types/history';
import type { BomIssueRow, InventoryCheckResultVO, WorkOrderMaterialIssueLine, WorkOrderVO } from '@/api/wms/allocation/types';
import { mapApiBomToOverPickRow, mergeOverPickLines, type OverPickLine } from '@/api/wms/workOrderOverPick/index';
import { getPrepDemand, normalizePrepDemand } from '@/api/wms/workOrderPrepDemand/index';
import { PREP_DEMAND_TYPE_NORMAL } from '@/api/wms/workOrderPrepDemand/index';
import type { WorkOrderPrepDemandVO } from '@/api/wms/workOrderPrepDemand/types';
import type { PrepDemandLineItem } from '@/api/wms/workOrderPrepDemand/types';
import type { WorkOrderBomVO } from '@/api/wms/workOrderBom/types';
import type { TargetDemandLocationSelection } from '@/views/wms/allocation/components/TargetDemandLocationDialog.vue';
import { useUserStore } from '@/store/modules/user';

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
    .filter(
      (bom) =>
        String(bom.componentMaterial || '')
          .trim()
          .toUpperCase() === code
    )
    .map((bom) => mapApiBomToSpecialIssueRow(bom, workOrder));
}

type DemandUserMode = 'self' | 'other';

/** 特殊工单领料（ZP92-拆解 / ZP93-粉碎）共用逻辑与状态 */
export function useZpIssue(mode: 'ZP92' | 'ZP93') {
  const userStore = useUserStore();
  const { proxy } = getCurrentInstance() as ComponentInternalInstance;
  const { wms_material_user } = toRefs<any>(proxy?.useDict('wms_material_user'));

  // ==================== 需求人状态 ====================
  const demandUserMode = ref<DemandUserMode>('self');
  const otherUserCode = ref('');
  const materialUserCode = ref('');
  const materialUserLabel = ref('');

  const materialUserOptions = computed(() => (wms_material_user.value || []) as DictDataOption[]);
  const currentUserDisplay = computed(() => userStore.nickname || userStore.name || '');

  const resolveSelfDictOption = (): DictDataOption | undefined => {
    const userName = String(userStore.name || '').trim();
    if (!userName) return undefined;
    return materialUserOptions.value.find((d) => String(d.value) === userName);
  };

  const otherUserOptions = computed(() => {
    const userName = String(userStore.name || '').trim();
    if (!userName) return materialUserOptions.value;
    return materialUserOptions.value.filter((d) => String(d.value) !== userName);
  });

  const applyDemandUserSelection = (): boolean => {
    if (demandUserMode.value === 'self') {
      const userName = String(userStore.name || '').trim();
      if (!userName) return false;
      materialUserCode.value = userName;
      const self = resolveSelfDictOption();
      materialUserLabel.value = self?.label || userStore.nickname || userName;
      return true;
    }
    const code = String(otherUserCode.value || '').trim();
    if (!code) return false;
    const hit = materialUserOptions.value.find((d) => String(d.value) === code);
    materialUserCode.value = code;
    materialUserLabel.value = hit?.label || code;
    return true;
  };

  const onDemandUserModeChange = () => {
    if (demandUserMode.value === 'self') {
      applyDemandUserSelection();
      return;
    }
    materialUserCode.value = '';
    materialUserLabel.value = '';
  };

  watch(
    materialUserOptions,
    () => {
      if (demandUserMode.value === 'self') {
        applyDemandUserSelection();
      }
    },
    { immediate: true }
  );

  // ==================== 工单与物料状态 ====================
  const showOrderDialog = ref(false);
  const dialogSelectedOrders = ref<WorkOrderVO[]>([]);
  const workOrderNo = ref('');
  const materialCode = ref('');
  const materialUnit = ref('');
  const requiredQty = ref(0);
  const workOrder = ref<WorkOrderVO | null>(null);
  const pickLines = ref<SpecialIssueLine[]>([]);
  const loadingAdd = ref(false);
  const generating = ref(false);
  const targetLocationVisible = ref(false);
  const classifiedOrder = ref<WorkOrderVO | null>(null);
  const generatedDemand = ref<WorkOrderPrepDemandVO | null>(null);
  const resultMessage = ref('');
  const resultStatus = ref(false);
  const selectedMaterialCode = ref('');
  const selectedMaterialDesc = ref('');
  const selectedIssueQty = ref(0);
  const selectedUnit = ref('');
  const selectedLineIndex = ref(-1);
  const showLocationDialog = ref(false);
  const itemDialogRef = ref<any>();

  // 依据模式映射工单类型过滤参数：ZP92 拆解 → 00092；ZP93 粉碎 → 00093
  const workOrderTypeParam = computed(() => (mode === 'ZP92' ? '00092' : '00093'));
  // 仅展示 RELEASABLE 与 CRTD 状态的工单
  const workOrderStatusList = ['RELEASABLE', 'CRTD'];

  const materialCodeConfig: HistoryConfig = {
    key: 'materialCode',
    storage: 'indexedDB',
    maxSize: 10,
    page: 'workOrderSpecialIssue',
    autoSave: true,
    component: {
      showDropdown: true,
      showTime: false,
      showDelete: true,
      dropdownMaxHeight: '300px'
    }
  };

  // ==================== 工单选择 ====================
  const handleOrderSelection = async (orders: WorkOrderVO[]) => {
    showOrderDialog.value = false;
    if (!orders.length) return;
    const order = orders[0];
    if (orders.length > 1) {
      ElMessage.warning('特殊工单仅支持单个工单，已选择首个工单');
    }
    clearAll();
    workOrderNo.value = order.workOrderNo;
    workOrder.value = order;

    if (mode === 'ZP92') {
      loadingAdd.value = true;
      try {
        const bomRes = await getWorkOrderBom(order.workOrderNo);
        if (bomRes.code !== 200) {
          ElMessage.error(bomRes.msg || '查询工单 BOM 失败');
          return;
        }
        const rows = (bomRes.data || []).map((bom: any) => mapApiBomToSpecialIssueRow(bom, order));
        if (!rows.length) {
          ElMessage.warning('工单 BOM 为空，无物料可领');
          return;
        }
        pickLines.value = mergeSpecialIssueLines([], rows);
        ElMessage.success(`已加载 BOM ${rows.length} 条物料，请填写领料数量并点击「查库存」选择库位`);
      } catch (error) {
        ElMessage.error((error as Error)?.message || '加载 BOM 失败');
      } finally {
        loadingAdd.value = false;
      }
    } else {
      ElMessage.success(`已选择工单：${order.workOrderNo}`);
    }
  };

  // ==================== 计算属性 ====================
  const canAddMaterial = computed(() => !!workOrder.value && Number(requiredQty.value) > 0 && !!materialCode.value?.trim());

  const canGenerate = computed(() => {
    if (!workOrder.value) return false;
    return pickLines.value.some((row) => isSpecialIssueLineReady(row));
  });

  const canSelectLocation = (row: SpecialIssueLine) => Number(row.issueQty ?? 0) > 0;

  // ==================== 工具方法 ====================
  const formatQty = (qty?: number | string) => {
    const n = Number(qty ?? 0);
    return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '-';
  };

  const clearAll = () => {
    pickLines.value = [];
    classifiedOrder.value = null;
    generatedDemand.value = null;
    resultMessage.value = '';
    resultStatus.value = false;
    workOrderNo.value = '';
    materialCode.value = '';
    requiredQty.value = 0;
    workOrder.value = null;
  };

  // ==================== 物料添加（ZP93） ====================
  const handleAddByMaterial = () => {
    const woNo = padWorkOrderNo(workOrderNo.value);
    const matCode = String(materialCode.value || '').trim();
    const qty = Number(requiredQty.value) || 0;
    if (!woNo) {
      ElMessage.warning('请先选择工单');
      return;
    }
    if (!matCode) {
      ElMessage.warning('请输入料号');
      return;
    }
    if (qty <= 0) {
      ElMessage.warning('请输入需求数量');
      return;
    }

    const existingIndex = pickLines.value.findIndex((row) => row.componentMaterial === matCode);
    if (existingIndex >= 0) {
      pickLines.value[existingIndex] = { ...pickLines.value[existingIndex], issueQty: qty };
    } else {
      pickLines.value.push({
        componentMaterial: matCode,
        componentQty: 0,
        issueQty: qty,
        unit: materialUnit.value || undefined,
        workOrderNo: woNo
      });
    }
    classifiedOrder.value = null;
    generatedDemand.value = null;
    materialCode.value = '';
    requiredQty.value = 0;
  };

  // ==================== 库位选择（手动） ====================
  const openLocationQuery = (row: SpecialIssueLine, index: number) => {
    if (Number(row.issueQty ?? 0) <= 0) {
      ElMessage.warning('请先填写领料数量');
      return;
    }
    selectedMaterialCode.value = row.componentMaterial;
    selectedMaterialDesc.value = row.componentDesc || '';
    selectedIssueQty.value = Number(row.issueQty ?? 0);
    selectedUnit.value = row.unit || '';
    selectedLineIndex.value = index;
    showLocationDialog.value = true;
  };

  const onInventoryLocationConfirm = (payload: { locations: any[] }) => {
    const idx = selectedLineIndex.value;
    if (idx < 0 || idx >= pickLines.value.length) return;
    const current = pickLines.value[idx];
    if (!current) return;
    pickLines.value[idx] = {
      ...current,
      manualLocationSelections: payload.locations.map((loc) => ({
        rowKey: loc.rowKey,
        warehouseCode: loc.warehouseCode,
        locationCode: loc.locationCode,
        batchCode: loc.batchCode,
        availableQuantity: loc.availableQuantity,
        recommendedQty: loc.pickQty,
        unit: loc.unit
      })),
      locationOverrideReason: undefined
    };
    classifiedOrder.value = null;
    ElMessage.success('库位选择已保存');
    selectedLineIndex.value = -1;
  };

  // ==================== 生成备料计划 ====================
  const openTargetLocationDialog = async () => {
    if (!workOrder.value) {
      ElMessage.warning('请先选择工单');
      return;
    }
    if (!canGenerate.value) {
      ElMessage.warning('请添加物料并填写领料数量');
      return;
    }
    if (!classifiedOrder.value) {
      try {
        classifiedOrder.value = await classifySpecialIssueWorkOrder(buildWorkOrderFromSpecialIssueLines(workOrder.value, pickLines.value));
      } catch {
        ElMessage.error('分类失败，请重试');
        return;
      }
    }
    targetLocationVisible.value = true;
  };

  const applyTargetDemandLocation = (selection: TargetDemandLocationSelection) => {
    if (!classifiedOrder.value) return;
    const locationCode = String(selection.locationCode || '').trim();
    const warehouseCode = String(selection.warehouseCode || '').trim() || undefined;
    classifiedOrder.value = {
      ...classifiedOrder.value,
      materialDemandDetails: (classifiedOrder.value.materialDemandDetails || []).map((line) => ({
        ...line,
        targetDemandLocationCode: locationCode,
        targetDemandWarehouseCode: warehouseCode
      }))
    };
  };

  const handleGeneratePrepDemand = async (selection: TargetDemandLocationSelection) => {
    if (!workOrder.value || !classifiedOrder.value) return;
    generating.value = true;
    resultMessage.value = '';
    try {
      applyTargetDemandLocation(selection);
      const inventoryError = validateSpecialInventorySufficient(pickLines.value);
      if (inventoryError) {
        resultStatus.value = false;
        resultMessage.value = inventoryError;
        return;
      }
      const classifiedError = validateSpecialClassifiedOrder(classifiedOrder.value);
      if (classifiedError) {
        resultStatus.value = false;
        resultMessage.value = classifiedError;
        return;
      }
      const prepItems = buildSpecialPrepItems(classifiedOrder.value);
      if (!prepItems.length) {
        resultStatus.value = false;
        resultMessage.value = '没有可生成的备料明细，请确认库存充足且库位已分配';
        return;
      }
      const targetDemand = resolvePrepDemandTargetLocationFromItems(prepItems);
      const response = await generateAllocation({
        workOrderNos: [workOrder.value.workOrderNo],
        prepItems,
        isEmergency: false,
        demandType: PREP_DEMAND_TYPE_NORMAL,
        materialUserCode: materialUserCode.value,
        materialUserName: materialUserLabel.value,
        targetDemandLocationCode: targetDemand.targetDemandLocationCode,
        targetDemandWarehouseCode: targetDemand.targetDemandWarehouseCode
      });
      if (response.code !== HttpStatus.SUCCESS) {
        resultStatus.value = false;
        resultMessage.value = response.msg || '生成备料计划失败';
        return;
      }
      const result = response.data as AllocationGenerateResult | undefined;
      if (result?.success === false) {
        resultStatus.value = false;
        resultMessage.value = result.message || '生成备料计划失败';
        return;
      }
      if (!result?.demand?.id) {
        resultStatus.value = false;
        resultMessage.value = '未生成备料需求';
        return;
      }
      targetLocationVisible.value = false;
      generatedDemand.value = normalizePrepDemand(result.demand);
      resultStatus.value = true;
      resultMessage.value = `领料备料单已生成：${result.demand.demandNo}`;
    } catch (error) {
      resultStatus.value = false;
      resultMessage.value = (error as Error)?.message || '生成备料计划失败';
    } finally {
      generating.value = false;
    }
  };

  const reloadGeneratedDemand = async () => {
    if (!generatedDemand.value?.id) return;
    const response = await getPrepDemand(generatedDemand.value.id);
    if (response.code === 200 && response.data) {
      generatedDemand.value = response.data;
    }
  };

  const startNewIssue = async () => {
    clearAll();
    await nextTick();
  };

  // ==================== 行操作 ====================
  const updatePickQty = (index: number, val: number) => {
    const row = pickLines.value[index];
    if (!row) return;
    pickLines.value[index] = { ...row, issueQty: Math.max(0, Number(val) || 0) };
    classifiedOrder.value = null;
  };

  const updatePickUnit = (index: number, altUnit: string) => {
    const row = pickLines.value[index];
    if (!row) return;
    pickLines.value[index] = applyIssueUnitSelection(row, altUnit);
    classifiedOrder.value = null;
  };

  const removePickLine = (index: number) => {
    pickLines.value.splice(index, 1);
    classifiedOrder.value = null;
  };

  const clearPickLines = () => {
    pickLines.value = [];
    classifiedOrder.value = null;
    generatedDemand.value = null;
    resultMessage.value = '';
  };

  // ==================== 物料选择 ====================
  const showItemDialog = () => {
    itemDialogRef.value?.openDialog();
    itemDialogRef.value?.handleQuery();
  };

  const itemSelectCallBack = (record: any) => {
    materialCode.value = record.item;
    materialUnit.value = record.unit || '';
  };

  return {
    // 需求人
    demandUserMode,
    otherUserCode,
    materialUserCode,
    materialUserLabel,
    materialUserOptions,
    currentUserDisplay,
    otherUserOptions,
    applyDemandUserSelection,
    onDemandUserModeChange,
    // 工单与物料
    showOrderDialog,
    dialogSelectedOrders,
    workOrderNo,
    materialCode,
    materialUnit,
    requiredQty,
    workOrder,
    pickLines,
    loadingAdd,
    generating,
    targetLocationVisible,
    classifiedOrder,
    generatedDemand,
    resultMessage,
    resultStatus,
    selectedMaterialCode,
    selectedMaterialDesc,
    selectedIssueQty,
    selectedUnit,
    selectedLineIndex,
    showLocationDialog,
    itemDialogRef,
    workOrderTypeParam,
    workOrderStatusList,
    materialCodeConfig,
    // 计算与工具
    canAddMaterial,
    canGenerate,
    canSelectLocation,
    formatQty,
    clearAll,
    // 操作
    handleOrderSelection,
    handleAddByMaterial,
    openLocationQuery,
    onInventoryLocationConfirm,
    openTargetLocationDialog,
    handleGeneratePrepDemand,
    reloadGeneratedDemand,
    startNewIssue,
    updatePickQty,
    updatePickUnit,
    removePickLine,
    clearPickLines,
    showItemDialog,
    itemSelectCallBack
  };
}
