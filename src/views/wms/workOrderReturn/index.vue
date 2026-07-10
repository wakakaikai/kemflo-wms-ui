<template>
  <div class="p-2">
    <el-tabs v-model="activeTab" :tab-position="'top'" @tab-click="handleTabClick">
      <el-tab-pane name="work-order-return" label="工单退料">
        <WorkOrderReturn />
      </el-tab-pane>
      <el-tab-pane name="work-order-reverse" label="工单冲销">
        <WorkOrderReverse />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup name="WorkOrderReturnIndex" lang="ts">
import { ref } from 'vue';
import WorkOrderReturn from '@/views/wms/workOrderReturn/components/workOrderReturn.vue';
import WorkOrderReverse from '@/views/wms/workOrderReturn/components/workOrderReverse.vue';

const activeTab = ref('work-order-return');

const handleTabClick = (tab: any) => {
  activeTab.value = tab.paneName;
};
</script>

<style scoped>
.p-2 {
  padding: 0.5rem;
}
</style>
