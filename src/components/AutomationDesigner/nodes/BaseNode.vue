<template>
  <div
    v-if="isEnd"
    class="flow-node end-node"
    :class="[statusClass, { 'is-selected': selected }]"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
    @click="handleCardClick"
  >
    <span class="node-icon end"><span /></span>
    <div class="node-main">
      <div class="node-title-row">
        <span class="node-title">{{ displayTitle }}</span>
        <NodeMenu v-if="!readonly" :show-copy="false" :show-delete="true" @command="handleMenuCommand" />
      </div>
      <div class="node-line"><span class="line-label">输出格式</span><span class="line-value">文本</span></div>
      <div class="node-line"><span class="line-label">文本内容</span><span class="line-value">{{ endText }}</span></div>
    </div>
  </div>

  <div
    v-else
    class="flow-node"
    :class="[statusClass, { 'is-selected': selected, 'is-branch': isBranch }]"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
    @click="handleCardClick"
  >
    <div class="node-title-row">
      <span class="node-icon" :style="{ background: accentColor }" v-html="iconSvg" />
      <span class="node-title" :title="displayTitle">{{ displayTitle }}</span>
      <NodeMenu v-if="!readonly" :show-copy="!isStart" :show-delete="!isStart" @command="handleMenuCommand" />
    </div>

    <div v-if="isSwitch" class="branch-body switch-body">
      <div v-for="(item, index) in switchCases" :key="index" class="branch-case">
        <strong>{{ item.label }}</strong>
        <span>{{ item.value }}</span>
      </div>
    </div>

    <div v-else-if="isCondition" class="branch-body">
      <div class="branch-case">
        <strong>IF</strong>
        <span>{{ branchConditionText }}</span>
      </div>
      <div class="branch-case">
        <strong>ELSE</strong>
        <span>否则执行</span>
      </div>
    </div>

    <div v-else class="node-body">
      <div v-for="(line, index) in bodyLines" :key="index" class="node-line">
        <span class="line-label">{{ line.label }}</span>
        <span class="line-value" :class="{ 'is-empty': line.empty }" :title="line.value">{{ line.value }}</span>
      </div>
      <div v-if="runtimeHint" class="runtime-line" :class="runtimeHintClass">{{ runtimeHint }}</div>
    </div>

    <button v-show="!readonly && showTailPlus" type="button" class="tail-plus" title="添加下一节点" @click.stop="handlePlusClick">
      +
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref } from 'vue';
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
    const graph = node?.model?.graph;
    selected.value = !!(graph && node && graph.isSelected(node));
  } catch {
    selected.value = false;
  }
}

function syncOutgoing() {
  try {
    const graph = node?.model?.graph;
    if (!graph || !node) {
      hasOutgoing.value = false;
      return;
    }
    const edges = graph.getOutgoingEdges?.(node) || [];
    hasOutgoing.value = edges.length > 0;
  } catch {
    hasOutgoing.value = false;
  }
}

onMounted(() => {
  node?.on('change:data', syncData);
  const graph = node?.model?.graph;
  readonly.value = !!(graph as any)?.__automationReadonly;
  if (graph) {
    graph.on('node:selected', ({ node: n }: any) => {
      if (n === node) selected.value = true;
    });
    graph.on('node:unselected', ({ node: n }: any) => {
      if (n === node) selected.value = false;
    });
    graph.on('blank:click', () => {
      selected.value = false;
    });
    graph.on('edge:added', syncOutgoing);
    graph.on('edge:removed', syncOutgoing);
    graph.on('cell:removed', syncOutgoing);
  }
  syncSelected();
  syncOutgoing();
});

onUnmounted(() => {
  node?.off('change:data', syncData);
});

