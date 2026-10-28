<template>
  <el-dialog v-model="visible" :title="dialogTitle" width="80%" append-to-body top="5vh" @close="handleClose">
    <div v-loading="loading" class="inventory-selection-dialog">
      <!-- 物料信息 -->
      <div class="material-info">
        <el-descriptions :column="4" border size="small">
          <el-descriptions-item label="物料编码">{{ materialCode }}</el-descriptions-item>
          <el-descriptions-item label="物料描述">{{ materialDesc || '-' }}</el-descriptions-item>
          <el-descriptions-item label="需求数量">
            <span class="demand-qty">{{ formatQty(issueQty) }} {{ unit }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="可用合计">
            <span class="total-qty">{{ formatQty(totalAvailable) }} {{ unit }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <el-alert type="info" :closable="false" show-icon class="tip-alert">
        {{ selectionTip }}
      </el-alert>

      <!-- 工具栏 -->
      <div class="toolbar">
        <span class="toolbar-title">库存明细</span>
        <div class="toolbar-actions">
          <el-button size="small" :loading="loading" @click="loadData">刷新</el-button>
          <el-tag type="info" size="small">明细 {{ inventoryRows.length }} 条</el-tag>
          <el-tag v-if="selectedCount" type="primary" size="small">已选 {{ selectedCount }} 项</el-tag>
          <el-tag type="success" size="small">已分配 {{ formatQty(totalPicked) }} / {{ formatQty(issueQty) }} {{ unit }}</el-tag>
        </div>
      </div>

      <!-- 库存表格 -->
      <el-table ref="tableRef" :data="inventoryRows" row-key="rowKey" border stripe size="small" max-height="420" @selection-change="onSelectionChange">
        <el-table-column type="selection" width="46" :selectable="isRowSelectable" />
        <el-table-column v-if="showWarehouseLocation" prop="warehouseCode" label="仓库" min-width="100" show-overflow-tooltip />
        <el-table-column v-if="showWarehouseLocation" prop="locationCode" label="库位" min-width="120" show-overflow-tooltip />
        <el-table-column prop="batchCode" label="批次号" min-width="110" show-overflow-tooltip>
          <template #default="{ row }">{{ row.batchCode || '-' }}</template>
        </el-table-column>
        <el-table-column v-if="props.autoRecommendFifo" prop="receivedDate" label="接收日期" min-width="155" show-overflow-tooltip>
          <template #default="{ row }">{{ row.receivedDate || '-' }}</template>
        </el-table-column>
        <el-table-column label="非限制数量" min-width="110" align="right">
          <template #default="{ row }">{{ formatQty(row.availableQuantity) }}</template>
        </el-table-column>
        <el-table-column label="质检数量" min-width="110" align="right">
          <template #default="{ row }">{{ formatQty(row.inspectionQty) }}</template>
        </el-table-column>
        <el-table-column label="冻结数量" min-width="110" align="right">
          <template #default="{ row }">{{ formatQty(row.blockedQty) }}</template>
        </el-table-column>
        <el-table-column label="可用数量" min-width="110" align="right">
          <template #default="{ row }">{{ formatQty(row.usableQuantity) }}</template>
        </el-table-column>
        <el-table-column label="本次数量" min-width="150" align="right">
          <template #default="{ row }">
            <el-input-number v-if="isRowSelected(row)" :model-value="row.pickQty" :min="0" :max="getPickQtyMax(row)" :precision="3" :step="1" controls-position="right" size="small" class="pick-qty-input" :disabled="!isRowSelected(row)" @click.stop @change="(val: number | undefined) => onPickQtyChange(row, val)" />
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="特殊库存" min-width="90" align="center">
          <template #default="scope">
            <dict-tag :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
          </template>
        </el-table-column>
        <el-table-column v-if="!generalOnly" prop="businessCode" label="业务伙伴" min-width="120">
          <template #default="{ row }">{{ row.businessCode || '-' }}</template>
        </el-table-column>
        <el-table-column v-if="!generalOnly" prop="businessName" label="业务伙伴名称" min-width="150">
          <template #default="{ row }">{{ row.businessName || '-' }}</template>
        </el-table-column>
      </el-table>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <span class="selection-summary">
          已选 {{ selectedCount }} 项，已分配 {{ formatQty(totalPicked) }} / 需求 {{ formatQty(issueQty) }} {{ unit }}
          <span v-if="shortageQty > 0" class="shortage-hint">（缺口 {{ formatQty(shortageQty) }} {{ unit }}）</span>
        </span>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :disabled="!canConfirm" @click="handleConfirm">确认选择</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, getCurrentInstance, toRefs } from 'vue';
import { ElMessage } from 'element-plus';
import type { TableInstance } from 'element-plus';
import { listInventoryDetail } from '@/api/wms/inventoryDetail/index';
import type { InventoryDetailVO } from '@/api/wms/inventoryDetail/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_inventory_special_flag } = toRefs<any>(proxy?.useDict('wms_inventory_special_flag'));

interface InventoryPickRow {
  rowKey: string;
  id: string | number;
  warehouseCode: string;
  areaCode: string;
  locationCode: string;
  batchCode: string;
  receivedDate: string;
  availableQuantity: number;
  usableQuantity: number;
  inspectionQty: number;
  blockedQty: number;
  specialInventoryFlag: string;
  businessCode: string;
  businessName: string;
  unit: string;
  pickQty: number;
}

export interface InventorySelectionPick {
  id?: string | number;
  batchCode?: string;
  locationCode?: string;
  warehouseCode?: string;
  pickQty?: number;
  quantity?: number;
}

interface Props {
  modelValue: boolean;
  materialCode: string;
  materialDesc?: string;
  issueQty: number;
  unit?: string;
  generalOnly?: boolean;
  /** 可选：仅展示指定特殊库存标识 */
  specialInventoryFlag?: string;
  /** 可选：仅展示指定业务伙伴编码 */
  businessCode?: string;
  /** 是否按批次接收日期先进先出自动推荐 */
  autoRecommendFifo?: boolean;
  /** 当前行已选批次。有值时只勾选这些批次，列表仍展示全部批次 */
  initialPicks?: InventorySelectionPick[];
  /** 其他行已占用的数量，从同一库存池的可用数量中扣除，不改非限制数量 */
  reservedPicks?: InventorySelectionPick[];
  /** 543 扣料不展示仓库和库位 */
  showWarehouseLocation?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  materialDesc: '',
  unit: '',
  generalOnly: true,
  specialInventoryFlag: '',
  businessCode: '',
  autoRecommendFifo: false,
  initialPicks: () => [],
  reservedPicks: () => [],
  showWarehouseLocation: true
});

