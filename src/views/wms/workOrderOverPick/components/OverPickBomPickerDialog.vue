<template>
  <el-dialog v-model="visible" :title="`从 BOM 选择物料 - ${workOrder?.workOrderNo || ''}`" width="1080px" destroy-on-close append-to-body>
    <el-alert type="info" :closable="false" show-icon class="picker-tip"> 勾选物料、填写超领数量并选择超领原因后，即可点击「加入超领清单」。 </el-alert>
    <div class="picker-toolbar">
      <el-input v-model="materialCodeKeyword" placeholder="物料编码" clearable size="small" class="material-filter" />
      <span class="selection-hint">已选 {{ selectedCurrentRows.length }} / 可加入 {{ readyCount }} / 显示 {{ displayRows.length }} 条</span>
    </div>
    <el-table ref="tableRef" v-loading="loading" :data="displayRows" border stripe size="small" max-height="420" :row-key="resolveRowKey" @selection-change="onSelectionChange">
      <el-table-column type="selection" width="48" :selectable="isRowSelectable" reserve-selection />
      <el-table-column type="index" label="序号" width="56" />
      <el-table-column prop="componentMaterial" label="物料编码" width="130" />
      <el-table-column prop="componentDesc" label="物料描述" min-width="150" show-overflow-tooltip />
      <el-table-column label="BOM需求" width="100" align="right">
        <template #default="{ row }">{{ formatQty(row.componentQty) }}</template>
      </el-table-column>
      <el-table-column label="已发料" width="90" align="right">
        <template #default="{ row }">{{ formatQty(row.issuedQty) }}</template>
      </el-table-column>
      <el-table-column label="待发" width="90" align="right">
        <template #default="{ row }">{{ formatQty(row.pendingQty) }}</template>
      </el-table-column>
      <el-table-column label="超领数量" min-width="150">
        <template #default="{ row }">
          <issue-qty-dual-input :row="row" :max-issue-qty="999999999" @change="(val: number) => onIssueQtyChange(row, val)" @unit-change="(altUnit: string) => onIssueUnitChange(row, altUnit)" />
        </template>
      </el-table-column>
      <el-table-column label="超领原因" min-width="180">
        <template #default="{ row }">
          <el-select :model-value="row.overPickCode" placeholder="请选择" filterable clearable size="small" class="reason-select" @update:model-value="(val: string | number) => onOverPickReasonChange(row, val)">
            <el-option v-for="dict in overPickReasonOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column prop="unit" label="单位" width="72" align="center" />
    </el-table>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :disabled="!canConfirm" @click="handleConfirm">加入超领清单</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, ref, toRefs, watch } from 'vue';
import { ElMessage, type TableInstance } from 'element-plus';
import IssueQtyDualInput from '@/views/wms/allocation/components/IssueQtyDualInput.vue';
import { applyIssueUnitSelection, getBomRowKey, getWorkOrderBom } from '@/api/wms/allocation/index';
import type { WorkOrderVO } from '@/api/wms/allocation/types';
import { applyOverPickReasonOption, isOverPickLineReady, mapApiBomToOverPickRow, validateOverPickLines, type OverPickLine } from '@/api/wms/workOrderOverPick/index';

const props = defineProps<{
  modelValue: boolean;
  workOrder: WorkOrderVO | null;
  existingLines?: OverPickLine[];
}>();

const emit = defineEmits<{
  'update:modelValue': [boolean];
  confirm: [OverPickLine[]];
}>();

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_material_over_pick } = toRefs<any>(proxy?.useDict('wms_material_over_pick'));

const visible = ref(false);
const loading = ref(false);
const bomRows = ref<OverPickLine[]>([]);
const materialCodeKeyword = ref('');
const tableRef = ref<TableInstance>();
const selectedRowKeys = ref<string[]>([]);
const syncingSelection = ref(false);

const overPickReasonOptions = computed(() => (wms_material_over_pick.value || []) as DictDataOption[]);

const displayRows = computed(() => {
  const keyword = String(materialCodeKeyword.value || '')
    .trim()
    .toUpperCase();
  if (!keyword) return bomRows.value;
  return bomRows.value.filter((row) =>
    String(row.componentMaterial || '')
      .toUpperCase()
      .includes(keyword)
  );
});

const selectedCurrentRows = computed(() => {
  const keySet = new Set(selectedRowKeys.value);
  return bomRows.value.filter((row, index) => keySet.has(getBomRowKey(row, index)));
});

const readyCount = computed(() => selectedCurrentRows.value.filter((row) => isOverPickLineReady(row)).length);
const canConfirm = computed(() => selectedCurrentRows.value.length > 0 && selectedCurrentRows.value.every((row) => isOverPickLineReady(row)));

const formatQty = (qty?: number) => {
  const n = Number(qty ?? 0);
  return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0';
};

const resolveRowKey = (row: OverPickLine) => {
  const index = bomRows.value.indexOf(row);
  return getBomRowKey(row, index >= 0 ? index : undefined);
};

const isRowSelectable = (row: OverPickLine) => Number(row.issueQty ?? 0) > 0 && row.overPickCode;