const nodeType = computed(() => liveData.value.nodeType || '');
const nodeConfig = computed(() => getNodeConfig(nodeType.value));
const cfg = computed(() => liveData.value.config || {});
const isStart = computed(() => nodeType.value.includes('TRIGGER'));
const isEnd = computed(() => nodeType.value === 'END');
const isCondition = computed(() => nodeType.value === 'CONDITION');
const isSwitch = computed(() => nodeType.value === 'SWITCH');
const isBranch = computed(() => isCondition.value || isSwitch.value);
const displayTitle = computed(() => liveData.value.label || nodeConfig.value?.label || nodeType.value || '节点');
const accentColor = computed(() => nodeConfig.value?.color || (isStart.value ? '#1677ff' : '#36cfc9'));
const showTailPlus = computed(() => (hover.value || selected.value) && !hasOutgoing.value && !isEnd.value && !isSwitch.value);

const statusClass = computed(() => {
  const status = liveData.value.runtimeStatus;
  return status ? `status-${String(status).toLowerCase()}` : '';
});
const runtimeHint = computed(() => {
  const status = liveData.value.runtimeStatus;
  if (status === 'RUNNING') return '运行中';
  if (status === 'SUCCESS') return '运行成功';
  if (status === 'FAILED') return '运行失败';
  if (status === 'WAITING') return '等待中';
  if (status === 'SKIPPED') return '已跳过';
  return '';
});
const runtimeHintClass = computed(() => liveData.value.runtimeStatus?.toLowerCase() || '');
const endText = computed(() => cfg.value.text || cfg.value.responseTemplate || '尚未输入');

const branchConditionText = computed(() => {
  if (cfg.value.expression) return cfg.value.expression;
  return '未配置条件';
});

const switchCases = computed(() => {
  const branches = Array.isArray(cfg.value.branches) ? cfg.value.branches : [];
  if (branches.length > 0) {
    return branches
      .filter((item: any) => item.type !== 'ELSE')
      .map((item: any, index: number) => {
        const rule = item.rules?.[0];
        const cond = rule?.variable
          ? `${rule.variable} ${rule.operator || 'eq'} ${rule.value || ''}`.trim()
          : '未配置条件';
        return {
          label: index === 0 ? 'IF' : `ELIF ${index}`,
          value: cond,
        };
      })
      .concat([{ label: 'ELSE', value: '否则执行' }]);
  }
  const cases = Array.isArray(cfg.value.cases) ? cfg.value.cases : [];
  if (cases.length === 0) {
    return [
      { label: 'IF', value: '未配置条件' },
      { label: 'ELSE', value: '否则执行' },
    ];
  }
  return cases.map((item: any, index: number) => ({
    label: item.type === 'DEFAULT' ? 'ELSE' : index === 0 ? 'IF' : `ELIF ${index}`,
    value: item.remarks || item.expression || item.value || '未配置',
  }));
});

type NodeLine = { label: string; value: string; empty?: boolean };

