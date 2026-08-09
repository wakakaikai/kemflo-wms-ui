<template>
  <!-- 结束节点 -->
  <div
    v-if="isEnd"
    class="md-end"
    :class="[statusClass, { 'is-selected': selected }]"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
    @click="handleCardClick"
  >
    <div class="md-end-icon">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="1" width="7" height="7" fill="#262626" />
        <rect x="10" y="1" width="7" height="7" fill="#fff" stroke="#262626" stroke-width="1" />
        <rect x="1" y="10" width="7" height="7" fill="#fff" stroke="#262626" stroke-width="1" />
        <rect x="10" y="10" width="7" height="7" fill="#262626" />
      </svg>
    </div>
    <span class="md-end-label">流程结束</span>
    <NodeMenu v-if="!readonly" :show-copy="false" :show-delete="true" @command="handleMenuCommand" />
  </div>

  <!-- 分支节点：明道云白卡片 -->
  <div
    v-else-if="isBranch"
    class="md-branch"
    :class="[statusClass, { 'is-selected': selected }]"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
    @click="handleCardClick"
  >
    <div class="md-branch-split" title="分支">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#5b8ff9">
        <path d="M12 2L2 12l10 10 10-10L12 2zm0 3.5L18.5 12 12 18.5 5.5 12 12 5.5z" />
      </svg>
    </div>
    <div class="md-branch-head">
      <span class="md-branch-title">{{ branchTitle }}</span>
      <NodeMenu v-if="!readonly" light :show-copy="!isStart" :show-delete="!isStart" @command="handleMenuCommand" />
    </div>
    <div class="md-branch-body">
      <div v-if="branchConditionText" class="md-branch-condition">{{ branchConditionText }}</div>
      <div v-else class="md-branch-condition is-empty">未配置筛选条件</div>
    </div>
    <button
      v-if="!readonly"
      type="button"
      class="md-branch-link"
      @click.stop="handleFilterSettings"
    >配置筛选条件</button>
    <div
      v-show="!readonly && showTailPlus"
      class="md-tail-plus"
      title="添加下一节点"
      @click.stop="handlePlusClick"
    >+</div>
  </div>

  <!-- 业务节点：明道云卡片 -->
  <div
    v-else
    class="md-card"
    :class="[statusClass, { 'is-selected': selected, 'is-trigger': isStart }]"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
    @click="handleCardClick"
  >
    <div class="md-header" :style="{ background: headerColor }">
      <div class="md-icon-float" :style="{ background: headerColor }">
        <span class="md-icon-inner" v-html="iconSvg" />
      </div>
      <div class="md-header-bar">
        <span class="md-title" :title="displayTitle">{{ displayTitle }}</span>
        <NodeMenu v-if="!readonly" :show-copy="!isStart" :show-delete="!isStart" @command="handleMenuCommand" />
      </div>
    </div>

    <div class="md-body">
      <p v-for="(line, i) in bodyLines" :key="i" class="md-body-line">{{ line }}</p>
      <p v-if="runtimeHint" class="md-body-hint" :class="runtimeHintClass">{{ runtimeHint }}</p>
    </div>

    <div
      v-show="!readonly && showTailPlus"
      class="md-tail-plus"
      title="添加下一节点"
      @click.stop="handlePlusClick"
    >+</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, inject, onMounted, onUnmounted } from 'vue';
import { getNodeConfig } from '../types';
import { emit } from '../events';
import NodeMenu from './NodeMenu.vue';

const getNode = inject('getNode') as (() => any) | undefined;
const node = getNode?.();
const hover = ref(false);
const selected = ref(false);
const readonly = ref(false);
const hasOutgoing = ref(false);

const liveData = ref<Record<string, any>>(node?.getData() || {});

function syncData() {
  liveData.value = { ...(node?.getData() || {}) };
}

function syncSelected() {
  try {
    const g = node?.model?.graph;
    selected.value = !!(g && node && g.isSelected(node));
  } catch {
    selected.value = false;
  }
}

