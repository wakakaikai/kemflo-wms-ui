<template>
  <div class="node-settings-panel jdbc-settings">
    <section class="settings-section">
      <div class="section-title">输入变量</div>
      <InputMappingEditor v-model="inputMapping" :node="node" @change="emitChange" />
    </section>

    <section class="settings-section">
      <div class="section-title">数据源</div>
      <div class="datasource-row">
        <el-input v-model="form.dataSourceName" placeholder="master / 业务数据源" @change="emitChange" />
        <el-button @click="emitChange">选择</el-button>
      </div>
    </section>

    <section class="settings-section">
      <div class="section-title">SQL</div>
      <el-input
        v-model="form.sql"
        class="settings-textarea"
        type="textarea"
        :rows="8"
        placeholder="支持 {{变量名}} 动态替换，例如 SELECT * FROM orders WHERE id = {{orderId}}"
        @change="emitChange"
      />
    </section>

    <section class="settings-section">
      <div class="section-title">输出变量</div>
      <div class="output-row">
        <el-select v-model="form.outputType" class="output-type-select" @change="emitChange">
          <el-option label="object[]" value="object[]" />
          <el-option label="number" value="number" />
          <el-option label="string" value="string" />
        </el-select>
        <el-input v-model="form.outputVar" placeholder="sqlResult" @change="emitChange" />
      </div>
      <p class="section-desc">SELECT 返回 JSON 集合；INSERT/UPDATE/DELETE 返回受影响行数。</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import type { Node } from '@antv/x6';
import InputMappingEditor from './InputMappingEditor.vue';
import { getDefaultConfig } from '../config/nodeConfig';
import './settingsShared.css';

const props = defineProps<{ node: Node }>();
const emit = defineEmits<{ updateConfig: [config: Record<string, any>] }>();

const inputMapping = ref<Record<string, string>>({});
const form = reactive({
  dataSourceName: '',
  connectionId: '',
  sql: '',
  outputType: 'object[]',
  outputVar: 'sqlResult',
});

watch(
  () => props.node,
  (node) => {
    if (!node) return;
    const data = node.getData() || {};
    const cfg = { ...getDefaultConfig('JDBC_CALL'), ...(data.config || {}) };
    inputMapping.value = { ...(cfg.inputMapping || {}) };
    form.dataSourceName = cfg.dataSourceName || cfg.connectionId || '';
    form.connectionId = cfg.connectionId || '';
    form.sql = cfg.sql || '';
    form.outputType = cfg.outputType || 'object[]';
    form.outputVar = cfg.outputVar || 'sqlResult';
  },
  { immediate: true },
);

function buildConfig() {
  return {
    inputMapping: { ...inputMapping.value },
    dataSourceName: form.dataSourceName,
    connectionId: form.connectionId || form.dataSourceName,
    sql: form.sql,
    outputType: form.outputType,
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
.datasource-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
}
.output-row {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 8px;
}
</style>
