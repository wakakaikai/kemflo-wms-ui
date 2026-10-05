<template>
  <div class="template-thumb">
    <div v-if="elements.length" class="paper" :style="paperStyle">
      <div v-for="item in elements" :key="item.id" class="element" :class="itemClass(item)" :style="elementStyle(item)">
        <span v-if="isText(item)">{{ elementText(item) }}</span>
        <span v-else-if="isTable(item)" class="table-grid">
          <i v-for="n in 8" :key="n" />
        </span>
      </div>
    </div>
    <div v-else class="empty-thumb">
      <el-icon><Document /></el-icon>
      <span>空白模板</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Document } from '@element-plus/icons-vue';
import type { PrintTemplateVo } from '@/api/wms/printTemplate';
import type { PrintTemplateItem } from '@/components/print-designer';
import { parseTemplateContent } from '../model';

const props = defineProps<{ row?: PrintTemplateVo | null }>();

const template = computed(() => parseTemplateContent(props.row?.templateContent));

const paperSize = computed(() => {
  return { width: template.value.pageWidth || 210, height: template.value.pageHeight || 297 };
});

const elements = computed(() => (template.value.tempItems || []).slice(0, 48));

const paperStyle = computed(() => {
  const { width, height } = paperSize.value;
  return { aspectRatio: `${width} / ${height}` };
});

function isText(item: PrintTemplateItem) {
  return ['braid-txt', 'braid-html'].includes(item.type);
}

function isTable(item: PrintTemplateItem) {
  return item.type === 'braid-table';
}

function elementText(item: PrintTemplateItem) {
  return String(item.defaultValue || item.value || item.title || '').replace(/[{}]/g, '');
}

function itemClass(item: PrintTemplateItem) {
  const names: Partial<Record<PrintTemplateItem['type'], string>> = {
    'braid-txt': 'is-text',
    'braid-html': 'is-html',
    'braid-image': 'is-image',
    'braid-table': 'is-table',
    'bar-code': String(item.style?.codeType || '')
      .toUpperCase()
      .includes('QR')
      ? 'is-qrcode'
      : 'is-barcode',
    'braid-rect': 'is-rect',
    'braid-border': 'is-rect',
    'braid-ellipse': 'is-oval',
    'braid-hline': 'is-hline',
    'braid-vline': 'is-vline'
  };
  return names[item.type] || 'is-text';
}

function elementStyle(item: PrintTemplateItem) {
  const width = template.value.width || 1;
  const height = template.value.height || 1;
  return {
    left: `${(Number(item.left || 0) / width) * 100}%`,
    top: `${(Number(item.top || 0) / height) * 100}%`,
    width: `${Math.max((Number(item.width || 1) / width) * 100, 1)}%`,
    height: `${Math.max((Number(item.height || 1) / height) * 100, 0.6)}%`,
    color: item.style?.FontColor || item.style?.BorderColor || '#334155',
    backgroundColor: item.style?.HighlightColor || item.style?.FillColor || undefined,
    borderColor: item.style?.BorderColor || '#64748b',
    zIndex: item.style?.zIndex || 1
  };
}
</script>

<style scoped lang="scss">
.template-thumb {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px), #eef2f7;
  background-size: 16px 16px;
}

.paper {
  position: relative;
  max-width: 76%;
  max-height: 84%;
  width: 64%;
  overflow: hidden;
  background: #fff;
  box-shadow:
    0 14px 28px rgba(15, 23, 42, 0.16),
    0 0 0 1px rgba(100, 116, 139, 0.15);
}

.element {
  position: absolute;
  overflow: hidden;
  border: 1px solid transparent;
  font-size: 3px;
  line-height: 1.2;
  white-space: nowrap;
}

.is-rect,
.is-oval {
  border-color: currentColor;
}

.is-oval {
  border-radius: 50%;
}

.is-hline {
  height: 1px !important;
  border-top-color: currentColor;
}

.is-vline {
  width: 1px !important;
  border-left-color: currentColor;
}

.is-barcode {
  background: repeating-linear-gradient(90deg, #111827 0 1px, transparent 1px 2px);
}

.is-qrcode {
  background: linear-gradient(90deg, #111827 50%, transparent 50%), linear-gradient(#111827 50%, transparent 50%);
  background-size: 4px 4px;
}

.is-image {
  background: #dbeafe;
  border-color: #93c5fd;
}

.is-table {
  border-color: #64748b;
}

.table-grid {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, 1fr);
}

.table-grid i {
  border-right: 1px solid #94a3b8;
  border-bottom: 1px solid #94a3b8;
}

.empty-thumb {
  display: grid;
  place-items: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 12px;
}

.empty-thumb .el-icon {
  font-size: 34px;
}
</style>
