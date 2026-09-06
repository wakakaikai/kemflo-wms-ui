<script setup lang="ts">
import type { Cell, Edge } from '@antv/x6';
import { EDGE } from './routing-config';

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
  graph.value?.removeNode(props.cell);
  hide();
};

const handleEdgeDelete = () => {
  graph.value?.removeEdge(props.edge);
  hide();
};

const handleSetLabel = (label: string) => {
  props.edge?.setLabels([
    {
      ...EDGE.defaultLabel,
      attrs: {
        ...EDGE.defaultLabel.attrs,
        text: {
          ...EDGE.defaultLabel.attrs.text,
          text: label
        },
        label: {
          ...EDGE.defaultLabel.attrs.label,
          text: label
        }
      }
    }
  ]);
  hide();
};

onMounted(() => {
  document.addEventListener('click', hide);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', hide);
});
</script>

<template>
  <div v-if="props.visible" :style="{ left: `${props.left}px`, top: `${props.top}px` }" class="routing-menu" @click.stop>
    <div v-if="cell" class="routing-menu-actions">
      <el-button @click="handleNodeDelete">删除</el-button>
    </div>
    <div v-if="edge" class="routing-menu-actions">
      <el-button v-if="props.labelValue !== 'Y'" @click="handleSetLabel('Y')">设置值【Y】</el-button>
      <el-button v-if="props.labelValue !== 'N'" @click="handleSetLabel('N')">设置值【N】</el-button>
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
  min-width: 116px;
  padding: 6px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 6px 18px rgb(0 0 0 / 14%);
}

.routing-menu-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.routing-menu-actions :deep(.el-button) {
  justify-content: flex-start;
  width: 100%;
  height: 30px;
  padding: 0 12px;
  margin-left: 0;
  border-radius: 3px;
  font-size: 12px;
}
</style>
