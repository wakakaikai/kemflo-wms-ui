<template>
  <div class="node-settings-panel switch-settings">
    <section v-for="(branch, index) in branches" :key="branch.id" class="settings-section branch-section">
      <div class="section-title-row">
        <span class="section-title">{{ branchLabel(index) }}</span>
        <el-button
          v-if="index > 0 && index < branches.length - 1"
          link
          type="danger"
          @click="removeBranch(index)"
        >
          删除
        </el-button>
      </div>

      <div v-for="(rule, ruleIndex) in branch.rules" :key="ruleIndex" class="rule-row">
        <el-select v-model="rule.variable" filterable allow-create clearable placeholder="选择变量" class="rule-var" @change="emitChange">
          <el-option v-for="opt in upstreamOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <el-select v-model="rule.operator" class="rule-op" @change="emitChange">
          <el-option v-for="op in OPERATORS" :key="op.value" :label="op.label" :value="op.value" />
        </el-select>
        <el-input v-model="rule.value" placeholder="匹配值" @change="emitChange" />
        <button
          type="button"
          class="rule-remove"
          :disabled="branch.rules.length <= 1"
          @click="removeRule(index, ruleIndex)"
        >
          <el-icon :size="14"><Delete /></el-icon>
        </button>
      </div>

      <button v-if="index < branches.length - 1" type="button" class="rule-add" @click="addRule(index)">+ 添加条件</button>

      <div v-if="index < branches.length - 1 && branch.rules.length > 1" class="logic-row">
        <span class="field-label">组合逻辑</span>
        <el-radio-group v-model="branch.logic" @change="emitChange">
          <el-radio value="AND">与 (AND)</el-radio>
          <el-radio value="OR">或 (OR)</el-radio>
        </el-radio-group>
      </div>
    </section>

    <section class="settings-section">
      <button type="button" class="branch-add" @click="addBranch">+ 添加分支 (ELIF)</button>
    </section>

    <section class="settings-section">
      <div class="section-title">ELSE</div>
      <p class="section-desc">当前面所有 IF / ELIF 条件均不匹配时，流程进入 ELSE 默认分支。</p>
    </section>

    <section class="settings-section">
      <div class="section-title">输出变量</div>
      <div class="output-vars">
        <div><strong>index</strong> — 匹配成功的分支编号（从 0 开始）</div>
        <div><strong>matchedBranch</strong> — 匹配分支标识</div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Delete } from '@element-plus/icons-vue';
import type { Node } from '@antv/x6';
import { collectUpstreamVariables } from './useUpstreamVariables';
import { getDefaultConfig } from '../config/nodeConfig';
import './settingsShared.css';

interface SwitchRule {
  variable: string;
  operator: string;
  value: string;
}

interface SwitchBranch {
  id: string;
  type: 'IF' | 'ELIF' | 'ELSE';
  logic: 'AND' | 'OR';
  rules: SwitchRule[];
}

const OPERATORS = [
  { label: '等于', value: 'eq' },
  { label: '不等于', value: 'ne' },
  { label: '包含', value: 'contains' },
  { label: '不包含', value: 'not_contains' },
  { label: '大于', value: 'gt' },
  { label: '小于', value: 'lt' },
  { label: '大于等于', value: 'gte' },
  { label: '小于等于', value: 'lte' },
];

const props = defineProps<{ node: Node }>();
const emit = defineEmits<{ updateConfig: [config: Record<string, any>] }>();

const branches = ref<SwitchBranch[]>([]);

const upstreamOptions = computed(() => collectUpstreamVariables(props.node));

function branchLabel(index: number) {
  if (index === 0) return 'CASE 1 (IF)';
  if (index === branches.value.length - 1) return 'ELSE';
  return `CASE ${index + 1} (ELIF)`;
}

function newRule(): SwitchRule {
  return { variable: '', operator: 'eq', value: '' };
}

function newBranch(type: SwitchBranch['type']): SwitchBranch {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    logic: 'AND',
    rules: type === 'ELSE' ? [] : [newRule()],
  };
}

