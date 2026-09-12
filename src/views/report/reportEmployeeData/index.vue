<template>
  <div ref="reportFullscreenRef" class="report-fullscreen-root" :class="{ 'is-fullscreen': isFullscreen }">
    <div class="p-2 report-fullscreen-content">
    <el-card ref="reportCardRef" class="report-employee-card" :class="{ 'is-fullscreen': isFullscreen }" shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span>报工成功员工报表统计</span>
          <el-button :icon="isFullscreen ? 'Close' : 'FullScreen'" text @click="toggleFullscreen">
            {{ isFullscreen ? '退出全屏' : '全屏' }}
          </el-button>
        </div>
      </template>

      <el-form ref="queryFormRef" :model="queryParams" :rules="rules" :inline="true" label-width="auto">
        <!--        <el-form-item label="工作中心" prop="workCenterList">
          <el-select v-model="queryParams.workCenterList" multiple filterable allow-create default-first-option clearable placeholder="请输入工作中心" style="width: 260px" />
        </el-form-item>-->
        <!--        <el-form-item label="班别" prop="shiftTimeRange">
          <el-input v-model="queryParams.shiftTimeRange" placeholder="08:00~20:30" clearable style="width: 160px" @keyup.enter="handleQuery" />
        </el-form-item>-->
        <el-form-item label="工号" prop="employeeIdStr">
          <el-input v-model="queryParams.employeeIdStr" placeholder="请输入工号" clearable style="width: 220px" @keyup.enter="handleQuery">
            <template #append>
              <el-button icon="CopyDocument" title="批量录入工号" @click="openBatchInputDialog" />
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="报工时间" prop="reportTimeRange">
          <el-date-picker
            v-model="queryParams.reportTimeRange"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            :default-time="defaultReportTime"
            :shortcuts="shortcuts"
            :append-to="popperAppendTo"
            clearable
          />
        </el-form-item>
        <el-form-item label="单位">
          <el-radio-group v-model="displayUnit">
            <el-radio-button label="hour">小时</el-radio-button>
            <el-radio-button label="minute">分钟</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-dropdown class="mr-2" :teleported="!isFullscreen" @command="handleExport">
            <el-button icon="Download">
              导出
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="summary">员工每日汇总</el-dropdown-item>
                <el-dropdown-item command="detail">员工每日明细</el-dropdown-item>
                <el-dropdown-item command="duplicate">重复上线统计</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button type="primary" icon="Search" :loading="chartLoading || summaryLoading || detailLoading || duplicateLoading" @click="handleQuery">查询统计</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="图表分析" name="charts">
          <employee-duration-charts ref="employeeDurationChartsRef" :chart-data="chartData" :employee-id="chartEmployeeId" :display-unit="displayUnit" :fill-height="isFullscreen" />
        </el-tab-pane>
        <el-tab-pane label="员工每日汇总" name="summary">
          <div class="table-pane">
            <el-table v-loading="summaryLoading" :data="summaryDisplayList" border fit :height="tableHeight">
            <el-table-column label="日期" align="center" prop="reportDate" />
            <el-table-column label="工号" align="center" prop="employeeId" />
            <el-table-column label="姓名" align="center" prop="employeeName" />
            <el-table-column :label="`总出勤时长(${unitLabel})`" align="right" prop="totalDuration" />
            <el-table-column :label="`总操作时长(${unitLabel})`" align="right" prop="operationDuration" />
            <el-table-column :label="`总有效时长(${unitLabel})`" align="right" prop="effectiveDuration" />
            <el-table-column label="上线记录数" align="right" prop="onlineRecordCount" />
          </el-table>
          </div>
        </el-tab-pane>
        <el-tab-pane label="员工每日明细" name="detail">
          <div class="table-pane is-detail">
            <el-table v-loading="detailLoading" :data="detailDisplayList" border fit :height="detailTableHeight">
            <el-table-column label="日期" align="center" prop="reportDate" />
            <el-table-column label="工作中心" align="center" prop="workCenter" />
            <el-table-column label="工单号" align="center" prop="shopOrder" />
            <el-table-column label="工号" align="center" prop="employeeId" />
            <el-table-column label="姓名" align="center" prop="employeeName" />
            <el-table-column label="上线时间" align="center" prop="onLineTime">
              <template #default="scope">{{ parseTime(scope.row.onLineTime) }}</template>
            </el-table-column>
            <el-table-column label="下线时间" align="center" prop="offLineTime">
              <template #default="scope">{{ parseTime(scope.row.offLineTime) }}</template>
            </el-table-column>
            <el-table-column :label="`出勤时长(${unitLabel})`" align="right" prop="duration" />
            <el-table-column :label="`操作时长(${unitLabel})`" align="right" prop="operationDuration" />
            <el-table-column :label="`有效时长(${unitLabel})`" align="right" prop="effectiveDuration" />
          </el-table>
            <pagination v-show="detailTotal > 0" :total="detailTotal" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getDetail" />
          </div>
        </el-tab-pane>
        <el-tab-pane label="重复上线统计" name="duplicate">
          <div class="table-pane">
            <el-table v-loading="duplicateLoading" :data="duplicateDisplayList" border fit :height="tableHeight">
            <el-table-column label="日期" align="center" prop="reportDate" />
            <el-table-column label="工号" align="center" prop="employeeId" />
            <el-table-column label="姓名" align="center" prop="employeeName" />
            <el-table-column :label="`重复上线总时长(${unitLabel})`" align="right" prop="duplicateDuration" />
            <el-table-column label="上线记录数" align="right" prop="onlineRecordCount" />
          </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <BatchInputDialog ref="batchInputDialogRef" v-model="batchInputDialogVisible" title="批量录入工号" placeholder="请输入工号，支持多行粘贴" :append-to-body="!isFullscreen" @confirm="handleBatchInputConfirm" />
    </div>
  </div>
