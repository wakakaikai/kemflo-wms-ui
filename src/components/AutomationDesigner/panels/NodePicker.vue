<template>
  <teleport to="body">
    <transition name="picker-fade">
      <div v-if="visible" class="action-picker-mask" @click.self="close">
        <div class="action-picker" role="dialog" aria-modal="true">
          <div class="action-picker-header">
            <span class="action-picker-title">选择一个动作</span>
            <button class="action-picker-close" aria-label="关闭" @click="close">×</button>
          </div>

          <div class="action-picker-search">
            <el-input
              v-model="searchText"
              placeholder="搜索动作..."
              size="default"
              clearable
              prefix-icon="Search"
              ref="searchRef"
            />
          </div>

          <div class="action-picker-body">
            <div v-for="group in filteredGroups" :key="group.category" class="action-group">
              <div class="action-group-head" @click="toggleGroup(group.category)">
                <el-icon class="action-group-arrow" :class="{ collapsed: !expanded[group.category] }">
                  <ArrowDown />
                </el-icon>
                <span class="action-group-title">{{ group.label }}</span>
              </div>
              <div v-show="expanded[group.category]" class="action-grid">
                <button
                  v-for="node in group.nodes"
                  :key="node.type"
                  type="button"
                  class="action-item"
                  @click="selectNode(node.type)"
                >
                  <span
                    class="action-icon"
                    :style="{ background: getCategoryColor(node.category, node.color) }"
                  >{{ getNodeIconChar(node.type, node.label) }}</span>
                  <span class="action-label">{{ node.label }}</span>
                </button>
              </div>
            </div>
            <div v-if="filteredGroups.every(g => g.nodes.length === 0)" class="action-empty">
              未找到匹配的动作
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue';
import { ArrowDown } from '@element-plus/icons-vue';
import { ALL_NODE_CONFIGS, NodeCategory, NodeCategoryLabels } from '../types';
import { CATEGORY_THEME, getCategoryColor, getNodeIconChar } from '../config/nodeIcons';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  close: [];
  select: [type: string];
}>();

const searchText = ref('');
const searchRef = ref();

const expanded = reactive<Record<string, boolean>>(
  Object.values(NodeCategory).reduce((acc, cat) => {
    acc[cat] = true;
    return acc;
  }, {} as Record<string, boolean>)
);

const nodeGroups = reactive(
  Object.values(NodeCategory).map(cat => ({
    category: cat,
    label: CATEGORY_THEME[cat]?.label || NodeCategoryLabels[cat],
    nodes: ALL_NODE_CONFIGS.filter(n => n.category === cat && n.type !== 'END'),
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

watch(() => searchText.value, (v) => {
  if (v) {
    Object.keys(expanded).forEach(k => { expanded[k] = true; });
  }
});

watch(() => props.visible, async (v) => {
  if (v) {
    searchText.value = '';
    await nextTick();
    searchRef.value?.focus();
  }
});

function toggleGroup(cat: string) {
  expanded[cat] = !expanded[cat];
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
.action-picker-mask {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.action-picker {
  width: min(640px, 100%);
  max-height: min(78vh, 720px);
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.action-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 48px;
  background: linear-gradient(90deg, #5b8ff9 0%, #4a7fe8 100%);
  flex-shrink: 0;
}
.action-picker-title {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}
.action-picker-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  border-radius: 4px;
}
.action-picker-close:hover {
  background: rgba(255, 255, 255, 0.15);
}
.action-picker-search {
  padding: 14px 20px 10px;
  flex-shrink: 0;
}
.action-picker-body {
  flex: 1;
  overflow-y: auto;
  padding: 4px 16px 20px;
}
.action-group {
  margin-bottom: 8px;
}
.action-group-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 4px 8px;
  cursor: pointer;
  user-select: none;
}
.action-group-head:hover .action-group-title {
  color: #5b8ff9;
}
.action-group-arrow {
  font-size: 12px;
  color: #8c8c8c;
  transition: transform 0.2s;
}
.action-group-arrow.collapsed {
  transform: rotate(-90deg);
}
.action-group-title {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
}
.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 8px;
}
.action-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s;
}
.action-item:hover {
  background: #f5f5f5;
}
.action-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
  line-height: 1;
}
.action-label {
  font-size: 13px;
  color: #262626;
  line-height: 1.35;
}
.action-empty {
  text-align: center;
  padding: 48px 16px;
  color: #bfbfbf;
  font-size: 13px;
}

.picker-fade-enter-active,
.picker-fade-leave-active {
  transition: opacity 0.2s ease;
}
.picker-fade-enter-active .action-picker,
.picker-fade-leave-active .action-picker {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.picker-fade-enter-from,
.picker-fade-leave-to {
  opacity: 0;
}
.picker-fade-enter-from .action-picker,
.picker-fade-leave-to .action-picker {
  transform: scale(0.96) translateY(8px);
  opacity: 0;
}
</style>
