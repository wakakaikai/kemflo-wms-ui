<template>
  <div class="x6-node-vue trigger-node" :style="{ '--node-color': nodeColor }" @mouseenter="hover = true" @mouseleave="hover = false">
    <div class="node-accent" :style="{ background: nodeColor }"></div>
    <div class="node-icon-wrap" :style="{ background: nodeColor + '15', color: nodeColor }">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="5,3 19,12 5,21" />
      </svg>
    </div>
    <div class="node-body">
      <div class="node-title">{{ displayLabel }}</div>
      <div class="node-meta">{{ triggerTypeLabel }}</div>
    </div>
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
const nodeColor = computed(() => nodeData.color || '#1677ff');
const config = computed(() => getNodeConfig(nodeType));

const triggerTypeLabel = computed(() => {
  const map: Record<string, string> = { MANUAL_TRIGGER: '手动', CRON_TRIGGER: '定时', WEBHOOK_TRIGGER: 'Webhook', DATA_TRIGGER: '数据', MESSAGE_TRIGGER: '消息', DEVICE_PROPERTY_TRIGGER: '设备' };
  return map[nodeType] || '触发';
});

function handlePlusClick() {
  if (node) {
    const pos = node.getBoundingBox();
    emit('node:plus-click', { sourceNode: node, x: pos.x + pos.width / 2, y: pos.y + pos.height + 10, sourceEdge: undefined });
  }
}
</script>

<style scoped>
.x6-node-vue { width: 100%; height: 100%; display: flex; align-items: center; gap: 10px; padding: 0 14px 0 0; border: 1px solid #e5e6e8; border-radius: 50px !important; cursor: pointer; transition: box-shadow 0.2s, border-color 0.2s; box-sizing: border-box; overflow: visible; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.04); position: relative; }
.x6-node-vue:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: var(--node-color, #1677ff); }
.node-accent { width: 4px; height: 100%; flex-shrink: 0; align-self: stretch; }
.node-icon-wrap { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; flex-shrink: 0; }
.node-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0; }
.node-title { font-size: 12px; font-weight: 600; color: #1d2129; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.5; }
.node-meta { font-size: 10px; color: #86909c; line-height: 1.4; }
.node-plus-btn { position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%); width: 22px; height: 22px; border-radius: 50%; color: #fff; font-size: 16px; font-weight: 300; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; box-shadow: 0 2px 6px rgba(0,0,0,0.15); line-height: 1; transition: transform 0.15s, box-shadow 0.15s; }
.node-plus-btn:hover { transform: translateX(-50%) scale(1.15); box-shadow: 0 3px 10px rgba(0,0,0,0.2); }
</style>