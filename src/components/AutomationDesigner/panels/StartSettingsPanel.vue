<template>
  <div class="node-settings-panel start-settings">
    <section class="settings-section">
      <div class="section-title">输入字段</div>
      <p class="section-desc">
        定义调用流程时的入参，下游节点可引用。默认提供用户问题、对话历史、图片；图片字段名建议为
        <code>images</code>，LLM 节点才能自动携带图片。
      </p>
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
        <button type="button" class="field-remove" :disabled="fields.length <= 1" @click="removeField(index)">
          <el-icon :size="14"><Delete /></el-icon>
        </button>
      </div>
      <button type="button" class="field-add" @click="addField">+ 添加字段</button>
    </section>

    <section v-if="isCronTrigger" class="settings-section">
      <div class="section-title-row">
        <div>
          <div class="section-title">定时触发器</div>
          <p class="section-desc">流程发布后按设定频率自动执行；撤销发布会停止后续触发。</p>
        </div>
        <el-switch v-model="schedule.enabled" active-text="启用" inactive-text="未启用" @change="emitChange" />
      </div>

      <div class="cron-grid" :class="{ disabled: !schedule.enabled }">
        <div>
          <label class="field-label">开始执行时间</label>
          <el-date-picker
            v-model="schedule.startTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="为空则从发布成功时间起算"
            style="width: 100%"
            @change="onScheduleTimeChange"
          />
        </div>
        <div>
          <label class="field-label">结束执行时间</label>
          <el-date-picker
            v-model="schedule.endTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="为空则永不结束"
            style="width: 100%"
            @change="emitChange"
          />
        </div>
        <div>
          <label class="field-label">循环频率</label>
          <el-select v-model="schedule.frequency" style="width: 100%" @change="onFrequencyChange">
            <el-option label="每分钟" value="MINUTE" />
            <el-option label="每小时" value="HOUR" />
            <el-option label="每天" value="DAY" />
            <el-option label="自定义 Cron" value="CUSTOM" />
          </el-select>
        </div>
        <div>
          <label class="field-label">时区</label>
          <el-input v-model="schedule.timeZone" placeholder="Asia/Shanghai" @change="emitChange" />
        </div>
        <div class="cron-full">
          <label class="field-label">Cron 表达式</label>
          <el-input
            v-model="schedule.cronExpression"
            :disabled="schedule.frequency !== 'CUSTOM'"
            placeholder="0 * * * * ?"
            @change="emitChange"
          />
          <p class="field-hint">{{ frequencyHint }}</p>
        </div>
      </div>

      <div class="preview-box" :class="{ disabled: !schedule.enabled }">
        <div class="preview-title">执行时间预览</div>
        <ul v-if="nextRuns.length" class="preview-list">
          <li v-for="(item, idx) in nextRuns" :key="idx">{{ item }}</li>
        </ul>
        <p v-else class="preview-empty">当前配置无法预览下一次执行时间</p>
        <p class="preview-end">{{ endHint }}</p>
      </div>

      <div class="default-params" :class="{ disabled: !schedule.enabled }">
        <div class="section-title">默认参数（入参）</div>
        <p class="section-desc">定时触发时预置入参，等价于外部调用传入的流程参数。必填字段需提供值。</p>
        <div v-for="field in fields.filter((f) => f.name?.trim())" :key="field.name" class="param-row">
          <label class="param-label">
            {{ field.displayName || field.name }}
            <span v-if="field.required" class="required">*</span>
          </label>
          <el-input
            v-if="field.type !== 'number'"
            v-model="defaultParams[field.name]"
            :placeholder="field.type === 'image' ? '图片地址或留空' : `请输入 ${field.displayName || field.name}`"
            @change="emitChange"
          />
          <el-input-number
            v-else
            v-model="defaultParams[field.name]"
            controls-position="right"
            style="width: 100%"
            @change="emitChange"
          />
        </div>
        <el-empty v-if="!fields.some((f) => f.name?.trim())" description="请先添加输入字段" :image-size="48" />
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

