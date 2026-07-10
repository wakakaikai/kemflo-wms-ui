<template>
  <el-dialog v-model="visible" :title="confirmView.title" width="720px" destroy-on-close append-to-body @closed="handleClosed">
    <el-table :data="confirmView.rows" border size="small">
      <el-table-column prop="action" label="操作" width="100" align="center" />
      <el-table-column prop="locationCode" label="库位" min-width="120" show-overflow-tooltip />
      <el-table-column prop="materialCode" label="物料" min-width="140" show-overflow-tooltip />
      <el-table-column prop="qtyText" label="数量" width="120" align="right" />
      <el-table-column v-if="hasTargetColumn" prop="targetLocationCode" label="目标库位" min-width="120" show-overflow-tooltip>
        <template #default="{ row }">{{ row.targetLocationCode || '-' }}</template>
      </el-table-column>
    </el-table>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleConfirm">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { buildIssueTaskLineIssueConfirmView, buildPrepLocationRecIssueOutBoFromLine, executeIssueTaskLineIssueOut } from '@/api/wms/issueTask';
import type { IssueTaskLineVO } from '@/api/wms/issueTask/types';

const props = defineProps<{
  modelValue: boolean;
  row: IssueTaskLineVO | null;
  demandRemark?: string;
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

const issueOutBo = computed(() => (props.row ? buildPrepLocationRecIssueOutBoFromLine(props.row) : null));

const confirmView = computed(() => {
  if (!props.row || !issueOutBo.value) {
    return { title: '确认领料', rows: [] };
  }
  return buildIssueTaskLineIssueConfirmView(props.row, issueOutBo.value);
});

const hasTargetColumn = computed(() => confirmView.value.rows.some((row) => row.targetLocationCode));

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
  if (!props.row?.demandId) return;
  submitting.value = true;
  try {
    const res = await executeIssueTaskLineIssueOut(props.row);
    if (res.code === 200) {
      emit('result', { message: res.msg || '领料成功', success: true });
      visible.value = false;
      emit('success');
      return;
    }
    const message = res.msg || '领料失败';
    emit('result', { message, success: false });
  } catch (error) {
    emit('result', { message: (error as Error)?.message || '领料失败', success: false });
  } finally {
    submitting.value = false;
  }
};
</script>