const emit = defineEmits<{
  'update:modelValue': [boolean];
  confirm: [payload: { locations: InventoryPickRow[] }];
}>();

const visible = ref(false);
const loading = ref(false);
const tableRef = ref<TableInstance>();
const inventoryRows = ref<InventoryPickRow[]>([]);
const selectedRowKeys = ref<Set<string>>(new Set());
const applyingSelection = ref(false);
const appliedInitialPicks = ref(false);
const initialPickBlocked = ref(false);

const selectionTip = computed(() => {
  if (initialPickBlocked.value) {
    return '当前批次剩余库存已被其他行占用，请改选仍有剩余的批次';
  }
  if (appliedInitialPicks.value) {
    return '已勾选当前行批次。非限制数量是库存总量，可用数量已扣除其他行占用，本次数量不能超过可用数量';
  }
  return props.autoRecommendFifo ? '已按批次接收日期先进先出自动推荐，可手动调整后确认' : '各库位库存明细如下，勾选并填写「本次数量」后点击确认';
});

const dialogTitle = computed(() => `库存选择 - ${props.materialCode}`);

const totalAvailable = computed(() => inventoryRows.value.reduce((s, r) => s + r.usableQuantity, 0));

const selectedRows = computed(() => inventoryRows.value.filter((r) => selectedRowKeys.value.has(r.rowKey) && r.pickQty > 0));