</template>

<script setup name="ReportEmployeeData" lang="ts">
import { getEmployeeDurationChart, listEmployeeDurationSummary, listEmployeeDurationDetail, listEmployeeDurationDuplicate } from '@/api/mes/shopOrderReport';
import type { ShopOrderReportEmployeeDurationChartVO, ShopOrderReportEmployeeDurationQuery, ShopOrderReportEmployeeDurationSummaryVO, ShopOrderReportEmployeeDurationDetailVO, ShopOrderReportEmployeeDurationDuplicateVO } from '@/api/mes/shopOrderReport/types';
import { ArrowDown } from '@element-plus/icons-vue';
import BatchInputDialog from '@/components/BatchInputDialog/index.vue';
import EmployeeDurationCharts from './components/EmployeeDurationCharts.vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const reportFullscreenRef = ref<HTMLElement>();
const reportCardRef = ref();
const queryFormRef = ref<ElFormInstance>();
const employeeDurationChartsRef = ref<{ resizeCharts: () => void }>();
const batchInputDialogRef = ref<InstanceType<typeof BatchInputDialog>>();
const batchInputDialogVisible = ref(false);
const activeTab = ref('charts');
/** 图表聚合接口加载状态。 */
const chartLoading = ref(false);
const summaryLoading = ref(false);
const detailLoading = ref(false);
const duplicateLoading = ref(false);
const summaryList = ref<ShopOrderReportEmployeeDurationSummaryVO[]>([]);
const detailList = ref<ShopOrderReportEmployeeDurationDetailVO[]>([]);
const duplicateList = ref<ShopOrderReportEmployeeDurationDuplicateVO[]>([]);
/** 后端按完整查询范围聚合的图表数据，避免图表受到表格分页条数限制。 */
const chartData = ref<ShopOrderReportEmployeeDurationChartVO>();
const detailTotal = ref(0);
const displayUnit = ref<'hour' | 'minute'>('hour');
/** 日期范围选择器使用的固定开始、结束时间，显式声明为二元组以匹配组件类型。 */
const defaultReportTime: [Date, Date] = [new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59, 999)];
const isFullscreen = ref(false);
const tableHeight = ref<string | number>('calc(100vh - 330px)');
const detailTableHeight = ref<string | number>('calc(100vh - 380px)');

