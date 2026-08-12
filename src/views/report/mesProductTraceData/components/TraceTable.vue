<template>
  <div class="trace-table-wrap">
    <el-table :data="data" :border="bordered" size="small" stripe :header-cell-style="headerStyle" class="trace-table">
      <el-table-column type="index" label="序号" width="55" align="center" />
      <el-table-column v-for="col in columns" :key="col.prop" :label="col.label" :prop="col.prop" align="center">
        <template v-if="col.slot" #default="scope">
          <slot :name="col.slot" :row="scope.row" />
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
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
</script>

<style scoped lang="scss">
.trace-table-wrap {
  width: 100%;
  overflow-x: auto;
}

.trace-table {
  width: 100%;

  :deep(.el-table__cell) {
    white-space: normal;
    word-break: break-all;
  }

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
