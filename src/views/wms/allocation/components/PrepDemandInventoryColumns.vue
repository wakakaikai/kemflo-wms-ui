<template>
  <el-table-column label="库存类型" width="100" align="center">
    <template #default="{ row }">
      <dict-tag :options="wms_inventory_special_flag" :value="resolvePrepRowInventoryFlag(row)" />
    </template>
  </el-table-column>
  <el-table-column v-if="showBusinessCodeColumn" label="业务合作伙伴" min-width="120" show-overflow-tooltip>
    <template #default="{ row }">
      <span v-if="isPrepRowSpecialInventory(row)">{{ resolvePrepRowBusinessPartner(row).businessCode }}</span>
      <span v-else class="text-muted">-</span>
    </template>
  </el-table-column>
  <el-table-column v-if="showBusinessNameColumn" label="合作伙伴名称" min-width="120" show-overflow-tooltip>
    <template #default="{ row }">
      <span v-if="isPrepRowSpecialInventory(row)">{{ resolvePrepRowBusinessPartner(row).businessName }}</span>
      <span v-else class="text-muted">-</span>
    </template>
  </el-table-column>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, toRefs } from 'vue';
import { hasPrepRowBusinessCode, hasPrepRowBusinessName, isPrepRowSpecialInventory, resolvePrepRowBusinessPartner, resolvePrepRowInventoryFlag, type PrepDemandDisplayRow } from '@/api/wms/workOrderPrepDemand/index';

const props = withDefaults(
  defineProps<{
    rows?: PrepDemandDisplayRow[];
  }>(),
  {
    rows: undefined
  }
);

const { proxy } = getCurrentInstance()!;
const { wms_inventory_special_flag } = toRefs<any>(proxy?.useDict('wms_inventory_special_flag'));

const showBusinessCodeColumn = computed(() => !props.rows?.length || hasPrepRowBusinessCode(props.rows));
const showBusinessNameColumn = computed(() => !props.rows?.length || hasPrepRowBusinessName(props.rows));
</script>

<style scoped>
.text-muted {
  color: var(--el-text-color-secondary);
}
</style>