/** 全屏时弹层挂到全屏根节点，避免挂 body 不可见，也避免被 overflow 裁切导致面板重叠 */
const popperAppendTo = computed(() => {
  if (isFullscreen.value && reportFullscreenRef.value) {
    return reportFullscreenRef.value;
  }
  return 'body';
});

const unitLabel = computed(() => (displayUnit.value === 'hour' ? '小时' : '分钟'));

const convertDuration = (minute?: number) => {
  const value = Number(minute || 0);
  if (displayUnit.value === 'hour') {
    return (value / 60).toFixed(2);
  }
  return value;
};
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
const summaryDisplayList = computed(() =>
  summaryList.value.map((item) => ({
    ...item,
    totalDuration: convertDuration(item.totalDuration),
    operationDuration: convertDuration(item.operationDuration),
    effectiveDuration: convertDuration(item.effectiveDuration)
  }))
);

const detailDisplayList = computed(() =>
  detailList.value.map((item) => ({
    ...item,
    duration: convertDuration(item.duration),
    operationDuration: convertDuration(item.operationDuration),
    effectiveDuration: convertDuration(item.effectiveDuration)
  }))
);

const duplicateDisplayList = computed(() =>
  duplicateList.value.map((item) => ({
    ...item,
    duplicateDuration: convertDuration(item.duplicateDuration)
  }))
);

const rules = {
  reportTimeRange: [{ required: true, message: '请选择报工时间范围', trigger: 'change' }]
};

const queryParams = reactive<ShopOrderReportEmployeeDurationQuery & { reportTimeRange?: string[] }>({
  pageNum: 1,
  pageSize: 10,
  workCenterList: [],
  employeeId: undefined,
  employeeIdList: [],
  employeeIdStr: undefined,
  shiftTimeRange: '08:00~20:30',
  reportTimeRange: []
});

/** 解析工号批量录入字符串 */
const parseEmployeeIdList = (str?: string): string[] => {
  if (!str?.trim()) {
    return [];
  }
  return [...new Set(str.split(/[,;，；\s]+/).map((item) => item.trim()).filter(Boolean))];
};

const syncEmployeeIdFilter = () => {
  const list = parseEmployeeIdList(queryParams.employeeIdStr);
  queryParams.employeeIdList = list;
  queryParams.employeeIdStr = list.length ? list.join(',') : undefined;
  queryParams.employeeId = list.length === 1 ? list[0] : undefined;
  return list;
};

const chartEmployeeId = computed(() => {
  const list = queryParams.employeeIdList || [];
  return list.length === 1 ? list[0] : undefined;
});

const buildQuery = (): ShopOrderReportEmployeeDurationQuery => {
  const reportTimeRange = queryParams.reportTimeRange || [];
  const employeeIdList = queryParams.employeeIdList?.length ? queryParams.employeeIdList : undefined;
  return {
    pageNum: queryParams.pageNum,
    pageSize: queryParams.pageSize,
    workCenterList: queryParams.workCenterList,
    employeeId: queryParams.employeeId,
    employeeIdList,
    employeeIdStr: queryParams.employeeIdStr,
    shiftTimeRange: queryParams.shiftTimeRange,
    reportBeginTime: reportTimeRange[0],
    reportEndTime: reportTimeRange[1]
  };
};

const hasReportTimeRange = () => {
  const reportTimeRange = queryParams.reportTimeRange || [];
  return reportTimeRange.length === 2 && reportTimeRange[0] && reportTimeRange[1];
};

const validateReportTimeRange = () => {
  if (hasReportTimeRange()) {
    return true;
  }
  proxy?.$modal.msgWarning('请选择报工时间范围');
  queryFormRef.value?.validateField('reportTimeRange').catch(() => undefined);
  return false;
};

