<template>
  <div class="classified-material-table">
    <div class="category-filter">
      <span class="filter-label">分类筛选</span>
      <el-checkbox-group v-model="selectedCategories" class="category-checkboxes">
        <el-checkbox v-for="option in categoryOptions" :key="option.value" :value="option.value"> {{ option.label }}（{{ categoryCounts[option.value] }}） </el-checkbox>
      </el-checkbox-group>
      <span class="filter-summary">显示 {{ filteredRows.length }} / {{ rows.length }} 条</span>
    </div>

    <el-table v-if="filteredRows.length" :data="filteredRows" border stripe size="small" height="100%" class="material-table-body" :row-key="rowKey">
      <el-table-column label="分类" width="122" align="center" fixed="left">
        <template #default="{ row }">
          <el-tag :type="categoryMeta(row).tagType" size="small">{{ categoryMeta(row).label }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="workOrderNo" label="工单号" min-width="128" fixed="left" show-overflow-tooltip />
      <el-table-column prop="materialCode" label="物料编码" min-width="130" fixed="left" show-overflow-tooltip />
      <el-table-column prop="materialDesc" label="物料描述" min-width="190" show-overflow-tooltip />
      <el-table-column label="库存类型" width="100" align="center">
        <template #default="{ row }">
          <dict-tag :options="wms_inventory_special_flag" :value="resolveDemandRowInventoryFlag(row)" />
        </template>
      </el-table-column>
      <el-table-column prop="prepQtyText" label="本次备料数量" min-width="126" align="right" />
      <el-table-column label="推荐仓别" width="100">
        <template #default="{ row }">{{ row.recommendedWarehouse || '-' }}</template>
      </el-table-column>
      <el-table-column label="推荐库位" min-width="120" show-overflow-tooltip>
        <template #default="{ row }">{{ row.recommendedLocation || '-' }}</template>
      </el-table-column>
      <prep-demand-location-source-column show-remark :rows="filteredRows" />
      <el-table-column v-if="!readOnly" label="操作" width="72" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="emit('adjust', row)">调整</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-else description="当前筛选分类暂无数据" :image-size="72" />
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, ref, toRefs } from 'vue';
import type { TagProps } from 'element-plus';
import type { MaterialDemandDetailRow } from '@/api/wms/allocation/types';
import { isClassifiedShortageRow, resolveDemandRowInventoryFlag } from '@/api/wms/allocation';
import PrepDemandLocationSourceColumn from './PrepDemandLocationSourceColumn.vue';

type ClassifiedCategory = 'AUTO' | 'LINE' | 'FLAT' | 'SHORTAGE';
type ClassifiedMaterialDisplayRow = MaterialDemandDetailRow & {
  materialDesc: string;
  prepQtyText: string;
};

const props = withDefaults(
  defineProps<{
    rows: ClassifiedMaterialDisplayRow[];
    readOnly?: boolean;
  }>(),
  { readOnly: false }
);

const emit = defineEmits<{
  adjust: [row: ClassifiedMaterialDisplayRow];
}>();

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_inventory_special_flag } = toRefs<any>(proxy?.useDict('wms_inventory_special_flag'));

const categoryOptions: Array<{ value: ClassifiedCategory; label: string; tagType: TagProps['type'] }> = [
  { value: 'AUTO', label: '自动仓', tagType: 'success' },
  { value: 'LINE', label: '线边仓', tagType: 'warning' },
  { value: 'FLAT', label: '平面仓', tagType: 'primary' },
  { value: 'SHORTAGE', label: '缺料', tagType: 'danger' }
];

const selectedCategories = ref<ClassifiedCategory[]>(categoryOptions.map((option) => option.value));

const resolveCategory = (row: MaterialDemandDetailRow): ClassifiedCategory => {
  if (isClassifiedShortageRow(row)) return 'SHORTAGE';
  return (row.warehouseRoute === 'AUTO' || row.warehouseRoute === 'LINE' || row.warehouseRoute === 'FLAT' ? row.warehouseRoute : 'FLAT') as ClassifiedCategory;
};

const categoryCounts = computed<Record<ClassifiedCategory, number>>(() => {
  const counts: Record<ClassifiedCategory, number> = { AUTO: 0, LINE: 0, FLAT: 0, SHORTAGE: 0 };
  props.rows.forEach((row) => counts[resolveCategory(row)]++);
  return counts;
});

const filteredRows = computed(() => {
  const selected = new Set(selectedCategories.value);
  return props.rows.filter((row) => selected.has(resolveCategory(row)));
});

const categoryMeta = (row: MaterialDemandDetailRow) => {
  const category = resolveCategory(row);
  return categoryOptions.find((option) => option.value === category) ?? categoryOptions[2];
};

const rowKey = (row: ClassifiedMaterialDisplayRow) => [row.workOrderNo, row.bomLineId, row.materialCode, row.lineType, row.recommendedWarehouse, row.recommendedLocation, row.batchCode].join('|');
</script>

<style scoped>
.classified-material-table {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.material-table-body {
  flex: 1;
  min-height: 0;
}

.category-filter {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
}

.filter-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.category-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 18px;
}

.filter-summary {
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
