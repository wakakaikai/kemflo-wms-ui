<template>
  <div class="mi-po-print-component">
    <section class="setting-card">
      <div class="setting-header">
        <div class="setting-title-wrap">
          <div class="setting-icon">
            <el-icon>
              <Tickets />
            </el-icon>
          </div>
          <div>
            <div class="setting-title">小米客户PO标签</div>
            <div class="setting-subtitle">输入客户PO后，通过浏览器直接打印标签</div>
          </div>
        </div>
        <el-tag effect="plain">30 × 10 mm</el-tag>
      </div>

      <el-form class="po-form" label-position="top" @submit.prevent>
        <el-form-item label="客户PO">
          <el-input ref="poInputRef" v-model="customerPo" size="large" maxlength="100" show-word-limit clearable autofocus placeholder="请输入客户PO" @keyup.enter="print()" />
        </el-form-item>
        <el-form-item label="打印份数">
          <el-input-number v-model="printCopies" :min="1" :max="999" :precision="0" controls-position="right" size="large" />
        </el-form-item>
        <el-form-item class="action-form-item" label=" ">
          <el-button type="primary" size="large" icon="Printer" :disabled="!canPrint" @click="print()">网页打印</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="preview-card">
      <div class="preview-header">
        <div>
          <div class="preview-title">标签预览</div>
          <div class="preview-subtitle">预览已放大 4 倍，打印尺寸为 30 × 10 mm</div>
        </div>
        <el-tag :type="canPrint ? 'success' : 'warning'" effect="light">
          {{ canPrint ? '可以打印' : '请输入客户PO' }}
        </el-tag>
      </div>

      <div class="preview-stage">
        <div class="preview-label-shell">
          <div ref="labelRef" class="mi-po-label">
            <div class="po-label-value" :style="poValueStyle">{{ normalizedCustomerPo || '' }}</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup name="MiSnPoPrint" lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Tickets } from '@element-plus/icons-vue';

const LABEL_WIDTH_MM = 30;
const LABEL_HEIGHT_MM = 10;

interface Props {
  modelValue?: string;
  copies?: number;
}

interface PrintOptions {
  taskName?: string;
  copies?: number;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  copies: 1
});

const emit = defineEmits<{
  'update:modelValue': [string];
  'update:copies': [number];
}>();

const poInputRef = ref<HTMLInputElement>();
const labelRef = ref<HTMLElement>();
const customerPo = ref(props.modelValue);
const printCopies = ref(Math.max(1, Math.trunc(props.copies)));

const normalizedCustomerPo = computed(() => customerPo.value.trim());
const canPrint = computed(() => normalizedCustomerPo.value.length > 0);

const poFontSize = computed(() => {
  const length = Array.from(normalizedCustomerPo.value).reduce((total, character) => total + (/^[\x00-\xff]$/.test(character) ? 1 : 2), 0);
  if (length <= 12) return 3.2;
  if (length <= 18) return 2.5;
  if (length <= 24) return 2;
  if (length <= 32) return 1.55;
  return 1.3;
});

const poValueStyle = computed(() => ({
  fontSize: `${poFontSize.value}mm`
}));

watch(
  () => props.modelValue,
  (value) => {
    if (value !== customerPo.value) customerPo.value = value || '';
  }
);
watch(customerPo, (value) => emit('update:modelValue', value));
watch(
  () => props.copies,
  (value) => {
    const copies = Math.max(1, Math.trunc(value));
    if (copies !== printCopies.value) printCopies.value = copies;
  }
);
watch(printCopies, (value) => emit('update:copies', value));

const escapeHtml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const collectPrintStyleResources = () =>
  Array.from(document.head.querySelectorAll<HTMLStyleElement | HTMLLinkElement>('style, link[rel="stylesheet"]'))
    .map((element) => {
      if (element instanceof HTMLLinkElement) {
        const clone = element.cloneNode(true) as HTMLLinkElement;
        clone.href = element.href;
        return clone.outerHTML;
      }
      return element.outerHTML;
    })
    .join('');

