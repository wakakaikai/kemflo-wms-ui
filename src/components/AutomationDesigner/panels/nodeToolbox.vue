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
            class="stencil-card"
            :style="themeStyle(node.color)"
            draggable="true"
            @dragstart="handleDragStart($event, node.type)"
            @click="handleClick(node.type)"
          >
            <div class="card-icon" :style="iconStyle(node.color)">
              {{ node.label.charAt(0) }}
            </div>
            <div class="card-info">
              <div class="card-title">{{ node.label }}</div>
              <div class="card-desc">{{ node.type }}</div>
            </div>
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
import { ALL_NODE_CONFIGS, NodeCategory, NodeCategoryLabels } from '../types';

const emit = defineEmits<{
  addNode: [type: string, x: number, y: number];
}>();

const searchText = ref('');

const nodeGroups = reactive(
  Object.values(NodeCategory).map(cat => ({
    category: cat,
    label: NodeCategoryLabels[cat],
    expanded: cat === NodeCategory.TRIGGER || cat === NodeCategory.CONTROL,
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

function themeStyle(color: string) {
  return { '--accent': color };
}

function iconStyle(color: string) {
  return {
    background: color + '14',
    color,
  };
}

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
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 12px 10px;
}

/* agentFlow 风格物料卡片 */
.stencil-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #d6e4ff;
  border-radius: 8px;
  background: #fff;
  cursor: grab;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
  user-select: none;
}
.stencil-card:hover {
  border-color: var(--accent, #5f95ff);
  box-shadow: 0 2px 8px rgba(95, 149, 255, 0.12);
}
.stencil-card:active {
  cursor: grabbing;
  transform: scale(0.98);
}
.card-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}
.card-info {
  flex: 1;
  min-width: 0;
}
.card-title {
  font-size: 13px;
  font-weight: 600;
  color: #141414;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}
.card-desc {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.45);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  margin-top: 2px;
}
.search-empty {
  text-align: center;
  padding: 40px 12px;
  font-size: 12px;
  color: #c2c8d5;
}
</style>
