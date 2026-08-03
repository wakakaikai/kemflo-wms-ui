<template>
  <div class="x6-node-vue approval-node" :style="{ '--node-color': nodeColor }" @mouseenter="hover = true" @mouseleave="hover = false">
    <div class="node-accent" :style="{ background: nodeColor }"></div>
    <div class="node-icon-wrap" :style="{ background: nodeColor + '15', color: nodeColor }">
      <svg v-if="nodeType === 'APPROVAL_START'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10,9 9,9 8,9" /></svg>
      <svg v-else-if="nodeType === 'APPROVAL_WAIT'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg>
      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
    </div>
    <div class="node-body">
      <div class="node-title">{{ displayLabel }}</div>
      <div class="node-meta">{{ approvalTypeLabel }}</div>
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
const nodeColor = computed(() => nodeData.color || '#eb2f96');

const approvalTypeLabel = computed(() => {
  const map: Record<string, string> = { APPROVAL_START: '发起审批', APPROVAL_WAIT: '等待审批', APPROVAL_TERMINATE: '终止审批' };
  return nodeData.flowName || map[nodeType] || '审批';
});

function handlePlusClick() {
  if (node) { const pos = node.getBoundingBox(); emit('node:plus-click', { sourceNode: node, x: pos.x + pos.width / 2, y: pos.y + pos.height + 10, sourceEdge: undefined }); }
}
</script>

<style scoped>
.x6-node-vue { width: 100%; height: 100%; display: flex; align-items: center; gap: 10px; padding: 0 12px 0 0; border: 1px solid #e5e6e8; border-radius: 8px; cursor: pointer; transition: box-shadow 0.2s, border-color 0.2s; box-sizing: border-box; overflow: visible; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.04); position: relative; }
.x6-node-vue:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: var(--node-color, #eb2f96); }
.node-accent { width: 4px; height: 100%; flex-shrink: 0; align-self: stretch; }
.node-icon-wrap { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 6px; flex-shrink: 0; }
.node-body { flex: 1; min-width: 0; }
.node-title { font-size: 12px; font-weight: 600; color: #1d2129; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.5; }
.node-meta { font-size: 10px; color: #86909c; line-height: 1.4; }
.node-plus-btn { position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%); width: 22px; height: 22px; border-radius: 50%; color: #fff; font-size: 16px; font-weight: 300; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; box-shadow: 0 2px 6px rgba(0,0,0,0.15); line-height: 1; transition: transform 0.15s, box-shadow 0.15s; }
.node-plus-btn:hover { transform: translateX(-50%) scale(1.15); box-shadow: 0 3px 10px rgba(0,0,0,0.2); }
</style>