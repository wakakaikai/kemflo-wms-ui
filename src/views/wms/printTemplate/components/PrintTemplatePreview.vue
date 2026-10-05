<template>
  <div ref="rootRef" class="local-print-preview">
    <div v-for="(row, pageIndex) in pages" :key="pageIndex" class="preview-sheet" :style="sheetStyle">
      <div v-for="item in sortedItems" :key="item.id" class="preview-item" :class="'preview-item--' + item.type" :style="itemStyle(item)">
        <BarcodeCanvasPreview v-if="item.type === 'bar-code'" :item="item" :data-row="row" />
        <img v-else-if="item.type === 'braid-image' && imageSource(item, row)" :src="imageSource(item, row)" alt="" />
        <div v-else-if="item.type === 'braid-table'" class="preview-table-wrap">
          <table>
            <thead>
              <tr>
                <th v-for="(column, index) in item.columnsAttr || []" :key="index">{{ column.title || column.name }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(record, rowIndex) in tableRows(item, row)" :key="rowIndex">
                <td v-for="(column, index) in item.columnsAttr || []" :key="index">
                  {{ cellText(column, record, row) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <span v-else-if="isShape(item)" class="preview-shape" :style="shapeStyle(item)" />
        <span v-else-if="isLine(item)" class="preview-line" :style="lineStyle(item)" />
        <div v-else-if="item.type === 'braid-html'" class="preview-html" v-html="htmlValue(item, row)" />
        <span v-else>{{ textValue(item, row) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import BarcodeCanvasPreview from '@/components/print-designer/components/BarcodeCanvasPreview.vue';
import type { PrintTemplate, PrintTemplateItem, TableColumnAttr } from '@/components/print-designer';
import { resolveHtmlItemValue, resolvePlaceholders, resolveTextItemValue } from '@/components/print-designer/utils/resolvePlaceholders';
import { getLineOrientation, linePreviewStyle } from '@/components/print-designer/utils/lineItems';
import { isShapeItem, shapePreviewStyle } from '@/components/print-designer/utils/shapeItems';

const props = defineProps<{
  template: PrintTemplate;
  printData?: Record<string, unknown>[];
}>();
const emit = defineEmits<{ rendered: [pages: number] }>();
const rootRef = ref<HTMLElement | null>(null);

const pages = computed(() => (props.printData?.length ? props.printData : [{}]));
const sortedItems = computed(() => [...(props.template.tempItems || [])].sort((a, b) => (a.style?.zIndex || 0) - (b.style?.zIndex || 0)));
const sheetStyle = computed(() => ({
  aspectRatio: props.template.pageWidth + ' / ' + props.template.pageHeight,
  width: props.template.pageWidth + 'mm'
}));

function itemStyle(item: PrintTemplateItem) {
  const style = item.style || {};
  return {
    left: (item.left / props.template.width) * 100 + '%',
    top: (item.top / props.template.height) * 100 + '%',
    width: (item.width / props.template.width) * 100 + '%',
    height: (item.height / props.template.height) * 100 + '%',
    zIndex: style.zIndex || 1,
    color: style.FontColor || '#111827',
    backgroundColor: style.HighlightColor || undefined,
    fontFamily: style.FontName || undefined,
    fontSize: (style.FontSize || 9) + 'pt',
    fontWeight: style.Bold ? '700' : '400',
    fontStyle: style.Italic ? 'italic' : 'normal',
    textDecoration: [style.Underline ? 'underline' : '', style.StrikeOut ? 'line-through' : ''].filter(Boolean).join(' ') || 'none',
    textAlign: style.Alignment || 'left'
  };
}

function textValue(item: PrintTemplateItem, row: Record<string, unknown>) {
  return resolveTextItemValue(item, row);
}

function htmlValue(item: PrintTemplateItem, row: Record<string, unknown>) {
  return resolveHtmlItemValue(item, row);
}

function imageSource(item: PrintTemplateItem, row: Record<string, unknown>) {
  if (item.name && row[item.name]) return String(row[item.name]);
  return resolvePlaceholders(item.value || '', row) || String(item.defaultValue || '');
}

function tableRows(item: PrintTemplateItem, row: Record<string, unknown>) {
  if (item.name && Array.isArray(row[item.name])) return row[item.name] as Record<string, unknown>[];
  return Array.isArray(item.defaultValue) ? item.defaultValue : [];
}

function cellText(column: TableColumnAttr, record: Record<string, unknown>, page: Record<string, unknown>) {
  if (column.name && record[column.name] != null) return String(record[column.name]);
  return resolvePlaceholders(column.value || '', { ...page, ...record });
}

function isShape(item: PrintTemplateItem) {
  return isShapeItem(item);
}

function isLine(item: PrintTemplateItem) {
  return !!getLineOrientation(item);
}

function shapeStyle(item: PrintTemplateItem) {
  return shapePreviewStyle(item);
}

function lineStyle(item: PrintTemplateItem) {
  return linePreviewStyle(item);
}

async function announceRendered() {
  await nextTick();
  emit('rendered', pages.value.length);
}

function print() {
  document.body.classList.add('printing-local-template');
  window.addEventListener('afterprint', () => document.body.classList.remove('printing-local-template'), { once: true });
  window.print();
  window.setTimeout(() => document.body.classList.remove('printing-local-template'), 1000);
}

watch(() => [props.template, props.printData], announceRendered, { deep: true });
onMounted(announceRendered);
defineExpose({ print });
</script>

<style scoped lang="scss">
.local-print-preview {
  min-width: 100%;
  min-height: 100%;
  padding: 28px;
  display: grid;
  justify-items: center;
  align-content: start;
  gap: 24px;
  overflow: auto;
  background: #e5e9f0;
}

.preview-sheet {
  position: relative;
  max-width: 100%;
  overflow: hidden;
  color: #111827;
  background: #fff;
  box-shadow: 0 14px 38px rgba(15, 23, 42, 0.2);
}

.preview-item {
  position: absolute;
  display: flex;
  align-items: flex-start;
  overflow: hidden;
  line-height: 1.25;
  white-space: pre-wrap;
  box-sizing: border-box;
}

.preview-item img,
.preview-item :deep(canvas),
.preview-shape,
.preview-line,
.preview-html,
.preview-table-wrap {
  width: 100%;
  height: 100%;
}

.preview-item img {
  display: block;
  object-fit: contain;
}

.preview-table-wrap {
  overflow: hidden;
}

.preview-table-wrap table {
  width: 100%;
  border-collapse: collapse;
  font: inherit;
}

.preview-table-wrap th,
.preview-table-wrap td {
  padding: 2px 4px;
  border: 1px solid #64748b;
}

.preview-line {
  display: block;
}
</style>

<style lang="scss">
@media print {
  body.printing-local-template * {
    visibility: hidden !important;
  }

  body.printing-local-template .local-print-preview,
  body.printing-local-template .local-print-preview * {
    visibility: visible !important;
  }

  body.printing-local-template .local-print-preview {
    position: absolute !important;
    inset: 0 auto auto 0 !important;
    padding: 0 !important;
    gap: 0 !important;
    overflow: visible !important;
    background: #fff !important;
  }

  body.printing-local-template .preview-sheet {
    max-width: none !important;
    box-shadow: none !important;
    break-after: page;
  }
}
</style>
