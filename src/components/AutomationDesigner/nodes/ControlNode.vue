<template>
  <div class="x6-node-vue control-node" :class="diamondClass" :style="diamondStyle" @mouseenter="hover = true" @mouseleave="hover = false">
    <div class="node-accent" :style="{ background: nodeColor }"></div>
    <div class="node-icon-wrap" :style="{ background: nodeColor + '15', color: nodeColor }">
      <svg v-if="nodeType === 'CONDITION'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3L3 12l6 9h6l6-9-6-9H9z" /></svg>
      <svg v-else-if="nodeType === 'SWITCH'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v4H4zM4 10h16v4H4zM4 16h16v4H4z" /></svg>
      <svg v-else-if="nodeType === 'LOOP'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><path d="M13 9l3 3-3 3" /></svg>
      <svg v-else-if="nodeType === 'DELAY'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
      <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /></svg>
    </div>
    <div class="node-body">
      <div class="node-title">{{ displayLabel }}</div>
      <div class="node-meta">{{ controlTypeLabel }}</div>
    </div>
    <div class="node-badge" :style="{ background: nodeColor }">{{ badgeText }}</div>
    <div v-show="hover" class="node-plus-btn" :style="{ background: nodeColor }" @click.stop="handlePlusClick">+</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, inject } from 'vue';
import { getNodeConfig } from '../types';
import { emit } from '../events';

const getNode = inject('getNode') as (() => any) | undefined;
const node = getNode?.();
const nodeData = node?.getData() || {};
const hover = ref(false);

const nodeType = nodeData.nodeType || '';
const displayLabel = nodeData.label || nodeData.nodeLabel || '';
const nodeColor = computed(() => nodeData.color || '#fa8c16');

const controlTypeLabel = computed(() => {
  const map: Record<string, string> = { CONDITION: '条件', SWITCH: '分支', LOOP: '循环', DELAY: '延时', WAIT: '等待', END: '结束' };
  return map[nodeType] || '控制';
});
const badgeText = computed(() => {
  const map: Record<string, string> = { CONDITION: 'IF', SWITCH: 'SW', LOOP: '↻', DELAY: '⌛', WAIT: '⏳', END: 'END' };
  return map[nodeType] || '';
});
const isDiamond = computed(() => nodeType === 'CONDITION' || nodeType === 'SWITCH');
const diamondClass = computed(() => isDiamond.value ? 'shape-diamond' : '');
const diamondStyle = computed(() => isDiamond.value ? { transform: 'rotate(0deg)', clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' } : {});

function handlePlusClick() {
  if (node) { const pos = node.getBoundingBox(); emit('node:plus-click', { sourceNode: node, x: pos.x + pos.width / 2, y: pos.y + pos.height + 10, sourceEdge: undefined }); }
}
</script>

<style scoped>
.x6-node-vue { width: 100%; height: 100%; display: flex; align-items: center; gap: 10px; padding: 0 12px 0 0; border: 1px solid #e5e6e8; border-radius: 6px; cursor: pointer; transition: box-shadow 0.2s, border-color 0.2s; box-sizing: border-box; position: relative; overflow: visible; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
.x6-node-vue:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: var(--node-color, #fa8c16); }
.node-accent { width: 4px; height: 100%; flex-shrink: 0; align-self: stretch; }
.shape-diamond { border-radius: 0; }
.node-icon-wrap { width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; border-radius: 6px; flex-shrink: 0; z-index: 1; }
.node-body { flex: 1; min-width: 0; z-index: 1; }
.node-title { font-size: 12px; font-weight: 600; color: #1d2129; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.5; }
.node-meta { font-size: 10px; color: #86909c; line-height: 1.4; }
.node-badge { position: absolute; top: -4px; right: 4px; font-size: 8px; font-weight: bold; color: #fff; border-radius: 6px; padding: 1px 5px; line-height: 14px; z-index: 2; }
.node-plus-btn { position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%); width: 22px; height: 22px; border-radius: 50%; color: #fff; font-size: 16px; font-weight: 300; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; box-shadow: 0 2px 6px rgba(0,0,0,0.15); line-height: 1; transition: transform 0.15s, box-shadow 0.15s; }
.node-plus-btn:hover { transform: translateX(-50%) scale(1.15); box-shadow: 0 3px 10px rgba(0,0,0,0.2); }
</style>