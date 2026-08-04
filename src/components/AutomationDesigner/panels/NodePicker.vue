<template>
  <teleport to="body">
    <div v-if="visible" class="node-picker-overlay" @click.self="close" @contextmenu.prevent="close">
      <div ref="panelRef" class="node-picker-panel" :style="panelStyle">
        <div class="picker-header">
          <span class="picker-title">选择节点</span>
          <button class="picker-close" @click="close">
            <el-icon :size="14"><Close /></el-icon>
          </button>
        </div>
        <div class="picker-search">
          <el-input
            v-model="searchText"
            placeholder="搜索节点类型..."
            size="small"
            clearable
            prefix-icon="Search"
            ref="searchRef"
          />
        </div>
        <div class="picker-body">
          <div v-for="group in filteredGroups" :key="group.category" class="picker-group">
            <div class="picker-group-title">{{ group.label }}</div>
            <div
              v-for="node in group.nodes"
              :key="node.type"
              class="picker-card"
              @click="selectNode(node.type)"
            >
              <div class="picker-icon" :style="{ background: node.color + '14', color: node.color }">
                {{ node.label.charAt(0) }}
              </div>
              <div class="picker-info">
                <span class="picker-label">{{ node.label }}</span>
                <span class="picker-type">{{ node.type }}</span>
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
import { Close } from '@element-plus/icons-vue';
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
  const pw = panel.offsetWidth || 300;
  const ph = panel.offsetHeight || 420;
  const gap = 8;

  let left = props.anchorRect.x + (props.anchorRect.width || 0) / 2 - pw / 2;
  let top = props.anchorRect.y + (props.anchorRect.height || 0) + gap;

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
  inset: 0;
  z-index: 2000;
  background: transparent;
}
.node-picker-panel {
  position: absolute;
  width: 300px;
  max-height: 440px;
  background: #fff;
  border: 1px solid #dfe3e8;
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid #f0f0f0;
}
.picker-title {
  font-size: 14px;
  font-weight: 600;
  color: #141414;
}
.picker-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #8c8c8c;
  cursor: pointer;
}
.picker-close:hover {
  background: #f5f5f5;
  color: #141414;
}
.picker-search {
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
}
.picker-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0 12px;
}
.picker-group {
  margin-bottom: 4px;
}
.picker-group-title {
  padding: 8px 16px 6px;
  font-size: 11px;
  font-weight: 600;
  color: #8c8c8c;
  letter-spacing: 0.04em;
}
.picker-card {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 10px 6px;
  padding: 10px 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.12s, background 0.12s, box-shadow 0.12s;
}
.picker-card:hover {
  border-color: #5f95ff;
  background: #fafcff;
  box-shadow: 0 2px 8px rgba(95, 149, 255, 0.1);
}
.picker-icon {
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
.picker-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.picker-label {
  font-size: 13px;
  font-weight: 600;
  color: #141414;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.picker-type {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.45);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.picker-empty {
  text-align: center;
  padding: 36px 14px;
  font-size: 12px;
  color: #c2c8d5;
}
</style>
