<template>
  <div class="x6-node-vue device-node" :style="{ '--node-color': nodeColor }" @mouseenter="hover = true" @mouseleave="hover = false">
    <div class="node-accent" :style="{ background: nodeColor }"></div>
    <div class="node-icon-wrap" :style="{ background: nodeColor + '15', color: nodeColor }">
      <svg v-if="nodeType === 'DEVICE_READ'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="9" y1="6" x2="15" y2="6" /><line x1="12" y1="10" x2="12" y2="16" /><line x1="9" y1="13" x2="15" y2="13" /></svg>
      <svg v-else-if="nodeType === 'DEVICE_WRITE'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="9" y1="6" x2="15" y2="6" /><path d="M12 10l-3 3h6l-3-3z" /></svg>
      <svg v-else-if="nodeType === 'DEVICE_COMMAND'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
    </div>
    <div class="node-body">
      <div class="node-title">{{ displayLabel }}</div>
      <div class="node-meta">{{ deviceTypeLabel }}</div>
    </div>
    <div v-show="hover" class="node-plus-btn" :style="{ background: nodeColor }" @click.stop="handlePlusClick">+</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, inject } from 'vue';
import { emit } from '../events';

const getNode = inject('getNode') as (() => any) | undefined;
const node = getNode?.();
const nodeData = node?.getData() || {};
const hover = ref(false);

const nodeType = nodeData.nodeType || '';
const displayLabel = nodeData.label || nodeData.nodeLabel || '';
const nodeColor = computed(() => nodeData.color || '#13c2c2');

const deviceTypeLabel = computed(() => {
  const map: Record<string, string> = { DEVICE_READ: '读取', DEVICE_WRITE: '写入', DEVICE_BATCH_READ: '批量读取', DEVICE_COMMAND: '命令', DEVICE_WAIT_RESPONSE: '等待响应', DEVICE_STATUS: '状态' };
  return nodeData.deviceName || map[nodeType] || '设备';
});

function handlePlusClick() {
  if (node) { const pos = node.getBoundingBox(); emit('node:plus-click', { sourceNode: node, x: pos.x + pos.width / 2, y: pos.y + pos.height + 10, sourceEdge: undefined }); }
}
</script>

<style scoped>
.x6-node-vue { width: 100%; height: 100%; display: flex; align-items: center; gap: 10px; padding: 0 12px 0 0; border: 1px solid #e5e6e8; border-radius: 6px; cursor: pointer; transition: box-shadow 0.2s, border-color 0.2s; box-sizing: border-box; overflow: visible; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.04); position: relative; }
.x6-node-vue:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: var(--node-color, #13c2c2); }
.node-accent { width: 4px; height: 100%; flex-shrink: 0; align-self: stretch; }
.node-icon-wrap { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 6px; flex-shrink: 0; }
.node-body { flex: 1; min-width: 0; }
.node-title { font-size: 12px; font-weight: 600; color: #1d2129; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.5; }
.node-meta { font-size: 10px; color: #86909c; line-height: 1.4; }
.node-plus-btn { position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%); width: 22px; height: 22px; border-radius: 50%; color: #fff; font-size: 16px; font-weight: 300; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; box-shadow: 0 2px 6px rgba(0,0,0,0.15); line-height: 1; transition: transform 0.15s, box-shadow 0.15s; }
.node-plus-btn:hover { transform: translateX(-50%) scale(1.15); box-shadow: 0 3px 10px rgba(0,0,0,0.2); }
</style>