<template>
  <div class="widget-palette">
    <template v-for="cat in WIDGET_CATEGORY_ORDER" :key="cat">
      <section class="palette-section">
        <div class="section-title">{{ WIDGET_CATEGORY_LABEL[cat] }}</div>
        <div class="widget-grid">
          <button v-for="item in grouped.get(cat) ?? []" :key="item.type" type="button" class="widget-tile" draggable="true" @dragstart="onDragStart($event, item)" @click="emit('add', item)">
            <el-icon class="tile-icon"><component :is="iconMap[item.icon || 'EditPen']" /></el-icon>
            <span class="tile-label">{{ item.label }}</span>
          </button>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ArrowDown, Brush, Calendar, CircleCheck, Clock, Coin, CollectionTag, Connection, Crop, Document, DocumentAdd, EditPen, Edit, Files, Finished, Grid, Iphone, Location, MagicStick, MapLocation, Menu, Message, Memo, Minus, Money, Odometer, Picture, Pointer, Postcard, Star, SwitchButton, Upload } from '@element-plus/icons-vue';
import type { Component } from 'vue';
import { FORM_WIDGET_DRAG_MIME, type WidgetOption } from '../types';
import { WIDGET_CATEGORY_LABEL, WIDGET_CATEGORY_ORDER, WIDGET_OPTIONS } from '../const/widgets';

const emit = defineEmits<{ add: [option: WidgetOption] }>();

const iconMap: Record<string, Component> = {
  EditPen,
  Document,
  DocumentAdd,
  Odometer,
  Money,
  CircleCheck,
  Finished,
  Clock,
  Calendar,
  Star,
  Brush,
  ArrowDown,
  SwitchButton,
  Minus,
  Iphone,
  Message,
  Picture,
  Upload,
  Edit,
  Memo,
  Pointer,
  Connection,
  MapLocation,
  Location,
  Coin,
  CollectionTag,
  Files,
  MagicStick,
  Crop,
  Grid,
  Postcard,
  Menu
};

const grouped = computed(() => {
  const map = new Map<string, WidgetOption[]>();
  for (const cat of WIDGET_CATEGORY_ORDER) map.set(cat, []);
  for (const item of WIDGET_OPTIONS) {
    map.get(item.category)?.push(item);
  }
  return map;
});

function onDragStart(event: DragEvent, option: WidgetOption) {
  const dt = event.dataTransfer;
  if (!dt) return;
  const payload = JSON.stringify(option);
  dt.setData(FORM_WIDGET_DRAG_MIME, payload);
  dt.setData('text/plain', payload);
  dt.effectAllowed = 'copy';
}
</script>

<style scoped lang="scss">
.widget-palette {
  height: 100%;
  overflow: auto;
  padding: 10px 12px 16px;
}
.palette-section {
  margin-bottom: 18px;
}
.section-title {
  margin-bottom: 10px;
  color: #303133;
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
}
.widget-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.widget-tile {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 0;
  background: #f2f5fb;
  cursor: grab;
  text-align: left;
  font-size: 12px;
  color: #1f2d3d;
}
.widget-tile:hover {
  border-color: #7eb6ff;
  background: #eaf3ff;
}
.tile-icon {
  color: #1f2d3d;
  font-size: 14px;
}
.tile-label {
  line-height: 1.3;
}
</style>