type ScheduleFrequency = 'MINUTE' | 'HOUR' | 'DAY' | 'CUSTOM';

const props = defineProps<{ node: Node }>();
const emit = defineEmits<{ updateConfig: [config: Record<string, any>] }>();

const fields = ref<StartField[]>([]);
const defaultParams = reactive<Record<string, any>>({});
const schedule = reactive({
  enabled: true,
  frequency: 'MINUTE' as ScheduleFrequency,
  cronExpression: '0 * * * * ?',
  timeZone: 'Asia/Shanghai',
  startTime: '' as string,
  endTime: '' as string
});

const nodeType = computed(() => props.node?.getData()?.nodeType || '');
const isCronTrigger = computed(() => nodeType.value === 'CRON_TRIGGER');

const DEFAULT_FIELDS: StartField[] = [
  { name: 'content', displayName: '用户问题', type: 'text', required: true },
  { name: 'history', displayName: '对话历史', type: 'text', required: false },
  { name: 'images', displayName: '图片', type: 'image', required: false }
];

const frequencyHint = computed(() => {
  switch (schedule.frequency) {
    case 'MINUTE':
      return '每分钟：秒取自开始时间，分按 0/1 递增（Quartz：秒 0/1 * * * ?）';
    case 'HOUR':
      return '每小时：分秒取自开始时间；未选开始时间默认 00 分 00 秒';
    case 'DAY':
      return '每天：时分秒取自开始时间；未选开始时间默认 00:00:00';
    default:
      return '自定义 Quartz Cron，支持秒级字段';
  }
});

const endHint = computed(() => (schedule.endTime ? `结束于 ${schedule.endTime}` : '永不结束'));

const nextRuns = computed(() => {
  if (!isCronTrigger.value || !schedule.enabled) return [];
  try {
    return previewNextRuns(schedule.cronExpression, schedule.startTime, schedule.endTime, 5);
  } catch {
    return [];
  }
});

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
        required: item.required !== false
      }));
    } else {
      fields.value = DEFAULT_FIELDS.map((f) => ({ ...f }));
    }

    schedule.enabled = cfg.scheduleEnabled !== false;
    schedule.frequency = (cfg.scheduleFrequency as ScheduleFrequency) || inferFrequency(cfg.cronExpression);
    schedule.cronExpression = cfg.cronExpression || buildCron(schedule.frequency, cfg.startTime || '');
    schedule.timeZone = cfg.timeZone || 'Asia/Shanghai';
    schedule.startTime = cfg.startTime || '';
    schedule.endTime = cfg.endTime || '';

    Object.keys(defaultParams).forEach((key) => delete defaultParams[key]);
    const params = cfg.defaultParams && typeof cfg.defaultParams === 'object' ? cfg.defaultParams : {};
    fields.value.forEach((field) => {
      if (!field.name) return;
      defaultParams[field.name] = params[field.name] ?? (field.type === 'number' ? undefined : '');
    });
  },
  { immediate: true }
);

function addField() {
  fields.value.push({ name: '', displayName: '', type: 'text', required: true });
  emitChange();
}

function removeField(index: number) {
  if (fields.value.length <= 1) return;
  const removed = fields.value[index];
  fields.value.splice(index, 1);
  if (removed?.name) delete defaultParams[removed.name];
  emitChange();
}

function onFrequencyChange() {
  if (schedule.frequency !== 'CUSTOM') {
    schedule.cronExpression = buildCron(schedule.frequency, schedule.startTime);
  }
  emitChange();
}