function syncOutgoing() {
  try {
    const g = node?.model?.graph;
    if (!g || !node) {
      hasOutgoing.value = false;
      return;
    }
    const outs = g.getOutgoingEdges?.(node) || g.getConnectedEdges?.(node)?.filter((e: any) => e.getSourceCellId?.() === node.id) || [];
    hasOutgoing.value = outs.length > 0;
  } catch {
    hasOutgoing.value = false;
  }
}

onMounted(() => {
  node?.on('change:data', syncData);
  const g = node?.model?.graph;
  readonly.value = !!(g as any)?.__automationReadonly;
  if (g) {
    g.on('node:selected', ({ node: n }: any) => { if (n === node) selected.value = true; });
    g.on('node:unselected', ({ node: n }: any) => { if (n === node) selected.value = false; });
    g.on('blank:click', () => { selected.value = false; });
    g.on('edge:added', syncOutgoing);
    g.on('edge:removed', syncOutgoing);
    g.on('cell:removed', syncOutgoing);
  }
  syncSelected();
  syncOutgoing();
});
onUnmounted(() => {
  node?.off('change:data', syncData);
});

const nodeType = computed(() => liveData.value.nodeType || '');
const nodeLabel = computed(() => liveData.value.label || liveData.value.nodeLabel || '');
const config = computed(() => getNodeConfig(nodeType.value));
const isStart = computed(() => nodeType.value.includes('TRIGGER'));
const isEnd = computed(() => nodeType.value === 'END');
const isBranch = computed(() => nodeType.value === 'CONDITION' || nodeType.value === 'SWITCH');

const displayTitle = computed(() => nodeLabel.value || config.value?.label || nodeType.value);
const branchTitle = computed(() => nodeLabel.value || '分支');

const branchConditionText = computed(() => {
  const cfg = liveData.value.config || {};
  if (cfg.expression) return cfg.expression;
  if (nodeType.value === 'SWITCH' && Array.isArray(cfg.cases) && cfg.cases[0]?.label) {
    return cfg.cases[0].label;
  }
  return '';
});

const headerColor = computed(() => {
  const cat = config.value?.category;
  if (isStart.value) return '#ff9a2e';
  if (cat === 'integration') return '#5b8ff9';
  if (cat === 'data') return '#ff9a2e';
  if (cat === 'control') return '#fa8c16';
  if (cat === 'device') return '#36cfc9';
  if (cat === 'approval') return '#eb2f96';
  return config.value?.color || '#5b8ff9';
});

const statusClass = computed(() => {
  const st = liveData.value.runtimeStatus;
  return st ? `status-${String(st).toLowerCase()}` : '';
});

const runtimeHint = computed(() => {
  const st = liveData.value.runtimeStatus;
  if (st === 'RUNNING') return '● 运行中';
  if (st === 'SUCCESS') return '● 执行成功';
  if (st === 'FAILED') return '● 执行失败';
  if (st === 'SKIPPED') return '○ 已跳过';
  if (st === 'WAITING') return '○ 等待中';
  return '';
});
const runtimeHintClass = computed(() => liveData.value.runtimeStatus?.toLowerCase() || '');

const showTailPlus = computed(() => (hover.value || selected.value) && !hasOutgoing.value);

