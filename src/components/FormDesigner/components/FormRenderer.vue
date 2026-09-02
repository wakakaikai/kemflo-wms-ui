<template>
  <el-form ref="formRef" :model="model" :label-width="`${schema.formProps.labelWidth}px`" :label-position="schema.formProps.labelPosition" :size="schema.formProps.size" :style="{ '--el-color-primary': schema.formProps.themeColor }">
    <FormFieldList :widgets="schema.widgets" :model="model" />
  </el-form>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import type { FormInstance } from 'element-plus';
import FormFieldList from './FormFieldList.vue';
import type { FormSchema } from '../types';

const props = defineProps<{
  schema: FormSchema;
  modelValue?: Record<string, any>;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: Record<string, any>] }>();

const formRef = ref<FormInstance>();
const model = reactive<Record<string, any>>({ ...(props.modelValue || {}) });

watch(
  () => props.schema.widgets,
  () => syncDefaults(),
  { immediate: true, deep: true }
);

watch(model, () => emit('update:modelValue', { ...model }), { deep: true });

function syncDefaults() {
  const walk = (widgets: FormSchema['widgets']) => {
    for (const widget of widgets) {
      if (widget.field && model[widget.field] === undefined && widget.defaultValue !== undefined) {
        model[widget.field] = widget.defaultValue;
      }
      if (widget.children?.length) walk(widget.children);
    }
  };
  walk(props.schema.widgets);
}

async function validate() {
  return formRef.value?.validate();
}

function resetFields() {
  formRef.value?.resetFields();
}

defineExpose({ validate, resetFields, model });
</script>
