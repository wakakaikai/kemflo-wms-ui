<template>
  <div class="http-settings">
    <!-- 请求 URL -->
    <section class="http-section">
      <label class="form-label required">请求方式</label>
      <el-radio-group v-model="form.method" class="http-method-group" @change="onMethodChange">
        <el-radio-button v-for="m in HTTP_METHODS" :key="m" :label="m">{{ m }}</el-radio-button>
      </el-radio-group>

      <label class="form-label required spacing-top">API URL</label>
      <el-input
        v-model="form.url"
        class="url-input-full"
        size="default"
        placeholder="https://api.example.com/path/${orderId}"
        clearable
        @change="emitChange"
      />
      <p class="form-tip">支持 <span class="var-tag">${变量名}</span> 引用流程变量</p>
    </section>

    <!-- Headers -->
    <section class="http-section">
      <div class="section-label">Headers</div>
      <KeyValueListEditor
        v-model="form.headersList"
        key-placeholder="key"
        value-placeholder=""
        add-label="+ header"
        show-header
        key-column-label="名称"
        value-column-label="值"
        @change="emitChange"
      />
    </section>

    <!-- Query -->
    <section class="http-section">
      <div class="section-label">Query 参数</div>
      <KeyValueListEditor
        v-model="form.queryList"
        key-placeholder="参数名"
        value-placeholder="参数值"
        add-label="+ 添加参数"
        show-header
        key-column-label="名称"
        value-column-label="值"
        @change="emitChange"
      />
    </section>

    <!-- Body（POST/PUT/PATCH/DELETE） -->
    <section v-if="showBody" class="http-section">
      <div class="section-label">请求体 Body</div>
      <label class="form-label">Body 类型</label>
      <el-radio-group v-model="form.bodyType" class="body-type-group" @change="onBodyTypeChange">
        <el-radio-button label="json">JSON</el-radio-button>
        <el-radio-button label="form">Form 表单</el-radio-button>
        <el-radio-button label="form-data">FormData</el-radio-button>
        <el-radio-button label="raw">Raw 文本</el-radio-button>
        <el-radio-button label="none">无 Body</el-radio-button>
      </el-radio-group>

      <template v-if="form.bodyType !== 'none'">
        <label class="form-label spacing-top">Content-Type</label>
        <el-input
          v-model="form.contentType"
          :readonly="form.bodyType !== 'raw'"
          :placeholder="contentTypePlaceholder"
          @change="emitChange"
        />
        <p v-if="form.bodyType === 'form-data'" class="form-tip">multipart/form-data 由客户端自动带 boundary，无需手动填写 boundary</p>

        <!-- JSON / Raw -->
        <template v-if="form.bodyType === 'json' || form.bodyType === 'raw'">
          <label class="form-label spacing-top">{{ form.bodyType === 'json' ? 'JSON Body' : 'Raw Body' }}</label>
          <el-input
            v-model="form.body"
            type="textarea"
            :rows="6"
            :placeholder="bodyPlaceholder"
            class="code-area"
            @change="emitChange"
          />
        </template>

        <!-- Form / FormData key-value -->
        <template v-if="form.bodyType === 'form' || form.bodyType === 'form-data'">
          <label class="form-label spacing-top">{{ form.bodyType === 'form-data' ? 'FormData 字段' : 'Form 字段' }}</label>
          <KeyValueListEditor
            v-model="form.formBodyList"
            key-placeholder="字段名"
            value-placeholder="字段值，支持 ${变量}"
            :add-label="form.bodyType === 'form-data' ? '+ 添加字段' : '+ 添加表单项'"
            show-header
            key-column-label="名称"
            value-column-label="值"
            @change="emitChange"
          />
        </template>
      </template>
    </section>

    <!-- 高级 -->
    <section class="http-section http-section-muted">
      <el-collapse v-model="advancedOpen" class="http-collapse">
        <el-collapse-item title="高级选项" name="adv">
          <div class="adv-grid">
            <div>
              <label class="form-label">超时 (ms)</label>
              <el-input-number v-model="form.timeoutMs" :min="1000" :max="300000" :step="1000" controls-position="right" class="full-width" @change="emitChange" />
            </div>
            <div>
              <label class="form-label">成功状态码</label>
              <el-input v-model="form.successCodes" placeholder="200,201,204" @change="emitChange" />
            </div>
            <div>
              <label class="form-label">响应解析</label>
              <el-select v-model="form.responseType" size="default" class="full-width" @change="emitChange">
                <el-option label="JSON" value="json" />
                <el-option label="文本" value="text" />
              </el-select>
            </div>
            <div>
              <label class="form-label">输出变量</label>
              <el-input v-model="form.outputVar" placeholder="httpResponse" @change="emitChange" />
            </div>
            <div class="span-full">
              <label class="form-label">失败策略</label>
              <el-select v-model="form.failStrategy" size="default" class="full-width" @change="emitChange">
                <el-option label="停止" value="STOP" />
                <el-option label="跳过继续" value="CONTINUE" />
                <el-option label="重试" value="RETRY" />
              </el-select>
            </div>
            <template v-if="form.failStrategy === 'RETRY'">
              <div>
                <label class="form-label">重试次数</label>
                <el-input-number v-model="retry.maxRetryCount" :min="0" :max="10" controls-position="right" class="full-width" @change="emitChange" />
              </div>
              <div>
                <label class="form-label">重试间隔 (秒)</label>
                <el-input-number v-model="retry.retryInterval" :min="1" :max="300" controls-position="right" class="full-width" @change="emitChange" />
              </div>
            </template>
          </div>
        </el-collapse-item>
        <el-collapse-item title="节点信息" name="meta">
          <label class="form-label">节点名称</label>
          <el-input v-model="form.name" placeholder="发送自定义请求" @change="emitChange" />
          <label class="form-label spacing-top">节点别名</label>
          <el-input v-model="form.alias" placeholder="可选" @change="emitChange" />
          <label class="form-label spacing-top">说明</label>
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="可选" @change="emitChange" />
        </el-collapse-item>
      </el-collapse>
    </section>

    <!-- 测试 -->
    <section class="http-section http-section-test">
      <div class="section-label-row">
        <span class="section-label">测试 API</span>
        <el-button type="primary" size="default" :loading="testing" @click="handleTest">测试 API</el-button>
      </div>
      <p class="form-tip">返回参数列表（浏览器试发，受 CORS 限制）</p>
      <div v-if="testResult" class="test-box">
        <div class="test-meta" :class="testResult.ok ? 'is-ok' : 'is-err'">
          请求时间 {{ testTime }}，状态码 {{ testResult.status }}，耗时 {{ (testResult.durationMs / 1000).toFixed(3) }} 秒
        </div>
        <div class="test-table-head">
          <span>响应 Body</span>
        </div>
        <el-input
          v-model="testResult.bodyPreview"
          type="textarea"
          :rows="8"
          readonly
          class="code-area"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue';
