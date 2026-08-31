<template>
  <el-dialog v-model="visible" :title="confirmView.title" width="1020px" destroy-on-close append-to-body @closed="handleClosed">
    <el-table :data="confirmView.rows" border size="small" max-height="420">
      <el-table-column prop="workOrderNo" :label="'\u5de5\u5355\u53f7'" min-width="120" show-overflow-tooltip />
      <el-table-column prop="demandNo" :label="'\u9700\u6c42\u5355\u53f7'" min-width="130" show-overflow-tooltip />
      <el-table-column prop="action" :label="'\u64cd\u4f5c'" min-width="140" align="center" show-overflow-tooltip />
      <el-table-column prop="locationCode" :label="'\u5e93\u4f4d'" min-width="110" show-overflow-tooltip />
      <el-table-column prop="materialCode" :label="'\u7269\u6599'" min-width="130" show-overflow-tooltip />
      <el-table-column prop="pendingQtyText" :label="'\u5f85\u53d1\u6570\u91cf'" width="110" align="right" />
      <el-table-column prop="actualQtyText" :label="'\u5b9e\u53d1\u6570\u91cf'" width="110" align="right" />
      <el-table-column prop="targetLocationCode" :label="'\u76ee\u6807\u5e93\u4f4d'" min-width="120" show-overflow-tooltip>
        <template #default="{ row }">{{ row.targetLocationCode || '-' }}</template>
      </el-table-column>
    </el-table>
    <template #footer>
      <el-button @click="visible = false">{{ '\u53d6\u6d88' }}</el-button>
      <el-button type="primary" :loading="submitting" @click="handleConfirm">{{ '\u786e\u8ba4' }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { buildIssueTaskBatchIssueConfirmView, executeIssueTaskBatchIssueOut } from '@/api/wms/issueTask';
import type { IssueTaskLineVO } from '@/api/wms/issueTask/types';

const props = defineProps<{
  modelValue: boolean;
  rows: IssueTaskLineVO[];
}>();

const emit = defineEmits<{
  'update:modelValue': [boolean];
  success: [];
  result: [{ message: string; success: boolean }];
}>();

const submitting = ref(false);

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

const confirmView = computed(() => buildIssueTaskBatchIssueConfirmView(props.rows || []));

const handleClosed = () => {
  submitting.value = false;
};

watch(
  () => props.modelValue,
  () => {
    if (!props.modelValue) submitting.value = false;
  }
);

const handleConfirm = async () => {
  if (!props.rows.length) return;
  submitting.value = true;
  try {
    const result = await executeIssueTaskBatchIssueOut(props.rows);
    const message = result.messages.join('\uFF1B') || `\u6279\u91cf\u9886\u6599\u6210\u529f\uff1a261 ${result.directCount} \u6761\uff0c261+311 ${result.actualDeductTransCount} \u6761`;
    emit('result', { message, success: true });
    visible.value = false;
    emit('success');
  } catch (error) {
    emit('result', { message: (error as Error)?.message || '\u6279\u91cf\u9886\u6599\u5931\u8d25', success: false });
  } finally {
    submitting.value = false;
  }
};
</script>