const bodyLines = computed<NodeLine[]>(() => {
  const type = nodeType.value;
  const c = cfg.value;
  if (isStart.value) {
    const fields = c.inputFields || c.fields;
    let fieldText = '';
    if (Array.isArray(fields)) {
      fieldText = fields.map((item: any) => item.displayName || item.description || item.name || item.field).filter(Boolean).join(', ');
    }
    if (!fieldText) fieldText = '用户问题, 对话历史, 图片';
    return [
      { label: '输入字段', value: fieldText },
      { label: '触发方式', value: startText(type) },
    ];
  }
  if (type === 'HTTP_CALL') {
    const inputKeys = inputMappingText(c.inputMapping);
    return [
      { label: '输入变量', value: inputKeys || '-', empty: !inputKeys },
      { label: 'API', value: `[${c.method || 'GET'}] ${c.url || '尚未填写'}`, empty: !c.url },
      { label: '请求参数', value: keyList(c.queryParams || c.params) || '无' },
      { label: '请求头', value: keyList(c.headers) || '无' },
      { label: '请求体类型', value: bodyTypeText(c) || 'none' },
      { label: '输出变量', value: outputText(c) },
    ];
  }
  if (type === 'JDBC_CALL') {
    return [
      { label: '输入变量', value: inputMappingText(c.inputMapping) || '-', empty: !inputMappingText(c.inputMapping) },
      { label: '数据源', value: c.dataSourceName || c.connectionId || '尚未填写', empty: !c.dataSourceName && !c.connectionId },
      { label: '自定义SQL', value: truncate(c.sql, 48) || '尚未填写', empty: !c.sql },
      { label: '输出变量', value: c.outputVar || 'sqlResult' },
    ];
  }
  if (type === 'LOOP') {
    const loopType = c.loopType || c.type || 'counted';
    const loopMode = loopType === 'counted'
      ? `循环 ${c.maxLoopTimes || c.maxIterations || 0} 次`
      : loopType === 'array'
        ? '迭代循环'
        : '无限循环';
    const varCount = Array.isArray(c.loopParams) ? c.loopParams.length : 0;
    return [
      { label: '输入变量', value: inputMappingText(c.inputMapping) || '-', empty: !inputMappingText(c.inputMapping) },
      { label: '循环模式', value: loopMode },
      { label: '循环变量', value: `${varCount} 个`, empty: varCount === 0 },
      { label: '输出变量', value: c.outputVar || '-' },
    ];
  }
  if (type === 'CHAT_VAR_GET') {
    const names = chatVarNames(c.variables);
    return [{ label: '读取变量', value: names || '尚未配置', empty: !names }];
  }
  if (type === 'CHAT_VAR_SET') {
    const names = chatVarNames(c.variables);
    return [{ label: '赋值变量', value: names || '尚未配置', empty: !names }];
  }
  if (type.startsWith('DEVICE_')) {
    return [
      { label: '设备', value: c.deviceCode || c.productCode || '-' },
      { label: '点位', value: c.pointCode || keyList(c.pointCodes) || '-' },
      { label: '输出变量', value: c.outputVar || 'deviceResult' },
    ];
  }
  if (type.startsWith('AI_')) {
    return [
      { label: '输入变量', value: c.promptVar || inputMappingText(c.inputMapping) || 'question,doc' },
      { label: '模型', value: c.modelName || c.modelId || 'OpenAI' },
      { label: '输出变量', value: c.outputVar || '回复内容' },
    ];
  }
  return [
    { label: '配置', value: c.description || c.alias || nodeConfig.value?.label || type },
    { label: '输出变量', value: c.outputVar || '-' },
  ];
});

function stringifyShort(value: any) {
  if (Array.isArray(value)) return value.map((item) => item.name || item.field || item).join(',');
  if (value && typeof value === 'object') return Object.keys(value).join(',');
  return String(value || '');
}

function chatVarNames(value: any) {
  if (!Array.isArray(value)) return '';
  return value.map((item) => item.name || item.field).filter(Boolean).join(', ');
}

