<template>
  <div class="p-2">
    <!-- Tab标签页 -->
    <el-tabs v-model="tabActiveName" @tab-change="changeTab">
      <el-tab-pane name="processInfo">
        <template #label>
          <span>工单工序信息</span>
        </template>
      </el-tab-pane>

      <el-tab-pane name="workOrderSummary">
        <template #label>
          <span>工单汇总信息</span>
        </template>
      </el-tab-pane>

      <el-tab-pane name="customerOrderQuery">
        <template #label>
          <span>依客户订单查询</span>
        </template>
      </el-tab-pane>

      <el-tab-pane name="workOrderReport">
        <template #label>
          <span>工单报工信息</span>
        </template>
      </el-tab-pane>
    </el-tabs>

    <!-- 工单工序信息 -->
    <ProcessInfoTab v-if="tabActiveName === 'processInfo'" :query-params="queryParams" @update-count="processInfoCount = $event" />

    <!-- 工单汇总信息 -->
    <WorkOrderSummaryTab v-if="tabActiveName === 'workOrderSummary'" :query-params="queryParams" @update-count="workOrderSummaryCount = $event" />

    <!-- 依客户订单查询 -->
    <CustomerOrderTab v-if="tabActiveName === 'customerOrderQuery'" :query-params="queryParams" @update-count="customerOrderCount = $event" />

    <!-- 工单报工信息 -->
    <WorkOrderReportTab v-if="tabActiveName === 'workOrderReport'" :query-params="queryParams" @update-count="workOrderReportCount = $event" />
  </div>
</template>

<script setup name="WorkOrderReport" lang="ts">
import { ref, reactive, toRefs } from 'vue';
import ProcessInfoTab from './components/WorkOrderProcessInfoTab.vue';
import WorkOrderSummaryTab from './components/WorkOrderSummaryTab.vue';
import CustomerOrderTab from './components/CustomerOrderTab.vue';
import WorkOrderReportTab from './components/WorkOrderReportTab.vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const tabActiveName = ref('processInfo');
const showSearch = ref(true);
const queryFormRef = ref<ElFormInstance>();

// 各tab数据统计
const processInfoCount = ref(0);
const workOrderSummaryCount = ref(0);
const customerOrderCount = ref(0);
const workOrderReportCount = ref(0);

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  customerOrder: undefined,
  workOrderNo: undefined,
  material: undefined,
  processName: undefined,
  reportDateRange: [],
  params: {}
});

/** Tab切换 */
const changeTab = (activeName: string) => {
  handleQuery();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'report/workOrder/export',
    {
      ...queryParams.value,
      tabType: tabActiveName.value
    },
    `workOrder_${tabActiveName.value}_${new Date().getTime()}.xlsx`
  );
};
</script>

<style scoped>
:deep(.el-badge__content) {
  border: none;
}
</style>
