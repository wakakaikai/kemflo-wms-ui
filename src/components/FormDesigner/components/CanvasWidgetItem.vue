<template>
  <div
    class="canvas-item"
    :class="{ active: widget.id === selectedId, nested, dragging: draggingId === widget.id }"
    :style="{ width: fillWidth ? '100%' : getWidgetWidth(widget) }"
    draggable="true"
    @click.stop="emit('select', widget.id)"
    @dragstart.stop="onDragStart"
    @dragend="emit('dragEnd')"
    @dragover.prevent="onItemDragOver"
    @drop.stop="onItemDrop"
  >
    <WidgetPreview
      :widget="widget"
      :label-width="labelWidth"
      :label-position="labelPosition"
      :gutter="gutter"
      :drop-target-id="dropTargetId"
      @container-drop="onContainerDrop"
      @container-drag-over="emit('containerDragOver', $event)"
    >
      <template #child="{ widget: child, parentId, index }">
        <CanvasWidgetItem
          :widget="child"
          :parent-id="parentId"
          :index="index"
          :selected-id="selectedId"
          :dragging-id="draggingId"
          :drop-target-id="dropTargetId"
          :label-width="labelWidth"
          :label-position="labelPosition"
          :gutter="gutter"
          nested
          fill-width
          @select="emit('select', $event)"
          @copy="emit('copy', $event)"
          @remove="emit('remove', $event)"
          @add="forwardAdd"
          @move="forwardMove"
          @dragStart="emit('dragStart', $event)"
          @dragEnd="emit('dragEnd')"
          @containerDragOver="emit('containerDragOver', $event)"
        />
      </template>
      <template #children="{ widgets: children, parentId }">
        <CanvasWidgetItem
          v-for="(child, childIndex) in children"
          :key="child.id"
          :widget="child"
          :parent-id="parentId"
          :index="childIndex"
          :selected-id="selectedId"
          :dragging-id="draggingId"
          :drop-target-id="dropTargetId"
          :label-width="labelWidth"
          :label-position="labelPosition"
          :gutter="gutter"
          nested
          @select="emit('select', $event)"
          @copy="emit('copy', $event)"
          @remove="emit('remove', $event)"
          @add="forwardAdd"
          @move="forwardMove"
          @dragStart="emit('dragStart', $event)"
          @dragEnd="emit('dragEnd')"
          @containerDragOver="emit('containerDragOver', $event)"
        />
      </template>
    </WidgetPreview>
    <WidgetActions @copy="emit('copy', widget.id)" @remove="emit('remove', widget.id)" @mousedown.stop />
  </div>
</template>

<script setup lang="ts">
import WidgetPreview from './WidgetPreview.vue';
import WidgetActions from './WidgetActions.vue';
import type { FormWidget, WidgetOption } from '../types';
import { FORM_FIELD_DRAG_MIME, FORM_WIDGET_DRAG_MIME } from '../types';
import { createWidgetFromOption } from '../utils/schema';

defineOptions({ name: 'CanvasWidgetItem' });

const props = defineProps<{
  widget: FormWidget;
  parentId?: string;
  index?: number;
  selectedId?: string;
  draggingId?: string;
  dropTargetId?: string;
  labelWidth?: string;
  labelPosition?: 'left' | 'right' | 'top';
  gutter?: number;
  nested?: boolean;
  fillWidth?: boolean;
}>();

const emit = defineEmits<{
  select: [id: string];
  copy: [id: string];
  remove: [id: string];
  add: [widget: FormWidget, parentId?: string, index?: number];
  move: [sourceId: string, parentId?: string, index?: number];
  dragStart: [id: string];
  dragEnd: [];
  containerDragOver: [targetId: string];
}>();

function getWidgetWidth(widget: FormWidget) {
  const span = Math.min(Math.max(Number(widget.span || 24), 1), 24);
  return `${(span / 24) * 100}%`;
}

function onDragStart(event: DragEvent) {
  const target = event.target as HTMLElement;
  if (target.closest('.widget-actions, .el-tabs__item, .el-tabs__nav, button, input, textarea, .el-input, .el-select, a')) {
    event.preventDefault();
    return;
  }
  const dt = event.dataTransfer;
  if (!dt) return;
  dt.setData(FORM_FIELD_DRAG_MIME, props.widget.id);
  dt.setData('text/plain', props.widget.id);
  dt.effectAllowed = 'move';
  emit('dragStart', props.widget.id);
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

function dispatchDrop(event: DragEvent, parentId: string | undefined, index?: number) {
  event.preventDefault();
  const payload = parseDrop(event);
  if (!payload) return;
  if (payload.kind === 'move') {
    if (payload.fieldId === props.widget.id && parentId === props.parentId) return;
    emit('move', payload.fieldId, parentId, index);
    return;
  }
  emit('add', createWidgetFromOption(payload.option), parentId, index);
}

function onItemDragOver(event: DragEvent) {
  if (!event.dataTransfer) return;
  event.dataTransfer.dropEffect = event.dataTransfer.effectAllowed === 'move' ? 'move' : 'copy';
}

function onItemDrop(event: DragEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const after = event.clientY > rect.top + rect.height / 2;
  const currentIndex = Number(props.index ?? 0);
  dispatchDrop(event, props.parentId, after ? currentIndex + 1 : currentIndex);
}

function onContainerDrop(targetId: string, event: DragEvent) {
  dispatchDrop(event, targetId);
}

function forwardAdd(widget: FormWidget, parentId?: string, index?: number) {
  emit('add', widget, parentId, index);
}

function forwardMove(sourceId: string, parentId?: string, index?: number) {
  emit('move', sourceId, parentId, index);
}
</script>