const findRowIndex = (row: OverPickLine) => {
  const byRef = bomRows.value.indexOf(row);
  if (byRef >= 0) return byRef;
  const targetKey = getBomRowKey(row);
  return bomRows.value.findIndex((item, index) => getBomRowKey(item, index) === targetKey);
};

const patchRow = (index: number, patch: Partial<OverPickLine>) => {
  const next = [...bomRows.value];
  next[index] = { ...next[index], ...patch };
  bomRows.value = next;
  return next[index];
};

const syncRowSelection = async (row: OverPickLine) => {
  await nextTick();
  const table = tableRef.value;
  if (!table || syncingSelection.value) return;
  const index = findRowIndex(row);
  if (index < 0) return;
  const current = bomRows.value[index];
  const key = getBomRowKey(current, index);
  const shouldSelect = Number(current.issueQty ?? 0) > 0;
  table.toggleRowSelection(current, shouldSelect);
  if (shouldSelect) {
    if (!selectedRowKeys.value.includes(key)) {
      selectedRowKeys.value = [...selectedRowKeys.value, key];
    }
  } else {
    selectedRowKeys.value = selectedRowKeys.value.filter((item) => item !== key);
  }
};

const onSelectionChange = (rows: OverPickLine[]) => {
  if (syncingSelection.value) return;
  const invalid = rows.filter((row) => !isRowSelectable(row));
  if (invalid.length) {
    nextTick(() => {
      invalid.forEach((row) => tableRef.value?.toggleRowSelection(row, false));
    });
  }
  const valid = rows.filter(isRowSelectable);
  selectedRowKeys.value = valid.map((row) => resolveRowKey(row));
};

const onIssueQtyChange = (row: OverPickLine, val: number) => {
  const index = findRowIndex(row);
  if (index < 0) return;
  patchRow(index, { issueQty: Math.max(0, Number(val) || 0) });
  syncRowSelection(bomRows.value[index]);
};

const onIssueUnitChange = (row: OverPickLine, altUnit: string) => {
  const index = findRowIndex(row);
  if (index < 0) return;
  patchRow(index, applyIssueUnitSelection(bomRows.value[index], altUnit));
};

const onOverPickReasonChange = (row: OverPickLine, code: string | number) => {
  const index = findRowIndex(row);
  if (index < 0) return;
  patchRow(index, applyOverPickReasonOption(bomRows.value[index], code, overPickReasonOptions.value));
};

const restoreSavedQty = (rows: OverPickLine[]) => {
  if (!props.existingLines?.length) return rows;
  const savedMap = new Map<string, OverPickLine>();
  props.existingLines.forEach((line, index) => {
    savedMap.set(getBomRowKey(line, index), line);
  });
  return rows.map((row, index) => {
    const saved = savedMap.get(getBomRowKey(row, index));
    if (!saved) return row;
    return {
      ...row,
      issueQty: saved.issueQty,
      unit: saved.unit ?? row.unit,
      conversionRatio: saved.conversionRatio,
      overPickCode: saved.overPickCode,
      overPickReason: saved.overPickReason,
      manualLocationSelections: saved.manualLocationSelections,
      fifoRecommendedLocations: saved.fifoRecommendedLocations
    };
  });
};

const resyncTableSelection = async () => {
  await nextTick();
  const table = tableRef.value;
  if (!table) return;
  syncingSelection.value = true;
  try {
    table.clearSelection();
    const keys: string[] = [];
    bomRows.value.forEach((row, index) => {
      if (Number(row.issueQty ?? 0) <= 0) return;
      table.toggleRowSelection(row, true);
      keys.push(getBomRowKey(row, index));
    });
    selectedRowKeys.value = keys;
  } finally {
    await nextTick();
    syncingSelection.value = false;
  }
};

const loadBom = async () => {
  if (!props.workOrder?.workOrderNo) return;
  loading.value = true;
  selectedRowKeys.value = [];
  try {
    const response = await getWorkOrderBom(props.workOrder.workOrderNo);
    if (response.code !== 200) {
      ElMessage.error(response.msg || '加载 BOM 失败');
      return;
    }
    const rows = (response.data || []).map((bom) => mapApiBomToOverPickRow(bom, props.workOrder!));
    bomRows.value = restoreSavedQty(rows);
    await resyncTableSelection();
  } catch (error) {
    ElMessage.error((error as Error)?.message || '加载 BOM 失败');
  } finally {
    loading.value = false;
  }
};

const handleConfirm = () => {
  const lines = selectedCurrentRows.value;
  if (!lines.length) {
    ElMessage.warning('请勾选物料并填写超领数量、选择超领原因');
    return;
  }
  const validationError = validateOverPickLines(lines);
  if (validationError) {
    ElMessage.warning(validationError);
    return;
  }
  emit(
    'confirm',
    lines.map((row) => ({ ...row }))
  );
  visible.value = false;
};

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val) {
      materialCodeKeyword.value = '';
      loadBom();
    }
  }
);

watch(visible, (val) => emit('update:modelValue', val));
</script>

<style scoped>
.picker-tip {
  margin-bottom: 12px;
}
.picker-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.material-filter {
  width: 200px;
}
.selection-hint {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.reason-select {
  width: 100%;
}
</style>
