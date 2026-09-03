<script setup lang="ts">
import type { Cell, Edge } from '@antv/x6';

interface Props {
  visible: boolean;
  cell?: Cell;
  edge?: Edge;
  left: number;
  top: number;
  labelValue: string;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  left: 0,
  top: 0,
  labelValue: ''
});

const emit = defineEmits(['hide', 'nodeEdit']);
const graph = inject('graph', ref());

const hide = () => {
  emit('hide');
};

const handleNodeDelete = () => {
  graph.value.removeNode(props.cell);
};

const handleEdgeDelete = () => {
  graph.value.removeEdge(props.edge);
};

const handleSetLabel = (label: string) => {
  props.edge?.setLabels([
    {
      attrs: { text: { text: label } }
    }
  ]);
};

onMounted(() => {
  document.addEventListener('click', () => {
    hide();
  });
  graph.value.on('node:selected', ({ cell }) => {
    emit('nodeEdit', cell);
  });
  graph.value.on('blank:click', () => {
    emit('nodeEdit', undefined);
  });
});
</script>

<template>
  <div v-if="props.visible" :style="{ left: `${props.left}px`, top: `${props.top}px` }" class="routing-menu">
    <div v-if="cell" class="routing-menu-actions">
      <el-button @click="handleNodeDelete">删除</el-button>
    </div>
    <div v-if="edge" class="routing-menu-actions">
      <el-button v-if="props.labelValue !== 'Y'" @click="handleSetLabel('Y')">设置值 Y</el-button>
      <el-button v-if="props.labelValue !== 'N'" @click="handleSetLabel('N')">设置值 N</el-button>
      <el-button v-if="props.labelValue !== ''" @click="handleSetLabel('')">取消设置值</el-button>
      <el-button @click="handleEdgeDelete">删除</el-button>
    </div>
  </div>
</template>

<style scoped>
.routing-menu {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 3000;
  padding: 6px;
  background: #fff;
  box-shadow: 0 2px 12px rgb(0 0 0 / 18%);
}

.routing-menu-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
