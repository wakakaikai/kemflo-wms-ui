<script setup lang="ts">
import { computed, ref } from 'vue';
import { Search, Tools } from '@element-plus/icons-vue';
import type { Process } from './types';

const props = defineProps({
  processes: {
    required: true,
    type: Array<Process>,
    default: () => []
  }
});

const emit = defineEmits(['dragStart']);

const keyword = ref('');

const filteredProcesses = computed(() => {
  const text = keyword.value.trim().toLowerCase();
  if (!text) {
    return props.processes;
  }
  return props.processes.filter((item) => {
    const operation = String(item.operation || '').toLowerCase();
    const description = String(item.description || '').toLowerCase();
    return operation.includes(text) || description.includes(text);
  });
});
</script>

<template>
  <aside class="routing-sidebar">
    <div class="routing-sidebar__search">
      <el-input v-model="keyword" clearable placeholder="搜索工序" :prefix-icon="Search" size="small" />
    </div>
    <div class="routing-sidebar__list">
      <el-empty v-if="!filteredProcesses.length" description="暂无可用工序" :image-size="56" />
      <div v-for="item in filteredProcesses" :key="item.id || item.handle" draggable="true" class="routing-process" @dragstart="(e) => emit('dragStart', e, item)">
        <el-icon class="routing-process-icon"><Tools /></el-icon>
        <div class="routing-process-text">
          <div class="routing-process-code">{{ item.operation }}</div>
          <div class="routing-process-desc">{{ item.description || '暂无描述' }}</div>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.routing-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #fff;
}

.routing-sidebar__search {
  flex: 0 0 auto;
  padding: 6px 4px 4px;
}

.routing-sidebar__list {
  flex: 1;
  min-height: 0;
  padding: 0 4px 6px;
  overflow-y: auto;
}

.routing-process {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 6px;
  padding: 6px 4px;
  cursor: move;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #fff;
  transition: background-color 0.2s ease;
}

.routing-process:hover {
  background: #f5f7fa;
}

.routing-process-icon {
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  margin-top: 2px;
  color: #409eff;
}

.routing-process-text {
  min-width: 0;
  flex: 1;
}

.routing-process-code {
  font-size: 13px;
  font-weight: 500;
  color: #35bd86;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.routing-process-desc {
  margin-top: 2px;
  font-size: 12px;
  color: #303133;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
</style>
