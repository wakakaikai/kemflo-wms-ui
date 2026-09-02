<template>
  <div class="node-settings-panel loop-settings">
    <section class="settings-section">
      <div class="section-title">输入变量</div>
      <InputMappingEditor v-model="inputMapping" :node="node" @change="emitChange" />
    </section>

    <section class="settings-section">
      <div class="section-title">循环类型</div>
      <el-radio-group v-model="form.loopType" class="loop-type-group" @change="emitChange">
        <el-radio value="infinite">无限循环</el-radio>
        <el-radio value="counted">次数循环</el-radio>
        <el-radio value="array">迭代循环</el-radio>
      </el-radio-group>
      <div v-if="form.loopType === 'counted'" class="loop-extra">
        <label class="field-label">循环次数（1-1000）</label>
        <el-input-number v-model="form.maxLoopTimes" :min="1" :max="1000" controls-position="right" class="full-width" @change="emitChange" />
      </div>
      <div v-if="form.loopType === 'array'" class="loop-extra">
        <label class="field-label">迭代数组变量</label>
        <el-select v-model="form.collectionExpression" filterable allow-create clearable placeholder="选择 object[] 变量" class="full-width" @change="emitChange">
          <el-option v-for="opt in arrayOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </div>
      <p v-if="form.loopType === 'infinite'" class="section-desc">无限循环需在循环体内放置「终止循环」节点，且受 1000 次上限保护。</p>
    </section>

    <section class="settings-section">
      <div class="section-title">循环变量</div>
      <p class="section-desc">系统变量 currentLoopTimes、currentLoopItem（迭代时）可在循环体内引用。</p>
      <KeyValueListEditor
        v-model="loopParamsList"
        key-placeholder="变量名"
        value-placeholder="变量值或 {{引用}}"
        add-label="+ 添加循环变量"
        show-header
        key-column-label="变量名"
        value-column-label="变量值"
        @change="emitChange"
      />
    </section>

    <section class="settings-section">
      <div class="section-title">输出变量</div>
      <el-input v-model="form.outputVar" placeholder="loopResult" @change="emitChange" />
      <p class="section-desc">循环结束后需要保留的变量请在此配置，否则会被清理。</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { Node } from '@antv/x6';
import InputMappingEditor from './InputMappingEditor.vue';
import KeyValueListEditor from './KeyValueListEditor.vue';
import { mapToKeyValueRows, keyValueRowsToMap, type KeyValueRow } from './keyValueUtils';
import { collectUpstreamVariables } from './useUpstreamVariables';
import { getDefaultConfig } from '../config/nodeConfig';
import './settingsShared.css';

const props = defineProps<{ node: Node }>();
const emit = defineEmits<{ updateConfig: [config: Record<string, any>] }>();

const inputMapping = ref<Record<string, string>>({});
const loopParamsList = ref<KeyValueRow[]>([{ key: '', value: '' }]);
const form = reactive({
  loopType: 'counted',
  maxLoopTimes: 3,
  collectionExpression: '',
  variableName: 'item',
  outputVar: 'loopResult',
});

const arrayOptions = computed(() =>
  collectUpstreamVariables(props.node).map((opt) => ({
    label: opt.label,
    value: opt.value,
  })),
);

watch(
  () => props.node,
  (node) => {
    if (!node) return;
    const data = node.getData() || {};
    const cfg = { ...getDefaultConfig('LOOP'), ...(data.config || {}) };
    inputMapping.value = { ...(cfg.inputMapping || {}) };
    form.loopType = cfg.loopType || cfg.type || 'counted';
    form.maxLoopTimes = cfg.maxLoopTimes || cfg.maxIterations || 3;
    form.collectionExpression = cfg.collectionExpression || '';
    form.variableName = cfg.variableName || 'item';
    form.outputVar = cfg.outputVar || 'loopResult';
    loopParamsList.value = mapToKeyValueRows(cfg.loopParams);
  },
  { immediate: true },
);

function buildConfig() {
  return {
    inputMapping: { ...inputMapping.value },
    loopType: form.loopType,
    maxLoopTimes: form.maxLoopTimes,
    maxIterations: form.maxLoopTimes,
    collectionExpression: form.collectionExpression,
    variableName: form.variableName,
    loopParams: keyValueRowsToMap(loopParamsList.value),
    outputVar: form.outputVar,
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
.loop-type-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}
.loop-extra {
  margin-top: 12px;
}
</style>
