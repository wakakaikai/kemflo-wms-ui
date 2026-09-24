<template>
  <el-table
    ref="tableRef"
    :data="treeData"
    row-key="rowKey"
    border
    :height="height"
    :max-height="maxHeight"
    v-loading="loading"
    :default-expand-all="defaultExpandAll"
    :tree-props="{ children: 'children' }"
    :row-class-name="resolveRowClassName"
    @selection-change="handleSelectionChange"
  >
    <el-table-column v-if="selectable" type="selection" width="55" align="center" :selectable="isRowSelectable" />
    <template v-if="mode === 'history'">
      <PurchaseOrderDetailHistoryColumns :columns="columns" :received-quantity-label="receivedQuantityLabel" :show-move-type="showMoveType" :wms_purchase_category="wms_purchase_category">
        <template #after-category>
          <slot name="after-category" />
        </template>
      </PurchaseOrderDetailHistoryColumns>
    </template>
    <slot v-else name="columns" />
    <slot name="trailing" />
  </el-table>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { PurchaseOrderDetailVO } from '@/api/wms/purchaseOrderDetail/types';
import PurchaseOrderDetailHistoryColumns from './PurchaseOrderDetailHistoryColumns.vue';
import { buildPurchaseOrderDetailHistoryTree, buildPurchaseOrderDetailOperationTree, isPoDetailParentRow, PoDetailTreeRow } from '../utils/purchaseOrderDetailTree';

const props = withDefaults(
  defineProps<{
    rows: PurchaseOrderDetailVO[] | any[];
    mode?: 'history' | 'operation';
    columns?: Array<{ visible: boolean }>;
    receivedQuantityLabel?: string;
    showMoveType?: boolean;
    selectable?: boolean;
    loading?: boolean;
    height?: number | string;
    maxHeight?: number | string;
    wms_purchase_category?: any[];
    /** 树形子行默认是否全部展开；采购订单查询区建议 false */
    defaultExpandAll?: boolean;
  }>(),
  {
    mode: 'history',
    columns: () => [],
    receivedQuantityLabel: '已收数量',
    showMoveType: true,
    selectable: true,
    loading: false,
    wms_purchase_category: () => [],
    defaultExpandAll: false
  }
);

const emit = defineEmits<{
  selectionChange: [rows: PoDetailTreeRow[]];
}>();

const tableRef = ref();
const treeData = computed(() => (props.mode === 'operation' ? buildPurchaseOrderDetailOperationTree(props.rows) : buildPurchaseOrderDetailHistoryTree(props.rows as PurchaseOrderDetailVO[])));

const isRowSelectable = (row: PoDetailTreeRow) => isPoDetailParentRow(row);

const resolveRowClassName = ({ row }: { row: PoDetailTreeRow }) => (row.children?.length ? 'po-detail-tree-parent-row' : '');

const handleSelectionChange = (selection: PoDetailTreeRow[]) => {
  emit('selectionChange', selection.filter(isPoDetailParentRow));
};

const clearSelection = () => {
  tableRef.value?.clearSelection?.();
};

const toggleRowExpansion = (row: PoDetailTreeRow, expanded?: boolean) => {
  tableRef.value?.toggleRowExpansion?.(row, expanded);
};

defineExpose({ clearSelection, toggleRowExpansion, tableRef });
</script>

<style scoped>
:deep(.po-detail-tree-parent-row) {
  font-weight: 500;
}
</style>
