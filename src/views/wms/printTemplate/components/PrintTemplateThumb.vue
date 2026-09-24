<template>
  <div class="template-thumb">
    <div v-if="elements.length" class="paper" :style="paperStyle">
      <div v-for="item in elements" :key="item.id" class="element" :class="`is-${item.printElementType?.type || item.type || 'text'}`" :style="elementStyle(item)">
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
import { parseTemplateContent, type WormTemplate } from '../model';

const props = defineProps<{ row?: PrintTemplateVo | null }>();

const template = computed<WormTemplate>(() => parseTemplateContent(props.row?.templateContent));
const page = computed<any>(() => {
  const data = template.value as any;
  return Array.isArray(data.pages) ? data.pages[0] : data;
});

const paperSize = computed(() => {
  const p = page.value;
  if (p.paperSize === 'CUSTOM') return { width: Number(p.customWidth || 210), height: Number(p.customHeight || 297) };
  const presets: Record<string, [number, number]> = {
    A3: [297, 420],
    A4: [210, 297],
    A5: [148, 210],
    Letter: [215.9, 279.4],
    Legal: [215.9, 355.6],
    LABEL_80X60: [80, 60],
    LABEL_60X40: [60, 40],
    LABEL_40X30: [40, 30],
    THERMAL_57: [57, 120],
    THERMAL_80: [80, 160],
    THERMAL_110: [110, 180],
    CONTINUOUS: [Number(p.customWidth || 80), Number(p.customHeight || 160)]
  };
  const size = presets[p.paperSize] || presets.A4;
  const [width, height] = size;
  return p.orientation === 'landscape' ? { width: height, height: width } : { width, height };
});

const elements = computed<any[]>(() => {
  const p = page.value;
  return [...(p.header?.elements || []), ...(p.elements || []), ...(p.footer?.elements || [])].slice(0, 48);
});

const paperStyle = computed(() => {
  const { width, height } = paperSize.value;
  return { aspectRatio: `${width} / ${height}` };
});

function itemType(item: any) {
  return item.printElementType?.type || item.type || 'text';
}

function isText(item: any) {
  return ['text', 'longText', 'html', 'pageNumber'].includes(itemType(item));
}

function isTable(item: any) {
  return itemType(item) === 'table';
}

function elementText(item: any) {
  return String(item.options?.testData || item.options?.formatter || item.printElementType?.title || '').replace(/[{}]/g, '');
}

function elementStyle(item: any) {
  const options = item.options || {};
  const { width, height } = paperSize.value;
  return {
    left: `${(Number(options.left || 0) / width) * 100}%`,
    top: `${(Number(options.top || 0) / height) * 100}%`,
    width: `${Math.max((Number(options.width || 1) / width) * 100, 1)}%`,
    height: `${Math.max((Number(options.height || 1) / height) * 100, 0.6)}%`,
    color: options.color || '#334155',
    backgroundColor: options.backgroundColor || undefined,
    borderColor: options.borderColor || '#64748b',
    zIndex: options.zIndex || 1
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
