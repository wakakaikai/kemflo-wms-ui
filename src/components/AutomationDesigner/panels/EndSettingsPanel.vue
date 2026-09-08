<template>
  <div class="node-settings-panel end-settings">
    <section class="settings-section">
      <div class="section-title">输出格式</div>
      <el-select v-model="form.outputType" class="full-width" @change="emitChange">
        <el-option label="JSON" value="default" />
        <el-option label="文本" value="text" />
      </el-select>
    </section>

    <section v-if="form.outputType === 'text'" class="settings-section">
      <div class="section-title">文本内容</div>
      <VariableAwareInput
        v-model="form.outputContent"
        type="textarea"
        :rows="6"
        placeholder="请输入结束节点输出文本。按下 “/” 可以选择变量"
        :options="upstreamOptions"
        @change="emitChange"
      />
    </section>

    <section v-else class="settings-section">
      <div class="section-title">输出变量</div>
      <p class="section-desc">将上游节点的输出作为流程结束结果返回。</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import type { Node } from '@antv/x6';
import VariableAwareInput from './VariableAwareInput.vue';
import { collectUpstreamVariables } from './useUpstreamVariables';
import { toDisplayTemplate, toPersistTemplate } from './templateUtils';
import { getDefaultConfig } from '../config/nodeConfig';
import './settingsShared.css';

const props = defineProps<{ node: Node }>();
const emit = defineEmits<{ updateConfig: [config: Record<string, any>] }>();

const form = reactive({
  outputType: 'text',
  outputContent: '',
});

const upstreamOptions = computed(() => collectUpstreamVariables(props.node));

watch(
  () => props.node,
  (node) => {
    if (!node) return;
    const cfg = { ...getDefaultConfig('END'), ...(node.getData()?.config || {}) };
    form.outputType = cfg.outputType || (cfg.text || cfg.outputContent ? 'text' : 'default');
    form.outputContent = toDisplayTemplate(cfg.outputContent || cfg.text || cfg.responseTemplate || '');
  },
  { immediate: true },
);

function buildConfig() {
  const outputContent = toPersistTemplate(form.outputContent);
  return {
    outputType: form.outputType,
    outputContent,
    text: outputContent,
    responseTemplate: outputContent,
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
