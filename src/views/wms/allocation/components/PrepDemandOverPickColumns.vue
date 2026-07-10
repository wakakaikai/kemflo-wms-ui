<template>
  <el-table-column v-if="showOverPickColumn" label="超领原因" min-width="150" show-overflow-tooltip>
    <template #default="{ row }">{{ formatPrepRowOverPickDisplay(row, overPickReasonOptions) }}</template>
  </el-table-column>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, toRefs } from 'vue';
import type { ComponentInternalInstance } from 'vue';
import { formatPrepRowOverPickDisplay, hasPrepRowOverPickInfo, MATERIAL_OVER_PICK_DICT, type PrepDemandDisplayRow } from '@/api/wms/workOrderPrepDemand/index';



const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_material_over_pick } = toRefs<any>(proxy?.useDict(MATERIAL_OVER_PICK_DICT));
const overPickReasonOptions = computed(() => (wms_material_over_pick.value || []) as DictDataOption[]);

const props = withDefaults(
  defineProps<{
    rows?: PrepDemandDisplayRow[];
    forceShow?: boolean;
  }>(),
  {
    rows: undefined,
    forceShow: false
  }
);

const showOverPickColumn = computed(() => props.forceShow || !props.rows?.length || hasPrepRowOverPickInfo(props.rows));
</script>
