<template>
  <div class="node-toolbox">
    <div class="toolbox-search">
      <el-input v-model="searchText" placeholder="搜索节点..." size="small" clearable prefix-icon="Search" />
    </div>
    <div class="toolbox-scroll">
      <div v-for="group in filteredGroups" :key="group.category" class="toolbox-group">
        <div class="group-title" @click="group.expanded = !group.expanded">
          <span class="group-label">{{ group.label }}</span>
          <div class="group-count">{{ group.nodes.length }}</div>
          <el-icon :class="{ rotated: !group.expanded }"><ArrowDown /></el-icon>
        </div>
        <template v-if="group.expanded">
          <div
            v-for="node in group.nodes"
            :key="node.type"
            class="toolbox-node"
            draggable="true"
            @dragstart="handleDragStart($event, node.type)"
            @click="handleClick(node.type)"
          >
            <span class="node-dot" :style="{ background: node.color }"></span>
            <span class="node-icon" :style="{ background: node.color + '15', color: node.color }">
              {{ node.label.charAt(0) }}
            </span>
            <div class="node-info">
              <span class="node-label">{{ node.label }}</span>
            </div>
          </div>
        </template>
      </div>
      <div v-if="filteredGroups.every(g => g.nodes.length === 0)" class="search-empty">
        未找到匹配的节点
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref } from 'vue';
import { ALL_NODE_CONFIGS, NodeCategory, NodeCategoryLabels } from '../types';

const emit = defineEmits<{
  addNode: [type: string, x: number, y: number];
}>();

const searchText = ref('');

const nodeGroups = reactive(
  Object.values(NodeCategory).map(cat => ({
    category: cat,
    label: NodeCategoryLabels[cat],
    expanded: true,
    nodes: ALL_NODE_CONFIGS.filter(n => n.category === cat),
  }))
);

const filteredGroups = computed(() => {
  if (!searchText.value) return nodeGroups;
  const q = searchText.value.toLowerCase();
  return nodeGroups.map(g => ({
    ...g,
    nodes: g.nodes.filter(n => n.label.toLowerCase().includes(q) || n.type.toLowerCase().includes(q)),
  }));
});

function handleDragStart(event: DragEvent, type: string) {
  event.dataTransfer?.setData('application/x6-node-type', type);
  event.dataTransfer!.effectAllowed = 'copy';
}

function handleClick(type: string) {
  emit('addNode', type, 300 + Math.random() * 200, 100 + Math.random() * 200);
}
</script>

<style scoped>
.node-toolbox { display: flex; flex-direction: column; height: 100%; }
.toolbox-search { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; }
.toolbox-scroll { flex: 1; overflow-y: auto; padding: 4px 0; }
.toolbox-group { margin-bottom: 2px; }
.group-title {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px; cursor: pointer; user-select: none;
  font-size: 12px; color: #4e5969;
}
.group-title:hover { background: #f7f8fa; }
.group-label { font-weight: 600; }
.group-count {
  font-size: 11px; color: #c9cdd4; font-weight: 400;
  margin-left: auto;
}
.group-title .el-icon { font-size: 12px; transition: transform 0.2s; color: #86909c; }
.group-title .rotated { transform: rotate(-90deg); }
.toolbox-node {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 12px 7px 20px; margin: 1px 4px;
  border-radius: 6px; cursor: pointer;
  transition: background 0.15s;
}
.toolbox-node:hover { background: #f0f5ff; }
.toolbox-node:active { background: #e8f0fe; }
.node-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.node-icon {
  width: 26px; height: 26px; display: flex; align-items: center;
  justify-content: center; border-radius: 6px;
  font-size: 11px; font-weight: bold; flex-shrink: 0;
}
.node-info { flex: 1; min-width: 0; }
.node-label { font-size: 12px; color: #1d2129; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.search-empty { text-align: center; padding: 32px 12px; font-size: 12px; color: #c9cdd4; }
</style>