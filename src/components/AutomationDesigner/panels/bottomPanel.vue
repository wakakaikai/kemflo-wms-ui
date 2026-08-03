<template>
  <div class="bottom-panel-inner">
    <div class="panel-tabs">
      <span
        v-for="tab in tabs"
        :key="tab.key"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </span>
    </div>
    <div class="panel-content">
      <!-- 日志输出 -->
      <div v-show="activeTab === 'log'" class="log-viewer" ref="logViewerRef">
        <div v-if="logs.length === 0" class="log-empty">暂无日志</div>
        <div v-for="(log, idx) in logs" :key="idx" :class="['log-line', 'log-' + log.level]">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-msg">{{ log.message }}</span>
        </div>
      </div>
      <div v-show="activeTab === 'input'" class="empty-tab">请选择节点查看输入</div>
      <div v-show="activeTab === 'output'" class="empty-tab">请选择节点查看输出</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';

const props = defineProps<{
  logs: Array<{ level: string; message: string; time: string }>;
}>();

const activeTab = ref('log');
const logViewerRef = ref<HTMLDivElement>();
const tabs = [
  { key: 'log', label: '日志' },
  { key: 'input', label: '输入' },
  { key: 'output', label: '输出' },
];

watch(() => props.logs.length, async () => {
  await nextTick();
  if (logViewerRef.value) {
    logViewerRef.value.scrollTop = logViewerRef.value.scrollHeight;
  }
});
</script>

<style scoped>
.bottom-panel-inner { height: 100%; display: flex; flex-direction: column; }
.panel-tabs {
  display: flex; gap: 0; border-bottom: 1px solid #e8e8e8;
  background: #f7f8fa; flex-shrink: 0; padding: 0 12px;
}
.panel-tabs span {
  padding: 8px 16px; font-size: 12px; cursor: pointer;
  border-bottom: 2px solid transparent; color: #86909c;
  transition: all 0.2s; user-select: none;
}
.panel-tabs span.active {
  color: #1677ff; border-bottom-color: #1677ff; font-weight: 500;
}
.panel-tabs span:hover { color: #1677ff; }
.panel-content { flex: 1; overflow-y: auto; }
.log-viewer { font-family: 'Menlo', 'Monaco', 'Courier New', monospace; font-size: 12px; padding: 4px 0; }
.log-line { padding: 3px 16px; display: flex; gap: 12px; align-items: baseline; }
.log-line:hover { background: #f7f8fa; }
.log-time { color: #c9cdd4; white-space: nowrap; font-size: 11px; min-width: 80px; }
.log-msg { word-break: break-all; }
.log-success .log-msg { color: #52c41a; }
.log-error .log-msg { color: #f5222d; }
.log-info .log-msg { color: #4e5969; }
.log-warning .log-msg { color: #fa8c16; }
.log-empty, .empty-tab { color: #c9cdd4; font-size: 12px; padding: 20px 16px; text-align: center; }
</style>
