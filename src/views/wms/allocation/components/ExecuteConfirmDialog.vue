<template>
  <el-dialog v-model="visible" title="执行发料" width="520px" @close="handleClose">
    <div v-if="plan" class="execute-confirm">
      <el-alert type="info" :closable="false" show-icon title="执行后将生成发料单，库存按备料结果出库" class="mb-4" />
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="备料单号">{{ plan.planNo }}</el-descriptions-item>
        <el-descriptions-item label="工单数">{{ plan.workOrderCount }} 个</el-descriptions-item>
        <el-descriptions-item label="拣货点">{{ plan.pickLocationCount }} 个</el-descriptions-item>
        <el-descriptions-item label="齐套率">{{ ((plan.avgKitRate || 0) * 100).toFixed(1) }}%</el-descriptions-item>
      </el-descriptions>
      <el-form class="mt-4" label-width="80px">
        <el-form-item label="执行人">
          <el-input v-model="operator" disabled />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="remark" type="textarea" :rows="2" placeholder="选填" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
    </div>
    <el-empty v-else description="未选择备料单" />
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="executing" :disabled="!plan" @click="handleConfirm">确认执行</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { AllocationPlanVO } from '@/api/wms/allocation/types';
import { useUserStore } from '@/store/modules/user';

interface Props {
  modelValue: boolean;
  plan: AllocationPlanVO | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [boolean];
  confirm: [operator: string];
}>();

const userStore = useUserStore();
const visible = ref(false);
const executing = ref(false);
const operator = ref('');
const remark = ref('');

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val) {
      operator.value = userStore.nickname || 'system';
      remark.value = '';
    }
  }
);

watch(visible, (val) => emit('update:modelValue', val));

const handleConfirm = () => {
  executing.value = true;
  emit('confirm', operator.value || 'system');
  executing.value = false;
  handleClose();
};

const handleClose = () => {
  visible.value = false;
};
</script>

<style scoped>
.execute-confirm .mb-4 {
  margin-bottom: 16px;
}
.mt-4 {
  margin-top: 16px;
}
</style>
