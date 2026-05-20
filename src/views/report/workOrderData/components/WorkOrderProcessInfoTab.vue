<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="工单号" prop="workOrderNo">
              <el-input v-model="queryParams.workOrderNo" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="入库标识卡号" prop="workOrderSn">
              <el-input v-model="queryParams.workOrderSn" placeholder="请输入入库标识卡号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="never">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:workOrderProcessReport:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="workOrderProcessList" @selection-change="handleSelectionChange" :height="tableHeight" border stripe fixed-header>
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="状态" align="left" min-width="200" fixed="left">
          <template #default="scope">
            <div class="status-with-detail">
              <div class="status-indicator-inline">
                <span v-if="scope.row.finalStatus === 0" class="indicator-dot success"></span>
                <span v-else-if="scope.row.finalStatus === 1" class="indicator-dot warning"></span>
                <span v-else-if="scope.row.finalStatus === 2" class="indicator-dot danger"></span>
                <span v-else class="indicator-dot default"></span>
                <span class="status-text">{{ scope.row.finalStatusDesc }}</span>
              </div>
              <div class="status-detail-content" v-if="scope.row.finalStatusDetail">
                <div v-for="(item, index) in scope.row.finalStatusDetail.split('|')" :key="index">
                  {{ item.trim() }}
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="工单号" align="center" prop="workOrderNo" fixed="left" />
        <el-table-column label="工序" align="center" prop="process" fixed="left" />
        <el-table-column label="工序描述" align="center" prop="processShortDesc" show-overflow-tooltip />
        <el-table-column label="工作中心" align="center" prop="workCenter" />
        <el-table-column label="产品料号" align="center" prop="item" show-overflow-tooltip />
        <el-table-column label="产品描述" align="center" prop="itemDesc" show-overflow-tooltip />
        <el-table-column label="客户订单" align="center" prop="salesOrderNo" />
        <el-table-column label="订单项次" align="center" prop="salesOrderItem" />
        <el-table-column label="客户交期" align="center" prop="soDeliveryDate" />
        <el-table-column label="工单数量" align="center" prop="plannedQty">
          <template #default="scope">
            <span>
              {{ scope.row.plannedQty ? parseFloat(scope.row.plannedQty) : '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="入库数量" align="center" prop="wmsDeliveredQty">
          <template #default="scope">
            <span>
              {{ scope.row.wmsDeliveredQty ? parseFloat(scope.row.wmsDeliveredQty) : '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="报工数量" align="center" prop="mesReportQty">
          <template #default="scope">
            <span>
              {{ scope.row.mesReportQty ? parseFloat(scope.row.mesReportQty) : '--' }}
            </span>
          </template>
        </el-table-column>
        <!--        <el-table-column label="完成数量" align="center" prop="mesDoneQty" />-->
        <el-table-column label="预计开工" align="center" prop="plannedStartDate" />
        <el-table-column label="预计完工" align="center" prop="plannedEndDate" />
        <el-table-column label="预计DTD生产时长" align="center" prop="plannedD2DDurationDesc" />
        <el-table-column label="标准人数" align="center" prop="standardPersonNumber">
          <template #default="scope">
            <span>
              {{ scope.row.standardPersonNumber ? parseFloat(scope.row.standardPersonNumber) : '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="标准产能" align="center" prop="standardPersonCapacity" />
        <el-table-column label="预计生产时长" align="center" prop="plannedDurationDesc" />
        <el-table-column label="实际开工" align="center" prop="actualStartDate" min-width="100" />
        <el-table-column label="实际完工" align="center" prop="actualEndDate" min-width="100" >
          <template #default="scope">
            <span>
              {{ scope.row.mesReportQty >= scope.row.plannedQty ? scope.row.actualEndDate : '' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="实际DTD生产时长" align="center" prop="actualD2DDurationDesc" />
        <el-table-column label="实际生产时长" align="center" prop="actualDurationDesc" />
        <el-table-column label="下制程工单号" align="center" prop="nextWorkOrderNo" />
        <el-table-column label="下制程工序" align="center" prop="nextProcessNo" />
        <el-table-column label="下制程工作中心" align="center" prop="nextWorkCenter" />
        <el-table-column label="下制程预计开工时间" align="center" prop="nextPlannedStartDate" min-width="100" />
        <el-table-column label="下制程实际开工时间" align="center" prop="nextActualStartDate" min-width="100" />
        <el-table-column label="前制程工单号" align="center" prop="previousWorkOrderNo" />
        <el-table-column label="前制程工序" align="center" prop="previousProcessNo" />
        <el-table-column label="前制程工作中心" align="center" prop="previousWorkCenter" />
        <el-table-column label="前制程预计完工时间" align="center" prop="previousPlannedEndDate" min-width="100" />
        <el-table-column label="前制程实际完工时间" align="center" prop="previousActualEndDate" min-width="100" />
        <el-table-column label="前制程已报工数量" align="center" prop="previousReportQty">
          <template #default="scope">
            <span>
              {{ scope.row.previousReportQty ? parseFloat(scope.row.previousReportQty) : '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="前制程工单入库数量" align="center" prop="previousDeliveredQty">
          <template #default="scope">
            <span>
              {{ scope.row.previousDeliveredQty ? parseFloat(scope.row.previousDeliveredQty) : '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="前制程入库完工时间" align="center" prop="previousActualDeliveredDate" min-width="100" />
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
  </div>
</template>

<script setup name="WorkOrderProcess" lang="ts">
import { listWorkOrderProcess } from '@/api/report/workOrder';
import { WorkOrderProcessVO, WorkOrderProcessQuery, WorkOrderProcessForm } from '@/api/wms/workOrderProcess/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const workOrderProcessList = ref<WorkOrderProcessVO[]>([]);

const loading = ref(false);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const workOrderProcessFormRef = ref<ElFormInstance>();

const initFormData: WorkOrderProcessForm = {
  id: undefined,
  workOrderNo: undefined,
  workOrderSn: undefined,
  router: undefined,
  process: undefined,
  processShortDesc: undefined,
  workCenter: undefined,
  processStatus: undefined,
  baseQty: undefined,
  personNumber: undefined,
  machineTime: undefined,
  machineTimeUnit: undefined,
  personTime: undefined,
  personTimeUnit: undefined,
  schedulingTime: undefined,
  schedulingTimeUnit: undefined,
  moduleQty: undefined,
  moduleUnit: undefined,
  remark: undefined
};
const data = reactive<PageData<WorkOrderProcessForm, WorkOrderProcessQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    workOrderNo: undefined,
    workOrderSn: undefined,
    router: undefined,
    process: undefined,
    processShortDesc: undefined,
    workCenter: undefined,
    processStatus: undefined,
    baseQty: undefined,
    personNumber: undefined,
    machineTime: undefined,
    machineTimeUnit: undefined,
    personTime: undefined,
    personTimeUnit: undefined,
    schedulingTime: undefined,
    schedulingTimeUnit: undefined,
    moduleQty: undefined,
    moduleUnit: undefined,
    params: {}
  },
  rules: {}
});

const { queryParams, form, rules } = toRefs(data);

// 动态表格高度
const tableHeight = ref<number>(350);

// 计算表格高度
const calcTableHeight = () => {
  // 窗口高度 - 页面其他占位高度（根据你的页面自行调整）
  const clientHeight = document.documentElement.clientHeight;
  // 减去：搜索表单 + 按钮栏 + 分页 + 间距等（自行调整）
  const subtractHeight = 480;
  let height = clientHeight - subtractHeight;

  // 最小高度限制（避免表格太矮）
  if (height < 300) height = 300;
  tableHeight.value = height;
};

// 监听窗口变化
let resizeTimer: NodeJS.Timeout | null = null;
const handleResize = () => {
  // 防抖
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    calcTableHeight();
  }, 100);
};

/** 查询工单工序列表 */
const getList = async () => {
  loading.value = true;
  const res = await listWorkOrderProcess(queryParams.value);
  workOrderProcessList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  workOrderProcessFormRef.value?.resetFields();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 多选框选中数据 */
const handleSelectionChange = (selection: WorkOrderProcessVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/scada/exportWorkOrderProcess',
    {
      ...queryParams.value
    },
    `workOrderProcess_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  calcTableHeight();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (resizeTimer) clearTimeout(resizeTimer);
});
</script>
<style scoped lang="scss">
.status-indicator {
  /* 布局优化 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 4px 0;

  /* 状态圆点 */
  .indicator-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 0 3px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;

    /*  hover 微动效 */
    &:hover {
      transform: scale(1.1);
    }

    /* 成功 - 绿色 */
    &.success {
      background-color: #67c23a;
      box-shadow: 0 0 5px rgba(103, 194, 58, 0.4);
    }

    /* 进行中 - 蓝色 */
    &.primary {
      background-color: #409eff;
      box-shadow: 0 0 5px rgba(64, 158, 255, 0.4);
    }

    /* 待处理 - 橙色 */
    &.warning {
      background-color: #e6a23c;
      box-shadow: 0 0 5px rgba(230, 162, 60, 0.4);
    }

    /* 失败/异常 - 红色 */
    &.danger {
      background-color: #f56c6c;
      box-shadow: 0 0 5px rgba(245, 108, 108, 0.4);
    }

    /* 默认/未知 - 灰色 */
    &.default {
      background-color: #909399;
      box-shadow: 0 0 3px rgba(144, 147, 153, 0.3);
    }
  }

  /* 状态文字 */
  .status-text {
    font-size: 14px;
    color: #303133;
    font-weight: 500;
    line-height: 16px;
  }

  .status-detail-content {
    max-height: 300px;
    overflow-y: auto;
    word-break: break-word;
    line-height: 1.6;
    color: #606266;
    font-size: 14px;
  }
}

/* 展开行内状态与描述合并的样式 */
.status-with-detail {
  /*  padding: 4px 0;*/

  .status-indicator-inline {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 4px;

    .indicator-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 3px;
      box-shadow: 0 0 3px rgba(0, 0, 0, 0.15);

      &.success {
        background-color: #67c23a;
        box-shadow: 0 0 5px rgba(103, 194, 58, 0.4);
      }

      &.warning {
        background-color: #e6a23c;
        box-shadow: 0 0 5px rgba(230, 162, 60, 0.4);
      }

      &.danger {
        background-color: #f56c6c;
        box-shadow: 0 0 5px rgba(245, 108, 108, 0.4);
      }

      &.default {
        background-color: #909399;
        box-shadow: 0 0 3px rgba(144, 147, 153, 0.3);
      }
    }

    .status-info {
      flex: 1;
      min-width: 0;

      .status-text {
        font-size: 14px;
        color: #303133;
        font-weight: 500;
        line-height: 1.6;
        display: block;
        margin-bottom: 6px;
      }
    }
  }

  .status-detail-content {
    padding-left: 24px;
    max-height: 200px;
    overflow-y: auto;
    word-break: break-word;
    line-height: 1.8;
    color: #606266;
    font-size: 13px;

    div {
      padding: 2px 0;
      position: relative;

      &:before {
        content: '•';
        position: absolute;
        left: -12px;
        color: #909399;
      }
    }
  }
}
</style>
