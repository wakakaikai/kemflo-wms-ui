<template>
  <div class="trace-table-wrap">
    <el-table
      :data="data"
      :border="bordered"
      size="small"
      stripe
      :header-cell-style="headerStyle"
      class="trace-table"
    >
      <el-table-column type="index" :label="MSG.index" width="55" align="center" />
      <el-table-column
        v-for="(col, colIndex) in columns"
        :key="col.prop"
        :label="col.label"
        :prop="col.prop"
        :width="colIndex < columns.length - 1 ? col.width : undefined"
        :min-width="colIndex === columns.length - 1 ? col.minWidth || col.width || 100 : col.minWidth"
        align="center"
        show-overflow-tooltip
      >
        <template v-if="col.slot" #default="scope">
          <slot :name="col.slot" :row="scope.row" />
        </template>
        <template v-else-if="col.prop === 'itemRevision'" #default="scope">
          {{ formatItemRevision(scope.row) }}
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { MSG } from '../messages';

interface ColumnDef {
  label: string;
  prop: string;
  width?: number;
  minWidth?: number;
  slot?: string;
}

withDefaults(
  defineProps<{
    columns: ColumnDef[];
    data: Record<string, any>[];
    bordered?: boolean;
  }>(),
  { bordered: true }
);

const headerStyle = {
  background: '#fafafa',
  color: '#606266',
  fontWeight: '600'
};

const formatItemRevision = (row: Record<string, any>) => {
  const item = row.item ?? '';
  const revision = row.itemRevision ?? '';
  return `${item}/${revision}`;
};
</script>

<style scoped lang="scss">
.trace-table-wrap {
  width: 100%;
  overflow-x: auto;
}

.trace-table {
  width: 100%;

  :deep(.el-table__inner-wrapper) {
    width: 100% !important;
  }

  :deep(.el-table__header table),
  :deep(.el-table__body table) {
    width: 100% !important;
    table-layout: fixed;
  }

  :deep(.el-table__header),
  :deep(.el-table__body) {
    width: 100% !important;
  }

  :deep(.el-table__empty-block) {
    width: 100% !important;
  }

  :deep(.el-table__body-wrapper),
  :deep(.el-table__header-wrapper) {
    overflow: hidden;
  }
}
</style>
