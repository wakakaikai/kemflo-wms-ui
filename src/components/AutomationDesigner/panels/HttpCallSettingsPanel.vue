<template>
  <div class="http-settings node-settings-panel">
    <section class="settings-section">
      <div class="section-title">描述</div>
      <el-input
        v-model="form.description"
        type="textarea"
        :rows="2"
        placeholder="请输入节点描述"
        @change="emitChange"
      />
    </section>

    <section class="settings-section">
      <div class="section-title">输入变量</div>
      <InputMappingEditor v-model="inputMapping" :node="node" @change="emitChange" />
    </section>

    <section class="settings-section">
      <div class="request-line">
        <el-select v-model="form.method" class="method-select" @change="onMethodChange">
          <el-option v-for="method in HTTP_METHODS" :key="method" :label="method" :value="method" />
        </el-select>
        <VariableAwareInput
          v-model="form.url"
          placeholder="{{domainURL}}/test/jeecgDemo/list"
          :options="upstreamOptions"
          @change="emitChange"
        />
      </div>
    </section>

    <section class="settings-section">
      <div class="section-title">请求参数</div>
      <KeyValueListEditor
        v-model="form.queryList"
        key-placeholder="参数名"
        value-placeholder='参数值，按下 "/" 可以选择变量'
        add-label="+ 添加参数"
        show-header
        key-column-label="参数名"
        value-column-label="参数值"
        enable-variable-picker
        :variable-options="upstreamOptions"
        :min-rows="0"
        @change="emitChange"
      />
    </section>

    <section class="settings-section">
      <div class="section-title">请求头</div>
      <KeyValueListEditor
        v-model="form.headersList"
        key-placeholder="参数名"
        value-placeholder='参数值，按下 "/" 可以选择变量'
        add-label="+ 添加参数"
        show-header
        key-column-label="参数名"
        value-column-label="参数值"
        enable-variable-picker
        :variable-options="upstreamOptions"
        :min-rows="0"
        @change="emitChange"
      />
    </section>

    <section class="settings-section">
      <div class="section-title">请求体</div>
      <el-select v-model="form.bodyType" class="full-width body-type-select" @change="onBodyTypeChange">
        <el-option label="none" value="none" />
        <el-option label="JSON" value="json" />
        <el-option label="form-data" value="form-data" />
        <el-option label="x-www-form-urlencoded" value="form" />
        <el-option label="raw" value="raw" />
      </el-select>

      <KeyValueListEditor
        v-if="form.bodyType === 'form' || form.bodyType === 'form-data'"
        v-model="form.formBodyList"
        class="body-editor"
        key-placeholder="字段名"
        value-placeholder='字段值，按下 "/" 可以选择变量'
        add-label="+ 添加字段"
        show-header
        key-column-label="字段名"
        value-column-label="字段值"
        enable-variable-picker
        :variable-options="upstreamOptions"
        :min-rows="0"
        @change="emitChange"
      />

      <VariableAwareInput
        v-else
        v-model="form.body"
        class="body-editor"
        type="textarea"
        :rows="8"
        :disabled="form.bodyType === 'none'"
        placeholder='请输入请求体。按下 "/" 可以选择变量'
        :options="upstreamOptions"
        @change="emitChange"
      />
    </section>

    <section class="settings-section settings-inline">
      <div class="inline-field">
        <div class="section-title">超时时间</div>
        <div class="inline-input">
          <el-input-number v-model="timeoutSeconds" :min="1" :max="600" controls-position="right" @change="onTimeoutSecondsChange" />
          <span class="unit">秒</span>
        </div>
      </div>
      <div class="inline-field">
        <div class="section-title">重试次数</div>
        <el-input-number
          v-model="retry.maxRetryCount"
          :min="0"
          :max="10"
          controls-position="right"
          placeholder="请输入重试次数"
          class="full-width"
          @change="emitChange"
        />
      </div>
    </section>

    <section class="settings-section">
      <div class="section-title">输出变量</div>
      <HttpOutputVariableList
        :variables="outputVariables"
        @add="openOutputDialog"
        @remove="removeOutputVariable"
      />
    </section>

    <HttpOutputVariableDialog ref="outputDialogRef" @save="addOutputVariable" />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { Node } from '@antv/x6';
