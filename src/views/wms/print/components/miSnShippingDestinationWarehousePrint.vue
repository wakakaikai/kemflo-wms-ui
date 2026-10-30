<template>
  <div class="shipping-destination-warehouse-label-component">
    <section class="setting-card">
      <div class="setting-header">
        <div class="setting-title-wrap">
          <div class="setting-icon">
            <el-icon>
              <Location />
            </el-icon>
          </div>
          <div>
            <div class="setting-title">小米出货目的仓标签</div>
            <div class="setting-subtitle">选择目的仓后生成二维码，通过浏览器直接打印</div>
          </div>
        </div>
        <div class="setting-badges">
          <el-tag effect="plain">97 × 84 mm</el-tag>
          <el-tag type="success" effect="plain">铜版纸</el-tag>
        </div>
      </div>

      <div class="warehouse-toolbar">
        <div class="warehouse-selector">
          <div class="warehouse-input-group">
            <el-input :model-value="selectedWarehouseName" class="warehouse-input" size="large" placeholder="请从WMS字典选择目的仓" readonly @click="openWarehouseDialog">
              <template #prefix>
                <el-icon>
                  <OfficeBuilding />
                </el-icon>
              </template>
            </el-input>
            <el-button type="primary" size="large" icon="Search" class="warehouse-picker-button" @click="openWarehouseDialog">选择目的仓</el-button>
          </div>
          <div v-if="selectedWarehouseCode" class="field-hint">仓库编码：{{ selectedWarehouseCode }}</div>
        </div>
        <el-button class="print-button" type="primary" size="large" icon="Printer" :disabled="!canPrint" @click="print()">网页打印</el-button>
      </div>
    </section>

    <section class="preview-card">
      <div class="preview-header">
        <div>
          <div class="preview-title">标签预览（97mm*84mm）</div>
          <div class="preview-subtitle">打印时仅输出下方白色标签区域</div>
        </div>
        <div class="preview-status">
          <el-tag :type="selectedWarehouseName ? 'success' : 'warning'" effect="light">
            {{ selectedWarehouseName ? '目的仓已选择' : '待选择目的仓' }}
          </el-tag>
          <el-tag type="info" effect="plain">二维码：{{ selectedWarehouseCode || '待生成' }}</el-tag>
        </div>
      </div>

      <div class="preview-stage">
        <div ref="labelRef" class="shipping-destination-warehouse-label" :style="labelStyle">
          <div class="label-logo">
            <img :src="miLogo" alt="MI" />
          </div>

          <canvas ref="qrCodeCanvasRef" class="label-qr-code" aria-label="目的仓编码二维码"></canvas>

          <div class="warehouse-content">
            <div class="warehouse-label-title">目的仓：</div>
            <div class="warehouse-name">{{ selectedWarehouseName || '' }}</div>
          </div>
        </div>
      </div>
    </section>

    <el-dialog v-model="warehouseDialogVisible" title="选择出货目的仓" width="60%" append-to-body destroy-on-close>
      <el-input v-model="warehouseKeyword" placeholder="按仓库名称或编码搜索" clearable class="warehouse-search" />
      <el-table v-loading="warehouseLoading" :data="filteredWarehouseOptions" border stripe highlight-current-row max-height="420" empty-text="目的仓字典暂无数据" :row-class-name="warehouseRowClassName" @row-click="selectWarehouseRow">
        <el-table-column width="56" align="center">
          <template #default="scope">
            <el-radio v-model="pendingWarehouseCode" :value="String(scope.row.dictValue || '')" @click.stop />
          </template>
        </el-table-column>
        <el-table-column prop="dictLabel" label="目的仓名称" min-width="220" show-overflow-tooltip />
        <el-table-column prop="dictValue" label="仓库编码" min-width="150" show-overflow-tooltip />
      </el-table>
      <template #footer>
        <el-button @click="warehouseDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!pendingWarehouseCode" @click="confirmWarehouseSelection">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="MiSnShippingDestinationWarehousePrint" lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import QRCode from 'qrcode';
import { ElMessage } from 'element-plus';
import { Location, OfficeBuilding } from '@element-plus/icons-vue';
import { getDicts } from '@/api/system/dict/data';
import type { DictDataVO } from '@/api/system/dict/data/types';
import miLogo from '@/assets/logo/milogo.jpg';

const LABEL_WIDTH_MM = 97;
const LABEL_HEIGHT_MM = 84;

interface Props {
  /** SRM 系统中的实际目的仓名称 */
  warehouseName?: string;
  warehouseCode?: string;
  copies?: number;
  /** WMS字典类型，字典标签为目的仓名称、字典键值为仓库编码 */
  warehouseDictType?: string;
}

interface PrintOptions {
  taskName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  warehouseName: '',
  warehouseCode: '',
  copies: 1,
  warehouseDictType: 'wms_mi_shipping_destination_warehouse'
});

const emit = defineEmits<{
  'update:warehouseName': [string];
  'update:warehouseCode': [string];
  warehouseChange: [warehouse: { warehouseCode: string; warehouseName: string }];
}>();