import { Node } from '@antv/x6';
import KeyValueListEditor from './KeyValueListEditor.vue';
import { mapToKeyValueRows, keyValueRowsToMap, type KeyValueRow } from './keyValueUtils';
import { getDefaultConfig } from '../config/nodeConfig';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;

function normalizeMethod(value: unknown): string {
  if (Array.isArray(value)) {
    return String(value[0] || 'GET').toUpperCase();
  }
  const m = String(value || 'GET').toUpperCase();
  return HTTP_METHODS.includes(m as typeof HTTP_METHODS[number]) ? m : 'GET';
}

const props = defineProps<{ node: Node }>();
const emit = defineEmits<{ updateConfig: [config: Record<string, any>] }>();

const testing = ref(false);
const advancedOpen = ref<string[]>([]);
const testResult = ref<{ status: number; durationMs: number; bodyPreview: string; ok: boolean } | null>(null);
const testTime = ref('');

const retry = reactive({ maxRetryCount: 3, retryInterval: 10 });

const form = reactive({
  name: '',
  alias: '',
  description: '',
  method: 'GET',
  url: '',
  contentType: 'application/json',
  headersList: [{ key: '', value: '' }] as KeyValueRow[],
  queryList: [{ key: '', value: '' }] as KeyValueRow[],
  formBodyList: [{ key: '', value: '' }] as KeyValueRow[],
  bodyType: 'none' as string,
  body: '',
  timeoutMs: 30000,
  successCodes: '200,201,204',
  responseType: 'json',
  outputVar: 'httpResponse',
  failStrategy: 'STOP',
  timeout: 0,
});

function onMethodChange() {
  form.method = normalizeMethod(form.method);
  if (['GET', 'HEAD', 'OPTIONS'].includes(form.method)) {
    form.bodyType = 'none';
  } else if (form.bodyType === 'none') {
    form.bodyType = 'json';
    syncContentTypeByBodyType();
  }
  emitChange();
}

const showBody = computed(() => !['GET', 'HEAD', 'OPTIONS'].includes(normalizeMethod(form.method)));

