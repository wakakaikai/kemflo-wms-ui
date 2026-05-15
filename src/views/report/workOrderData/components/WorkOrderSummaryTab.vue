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
            <el-form-item label="产品料号" prop="item">
              <el-input v-model="queryParams.item" placeholder="请输入产品料号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="销售订单号" prop="salesOrderNo">
              <el-input v-model="queryParams.salesOrderNo" placeholder="请输入销售订单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工作中心" prop="workCenter">
              <el-input ref="workOrderInputRef" v-model="queryParams.workCenter" placeholder="请输入工作中心">
                <template #append>
                  <el-button icon="Search" @click="openWorkCenterDialog" />
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="计划开始日期" prop="plannedStartDateRange">
              <el-date-picker
                v-model="queryParams.plannedStartDateRange"
                type="datetimerange"
                :shortcuts="shortcuts"
                range-separator="-"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD HH:mm:ss"
                :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-table v-loading="loading" :data="paginatedList" :height="tableHeight" border stripe fixed-header>
      <el-table-column type="expand">
        <template #default="scope">
          <el-table :data="scope.row.workOrderProcessVoList" style="width: calc(100% - 130px); margin: 10px 0 10px 130px" empty-text="暂无数据" border>
            <el-table-column label="状态" align="left" min-width="200">
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
            <el-table-column label="工单号" align="center" prop="workOrderNo" />
            <el-table-column label="工序" align="center" prop="process" />
            <!--            <el-table-column label="状态描述" align="left" prop="finalStatusDetail" min-width="200">-->
            <!--              <template #default="scope">-->
            <!--                <div class="status-detail">-->
            <!--                  <div class="status-detail-content">-->
            <!--                    <div v-for="(item, index) in scope.row.finalStatusDetail.split('|')" :key="index">-->
            <!--                      {{ item.trim() }}-->
            <!--                    </div>-->
            <!--                  </div>-->
            <!--                </div>-->
            <!--              </template>-->
            <!--            </el-table-column>-->
            <el-table-column label="工序描述" align="center" prop="processShortDesc" />
            <el-table-column label="计划工作中心" align="center" prop="workCenter" />
            <el-table-column label="工单报工数量" align="center" prop="mesReportQty">
              <template #default="scope">
                {{ scope.row.mesReportQty ? parseFloat(scope.row.mesReportQty) : '--' }}
              </template>
            </el-table-column>
            <el-table-column label="预计开工" align="center" prop="plannedEndDate" />
            <el-table-column label="预计完工" align="center" prop="plannedStartDate" />
            <el-table-column label="预计D2D生产时长" align="left" prop="plannedD2DDurationDesc" />
            <el-table-column label="预计生产时长" align="left" prop="plannedDurationDesc" />
            <el-table-column label="实际开工" align="center" prop="actualStartDate" />
            <el-table-column label="实际完工" align="center" prop="actualEndDate" />
            <el-table-column label="实际D2D生产时长" align="left" prop="actualD2DDurationDesc">
              <template #default="scope">
                <span>{{ parseFloat(scope.row.actualD2DDuration) > 0 ? scope.row.actualD2DDurationDesc : '' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="实际生产时长" align="left" prop="actualDurationDesc">
              <template #default="scope">
                <span>{{ parseFloat(scope.row.actualDuration) > 0 ? scope.row.actualDurationDesc : '' }}</span>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="finalStatus">
        <template #default="scope">
          <div class="status-indicator">
            <span v-if="scope.row.finalStatus === 0" class="indicator-dot success"></span>
            <span v-else-if="scope.row.finalStatus === 1" class="indicator-dot warning"></span>
            <span v-else-if="scope.row.finalStatus === 2" class="indicator-dot danger"></span>
            <span v-else class="indicator-dot default"></span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="工单号" align="left" prop="workOrderNo" min-width="130" />
      <el-table-column label="产品料号" align="left" prop="item" min-width="150" />
      <el-table-column label="产品描述" align="left" prop="itemDesc" show-overflow-tooltip min-width="300" />
      <el-table-column label="计划开工日期" align="center" prop="plannedStartDate" width="180" />
      <el-table-column label="计划完工日期" align="center" prop="plannedEndDate" width="180" />
      <el-table-column label="实际开工日期" align="center" prop="actualStartTime" width="180" />
      <el-table-column label="实际完工日期" align="center" prop="actualEndTime" width="180" />
      <el-table-column label="计划数量" align="center" prop="plannedQty" />
      <el-table-column label="SAP入库数量" align="center" prop="deliveredQty" />
      <el-table-column label="WMS入库数量" align="center" prop="wmsDeliveredQty">
        <template #default="scope">
          {{ scope.row.wmsDeliveredQty ? parseFloat(scope.row.wmsDeliveredQty) : '--' }}
        </template>
      </el-table-column>
      <el-table-column label="单位" align="center" prop="unit" />
      <el-table-column label="销售订单号" align="center" prop="salesOrderNo" min-width="120" />
      <el-table-column label="销售订单项次" align="center" prop="salesOrderItem" min-width="120" />
      <el-table-column label="销售订单交货日" align="center" prop="soDeliveryDate" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.soDeliveryDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="生产模式" align="center" prop="productionMode" min-width="120">
        <template #default="scope">
          <dict-tag :options="wms_production_mode" :value="scope.row.productionMode" />
        </template>
      </el-table-column>
      <el-table-column label="集约生产标识" align="center" prop="intensiveProductionFlag">
        <template #default="scope">
          <el-checkbox v-model="scope.row.intensiveProductionFlag" disabled />
        </template>
      </el-table-column>
      <el-table-column label="尾数工单标识" align="center" prop="mantissaOrderFlag">
        <template #default="scope">
          <el-checkbox v-model="scope.row.mantissaOrderFlag" disabled />
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="paginatedList.length > 0" v-model:page="currentPage" v-model:limit="pageSize" :total="workOrderList.length" @pagination="handlePagination" />

    <!-- 弹框 -->
    <WorkCenterDialog ref="workCenterDialogRef" @work-center-call-back="workCenterCallBack" />
  </div>
</template>

<script setup name="WorkOrderSummaryTab" lang="ts">
import { WorkOrderVO, WorkOrderQuery, WorkOrderForm } from '@/api/wms/workOrder/types';
import { TableColumns } from '@/api/types';
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_production_mode, wms_work_order_check_enable } = toRefs<any>(proxy?.useDict('wms_production_mode', 'wms_work_order_check_enable'));
import WorkCenterDialog from '@/views/report/workOrderData/components/workCenterDialog.vue';
const workCenterDialogRef = ref<InstanceType<typeof WorkCenterDialog>>();
import { nextTick, ref } from 'vue';
import { parseTime } from '@/utils/ruoyi';

import { listWorkOrderSummary } from '@/api/report/workOrder';

const workOrderList = ref<WorkOrderVO[]>([]);
const loading = ref(false);
const showSearch = ref(true);
const total = ref(0);
const queryFormRef = ref<ElFormInstance>();
const workOrderFormRef = ref<ElFormInstance>();
// 前端分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return workOrderList.value.slice(start, end);
});

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: WorkOrderForm = {
  id: undefined,
  workOrderNo: undefined,
  item: undefined,
  itemDesc: undefined,
  checkEnable: 0,
  plannedStartDate: undefined,
  plannedEndDate: undefined,
  plannedQty: undefined,
  deliveredQty: undefined,
  waitStockQty: undefined,
  productionMode: undefined,
  intensiveProductionFlag: undefined,
  mantissaOrderFlag: undefined,
  remark: undefined
};
const data = reactive<PageData<WorkOrderForm, WorkOrderQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    workOrderNo: undefined,
    item: undefined,
    itemDesc: undefined,
    inspectionFlag: undefined,
    plannedStartDate: undefined,
    plannedEndDate: undefined,
    plannedQty: undefined,
    deliveredQty: undefined,
    waitStockQty: undefined,
    productionMode: undefined,
    intensiveProductionFlag: undefined,
    mantissaOrderFlag: undefined,
    params: {}
  },
  rules: {}
});

