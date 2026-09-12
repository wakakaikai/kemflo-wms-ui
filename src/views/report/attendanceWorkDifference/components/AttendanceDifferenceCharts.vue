<template>
  <div class="attendance-difference-charts" :class="{ 'is-fill': fillHeight }">
    <!-- 汇总指标基于完整图表数据计算，不受明细分页影响。 -->
    <div class="chart-summary">
      <div class="summary-item hr-employee">
        <span>HR员工数</span><strong>{{ formatCount(hrEmployeeCount) }}</strong>
      </div>
      <div class="summary-item mes-employee">
        <span>MES报工人数</span><strong>{{ formatCount(mesReportEmployeeCount) }}</strong>
      </div>
      <div class="summary-item schedule">
        <span>排班工时</span><strong>{{ formatHours(summaryStats.scheduleHours) }}</strong>
      </div>
      <div class="summary-item leave">
        <span>请假工时</span><strong>{{ formatHours(summaryStats.leaveHours) }}</strong>
      </div>
      <div class="summary-item overtime">
        <span>加班工时</span><strong>{{ formatHours(summaryStats.overtimeHours) }}</strong>
      </div>
      <div class="summary-item attendance">
        <span>HR应计工时</span><strong>{{ formatHours(summaryStats.attendanceHours) }}</strong>
      </div>
      <div class="summary-item report">
        <span>MES报工工时</span><strong>{{ formatHours(summaryStats.reportHours) }}</strong>
      </div>
      <div class="summary-item difference">
        <span>净差异工时</span><strong>{{ signedHours(summaryStats.differenceHours) }}</strong>
      </div>
      <div class="summary-item exception">
        <span>MES报工无排班</span><strong>{{ summaryStats.noScheduleReportCount }} 条</strong>
      </div>
      <div class="summary-item exception">
        <span>平日时段差异</span><strong>{{ summaryStats.weekdayTimeDifferenceCount }} 条</strong>
      </div>
      <div class="summary-item exception">
        <span>假日时段差异</span><strong>{{ summaryStats.holidayTimeDifferenceCount }} 条</strong>
      </div>
      <div class="summary-item exception">
        <span>节日时段差异</span><strong>{{ summaryStats.festivalTimeDifferenceCount }} 条</strong>
      </div>
    </div>

    <!-- HR工时构成：便于观察排班、请假、加班对应计工时的影响。 -->
    <section class="chart-panel">
      <div class="chart-title">HR每日工时构成</div>
      <div ref="hrCompositionRef" class="chart-box"></div>
    </section>

    <!-- 对账趋势：直接对比HR应计工时和MES实际报工工时。 -->
    <section class="chart-panel">
      <div class="chart-title">HR应计与MES报工趋势</div>
      <div ref="attendanceCompareRef" class="chart-box"></div>
    </section>

    <!-- 部门差异：按照员工当前部门汇总净差异工时，展示绝对差异最大的十个部门。 -->
    <section class="chart-panel">
      <div class="chart-title">部门差异 TOP10</div>
      <div ref="departmentDifferenceRef" class="chart-box"></div>
    </section>

    <!-- 成本中心差异：按照HR CostCenter.Code分组，帮助HR定位差异集中区域。 -->
    <section class="chart-panel">
      <div class="chart-title">成本中心差异分析 TOP10</div>
      <div ref="costCenterDifferenceRef" class="chart-box"></div>
    </section>

    <!-- 加班时段差异员工：按HR加班范围与MES刷卡范围的累计偏差分钟排行。 -->
    <section class="chart-panel">
      <div class="chart-title">加班时间范围与MES刷卡差异 TOP10员工</div>
      <div ref="overtimeTimeEmployeeRef" class="chart-box"></div>
    </section>

    <!-- 员工差异：展示累计绝对差异最大的员工，便于HR直接核查个人考勤。 -->
    <section class="chart-panel">
      <div class="chart-title">员工差异 TOP10</div>
      <div ref="employeeDifferenceRef" class="chart-box"></div>
    </section>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import type { AttendanceWorkDifferenceVO } from '@/api/report/attendanceWorkDifference/types';

/** 图表组件输入参数。 */
const props = defineProps<{
  /** 当前查询范围内的完整HR考勤差异数据。 */
  rows: AttendanceWorkDifferenceVO[];
  /** 当前查询范围内HR侧员工数，按工号去重。 */
  hrEmployeeCount?: number;
  /** 当前查询范围内MES侧报工人数，按工号去重。 */
  mesReportEmployeeCount?: number;
  /** 是否占满全屏Tab剩余高度。 */
  fillHeight?: boolean;
}>();

