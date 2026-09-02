<template>
  <div class="form-designer">
    <aside class="designer-left">
      <WidgetPalette @add="handleAddWidget" />
    </aside>

    <section class="designer-center">
      <DesignCanvas :schema="schema" :selected-id="selectedId" :device-type="deviceType" @select="selectedId = $event" @add="handleAddWidget" @move="handleMoveWidget" @copy="handleCopy" @remove="handleRemove" />
    </section>

    <aside class="designer-right">
      <FormPropertyPanel v-model:device-type="deviceType" :widget="selectedWidget" :form-props="schema.formProps" />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import DesignCanvas from './components/DesignCanvas.vue';
import FormPropertyPanel from './components/FormPropertyPanel.vue';
import WidgetPalette from './components/WidgetPalette.vue';
import type { FormSchema, FormWidget, WidgetOption } from './types';
import { applyLayoutSpans, cloneWidget, createWidgetFromOption, findWidget, findWidgetContext, getContainerList, insertWidget, moveWidget, parseSchema, removeWidget, serializeSchema } from './utils/schema';

const props = defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const schema = ref<FormSchema>(parseSchema(props.modelValue));
const selectedId = ref<string>();
const deviceType = ref('adaptive');
let syncingFromParent = false;

watch(
  () => props.modelValue,
  (value) => {
    syncingFromParent = true;
    schema.value = parseSchema(value);
    syncingFromParent = false;
  }
);

watch(
  schema,
  () => {
    if (syncingFromParent) return;
    emit('update:modelValue', serializeSchema(schema.value));
  },
  { deep: true }
);

const selectedWidget = computed(() => {
  if (!selectedId.value) return null;
  return findWidget(schema.value.widgets, selectedId.value);
});

function handleAddWidget(option: WidgetOption | FormWidget, parentId?: string, index?: number) {
  const widget = 'type' in option && 'category' in option ? createWidgetFromOption(option as WidgetOption) : (option as FormWidget);
  if (!parentId) {
    insertWidget(schema.value.widgets, widget, index);
    selectedId.value = widget.id;
    return;
  }
  const target = findWidget(schema.value.widgets, parentId);
  const list = target ? getContainerList(target) : null;
  if (!target || !list) {
    insertWidget(schema.value.widgets, widget, index);
    selectedId.value = widget.id;
    return;
  }
  if (target.type === 'grid' && widget.span === 24) {
    const cols = Math.min(Math.max(Number(target.props?.cols || 2), 1), 4);
    widget.span = Math.floor(24 / cols);
  }
  insertWidget(list, widget, index);
  selectedId.value = widget.id;
}

function handleMoveWidget(sourceId: string, parentId?: string, index?: number) {
  if (!sourceId) return;
  moveWidget(schema.value.widgets, sourceId, parentId, index);
  selectedId.value = sourceId;
}

function handleCopy(id: string) {
  const ctx = findWidgetContext(schema.value.widgets, id);
  if (!ctx) return;
  const copy = cloneWidget(ctx.widget);
  ctx.list.splice(ctx.index + 1, 0, copy);
  selectedId.value = copy.id;
}

function applyQuickLayout(spans: number[]) {
  const selected = selectedWidget.value;
  if (selected?.type === 'tabs') {
    selected.children?.forEach((pane) => applyLayoutSpans(pane.children || [], spans));
    return;
  }
  const containerList = selected ? getContainerList(selected) : null;
  if (containerList) {
    applyLayoutSpans(containerList, spans);
    return;
  }
  const ctx = selected ? findWidgetContext(schema.value.widgets, selected.id) : null;
  applyLayoutSpans(ctx?.list || schema.value.widgets, spans);
}

function handleRemove(id: string) {
  removeWidget(schema.value.widgets, id);
  if (selectedId.value === id) selectedId.value = undefined;
}

function getSchema(): FormSchema {
  return schema.value;
}

function resetSchema(json?: string) {
  syncingFromParent = true;
  schema.value = parseSchema(json);
  selectedId.value = undefined;
  syncingFromParent = false;
}

defineExpose({ getSchema, resetSchema, deviceType, applyQuickLayout });
</script>

<style scoped lang="scss">
.form-designer {
  display: grid;
  grid-template-columns: 270px minmax(0, 1fr) 340px;
  height: 100%;
  min-height: 0;
  background: #eef1f6;
}
.designer-left,
.designer-right {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background: #fff;
}
.designer-left {
  border-right: 1px solid #d8dde8;
}
.designer-right {
  border-left: 1px solid #d8dde8;
}
.designer-right :deep(.property-panel) {
  flex: 1;
  min-height: 0;
}
.designer-left :deep(.widget-palette) {
  flex: 1;
  min-height: 0;
}
.designer-center {
  min-width: 0;
  overflow: auto;
}
</style>
