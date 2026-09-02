<template>
  <div class="node-settings-panel chat-var-settings">
    <section class="settings-section">
      <div class="section-title">{{ isGet ? '读取变量' : '赋值变量' }}</div>
      <p class="section-desc">
        {{ isGet ? '从 AI 应用变量中读取指定值，供下游节点使用。' : '将值写入 AI 应用变量，供后续轮次或其他流程读取。' }}
      </p>

      <div v-if="isGet" class="var-list">
        <div v-for="(row, index) in getRows" :key="index" class="var-row">
          <el-input v-model="row.name" placeholder="变量名" @change="emitChange" />
          <button type="button" class="var-remove" :disabled="getRows.length <= 1" @click="removeGetRow(index)">
            <el-icon :size="14"><Delete /></el-icon>
          </button>
        </div>
        <button type="button" class="var-add" @click="addGetRow">+ 添加变量</button>
      </div>

      <div v-else class="var-list">
        <div class="set-head">
          <span>变量名</span>
          <span>变量值</span>
          <span />
        </div>
        <div v-for="(row, index) in setRows" :key="index" class="set-row">
          <el-input v-model="row.name" placeholder="变量名" @change="emitChange" />
          <div class="set-value-cell">
            <el-select v-model="row.mode" class="set-mode" @change="emitChange">
              <el-option label="引用变量" value="ref" />
              <el-option label="自定义值" value="custom" />
            </el-select>
            <el-select
              v-if="row.mode === 'ref'"
              v-model="row.valueExpression"
              filterable
              allow-create
              clearable
              placeholder="选择上游 string 变量"
              @change="emitChange"
            >
              <el-option v-for="opt in upstreamOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
            <el-input v-else v-model="row.customValue" placeholder="固定文本值" @change="emitChange" />
          </div>
          <button type="button" class="var-remove" :disabled="setRows.length <= 1" @click="removeSetRow(index)">
            <el-icon :size="14"><Delete /></el-icon>
          </button>
        </div>
        <button type="button" class="var-add" @click="addSetRow">+ 添加变量</button>
      </div>
    </section>

    <section v-if="isGet" class="settings-section">
      <div class="section-title">输出变量</div>
      <p class="section-desc">每个已配置的变量名将自动生成同名 string 输出字段。</p>
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

interface GetRow {
  name: string;
}

interface SetRow {
  name: string;
  mode: 'ref' | 'custom';
  valueExpression: string;
  customValue: string;
}

const props = defineProps<{ node: Node; mode?: 'get' | 'set' }>();
const emit = defineEmits<{ updateConfig: [config: Record<string, any>] }>();

const getRows = ref<GetRow[]>([{ name: '' }]);
const setRows = ref<SetRow[]>([{ name: '', mode: 'ref', valueExpression: '', customValue: '' }]);

const nodeType = computed(() => props.node?.getData()?.nodeType || '');
const isGet = computed(() => props.mode === 'get' || nodeType.value === 'CHAT_VAR_GET');
const upstreamOptions = computed(() => collectUpstreamVariables(props.node));

watch(
  () => props.node,
  (node) => {
    if (!node) return;
    const data = node.getData() || {};
    const type = data.nodeType || '';
    const cfg = { ...getDefaultConfig(type), ...(data.config || {}) };
    const vars = Array.isArray(cfg.variables) ? cfg.variables : [];

    if (type === 'CHAT_VAR_GET') {
      getRows.value = vars.length
        ? vars.map((item: any) => ({ name: item.name || item.field || '' }))
        : [{ name: '' }];
    } else {
      setRows.value = vars.length
        ? vars.map((item: any) => ({
          name: item.name || item.field || '',
          mode: item.valueExpression || item.expression ? 'ref' : 'custom',
          valueExpression: item.valueExpression || item.expression || item.value || '',
          customValue: item.customValue || item.value || '',
        }))
        : [{ name: '', mode: 'ref', valueExpression: '', customValue: '' }];
    }
  },
  { immediate: true },
);

function addGetRow() {
  getRows.value.push({ name: '' });
  emitChange();
}

function removeGetRow(index: number) {
  if (getRows.value.length <= 1) return;
  getRows.value.splice(index, 1);
  emitChange();
}

function addSetRow() {
  setRows.value.push({ name: '', mode: 'ref', valueExpression: '', customValue: '' });
  emitChange();
}

function removeSetRow(index: number) {
  if (setRows.value.length <= 1) return;
  setRows.value.splice(index, 1);
  emitChange();
}

function buildConfig() {
  if (isGet.value) {
    const variables = getRows.value
      .filter((r) => r.name?.trim())
      .map((r) => ({ name: r.name.trim(), description: r.name.trim() }));
    return { variables };
  }
  const variables = setRows.value
    .filter((r) => r.name?.trim())
    .map((r) => ({
      name: r.name.trim(),
      valueExpression: r.mode === 'ref' ? r.valueExpression : r.customValue,
      value: r.mode === 'ref' ? r.valueExpression : r.customValue,
    }));
  return { variables };
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
.var-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 32px;
  gap: 8px;
  margin-bottom: 8px;
}
.set-head,
.set-row {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.4fr) 32px;
  gap: 8px;
  align-items: center;
}
.set-head {
  margin-bottom: 8px;
  font-size: 12px;
  color: #bfbfbf;
}
.set-value-cell {
  display: grid;
  grid-template-columns: 108px minmax(0, 1fr);
  gap: 8px;
  min-width: 0;
}
.var-remove {
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
.var-remove:hover:not(:disabled) {
  color: #ff4d4f;
  background: #fff1f0;
}
.var-add {
  border: none;
  background: none;
  padding: 4px 0;
  font-size: 13px;
  color: #1677ff;
  cursor: pointer;
}
</style>
