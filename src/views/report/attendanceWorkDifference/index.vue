<template>
  <div ref="reportFullscreenRef" class="report-fullscreen-root" :class="{ 'is-fullscreen': isFullscreen }">
    <div class="p-2 report-fullscreen-content">
      <el-card ref="reportCardRef" class="attendance-report-card" :class="{ 'is-fullscreen': isFullscreen }" shadow="never">
        <template #header>
          <div class="flex items-center justify-between">
            <span>HR员工考勤与报工差异报表</span>
            <div class="flex items-center gap-2">
              <el-tag type="info">平日=排班-请假+平日加班；假日/节日=假日/节日加班-请假</el-tag>
              <el-button :icon="isFullscreen ? 'Close' : 'FullScreen'" text @click="toggleFullscreen">
                {{ isFullscreen ? '退出全屏' : '全屏' }}
              </el-button>
            </div>
          </div>
        </template>

        <!-- 查询区域：支持跨日时间范围和批量工号。 -->
        <el-form ref="queryFormRef" :model="queryParams" :rules="rules" :inline="true" label-width="auto">
          <el-form-item label="考勤时间" prop="dateRange">
            <el-date-picker v-model="queryParams.dateRange" type="datetimerange" value-format="YYYY-MM-DD HH:mm:ss" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" :default-time="defaultAttendanceTime" :shortcuts="shortcuts" :append-to="popperAppendTo" clearable />
          </el-form-item>
          <el-form-item label="工号" prop="employeeIdStr">
            <el-input v-model="queryParams.employeeIdStr" placeholder="请输入工号" clearable style="width: 220px" @keyup.enter="handleQuery">
              <template #append>
                <el-button icon="CopyDocument" title="批量录入工号" @click="batchInputVisible = true" />
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" :loading="loading || chartLoading" @click="handleQuery">查询</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            <el-button icon="Download" @click="handleExport">导出</el-button>
          </el-form-item>
        </el-form>

        <!-- 报表内容分为HR图表分析和逐条差异明细，移除原表格上方的本页统计卡片。 -->
        <!-- Tab切换统一放在内容顶部；全屏时通过样式固定，滚动图表不会隐藏。 -->
        <el-tabs v-model="activeTab" tab-position="top">
          <el-tab-pane label="图表分析" name="charts">
            <attendance-difference-charts ref="chartsRef" v-loading="chartLoading" :rows="chartRows" :hr-employee-count="hrEmployeeCount" :mes-report-employee-count="mesReportEmployeeCount" :fill-height="isFullscreen" />
          </el-tab-pane>
          <el-tab-pane label="HR->MES差异明细" name="detail">
            <!-- 明细区域：展示员工组织信息及考勤、报工各项小时数。 -->
            <div class="detail-pane">
              <el-table v-loading="loading" :data="rows" border fit :height="tableHeight" row-key="rowKey">
                <el-table-column label="日期" prop="attendanceDate" width="110" fixed />
                <el-table-column label="星期" prop="weekDay" width="90" />
                <el-table-column label="工号" prop="employeeId" width="105" fixed />
                <el-table-column label="姓名" prop="employeeName" width="100" fixed />
                <!--                <el-table-column label="公司" prop="corporationName" min-width="180" show-overflow-tooltip />-->
                <el-table-column label="部门" prop="departmentName" min-width="150" show-overflow-tooltip />
                <el-table-column label="职位" prop="jobName" min-width="110" show-overflow-tooltip />
                <el-table-column label="成本中心编码" prop="costCenterCode" width="130" show-overflow-tooltip />
                <el-table-column label="成本中心描述" prop="costCenterName" min-width="170" show-overflow-tooltip />
                <el-table-column label="班次" prop="rankName" min-width="100" />
                <el-table-column label="班次开始" prop="workBeginTime" width="100" align="center">
                  <template #default="scope">{{ formatShiftTime(scope.row.workBeginTime) }}</template>
                </el-table-column>
                <el-table-column label="班次结束" prop="workEndTime" width="100" align="center">
                  <template #default="scope">{{ formatShiftTime(scope.row.workEndTime) }}</template>
                </el-table-column>
                <el-table-column label="排班(h)" prop="scheduleHours" width="95" align="right" />
                <el-table-column label="请假(h)" prop="leaveHours" width="95" align="right">
                  <template #default="scope">
                    <el-tooltip :content="scope.row.leaveTypes || '无'" placement="top"
                      ><span>{{ formatHours(scope.row.leaveHours) }}</span></el-tooltip
                    >
                  </template>
                </el-table-column>
                <el-table-column label="加班(h)" prop="overtimeHours" width="95" align="right">
                  <template #default="scope">
                    <el-tooltip :content="scope.row.overtimeTypes || '无'" placement="top"
                      ><span>{{ formatHours(scope.row.overtimeHours) }}</span></el-tooltip
                    >
                  </template>
                </el-table-column>
                <el-table-column label="加班类型ID" prop="overtimeTypeIds" width="115" show-overflow-tooltip />
                <el-table-column label="加班描述" prop="overtimeTypes" width="120" show-overflow-tooltip />
                <el-table-column label="HR应计(h)" prop="attendanceHours" width="110" align="right" />
                <el-table-column label="MES报工(h)" prop="reportHours" width="115" align="right" />
                <el-table-column label="HR开始" prop="hrBeginTime" width="165" />
                <el-table-column label="HR结束" prop="hrEndTime" width="165" />
                <el-table-column label="MES最早上线" prop="mesBeginTime" width="165" />
                <el-table-column label="MES最晚下线" prop="mesEndTime" width="165" />
                <el-table-column label="开始差(分)" prop="beginDifferenceMinutes" width="105" align="right" />
                <el-table-column label="结束差(分)" prop="endDifferenceMinutes" width="105" align="right" />
                <el-table-column label="时段状态" prop="timeRangeStatus" width="165" show-overflow-tooltip />
                <el-table-column label="差异(h)" prop="differenceHours" width="100" align="right">
                  <template #default="scope">
                    <span :class="differenceClass(scope.row.differenceHours)">{{ signed(scope.row.differenceHours) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="状态" prop="differenceStatus" width="100" fixed="right">
                  <template #default="scope">
                    <el-tag :type="statusType(scope.row.differenceStatus)">{{ scope.row.differenceStatus }}</el-tag>
                  </template>
                </el-table-column>
              </el-table>
              <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" />
            </div>
          </el-tab-pane>
          <el-tab-pane label="时段差异明细" name="timeRange">
            <!-- 时段异常维度使用完整查询结果，支持直接下钻到对应员工日期。 -->
            <div class="detail-pane">
              <el-radio-group v-model="timeDifferenceFilter" class="mb-3">
                <el-radio-button label="all">全部时段差异</el-radio-button>
                <el-radio-button label="noSchedule">MES报工无排班</el-radio-button>
                <el-radio-button label="weekday">平日班次+平日加班</el-radio-button>
                <el-radio-button label="holiday">假日加班</el-radio-button>
                <el-radio-button label="festival">节日加班</el-radio-button>
              </el-radio-group>
              <el-table v-loading="chartLoading" :data="timeDifferenceRows" border fit :height="tableHeight" row-key="rowKey">
                <el-table-column label="日期" prop="attendanceDate" width="110" fixed />
                <el-table-column label="星期" prop="weekDay" width="90" />
                <el-table-column label="工号" prop="employeeId" width="105" fixed />
                <el-table-column label="姓名" prop="employeeName" width="100" fixed />
                <el-table-column label="部门" prop="departmentName" min-width="150" show-overflow-tooltip />
                <el-table-column label="班次" prop="rankName" width="105" />
                <el-table-column label="HR开始" prop="hrBeginTime" width="165" />
                <el-table-column label="HR结束" prop="hrEndTime" width="165" />
                <el-table-column label="MES最早上线" prop="mesBeginTime" width="165" />
                <el-table-column label="MES最晚下线" prop="mesEndTime" width="165" />
                <el-table-column label="开始差(分)" prop="beginDifferenceMinutes" width="105" align="right" />
                <el-table-column label="结束差(分)" prop="endDifferenceMinutes" width="105" align="right" />
                <el-table-column label="时段状态" prop="timeRangeStatus" width="165" fixed="right" />
              </el-table>
              <pagination v-show="timeDifferenceTotal > 0" v-model:page="timeDifferencePageNum" v-model:limit="timeDifferencePageSize" :total="timeDifferenceTotal" />
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-card>

      <!-- 批量工号录入弹窗，支持从Excel或文本中多行粘贴。 -->
      <BatchInputDialog v-model="batchInputVisible" title="批量录入工号" placeholder="请输入工号，支持多行粘贴" :append-to-body="!isFullscreen" @confirm="handleBatchConfirm" />
    </div>
  </div>
</template>

<script setup name="AttendanceWorkDifference" lang="ts">
import { getAttendanceWorkDifferenceChart } from '@/api/report/attendanceWorkDifference';
import type { AttendanceWorkDifferenceQuery, AttendanceWorkDifferenceVO } from '@/api/report/attendanceWorkDifference/types';
import BatchInputDialog from '@/components/BatchInputDialog/index.vue';
import AttendanceDifferenceCharts from './components/AttendanceDifferenceCharts.vue';

/** 当前组件实例代理，用于消息提示和文件下载。 */
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

/** 报表全屏根节点。 */
const reportFullscreenRef = ref<HTMLElement>();

/** 报表卡片实例，用于计算全屏明细表格可用高度。 */
const reportCardRef = ref();

/** 查询表单实例。 */
const queryFormRef = ref<ElFormInstance>();

/** 当前展示的内容Tab。 */
const activeTab = ref('charts');

/** 时段差异明细的下钻维度。 */
const timeDifferenceFilter = ref<'all' | 'noSchedule' | 'weekday' | 'holiday' | 'festival'>('all');

/** 时段差异明细当前页码。 */
const timeDifferencePageNum = ref(1);

/** 时段差异明细每页行数。 */
const timeDifferencePageSize = ref(20);

/** 图表组件实例，用于Tab重新显示后校正画布尺寸。 */
const chartsRef = ref<{ resizeCharts: () => void }>();

/** 当前报表是否处于浏览器全屏状态。 */
const isFullscreen = ref(false);

/** 全屏时将时间选择弹层挂到报表根节点，避免弹层被全屏容器遮挡。 */
const popperAppendTo = computed(() => {
  if (isFullscreen.value && reportFullscreenRef.value) {
    return reportFullscreenRef.value;
  }
  return 'body';
});

/** 差异明细表格高度，进入全屏后动态计算。 */
const tableHeight = ref<string | number>('calc(100vh - 330px)');

/** 表格查询加载状态。 */
const loading = ref(false);

/** 完整图表数据加载状态。 */
const chartLoading = ref(false);

/** 当前筛选范围内不分页的图表分析数据。 */
const chartRows = ref<AttendanceWorkDifferenceVO[]>([]);

/**
 * 固定筛选HR与MES存在工时差异、无班次报工或时段差异的主明细。
 * 该结果直接复用图表接口返回的完整数据，避免重复调用分页接口再次执行整套跨库查询。
 */
const filteredDetailRows = computed(() => chartRows.value.filter((row) => Number(row.differenceHours || 0) !== 0 || Boolean(row.mesReportedWithoutSchedule) || Boolean(row.timeRangeDifferent)));

/** 符合当前条件的主明细总记录数。 */
const total = computed(() => filteredDetailRows.value.length);

/** 对主明细进行前端分页，页面每次只渲染当前页数据。 */
const rows = computed(() => {
  const beginIndex = (queryParams.pageNum - 1) * queryParams.pageSize;
  return filteredDetailRows.value.slice(beginIndex, beginIndex + queryParams.pageSize).map((row) => ({ ...row, rowKey: `${row.attendanceDate}-${row.employeeId}` }));
});

/**
 * 根据用户选择的时段异常维度筛选完整员工明细。
 * 工时一致但上下线范围不同的记录也会保留。
 */
const filteredTimeDifferenceRows = computed(() =>
  chartRows.value
    .filter((row) => {
      if (timeDifferenceFilter.value === 'noSchedule') return Boolean(row.mesReportedWithoutSchedule);
      if (!(row.reportCount > 0 && row.timeRangeDifferent)) return false;
      if (timeDifferenceFilter.value === 'weekday') return row.timeRangeCategory === '平日班次+平日加班';
      if (timeDifferenceFilter.value === 'holiday') return row.timeRangeCategory === '假日加班';
      if (timeDifferenceFilter.value === 'festival') return row.timeRangeCategory === '节日加班';
      return true;
    })
    .map((row) => ({ ...row, rowKey: `time-${row.attendanceDate}-${row.employeeId}` }))
);

/** 时段差异明细总记录数。 */
const timeDifferenceTotal = computed(() => filteredTimeDifferenceRows.value.length);

/** 对时段差异下钻结果进行前端分页，避免一个月数据一次性渲染造成表格异常。 */
const timeDifferenceRows = computed(() => {
  const beginIndex = (timeDifferencePageNum.value - 1) * timeDifferencePageSize.value;
  return filteredTimeDifferenceRows.value.slice(beginIndex, beginIndex + timeDifferencePageSize.value);
});

/** 当前筛选范围内HR侧员工数，按工号去重。 */
const hrEmployeeCount = ref(0);

/** 当前筛选范围内MES侧报工人数，按工号去重。 */
const mesReportEmployeeCount = ref(0);

/** 批量工号录入弹窗显示状态。 */
const batchInputVisible = ref(false);

/** 页面查询条件，考勤时间默认留空，用户选择完整时间范围后才能执行查询。 */
const queryParams = reactive<AttendanceWorkDifferenceQuery & { dateRange: string[] }>({
  pageNum: 1,
  pageSize: 20,
  dateRange: [],
  employeeIdStr: undefined,
  employeeIdList: undefined
});

/** 日期范围选择器的默认首尾时刻，与报工成功员工报表保持一致。 */
const defaultAttendanceTime: [Date, Date] = [new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59, 999)];

/** 考勤时间必填校验规则；页面首次进入时保持为空且不执行查询。 */
const rules = {
  dateRange: [{ required: true, message: '请选择考勤时间范围', trigger: 'change' }]
};

/** 时间范围快捷选项，与报工成功员工报表保持一致。 */
const shortcuts = [
  {
    text: '今天',
    value: () => {
      const end = new Date();
      const start = new Date();
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

/**
 * 解析批量工号输入，支持中英文逗号、分号及空白字符，并自动去重。
 *
 * @returns 清洗后的员工工号集合
 */
const parseEmployeeIds = () => [
  ...new Set(
    (queryParams.employeeIdStr || '')
      .split(/[,;，；\s]+/)
      .map((item) => item.trim())
      .filter(Boolean)
  )
];

/**
 * 构造后端查询参数，并同步规范化后的批量工号字段。
 *
 * @returns 后端差异报表查询参数
 */
const buildQuery = (): AttendanceWorkDifferenceQuery => {
  const employeeIdList = parseEmployeeIds();
  queryParams.employeeIdList = employeeIdList.length ? employeeIdList : undefined;
  queryParams.employeeIdStr = employeeIdList.length ? employeeIdList.join(',') : undefined;
  return {
    pageNum: queryParams.pageNum,
    pageSize: queryParams.pageSize,
    beginTime: queryParams.dateRange?.[0],
    endTime: queryParams.dateRange?.[1],
    employeeIdList: queryParams.employeeIdList,
    employeeIdStr: queryParams.employeeIdStr
  };
};

/** 校验用户是否选择了完整且有效的开始、结束时间。 */
const validateDate = () => {
  if (queryParams.dateRange?.length === 2 && queryParams.dateRange[1] > queryParams.dateRange[0]) return true;
  proxy?.$modal.msgWarning('请选择有效的考勤时间范围');
  queryFormRef.value?.validateField('dateRange').catch(() => undefined);
  return false;
};

/**
 * 根据当前筛选条件加载一次完整数据。
 * 图表、主明细和时段明细共享本次结果，避免原来两个接口重复查询HR与MES数据库。
 */
const getChart = async () => {
  if (!validateDate()) return;
  loading.value = true;
  chartLoading.value = true;
  try {
    const res = await getAttendanceWorkDifferenceChart(buildQuery());
    chartRows.value = res.data?.rows || [];
    hrEmployeeCount.value = res.data?.hrEmployeeCount || 0;
    mesReportEmployeeCount.value = res.data?.mesReportEmployeeCount || 0;
  } finally {
    loading.value = false;
    chartLoading.value = false;
  }
};

/** 将小时数统一格式化为两位小数。 */
const formatHours = (value?: number) => Number(value || 0).toFixed(2);

/**
 * 将后端班次时间统一展示为HH:mm；没有排班时间时显示横线。
 *
 * @param value 后端返回的班次时间，通常格式为HH:mm:ss
 */
const formatShiftTime = (value?: string) => (value ? value.slice(0, 5) : '-');

/** 为正差异增加加号，便于区分报工超出和报工不足。 */
const signed = (value?: number) => `${Number(value || 0) > 0 ? '+' : ''}${formatHours(value)}`;

/** 根据差异正负返回对应的文本颜色样式。 */
const differenceClass = (value?: number) => (Number(value || 0) === 0 ? 'is-normal' : Number(value) < 0 ? 'is-danger' : 'is-warning');

/** 根据差异状态返回Element Plus标签类型。 */
const statusType = (status: AttendanceWorkDifferenceVO['differenceStatus']) => (status === '一致' ? 'success' : status === '报工不足' ? 'danger' : 'warning');

/** 执行新查询时回到第一页。 */
const handleQuery = async () => {
  queryParams.pageNum = 1;
  timeDifferencePageNum.value = 1;
  // 表格、图表和时段明细共享一次完整查询结果，分页仅控制当前渲染的数据量。
  await getChart();
};

/** 恢复空白查询条件并清除当前结果，重置操作不自动执行查询。 */
const resetQuery = () => {
  queryParams.pageNum = 1;
  queryParams.pageSize = 20;
  queryParams.dateRange = [];
  queryParams.employeeIdStr = undefined;
  queryParams.employeeIdList = undefined;
  timeDifferencePageNum.value = 1;
  chartRows.value = [];
  hrEmployeeCount.value = 0;
  mesReportEmployeeCount.value = 0;
};

/** 接收批量录入弹窗返回的工号，并立即执行查询。 */
const handleBatchConfirm = (values: string[]) => {
  queryParams.employeeIdStr = values.join(',');
  handleQuery();
};

/**
 * 按当前筛选条件导出多工作表Excel。
 * 后端会同时输出统计汇总、完整明细、工时差异、全部时段差异、MES无班次及三类时段差异明细。
 */
const handleExport = () => {
  if (!validateDate()) return;
  proxy?.download('wms/report/attendanceWorkDifference/export', buildQuery(), `HR员工考勤与报工差异_${Date.now()}.xlsx`);
};

/** 切换报表全屏状态。 */
const toggleFullscreen = async () => {
  const reportElement = reportFullscreenRef.value;
  if (!reportElement) return;
  if (!document.fullscreenElement) {
    await reportElement.requestFullscreen?.();
    return;
  }
  await document.exitFullscreen?.();
};

/** 计算指定元素的上下内外边距总和。 */
const getVerticalExtra = (element: HTMLElement | null, properties: Array<'paddingTop' | 'paddingBottom' | 'marginTop' | 'marginBottom'>) => {
  if (!element) return 0;
  const style = getComputedStyle(element);
  return properties.reduce((totalValue, property) => totalValue + (parseFloat(style[property]) || 0), 0);
};

/** 根据全屏卡片剩余空间计算明细表格高度。 */
const calcTableHeight = () => {
  if (!isFullscreen.value) {
    tableHeight.value = 'calc(100vh - 330px)';
    return;
  }
  const cardElement = reportCardRef.value?.$el as HTMLElement | undefined;
  if (!cardElement?.clientHeight) return;
  const headerElement = cardElement.querySelector('.el-card__header') as HTMLElement | null;
  const bodyElement = cardElement.querySelector('.el-card__body') as HTMLElement | null;
  const formElement = cardElement.querySelector('.el-form') as HTMLElement | null;
  const tabsHeaderElement = cardElement.querySelector('.el-tabs__header') as HTMLElement | null;
  const paginationElement = cardElement.querySelector('.pagination-container') as HTMLElement | null;
  const availableHeight = cardElement.clientHeight - (headerElement?.offsetHeight || 0) - getVerticalExtra(bodyElement, ['paddingTop', 'paddingBottom']) - (formElement?.offsetHeight || 0) - (tabsHeaderElement?.offsetHeight || 0) - getVerticalExtra(tabsHeaderElement, ['marginBottom']);
  const paginationHeight = paginationElement?.offsetHeight ? paginationElement.offsetHeight + getVerticalExtra(paginationElement, ['marginTop', 'marginBottom']) : 52;
  tableHeight.value = Math.max(Math.floor(availableHeight - paginationHeight), 220);
};

/** 全屏或Tab状态变化后重新布局表格和图表。 */
const relayoutReport = () => {
  nextTick(() => {
    calcTableHeight();
    requestAnimationFrame(() => chartsRef.value?.resizeCharts());
  });
};

/** 同步浏览器全屏状态，并触发布局刷新。 */
const handleFullscreenChange = () => {
  isFullscreen.value = document.fullscreenElement === reportFullscreenRef.value;
  relayoutReport();
};

/** 切回图表Tab时等待容器显示后重新计算ECharts尺寸。 */
watch(activeTab, (tabName) => {
  if (tabName === 'charts' || isFullscreen.value) relayoutReport();
});

/** 切换时段异常维度时回到第一页，避免原页码超过新维度总页数。 */
watch(timeDifferenceFilter, () => {
  timeDifferencePageNum.value = 1;
});

/** 页面首次进入时只注册布局事件，日期为空时不调用查询接口。 */
onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  window.addEventListener('resize', relayoutReport);
});

/** 页面销毁时移除全屏及窗口尺寸监听。 */
onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  window.removeEventListener('resize', relayoutReport);
});
</script>

