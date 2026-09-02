<template>
  <div class="input-mapping">
    <div v-if="showHeader" class="mapping-head">
      <span>变量名</span>
      <span>变量值</span>
      <span />
    </div>
    <div v-for="(row, index) in rows" :key="index" class="mapping-row">
      <el-input
        v-model="row.name"
        placeholder="name"
        size="default"
        @change="emitChange"
      />
      <el-select
        v-model="row.source"
        filterable
        allow-create
        default-first-option
        clearable
        placeholder="选择变量"
        size="default"
        class="mapping-source"
        @change="emitChange"
      >
        <el-option-group v-for="group in upstreamGroups" :key="group.nodeId" :label="group.label">
          <el-option
            v-for="opt in group.options"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-option-group>
      </el-select>
      <button
        type="button"
        class="mapping-remove"
        :disabled="rows.length <= 1"
        title="删除"
        @click="removeRow(index)"
      >
        <el-icon :size="14"><Delete /></el-icon>
      </button>
    </div>
    <button type="button" class="mapping-add" @click="addRow">{{ addLabel }}</button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Delete } from '@element-plus/icons-vue';
import type { Node } from '@antv/x6';
import {
  collectUpstreamVariables,
  groupVariableOptions,
  inputRowsToMap,
  mapToInputRows,
  type InputMappingRow,
} from './useUpstreamVariables';

const props = withDefaults(defineProps<{
  node: Node | null;
  modelValue?: Record<string, string>;
  showHeader?: boolean;
  addLabel?: string;
}>(), {
  modelValue: () => ({}),
  showHeader: true,
  addLabel: '+ 添加变量',
});

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string>];
  change: [value: Record<string, string>];
}>();

const rows = ref<InputMappingRow[]>([{ name: '', source: '' }]);

const upstreamGroups = computed(() => groupVariableOptions(collectUpstreamVariables(props.node)));

watch(
  () => props.modelValue,
  (val) => {
    rows.value = mapToInputRows(val);
  },
  { immediate: true, deep: true },
);

watch(
  () => props.node?.id,
  () => {
    // 上游节点变化时刷新选项，保留已填内容
    rows.value = [...rows.value];
  },
);

function emitChange() {
  const mapping = inputRowsToMap(rows.value);
  emit('update:modelValue', mapping);
  emit('change', mapping);
}

function addRow() {
  rows.value.push({ name: '', source: '' });
  emitChange();
}

function removeRow(index: number) {
  if (rows.value.length <= 1) return;
  rows.value.splice(index, 1);
  emitChange();
}
</script>

<style scoped>
.input-mapping {
  width: 100%;
}
.mapping-head {
  display: grid;
  grid-template-columns: 1fr 1fr 32px;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #bfbfbf;
}
.mapping-row {
  display: grid;
  grid-template-columns: 1fr 1fr 32px;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}
.mapping-source {
  min-width: 0;
}
.mapping-remove {
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
  padding: 0;
}
.mapping-remove:hover:not(:disabled) {
  color: #ff4d4f;
  background: #fff1f0;
}
.mapping-remove:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}
.mapping-add {
  display: inline-block;
  border: none;
  background: none;
  padding: 4px 0 0;
  font-size: 13px;
  color: #1677ff;
  cursor: pointer;
}
.mapping-add:hover {
  color: #0958d9;
}
</style>