const selectedCount = computed(() => selectedRows.value.length);

const totalPicked = computed(() => selectedRows.value.reduce((s, r) => s + r.pickQty, 0));

const shortageQty = computed(() => Math.max(0, Number(props.issueQty ?? 0) - totalPicked.value));

const canConfirm = computed(() => selectedCount.value > 0 && totalPicked.value > 0);

const formatQty = (val?: number | string) => {
  const n = Number(val ?? 0);
  return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 3 }) : '0';
};

const isGeneralInventory = (flag?: string) => {
  const value = String(flag ?? '')
    .trim()
    .toUpperCase();
  return !value || value === 'N';
};

const isRowSelectable = (row: InventoryPickRow) => row.usableQuantity > 0;

const isRowSelected = (row: InventoryPickRow) => selectedRowKeys.value.has(row.rowKey);

const demandQty = computed(() => Number(props.issueQty ?? 0));

const hasDemandCap = computed(() => demandQty.value > 0);

const getOtherPickedQty = (row: InventoryPickRow) => selectedRows.value.reduce((sum, item) => (item.rowKey === row.rowKey ? sum : sum + item.pickQty), 0);

const getPickQtyMax = (row: InventoryPickRow) => {
  if (!hasDemandCap.value) {
    return row.usableQuantity;
  }
  const remainByDemand = Math.max(0, Number((demandQty.value - getOtherPickedQty(row)).toFixed(3)));
  return Math.min(row.usableQuantity, remainByDemand);
};

const onSelectionChange = (rows: InventoryPickRow[]) => {
  if (applyingSelection.value) return;
  const newKeys = new Set(rows.map((r) => r.rowKey));
  // 取消勾选的行清空 pickQty
  for (const row of inventoryRows.value) {
    if (!newKeys.has(row.rowKey) && selectedRowKeys.value.has(row.rowKey)) {
      row.pickQty = 0;
    }
  }
  // 新勾选的行设置默认数量（不超过可用库存与剩余需求）
  let allocated = totalPicked.value;
  for (const row of rows) {
    if (!selectedRowKeys.value.has(row.rowKey) && row.pickQty <= 0) {
      const remainByDemand = hasDemandCap.value ? Math.max(0, Number((demandQty.value - allocated).toFixed(3))) : row.usableQuantity;
      row.pickQty = Math.min(row.usableQuantity, remainByDemand);
      allocated = Number((allocated + row.pickQty).toFixed(3));
    }
  }
  selectedRowKeys.value = newKeys;
};

const onPickQtyChange = (row: InventoryPickRow, val: number | undefined) => {
  row.pickQty = Math.max(0, Math.min(getPickQtyMax(row), Number(val ?? 0)));
  if (row.pickQty <= 0 && selectedRowKeys.value.has(row.rowKey)) {
    applyingSelection.value = true;
    tableRef.value?.toggleRowSelection(row, false);
    applyingSelection.value = false;
    selectedRowKeys.value.delete(row.rowKey);
  }
};

const resolveQuerySpecialInventoryFlag = () => {
  const explicit = String(props.specialInventoryFlag ?? '').trim();
  if (explicit) {
    return explicit;
  }
  return props.generalOnly ? 'N' : undefined;
};

const matchesSpecialInventoryFlag = (itemFlag?: string, expected?: string) => {
  if (!expected) {
    return true;
  }
  return (
    String(itemFlag ?? '')
      .trim()
      .toUpperCase() === expected.trim().toUpperCase()
  );
};

const compareByReceivedDate = (left: InventoryPickRow, right: InventoryPickRow) => {
  const leftDate = left.receivedDate || '9999-12-31 23:59:59';
  const rightDate = right.receivedDate || '9999-12-31 23:59:59';
  return leftDate.localeCompare(rightDate) || left.batchCode.localeCompare(right.batchCode) || left.rowKey.localeCompare(right.rowKey);
};

