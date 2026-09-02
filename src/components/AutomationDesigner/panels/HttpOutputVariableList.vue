<template>
  <div class="http-output-list">
    <div v-for="(item, index) in variables" :key="item.name + index" class="output-item">
      <span class="output-badge" :class="badgeClass(item.type)">{{ typeBadge(item.type) }}</span>
      <div class="output-main">
        <div class="output-name">{{ item.displayName || item.name }}</div>
        <div class="output-desc">{{ item.description || defaultDesc(item) }}</div>
      </div>
      <button
        v-if="!item.builtin"
        type="button"
        class="output-remove"
        title="删除"
        @click="remove(index)"
      >
        <el-icon :size="14"><Delete /></el-icon>
      </button>
    </div>
    <button type="button" class="section-add" @click="emit('add')">+ 添加变量</button>
  </div>
</template>

<script setup lang="ts">
import { Delete } from '@element-plus/icons-vue';
import { type HttpOutputVariable, typeBadge } from './httpOutputUtils';

defineProps<{
  variables: HttpOutputVariable[];
}>();

const emit = defineEmits<{
  add: [];
  remove: [index: number];
}>();

function badgeClass(type: HttpOutputVariable['type']) {
  if (type === 'number' || type === 'number[]') return 'is-number';
  if (type === 'object' || type === 'object[]') return 'is-object';
  return 'is-text';
}

function defaultDesc(item: HttpOutputVariable) {
  if (item.name === 'statusCode') return 'HTTP请求返回的状态码';
  if (item.name === 'body') return 'HTTP请求的返回结果';
  return item.sourcePath || '';
}

function remove(index: number) {
  emit('remove', index);
}
</script>

<style scoped>
.http-output-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.output-item {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 32px;
  gap: 10px;
  align-items: center;
  padding: 8px 10px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
}
.output-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #eef4ff;
  color: #1677ff;
  font-size: 12px;
  font-weight: 700;
  font-family: Consolas, Menlo, Monaco, monospace;
}
.output-badge.is-number {
  background: #fff7e6;
  color: #fa8c16;
}
.output-badge.is-object {
  background: #f6ffed;
  color: #52c41a;
}
.output-main {
  min-width: 0;
}
.output-name {
  color: #262626;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
}
.output-desc {
  margin-top: 2px;
  color: #8c8c8c;
  font-size: 12px;
  line-height: 1.4;
}
.output-remove {
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
.output-remove:hover {
  color: #ff4d4f;
  background: #fff1f0;
}
.section-add {
  display: inline-block;
  border: none;
  background: none;
  padding: 4px 0 0;
  font-size: 13px;
  color: #1677ff;
  cursor: pointer;
  text-align: left;
}
.section-add:hover {
  color: #0958d9;
}
</style>
