<template>
  <div class="property-panel-inner">
    <div v-if="!node" class="empty-hint">
      <el-icon style="font-size: 40px; color: #d6e4ff"><Collection /></el-icon>
      <p>选中画布中的节点<br />在此编辑属性配置</p>
    </div>
    <template v-else>
      <div class="node-info-bar">
        <el-tag size="small" :color="nodeConfig?.color || '#1677ff'" effect="dark" disable-transitions>{{ nodeConfig?.label || nodeType }}</el-tag>
        <span style="font-size:12px;color:#86909c">ID: {{ nodeId }}</span>
      </div>
      <el-form :model="formData" label-position="top" size="small" class="property-form">
        <el-form-item label="节点名称">
          <el-input v-model="formData.name" placeholder="请输入名称" @change="handleChange" />
        </el-form-item>
        <h4 class="section-title">节点配置</h4>
        <template v-if="configFields.length > 0">
          <el-form-item
            v-for="field in configFields"
            :key="field.key"
            :label="field.label"
            :required="field.required"
          >
            <el-input
              v-if="field.type === 'input'"
              v-model="formData[field.key]"
              :placeholder="field.placeholder"
              @change="handleChange"
            />
            <el-input-number
              v-else-if="field.type === 'number'"
              v-model="formData[field.key]"
              :min="0"
              controls-position="right"
              style="width: 100%"
              @change="handleChange"
            />
            <el-select
              v-else-if="field.type === 'select'"
              v-model="formData[field.key]"
              placeholder="请选择"
              style="width: 100%"
              @change="handleChange"
            >
              <el-option
                v-for="opt in field.options"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <el-input
              v-else-if="field.type === 'textarea'"
              v-model="formData[field.key]"
              type="textarea"
              :rows="3"
              @change="handleChange"
            />
            <el-input
              v-else-if="field.type === 'json'"
              v-model="formData[field.key]"
              type="textarea"
              :rows="4"
              placeholder="JSON格式"
              @change="handleChange"
            />
            <el-switch
              v-else-if="field.type === 'switch'"
              v-model="formData[field.key]"
              @change="handleChange"
            />
          </el-form-item>
        </template>
        <div v-else class="no-config">无需额外配置</div>

        <h4 class="section-title">失败策略</h4>
        <el-form-item label="策略">
          <el-select v-model="formData.failStrategy" style="width: 100%" @change="handleChange">
            <el-option label="停止" value="STOP" />
            <el-option label="跳过继续" value="CONTINUE" />
            <el-option label="重试" value="RETRY" />
          </el-select>
        </el-form-item>

        <template v-if="formData.failStrategy === 'RETRY'">
          <el-form-item label="最大重试次数">
            <el-input-number v-model="retry.maxRetryCount" :min="0" :max="10" @change="handleChange" />
          </el-form-item>
          <el-form-item label="重试间隔(秒)">
            <el-input-number v-model="retry.retryInterval" :min="1" :max="300" @change="handleChange" />
          </el-form-item>
        </template>

        <h4 class="section-title">超时设置</h4>
        <el-form-item label="超时时间(秒)">
          <el-input-number v-model="formData.timeout" :min="0" :max="86400" @change="handleChange" />
        </el-form-item>
      </el-form>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import { Node } from '@antv/x6';
import { Collection } from '@element-plus/icons-vue';
import { getNodeConfig } from '../types';
import { getConfigFormFields, FormField } from '../config/nodeConfig';

const props = defineProps<{
  node: Node | null;
}>();

const emit = defineEmits<{
  updateConfig: [config: Record<string, any>];
}>();

const formData = reactive<Record<string, any>>({});
const retry = reactive({ maxRetryCount: 3, retryInterval: 10 });
const configFields = ref<FormField[]>([]);
const nodeType = ref('');
const nodeId = ref('');

const nodeConfig = computed(() => getNodeConfig(nodeType.value));

function clearFormData() {
  Object.keys(formData).forEach((key) => {
    delete formData[key];
  });
}

function toFormValue(field: FormField, value: any) {
  if (field.type === 'json') {
    if (value === undefined || value === null || value === '') return '';
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return value;
}

function fromFormValue(field: FormField, value: any) {
  if (field.type !== 'json') return value;
  if (value === undefined || value === null || value === '') return value;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

watch(() => props.node, (newNode) => {
  if (!newNode) {
    clearFormData();
    configFields.value = [];
    nodeType.value = '';
    nodeId.value = '';
    return;
  }
  const data = newNode.getData() || {};
  nodeType.value = data.nodeType || '';
  nodeId.value = newNode.id;
  configFields.value = getConfigFormFields(nodeType.value);

  clearFormData();
  const config = data.config || {};
  const next: Record<string, any> = {
    name: data.label || newNode.attr('label/text') || '',
    failStrategy: config.failStrategy || 'STOP',
    timeout: config.timeout ?? 0,
  };
  configFields.value.forEach((field) => {
    const raw = config[field.key] !== undefined ? config[field.key] : field.defaultValue;
    next[field.key] = toFormValue(field, raw);
  });
  Object.assign(formData, next);
  Object.assign(retry, config.retry || { maxRetryCount: 3, retryInterval: 10 });
}, { immediate: true });

function handleChange() {
  if (!props.node) return;
  const config: Record<string, any> = {};
  configFields.value.forEach((f) => {
    config[f.key] = fromFormValue(f, formData[f.key]);
  });
  config.failStrategy = formData.failStrategy;
  config.timeout = formData.timeout;
  config.retry = { ...retry };

  if (formData.name) {
    props.node.attr('label/text', formData.name);
    const data = props.node.getData() || {};
    props.node.setData({ ...data, label: formData.name });
  }

  emit('updateConfig', config);
}
</script>

<style scoped>
.property-panel-inner { padding: 0; }
.empty-hint {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 80px 24px; color: #c2c8d5;
  text-align: center;
}
.empty-hint .el-icon { font-size: 36px; color: #d6e4ff; }
.empty-hint p { margin-top: 12px; font-size: 13px; color: #8c8c8c; line-height: 1.5; }
.property-form { width: 100%; padding: 0 16px 16px; }
.section-title {
  font-size: 12px; font-weight: 600; color: #4e5969;
  padding: 12px 0 8px; margin: 0;
  border-top: 1px solid #f0f0f0;
}
.property-form :deep(.el-form-item) { margin-bottom: 12px; }
.property-form :deep(.el-form-item__label) { font-size: 12px; color: #4e5969; padding-bottom: 4px; }
.property-form :deep(.el-input__wrapper) { box-shadow: 0 0 0 1px #e5e6e8 inset; }
.property-form :deep(.el-input__wrapper:hover) { box-shadow: 0 0 0 1px #c9cdd4 inset; }
.property-form :deep(.el-input__wrapper.is-focus) { box-shadow: 0 0 0 1px #1677ff inset; }
.node-info-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 16px; border-bottom: 1px solid #f0f0f0; margin-bottom: 8px;
}
.no-config { font-size: 12px; color: #86909c; text-align: center; padding: 16px 0; }
</style>