/** 六个HR分析图表容器。 */
const hrCompositionRef = ref<HTMLDivElement>();
const attendanceCompareRef = ref<HTMLDivElement>();
const departmentDifferenceRef = ref<HTMLDivElement>();
const costCenterDifferenceRef = ref<HTMLDivElement>();
const overtimeTimeEmployeeRef = ref<HTMLDivElement>();
const employeeDifferenceRef = ref<HTMLDivElement>();

/** 六个ECharts实例，在组件销毁时统一释放。 */
let hrCompositionChart: echarts.ECharts | undefined;
let attendanceCompareChart: echarts.ECharts | undefined;
let departmentDifferenceChart: echarts.ECharts | undefined;
let costCenterDifferenceChart: echarts.ECharts | undefined;
let overtimeTimeEmployeeChart: echarts.ECharts | undefined;
let employeeDifferenceChart: echarts.ECharts | undefined;

/** 图表容器尺寸监听器，处理Tab切换和页面宽度变化。 */
let chartResizeObserver: ResizeObserver | undefined;

/** HR报表使用的统一颜色。 */
const colors = {
  schedule: '#3b82f6',
  leave: '#f59e0b',
  overtime: '#8b5cf6',
  attendance: '#0f766e',
  report: '#06b6d4',
  shortage: '#ef4444',
  excess: '#f97316',
  normal: '#22c55e',
  text: '#334155',
  subText: '#64748b',
  split: '#e2e8f0'
};

/** 将接口数值安全转换为小时数。 */
const hours = (value?: number) => Number(value || 0);

/** 将图表小时数格式化为两位小数。 */
const formatHours = (value?: number) => `${hours(value).toFixed(2)} h`;

/** 将人数指标格式化为整数。 */
const formatCount = (value?: number) => `${Number(value || 0)} 人`;

/** 为正差异增加加号，突出MES报工超出HR应计的情况。 */
const signedHours = (value?: number) => `${hours(value) > 0 ? '+' : ''}${formatHours(value)}`;

/** 汇总完整查询范围内的HR及MES核心工时指标。 */
const summaryStats = computed(() =>
  props.rows.reduce(
    (summary, item) => {
      summary.scheduleHours += hours(item.scheduleHours);
      summary.leaveHours += hours(item.leaveHours);
      summary.overtimeHours += hours(item.overtimeHours);
      summary.attendanceHours += hours(item.attendanceHours);
      summary.reportHours += hours(item.reportHours);
      summary.differenceHours += hours(item.differenceHours);
      if (item.mesReportedWithoutSchedule) summary.noScheduleReportCount += 1;
      // 时段差异只统计存在MES成功报工的员工日期，避免将单纯未报工混入刷卡范围异常。
      if (item.reportCount > 0 && item.timeRangeDifferent) {
        if (item.timeRangeCategory === '假日加班') summary.holidayTimeDifferenceCount += 1;
        else if (item.timeRangeCategory === '节日加班') summary.festivalTimeDifferenceCount += 1;
        else summary.weekdayTimeDifferenceCount += 1;
      }
      return summary;
    },
    {
      scheduleHours: 0,
      leaveHours: 0,
      overtimeHours: 0,
      attendanceHours: 0,
      reportHours: 0,
      differenceHours: 0,
      noScheduleReportCount: 0,
      weekdayTimeDifferenceCount: 0,
      holidayTimeDifferenceCount: 0,
      festivalTimeDifferenceCount: 0
    }
  )
);

/** 图表无数据时显示的居中提示。 */
const emptyGraphic = (show: boolean) => ({
  type: 'text',
  left: 'center',
  top: 'middle',
  silent: true,
  invisible: !show,
  style: { text: '暂无图表数据', fill: '#94a3b8', fontSize: 14 }
});

/**
 * 根据差异值计算横轴范围，并在正负两端预留标签空间。
 * 解决全为负数时标签集中在右侧零刻度并被图表容器裁切的问题。
 */
const differenceAxisRange = (values: number[]) => {
  if (!values.length) return {};
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(0, ...values);
  const span = Math.max(maxValue - minValue, 1);
  return {
    min: Number((minValue - span * 0.16).toFixed(2)),
    max: Number((maxValue + span * 0.16).toFixed(2))
  };
};

