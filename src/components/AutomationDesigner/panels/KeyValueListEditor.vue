<template>
  <div class="kv-list">
    <div v-if="showHeader" class="kv-head">
      <span class="kv-head-key">{{ keyColumnLabel }}</span>
      <span class="kv-head-value">{{ valueColumnLabel }}</span>
      <span class="kv-head-action" />
    </div>
    <div v-for="(row, index) in rows" :key="index" class="kv-row">
      <el-input
        v-model="row.key"
        :placeholder="keyPlaceholder"
        size="default"
        class="kv-key"
        @change="emitChange"
      />
      <el-input
        v-model="row.value"
        :placeholder="valuePlaceholder"
        size="default"
        class="kv-value"
        @change="emitChange"
      />
      <button
        type="button"
        class="kv-remove"
        :disabled="rows.length <= 1"
        title="删除"
        @click="removeRow(index)"
      >
        <el-icon :size="14"><Delete /></el-icon>
      </button>
    </div>
    <button type="button" class="kv-add" @click="addRow">{{ addLabel }}</button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Delete } from '@element-plus/icons-vue';
import type { KeyValueRow } from './keyValueUtils';

const props = withDefaults(defineProps<{
  modelValue?: KeyValueRow[];
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  addLabel?: string;
  showHeader?: boolean;
  keyColumnLabel?: string;
  valueColumnLabel?: string;
}>(), {
  modelValue: () => [{ key: '', value: '' }],
  keyPlaceholder: 'key',
  valuePlaceholder: '值',
  addLabel: '+ header',
  showHeader: false,
  keyColumnLabel: '名称',
  valueColumnLabel: '值',
});

const emit = defineEmits<{
  'update:modelValue': [rows: KeyValueRow[]];
  change: [rows: KeyValueRow[]];
}>();

const rows = ref<KeyValueRow[]>([{ key: '', value: '' }]);

watch(
  () => props.modelValue,
  (val) => {
    const next = val?.length ? val.map(r => ({ key: r.key ?? '', value: r.value ?? '' })) : [{ key: '', value: '' }];
    rows.value = next;
  },
  { immediate: true, deep: true }
);

function emitChange() {
  emit('update:modelValue', rows.value);
  emit('change', rows.value);
}

function addRow() {
  rows.value.push({ key: '', value: '' });
  emitChange();
}

function removeRow(index: number) {
  if (rows.value.length <= 1) return;
  rows.value.splice(index, 1);
  emitChange();
}
</script>

<style scoped>
.kv-list {
  width: 100%;
}
.kv-head {
  display: grid;
  grid-template-columns: 1fr 1fr 32px;
  gap: 8px;
  margin-bottom: 8px;
  padding: 0 1px;
  font-size: 12px;
  color: #bfbfbf;
  line-height: 1;
}
.kv-row {
  display: grid;
  grid-template-columns: 1fr 1fr 32px;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}
.kv-key,
.kv-value {
  min-width: 0;
}
.kv-remove {
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
.kv-remove:hover:not(:disabled) {
  color: #ff4d4f;
  background: #fff1f0;
}
.kv-remove:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}
.kv-add {
  display: inline-block;
  border: none;
  background: none;
  padding: 4px 0 0;
  font-size: 13px;
  color: #5b8ff9;
  cursor: pointer;
  line-height: 1.5;
}
.kv-add:hover {
  color: #3d7ef5;
}
</style>