const print = (options: PrintOptions = {}) => {
  if (!normalizedCustomerPo.value) {
    ElMessage.warning('请输入客户PO');
    poInputRef.value?.focus();
    return;
  }
  if (!labelRef.value) {
    ElMessage.error('标签内容尚未生成');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    ElMessage.error('打印窗口被拦截，请允许弹窗后重试');
    return;
  }

  const copies = Math.max(1, Math.trunc(options.copies ?? printCopies.value));
  const labelHtml = labelRef.value.outerHTML;
  const printPages = Array.from({ length: copies }, () => `<div class="print-page">${labelHtml}</div>`).join('');
  const taskName = options.taskName || `客户PO标签-${normalizedCustomerPo.value}`;

  printWindow.document.open();
  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(taskName)}</title>
        ${collectPrintStyleResources()}
        <style>
          @page { size: ${LABEL_WIDTH_MM}mm ${LABEL_HEIGHT_MM}mm; margin: 0; }
          html, body { width: ${LABEL_WIDTH_MM}mm; margin: 0; padding: 0; background: #fff; }
          .print-page {
            width: ${LABEL_WIDTH_MM}mm;
            height: ${LABEL_HEIGHT_MM}mm;
            margin: 0;
            padding: 0;
            overflow: hidden;
            box-sizing: border-box;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .print-page + .print-page { break-before: page; page-break-before: always; }
          .print-page > * {
            width: ${LABEL_WIDTH_MM}mm !important;
            height: ${LABEL_HEIGHT_MM}mm !important;
            border: 0 !important;
            box-shadow: none !important;
            transform: none !important;
          }
          .print-page, .print-page * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        </style>
      </head>
      <body>
        ${printPages}
        <script>
          window.onload = function () {
            window.onafterprint = function () { window.close(); };
            window.focus();
            window.print();
          };
        <\/script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

onMounted(() => nextTick(() => poInputRef.value?.focus()));

defineExpose({
  customerPo,
  labelRef,
  print
});
</script>

<style scoped>
.mi-po-print-component {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
}

.setting-card,
.preview-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: var(--el-bg-color);
  box-shadow: 0 8px 24px rgb(31 45 61 / 6%);
}

.setting-card {
  padding: 18px 20px 4px;
}

.setting-header,
.setting-title-wrap,
.preview-header {
  display: flex;
  align-items: center;
}

.setting-header,
.preview-header {
  justify-content: space-between;
  gap: 16px;
}

.setting-title-wrap {
  gap: 12px;
}

.setting-icon {
  display: grid;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  font-size: 22px;
  place-items: center;
}

.setting-title,
.preview-title {
  color: var(--el-text-color-primary);
  font-size: 17px;
  font-weight: 600;
}

.setting-subtitle,
.preview-subtitle {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.po-form {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) 150px auto;
  gap: 14px;
  align-items: end;
  margin-top: 18px;
}

.po-form :deep(.el-input-number),
.po-form :deep(.el-button) {
  width: 100%;
}

.action-form-item {
  min-width: 120px;
}

.preview-card {
  overflow: hidden;
}

.preview-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.preview-stage {
  display: grid;
  min-height: 260px;
  padding: 32px;
  background-color: var(--el-fill-color-light);
  background-image: linear-gradient(45deg, var(--el-fill-color) 25%, transparent 25%), linear-gradient(-45deg, var(--el-fill-color) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--el-fill-color) 75%), linear-gradient(-45deg, transparent 75%, var(--el-fill-color) 75%);
  background-position:
    0 0,
    0 8px,
    8px -8px,
    -8px 0;
  background-size: 16px 16px;
  place-items: center;
}

.preview-label-shell {
  width: 120mm;
  height: 40mm;
}

.mi-po-label {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 30mm;
  height: 10mm;
  padding: 0.7mm 1mm;
  overflow: hidden;
  border: 0.2mm solid #d5d8dc;
  box-sizing: border-box;
  color: #000;
  background: #fff;
  font-family: Arial, 'Microsoft YaHei', sans-serif;
  line-height: 1;
  transform: scale(4);
  transform-origin: top left;
}

.po-label-title {
  margin-bottom: 0.65mm;
  font-size: 1.65mm;
  font-weight: 600;
}

.po-label-value {
  width: 100%;
  overflow: hidden;
  font-weight: 700;
  line-height: 1.05;
  text-align: center;
  text-overflow: clip;
  white-space: nowrap;
}

@media screen and (max-width: 760px) {
  .po-form {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .action-form-item {
    min-width: 0;
  }

  .preview-stage {
    min-height: 180px;
    padding: 20px;
    overflow: auto;
    place-items: start;
  }
}
</style>