const labelRef = ref<HTMLElement>();
const qrCodeCanvasRef = ref<HTMLCanvasElement>();
const selectedWarehouseCode = ref(props.warehouseCode);
const selectedWarehouseName = ref(props.warehouseName);
const pendingWarehouseCode = ref('');
const warehouseDialogVisible = ref(false);
const warehouseLoading = ref(false);
const warehouseKeyword = ref('');
const warehouseOptions = ref<DictDataVO[]>([]);

const canPrint = computed(() => Boolean(selectedWarehouseName.value.trim() && selectedWarehouseCode.value.trim()));

const qrPayload = computed(() => selectedWarehouseCode.value.trim());

const filteredWarehouseOptions = computed(() => {
  const keyword = warehouseKeyword.value.trim().toLowerCase();
  if (!keyword) {
    return warehouseOptions.value;
  }
  return warehouseOptions.value.filter((item) => `${item.dictLabel || ''} ${item.dictValue || ''} ${item.remark || ''}`.toLowerCase().includes(keyword));
});

const labelStyle = computed(() => ({
  width: `${LABEL_WIDTH_MM}mm`,
  height: `${LABEL_HEIGHT_MM}mm`
}));

const renderQrCode = async () => {
  await nextTick();
  if (!qrCodeCanvasRef.value || !qrPayload.value) {
    return;
  }
  try {
    await QRCode.toCanvas(qrCodeCanvasRef.value, qrPayload.value, {
      width: 180,
      margin: 0,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' }
    });
  } catch {
    ElMessage.error('二维码内容过长，无法生成目的仓标签');
  }
};

watch(qrPayload, renderQrCode, { immediate: true });
watch(
  () => props.warehouseName,
  (value) => (selectedWarehouseName.value = value || '')
);
watch(
  () => props.warehouseCode,
  (value) => (selectedWarehouseCode.value = value || '')
);

const loadWarehouseOptions = async () => {
  warehouseLoading.value = true;
  try {
    const res = await getDicts(props.warehouseDictType);
    warehouseOptions.value = ((res as any).data ?? []).slice().sort((left: DictDataVO, right: DictDataVO) => Number(left.dictSort ?? 0) - Number(right.dictSort ?? 0));
  } catch {
    warehouseOptions.value = [];
    ElMessage.error(`目的仓字典加载失败：${props.warehouseDictType}`);
  } finally {
    warehouseLoading.value = false;
  }
};

const openWarehouseDialog = async () => {
  warehouseDialogVisible.value = true;
  warehouseKeyword.value = '';
  pendingWarehouseCode.value = selectedWarehouseCode.value;
  await loadWarehouseOptions();
};

const selectWarehouseRow = (warehouse: DictDataVO) => {
  pendingWarehouseCode.value = String(warehouse.dictValue || '').trim();
};

const warehouseRowClassName = ({ row }: { row: DictDataVO }) => (String(row.dictValue || '').trim() === pendingWarehouseCode.value ? 'is-warehouse-selected' : '');

const confirmWarehouseSelection = () => {
  const warehouse = warehouseOptions.value.find((item) => String(item.dictValue || '').trim() === pendingWarehouseCode.value);
  if (!warehouse) {
    ElMessage.warning('请选择目的仓');
    return;
  }
  selectedWarehouseCode.value = String(warehouse.dictValue || '').trim();
  selectedWarehouseName.value = String(warehouse.dictLabel || '').trim();
  emit('update:warehouseCode', selectedWarehouseCode.value);
  emit('update:warehouseName', selectedWarehouseName.value);
  emit('warehouseChange', {
    warehouseCode: selectedWarehouseCode.value,
    warehouseName: selectedWarehouseName.value
  });
  warehouseDialogVisible.value = false;
};

const escapeHtml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const serializeLabelContent = () => {
  if (!labelRef.value) {
    return '';
  }
  const clone = labelRef.value.cloneNode(true) as HTMLElement;
  const sourceCanvases = labelRef.value.querySelectorAll('canvas');
  const clonedCanvases = clone.querySelectorAll('canvas');
  sourceCanvases.forEach((canvas, index) => {
    const clonedCanvas = clonedCanvases[index];
    if (!clonedCanvas) {
      return;
    }
    const image = document.createElement('img');
    Array.from(clonedCanvas.attributes).forEach((attribute) => image.setAttribute(attribute.name, attribute.value));
    image.src = canvas.toDataURL('image/png');
    image.alt = '目的仓编码二维码';
    clonedCanvas.replaceWith(image);
  });
  return clone.outerHTML;
};

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
  if (!selectedWarehouseName.value.trim()) {
    ElMessage.warning('请先选择目的仓');
    return;
  }
  if (!selectedWarehouseCode.value.trim()) {
    ElMessage.warning('目的仓编码不能为空');
    return;
  }
  const labelHtml = serializeLabelContent();
  if (!labelHtml) {
    ElMessage.error('标签内容尚未生成');
    return;
  }

  const taskName = options.taskName || `出货目的仓标签-${selectedWarehouseName.value}`;
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    ElMessage.error('打印窗口被拦截，请允许弹窗后重试');
    return;
  }
  const pageCount = Math.max(1, Math.trunc(props.copies));
  const printPages = Array.from({ length: pageCount }, () => `<div class="print-page">${labelHtml}</div>`).join('');
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
          .print-page > * { width: 100% !important; height: 100% !important; border: 0 !important; box-shadow: none !important; }
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