const getSummary = async () => {
  if (!hasReportTimeRange()) {
    return;
  }
  summaryLoading.value = true;
  try {
    const res = await listEmployeeDurationSummary(buildQuery());
    // 汇总接口返回TableDataInfo，列表字段为rows而不是data。
    summaryList.value = res.rows || [];
  } finally {
    summaryLoading.value = false;
  }
};

const getDetail = async () => {
  if (!hasReportTimeRange()) {
    return;
  }
  detailLoading.value = true;
  try {
    const res = await listEmployeeDurationDetail(buildQuery());
    detailList.value = res.rows || [];
    detailTotal.value = res.total || 0;
  } finally {
    detailLoading.value = false;
  }
};

const getDuplicate = async () => {
  if (!hasReportTimeRange()) {
    return;
  }
  duplicateLoading.value = true;
  try {
    const res = await listEmployeeDurationDuplicate(buildQuery());
    // 重复上线接口返回TableDataInfo，列表字段为rows而不是data。
    duplicateList.value = res.rows || [];
  } finally {
    duplicateLoading.value = false;
  }
};

/** 查询不受表格分页影响的完整图表聚合数据。 */
const getChart = async () => {
  if (!hasReportTimeRange()) {
    return;
  }
  chartLoading.value = true;
  try {
    const res = await getEmployeeDurationChart(buildQuery());
    chartData.value = res.data;
  } finally {
    chartLoading.value = false;
  }
};

const handleQuery = async () => {
  if (!validateReportTimeRange()) {
    return;
  }
  syncEmployeeIdFilter();
  queryParams.pageNum = 1;
  // 图表使用专用聚合接口，三个表格继续分别查询自己的分页数据。
  await Promise.all([getChart(), getSummary(), getDetail(), getDuplicate()]);
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.pageNum = 1;
  queryParams.pageSize = 10;
  queryParams.workCenterList = [];
  queryParams.employeeId = undefined;
  queryParams.employeeIdList = [];
  queryParams.employeeIdStr = undefined;
  queryParams.shiftTimeRange = '08:00~20:30';
  queryParams.reportTimeRange = [];
  summaryList.value = [];
  detailList.value = [];
  duplicateList.value = [];
  chartData.value = undefined;
  detailTotal.value = 0;
  batchInputDialogRef.value?.resetInput();
};

const openBatchInputDialog = () => {
  batchInputDialogVisible.value = true;
};

const handleBatchInputConfirm = (values: string[]) => {
  queryParams.employeeIdStr = values.join(',');
  handleQuery();
};

const exportMap = {
  summary: {
    url: 'wms/report/employeeDuration/summary/export',
    fileName: '员工每日汇总'
  },
  detail: {
    url: 'wms/report/employeeDuration/detail/export',
    fileName: '员工每日明细'
  },
  duplicate: {
    url: 'wms/report/employeeDuration/duplicate/export',
    fileName: '重复上线统计'
  }
};

const handleExport = (type: 'summary' | 'detail' | 'duplicate') => {
  if (!validateReportTimeRange()) {
    return;
  }
  syncEmployeeIdFilter();
  const exportConfig = exportMap[type];
  proxy?.download(exportConfig.url, buildQuery(), `${exportConfig.fileName}_${new Date().getTime()}.xlsx`);
};

const toggleFullscreen = async () => {
  const el = reportFullscreenRef.value;
  if (!el) {
    return;
  }
  if (!document.fullscreenElement) {
    await el.requestFullscreen?.();
    return;
  }
  await document.exitFullscreen?.();
};

const getBoxExtra = (el: HTMLElement | null, props: Array<'paddingTop' | 'paddingBottom' | 'marginTop' | 'marginBottom'>) => {
  if (!el) {
    return 0;
  }
  const style = getComputedStyle(el);
  return props.reduce((sum, prop) => sum + (parseFloat(style[prop]) || 0), 0);
};

