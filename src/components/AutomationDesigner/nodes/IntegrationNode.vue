<template>
  <div class="x6-node-vue int-node" :style="{ '--node-color': nodeColor }" @mouseenter="hover = true" @mouseleave="hover = false">
    <div class="node-accent" :style="{ background: nodeColor }"></div>
    <div class="node-icon-wrap" :style="{ background: nodeColor + '15', color: nodeColor }">
      <svg v-if="nodeType === 'HTTP_CALL'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
      <svg v-else-if="nodeType === 'JDBC_CALL'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>
      <svg v-else-if="nodeType === 'MQTT_CALL'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>
    </div>
    <div class="node-body">
      <div class="node-title">{{ displayLabel }}</div>
      <div class="node-meta">{{ intTypeLabel }}</div>
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
const nodeColor = computed(() => nodeData.color || '#722ed1');

const intTypeLabel = computed(() => {
  const map: Record<string, string> = { HTTP_CALL: 'HTTP', JDBC_CALL: 'JDBC', SAP_CALL: 'SAP', MQTT_CALL: 'MQTT', SFTP_CALL: 'SFTP', MAIL_CALL: '邮件' };
  return nodeData.operationName || map[nodeType] || '集成';
});

function handlePlusClick() {
  if (node) { const pos = node.getBoundingBox(); emit('node:plus-click', { sourceNode: node, x: pos.x + pos.width / 2, y: pos.y + pos.height + 10, sourceEdge: undefined }); }
}
</script>

<style scoped>
.x6-node-vue { width: 100%; height: 100%; display: flex; align-items: center; gap: 10px; padding: 0 12px 0 0; border: 1px solid #e5e6e8; border-radius: 6px; cursor: pointer; transition: box-shadow 0.2s, border-color 0.2s; box-sizing: border-box; overflow: visible; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.04); position: relative; }
.x6-node-vue:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: var(--node-color, #722ed1); }
.node-accent { width: 4px; height: 100%; flex-shrink: 0; align-self: stretch; }
.node-icon-wrap { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 6px; flex-shrink: 0; }
.node-body { flex: 1; min-width: 0; }
.node-title { font-size: 12px; font-weight: 600; color: #1d2129; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.5; }
.node-meta { font-size: 10px; color: #86909c; line-height: 1.4; }
.node-plus-btn { position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%); width: 22px; height: 22px; border-radius: 50%; color: #fff; font-size: 16px; font-weight: 300; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; box-shadow: 0 2px 6px rgba(0,0,0,0.15); line-height: 1; transition: transform 0.15s, box-shadow 0.15s; }
.node-plus-btn:hover { transform: translateX(-50%) scale(1.15); box-shadow: 0 3px 10px rgba(0,0,0,0.2); }
</style>