<template>
  <work-order-bom-dialog
    :model-value="modelValue"
    :work-order="primaryWorkOrder"
    :work-orders="workOrders"
    :material-issues="materialIssues"
    :material-issues-by-work-order="materialIssuesByWorkOrder"
    :demand-user-no="demandUserNo"
    mode="prep"
    @update:model-value="emit('update:modelValue', $event)"
    @save="emit('save', $event)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import WorkOrderBomDialog from './WorkOrderBomDialog.vue';
import type { WorkOrderVO, WorkOrderMaterialIssueLine } from '@/api/wms/allocation/types';

const props = defineProps<{
  modelValue: boolean;
  workOrder?: WorkOrderVO | null;
  workOrders?: WorkOrderVO[];
  materialIssues?: WorkOrderMaterialIssueLine[];
  materialIssuesByWorkOrder?: Record<string, WorkOrderMaterialIssueLine[]>;
  demandUserNo?: string;
}>();

const primaryWorkOrder = computed(() => props.workOrders?.[0] ?? props.workOrder ?? null);

const emit = defineEmits<{
  'update:modelValue': [boolean];
  save: [
    {
      workOrderNo?: string;
      materialIssues?: WorkOrderMaterialIssueLine[];
      batch?: Array<{ workOrderNo: string; materialIssues: WorkOrderMaterialIssueLine[] }>;
    }
  ];
}>();
</script>
