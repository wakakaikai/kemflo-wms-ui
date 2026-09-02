<template>
  <div class="ocr-input">
    <ImageUpload v-model="imageValue" :limit="1" :file-size="10" :is-show-tip="false" />
    <div class="ocr-main">
      <el-input v-model="textValue" type="textarea" :rows="3" :placeholder="placeholder" :readonly="readonly" :disabled="disabled" />
      <el-button type="primary" :disabled="disabled" @click="markPending">{{ buttonText }}</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ElMessage } from 'element-plus';
import ImageUpload from '@/components/ImageUpload/index.vue';

type OcrValue = {
  image?: string;
  text?: string;
  status?: 'pending' | 'done';
};

const props = withDefaults(
  defineProps<{
    modelValue?: OcrValue | string;
    buttonText?: string;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
  }>(),
  {
    buttonText: '识别文本',
    placeholder: '识别结果可在这里录入或修正',
    disabled: false,
    readonly: false
  }
);

const emit = defineEmits<{ 'update:modelValue': [value: OcrValue] }>();

const ocrValue = computed<OcrValue>(() => {
  if (typeof props.modelValue === 'string') return { text: props.modelValue };
  return props.modelValue || {};
});

const imageValue = computed({
  get: () => ocrValue.value.image || '',
  set: (image: string) => emit('update:modelValue', { ...ocrValue.value, image })
});

const textValue = computed({
  get: () => ocrValue.value.text || '',
  set: (text: string) => emit('update:modelValue', { ...ocrValue.value, text })
});

function markPending() {
  if (!ocrValue.value.image) {
    ElMessage.warning('请先上传待识别图片');
    return;
  }
  emit('update:modelValue', { ...ocrValue.value, status: 'pending' });
  ElMessage.info('当前未配置 OCR 接口，请先手动录入识别结果');
}
</script>

<style scoped>
.ocr-input {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  width: 100%;
}
.ocr-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ocr-input :deep(.el-upload--picture-card),
.ocr-input :deep(.el-upload-list__item) {
  width: 96px;
  height: 96px;
}
</style>