watch(
  () => props.node,
  (node) => {
    if (!node) return;
    const data = node.getData() || {};
    const cfg = { ...getDefaultConfig('SWITCH'), ...(data.config || {}) };

    if (Array.isArray(cfg.branches) && cfg.branches.length) {
      branches.value = cfg.branches.map((b: any, index: number, arr: any[]) => ({
        id: b.id || `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: b.type || (index === 0 ? 'IF' : index === arr.length - 1 ? 'ELSE' : 'ELIF'),
        logic: b.logic || 'AND',
        rules: Array.isArray(b.rules) && b.rules.length ? b.rules : b.type === 'ELSE' ? [] : [newRule()],
      }));
    } else {
      const cases = Array.isArray(cfg.cases) ? cfg.cases : [];
      const mapped: SwitchBranch[] = [{ ...newBranch('IF'), rules: [newRule()] }];
      cases.filter((c: any) => c.type !== 'DEFAULT' && c.type !== 'ELSE').slice(1).forEach(() => {
        mapped.push(newBranch('ELIF'));
      });
      mapped.push({ ...newBranch('ELSE'), type: 'ELSE', rules: [] });
      branches.value = mapped;
    }
  },
  { immediate: true },
);

function addBranch() {
  const elseIndex = branches.value.length - 1;
  branches.value.splice(elseIndex, 0, newBranch('ELIF'));
  emitChange();
}

function removeBranch(index: number) {
  if (index <= 0 || index >= branches.value.length - 1) return;
  branches.value.splice(index, 1);
  emitChange();
}

function addRule(branchIndex: number) {
  branches.value[branchIndex].rules.push(newRule());
  emitChange();
}

function removeRule(branchIndex: number, ruleIndex: number) {
  const branch = branches.value[branchIndex];
  if (branch.rules.length <= 1) return;
  branch.rules.splice(ruleIndex, 1);
  emitChange();
}

function buildExpression(branch: SwitchBranch) {
  const parts = branch.rules
    .filter((r) => r.variable?.trim())
    .map((r) => {
      const varExpr = r.variable.includes('${') ? r.variable : `\${${r.variable}}`;
      const val = r.value?.includes('${') ? r.value : `"${r.value || ''}"`;
      switch (r.operator) {
        case 'ne': return `${varExpr} != ${val}`;
        case 'contains': return `${varExpr}.contains(${val})`;
        case 'not_contains': return `!${varExpr}.contains(${val})`;
        case 'gt': return `${varExpr} > ${val}`;
        case 'lt': return `${varExpr} < ${val}`;
        case 'gte': return `${varExpr} >= ${val}`;
        case 'lte': return `${varExpr} <= ${val}`;
        default: return `${varExpr} == ${val}`;
      }
    });
  if (!parts.length) return '';
  return parts.length === 1 ? parts[0] : parts.join(branch.logic === 'OR' ? ' || ' : ' && ');
}

function buildConfig() {
  const conditionalBranches = branches.value.filter((b) => b.type !== 'ELSE');
  const cases = conditionalBranches.map((branch, index) => ({
    label: index === 0 ? 'CASE 1' : `CASE ${index + 1}`,
    type: index === 0 ? 'CASE' : 'ELIF',
    value: buildExpression(branch) || `case_${index + 1}`,
    remarks: `CASE ${index + 1}`,
    logic: branch.logic,
    rules: branch.rules,
  }));
  cases.push({ label: 'ELSE', type: 'DEFAULT', value: 'default', remarks: 'ELSE', logic: 'AND', rules: [] });

  return {
    branches: branches.value,
    cases,
    expression: cases[0]?.value || '',
  };
}

function emitChange() {
  if (!props.node) return;
  const config = buildConfig();
  const data = props.node.getData() || {};
  props.node.setData({ ...data, config: { ...data.config, ...config } });
  emit('updateConfig', config);
}

defineExpose({ emitChange });
</script>

<style scoped>
.branch-section {
  background: #fafafa;
  margin: 0 -16px;
  padding: 14px 16px;
  border-bottom: 1px solid #edf0f3;
}
.rule-row {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) 110px minmax(0, 1fr) 32px;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}
.rule-remove {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #c0c4cc;
  cursor: pointer;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.rule-remove:hover:not(:disabled) {
  color: #ff4d4f;
  background: #fff1f0;
}
.rule-add,
.branch-add {
  border: none;
  background: none;
  padding: 4px 0;
  font-size: 13px;
  color: #1677ff;
  cursor: pointer;
}
.logic-row {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.output-vars {
  color: #595959;
  font-size: 12px;
  line-height: 1.8;
}
</style>
