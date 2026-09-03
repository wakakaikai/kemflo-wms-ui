<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search, Tools } from '@element-plus/icons-vue'
import type { Process } from './types'

const props = defineProps({
  processes: {
    required: true,
    type: Array<Process>,
    default: () => [],
  },
})

const emit = defineEmits(['dragStart'])

const keyword = ref('')

const filteredProcesses = computed(() => {
  const text = keyword.value.trim().toLowerCase()
  if (!text) {
    return props.processes
  }
  return props.processes.filter((item) => {
    const operation = String(item.operation || '').toLowerCase()
    const description = String(item.description || '').toLowerCase()
    return operation.includes(text) || description.includes(text)
  })
})
</script>

<template>
  <aside class="routing-sidebar">
    <div class="routing-sidebar__header">
      <span class="routing-sidebar__title">工序库</span>
      <span class="routing-sidebar__count">{{ filteredProcesses.length }}</span>
    </div>
    <div class="routing-sidebar__search">
      <el-input v-model="keyword" clearable placeholder="搜索工序" :prefix-icon="Search" size="small" />
    </div>
    <div class="routing-sidebar__list">
      <el-empty v-if="!filteredProcesses.length" description="暂无可用工序" :image-size="56" />
      <div
        v-for="item in filteredProcesses"
        :key="item.id || item.handle"
        draggable="true"
        class="routing-process"
        @dragstart="(e) => emit('dragStart', e, item)"
      >
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
  width: 240px;
  flex: 0 0 240px;
  height: 100%;
  overflow: hidden;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #fff;
}

.routing-sidebar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 8px;
}

.routing-sidebar__title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.routing-sidebar__count {
  min-width: 24px;
  padding: 0 8px;
  border-radius: 999px;
  background: #ecf5ff;
  color: #409eff;
  font-size: 12px;
  line-height: 22px;
  text-align: center;
}

.routing-sidebar__search {
  padding: 0 12px 10px;
}

.routing-sidebar__list {
  flex: 1;
  min-height: 0;
  padding: 0 8px 8px;
  overflow-y: auto;
}

.routing-process {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 8px;
  padding: 10px;
  cursor: move;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafafa;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.routing-process:hover {
  border-color: #b3d8ff;
  background: #f5faff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.12);
  transform: translateY(-1px);
}

.routing-process-icon {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  margin-top: 2px;
  color: #409eff;
}

.routing-process-text {
  min-width: 0;
  flex: 1;
}

.routing-process-code {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.routing-process-desc {
  margin-top: 2px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
</style>