/**
 * 构造带方向标签的差异柱数据。
 * 负差异标签放在柱体左侧，正差异标签放在柱体右侧。
 */
const differenceBarData = (values: number[]) =>
  values.map((differenceHours) => {
    const value = Number(differenceHours.toFixed(2));
    return {
      value,
      itemStyle: { color: differenceHours < 0 ? colors.shortage : colors.excess },
      label: {
        show: true,
        position: differenceHours < 0 ? 'left' : 'right',
        formatter: `${value.toFixed(2)} h`
      }
    };
  });

/** 按日期汇总HR工时构成、MES报工和差异。 */
const dailyRows = computed(() => {
  const dailyMap = new Map<
    string,
    {
      date: string;
      scheduleHours: number;
      leaveHours: number;
      overtimeHours: number;
      attendanceHours: number;
      reportHours: number;
      differenceHours: number;
    }
  >();
  props.rows.forEach((item) => {
    const row = dailyMap.get(item.attendanceDate) || {
      date: item.attendanceDate,
      scheduleHours: 0,
      leaveHours: 0,
      overtimeHours: 0,
      attendanceHours: 0,
      reportHours: 0,
      differenceHours: 0
    };
    row.scheduleHours += hours(item.scheduleHours);
    row.leaveHours += hours(item.leaveHours);
    row.overtimeHours += hours(item.overtimeHours);
    row.attendanceHours += hours(item.attendanceHours);
    row.reportHours += hours(item.reportHours);
    row.differenceHours += hours(item.differenceHours);
    dailyMap.set(item.attendanceDate, row);
  });
  return [...dailyMap.values()].sort((left, right) => left.date.localeCompare(right.date));
});

/** 按CostCenter.Code累计差异工时，并选取绝对差异最大的十个成本中心。 */
const costCenterRows = computed(() => {
  const costCenterMap = new Map<string, { costCenterCode: string; costCenterName: string; differenceHours: number }>();
  props.rows.forEach((item) => {
    // 编码是分组依据；缺少编码的数据统一归入“未维护编码”。
    const costCenterCode = item.costCenterCode || '未维护编码';
    const row = costCenterMap.get(costCenterCode) || {
      costCenterCode,
      costCenterName: item.costCenterName || '',
      differenceHours: 0
    };
    row.differenceHours += hours(item.differenceHours);
    // 同一编码首次没有描述时，允许后续记录补充成本中心描述。
    if (!row.costCenterName && item.costCenterName) row.costCenterName = item.costCenterName;
    costCenterMap.set(costCenterCode, row);
  });
  return [...costCenterMap.values()]
    .sort((left, right) => Math.abs(right.differenceHours) - Math.abs(left.differenceHours))
    .slice(0, 10)
    .reverse();
});

/** 按当前部门名称累计净差异工时，并选取绝对差异最大的十个部门。 */
const departmentRows = computed(() => {
  const departmentMap = new Map<string, number>();
  props.rows.forEach((item) => {
    // 未维护部门的员工统一归组，避免工时在图表统计中丢失。
    const departmentName = item.departmentName || '未维护部门';
    departmentMap.set(departmentName, (departmentMap.get(departmentName) || 0) + hours(item.differenceHours));
  });
  return [...departmentMap.entries()]
    .map(([departmentName, differenceHours]) => ({ departmentName, differenceHours }))
    .sort((left, right) => Math.abs(right.differenceHours) - Math.abs(left.differenceHours))
    .slice(0, 10)
    .reverse();
});

/**
 * 按员工累计“HR加班时间范围与MES刷卡范围”的绝对偏差分钟，并选取前十名。
 * 排名值=|开始时间差|+|结束时间差|；多天异常继续累加，避免正负偏差互相抵消。
 */
