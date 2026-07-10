<template>
  <div class="issue-qty-input" :class="{ 'is-disabled': disabled }" @focusout="onFocusOut">
    <el-input-number
      ref="inputRef"
      :model-value="row.issueQty"
      :min="0"
      :max="maxIssueQty"
      :precision="3"
      :step="1"
      :disabled="disabled"
      controls-position="right"
      size="small"
      class="qty-input"
      @update:model-value="onIssueInput"
    />
    <el-select
      v-if="showUnitSelect"
      :model-value="issueUnit"
      :disabled="disabled"
      size="small"
      class="unit-select"
      @change="onUnitChange"
    >
      <el-option v-for="opt in unitOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
    </el-select>
    <span v-else class="qty-unit">{{ issueUnit }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import type { WorkOrderBomVO } from '@/api/wms/allocation/types';
import { calcMaxIssueQty, clampIssueQty, getIssueUnitOptions } from '@/api/wms/allocation/index';

interface Props {
  row: WorkOrderBomVO;
  disabled?: boolean;
  /** 自定义上限（备料模式可大于待发量） */
  maxIssueQty?: number;
  autofocus?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  autofocus: false
});

const emit = defineEmits<{
  change: [issueQty: number];
  'unit-change': [altUnit: string];
  blur: [];
}>();

const inputRef = ref<{ focus?: () => void } | null>(null);

/** 可选发料单位列表 */
const unitOptions = computed(() => getIssueUnitOptions(props.row));

/** 是否显示单位下拉（多单位时） */
const showUnitSelect = computed(() => unitOptions.value.length > 1);

/** 当前发料单位 */
const issueUnit = computed(() => props.row.unit || props.row.inventoryUnit || '');

/** 最大可发数量 */
const maxIssueQty = computed(() => {
  if (props.maxIssueQty != null && props.maxIssueQty >= 0) {
    return props.maxIssueQty;
  }
  return calcMaxIssueQty(props.row);
});

/** 发料数量输入，自动钳制到上限 */
const onIssueInput = (val?: number) => {
  emit('change', clampIssueQty(val ?? 0, maxIssueQty.value));
};

/** 切换发料单位 */
const onUnitChange = (altUnit: string) => {
  if (altUnit && altUnit !== issueUnit.value) {
    emit('unit-change', altUnit);
  }
};

const onFocusOut = (event: FocusEvent) => {
  const current = event.currentTarget as HTMLElement | null;
  const related = event.relatedTarget as Node | null;
  if (current && related && current.contains(related)) return;
  emit('blur');
};

onMounted(() => {
  if (!props.autofocus) return;
  nextTick(() => {
    inputRef.value?.focus?.();
  });
});
</script>

<style scoped>
.issue-qty-input {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 160px;
}

.qty-input {
  flex: 1;
  min-width: 0;
}

.qty-input :deep(.el-input__wrapper) {
  padding-left: 8px;
  padding-right: 8px;
}

.unit-select {
  width: 72px;
  flex-shrink: 0;
}

.unit-select :deep(.el-input__wrapper) {
  padding-left: 6px;
  padding-right: 6px;
}

.qty-unit {
  flex-shrink: 0;
  min-width: 28px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}
</style>
