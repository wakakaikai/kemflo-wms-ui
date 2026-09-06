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
  requestAnimationFrame(fitView);
};

defineExpose({ graph, fitView });
</script>

<template>
  <div class="routing-designer">
    <div class="routing-designer__body">
      <RoutingSidebar :processes="processes" @drag-start="onDragStart" />
      <section class="routing-designer__main">
        <div class="routing-designer__toolbar">
          <el-space wrap>
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
          </el-space>
          <span class="routing-designer__hint">拖拽左侧工序到画布，空白处拖动平移，Ctrl + 滚轮缩放</span>
        </div>
        <RoutingCanvas ref="canvasRef" @drop="onDrop" @ready="handleCanvasReady" />
      </section>
      <RoutingNodeProperty v-if="selectedNode" class="routing-designer__property" :routing-node="selectedNode" />
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
  display: flex;
  gap: 12px;
  height: 100%;
  min-height: 0;
}

.routing-designer__main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.routing-designer__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.routing-designer__hint {
  color: #909399;
  font-size: 12px;
}

.routing-designer__property {
  flex: 0 0 280px;
  min-width: 280px;
}
</style>
