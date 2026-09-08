<script setup lang="ts">
import { useRoutingCanvasInit } from './use-routing-cavas-init';
import { useRoutingHighlight } from './use-routing-highlight';

const emit = defineEmits(['drop', 'ready']);

const readonly = inject('readonly', ref(false));
const graph = inject('graph', ref());

const { paper, minimap, container, fitView, resize, resizeImmediate } = useRoutingCanvasInit({ readonly, graph });

useRoutingHighlight({ graph });

defineExpose({ fitView, resize, resizeImmediate });

const preventDefault = (e: DragEvent) => {
  e.preventDefault();
};

watch(
  graph,
  (value) => {
    if (value) {
      emit('ready');
    }
  },
  { immediate: true }
);
</script>

<template>
  <div ref="container" class="routing-canvas" @drop="(e) => emit('drop', e)" @dragenter="preventDefault" @dragover="preventDefault" @dragleave="preventDefault">
    <slot name="toolbar" />
    <div ref="paper" class="routing-paper" />
    <div class="routing-minimap-panel">
      <div ref="minimap" class="routing-minimap" />
    </div>
  </div>
</template>

<style scoped>
.routing-canvas {
  position: relative;
  flex: 1;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: #fff;
}

.routing-paper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.routing-paper :deep(.x6-graph-scroller.routing-scroller) {
  box-sizing: border-box;
  overflow: auto;
  background: #fff;
  outline: none;
}

.routing-paper :deep(.x6-graph-scroller-content) {
  background: #fff;
}

.routing-paper :deep(.x6-graph-scroller-pannable[data-panning='false']) {
  cursor: grab;
}

.routing-paper :deep(.x6-graph-scroller-pannable[data-panning='true']) {
  cursor: grabbing;
  user-select: none;
}

.routing-minimap-panel {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 9;
  width: 216px;
  padding: 8px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.routing-minimap {
  width: 200px;
  height: 120px;
  overflow: hidden;
  border: 1px solid #dcdfe6;
  background: #fff;
}

.routing-minimap :deep(.x6-widget-minimap-viewport) {
  border: 2px solid #409eff;
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.16);
}
</style>
