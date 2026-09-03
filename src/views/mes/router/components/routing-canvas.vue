<script setup lang="ts">
import { useRoutingCanvasInit } from './use-routing-cavas-init'
import { useRoutingHighlight } from './use-routing-highlight'

const emit = defineEmits(['drop', 'ready'])

const readonly = inject('readonly', ref(false))
const graph = inject('graph', ref())

const { paper, minimap, container, fitView, resize } = useRoutingCanvasInit({ readonly, graph })

useRoutingHighlight({ graph })

defineExpose({ fitView, resize })

const preventDefault = (e: DragEvent) => {
  e.preventDefault()
}

watch(graph, (value) => {
  if (value) {
    emit('ready')
  }
}, { immediate: true })
</script>

<template>
  <div
    ref="container"
    class="routing-canvas"
    @drop="(e) => emit('drop', e)"
    @dragenter="preventDefault"
    @dragover="preventDefault"
    @dragleave="preventDefault"
  >
    <div ref="paper" class="routing-paper" />
    <div ref="minimap" class="routing-minimap" />
  </div>
</template>

<style scoped>
.routing-canvas {
  position: relative;
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow: hidden;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #f5f7fa;
}

.routing-paper {
  width: 100%;
  height: 100%;
}

.routing-minimap {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 9;
  overflow: hidden;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
</style>