/** 全屏时用卡片可视高度减去固定头、表单、Tabs，避免底部被 overflow:hidden 裁切 */
const calcTableHeight = () => {
  if (!isFullscreen.value) {
    tableHeight.value = 'calc(100vh - 330px)';
    detailTableHeight.value = 'calc(100vh - 380px)';
    return;
  }
  const card = reportCardRef.value?.$el as HTMLElement | undefined;
  if (!card?.clientHeight) {
    return;
  }
  const header = card.querySelector('.el-card__header') as HTMLElement | null;
  const body = card.querySelector('.el-card__body') as HTMLElement | null;
  const form = card.querySelector('.el-form') as HTMLElement | null;
  const tabsHeader = card.querySelector('.el-tabs__header') as HTMLElement | null;
  const pagination = card.querySelector('.pagination-container') as HTMLElement | null;
  const available =
    card.clientHeight -
    (header?.offsetHeight || 0) -
    getBoxExtra(body, ['paddingTop', 'paddingBottom']) -
    (form?.offsetHeight || 0) -
    (tabsHeader?.offsetHeight || 0) -
    getBoxExtra(tabsHeader, ['marginBottom']);
  tableHeight.value = Math.max(Math.floor(available), 240);
  const paginationH =
    pagination && pagination.offsetHeight > 0 ? pagination.offsetHeight + getBoxExtra(pagination, ['marginTop', 'marginBottom']) : 52;
  detailTableHeight.value = Math.max(Math.floor(available - paginationH), 200);
};

const relayoutFullscreenContent = () => {
  nextTick(() => {
    calcTableHeight();
    requestAnimationFrame(() => {
      employeeDurationChartsRef.value?.resizeCharts();
    });
  });
};

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
  relayoutFullscreenContent();
};

watch([activeTab, detailTotal], () => {
  if (activeTab.value === 'charts' || isFullscreen.value) {
    relayoutFullscreenContent();
  }
});

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  window.addEventListener('resize', calcTableHeight);
});

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  window.removeEventListener('resize', calcTableHeight);
});
</script>

<style scoped>
.report-fullscreen-root.is-fullscreen {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  /* 根节点不裁切，供日期/下拉弹层挂载；内容区单独 overflow */
  overflow: visible;
  background: var(--el-bg-color);
}

.report-fullscreen-root.is-fullscreen .report-fullscreen-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.report-employee-card.is-fullscreen {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  border-radius: 0;
}

.report-employee-card.is-fullscreen :deep(.el-card__header) {
  flex-shrink: 0;
}

.report-employee-card.is-fullscreen :deep(.el-card__body) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: visible;
}

.report-employee-card.is-fullscreen :deep(.el-form) {
  position: relative;
  z-index: 10;
  flex-shrink: 0;
  overflow: visible;
}

.report-employee-card.is-fullscreen :deep(.el-tabs) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.report-employee-card.is-fullscreen :deep(.el-tabs__header) {
  flex: none;
  flex-shrink: 0;
  order: 0;
  /* 与非全屏默认间距一致，避免 tab 被挤偏 */
  margin-bottom: 15px;
}

.report-employee-card.is-fullscreen :deep(.el-tabs__nav-wrap),
.report-employee-card.is-fullscreen :deep(.el-tabs__nav-scroll) {
  flex: none;
}

.report-employee-card.is-fullscreen :deep(.el-tabs__content) {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  /* 勿用 height:100%，否则会与 header 抢高度导致 tab 位移/被裁切 */
  height: auto;
  min-height: 0;
  overflow: hidden;
  order: 1;
}

.report-employee-card.is-fullscreen :deep(.el-tab-pane) {
  display: flex;
  flex: 1;
  flex-direction: column;
  height: auto;
  min-height: 0;
  overflow: hidden;
}

.report-employee-card.is-fullscreen :deep(.employee-duration-charts) {
  flex: 1;
  height: 100%;
  min-height: 0;
}

.report-employee-card.is-fullscreen .table-pane {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.report-employee-card.is-fullscreen .table-pane :deep(.el-table) {
  flex: 1;
}

.report-employee-card.is-fullscreen .table-pane.is-detail :deep(.pagination-container) {
  flex-shrink: 0;
  margin-top: 8px;
  margin-bottom: 0;
}
</style>
