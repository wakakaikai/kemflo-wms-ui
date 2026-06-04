<template>
  <div class="widget-panel">
    <template v-for="cat in WIDGET_CATEGORY_ORDER" :key="cat">
      <section v-if="(grouped.get(cat) ?? []).length" class="panel-section">
        <div class="section-title">{{ categoryTitle(cat) }}</div>
        <div class="widget-grid">
          <button
            v-for="(w, idx) in grouped.get(cat) ?? []"
            :key="`${cat}-${idx}-${w.titleKey || w.title || w.type}`"
            type="button"
            class="widget-tile"
            draggable="true"
            @dragstart="onPaletteDragStart($event, w)"
          >
            <el-icon v-if="iconFor(w)" class="tile-icon">
              <component :is="iconFor(w)" />
            </el-icon>
            <span class="tile-label">{{ widgetLabel(w) }}</span>
          </button>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Document, Picture, Grid, Operation } from '@element-plus/icons-vue';
import type { Component } from 'vue';
import { PRINT_WIDGET_DRAG_MIME, type WidgetCategory, type WidgetOption } from '../../types';
import { is2dBarcodeType } from '../../const/lodopBarcodeTypes';
import { WIDGET_CATEGORY_ORDER } from './panelText';
import IconBarcode1d from './icons/IconBarcode1d.vue';
import IconBarcode2d from './icons/IconBarcode2d.vue';
import IconRect from './icons/IconRect.vue';
import IconEllipse from './icons/IconEllipse.vue';
import IconHLine from './icons/IconHLine.vue';
import IconVLine from './icons/IconVLine.vue';

const { t } = useI18n();

function categoryTitle(cat: WidgetCategory): string {
  return t(`printDesigner.panel.${cat}`);
}

function widgetLabel(w: WidgetOption): string {
  const plain = w.title?.trim();
  if (plain) return plain;
  if (w.titleKey) return t(w.titleKey);
  return '';
}

const props = defineProps<{
  options: WidgetOption[];
}>();

function onPaletteDragStart(e: DragEvent, w: WidgetOption) {
  const dt = e.dataTransfer;
  if (!dt) return;
  try {
    const payload = JSON.stringify(w);
    dt.setData(PRINT_WIDGET_DRAG_MIME, payload);
    dt.setData('text/plain', payload);
    dt.effectAllowed = 'copy';
  } catch {
    e.preventDefault();
  }
}

const grouped = computed(() => {
  const map = new Map<WidgetCategory, WidgetOption[]>();
  for (const c of WIDGET_CATEGORY_ORDER) {
    map.set(c, []);
  }
  for (const w of props.options) {
    let cat = (w.category || 'common') as WidgetCategory;
    if (w.type === 'bar-code' && (cat === 'common' || cat === 'barcode1d' || cat === 'barcode2d')) {
      cat = 'barcode';
    }
    if (!WIDGET_CATEGORY_ORDER.includes(cat)) {
      cat = 'other';
    }
    map.get(cat)!.push(w);
  }
  return map;
});

function iconFor(w: WidgetOption): Component | null {
  const tk = w.titleKey || '';
  if (tk.includes('verticalRule')) return IconVLine;
  if (tk.includes('horizontalRule')) return IconHLine;
  switch (w.type) {
    case 'braid-txt':
      return Document;
    case 'braid-image':
      return Picture;
    case 'braid-table':
      return Grid;
    case 'braid-html':
      if (tk.includes('pageNoLodop')) return Operation;
      return Operation;
    case 'bar-code':
      return is2dBarcodeType(w.style?.codeType) ? IconBarcode2d : IconBarcode1d;
    case 'braid-hline':
      return IconHLine;
    case 'braid-vline':
      return IconVLine;
    case 'braid-rect':
      return IconRect;
    case 'braid-border':
      return IconRect;
    case 'braid-ellipse':
      return IconEllipse;
    default:
      return Operation;
  }
}
</script>

<style scoped lang="scss">
.widget-panel {
  padding: 0 2px;
}
.panel-section {
  margin-bottom: 14px;
}
.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.widget-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.widget-tile {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 6px 8px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-fill-color-blank);
  cursor: grab;
  text-align: left;
  font-size: 12px;
  color: var(--el-text-color-primary);
  transition:
    border-color 0.15s,
    background 0.15s;
}
.widget-tile:hover {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}
.widget-tile:active {
  cursor: grabbing;
}
.tile-icon {
  flex-shrink: 0;
  font-size: 18px;
  color: var(--el-color-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.tile-label {
  flex: 1;
  line-height: 1.3;
  word-break: break-word;
}
</style>
