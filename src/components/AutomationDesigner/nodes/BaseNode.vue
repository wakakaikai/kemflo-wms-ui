<template>
  <div
    class="x6-node-vue"
    :class="[shapeClass, 'status-' + (nodeStatus || 'idle')]"
    :style="{ '--node-color': nodeColor }"
    @mouseenter="hover = true" @mouseleave="hover = false"
    @click.stop
  >
    <div class="node-accent" :style="{ background: nodeColor }"></div>
    <div class="node-icon" :style="{ background: nodeColor + '15', color: nodeColor }">
      <span class="icon-text">{{ iconText }}</span>
    </div>
    <div class="node-content">
      <div class="node-label" :title="nodeLabel">{{ nodeLabel }}</div>
      <div class="node-type-tag">{{ categoryLabel }}</div>
    </div>
    <div v-if="nodeStatus && nodeStatus !== 'idle'" class="node-status-dot" :class="'dot-' + nodeStatus" />
    <div v-show="hover" class="node-plus-btn" :style="{ background: nodeColor }" @click.stop="handlePlusClick">+</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, inject } from 'vue';
import { getNodeConfig, NodeCategory, NodeCategoryLabels } from '../types';
import { emit } from '../events';

// x6-vue-shape 只传递 { node, graph } 作为 props
// 所有节点数据需通过 getNode() inject 获取
const getNode = inject('getNode') as (() => any) | undefined;
const node = getNode?.();
const nodeData = node?.getData() || {};

const nodeType = nodeData.nodeType || '';
const nodeLabel = nodeData.label || nodeData.nodeLabel || '';
const nodeStatus = nodeData.status || '';
const hover = ref(false);

const config = computed(() => getNodeConfig(nodeType));
const nodeColor = computed(() => nodeData.color || config.value?.color || '#1677ff');
const shapeClass = computed(() => config.value?.shape || 'rect');
const categoryLabel = computed(() => {
  const cat = config.value?.category;
  return cat ? NodeCategoryLabels[cat] || cat : '';
});
const iconText = computed(() => {
  const label = nodeLabel || config.value?.label || '';
  return label.charAt(0);
});

function handlePlusClick() {
  if (node) {
    const pos = node.getBoundingBox();
    emit('node:plus-click', { sourceNode: node, x: pos.x + pos.width / 2, y: pos.y + pos.height + 10, sourceEdge: undefined });
  }
}
</script>

<style scoped>
.x6-node-vue {
  width: 100%; height: 100%;
  display: flex; align-items: center; gap: 10px;
  padding: 0 12px 0 0;
  border: 1px solid #e5e6e8;
  border-radius: 8px;
  cursor: pointer;
  transition: box-shadow 0.2s, border-color 0.2s;
  box-sizing: border-box; overflow: visible;
  background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  position: relative;
}
.x6-node-vue:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: var(--node-color, #1677ff); }
.x6-node-vue.status-running { border-style: dashed; animation: node-pulse 1.5s ease-in-out infinite; }
.x6-node-vue.status-success { border-color: #52c41a !important; --node-color: #52c41a; }
.x6-node-vue.status-failed { border-color: #f5222d !important; --node-color: #f5222d; }
@keyframes node-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(22,119,255,0.3); } 50% { box-shadow: 0 0 0 6px rgba(22,119,255,0); } }
.node-accent { width: 4px; height: 100%; flex-shrink: 0; align-self: stretch; }
.node-icon { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 6px; font-size: 12px; font-weight: bold; flex-shrink: 0; }
.node-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0; }
.node-label { font-size: 12px; font-weight: 600; color: #1d2129; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.5; }
.node-type-tag { font-size: 10px; color: #86909c; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.4; }
.node-status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-right: 4px; }
.dot-running { background: #1677ff; animation: dot-blink 1s infinite; }
.dot-success { background: #52c41a; }
.dot-failed { background: #f5222d; }
.dot-waiting { background: #fa8c16; }
@keyframes dot-blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
.node-plus-btn { position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%); width: 22px; height: 22px; border-radius: 50%; color: #fff; font-size: 16px; font-weight: 300; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; box-shadow: 0 2px 6px rgba(0,0,0,0.15); line-height: 1; transition: transform 0.15s, box-shadow 0.15s; }
.node-plus-btn:hover { transform: translateX(-50%) scale(1.15); box-shadow: 0 3px 10px rgba(0,0,0,0.2); }
</style>