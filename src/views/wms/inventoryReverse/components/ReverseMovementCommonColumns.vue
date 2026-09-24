<template>
  <el-table-column v-if="columns[0]?.visible" label="物料名称" prop="itemName" v-bind="col.itemName" />
  <el-table-column v-if="columns[1]?.visible" :label="sourceDocLabel" prop="sourceDocCode" v-bind="col.sourceDocCode" />
  <el-table-column v-if="columns[2]?.visible" label="项目" prop="sourceDocItem" v-bind="col.sourceDocItem" />
  <el-table-column v-if="columns[3]?.visible" label="移动类型" prop="moveType" v-bind="col.moveType" />
  <el-table-column v-if="columns[4]?.visible" label="物料" prop="itemCode" v-bind="col.itemCode" />
  <el-table-column v-if="columns[5]?.visible" label="物料凭证号" prop="sapMaterialOrderNo" v-bind="col.sapMaterialOrderNo" />
  <el-table-column v-if="columns[6]?.visible" label="凭证项次" v-bind="col.sapMaterialItem">
    <template #default="{ row }">
      {{ formatSapMaterialItem(row) }}
    </template>
  </el-table-column>
  <el-table-column v-if="columns[7]?.visible" label="数量" v-bind="col.quantity">
    <template #default="{ row }">
      {{ formatQty(resolveLineQuantity(row)) }}
    </template>
  </el-table-column>
  <el-table-column v-if="columns[8]?.visible" label="单位" prop="unit" v-bind="col.unit">
    <template #default="{ row }">
      {{ resolveLineUnit(row) || '-' }}
    </template>
  </el-table-column>
  <el-table-column v-if="columns[9]?.visible" label="库位" prop="locationCode" v-bind="col.locationCode" />
  <el-table-column v-if="columns[10]?.visible" label="批次" prop="batchCode" v-bind="col.batchCode" />
  <el-table-column v-if="columns[11]?.visible" label="进出" v-bind="col.direction">
    <template #default="{ row }">
      <el-tag v-if="row.inventoryDirection === -1" size="small" type="danger">出库</el-tag>
      <el-tag v-else-if="row.inventoryDirection === 1" size="small" type="success">入库</el-tag>
      <el-tag v-else-if="row.hasPair" size="small" type="warning">出+入</el-tag>
      <span v-else>-</span>
    </template>
  </el-table-column>
  <el-table-column v-if="showReversal && columns[12]?.visible" label="冲销标识" v-bind="col.reversal">
    <template #default="{ row }">
      <el-tag :type="getInventoryMovementReversalTagType(row.reversalFlag)" size="small">
        {{ formatInventoryMovementReversalFlag(row.reversalFlag) }}
      </el-tag>
    </template>
  </el-table-column>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatInventoryMovementReversalFlag, getInventoryMovementReversalTagType } from '@/api/wms/workOrderReturn';
import { formatQty } from '@/utils/ruoyi';
import { formatSapMaterialItem, resolveLineQuantity, resolveLineUnit } from '../utils/reverseMovement';
import { REVERSE_DATA_COLUMN } from '../utils/reverseTableLayout';

const props = defineProps<{
  columns: Array<{ visible: boolean }>;
  layout: 'purchase' | 'inventory';
  showReversal?: boolean;
}>();

const col = REVERSE_DATA_COLUMN;
const showReversal = computed(() => props.showReversal !== false);
const sourceDocLabel = computed(() => (props.layout === 'purchase' ? '采购订单' : '来源单号'));
</script>
