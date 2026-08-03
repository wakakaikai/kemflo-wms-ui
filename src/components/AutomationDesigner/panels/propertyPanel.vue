<template>
  <div class="property-panel-inner">
    <div v-if="!node" class="empty-hint">
      <el-icon style="font-size: 40px; color: #ccc"><Collection /></el-icon>
      <p>点击节点编辑属性</p>
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
          <el-select v-model="formData.failStrategy" @change="handleChange">
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

watch(() => props.node, (newNode) => {
  if (!newNode) return;
  const data = newNode.getData() || {};
  nodeType.value = data.nodeType || '';
  nodeId.value = newNode.id;
  configFields.value = getConfigFormFields(nodeType.value);

  Object.assign(formData, {
    name: newNode.attr('label/text') || '',
    nodeId: newNode.id,
    ...(data.config || {}),
    failStrategy: data.config?.failStrategy || 'STOP',
    timeout: data.config?.timeout || 0,
  });
  Object.assign(retry, data.config?.retry || { maxRetryCount: 3, retryInterval: 10 });
}, { immediate: false });

function handleChange() {
  if (!props.node) return;
  // merge all config
  const config: Record<string, any> = {};
  configFields.value.forEach(f => {
    config[f.key] = formData[f.key];
  });
  config.failStrategy = formData.failStrategy;
  config.timeout = formData.timeout;
  config.retry = { ...retry };

  // Also update node label
  if (formData.name) {
    props.node.attr('label/text', formData.name);
  }

  emit('updateConfig', config);
}
</script>

<style scoped>
.property-panel-inner { padding: 0; }
.empty-hint {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 60px 0; color: #c9cdd4;
}
.empty-hint .el-icon { font-size: 40px; }
.empty-hint p { margin-top: 8px; font-size: 13px; color: #86909c; }
.panel-header {
  display: none;
}
.property-form { width: 100%; padding: 0 16px 16px; }
.section-title {
  font-size: 12px; font-weight: 600; color: #4e5969;
  padding: 12px 0 8px; margin: 0;
  border-top: 1px solid #f0f0f0;
}
.section-title:first-child { border-top: none; }
.property-form :deep(.el-form-item) { margin-bottom: 12px; }
.property-form :deep(.el-form-item__label) { font-size: 12px; color: #4e5969; padding-bottom: 4px; }
.property-form :deep(.el-input__wrapper) { box-shadow: 0 0 0 1px #e5e6e8 inset; }
.property-form :deep(.el-input__wrapper:hover) { box-shadow: 0 0 0 1px #c9cdd4 inset; }
.property-form :deep(.el-input__wrapper.is-focus) { box-shadow: 0 0 0 1px #1677ff inset; }
.node-info-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 16px; border-bottom: 1px solid #f0f0f0; margin-bottom: 8px;
}
.node-info-bar .node-type-tag { font-size: 11px; }
.no-config { font-size: 12px; color: #86909c; text-align: center; padding: 16px 0; }
</style>