const overtimeTimeEmployeeRows = computed(() => {
  const employeeMap = new Map<string, { employeeId: string; employeeName: string; differenceMinutes: number; abnormalDays: number }>();
  props.rows.forEach((item) => {
    // 只分析有HR加班、有MES成功报工且能够计算起止时间差的员工日期。
    if (hours(item.overtimeHours) <= 0 || item.reportCount <= 0 || !item.timeRangeDifferent) return;
    if (item.beginDifferenceMinutes == null && item.endDifferenceMinutes == null) return;
    const employeeId = item.employeeId || '未维护工号';
    const row = employeeMap.get(employeeId) || {
      employeeId,
      employeeName: item.employeeName || '',
      differenceMinutes: 0,
      abnormalDays: 0
    };
    row.differenceMinutes += Math.abs(Number(item.beginDifferenceMinutes || 0)) + Math.abs(Number(item.endDifferenceMinutes || 0));
    row.abnormalDays += 1;
    if (!row.employeeName && item.employeeName) row.employeeName = item.employeeName;
    employeeMap.set(employeeId, row);
  });
  return [...employeeMap.values()]
    .sort((left, right) => right.differenceMinutes - left.differenceMinutes)
    .slice(0, 10)
    .reverse();
});

/** 按员工累计净差异工时，并选取绝对差异最大的十名员工。 */
const employeeRows = computed(() => {
  const employeeMap = new Map<string, { employeeId: string; employeeName: string; differenceHours: number }>();
  props.rows.forEach((item) => {
    const employeeId = item.employeeId || '未维护工号';
    const row = employeeMap.get(employeeId) || {
      employeeId,
      employeeName: item.employeeName || '',
      differenceHours: 0
    };
    row.differenceHours += hours(item.differenceHours);
    // 同一工号首次缺少姓名时，允许后续记录补充HR员工姓名。
    if (!row.employeeName && item.employeeName) row.employeeName = item.employeeName;
    employeeMap.set(employeeId, row);
  });
  return [...employeeMap.values()]
    .sort((left, right) => Math.abs(right.differenceHours) - Math.abs(left.differenceHours))
    .slice(0, 10)
    .reverse();
});

/** 初始化尚未创建的ECharts实例。 */
const initCharts = () => {
  if (hrCompositionRef.value && !hrCompositionChart) hrCompositionChart = echarts.init(hrCompositionRef.value);
  if (attendanceCompareRef.value && !attendanceCompareChart) attendanceCompareChart = echarts.init(attendanceCompareRef.value);
  if (departmentDifferenceRef.value && !departmentDifferenceChart) departmentDifferenceChart = echarts.init(departmentDifferenceRef.value);
  if (costCenterDifferenceRef.value && !costCenterDifferenceChart) costCenterDifferenceChart = echarts.init(costCenterDifferenceRef.value);
  if (overtimeTimeEmployeeRef.value && !overtimeTimeEmployeeChart) overtimeTimeEmployeeChart = echarts.init(overtimeTimeEmployeeRef.value);
  if (employeeDifferenceRef.value && !employeeDifferenceChart) employeeDifferenceChart = echarts.init(employeeDifferenceRef.value);
};

/** 渲染每日HR工时构成图。 */
const renderHrComposition = () => {
  const rows = dailyRows.value;
  hrCompositionChart?.setOption(
    {
      tooltip: { trigger: 'axis', valueFormatter: formatHours },
      legend: { top: 0, textStyle: { color: colors.subText } },
      grid: { left: 18, right: 24, top: 48, bottom: 20, containLabel: true },
      graphic: emptyGraphic(!rows.length),
      xAxis: { type: 'category', data: rows.map((item) => item.date), axisLabel: { color: colors.subText, hideOverlap: true } },
      yAxis: { type: 'value', name: '小时', splitLine: { lineStyle: { color: colors.split } }, axisLabel: { color: colors.subText } },
      series: [
        { name: '排班', type: 'bar', data: rows.map((item) => item.scheduleHours), itemStyle: { color: colors.schedule } },
        { name: '请假', type: 'bar', data: rows.map((item) => item.leaveHours), itemStyle: { color: colors.leave } },
        { name: '加班', type: 'bar', data: rows.map((item) => item.overtimeHours), itemStyle: { color: colors.overtime } },
        { name: 'HR应计', type: 'line', smooth: true, data: rows.map((item) => item.attendanceHours), itemStyle: { color: colors.attendance }, lineStyle: { width: 3 } }
      ]
    },
    true
  );
};

