<template>
  <el-table ref="tableRef" :data="treeData" row-key="rowKey" border :height="height" :max-height="maxHeight" v-loading="loading" :default-expand-all="defaultExpandAll" :tree-props="{ children: 'children' }" :row-class-name="resolveRowClassName" @selection-change="handleSelectionChange">
    <el-table-column v-if="mode === 'history'" type="selection" :width="REVERSE_TABLE_LEADING.historySelect" align="center" :selectable="isRowSelectable" />
    <el-table-column v-if="mode === 'reverse'" type="index" :width="REVERSE_TABLE_LEADING.reverseIndex" align="center" />
    <ReverseMovementCommonColumns :layout="layout" :columns="columns" :show-reversal="showReversal" />
    <slot name="trailing" />
  </el-table>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { isInventoryMovementReversed } from '@/api/wms/workOrderReturn';
import { REVERSE_TABLE_LEADING } from '../utils/reverseTableLayout';
import { buildReverseTreeTableData, isTreeParentRow, MovementExpandRow, ReverseTreeRow } from '../utils/reverseMovement';
import ReverseMovementCommonColumns from './ReverseMovementCommonColumns.vue';

const props = withDefaults(
  defineProps<{
    groups: MovementExpandRow[];
    layout: 'purchase' | 'inventory';
    columns: Array<{ visible: boolean }>;
    mode?: 'history' | 'reverse';
    loading?: boolean;
    height?: number | string;
    maxHeight?: number | string;
    showReversal?: boolean;
    /** 树形子行默认是否全部展开 */
    defaultExpandAll?: boolean;
  }>(),
  {
    mode: 'history',
    loading: false,
    showReversal: true,
    defaultExpandAll: true
  }
);

const emit = defineEmits<{
  selectionChange: [rows: ReverseTreeRow[]];
}>();

const tableRef = ref();
const treeData = computed(() => buildReverseTreeTableData(props.groups));

const isRowSelectable = (row: ReverseTreeRow) => isTreeParentRow(row) && !isInventoryMovementReversed(row);

const resolveRowClassName = ({ row }: { row: ReverseTreeRow }) => (row.children?.length ? 'reverse-tree-parent-row' : '');

const handleSelectionChange = (selection: ReverseTreeRow[]) => {
  emit('selectionChange', selection.filter(isTreeParentRow));
};

const clearSelection = () => {
  tableRef.value?.clearSelection?.();
};

const toggleRowExpansion = (row: ReverseTreeRow, expanded?: boolean) => {
  tableRef.value?.toggleRowExpansion?.(row, expanded);
};

defineExpose({ clearSelection, toggleRowExpansion, tableRef });
</script>

<style scoped>
:deep(.reverse-tree-parent-row) {
  font-weight: 500;
}
</style>
