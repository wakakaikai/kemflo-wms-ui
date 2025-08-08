<template>
  <div class="work-order-detail">
    <el-tabs v-model="activeTab" class="work-order-tabs">
      <!-- 工单BOM Tab -->
      <el-tab-pane label="工单BOM" name="bom">
        <work-order-bom :work-order-no="workOrderNo" />
      </el-tab-pane>

      <!-- 工单工序 Tab -->
      <el-tab-pane label="工单工序" name="process">
        <work-order-process :work-order-no="workOrderNo" />
      </el-tab-pane>

      <!-- 工单条码 Tab -->
      <el-tab-pane label="工单条码" name="barcode">
        <work-order-sn-manage :work-order-no="workOrderNo" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import WorkOrderBom from '@/views/wms/workOrder/components/workOrderBom.vue';
import WorkOrderProcess from '@/views/wms/workOrder/components/workOrderProcess.vue';
import WorkOrderSnManage from '@/views/wms/workOrder/components/workOrderSn.vue';
const route = useRoute();

// 从路由参数中获取工单号
const workOrderNo = computed(() => {
  return route.query.workOrderNo as string || route.params.workOrderNo as string || '';
});

const activeTab = ref('bom');
</script>

<style scoped>
.work-order-tabs {
  margin: 15px 15px;
}
</style>