import KeyValueListEditor from './KeyValueListEditor.vue';
import InputMappingEditor from './InputMappingEditor.vue';
import VariableAwareInput from './VariableAwareInput.vue';
import HttpOutputVariableList from './HttpOutputVariableList.vue';
import HttpOutputVariableDialog from './HttpOutputVariableDialog.vue';
import { keyValueRowsToMap, mapToKeyValueRows, type KeyValueRow } from './keyValueUtils';
import { collectUpstreamVariables } from './useUpstreamVariables';
import {
  DEFAULT_HTTP_OUTPUT_VARS,
  loadOutputVariables,
  outputVarsToMapping,
  type HttpOutputVariable,
} from './httpOutputUtils';
import { getDefaultConfig } from '../config/nodeConfig';
import './settingsShared.css';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;
const DEFAULT_JSON_BODY = '{\n  "name": "{{name}}"\n}';

const props = defineProps<{ node: Node }>();
const emit = defineEmits<{ updateConfig: [config: Record<string, any>] }>();

const outputDialogRef = ref<InstanceType<typeof HttpOutputVariableDialog>>();
const inputMapping = ref<Record<string, string>>({});
const outputVariables = ref<HttpOutputVariable[]>(DEFAULT_HTTP_OUTPUT_VARS.map((item) => ({ ...item })));
const retry = reactive({ maxRetryCount: 0, retryInterval: 10 });

const form = reactive({
  description: '',
  method: 'GET',
  url: '',
  contentType: 'application/json',
  headersList: [] as KeyValueRow[],
  queryList: [] as KeyValueRow[],
  formBodyList: [] as KeyValueRow[],
  bodyType: 'none',
  body: '',
  timeoutMs: 120000,
  successCodes: '200,201,204',
  responseType: 'json',
  failStrategy: 'STOP',
});

const upstreamOptions = computed(() => collectUpstreamVariables(props.node));

const timeoutSeconds = computed({
  get: () => Math.max(1, Math.round((form.timeoutMs || 120000) / 1000)),
  set: (value: number) => {
    form.timeoutMs = Number(value || 1) * 1000;
  },
});

watch(
  () => props.node,
  (node) => {
    if (!node) return;
    const data = node.getData() || {};
    const cfg = { ...getDefaultConfig('HTTP_CALL'), ...(data.config || {}) };
    form.description = cfg.description || '';
    form.method = normalizeMethod(cfg.method);
    form.url = cfg.url || '';
    form.contentType = cfg.contentType || 'application/json';
    form.headersList = mapToKeyValueRows(cfg.headers);
    form.queryList = mapToKeyValueRows(cfg.queryParams || cfg.params);
    form.bodyType = normalizeBodyType(cfg.bodyType || defaultBodyTypeForMethod(form.method));
    form.body = typeof cfg.body === 'string' ? cfg.body : cfg.body ? JSON.stringify(cfg.body, null, 2) : '';
    if (!form.body && form.bodyType === 'json') form.body = DEFAULT_JSON_BODY;
    form.formBodyList = loadFormBody(cfg);
    form.timeoutMs = cfg.timeoutMs ?? 120000;
    form.successCodes = cfg.successCodes || '200,201,204';
    form.responseType = cfg.responseType || 'json';
    form.failStrategy = cfg.failStrategy || 'STOP';
    inputMapping.value = { ...(cfg.inputMapping || {}) };
    outputVariables.value = loadOutputVariables(cfg);
    Object.assign(retry, cfg.retry || { maxRetryCount: 0, retryInterval: 10 });
    syncContentTypeByBodyType();
  },
  { immediate: true },
);

function normalizeMethod(value: unknown): string {
  const method = String(value || 'GET').toUpperCase();
  return HTTP_METHODS.includes(method as typeof HTTP_METHODS[number]) ? method : 'GET';
}

function normalizeBodyType(value: string) {
  if (value === 'form-urlencoded') return 'form';
  return value;
}

function defaultBodyTypeForMethod(method: string) {
  return ['GET', 'HEAD', 'DELETE'].includes(normalizeMethod(method)) ? 'none' : 'json';
}

function onMethodChange() {
  form.method = normalizeMethod(form.method);
  if (['GET', 'HEAD', 'DELETE'].includes(form.method)) {
    form.bodyType = 'none';
  } else if (form.bodyType === 'none') {
    form.bodyType = 'json';
    if (!form.body.trim()) form.body = DEFAULT_JSON_BODY;
  }
  syncContentTypeByBodyType();
  emitChange();
}