const { queryParams, form, rules } = toRefs(data);

const columns = ref<TableColumns[]>([
  { key: 1, label: '工单号', visible: true },
  { key: 2, label: '产品料号', visible: true },
  { key: 3, label: '产品描述', visible: true },
  { key: 4, label: '计划开工日期', visible: true },
  { key: 5, label: '计划完工日期', visible: true },
  { key: 6, label: '实际开工日期', visible: true },
  { key: 7, label: '实际完工日期', visible: true },
  { key: 8, label: '计划数量', visible: true },
  { key: 9, label: 'SAP入库数量', visible: true },
  { key: 10, label: 'WMS入库数量', visible: true },
  { key: 11, label: '单位', visible: false },
  { key: 12, label: '销售订单号', visible: true },
  { key: 13, label: '销售订单项次', visible: true },
  { key: 14, label: '销售订数量', visible: false },
  { key: 15, label: '销售订单单位', visible: false },
  { key: 16, label: '溯源工单号', visible: false },
  { key: 17, label: '销售订单交货日', visible: true },
  { key: 18, label: '生产模式', visible: false },
  { key: 19, label: '集约生产标识', visible: false },
  { key: 20, label: '尾数工单标识', visible: false },
  { key: 21, label: '创建时间', visible: false },
  { key: 22, label: '创建者', visible: false },
  { key: 23, label: '更新时间', visible: false },
  { key: 24, label: '更新者', visible: false },
  { key: 25, label: '备注', visible: false }
]);

const shortcuts = [
  {
    text: '今天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate());
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '昨天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近两天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近三天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 2);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近一周',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近一月',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近三月',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 3);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  }
];

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

/** 查询工单信息列表 */
const getList = async () => {
  loading.value = true;
  const res = await listWorkOrderSummary(queryParams.value);
  workOrderList.value = res.data;
  total.value = res.length;
  currentPage.value = 1; // 重置到第一页
  loading.value = false;
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  nextTick(() => {
    workOrderFormRef.value?.resetFields();
  });
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  // 如果选择工作中心需要限定计划开始时间范围90天内
  if (queryParams.value.workCenter || queryParams.value.plannedStartDateRange) {
    if (queryParams.value.workCenter && !queryParams.value.plannedStartDateRange) {
      proxy.$modal.msgWarning('请选择计划开始时间范围！');
      return;
    }
    if (!queryParams.value.workCenter && queryParams.value.plannedStartDateRange) {
      proxy.$modal.msgWarning('请选择工作中心！');
      return;
    }
    const [startDate, endDate] = queryParams.value.plannedStartDateRange;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // 计算两个日期之间的天数差
      const timeDiff = end.getTime() - start.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      // 如果超过31天，提示错误
      if (daysDiff > 90) {
        proxy?.$modal.msgWarning('选择工作中心时，计划开始日期范围不能超过90天！');
        return;
      }
    }
  }

  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/workOrder/export',
    {
      ...queryParams.value
    },
    `workOrder_${new Date().getTime()}.xlsx`
  );
};
/** 分页变化处理 */
const handlePagination = () => {
  // 前端分页无需重新请求，computed 会自动更新
};
// 工作中心对话框
const openWorkCenterDialog = () => {
  workCenterDialogRef.value.openDialog();
};
const workCenterCallBack = (data: any) => {
  queryParams.value.workCenter = data.workCenter;
  // queryParams.value.workCenterDesc = data.description;
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