defineExpose({
  labelRef,
  qrPayload,
  renderQrCode,
  openWarehouseDialog,
  print
});
</script>

<style scoped>
.shipping-destination-warehouse-label-component {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 1180px;
  height: calc(100vh - 116px);
  max-height: calc(100vh - 116px);
  margin: 0 auto;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
}

.setting-card,
.preview-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: var(--el-bg-color);
  box-shadow: 0 8px 24px rgb(31 45 61 / 6%);
}

.setting-card {
  flex-shrink: 0;
  padding: 14px 16px;
}

.setting-header,
.setting-title-wrap,
.setting-badges,
.warehouse-toolbar,
.preview-header,
.preview-status {
  display: flex;
  align-items: center;
}

.setting-header,
.preview-header {
  justify-content: space-between;
  gap: 12px;
}

.setting-title-wrap {
  gap: 10px;
}

.setting-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  color: #fff;
  font-size: 20px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
  box-shadow: 0 6px 16px var(--el-color-primary-light-7);
}

.setting-title,
.preview-title {
  color: var(--el-text-color-primary);
  font-size: 17px;
  font-weight: 500;
}

.setting-subtitle,
.preview-subtitle,
.field-hint {
  margin-top: 5px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.setting-badges,
.preview-status {
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.warehouse-toolbar {
  align-items: flex-start;
  flex-wrap: nowrap;
  gap: 12px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-extra-light);
}

.warehouse-selector {
  flex: 1;
  min-width: 0;
}

.warehouse-input-group {
  display: flex;
  width: 100%;
}

.warehouse-input {
  flex: 1;
  min-width: 0;
}

.warehouse-input-group :deep(.el-input__wrapper) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.warehouse-picker-button {
  flex-shrink: 0;
  margin-left: -1px;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  position: relative;
  z-index: 1;
}

.warehouse-picker-button:hover,
.warehouse-picker-button:focus {
  z-index: 2;
}

.field-label {
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 500;
}

.print-button {
  flex-shrink: 0;
  min-width: 130px;
  height: var(--el-component-size-large);
}

.warehouse-search {
  margin-bottom: 12px;
}

:deep(.el-table .is-warehouse-selected > td.el-table__cell) {
  background: var(--el-color-primary-light-9) !important;
}

.preview-card {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.preview-header {
  flex-shrink: 0;
  padding: 10px 14px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}

.preview-stage {
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: 16px 24px;
  overflow: hidden;
  background: linear-gradient(45deg, var(--el-fill-color-light) 25%, transparent 25%), linear-gradient(-45deg, var(--el-fill-color-light) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--el-fill-color-light) 75%), linear-gradient(-45deg, transparent 75%, var(--el-fill-color-light) 75%);
  background-position:
    0 0,
    0 8px,
    8px -8px,
    -8px 0;
  background-size: 16px 16px;
}

.preview-ruler,
.preview-height {
  position: absolute;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  letter-spacing: 0.5px;
}

.preview-ruler {
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
}

.preview-height {
  top: 50%;
  right: 22px;
  transform: translateY(-50%) rotate(90deg);
}

.shipping-destination-warehouse-label {
  position: relative;
  flex: 0 0 auto;
  box-sizing: border-box;
  overflow: hidden;
  color: #000;
  font-family: SimHei, 'Microsoft YaHei', sans-serif;
  background: #fff;
  border: 1px solid #d5d8dc;
  box-shadow: 0 14px 36px rgb(0 0 0 / 16%);
}

.label-logo {
  position: absolute;
  top: 7mm;
  left: 7mm;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 15mm;
  height: 15mm;
}

.label-logo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.label-qr-code {
  position: absolute;
  top: 7mm;
  right: 7mm;
  width: 29mm !important;
  height: 29mm !important;
}

.warehouse-content {
  position: absolute;
  right: 8mm;
  bottom: 9mm;
  left: 8mm;
  font-size: 36px;
  font-weight: 500;
  line-height: 1.12;
  letter-spacing: 0.2mm;
}

.warehouse-label-title {
  margin-bottom: 2mm;
}

.warehouse-name {
  overflow-wrap: anywhere;
}

@media print {
  .shipping-destination-warehouse-label {
    border: 0;
  }
}

@media (max-width: 720px) {
  .shipping-destination-warehouse-label-component {
    height: auto;
    max-height: none;
    overflow: visible;
  }

  .setting-header,
  .warehouse-toolbar,
  .preview-header {
    align-items: stretch;
    flex-direction: column;
  }

  .setting-badges,
  .preview-status {
    justify-content: flex-start;
  }

  .print-button {
    width: 100%;
    margin-bottom: 0;
  }

  .preview-card {
    flex: none;
  }

  .preview-stage {
    justify-content: flex-start;
    flex: none;
    min-height: 280px;
    padding: 12px 16px;
  }
}
</style>
