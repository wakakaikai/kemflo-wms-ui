<template>
  <div class="allocation-workbench p-2">
    <el-card shadow="never">
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
