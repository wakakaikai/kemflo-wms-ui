<template>
  <div class="design-canvas" :style="{ '--form-theme': schema.formProps.themeColor }" @dragover.prevent @drop="onCanvasDrop">
    <div class="canvas-paper" :class="`is-${deviceType || 'adaptive'}`">
      <div v-if="!schema.widgets.length" class="canvas-empty">从左侧拖拽或点击字段，开始设计表单</div>

      <el-row :gutter="schema.formProps.gutter" class="canvas-list">
        <el-col v-for="(widget, index) in schema.widgets" :key="widget.id" :span="Math.min(Math.max(Number(widget.span || 24), 1), 24)">
          <CanvasWidgetItem
            :widget="widget"
            :index="index"
            :selected-id="selectedId"
            :dragging-id="draggingId"
            :drop-target-id="dropTargetId"
            :label-width="`${schema.formProps.labelWidth}px`"
            :label-position="schema.formProps.labelPosition"
            :gutter="schema.formProps.gutter"
            fill-width
            @select="emit('select', $event)"
            @copy="emit('copy', $event)"
            @remove="emit('remove', $event)"
            @add="onAdd"
            @move="onMove"
            @dragStart="draggingId = $event"
            @dragEnd="clearDragState"
            @containerDragOver="dropTargetId = $event"
          />
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CanvasWidgetItem from './CanvasWidgetItem.vue';
import type { FormSchema, FormWidget, WidgetOption } from '../types';
import { FORM_FIELD_DRAG_MIME, FORM_WIDGET_DRAG_MIME } from '../types';
import { createWidgetFromOption } from '../utils/schema';

defineProps<{
  schema: FormSchema;
  selectedId?: string;
  deviceType?: string;
}>();

const emit = defineEmits<{
  select: [id: string];
  add: [widget: FormWidget, parentId?: string, index?: number];
  move: [sourceId: string, parentId?: string, index?: number];
  copy: [id: string];
  remove: [id: string];
}>();

const draggingId = ref<string>();
const dropTargetId = ref<string>();

function clearDragState() {
  draggingId.value = undefined;
  dropTargetId.value = undefined;
}

function parseDrop(event: DragEvent) {
  const dt = event.dataTransfer;
  if (!dt) return undefined;
  const rawWidget = dt.getData(FORM_WIDGET_DRAG_MIME);
  if (rawWidget) {
    try {
      return { kind: 'add' as const, option: JSON.parse(rawWidget) as WidgetOption };
    } catch {
      return undefined;
    }
  }
  const fieldId = dt.getData(FORM_FIELD_DRAG_MIME);
  if (fieldId) return { kind: 'move' as const, fieldId };
  const plain = dt.getData('text/plain');
  if (!plain) return undefined;
  if (plain.startsWith('{')) {
    try {
      return { kind: 'add' as const, option: JSON.parse(plain) as WidgetOption };
    } catch {
      return undefined;
    }
  }
  return { kind: 'move' as const, fieldId: plain };
}

function onCanvasDrop(event: DragEvent) {
  const payload = parseDrop(event);
  if (!payload) return;
  event.preventDefault();
  if (payload.kind === 'move') {
    emit('move', payload.fieldId);
    return;
  }
  emit('add', createWidgetFromOption(payload.option));
}

function onAdd(widget: FormWidget, parentId?: string, index?: number) {
  emit('add', widget, parentId, index);
}

function onMove(sourceId: string, parentId?: string, index?: number) {
  emit('move', sourceId, parentId, index);
}
</script>

<style scoped lang="scss">
.design-canvas {
  min-height: 100%;
  padding: 16px 20px 80px;
  background: #eef1f6;
}
.canvas-paper {
  min-height: calc(100% - 8px);
  margin: 0 auto;
  padding: 8px 8px 72px;
  background: #fff;
  box-shadow: 0 1px 4px rgb(15 34 58 / 8%);
  transition: width 0.2s ease;
}
.canvas-paper.is-adaptive {
  width: 100%;
}
.canvas-paper.is-desktop {
  width: min(960px, 100%);
}
.canvas-paper.is-mobile {
  width: min(375px, 100%);
}
.canvas-empty {
  margin: 16px;
  border: 1px dashed #b7beca;
  padding: 64px 16px;
  text-align: center;
  color: #909399;
}
.canvas-list {
  width: 100%;
}
.design-canvas :deep(.el-col) {
  min-width: 0;
}
.design-canvas :deep(.canvas-item) {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-height: 54px;
  padding: 8px 8px 28px;
  border: 1px dashed transparent;
  cursor: grab;
  transition:
    border-color 0.15s,
    background 0.15s;
}
.design-canvas :deep(.canvas-item:hover) {
  border-color: #b7beca;
}
.design-canvas :deep(.canvas-item.active) {
  border-color: #8fb9e8;
  background: #b9dafc;
}
.design-canvas :deep(.canvas-item.nested) {
  margin-top: 0;
  padding-bottom: 28px;
}
.design-canvas :deep(.canvas-item.dragging) {
  opacity: 0.45;
}
.design-canvas :deep(.el-form-item) {
  width: 100%;
  margin-bottom: 8px;
}
.design-canvas :deep(.el-form-item__content) {
  width: 100%;
}
</style>
