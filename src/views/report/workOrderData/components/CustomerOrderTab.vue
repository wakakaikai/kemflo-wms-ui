<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form :model="queryParams" ref="queryFormRef" :inline="true" v-show="showSearch" label-width="auto">
            <el-form-item label="工单号" prop="workOrderNo">
              <el-input v-model="queryParams.workOrderNo" placeholder="请输入工单编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="产品编号" prop="item">
              <el-input v-model="queryParams.item" placeholder="请输入产品编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="产品名称" prop="item">
              <el-input v-model="queryParams.item" placeholder="请输入产品名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="销售订单" prop="salesOrderNo">
              <el-input v-model="queryParams.salesOrderNo" placeholder="请输入销售订单" clearable @keyup.enter="handleQuery" />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Refresh" v-hasPermi="['mes:pro:protask:list']" circle @click="getList" />
              <!--        <el-button type="primary" icon="Edit" v-hasPermi="['mes:pro:protask:edit']" circle @click="handleOpenGantt" />-->
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <div class="gantt-wrapper">
      <div class="gantt-content">
        <GanttChar class="gantt-chart" ref="ganttCharRef" :tasks="tasks" />
      </div>
    </div>

    <!--    <el-card shadow="never">
      <el-table v-loading="loading" :data="workOrderList" row-key="workorderId" default-expand-all :tree-props="{ children: 'children', hasChildren: 'hasChildren' }">
        <el-table-column label="工单编码" width="180" prop="workorderCode"> </el-table-column>
        <el-table-column label="工单名称" width="200" align="center" prop="workorderName" show-overflow-tooltip />
        <el-table-column label="订单编号" width="140" align="center" prop="sourceCode" />
        <el-table-column label="产品编号" width="120" align="center" prop="productCode" />
        <el-table-column label="产品名称" width="200" align="center" prop="productName" show-overflow-tooltip />
        <el-table-column label="单位" align="center" prop="unitOfMeasure" />
        <el-table-column label="工单数量" align="center" prop="quantity" />
        <el-table-column label="已生产数量" align="center" width="100px" prop="quantityProduced" />
        <el-table-column label="客户编码" align="center" prop="salesOrderNo" />
        <el-table-column label="客户名称" align="center" prop="clientName" show-overflow-tooltip />
        <el-table-column label="需求日期" align="center" prop="requestDate" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.requestDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>-->
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';

import { listGanttTaskList, listProductprocess } from '@/api/report/workOrder/index';
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

import GanttChar from './ganttx.vue';

interface ProcessOption {
  processId: number;
  processName: string;
  routeId: number;
  colorCode: string;
}

interface GanttTasks {
  data: any[];
  links: any[];
}

// 模板引用
const queryFormRef = ref<ElFormInstance>();
const ganttCharRef = ref();

// 状态
const loading = ref(false);
const showSearch = ref(true);
const total = ref(0);
const workOrderList = ref<any[]>([]);
const processOptions = ref<ProcessOption[]>([]);

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    workOrderNo: undefined,
    item: undefined,
    salesOrderNo: '1000031550'
  }
});
const { queryParams } = data;

// 甘特图数据
const tasks = ref({
  data: [],
  links: []
});

// 生命周期
onMounted(() => {
  getList();
  getGanttTasks();
});

/** 查询列表 */
const getList = () => {};

/** 获取甘特图任务 —— 优化后 */
const getGanttTasks = async () => {
  loading.value = true;
  try {
    const res = await listGanttTaskList(queryParams);
    tasks.value.data = res.data.data;
    tasks.value.links = res.data.links;

    // 关键：只更新数据，不暴力 reload
    if (ganttCharRef.value) {
      ganttCharRef.value.updateData(tasks.value);
    }
  } finally {
    loading.value = false;
  }
};

/** 搜索 */
const handleQuery = () => {
  // queryParams.value.pageNum = 1;
  getGanttTasks(); // 只刷新甘特，不重复触发
};

/** 重置 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};
</script>

<style scoped>
/* 根容器：使用flex布局占满全屏 */
.p-2 {
  height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 16px;
  box-sizing: border-box;
}

/* 搜索区域：固定高度 */
.mb-\[10px\] {
  flex-shrink: 0;
}

/* 甘特图 wrapper：自动填充可用空间 */
.gantt-wrapper {
  flex: 1;
  width: 100%;
  min-height: 400px;
  position: relative;
  overflow: hidden;
}

.gantt-content {
  width: 100%;
  height: 100%;
  position: relative;
}

.gantt-chart {
  width: 100%;
  height: 100%;
}

/* 表格部分：固定高度 */
.el-table {
  flex-shrink: 0;
  margin-top: 10px;
}

/* 分页组件：固定在底部 */
:deep(.pagination-container) {
  flex-shrink: 0;
  margin-top: 8px;
}
</style>
