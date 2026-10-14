<template>
  <el-table v-loading="loading" :data="rows" :row-key="rowKey" border stripe :max-height="560" empty-text="暂无数据" class="nc-report-table">
    <el-table-column type="index" label="序号" width="65" fixed="left" align="center" :index="(index: number) => (page - 1) * pageSize + index + 1" />
    <el-table-column v-for="(column, index) in columns" :key="column.prop" :prop="column.prop" :label="column.label" :min-width="column.width" :align="column.numeric ? 'right' : 'left'" :fixed="index === 0 ? 'left' : undefined" show-overflow-tooltip>
      <template #default="{ row }">
        <el-button v-if="column.link" link type="primary" @click="emit('drill', row)">{{ formatCell(row, column.prop) }}</el-button>
        <span v-else :class="{ 'nc-quantity': column.prop === 'ncQty' && Number(row.ncQty) > 0 }">{{ formatCell(row, column.prop) }}</span>
      </template>
    </el-table-column>
  </el-table>
</template>
<script setup lang="ts">
import type { NcReportDimension, NcReportRow } from '@/api/report/ncProductData/types';
import { formatCell, getColumns, orderDimensions } from '../columns';
const props = defineProps<{ dimension: NcReportDimension; rows: NcReportRow[]; loading: boolean; page: number; pageSize: number }>();
const emit = defineEmits<{ drill: [row: NcReportRow] }>();
const columns = computed(() => getColumns(props.dimension));
const rowKey = (row: NcReportRow) => (props.dimension === 'DETAIL' ? String(row.id) : orderDimensions.includes(props.dimension) ? row.shopOrderBo! : row.groupKey!);
</script>
<style scoped>
.nc-quantity {
  color: var(--el-color-danger);
  font-weight: 600;
}
</style>
