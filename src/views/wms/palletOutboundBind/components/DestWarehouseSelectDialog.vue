<template>
  <div class="dest-warehouse-select" :style="{ width: fieldWidth }">
    <el-input :model-value="displayText" readonly :placeholder="placeholder" @click="openPicker">
      <template #append>
        <el-button icon="Search" aria-label="选择目的仓" @click="openPicker" />
      </template>
    </el-input>
    <el-button v-if="clearable && warehouseCode" link type="primary" class="dest-warehouse-clear" @click="clearSelection">清除</el-button>

    <el-dialog v-model="pickerVisible" :title="dialogTitle" width="560px" append-to-body destroy-on-close @open="onPickerOpen">
      <div class="picker-search-bar" @submit.prevent>
        <span class="picker-search-label">目的仓</span>
        <el-input v-model="keyword" clearable placeholder="名称关键字" class="picker-search-input" @keyup.enter="filterList" />
        <el-button type="primary" icon="Search" @click="filterList">搜索</el-button>
        <el-button icon="Refresh" @click="resetKeyword">重置</el-button>
      </div>
      <el-table ref="tableRef" :data="filteredOptions" border stripe highlight-current-row max-height="360" empty-text="无匹配目的仓" class="picker-table" @row-click="selectRow" @row-dblclick="confirmPick">
        <el-table-column width="52" align="center">
          <template #default="{ row }">
            <el-radio v-model="selectedCode" :value="row.dictValue" @click.stop="selectRow(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="dictLabel" label="目的仓" min-width="280" show-overflow-tooltip />
      </el-table>
      <template #footer>
        <el-button @click="pickerVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!pendingRow" @click="confirmPick">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import type { DictDataVO } from '@/api/system/dict/data/types';
import type { ElTable } from 'element-plus';

const props = withDefaults(
  defineProps<{
    warehouseOptions: DictDataVO[];
    warehouseCode?: string;
    warehouseName?: string;
    placeholder?: string;
    clearable?: boolean;
    dialogTitle?: string;
    fieldWidth?: string;
  }>(),
  {
    warehouseCode: '',
    warehouseName: '',
    placeholder: '请选择目的仓',
    clearable: false,
    dialogTitle: '选择目的仓',
    fieldWidth: '60%'
  }
);

const emit = defineEmits<{
  'update:warehouseCode': [value: string];
  'update:warehouseName': [value: string];
}>();

const pickerVisible = ref(false);
const keyword = ref('');
const filterKeyword = ref('');
const pendingRow = ref<DictDataVO>();
const selectedCode = ref('');
const tableRef = ref<InstanceType<typeof ElTable>>();

const displayText = computed(() => props.warehouseName || '');

const filteredOptions = computed(() => {
  const key = filterKeyword.value.trim().toLowerCase();
  if (!key) return props.warehouseOptions;
  return props.warehouseOptions.filter((item) => item.dictLabel?.toLowerCase().includes(key));
});

const openPicker = () => {
  pickerVisible.value = true;
};

const onPickerOpen = async () => {
  keyword.value = '';
  filterKeyword.value = '';
  pendingRow.value = props.warehouseOptions.find((item) => item.dictValue === props.warehouseCode);
  selectedCode.value = pendingRow.value?.dictValue || '';
  await nextTick();
  if (pendingRow.value && tableRef.value) {
    tableRef.value.setCurrentRow(pendingRow.value);
  }
};

const filterList = () => {
  filterKeyword.value = keyword.value;
};

const resetKeyword = () => {
  keyword.value = '';
  filterKeyword.value = '';
};

const selectRow = (row: DictDataVO) => {
  pendingRow.value = row;
  selectedCode.value = row.dictValue;
  tableRef.value?.setCurrentRow(row);
};

const confirmPick = () => {
  if (!pendingRow.value) return;
  emit('update:warehouseCode', pendingRow.value.dictValue);
  emit('update:warehouseName', pendingRow.value.dictLabel);
  pickerVisible.value = false;
};

const clearSelection = () => {
  emit('update:warehouseCode', '');
  emit('update:warehouseName', '');
};

watch(
  () => props.warehouseCode,
  () => {
    if (!props.warehouseCode) {
      pendingRow.value = undefined;
      selectedCode.value = '';
    }
  }
);
</script>

<style scoped>
.dest-warehouse-select {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
}

.dest-warehouse-select :deep(.el-input) {
  cursor: pointer;
}

.dest-warehouse-clear {
  flex-shrink: 0;
}

.picker-search-bar {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.picker-search-label {
  flex-shrink: 0;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.picker-search-input {
  flex: 1;
  min-width: 120px;
}

.picker-table :deep(.el-table__row) {
  cursor: pointer;
}
</style>
