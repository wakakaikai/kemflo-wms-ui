<template>
  <div class="node-toolbox">
    <div class="toolbox-search">
      <el-input
        v-model="searchText"
        placeholder="搜索节点..."
        size="small"
        clearable
        prefix-icon="Search"
      />
    </div>
    <div class="toolbox-scroll">
      <div v-for="group in filteredGroups" :key="group.category" class="toolbox-group">
        <div class="group-title" @click="group.expanded = !group.expanded">
          <span class="group-label">{{ group.label }}</span>
          <span class="group-count">{{ group.nodes.length }}</span>
          <el-icon class="group-arrow" :class="{ collapsed: !group.expanded }">
            <ArrowDown />
          </el-icon>
        </div>
        <div v-show="group.expanded" class="group-nodes">
          <div
            v-for="node in group.nodes"
            :key="node.type"
            class="stencil-item"
            draggable="true"
            @dragstart="handleDragStart($event, node.type)"
            @click="handleClick(node.type)"
          >
            <span
              class="stencil-icon"
              :style="{ background: getCategoryColor(node.category, node.color) }"
            >{{ getNodeIconChar(node.type, node.label) }}</span>
            <span class="stencil-label">{{ node.label }}</span>
          </div>
        </div>
      </div>
      <div v-if="filteredGroups.every(g => g.nodes.length === 0)" class="search-empty">
        未找到匹配的节点
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowDown } from '@element-plus/icons-vue';
import { reactive, computed, ref } from 'vue';
import { ALL_NODE_CONFIGS, NodeCategory } from '../types';
import { CATEGORY_THEME, getCategoryColor, getNodeIconChar } from '../config/nodeIcons';

const emit = defineEmits<{
  addNode: [type: string, x: number, y: number];
}>();

const searchText = ref('');

const nodeGroups = reactive(
  Object.values(NodeCategory).map(cat => ({
    category: cat,
    label: CATEGORY_THEME[cat]?.label || cat,
    expanded: true,
    nodes: ALL_NODE_CONFIGS.filter(n => n.category === cat),
  }))
);

const filteredGroups = computed(() => {
  if (!searchText.value) return nodeGroups;
  const q = searchText.value.toLowerCase();
  return nodeGroups.map(g => ({
    ...g,
    nodes: g.nodes.filter(n =>
      n.label.toLowerCase().includes(q) || n.type.toLowerCase().includes(q)
    ),
  }));
});

function handleDragStart(event: DragEvent, type: string) {
  event.dataTransfer?.setData('application/x6-node-type', type);
  event.dataTransfer!.effectAllowed = 'copy';
}

function handleClick(type: string) {
  emit('addNode', type, 280 + Math.random() * 120, 120 + Math.random() * 160);
}
</script>

<style scoped>
.node-toolbox {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #fff;
}
.toolbox-search {
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.toolbox-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0 12px;
}
.toolbox-group {
  margin-bottom: 2px;
}
.group-title {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px 6px;
  cursor: pointer;
  user-select: none;
  font-size: 12px;
  color: #8c8c8c;
  font-weight: 600;
}
.group-title:hover {
  color: #5f95ff;
}
.group-label {
  letter-spacing: 0.02em;
}
.group-count {
  font-size: 11px;
  color: #c2c8d5;
  font-weight: 400;
  margin-left: auto;
}
.group-arrow {
  font-size: 12px;
  transition: transform 0.2s;
  color: #c2c8d5;
}
.group-arrow.collapsed {
  transform: rotate(-90deg);
}
.group-nodes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px 4px;
  padding: 4px 10px 10px;
}

.stencil-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 6px;
  border-radius: 6px;
  cursor: grab;
  transition: background 0.12s;
  user-select: none;
}
.stencil-item:hover {
  background: #f5f5f5;
}
.stencil-item:active {
  cursor: grabbing;
}
.stencil-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
  line-height: 1;
}
.stencil-label {
  font-size: 12px;
  color: #262626;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.search-empty {
  text-align: center;
  padding: 40px 12px;
  font-size: 12px;
  color: #c2c8d5;
}
</style>
