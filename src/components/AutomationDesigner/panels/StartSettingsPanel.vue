<template>
  <div class="node-settings-panel start-settings">
    <section class="settings-section">
      <div class="section-title">输入字段</div>
      <p class="section-desc">定义流程调用时的入参，下游节点可引用这些字段。</p>
      <div class="field-table-head">
        <span>字段名称</span>
        <span>显示名称</span>
        <span>字段类型</span>
        <span>必填</span>
        <span />
      </div>
      <div v-for="(field, index) in fields" :key="index" class="field-table-row">
        <el-input v-model="field.name" placeholder="content" @change="emitChange" />
        <el-input v-model="field.displayName" placeholder="用户问题" @change="emitChange" />
        <el-select v-model="field.type" @change="emitChange">
          <el-option label="文本" value="text" />
          <el-option label="数字" value="number" />
          <el-option label="图片" value="image" />
        </el-select>
        <el-switch v-model="field.required" @change="emitChange" />
        <button
          type="button"
          class="field-remove"
          :disabled="fields.length <= 1"
          @click="removeField(index)"
        >
          <el-icon :size="14"><Delete /></el-icon>
        </button>
      </div>
      <button type="button" class="field-add" @click="addField">+ 添加字段</button>
    </section>

    <section v-if="isCronTrigger" class="settings-section">
      <div class="section-title">定时触发器</div>
      <p class="section-desc">流程发布后按设定频率自动执行。</p>
      <div class="cron-grid">
        <div>
          <label class="field-label">Cron 表达式</label>
          <el-input v-model="cron.cronExpression" placeholder="0 0/5 * * * ?" @change="emitChange" />
        </div>
        <div>
          <label class="field-label">时区</label>
          <el-input v-model="cron.timeZone" placeholder="Asia/Shanghai" @change="emitChange" />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { Delete } from '@element-plus/icons-vue';
import type { Node } from '@antv/x6';
import { getDefaultConfig } from '../config/nodeConfig';
import './settingsShared.css';

interface StartField {
  name: string;
  displayName: string;
  type: string;
  required: boolean;
}

const props = defineProps<{ node: Node }>();
const emit = defineEmits<{ updateConfig: [config: Record<string, any>] }>();

const fields = ref<StartField[]>([]);
const cron = reactive({ cronExpression: '0 * * * * ?', timeZone: 'Asia/Shanghai' });

const nodeType = computed(() => props.node?.getData()?.nodeType || '');
const isCronTrigger = computed(() => nodeType.value === 'CRON_TRIGGER');

const DEFAULT_FIELDS: StartField[] = [
  { name: 'content', displayName: '用户问题', type: 'text', required: true },
  { name: 'history', displayName: '对话历史', type: 'text', required: false },
  { name: 'images', displayName: '图片', type: 'image', required: false },
];

watch(
  () => props.node,
  (node) => {
    if (!node) return;
    const data = node.getData() || {};
    const type = data.nodeType || 'MANUAL_TRIGGER';
    const cfg = { ...getDefaultConfig(type), ...(data.config || {}) };
    const raw = cfg.inputFields || cfg.fields;
    if (Array.isArray(raw) && raw.length) {
      fields.value = raw.map((item: any) => ({
        name: item.name || item.field || '',
        displayName: item.displayName || item.description || item.label || '',
        type: item.type || 'text',
        required: item.required !== false,
      }));
    } else {
      fields.value = DEFAULT_FIELDS.map((f) => ({ ...f }));
    }
    cron.cronExpression = cfg.cronExpression || '0 * * * * ?';
    cron.timeZone = cfg.timeZone || 'Asia/Shanghai';
  },
  { immediate: true },
);

function addField() {
  fields.value.push({ name: '', displayName: '', type: 'text', required: true });
  emitChange();
}

function removeField(index: number) {
  if (fields.value.length <= 1) return;
  fields.value.splice(index, 1);
  emitChange();
}

function buildConfig() {
  const inputFields = fields.value
    .filter((f) => f.name?.trim())
    .map((f) => ({
      name: f.name.trim(),
      displayName: f.displayName?.trim() || f.name.trim(),
      description: f.displayName?.trim() || f.name.trim(),
      type: f.type,
      required: f.required,
    }));
  const config: Record<string, any> = { inputFields, fields: inputFields };
  if (isCronTrigger.value) {
    config.cronExpression = cron.cronExpression;
    config.timeZone = cron.timeZone;
  }
  return config;
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
.field-table-head,
.field-table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 96px 52px 32px;
  gap: 8px;
  align-items: center;
}
.field-table-head {
  margin-bottom: 8px;
  font-size: 12px;
  color: #bfbfbf;
}
.field-table-row {
  margin-bottom: 8px;
}
.field-remove {
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
.field-remove:hover:not(:disabled) {
  color: #ff4d4f;
  background: #fff1f0;
}
.field-remove:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}
.field-add {
  border: none;
  background: none;
  padding: 4px 0 0;
  font-size: 13px;
  color: #1677ff;
  cursor: pointer;
}
.cron-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
</style>
