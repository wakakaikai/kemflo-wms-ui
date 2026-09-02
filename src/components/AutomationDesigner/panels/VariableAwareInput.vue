<template>
  <el-popover
    v-model:visible="popoverVisible"
    placement="bottom-start"
    :width="280"
    :trigger="popoverTrigger"
    popper-class="flow-var-popover"
  >
    <template #reference>
      <el-input
        :model-value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :type="type"
        :rows="rows"
        @update:model-value="onInput"
        @keydown="onKeydown"
        @blur="handleBlur"
      />
    </template>
    <div class="var-picker">
      <div class="var-picker-title">选择变量</div>
      <button
        v-for="opt in options"
        :key="opt.value"
        type="button"
        class="var-picker-item"
        @mousedown.prevent
        @click="pickVariable(opt)"
      >
        {{ opt.label }}
      </button>
      <div v-if="options.length === 0" class="var-picker-empty">暂无可选上游变量</div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { VariableOption } from './useUpstreamVariables';

const props = withDefaults(defineProps<{
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
  type?: 'text' | 'textarea';
  rows?: number;
  options?: VariableOption[];
}>(), {
  modelValue: '',
  placeholder: '',
  disabled: false,
  type: 'text',
  rows: 3,
  options: () => [],
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
}>();

const popoverTrigger = 'manual' as any;
const popoverVisible = ref(false);

function onInput(value: string) {
  emit('update:modelValue', value);
  emit('change', value);
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === '/') {
    popoverVisible.value = true;
  }
  if (event.key === 'Escape') {
    popoverVisible.value = false;
  }
}

function handleBlur() {
  window.setTimeout(() => {
    popoverVisible.value = false;
  }, 120);
}

function pickVariable(opt: VariableOption) {
  const token = opt.displayValue || `{{${opt.field}}}`;
  const next = props.modelValue ? `${props.modelValue}${token}` : token;
  onInput(next);
  popoverVisible.value = false;
}
</script>

<style scoped>
.var-picker-title {
  margin-bottom: 8px;
  color: #8c8c8c;
  font-size: 12px;
}
.var-picker-item {
  display: block;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #262626;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.var-picker-item:hover {
  background: #f5f5f5;
}
.var-picker-empty {
  padding: 8px 0;
  color: #bfbfbf;
  font-size: 12px;
}
</style>