function onScheduleTimeChange() {
  if (schedule.frequency !== 'CUSTOM') {
    schedule.cronExpression = buildCron(schedule.frequency, schedule.startTime);
  }
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
      required: !!f.required
    }));

  const config: Record<string, any> = { inputFields, fields: inputFields };
  if (isCronTrigger.value) {
    const params: Record<string, any> = {};
    inputFields.forEach((field) => {
      const value = defaultParams[field.name];
      if (value !== undefined && value !== null && value !== '') params[field.name] = value;
    });
    config.scheduleEnabled = schedule.enabled;
    config.scheduleFrequency = schedule.frequency;
    config.cronExpression = schedule.cronExpression;
    config.timeZone = schedule.timeZone;
    config.startTime = schedule.startTime || undefined;
    config.endTime = schedule.endTime || undefined;
    config.defaultParams = params;
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

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function parseDateTime(value?: string) {
  if (!value) return null;
  const date = new Date(value.replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function buildCron(frequency: ScheduleFrequency, startTime?: string): string {
  const start = parseDateTime(startTime);
  const second = start?.getSeconds() ?? 0;
  const minute = start?.getMinutes() ?? 0;
  const hour = start?.getHours() ?? 0;
  if (frequency === 'MINUTE') return `${second} 0/1 * * * ?`;
  if (frequency === 'HOUR') return `${second} ${minute} 0/1 * * ?`;
  if (frequency === 'DAY') return `${second} ${minute} ${hour} * * ?`;
  return '0 * * * * ?';
}

function inferFrequency(cron?: string): ScheduleFrequency {
  const text = String(cron || '').trim();
  if (/^\d+\s+0\/1\s+\*\s+\*\s+\*\s+\?$/.test(text)) return 'MINUTE';
  if (/^\d+\s+\d+\s+0\/1\s+\*\s+\*\s+\?$/.test(text)) return 'HOUR';
  if (/^\d+\s+\d+\s+\d+\s+\*\s+\*\s+\?$/.test(text)) return 'DAY';
  return text ? 'CUSTOM' : 'MINUTE';
}

function previewNextRuns(cron: string, startTime?: string, endTime?: string, count = 5) {
  const parts = String(cron || '').trim().split(/\s+/);
  if (parts.length < 6) return [];
  const [secPart, minPart, hourPart] = parts;
  const now = new Date();
  const start = parseDateTime(startTime);
  const end = parseDateTime(endTime);
  let cursor = start && start > now ? new Date(start) : new Date(now.getTime() + 1000);
  const result: string[] = [];
  let guard = 0;
  while (result.length < count && guard < 20000) {
    guard += 1;
    cursor = new Date(cursor.getTime() + 1000);
    if (end && cursor > end) break;
    if (start && cursor < start) {
      cursor = new Date(start);
      continue;
    }
    if (!matchCronField(secPart, cursor.getSeconds())) continue;
    if (!matchCronField(minPart, cursor.getMinutes())) continue;
    if (!matchCronField(hourPart, cursor.getHours())) continue;
    result.push(formatDateTime(cursor));
  }
  return result;
}

function matchCronField(part: string, value: number) {
  if (part === '*') return true;
  if (/^\d+$/.test(part)) return Number(part) === value;
  const step = part.match(/^(\d+)\/(\d+)$/);
  if (step) {
    const start = Number(step[1]);
    const interval = Number(step[2]);
    return value >= start && (value - start) % interval === 0;
  }
  const starStep = part.match(/^\*\/(\d+)$/);
  if (starStep) return value % Number(starStep[1]) === 0;
  if (part.includes(',')) return part.split(',').some((item) => matchCronField(item, value));
  return false;
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
.section-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.section-title-row .section-title,
.section-title-row .section-desc {
  margin-bottom: 0;
}
.cron-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.cron-full {
  grid-column: 1 / -1;
}
.field-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: #8c8c8c;
  line-height: 1.5;
}
.preview-box,
.default-params {
  margin-top: 16px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  background: #fafafa;
}
.preview-title {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #262626;
}
.preview-list {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  color: #595959;
  line-height: 1.7;
}
.preview-empty,
.preview-end {
  margin: 6px 0 0;
  font-size: 12px;
  color: #8c8c8c;
}
.param-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}
.param-label {
  font-size: 13px;
  color: #595959;
}
.required {
  color: #ff4d4f;
  margin-left: 2px;
}
.disabled {
  opacity: 0.55;
  pointer-events: none;
}
code {
  padding: 0 4px;
  border-radius: 3px;
  background: #f5f5f5;
  color: #1677ff;
  font-size: 12px;
}
</style>
