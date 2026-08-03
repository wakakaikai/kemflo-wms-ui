<template>
  <teleport to="body">
    <div v-if="visible" class="node-picker-overlay" @click.self="close" @contextmenu.prevent="close">
      <div ref="panelRef" class="node-picker-panel" :style="panelStyle">
        <div class="picker-header">
          <span class="picker-title">选择节点</span>
          <el-button size="small" circle text @click="close">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
        <div class="picker-search">
          <el-input v-model="searchText" placeholder="搜索节点类型..." size="small" clearable prefix-icon="Search" ref="searchRef" />
        </div>
        <div class="picker-body">
          <div v-for="group in filteredGroups" :key="group.category" class="picker-group">
            <div class="picker-group-title">
              <span>{{ group.label }}</span>
              <span class="picker-group-count">{{ group.nodes.length }}</span>
            </div>
            <div
              v-for="node in group.nodes"
              :key="node.type"
              class="picker-node"
              @click="selectNode(node.type)"
            >
              <span class="picker-node-dot" :style="{ background: node.color }"></span>
              <span class="picker-node-icon" :style="{ background: node.color + '15', color: node.color }">
                {{ node.label.charAt(0) }}
              </span>
              <div class="picker-node-info">
                <span class="picker-node-label">{{ node.label }}</span>
                <span class="picker-node-type">{{ node.type }}</span>
              </div>
            </div>
          </div>
          <div v-if="filteredGroups.every(g => g.nodes.length === 0)" class="picker-empty">
            未找到匹配的节点
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue';
import { ALL_NODE_CONFIGS, NodeCategory, NodeCategoryLabels } from '../types';

const props = defineProps<{
  visible: boolean;
  anchorRect?: { x: number; y: number; width?: number; height?: number };
}>();

const emit = defineEmits<{
  close: [];
  select: [type: string];
}>();

const searchText = ref('');
const searchRef = ref();
const panelRef = ref<HTMLDivElement>();
const panelStyle = ref<Record<string, string>>({});

const nodeGroups = reactive(
  Object.values(NodeCategory).map(cat => ({
    category: cat,
    label: NodeCategoryLabels[cat],
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

watch(() => props.visible, async (v) => {
  if (v) {
    searchText.value = '';
    await nextTick();
    searchRef.value?.focus();
    await nextTick();
    computePosition();
  }
});

function computePosition() {
  if (!props.anchorRect || !panelRef.value) return;
  const panel = panelRef.value;
  const pw = panel.offsetWidth || 280;
  const ph = panel.offsetHeight || 400;
  const gap = 8;

  let left = props.anchorRect.x + (props.anchorRect.width || 0) / 2 - pw / 2;
  let top = props.anchorRect.y + (props.anchorRect.height || 0) + gap;

  // 边界避让
  if (left < 8) left = 8;
  if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8;
  if (top + ph > window.innerHeight - 8) {
    top = props.anchorRect.y - ph - gap;
  }
  if (top < 8) top = 8;

  panelStyle.value = { left: left + 'px', top: top + 'px' };
}

function selectNode(type: string) {
  emit('select', type);
  emit('close');
}

function close() {
  emit('close');
}
</script>

<style scoped>
.node-picker-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 2000;
  background: transparent;
}
.node-picker-panel {
  position: absolute;
  width: 280px;
  max-height: 420px;
  background: #fff;
  border: 1px solid #e5e6e8;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid #f0f0f0;
}
.picker-title { font-size: 13px; font-weight: 600; color: #1d2129; }
.picker-search { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; }
.picker-body { flex: 1; overflow-y: auto; padding: 4px 0; }
.picker-group { margin-bottom: 2px; }
.picker-group-title {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 14px; font-size: 11px; font-weight: 600; color: #86909c;
  text-transform: uppercase; letter-spacing: 0.5px;
}
.picker-group-count { font-size: 10px; color: #c9cdd4; font-weight: 400; }
.picker-node {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 14px; margin: 1px 6px;
  border-radius: 6px; cursor: pointer;
  transition: background 0.12s;
}
.picker-node:hover { background: #f0f5ff; }
.picker-node:active { background: #e8f0fe; }
.picker-node-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.picker-node-icon {
  width: 24px; height: 24px; display: flex; align-items: center;
  justify-content: center; border-radius: 5px;
  font-size: 11px; font-weight: bold; flex-shrink: 0;
}
.picker-node-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.picker-node-label { font-size: 12px; font-weight: 500; color: #1d2129; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.picker-node-type { font-size: 10px; color: #c9cdd4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.picker-empty { text-align: center; padding: 32px 14px; font-size: 12px; color: #c9cdd4; }
</style>