function truncate(value: any, max = 40) {
  const text = String(value || '');
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function bodyTypeText(c: Record<string, any>) {
  const bodyType = c.bodyType;
  if (!bodyType || bodyType === 'none') return '';
  return bodyType;
}

function startText(type: string) {
  if (type === 'DEVICE_PROPERTY_TRIGGER') return '设备采集数据';
  if (type === 'CRON_TRIGGER') return cfg.value.cronExpression || '定时触发';
  if (type === 'WEBHOOK_TRIGGER') return cfg.value.path || 'Webhook';
  return '手动执行';
}

function keyList(value: any) {
  if (Array.isArray(value)) return value.join(',');
  if (value && typeof value === 'object') return Object.keys(value).filter(Boolean).join(', ');
  return '';
}

function inputMappingText(value: any) {
  if (!value || typeof value !== 'object') return '';
  return Object.keys(value).join(',');
}

function outputText(value: Record<string, any>) {
  const mapping = keyList(value.outputMapping || value.responseMapping);
  return mapping || value.outputVar || 'httpResponse';
}

const iconSvg = computed(() => {
  const type = nodeType.value;
  if (isStart.value) {
    return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
  }
  if (type === 'HTTP_CALL') {
    return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 010 20"/><path d="M12 2a15 15 0 000 20"/></svg>';
  }
  if (type === 'JDBC_CALL') {
    return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>';
  }
  if (isSwitch.value || isCondition.value) {
    return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2"><path d="M6 3v6a3 3 0 003 3h9"/><path d="M6 21v-6a3 3 0 013-3"/><path d="M15 9l3 3-3 3"/></svg>';
  }
  if (type === 'LOOP') {
    return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>';
  }
  if (type === 'CHAT_VAR_GET' || type === 'CHAT_VAR_SET') {
    return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2"><path d="M4 7h16"/><path d="M4 12h10"/><path d="M4 17h14"/></svg>';
  }
  return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/></svg>';
});

function handleCardClick(e: MouseEvent) {
  if (readonly.value) return;
  const el = e.target as HTMLElement;
  if (el.closest('.tail-plus, .node-menu-btn, .el-dropdown-menu')) return;
  if (node) emit('node:edit-meta', { node });
}

function handleMenuCommand(cmd: string) {
  if (cmd === 'rename') emit('node:rename', { node });
  if (cmd === 'edit-meta') emit('node:edit-meta', { node });
  if (cmd === 'copy') emit('node:copy', { node });
  if (cmd === 'delete') emit('node:delete', { node });
}

function handlePlusClick() {
  if (!node) return;
  const pos = node.getBBox();
  emit('node:plus-click', {
    sourceNode: node,
    x: pos.x + pos.width + 28,
    y: pos.y + pos.height / 2,
    sourceEdge: undefined,
  });
}
</script>

<style scoped>
.flow-node {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  position: relative;
  padding: 12px 14px 10px;
  border: 1px solid #e8eaed;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  cursor: move;
  user-select: none;
  transition: border-color 0.16s, box-shadow 0.16s;
}
.flow-node:hover {
  border-color: #d0d7de;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}
.flow-node.is-selected {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.15);
}
.node-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.node-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  flex: 0 0 auto;
  background: #1677ff;
}
.node-icon.end {
  background: #ff4d4f;
}
.node-icon.end span {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background: #fff;
}
.node-title {
  flex: 1;
  min-width: 0;
  color: #141414;
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.node-body {
  margin-top: 10px;
}
.node-line {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  margin-top: 5px;
  font-size: 12px;
  line-height: 18px;
}
.line-label {
  color: #8c8c8c;
  flex: 0 0 72px;
}
.line-value {
  min-width: 0;
  color: #262626;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.line-value.is-empty {
  color: #bfbfbf;
}
.branch-body {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.switch-body {
  gap: 8px;
}
.branch-case {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #262626;
  font-size: 12px;
  line-height: 18px;
}
.branch-case strong {
  font-weight: 600;
}
.branch-case span {
  color: #8c8c8c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.end-node {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.end-node .node-main {
  flex: 1;
  min-width: 0;
}
.runtime-line {
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
}
.runtime-line.success {
  color: #16a34a;
}
.runtime-line.failed {
  color: #ef4444;
}
.runtime-line.running {
  color: #2563eb;
}
.tail-plus {
  position: absolute;
  top: 50%;
  right: -12px;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 1px solid #1677ff;
  border-radius: 50%;
  background: #fff;
  color: #1677ff;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  z-index: 5;
}
.tail-plus:hover {
  background: #1677ff;
  color: #fff;
}
.status-running {
  border-color: #1677ff;
}
.status-success {
  border-color: #52c41a;
}
.status-failed {
  border-color: #ff4d4f;
}
.status-skipped {
  opacity: 0.72;
}
</style>