const contentTypePlaceholder = computed(() => {
  switch (form.bodyType) {
    case 'json': return 'application/json';
    case 'form': return 'application/x-www-form-urlencoded';
    case 'form-data': return 'multipart/form-data';
    case 'raw': return 'text/plain';
    default: return '';
  }
});

const bodyPlaceholder = computed(() =>
  form.bodyType === 'json' ? '{\n  "key": "value"\n}' : '纯文本内容'
);

function defaultBodyTypeForMethod(method: string) {
  return ['GET', 'HEAD', 'OPTIONS'].includes(normalizeMethod(method)) ? 'none' : 'json';
}

function syncContentTypeByBodyType() {
  if (form.bodyType === 'json') form.contentType = 'application/json';
  else if (form.bodyType === 'form') form.contentType = 'application/x-www-form-urlencoded';
  else if (form.bodyType === 'form-data') form.contentType = 'multipart/form-data';
  else if (form.bodyType === 'raw' && (!form.contentType || form.contentType.includes('json'))) form.contentType = 'text/plain';
}

function onBodyTypeChange() {
  syncContentTypeByBodyType();
  emitChange();
}

function loadFormBody(cfg: Record<string, any>) {
  if (cfg.formBody && typeof cfg.formBody === 'object') {
    return mapToKeyValueRows(cfg.formBody);
  }
  if ((cfg.bodyType === 'form' || cfg.bodyType === 'form-data') && cfg.body) {
    const parsed = typeof cfg.body === 'string' ? tryParseObj(cfg.body) : cfg.body;
    if (parsed && typeof parsed === 'object') return mapToKeyValueRows(parsed);
  }
  return [{ key: '', value: '' }];
}

function tryParseObj(raw: string) {
  try { return JSON.parse(raw); } catch { return null; }
}

watch(
  () => props.node,
  (node) => {
    if (!node) return;
    const data = node.getData() || {};
    const cfg = { ...getDefaultConfig('HTTP_CALL'), ...(data.config || {}) };
    form.name = data.label || node.attr('label/text') || '';
    form.alias = cfg.alias || '';
    form.description = cfg.description || '';
    form.method = normalizeMethod(cfg.method);
    form.url = cfg.url || '';
    form.contentType = cfg.contentType || 'application/json';
    form.headersList = mapToKeyValueRows(cfg.headers);
    form.queryList = mapToKeyValueRows(cfg.queryParams);
    form.bodyType = cfg.bodyType || defaultBodyTypeForMethod(String(cfg.method || 'GET'));
    form.body = typeof cfg.body === 'string' ? cfg.body : (cfg.body ? JSON.stringify(cfg.body, null, 2) : '');
    form.formBodyList = loadFormBody(cfg);
    syncContentTypeByBodyType();
    form.timeoutMs = cfg.timeoutMs ?? 30000;
    form.successCodes = cfg.successCodes || '200,201,204';
    form.responseType = cfg.responseType || 'json';
    form.outputVar = cfg.outputVar || 'httpResponse';
    form.failStrategy = cfg.failStrategy || 'STOP';
    form.timeout = cfg.timeout ?? 0;
    Object.assign(retry, cfg.retry || { maxRetryCount: 3, retryInterval: 10 });
    testResult.value = null;
  },
  { immediate: true }
);

watch(() => form.method, (m) => {
  const method = normalizeMethod(m);
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    form.bodyType = 'none';
  } else if (form.bodyType === 'none') {
    form.bodyType = 'json';
    syncContentTypeByBodyType();
  }
});

function buildConfig() {
  const formBody = keyValueRowsToMap(form.formBodyList);
  const bodyType = form.bodyType;
  let body = form.body;
  if (bodyType === 'form' || bodyType === 'form-data') {
    body = Object.keys(formBody).length ? JSON.stringify(formBody) : '';
  }
  return {
    method: normalizeMethod(form.method),
    url: form.url,
    contentType: form.contentType,
    headers: keyValueRowsToMap(form.headersList),
    queryParams: keyValueRowsToMap(form.queryList),
    bodyType,
    body,
    formBody,
    timeoutMs: form.timeoutMs,
    successCodes: form.successCodes,
    responseType: form.responseType,
    outputVar: form.outputVar,
    alias: form.alias,
    description: form.description,
    failStrategy: form.failStrategy,
    timeout: form.timeout,
    retry: { ...retry },
  };
}

function emitChange() {
  if (!props.node) return;
  const config = buildConfig();
  const data = props.node.getData() || {};
  if (form.name) props.node.attr('label/text', form.name);
  props.node.setData({ ...data, label: form.name || data.label, config: { ...data.config, ...config } });
  emit('updateConfig', config);
}

