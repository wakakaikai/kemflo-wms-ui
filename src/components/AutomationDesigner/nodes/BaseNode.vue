<template>
  <div
    class="agent-card"
    :class="[themeClass, { 'is-start': isStart, 'is-end': isEnd }]"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <div class="header">
      <div class="icon">{{ iconText }}</div>
      <div class="title" :title="nodeLabel">{{ nodeLabel }}</div>
      <div v-if="badge" class="badge">{{ badge }}</div>
      <div v-show="hover && !isStart && !isEnd" class="actions">
        <span class="op" title="复制节点" @click.stop="handleCopy">⧉</span>
        <span class="op" title="删除节点" @click.stop="handleDelete">✕</span>
      </div>
    </div>

    <div v-if="isStart" class="body">
      <span class="section">流程开始节点</span>
    </div>
    <div v-else-if="isEnd" class="footer">
      <span class="section">流程结束节点</span>
    </div>
    <div v-else class="desc">{{ categoryLabel }} · {{ shortDesc }}</div>

    <div v-show="hover && !isEnd" class="plus-btn" @click.stop="handlePlusClick">+</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, inject, onMounted, onUnmounted } from 'vue';
import { getNodeConfig, NodeCategoryLabels } from '../types';
import { emit } from '../events';

const getNode = inject('getNode') as (() => any) | undefined;
const node = getNode?.();
const hover = ref(false);

const liveData = ref<Record<string, any>>(node?.getData() || {});

function syncData() {
  liveData.value = { ...(node?.getData() || {}) };
}

onMounted(() => {
  node?.on('change:data', syncData);
});
onUnmounted(() => {
  node?.off('change:data', syncData);
});

const nodeType = computed(() => liveData.value.nodeType || '');
const nodeLabel = computed(() => liveData.value.label || liveData.value.nodeLabel || '');

const config = computed(() => getNodeConfig(nodeType.value));

const isStart = computed(() => nodeType.value.includes('TRIGGER'));
const isEnd = computed(() => nodeType.value === 'END');

const categoryLabel = computed(() => {
  const cat = config.value?.category;
  return cat ? NodeCategoryLabels[cat] || cat : '';
});

const badge = computed(() => {
  if (isStart.value) return '触发器';
  if (isEnd.value) return '输出端';
  return '';
});

const iconText = computed(() => {
  if (isStart.value) return 'S';
  if (isEnd.value) return 'E';
  const label = nodeLabel.value || config.value?.label || '';
  return label.charAt(0);
});

const themeClass = computed(() => {
  const color = config.value?.color || '#5F95FF';
  if (isStart.value) return 'theme-blue';
  if (isEnd.value) return 'theme-red';
  if (color === '#fa8c16') return 'theme-orange';
  if (color === '#52c41a') return 'theme-green';
  if (color === '#722ed1') return 'theme-purple';
  if (color === '#13c2c2') return 'theme-cyan';
  if (color === '#eb2f96') return 'theme-magenta';
  return 'theme-blue';
});

const shortDesc = computed(() => {
  const cfg = liveData.value.config || {};
  if (cfg.description) return cfg.description;
  if (cfg.expression) return cfg.expression;
  if (cfg.cronExpression) return cfg.cronExpression;
  if (cfg.path) return cfg.path;
  if (cfg.worksheetId) return `工作表: ${cfg.worksheetId}`;
  return config.value?.label || nodeType.value;
});

function handlePlusClick() {
  if (!node) return;
  const pos = node.getBBox();
  emit('node:plus-click', {
    sourceNode: node,
    x: pos.x + pos.width / 2,
    y: pos.y + pos.height + 24,
    sourceEdge: undefined,
  });
}

function handleCopy() {
  if (node) emit('node:copy', { node });
}

function handleDelete() {
  if (node) emit('node:delete', { node });
}
</script>

<style scoped>
.agent-card {
  display: flex;
  flex-direction: column;
  border: 1px solid #5f95ff;
  border-radius: 8px;
  box-sizing: border-box;
  padding: 12px;
  width: 100%;
  height: 100%;
  background: #fff;
  gap: 8px;
  cursor: move;
  position: relative;
  transition: box-shadow 0.2s;
  user-select: none;
}
.agent-card:hover {
  box-shadow: 0 4px 16px rgba(95, 149, 255, 0.18);
}
.agent-card.is-start,
.agent-card.is-end {
  border-radius: 12px;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 32px;
}
.icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f0f5ff;
  color: #1d39c4;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}
.theme-green .icon { background: #e6fffb; color: #08979c; }
.theme-orange .icon { background: #fff7e6; color: #fa8c16; }
.theme-red .icon { background: #fff1f0; color: #cf1322; }
.theme-purple .icon { background: #f9f0ff; color: #722ed1; }
.theme-cyan .icon { background: #e6fffb; color: #13c2c2; }
.theme-magenta .icon { background: #fff0f6; color: #eb2f96; }
.is-start .icon { background: #eef2ff; color: #5f95ff; }
.is-end .icon { background: #fff1f0; color: #ff7875; }

.title {
  font-size: 15px;
  color: #141414;
  font-weight: 600;
  line-height: 20px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}
.badge {
  margin-left: auto;
  font-size: 12px;
  color: #8c8c8c;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 2px 8px;
  flex-shrink: 0;
  white-space: nowrap;
}
.actions {
  margin-left: auto;
  color: #8c8c8c;
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.actions .op {
  font-size: 13px;
  cursor: pointer;
  line-height: 1;
  padding: 2px;
  border-radius: 4px;
}
.actions .op:hover {
  color: #5f95ff;
  background: #f0f5ff;
}

.desc {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.65);
  line-height: 18px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.body,
.footer {
  display: flex;
  align-items: center;
  gap: 8px;
}
.section {
  font-size: 12px;
  color: #8c8c8c;
}

.plus-btn {
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #5f95ff;
  color: #fff;
  font-size: 16px;
  font-weight: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 2px 6px rgba(95, 149, 255, 0.35);
  line-height: 1;
  transition: transform 0.15s, box-shadow 0.15s;
}
.plus-btn:hover {
  transform: translateX(-50%) scale(1.15);
  box-shadow: 0 3px 10px rgba(95, 149, 255, 0.45);
}
</style>
