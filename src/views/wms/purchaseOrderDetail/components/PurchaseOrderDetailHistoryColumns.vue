<template>
  <el-table-column v-if="showMoveType" label="移动类型" prop="moveType" width="88" align="center" fixed="left" />
  <el-table-column v-if="columns[0]?.visible" label="采购单" align="left" prop="poNumber" fixed="left" min-width="120" />
  <el-table-column v-if="columns[1]?.visible" label="项次" align="left" prop="itemNumber" fixed="left" min-width="65">
    <template #default="scope">
      <span>{{ scope.row.itemNumber ?? '' }}</span>
    </template>
  </el-table-column>
  <el-table-column v-if="columns[17]?.visible" label="采购类别" align="center" prop="poCategory" min-width="100">
    <template #default="scope">
      <dict-tag v-if="isPoDetailParentRow(scope.row)" :options="wms_purchase_category" :value="scope.row.poCategory" />
    </template>
  </el-table-column>
  <slot name="after-category" />
  <el-table-column v-if="columns[2]?.visible" label="排程" align="left" prop="scheduleNumber" min-width="60">
    <template #default="scope">
      <span v-if="isPoDetailParentRow(scope.row)">{{ scope.row.scheduleNumber }}</span>
    </template>
  </el-table-column>
  <el-table-column v-if="columns[3]?.visible" label="交货日期" align="center" prop="deliveryDate" min-width="100">
    <template #default="scope">
      <span v-if="isPoDetailParentRow(scope.row)">{{ scope.row.deliveryDate }}</span>
    </template>
  </el-table-column>
  <el-table-column v-if="columns[4]?.visible" label="料号" align="left" prop="materialCode" min-width="135" />
  <el-table-column v-if="columns[5]?.visible" label="旧料号" align="left" prop="oldMaterialCode">
    <template #default="scope">
      <span v-if="isPoDetailParentRow(scope.row)">{{ scope.row.oldMaterialCode }}</span>
    </template>
  </el-table-column>
  <el-table-column v-if="columns[6]?.visible" label="物料描述" align="left" prop="materialDesc" show-overflow-tooltip />
  <el-table-column v-if="columns[7]?.visible" label="订单数量" align="left" prop="orderQuantity" min-width="100">
    <template #default="scope">{{ formatQty(scope.row.orderQuantity) }}</template>
  </el-table-column>
  <el-table-column v-if="columns[8]?.visible" :label="receivedQuantityLabel" align="left" prop="receivedQuantity" min-width="100">
    <template #default="scope">{{ formatQty(scope.row.receivedQuantity) }}</template>
  </el-table-column>
  <el-table-column v-if="columns[9]?.visible" label="未清数量" align="left" prop="openQuantity" min-width="100">
    <template #default="scope">
      {{ formatQty(isPoDetailParentRow(scope.row) ? scope.row.openQuantity : formatBomOpenOrderQuantity(scope.row)) }}
    </template>
  </el-table-column>
  <el-table-column v-if="columns[10]?.visible" label="订单单位" align="center" prop="orderUnit" />
  <el-table-column v-if="columns[11]?.visible" label="需质检" align="center" prop="receiptInspectionFlag">
    <template #default="scope">
      <dict-tag v-if="isPoDetailParentRow(scope.row)" :options="wms_boolean_type" :value="scope.row.receiptInspectionFlag" />
    </template>
  </el-table-column>
  <el-table-column v-if="columns[13]?.visible" label="库存单位" align="center" prop="inventoryUnit" />
  <el-table-column v-if="columns[14]?.visible" label="换算比例" align="center" prop="conversionRatio" />
  <el-table-column v-if="columns[15]?.visible" label="供应商代码" align="center" prop="supplierCode" min-width="120">
    <template #default="scope">
      <span v-if="isPoDetailParentRow(scope.row)">{{ scope.row.supplierCode }}</span>
    </template>
  </el-table-column>
  <el-table-column v-if="columns[16]?.visible" label="供应商名称" align="center" prop="supplierName" show-overflow-tooltip min-width="100">
    <template #default="scope">
      <span v-if="isPoDetailParentRow(scope.row)">{{ scope.row.supplierName }}</span>
    </template>
  </el-table-column>
</template>

<script setup lang="ts">
import { formatBomOpenOrderQuantity, isPoDetailParentRow } from '../utils/purchaseOrderDetailTree';
import { formatQty } from '@/utils/ruoyi';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_boolean_type } = toRefs<any>(proxy?.useDict('wms_boolean_type'));

withDefaults(
  defineProps<{
    columns: Array<{ visible: boolean }>;
    receivedQuantityLabel?: string;
    showMoveType?: boolean;
    wms_purchase_category: any[];
  }>(),
  {
    receivedQuantityLabel: '已收数量',
    showMoveType: true
  }
);
</script>