const sameText = (left?: string, right?: string) => String(left ?? '').trim() === String(right ?? '').trim();

const matchesInventoryPick = (row: InventoryPickRow, pick: InventorySelectionPick) => {
  if (pick.id !== undefined && pick.id !== null && String(pick.id) !== '') {
    return String(row.id) === String(pick.id);
  }
  if (!sameText(row.batchCode, pick.batchCode) || !pick.batchCode) {
    return false;
  }
  if (pick.locationCode && !sameText(row.locationCode, pick.locationCode)) {
    return false;
  }
  if (pick.warehouseCode && !sameText(row.warehouseCode, pick.warehouseCode)) {
    return false;
  }
  return true;
};

const buildReservedQuantityMap = () => {
  const reserved = new Map<string, number>();
  (props.reservedPicks || []).forEach((pick) => {
    if (pick.id === undefined || pick.id === null || String(pick.id) === '') {
      return;
    }
    const key = String(pick.id);
    const quantity = Number(pick.quantity ?? pick.pickQty ?? 0);
    reserved.set(key, Number(((reserved.get(key) || 0) + quantity).toFixed(3)));
  });
  return reserved;
};

const selectRows = async (rows: InventoryPickRow[]) => {
  selectedRowKeys.value = new Set(rows.map((row) => row.rowKey));
  await nextTick();
  rows.forEach((row) => tableRef.value?.toggleRowSelection(row, true));
};

const applyFifoRecommendation = async () => {
  applyingSelection.value = true;
  appliedInitialPicks.value = false;
  initialPickBlocked.value = false;
  try {
    tableRef.value?.clearSelection();
    selectedRowKeys.value = new Set();
    inventoryRows.value.forEach((row) => (row.pickQty = 0));

    const initialPicks = (props.initialPicks || []).filter((pick) => Number(pick.pickQty ?? pick.quantity ?? 0) > 0 || pick.id || pick.batchCode);
    if (initialPicks.length) {
      let remaining = hasDemandCap.value ? demandQty.value : Number.POSITIVE_INFINITY;
      const selectedRows: InventoryPickRow[] = [];
      for (const pick of initialPicks) {
        if (remaining <= 0.001) {
          break;
        }
        const row =
          inventoryRows.value.find((item) => pick.id !== undefined && pick.id !== null && String(pick.id) !== '' && String(item.id) === String(pick.id) && !selectedRows.includes(item)) ||
          inventoryRows.value.find((item) => matchesInventoryPick({ ...item, id: '' }, { ...pick, id: undefined }) && !selectedRows.includes(item));
        if (!row || row.usableQuantity <= 0) {
          continue;
        }
        const requested = Number(pick.pickQty ?? pick.quantity ?? remaining);
        row.pickQty = Math.min(row.usableQuantity, requested > 0 ? requested : remaining, remaining);
        if (row.pickQty > 0) {
          selectedRows.push(row);
          remaining = Math.max(0, Number((remaining - row.pickQty).toFixed(3)));
        }
      }
      if (selectedRows.length) {
        appliedInitialPicks.value = true;
        await selectRows(selectedRows);
      } else {
        initialPickBlocked.value = true;
      }
      return;
    }

    if (!props.autoRecommendFifo || !hasDemandCap.value) {
      return;
    }

    let remaining = demandQty.value;
    const recommendedRows: InventoryPickRow[] = [];
    for (const row of inventoryRows.value) {
      if (remaining <= 0) break;
      row.pickQty = Math.min(row.usableQuantity, remaining);
      if (row.pickQty > 0) {
        recommendedRows.push(row);
        remaining = Math.max(0, Number((remaining - row.pickQty).toFixed(3)));
      }
    }
    await selectRows(recommendedRows);
  } finally {
    applyingSelection.value = false;
  }
};