/** 渲染HR应计工时与MES报工工时对账趋势。 */
const renderAttendanceCompare = () => {
  const rows = dailyRows.value;
  attendanceCompareChart?.setOption(
    {
      tooltip: { trigger: 'axis', valueFormatter: formatHours },
      legend: { top: 0, textStyle: { color: colors.subText } },
      grid: { left: 18, right: 24, top: 48, bottom: 20, containLabel: true },
      graphic: emptyGraphic(!rows.length),
      xAxis: { type: 'category', data: rows.map((item) => item.date), axisLabel: { color: colors.subText, hideOverlap: true } },
      yAxis: { type: 'value', name: '小时', splitLine: { lineStyle: { color: colors.split } }, axisLabel: { color: colors.subText } },
      series: [
        { name: 'HR应计', type: 'bar', data: rows.map((item) => item.attendanceHours), itemStyle: { color: colors.attendance } },
        { name: 'MES报工', type: 'bar', data: rows.map((item) => item.reportHours), itemStyle: { color: colors.report } },
        { name: '差异', type: 'line', smooth: true, data: rows.map((item) => item.differenceHours), itemStyle: { color: colors.shortage }, lineStyle: { width: 2 } }
      ]
    },
    true
  );
};

/** 渲染按员工当前部门分组的累计净差异工时排行。 */
const renderDepartmentDifference = () => {
  const rows = departmentRows.value;
  const differenceValues = rows.map((item) => item.differenceHours);
  departmentDifferenceChart?.setOption(
    {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: formatHours },
      grid: { left: 20, right: 54, top: 18, bottom: 18, containLabel: true },
      graphic: emptyGraphic(!rows.length),
      xAxis: { type: 'value', ...differenceAxisRange(differenceValues), splitLine: { lineStyle: { color: colors.split } }, axisLabel: { color: colors.subText } },
      yAxis: {
        type: 'category',
        data: rows.map((item) => item.departmentName),
        axisLabel: { color: colors.text, width: 180, overflow: 'truncate' },
        axisTick: { show: false },
        axisLine: { show: false }
      },
      series: [
        {
          name: '差异工时',
          type: 'bar',
          data: differenceBarData(differenceValues)
        }
      ]
    },
    true
  );
};

/** 渲染按CostCenter.Code分组的累计差异工时横向排行。 */
const renderCostCenterDifference = () => {
  const rows = costCenterRows.value;
  const differenceValues = rows.map((item) => item.differenceHours);
  costCenterDifferenceChart?.setOption(
    {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: formatHours },
      grid: { left: 20, right: 54, top: 18, bottom: 18, containLabel: true },
      graphic: emptyGraphic(!rows.length),
      xAxis: { type: 'value', ...differenceAxisRange(differenceValues), splitLine: { lineStyle: { color: colors.split } }, axisLabel: { color: colors.subText } },
      yAxis: {
        type: 'category',
        data: rows.map((item) => (item.costCenterName ? `${item.costCenterCode} ${item.costCenterName}` : item.costCenterCode)),
        axisLabel: { color: colors.text, width: 180, overflow: 'truncate' },
        axisTick: { show: false },
        axisLine: { show: false }
      },
      series: [
        {
          name: '差异工时',
          type: 'bar',
          data: differenceBarData(differenceValues)
        }
      ]
    },
    true
  );
};

/** 渲染加班时间范围与MES刷卡范围累计偏差最大的十名员工。 */
const renderOvertimeTimeEmployee = () => {
  const rows = overtimeTimeEmployeeRows.value;
  overtimeTimeEmployeeChart?.setOption(
    {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (value: number) => `${Number(value || 0).toFixed(0)} 分钟` },
      grid: { left: 20, right: 78, top: 18, bottom: 18, containLabel: true },
      graphic: emptyGraphic(!rows.length),
      xAxis: { type: 'value', name: '分钟', min: 0, splitLine: { lineStyle: { color: colors.split } }, axisLabel: { color: colors.subText } },
      yAxis: {
        type: 'category',
        data: rows.map((item) => `${item.employeeId} ${item.employeeName || ''}（${item.abnormalDays}天）`),
        axisLabel: { color: colors.text, width: 180, overflow: 'truncate' },
        axisTick: { show: false },
        axisLine: { show: false }
      },
      series: [
        {
          name: '累计时段偏差',
          type: 'bar',
          barMaxWidth: 42,
          data: rows.map((item) => ({
            value: item.differenceMinutes,
            itemStyle: { color: colors.overtime },
            label: { show: true, position: 'right', formatter: `${item.differenceMinutes.toFixed(0)} 分` }
          }))
        }
      ]
    },
    true
  );
};