async function handleTest() {
  if (!form.url?.trim()) return;
  testing.value = true;
  testTime.value = new Date().toLocaleString('zh-CN', { hour12: false });
  const start = Date.now();
  try {
    const headers = keyValueRowsToMap(form.headersList);
    let url = form.url;
    const query = keyValueRowsToMap(form.queryList);
    const qs = Object.entries(query).filter(([k]) => k).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    if (qs) url += (url.includes('?') ? '&' : '?') + qs;
    const init: RequestInit = { method: normalizeMethod(form.method), mode: 'cors', headers: { ...headers } };
    const bodyType = form.bodyType;
    if (showBody.value && bodyType !== 'none') {
      if (bodyType === 'form') {
        const params = new URLSearchParams(keyValueRowsToMap(form.formBodyList));
        init.body = params.toString();
        if (!headers['Content-Type']) (init.headers as Record<string, string>)['Content-Type'] = 'application/x-www-form-urlencoded';
      } else if (bodyType === 'form-data') {
        const fd = new FormData();
        form.formBodyList.forEach(({ key, value }) => {
          if (key?.trim()) fd.append(key.trim(), value ?? '');
        });
        init.body = fd;
        // FormData 自动设置 Content-Type + boundary
      } else if (form.body) {
        init.body = form.body;
        if (form.contentType && form.contentType !== 'custom' && !headers['Content-Type']) {
          (init.headers as Record<string, string>)['Content-Type'] = form.contentType;
        }
      }
    }
    const res = await fetch(url, init);
    const text = await res.text();
    let bodyPreview = text;
    try { bodyPreview = JSON.stringify(JSON.parse(text), null, 2); } catch { /* raw */ }
    testResult.value = { status: res.status, durationMs: Date.now() - start, bodyPreview: bodyPreview.slice(0, 6000), ok: res.ok };
  } catch (e: any) {
    testResult.value = { status: 0, durationMs: Date.now() - start, bodyPreview: e?.message || '请求失败', ok: false };
  } finally {
    testing.value = false;
  }
}

defineExpose({ buildConfig, emitChange });
</script>

<style scoped>
.http-settings {
  padding: 8px 0 20px;
  font-size: 13px;
  color: #262626;
}
.http-section {
  padding: 16px 24px;
  border-bottom: 1px solid #ebebeb;
}
.http-section-muted {
  padding-top: 8px;
  padding-bottom: 8px;
}
.http-section-test {
  background: #fafbfc;
  border-bottom: none;
}
.section-label {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 12px;
}
.section-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.section-label-row .section-label {
  margin-bottom: 0;
}
.form-label {
  display: block;
  font-size: 13px;
  color: #595959;
  margin-bottom: 8px;
  line-height: 1.4;
}
.form-label.required::before {
  content: '*';
  color: #ff4d4f;
  margin-right: 4px;
}
.form-label.spacing-top {
  margin-top: 14px;
}
.form-tip {
  margin: 8px 0 0;
  font-size: 12px;
  color: #bfbfbf;
  line-height: 1.5;
}
.var-tag {
  color: #5b8ff9;
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: 12px;
}

/* 请求方式 */
.http-method-group {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  gap: 0;
}
.http-method-group :deep(.el-radio-button__inner) {
  min-width: 58px;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 600;
}
.url-input-full {
  width: 100%;
}
.url-input-full :deep(.el-input__wrapper) {
  min-height: 36px;
}

.full-width {
  width: 100%;
}
.body-type-group {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
}
.body-type-group :deep(.el-radio-button__inner) {
  padding: 8px 12px;
  font-size: 12px;
}
.spacing-top {
  margin-top: 14px;
}
.code-area :deep(.el-textarea__inner) {
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
}

.http-collapse {
  border: none;
}
.http-collapse :deep(.el-collapse-item__header) {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  border: none;
  height: 44px;
  line-height: 44px;
  background: transparent;
}
.http-collapse :deep(.el-collapse-item__wrap) {
  border: none;
}
.http-collapse :deep(.el-collapse-item__content) {
  padding-bottom: 8px;
}
.adv-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
}
.adv-grid .span-full {
  grid-column: 1 / -1;
}

.test-box {
  margin-top: 12px;
}
.test-meta {
  font-size: 12px;
  margin-bottom: 10px;
}
.test-meta.is-ok { color: #52c41a; }
.test-meta.is-err { color: #ff4d4f; }
.test-table-head {
  font-size: 13px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 8px;
}
</style>