const loadData = async () => {
  if (!props.materialCode) return;
  loading.value = true;
  try {
    const res = await listInventoryDetail({
      itemCode: props.materialCode,
      specialInventoryFlag: resolveQuerySpecialInventoryFlag(),
      businessCode: props.businessCode || undefined,
      pageNum: 1,
      pageSize: 99999,
      params: {}
    });
    const list = (res as any).rows ?? res ?? [];
    const reservedById = buildReservedQuantityMap();
    inventoryRows.value = list
      .filter((item: InventoryDetailVO) => {
        if (!matchesSpecialInventoryFlag(item.specialInventoryFlag, props.specialInventoryFlag)) {
          return false;
        }
        if (props.businessCode && item.businessCode !== props.businessCode) {
          return false;
        }
        return (!props.generalOnly || isGeneralInventory(item.specialInventoryFlag)) && Number(item.availableQuantity ?? 0) > 0;
      })
      .map((item: InventoryDetailVO, index: number) => {
        const id = item.id ?? `inv_${index}`;
        const warehouseQuantity = Number(item.availableQuantity ?? 0);
        const reservedQty = reservedById.get(String(id)) || 0;
        const consumedReservation = Math.min(warehouseQuantity, reservedQty);
        reservedById.set(String(id), Number(Math.max(0, reservedQty - consumedReservation).toFixed(3)));
        return {
          rowKey: `inv_${id}`,
          id,
          warehouseCode: item.warehouseCode ?? '',
          areaCode: item.areaCode ?? '',
          locationCode: item.locationCode ?? '',
          batchCode: item.batchCode ?? '',
          receivedDate: item.receivedDate ?? '',
          availableQuantity: Number(warehouseQuantity.toFixed(3)),
          usableQuantity: Number(Math.max(0, warehouseQuantity - consumedReservation).toFixed(3)),
          inspectionQty: Number(item.inspectionQuantity ?? 0),
          blockedQty: Number(item.blockedQuantity ?? 0),
          specialInventoryFlag: item.specialInventoryFlag ?? '',
          businessCode: item.businessCode ?? '',
          businessName: item.businessName ?? '',
          unit: item.unit ?? props.unit ?? '',
          pickQty: 0
        };
      })
      .sort(props.autoRecommendFifo ? compareByReceivedDate : () => 0);
    await applyFifoRecommendation();
  } catch (error) {
    ElMessage.error('查询库存失败');
    inventoryRows.value = [];
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.modelValue,
  async (val) => {
    visible.value = val;
    if (val && props.materialCode) {
      selectedRowKeys.value = new Set();
      await loadData();
      await nextTick();
    }
  }
);

watch(visible, (val) => {
  emit('update:modelValue', val);
});

const handleConfirm = () => {
  const picked = selectedRows.value.map((r) => ({ ...r }));
  if (!picked.length) {
    ElMessage.warning('请至少选择一条库存明细并填写本次数量');
    return;
  }
  if (hasDemandCap.value && totalPicked.value > demandQty.value) {
    ElMessage.warning('本次发料合计不能超过待发/需求数量');
    return;
  }
  emit('confirm', { locations: picked });
  handleClose();
};

const handleClose = () => {
  visible.value = false;
  inventoryRows.value = [];
  selectedRowKeys.value = new Set();
  appliedInitialPicks.value = false;
  initialPickBlocked.value = false;
  tableRef.value?.clearSelection();
};
</script>

<style scoped>
.inventory-selection-dialog {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.material-info {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}
.demand-qty {
  font-weight: 600;
  color: var(--el-color-primary);
}
.total-qty {
  font-weight: 600;
  color: var(--el-color-success);
}
.tip-alert {
  margin-bottom: 0;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.toolbar-title {
  font-size: 15px;
  font-weight: 600;
}
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.pick-qty-input {
  width: 120px;
}
.selection-summary {
  margin-right: auto;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.shortage-hint {
  color: var(--el-color-warning);
}
.text-muted {
  color: var(--el-text-color-placeholder);
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  width: 100%;
}
</style>
