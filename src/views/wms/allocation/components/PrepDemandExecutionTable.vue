<template>
  <div class="execution-material-table">
    <div class="category-filter">
      <span class="filter-label">分类筛选</span>
      <el-checkbox-group v-model="selectedCategories" class="category-checkboxes">
        <el-checkbox v-for="option in categoryOptions" :key="option.value" :value="option.value">{{ option.label }}（{{ categoryCounts[option.value] }}）</el-checkbox>
      </el-checkbox-group>
      <span class="filter-summary">显示 {{ filteredRows.length }} / {{ rows.length }} 条</span>
    </div>

    <el-table v-if="filteredRows.length" :data="filteredRows" border stripe size="small" height="100%" class="material-table-body" row-key="rowKey">
      <el-table-column label="分类" width="122" align="center" fixed="left">
        <template #default="{ row }">
          <el-tag :type="categoryMeta(row).tagType" size="small">{{ categoryMeta(row).label }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="workOrderNo" label="工单号" min-width="128" fixed="left" show-overflow-tooltip />
      <el-table-column prop="materialCode" label="物料编码" min-width="130" fixed="left" show-overflow-tooltip />
      <el-table-column prop="materialName" label="物料描述" min-width="190" show-overflow-tooltip />
      <el-table-column label="库存类型" width="100" align="center">
        <template #default="{ row }">
          <dict-tag :options="wms_inventory_special_flag" :value="resolvePrepRowInventoryFlag(row)" />
        </template>
      </el-table-column>
      <el-table-column label="本次备料数量" min-width="126" align="right">
        <template #default="{ row }">{{ formatPrepQtyWithUnit(row) }}</template>
      </el-table-column>
      <el-table-column label="仓别" width="100">
        <template #default="{ row }">{{ displayValue(row.warehouseCode) }}</template>
      </el-table-column>
      <el-table-column label="库位" min-width="120" show-overflow-tooltip>
        <template #default="{ row }">{{ displayValue(row.locationCode) }}</template>
      </el-table-column>
      <el-table-column label="批次" min-width="120" show-overflow-tooltip>
        <template #default="{ row }">{{ displayValue(row.batchCode) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="96" align="center">
        <template #default="{ row }">
          <el-tag :type="lineStatusTag(row.lineStatus)" size="small">{{ lineStatusLabel(row.lineStatus) }}</el-tag>
        </template>
      </el-table-column>
      <prep-demand-location-source-column show-remark :rows="filteredRows" />
    </el-table>
    <el-empty v-else description="当前筛选分类暂无数据" :image-size="72" />
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, ref, toRefs } from 'vue';
import type { TagProps } from 'element-plus';
import { lineStatusLabel, lineStatusTag } from '@/api/wms/issueTask';
import { formatPrepQtyWithUnit, resolvePrepRowInventoryFlag, type PrepDemandDisplayRow } from '@/api/wms/workOrderPrepDemand';
import PrepDemandLocationSourceColumn from './PrepDemandLocationSourceColumn.vue';

type ExecutionCategory = PrepDemandDisplayRow['warehouseRoute'];

const props = defineProps<{
  rows: PrepDemandDisplayRow[];
}>();

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_inventory_special_flag } = toRefs<any>(proxy?.useDict('wms_inventory_special_flag'));

const categoryOptions: Array<{ value: ExecutionCategory; label: string; tagType: TagProps['type'] }> = [
  { value: 'AUTO', label: '自动仓', tagType: 'success' },
  { value: 'LINE', label: '线边仓', tagType: 'warning' },
  { value: 'FLAT', label: '平面仓', tagType: 'primary' },
  { value: 'SHORTAGE', label: '缺料', tagType: 'danger' }
];

const selectedCategories = ref<ExecutionCategory[]>(categoryOptions.map((option) => option.value));

const categoryCounts = computed<Record<ExecutionCategory, number>>(() => {
  const counts: Record<ExecutionCategory, number> = { AUTO: 0, LINE: 0, FLAT: 0, SHORTAGE: 0 };
  props.rows.forEach((row) => counts[row.warehouseRoute]++);
  return counts;
});

const filteredRows = computed(() => {
  const selected = new Set(selectedCategories.value);
  return props.rows.filter((row) => selected.has(row.warehouseRoute));
});

const categoryMeta = (row: PrepDemandDisplayRow) => categoryOptions.find((option) => option.value === row.warehouseRoute) ?? categoryOptions[2];
const displayValue = (value?: string) => {
  const text = String(value || '').trim();
  return text && text !== '-' ? text : '-';
};
</script>

<style scoped>
.execution-material-table {
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