const bodyLines = computed(() => {
  const cfg = liveData.value.config || {};
  const type = nodeType.value;
  const lines: string[] = [];

  if (isStart.value) {
    if (type === 'MANUAL_TRIGGER') {
      lines.push('当手动触发时执行');
    } else if (type === 'CRON_TRIGGER') {
      lines.push(`Cron: ${cfg.cronExpression || '未配置'}`);
      lines.push(`时区: ${cfg.timeZone || 'Asia/Shanghai'}`);
    } else if (type === 'WEBHOOK_TRIGGER') {
      lines.push(`路径: ${cfg.path || '未配置'}`);
    } else if (type === 'DATA_TRIGGER') {
      lines.push(`工作表「${cfg.worksheetId || '未配置'}」`);
      const evt = cfg.eventType === 'INSERT' ? '新增' : cfg.eventType === 'UPDATE' ? '修改' : cfg.eventType === 'DELETE' ? '删除' : cfg.eventType;
      lines.push(`当${evt || '数据变更'}时触发`);
    } else if (type === 'DEVICE_PROPERTY_TRIGGER') {
      lines.push(`设备点位 ${cfg.pointCode || '-'}`);
      lines.push(`条件 ${cfg.operator || '>'} ${cfg.threshold ?? 0}`);
    } else {
      lines.push(cfg.description || '流程开始');
    }
    return lines.slice(0, 3);
  }

  if (type === 'HTTP_CALL') {
    if (cfg.url) {
      lines.push(`${cfg.method || 'GET'} ${cfg.url}`);
      const bt = cfg.bodyType || 'none';
      if (bt === 'json' && cfg.body) lines.push('Body: JSON');
      else if (bt === 'form') lines.push('Body: Form 表单');
      else if (bt === 'form-data') lines.push('Body: FormData');
      else if (bt === 'raw' && cfg.body) lines.push('Body: Raw');
      else {
        const headerCount = cfg.headers && typeof cfg.headers === 'object' ? Object.keys(cfg.headers).filter(k => k).length : 0;
        if (headerCount > 0) lines.push(`已配置 ${headerCount} 个 Header`);
      }
    } else {
      lines.push('未配置请求 URL');
      lines.push('点击卡片进行设置');
    }
    return lines;
  }
  if (type.startsWith('DATA_')) {
    if (cfg.worksheetId) lines.push(`工作表「${cfg.worksheetId}」`);
    if (type === 'DATA_UPDATE') lines.push('更新记录');
    else if (type === 'DATA_CREATE') lines.push('新增记录');
    else if (type === 'DATA_QUERY') lines.push('查询记录');
    else if (type === 'DATA_DELETE') lines.push('删除记录');
    else lines.push(config.value?.label || type);
    return lines.slice(0, 3);
  }
  if (type.startsWith('DEVICE_')) {
    if (cfg.deviceCode) lines.push(`设备 ${cfg.deviceCode}`);
    if (cfg.pointCode) lines.push(`点位 ${cfg.pointCode}`);
    if (!lines.length) lines.push(config.value?.label || type);
    return lines.slice(0, 3);
  }
  if (cfg.description) {
    lines.push(cfg.description);
  } else if (cfg.alias) {
    lines.push(cfg.alias);
  } else {
    lines.push(config.value?.label || '点击 ··· 进行配置');
  }
  return lines.slice(0, 3);
});

const iconSvg = computed(() => {
  const cat = config.value?.category;
  const icons: Record<string, string> = {
    trigger: '<svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/></svg>',
    integration: '<svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="white" fill="none" stroke-width="2"/></svg>',
    data: '<svg viewBox="0 0 24 24" width="18" height="18" fill="white"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18" stroke="white" fill="none" stroke-width="1.5"/></svg>',
    control: '<svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z"/></svg>',
    device: '<svg viewBox="0 0 24 24" width="18" height="18" fill="white"><rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="17" r="1.5"/></svg>',
    approval: '<svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M9 15l2 2 4-4" stroke="white" fill="none" stroke-width="1.5"/></svg>',
  };
  if (isStart.value) return icons.trigger;
  return icons[cat || 'integration'] || icons.integration;
});

function handleCardClick(e: MouseEvent) {
  if (readonly.value) return;
  const el = e.target as HTMLElement;
  if (el.closest('.md-tail-plus, .md-node-menu-btn, .md-branch-link, .el-dropdown-menu')) return;
  if (node) emit('node:edit-meta', { node });
}

function handleMenuCommand(cmd: string) {
  if (cmd === 'rename') handleRename();
  else if (cmd === 'edit-meta') handleEditMeta();
  else if (cmd === 'copy') handleCopy();
  else if (cmd === 'delete') handleDelete();
}