function onBodyTypeChange() {
  if (form.bodyType === 'json' && !form.body.trim()) {
    form.body = DEFAULT_JSON_BODY;
  }
  syncContentTypeByBodyType();
  emitChange();
}

function onTimeoutSecondsChange() {
  emitChange();
}

function syncContentTypeByBodyType() {
  if (form.bodyType === 'json') form.contentType = 'application/json';
  if (form.bodyType === 'form') form.contentType = 'application/x-www-form-urlencoded';
  if (form.bodyType === 'form-data') form.contentType = 'multipart/form-data';
  if (form.bodyType === 'raw' && (!form.contentType || form.contentType.includes('json'))) {
    form.contentType = 'text/plain';
  }
}

function loadFormBody(cfg: Record<string, any>) {
  if (cfg.formBody && typeof cfg.formBody === 'object') return mapToKeyValueRows(cfg.formBody);
  if ((cfg.bodyType === 'form' || cfg.bodyType === 'form-data') && cfg.body) {
    try {
      const parsed = typeof cfg.body === 'string' ? JSON.parse(cfg.body) : cfg.body;
      return mapToKeyValueRows(parsed);
    } catch {
      return [];
    }
  }
  return [];
}

function openOutputDialog() {
  outputDialogRef.value?.open();
}

function addOutputVariable(item: HttpOutputVariable) {
  if (outputVariables.value.some((v) => v.name === item.name)) return;
  outputVariables.value.push(item);
  emitChange();
}

function removeOutputVariable(index: number) {
  const item = outputVariables.value[index];
  if (!item || item.builtin) return;
  outputVariables.value.splice(index, 1);
  emitChange();
}

function normalizeTemplateText(value: string) {
  return value.replace(/\{\{\s*([^}]+?)\s*\}\}/g, '${$1}');
}

function normalizeTemplateMap(map: Record<string, string>) {
  const result: Record<string, string> = {};
  Object.entries(map).forEach(([key, val]) => {
    result[key] = normalizeTemplateText(String(val ?? ''));
  });
  return result;
}

function buildConfig() {
  const formBody = keyValueRowsToMap(form.formBodyList);
  const outputMapping = outputVarsToMapping(outputVariables.value);
  let body = form.body;
  if (form.bodyType === 'form' || form.bodyType === 'form-data') {
    body = Object.keys(formBody).length ? JSON.stringify(formBody) : '';
  }
  return {
    description: form.description,
    inputMapping: normalizeTemplateMap(inputMapping.value),
    method: normalizeMethod(form.method),
    url: normalizeTemplateText(form.url),
    contentType: form.contentType,
    headers: normalizeTemplateMap(keyValueRowsToMap(form.headersList)),
    queryParams: normalizeTemplateMap(keyValueRowsToMap(form.queryList)),
    bodyType: form.bodyType,
    body: normalizeTemplateText(body),
    formBody: normalizeTemplateMap(formBody),
    timeoutMs: form.timeoutMs,
    successCodes: form.successCodes,
    responseType: form.responseType,
    outputMapping,
    outputVariables: outputVariables.value.map((item) => ({ ...item })),
    outputVar: 'body',
    failStrategy: form.failStrategy,
    retry: { ...retry },
  };
}

function emitChange() {
  if (!props.node) return;
  const config = buildConfig();
  const data = props.node.getData() || {};
  props.node.setData({ ...data, config: { ...data.config, ...config } });
  emit('updateConfig', config);
}

defineExpose({ buildConfig, emitChange });
</script>

<style scoped>
.http-settings {
  padding-top: 0;
}
.request-line {
  display: grid;
  grid-template-columns: 108px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}
.method-select,
.full-width {
  width: 100%;
}
.body-type-select {
  margin-bottom: 10px;
}
.body-editor {
  margin-top: 0;
}
.body-editor :deep(.el-textarea__inner) {
  font-family: Consolas, Menlo, Monaco, monospace;
  font-size: 12px;
  line-height: 1.55;
  min-height: 180px;
}
.settings-inline {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.inline-field .section-title {
  margin-bottom: 8px;
}
.inline-input {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
}
.unit {
  color: #8c8c8c;
  font-size: 13px;
  white-space: nowrap;
}
</style>
