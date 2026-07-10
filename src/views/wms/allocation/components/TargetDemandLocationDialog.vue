<template>
  <el-dialog v-model="visible" :title="title" width="640px" destroy-on-close append-to-body @close="handleClose">
    <el-alert type="info" :closable="false" show-icon class="summary-tip">
      平面仓备料需指定目标需求库位，请从需求人负责的库位中选择。
    </el-alert>
    <div v-loading="loading" class="location-list">
      <el-table
        ref="tableRef"
        :data="locationList"
        border
        size="small"
        max-height="360"
        highlight-current-row
        @current-change="handleCurrentChange"
      >
        <el-table-column label="" width="48" align="center">
          <template #default="{ row }">
            <el-radio v-model="selectedId" :value="rowKey(row)">&nbsp;</el-radio>
          </template>
        </el-table-column>
        <el-table-column prop="warehouseCode" label="仓别代码" min-width="120" />
        <el-table-column label="描述" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">{{ row.warehouseDesc || row.warehouseName || '-' }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !locationList.length" description="当前需求人暂无负责库位" :image-size="72" />
    </div>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" :disabled="!selectedRow" @click="handleConfirm">确认生成</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { listLineWarehouseUser } from '@/api/wms/lineWarehouseUser/index';
import type { LineWarehouseUserVO } from '@/api/wms/lineWarehouseUser/types';

export interface TargetDemandLocationSelection {
  locationCode: string;
  warehouseCode?: string;
  targetDemandLocationName?: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    userName?: string;
    submitting?: boolean;
  }>(),
  {
    userName: '',
    submitting: false
  }
);

const emit = defineEmits<{
  'update:modelValue': [boolean];
  confirm: [TargetDemandLocationSelection];
}>();

const title = '选择目标需求库位';
const visible = ref(false);
const loading = ref(false);
const locationList = ref<LineWarehouseUserVO[]>([]);
const selectedId = ref('');
const selectedRow = ref<LineWarehouseUserVO | null>(null);

const rowKey = (row: LineWarehouseUserVO) =>
  String(row.id ?? row.warehouseCode ?? '');

const resetSelection = () => {
  selectedId.value = '';
  selectedRow.value = null;
};

const loadLocations = async () => {
  const userName = String(props.userName || '').trim();
  if (!userName) {
    locationList.value = [];
    return;
  }
  loading.value = true;
  try {
    const res = await listLineWarehouseUser({ userName, pageNum: 1, pageSize: 500 });
    locationList.value = (res.rows || res.data || []) as LineWarehouseUserVO[];
  } catch {
    locationList.value = [];
    ElMessage.error('加载负责库位失败');
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val) {
      resetSelection();
      loadLocations();
    }
  },
  { immediate: true }
);

watch(visible, (val) => emit('update:modelValue', val));

const handleCurrentChange = (row: LineWarehouseUserVO | undefined) => {
  if (!row) return;
  selectedRow.value = row;
  selectedId.value = rowKey(row);
};

const handleClose = () => {
  visible.value = false;
};

const handleConfirm = () => {
  const row = selectedRow.value;
  const warehouseCode = String(row?.warehouseCode || '').trim();
  if (!warehouseCode) {
    ElMessage.warning('请选择目标仓别');
    return;
  }
  const locationCode = String(row?.locationCode || '').trim() || warehouseCode;
  emit('confirm', {
    locationCode,
    warehouseCode,
    targetDemandLocationName: String(row?.warehouseDesc || row?.warehouseName || '').trim() || undefined
  });
};
</script>
<style scoped>
.summary-tip {
  margin-bottom: 12px;
}
.location-list {
  min-height: 120px;
}
</style>