function handleRename() {
  if (node) emit('node:rename', { node });
}

function handleEditMeta() {
  if (node) emit('node:edit-meta', { node });
}

function handleFilterSettings() {
  if (node) emit('node:edit-meta', { node, focus: 'filter' });
}

function handlePlusClick() {
  if (!node) return;
  const pos = node.getBBox();
  emit('node:plus-click', {
    sourceNode: node,
    x: pos.x + pos.width / 2,
    y: pos.y + pos.height + 28,
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
/* ---- 明道云业务卡片 ---- */
.md-card {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e8eaed;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  overflow: visible;
  cursor: move;
  position: relative;
  display: flex;
  flex-direction: column;
  user-select: none;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.md-card:hover,
.md-card.is-selected {
  border-color: #b8c4d9;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
}

.md-header {
  position: relative;
  border-radius: 8px 8px 0 0;
  padding: 22px 12px 10px;
  min-height: 52px;
  box-sizing: border-box;
}

.md-icon-float {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid #f7f8fa;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  z-index: 2;
}
.md-icon-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
}

.md-header-bar {
  display: flex;
  align-items: center;
  gap: 4px;
}
.md-title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 4px;
}

.md-body {
  flex: 1;
  padding: 10px 14px 12px;
  background: #fff;
  border-radius: 0 0 8px 8px;
}
.md-body-line {
  margin: 0 0 4px;
  font-size: 12px;
  color: #595959;
  line-height: 1.5;
  word-break: break-all;
}
.md-body-line:last-of-type {
  margin-bottom: 0;
}
.md-body-hint {
  margin: 6px 0 0;
  font-size: 11px;
  color: #8c8c8c;
}

/* ---- 分支卡片 ---- */
.md-branch {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e8eaed;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  position: relative;
  display: flex;
  flex-direction: column;
  cursor: move;
  overflow: visible;
  user-select: none;
  padding: 8px 10px 10px;
}
.md-branch:hover,
.md-branch.is-selected {
  border-color: #b8c4d9;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
}
.md-branch-split {
  position: absolute;
  top: -22px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid #d0d4dc;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
.md-branch-head {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
}
.md-branch-title {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: #262626;
}
.md-branch-body {
  flex: 1;
  min-height: 0;
}
.md-branch-condition {
  font-size: 12px;
  color: #595959;
  background: #f5f5f5;
  border-radius: 4px;
  padding: 6px 8px;
  line-height: 1.45;
  word-break: break-all;
}
.md-branch-condition.is-empty {
  color: #bfbfbf;
}
.md-branch-link {
  margin-top: 8px;
  border: none;
  background: none;
  padding: 0;
  font-size: 12px;
  color: #5b8ff9;
  cursor: pointer;
  text-align: left;
}
.md-branch-link:hover {
  color: #3d7ef5;
  text-decoration: underline;
}

.md-tail-plus {
  position: absolute;
  bottom: -11px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #e8eaed;
  border: 1px solid #d0d4dc;
  color: #8c8c8c;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 5;
  line-height: 1;
}
.md-tail-plus:hover {
  background: #5b8ff9;
  border-color: #5b8ff9;
  color: #fff;
}

/* ---- 结束节点 ---- */
.md-end {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #fff;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: move;
  position: relative;
  box-sizing: border-box;
  padding: 0 28px 0 8px;
}
.md-end.is-selected {
  border-color: #5b8ff9;
  box-shadow: 0 0 0 2px rgba(91, 143, 249, 0.2);
}
.md-end-icon {
  flex-shrink: 0;
  line-height: 0;
}
.md-end-label {
  font-size: 13px;
  color: #595959;
}

/* 运行态 */
.status-running { outline: 2px solid #1677ff; outline-offset: 1px; }
.status-success { outline: 2px solid #52c41a; outline-offset: 1px; }
.status-failed { outline: 2px solid #ff4d4f; outline-offset: 1px; }
.status-skipped { opacity: 0.72; }
</style>
