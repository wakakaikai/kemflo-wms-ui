<script setup lang="ts">
import { Cell, Edge } from '@antv/x6';
import type { Graph } from '@antv/x6';
import type { PropType } from 'vue';
import { useDragAndDrop } from './use-drag-and-drop';
import { useRoutingCellUpdate } from './use-routing-cell-update';
import { useRoutingNodeMenu } from './use-routing-node-menu';
import type { Process } from './types';
import { useRoutingBackfill } from './use-routing-backfill';
import { fitRoutingGraphView } from './use-routing-viewport';
import { Aim, Download, ZoomIn, ZoomOut } from '@element-plus/icons-vue';
import RoutingSidebar from './routing-sidebar.vue';
import RoutingCanvas from './routing-canvas.vue';
import RoutingNodeProperty from './routing-node-property.vue';
import RoutingNodeMenu from './routing-node-menu.vue';

const props = defineProps({
  processes: {
    required: true,
    type: Array as PropType<Process[]>,
    default: () => []
  },
  definition: {
    required: true,
    type: Object,
    default: () => ({})
  },
  readonly: {
    type: Boolean as PropType<boolean>,
    default: false
  }
});

const graph = ref<Graph>();
provide('graph', graph);

provide('readonly', toRef(props, 'readonly'));

const selectedNode = ref<Cell>();
const canvasRef = ref<InstanceType<typeof RoutingCanvas>>();

useRoutingBackfill({ graph, definition: toRef(props, 'definition') });

const { addNode } = useRoutingCellUpdate({ graph });

const { onDragStart, onDrop } = useDragAndDrop({ readonly: toRef(props, 'readonly'), graph, addNode });

const { nodeVariables, menuHide } = useRoutingNodeMenu({ graph });

const handleNodeEdit = (cell: Cell) => {
  selectedNode.value = cell;
};

const handleNodeActivate = ({ node, cell }: { node?: Cell; cell?: Cell }) => {
  selectedNode.value = node || cell;
};

let unwatchGraph: (() => void) | undefined;

unwatchGraph = watch(
  graph,
  (value) => {
    if (!value) {
      selectedNode.value = undefined;
      return;
    }
    value.on('node:selected', handleNodeActivate);
    value.on('node:click', handleNodeActivate);
    value.on('cell:removed', ({ cell }) => {
      if (selectedNode.value === cell) {
        selectedNode.value = undefined;
      }
    });
    value.on('blank:click', () => {
      selectedNode.value = undefined;
    });
    unwatchGraph?.();
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  unwatchGraph?.();
});

const fitView = () => {
  fitRoutingGraphView(graph.value);
};

const zoomIn = () => {
  if (!graph.value) return;
  graph.value.zoom(0.1);
};

const zoomOut = () => {
  if (!graph.value) return;
  graph.value.zoom(-0.1);
};

const exportPng = () => {
  graph.value?.exportPNG?.('工艺路线', {
    padding: 32,
    backgroundColor: '#ffffff'
  });
};

const handleCanvasReady = async () => {
  await nextTick();
  canvasRef.value?.resize();
  if (!props.definition?.routerContent) {
    requestAnimationFrame(fitView);
  }
};

const refreshCanvasLayout = async () => {
  await nextTick();
  canvasRef.value?.resizeImmediate?.();
};

watch(selectedNode, () => {
  refreshCanvasLayout();
});

defineExpose({ graph, fitView });
</script>

<template>
  <div class="routing-designer">
    <div class="routing-designer__body">
      <RoutingSidebar :processes="processes" @drag-start="onDragStart" />
      <section class="routing-designer__main">
        <RoutingCanvas ref="canvasRef" @drop="onDrop" @ready="handleCanvasReady">
          <template #toolbar>
            <div class="routing-designer__toolbar">
              <el-tooltip content="适应画布" placement="top">
                <el-button :icon="Aim" circle size="small" @click="fitView" />
              </el-tooltip>
              <el-tooltip content="放大" placement="top">
                <el-button :icon="ZoomIn" circle size="small" @click="zoomIn" />
              </el-tooltip>
              <el-tooltip content="缩小" placement="top">
                <el-button :icon="ZoomOut" circle size="small" @click="zoomOut" />
              </el-tooltip>
              <el-tooltip content="截图" placement="top">
                <el-button :icon="Download" circle size="small" @click="exportPng" />
              </el-tooltip>
            </div>
          </template>
        </RoutingCanvas>
      </section>
      <aside class="routing-designer__property">
        <RoutingNodeProperty :routing-node="selectedNode" />
      </aside>
    </div>
    <RoutingNodeMenu :visible="nodeVariables.menuVisible" :cell="nodeVariables.menuCell as Cell" :edge="nodeVariables.menuEdge as Edge" :label-value="nodeVariables.labelValue" :left="nodeVariables.pageX" :top="nodeVariables.pageY" @hide="menuHide" @node-edit="handleNodeEdit" />
  </div>
</template>

<style scoped>
.routing-designer {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.routing-designer__body {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr) 240px;
  gap: 0;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background: #fff;
}

.routing-designer__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  border-left: 1px solid #e8e8e8;
  border-right: 1px solid #e8e8e8;
}

.routing-designer__toolbar {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
  display: flex;
  gap: 6px;
  padding: 4px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.routing-designer__toolbar :deep(.el-button) {
  margin: 0;
}

.routing-designer__property {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: #fff;
}
</style>