<style scoped lang="scss">
.report-fullscreen-root.is-fullscreen {
  display: flex;
  flex-direction: column;
  height: 100%;
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

.attendance-report-card.is-fullscreen {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  border-radius: 0;
}

.attendance-report-card.is-fullscreen :deep(.el-card__header),
.attendance-report-card.is-fullscreen :deep(.el-form),
.attendance-report-card.is-fullscreen :deep(.el-tabs__header) {
  flex-shrink: 0;
}

.attendance-report-card.is-fullscreen :deep(.el-card__body),
.attendance-report-card.is-fullscreen :deep(.el-tabs),
.attendance-report-card.is-fullscreen :deep(.el-tabs__content),
.attendance-report-card.is-fullscreen :deep(.el-tab-pane) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.attendance-report-card.is-fullscreen :deep(.el-card__body) {
  overflow: visible;
}

.attendance-report-card.is-fullscreen :deep(.el-tabs),
.attendance-report-card.is-fullscreen :deep(.el-tabs__content),
.attendance-report-card.is-fullscreen :deep(.el-tab-pane) {
  overflow: hidden;
}

/* 全屏模式将Tab切换栏固定在内容顶部，图表区域独立滚动。 */
.attendance-report-card.is-fullscreen :deep(.el-tabs__header) {
  position: sticky;
  top: 0;
  z-index: 10;
  margin-bottom: 12px;
  background: var(--el-bg-color);
}

.attendance-report-card.is-fullscreen :deep(.attendance-difference-charts),
.attendance-report-card.is-fullscreen .detail-pane {
  flex: 1;
  height: 100%;
  min-height: 0;
}

.detail-pane {
  display: flex;
  flex-direction: column;
}

.is-normal {
  color: var(--el-color-success);
}
.is-danger {
  color: var(--el-color-danger);
  font-weight: 600;
}
.is-warning {
  color: var(--el-color-warning);
  font-weight: 600;
}
</style>
