<template>
  <div class="allocation-workbench p-2">
    <el-card shadow="never" class="workbench-card">
      <template #header>
        <div class="workbench-header">
          <div>
            <h2 class="title">工单发料工作台</h2>
            <p class="subtitle">{{ WORKBENCH_SUBTITLE }}</p>
          </div>
        </div>
      </template>
      <workbench-panel />
    </el-card>
  </div>
</template>
<script setup lang="ts">
import WorkbenchPanel from './components/WorkbenchPanel.vue';
import { WORKBENCH_SUBTITLE } from '@/api/wms/allocation/types';
</script>
<style scoped>
.workbench-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.allocation-workbench {
  height: calc(100vh - 84px);
  min-height: 0;
  box-sizing: border-box;
  overflow: hidden;
}
.workbench-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
:deep(.workbench-card > .el-card__body) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
