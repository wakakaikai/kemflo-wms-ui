<template>
  <el-dialog v-model="visible" :title="dialogTitle" width="1000px" append-to-body top="5vh" @close="handleClose">
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
        各库位库存明细如下，勾选并填写「本次领料数量」后点击确认
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
      <el-table
        ref="tableRef"
        :data="inventoryRows"
        row-key="rowKey"
        border
        stripe
        size="small"
        max-height="420"
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="46" :selectable="isRowSelectable" />
        <el-table-column prop="warehouseCode" label="仓库" width="110" show-overflow-tooltip />
        <el-table-column prop="locationCode" label="库位" min-width="140" show-overflow-tooltip />
        <el-table-column prop="batchCode" label="批次号" width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.batchCode || '-' }}</template>
        </el-table-column>
        <el-table-column label="非限制数量" width="110" align="right">
          <template #default="{ row }">{{ formatQty(row.availableQuantity) }}</template>
        </el-table-column>
        <el-table-column label="质检数量" width="90" align="right">
          <template #default="{ row }">{{ formatQty(row.inspectionQty) }}</template>
        </el-table-column>
        <el-table-column label="冻结数量" width="90" align="right">
          <template #default="{ row }">{{ formatQty(row.blockedQty) }}</template>
        </el-table-column>
        <el-table-column label="本次领料数量" width="150" align="right" fixed="right">
          <template #default="{ row }">
            <el-input-number
              v-if="isRowSelected(row)"
              :model-value="row.pickQty"
              :min="0"
              :max="row.availableQuantity"
              :precision="3"
              :step="1"
              controls-position="right"
              size="small"
              class="pick-qty-input"
              :disabled="!isRowSelected(row)"
              @click.stop
              @change="(val: number | undefined) => onPickQtyChange(row, val)"
            />
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="特殊库存" width="90" align="center" fixed="right">
          <template #default="scope">
            <dict-tag :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
          </template>
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
  locationCode: string;
  batchCode: string;
  availableQuantity: number;
  inspectionQty: number;
  blockedQty: number;
  specialInventoryFlag: string;
  unit: string;
  pickQty: number;
}

interface Props {
  modelValue: boolean;
  materialCode: string;
  materialDesc?: string;
  issueQty: number;
  unit?: string;
}

const props = withDefaults(defineProps<Props>(), {
  materialDesc: '',
  unit: ''
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

const dialogTitle = computed(() => `库存选择 - ${props.materialCode}`);

const totalAvailable = computed(() => inventoryRows.value.reduce((s, r) => s + r.availableQuantity, 0));

const selectedRows = computed(() => inventoryRows.value.filter((r) => selectedRowKeys.value.has(r.rowKey) && r.pickQty > 0));

const selectedCount = computed(() => selectedRows.value.length);

const totalPicked = computed(() => selectedRows.value.reduce((s, r) => s + r.pickQty, 0));

const shortageQty = computed(() => Math.max(0, Number(props.issueQty ?? 0) - totalPicked.value));

const canConfirm = computed(() => selectedCount.value > 0 && totalPicked.value > 0);

const formatQty = (val?: number | string) => {
  const n = Number(val ?? 0);
  return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 3 }) : '0';
};

const isRowSelectable = (row: InventoryPickRow) => row.availableQuantity > 0;

const isRowSelected = (row: InventoryPickRow) => selectedRowKeys.value.has(row.rowKey);

const onSelectionChange = (rows: InventoryPickRow[]) => {
  if (applyingSelection.value) return;
  const newKeys = new Set(rows.map((r) => r.rowKey));
  // 取消勾选的行清空 pickQty
  for (const row of inventoryRows.value) {
    if (!newKeys.has(row.rowKey) && selectedRowKeys.value.has(row.rowKey)) {
      row.pickQty = 0;
    }
  }
  // 新勾选的行设置默认数量
  for (const row of rows) {
    if (!selectedRowKeys.value.has(row.rowKey) && row.pickQty <= 0) {
      row.pickQty = row.availableQuantity;
    }
  }
  selectedRowKeys.value = newKeys;
};

const onPickQtyChange = (row: InventoryPickRow, val: number | undefined) => {
  row.pickQty = Math.max(0, Math.min(row.availableQuantity, Number(val ?? 0)));
  if (row.pickQty <= 0 && selectedRowKeys.value.has(row.rowKey)) {
    applyingSelection.value = true;
    tableRef.value?.toggleRowSelection(row, false);
    applyingSelection.value = false;
    selectedRowKeys.value.delete(row.rowKey);
  }
};

const loadData = async () => {
  if (!props.materialCode) return;
  loading.value = true;
  try {
    const res = await listInventoryDetail({
      itemCode: props.materialCode,
      pageNum: 1,
      pageSize: 99999,
      params: {}
    });
    const list = (res as any).rows ?? res ?? [];
    inventoryRows.value = list.map((item: InventoryDetailVO, index: number) => ({
      rowKey: `inv_${item.id ?? index}`,
      id: item.id,
      warehouseCode: item.warehouseCode ?? '',
      locationCode: item.locationCode ?? '',
      batchCode: item.batchCode ?? '',
      availableQuantity: Number(item.availableQuantity ?? 0),
      inspectionQty: Number(item.inspectionQuantity ?? 0),
      blockedQty: Number(item.blockedQuantity ?? 0),
      specialInventoryFlag: item.specialInventoryFlag ?? '',
      unit: item.unit ?? props.unit ?? '',
      pickQty: 0
    }));
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
    ElMessage.warning('请至少选择一条库存明细并填写领料数量');
    return;
  }
  emit('confirm', { locations: picked });
  handleClose();
};

const handleClose = () => {
  visible.value = false;
  inventoryRows.value = [];
  selectedRowKeys.value = new Set();
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