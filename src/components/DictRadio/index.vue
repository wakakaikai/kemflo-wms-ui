<template>
  <el-radio-group v-model="radioValue" @change="handleChange">
    <el-radio-button v-for="dict in dictList" :key="dict.value" :label="dict.value">
      {{ dict.label }}
    </el-radio-button>
  </el-radio-group>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElRadioButton, ElRadioGroup } from 'element-plus';

interface DictItem {
  label: string;
  value: any;
}

const props = defineProps<{
  radioData: DictItem[];
  size?: string;
  modelValue?: any; // 使用modelValue代替value以支持v-model
  showAll?: 'all' | '';
}>();

const emit = defineEmits(['update:modelValue', 'change']);

// 定义内部使用的响应式变量
const radioValue = ref(props.modelValue);

// 监听外部传入的modelValue变化并同步到radioValue
watch(
  () => props.modelValue,
  (newValue) => {
    radioValue.value = newValue;
  },
  { immediate: true }
);

// 计算属性：根据showAll属性调整选项列表
const dictList = computed(() => {
  if (props.showAll === 'all') {
    return [{ label: '全部', value: null }, ...props.radioData];
  }
  return props.radioData;
});

// 处理选择改变事件
const handleChange = (val: any) => {
  emit('update:modelValue', val);
  emit('change', val);
};
</script>