/** 渲染按HR员工分组的累计净差异工时排行。 */
const renderEmployeeDifference = () => {
  const rows = employeeRows.value;
  const differenceValues = rows.map((item) => item.differenceHours);
  employeeDifferenceChart?.setOption(
    {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: formatHours },
      grid: { left: 20, right: 38, top: 18, bottom: 18, containLabel: true },
      graphic: emptyGraphic(!rows.length),
      xAxis: { type: 'value', ...differenceAxisRange(differenceValues), splitLine: { lineStyle: { color: colors.split } }, axisLabel: { color: colors.subText } },
      yAxis: {
        type: 'category',
        data: rows.map((item) => (item.employeeName ? `${item.employeeId} ${item.employeeName}` : item.employeeId)),
        axisLabel: { color: colors.text, width: 180, overflow: 'truncate' },
        axisTick: { show: false },
        axisLine: { show: false }
      },
      series: [
        {
          name: '差异工时',
          type: 'bar',
          data: differenceBarData(differenceValues)
        }
      ]
    },
    true
  );
};

/** 根据最新数据重新渲染全部HR分析图表。 */
const renderCharts = () => {
  initCharts();
  renderHrComposition();
  renderAttendanceCompare();
  renderDepartmentDifference();
  renderCostCenterDifference();
  renderOvertimeTimeEmployee();
  renderEmployeeDifference();
  nextTick(resizeCharts);
};

/** 调整全部图表尺寸，供Tab切换及父页面主动调用。 */
const resizeCharts = () => {
  hrCompositionChart?.resize();
  attendanceCompareChart?.resize();
  departmentDifferenceChart?.resize();
  costCenterDifferenceChart?.resize();
  overtimeTimeEmployeeChart?.resize();
  employeeDifferenceChart?.resize();
};

defineExpose({ resizeCharts });

/** 完整图表数据变化后重新绘图。 */
watch(() => props.rows, renderCharts, { deep: true });

onMounted(() => {
  nextTick(renderCharts);
  chartResizeObserver = new ResizeObserver(resizeCharts);
  if (hrCompositionRef.value) chartResizeObserver.observe(hrCompositionRef.value);
});

onBeforeUnmount(() => {
  chartResizeObserver?.disconnect();
  hrCompositionChart?.dispose();
  attendanceCompareChart?.dispose();
  departmentDifferenceChart?.dispose();
  costCenterDifferenceChart?.dispose();
  overtimeTimeEmployeeChart?.dispose();
  employeeDifferenceChart?.dispose();
});
</script>

<style scoped lang="scss">
.attendance-difference-charts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.chart-summary {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

.summary-item {
  position: relative;
  min-width: 0;
  padding: 11px 14px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-bg-color);
}

.summary-item::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 3px;
  background: var(--summary-color, #94a3b8);
  content: '';
}

.summary-item span {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.summary-item strong {
  display: block;
  margin-top: 5px;
  overflow: hidden;
  color: var(--summary-color, var(--el-text-color-primary));
  font-size: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-item.schedule {
  --summary-color: #3b82f6;
}
.summary-item.hr-employee {
  --summary-color: #14b8a6;
}
.summary-item.mes-employee {
  --summary-color: #0ea5e9;
}
.summary-item.leave {
  --summary-color: #f59e0b;
}
.summary-item.overtime {
  --summary-color: #8b5cf6;
}
.summary-item.attendance {
  --summary-color: #0f766e;
}
.summary-item.report {
  --summary-color: #06b6d4;
}
.summary-item.difference {
  --summary-color: #ef4444;
}
.summary-item.exception {
  --summary-color: #dc2626;
}

.chart-panel {
  min-width: 0;
  padding: 14px 16px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-bg-color);
}

.chart-title {
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
}

.chart-box {
  width: 100%;
  height: clamp(300px, 32vh, 410px);
}

/* 全屏时汇总卡占固定高度，四张图表均分剩余空间。 */
.attendance-difference-charts.is-fill {
  height: 100%;
  min-height: 0;
  grid-template-rows: auto repeat(3, minmax(260px, 1fr));
  overflow-y: auto;
}

.attendance-difference-charts.is-fill .chart-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.attendance-difference-charts.is-fill .chart-box {
  flex: 1;
  height: auto;
  min-height: 0;
}

@media (max-width: 1100px) {
  .attendance-difference-charts {
    grid-template-columns: 1fr;
  }

  .chart-summary {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
