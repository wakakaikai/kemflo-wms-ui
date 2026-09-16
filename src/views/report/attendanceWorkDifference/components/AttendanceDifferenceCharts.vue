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
      <div class="summary-item achievement">
        <span>考勤达成率</span><strong>{{ formatPercent(attendanceAchievementRate) }}</strong>
      </div>
      <div class="summary-item exception">
        <span>非直接报工工时</span><strong>{{ formatHours(nonDirectMesReportHours) }}</strong>
      </div>
      <div class="summary-item exception">
        <span>人员报工覆盖率</span><strong>{{ formatPercent(auditStats.employeeCoverageRate) }}</strong>
      </div>
      <div class="summary-item exception">
        <span>总异常工时</span><strong>{{ formatHours(effectiveShutdownDuration) }}</strong>
      </div>
      <div class="summary-item operation">
        <span>员工操作工时</span><strong>{{ formatHours(employeeOperationHours) }}</strong>
      </div>
      <div class="summary-item person-time">
        <span>员工时间</span><strong>{{ formatHours(personHours) }}</strong>
      </div>
      <div class="summary-item operation-exception">
        <span>操作-员工异常</span><strong>{{ signedHours(operationExceptionHours) }}</strong>
      </div>
      <div class="summary-item operation-exception">
        <span>操作异常占比</span><strong>{{ formatPercent(operationExceptionRate) }}</strong>
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

    <section class="chart-panel chart-panel--wide">
      <div class="chart-title">成本中心报工与考勤分析</div>
      <div ref="costCenterAttendanceRef" class="chart-box"></div>
    </section>

    <section class="chart-panel">
      <div class="chart-title">稽核异常构成</div>
      <div ref="auditIssueRef" class="chart-box"></div>
    </section>

    <section class="chart-panel">
      <div class="chart-title">工单类别异常工时占比</div>
      <div ref="workOrderCategoryAbnormalRef" class="chart-box"></div>
    </section>

    <section class="chart-panel">
      <div class="chart-title">每日稽核异常趋势</div>
      <div ref="dailyAuditRef" class="chart-box"></div>
    </section>

    <!-- 异常原因：按成功工单有效异常小时汇总前十名。 -->
    <section class="chart-panel">
      <div class="chart-title">异常原因 TOP10</div>
      <div ref="abnormalReasonRef" class="chart-box"></div>
    </section>

    <!-- 部门差异：按照员工当前部门汇总净差异工时，展示绝对差异最大的十个部门。 -->
    <section class="chart-panel">
      <div class="chart-title">部门差异 TOP10</div>
      <div ref="departmentDifferenceRef" class="chart-box"></div>
    </section>

    <!-- 员工差异：展示累计绝对差异最大的员工，便于HR直接核查个人考勤。 -->
    <section class="chart-panel">
      <div class="chart-title">员工稽核风险 TOP10</div>
      <div ref="employeeDifferenceRef" class="chart-box"></div>
    </section>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import type { AttendanceAbnormalTimeVO, AttendanceShopOrderAnalysisVO, AttendanceWorkDifferenceVO } from '@/api/report/attendanceWorkDifference/types';

/** 图表组件输入参数。 */
const props = defineProps<{
  /** 当前查询范围内的完整HR考勤差异数据。 */
  rows: AttendanceWorkDifferenceVO[];
  /** 成功工单异常时间明细。 */
  abnormalRows?: AttendanceAbnormalTimeVO[];
  /** 成功工单按日期及工单类型汇总的分析数据。 */
  shopOrderAnalysisRows?: AttendanceShopOrderAnalysisVO[];
  /** mes_shutdown_reason字典选项。 */
  shutdownReasonOptions?: Array<{ label?: string; value?: string }>;
  /** 当前查询范围内HR侧员工数，按工号去重。 */
  hrEmployeeCount?: number;
  /** 当前查询范围内MES侧报工人数，按工号去重。 */
  mesReportEmployeeCount?: number;
  /** 间接及办公室人员MES成功报工总工时。 */
  nonDirectMesReportHours?: number;
  /** 成功工单有效异常时长，后端单位为小时。 */
  effectiveShutdownDuration?: number;
  /** employee_operation_duration汇总，后端已转为小时。 */
  employeeOperationHours?: number;
  /** person_time汇总，后端已转为小时。 */
  personHours?: number;
  /** 员工操作时间减员工时间，单位为小时。 */
  operationExceptionHours?: number;
  /** 操作异常工时占员工操作工时的比例。 */
  operationExceptionRate?: number;
  /** 是否占满全屏Tab剩余高度。 */
  fillHeight?: boolean;
}>();

/** 稽核分析图表容器。 */
const hrCompositionRef = ref<HTMLDivElement>();
const attendanceCompareRef = ref<HTMLDivElement>();
const costCenterAttendanceRef = ref<HTMLDivElement>();
const auditIssueRef = ref<HTMLDivElement>();
const workOrderCategoryAbnormalRef = ref<HTMLDivElement>();
const dailyAuditRef = ref<HTMLDivElement>();
const departmentDifferenceRef = ref<HTMLDivElement>();
const abnormalReasonRef = ref<HTMLDivElement>();
const employeeDifferenceRef = ref<HTMLDivElement>();

/** ECharts实例，在组件销毁时统一释放。 */
let hrCompositionChart: echarts.ECharts | undefined;
let attendanceCompareChart: echarts.ECharts | undefined;
let costCenterAttendanceChart: echarts.ECharts | undefined;
let auditIssueChart: echarts.ECharts | undefined;
let workOrderCategoryAbnormalChart: echarts.ECharts | undefined;
let dailyAuditChart: echarts.ECharts | undefined;
let departmentDifferenceChart: echarts.ECharts | undefined;
let abnormalReasonChart: echarts.ECharts | undefined;
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

/** 将比例格式化为百分比。 */
const formatPercent = (value?: number) => `${Number(value || 0).toFixed(1)}%`;

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

/** 从稽核角度汇总覆盖率、差异暴露和待处理记录。 */
const auditStats = computed(() => {
  const hrEmployees = new Set<string>();
  const matchedEmployees = new Set<string>();
  props.rows.forEach((item) => {
    const hasHr = hours(item.scheduleHours) > 0 || hours(item.leaveHours) > 0 || hours(item.overtimeHours) > 0;
    const hasMes = Number(item.reportCount || 0) > 0;
    if (hasHr && item.employeeId) hrEmployees.add(item.employeeId);
    if (hasHr && hasMes && item.employeeId) matchedEmployees.add(item.employeeId);
  });
  return {
    employeeCoverageRate: hrEmployees.size ? (matchedEmployees.size * 100) / hrEmployees.size : 0
  };
});

/** 考勤达成率：MES报工工时占HR应计工时的比例。 */
const attendanceAchievementRate = computed(() =>
  summaryStats.value.attendanceHours > 0 ? (summaryStats.value.reportHours * 100) / summaryStats.value.attendanceHours : 0
);

/** 返回单条记录对应的稽核问题，多个问题可以同时存在。 */
const getAuditIssues = (item: AttendanceWorkDifferenceVO) => {
  const issues: string[] = [];
  const hasHr = hours(item.scheduleHours) > 0 || hours(item.leaveHours) > 0 || hours(item.overtimeHours) > 0;
  if (hasHr && Number(item.reportCount || 0) <= 0) issues.push('HR有考勤无MES报工');
  if (item.mesReportedWithoutSchedule) issues.push('MES报工无排班');
  if (hours(item.differenceHours) < 0) issues.push('报工不足');
  if (hours(item.differenceHours) > 0) issues.push('报工超出');
  if (Number(item.reportCount || 0) > 0 && item.timeRangeDifferent) issues.push('上下线时段差异');
  return issues;
};

/** 稽核问题类型分布。 */
const auditIssueRows = computed(() => {
  const counts = new Map<string, number>();
  props.rows.forEach((item) => getAuditIssues(item).forEach((issue) => counts.set(issue, (counts.get(issue) || 0) + 1)));
  return [...counts.entries()].map(([name, value]) => ({ name, value })).sort((left, right) => right.value - left.value);
});

/** 按日期统计主要稽核异常数量。 */
const dailyAuditRows = computed(() => {
  const rows = new Map<string, { date: string; shortage: number; excess: number; timeRange: number }>();
  props.rows.forEach((item) => {
    const row = rows.get(item.attendanceDate) || { date: item.attendanceDate, shortage: 0, excess: 0, timeRange: 0 };
    const issues = getAuditIssues(item);
    if (issues.includes('报工不足')) row.shortage += 1;
    if (issues.includes('报工超出')) row.excess += 1;
    if (issues.includes('上下线时段差异')) row.timeRange += 1;
    rows.set(item.attendanceDate, row);
  });
  return [...rows.values()].sort((left, right) => left.date.localeCompare(right.date));
});

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

/** 按CostCenter.Code汇总HR应计、MES报工及考勤达成率。 */
const costCenterAttendanceRows = computed(() => {
  const costCenterMap = new Map<
    string,
    {
      costCenterCode: string;
      costCenterName: string;
      attendanceHours: number;
      reportHours: number;
      differenceHours: number;
      achievementRate: number;
    }
  >();
  props.rows.forEach((item) => {
    const costCenterCode = item.costCenterCode || '未维护编码';
    const row = costCenterMap.get(costCenterCode) || {
      costCenterCode,
      costCenterName: item.costCenterName || '',
      attendanceHours: 0,
      reportHours: 0,
      differenceHours: 0,
      achievementRate: 0
    };
    row.attendanceHours += hours(item.attendanceHours);
    row.reportHours += hours(item.reportHours);
    row.differenceHours += hours(item.differenceHours);
    if (!row.costCenterName && item.costCenterName) row.costCenterName = item.costCenterName;
    costCenterMap.set(costCenterCode, row);
  });
  return [...costCenterMap.values()]
    .map((item) => ({
      ...item,
      achievementRate: item.attendanceHours > 0 ? (item.reportHours * 100) / item.attendanceHours : 0
    }))
    .sort((left, right) => Math.max(right.attendanceHours, right.reportHours) - Math.max(left.attendanceHours, left.reportHours));
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

/** 按mes_shutdown_reason字典名称累计有效异常小时，并选取前十名。 */
const abnormalReasonRows = computed(() => {
  const reasonMap = new Map<string, { reason: string; duration: number; count: number }>();
  const reasonLabels = new Map((props.shutdownReasonOptions || []).map((item) => [String(item.value || ''), item.label || item.value || '']));
  (props.abnormalRows || []).forEach((item) => {
    const reasonCode = item.shutdownReason || '';
    const reason = reasonLabels.get(reasonCode) || reasonCode || '未维护原因';
    const row = reasonMap.get(reason) || { reason, duration: 0, count: 0 };
    row.duration += Number(item.effectiveShutdownHours || 0);
    row.count += 1;
    reasonMap.set(reason, row);
  });
  return [...reasonMap.values()]
    .sort((left, right) => right.duration - left.duration)
    .slice(0, 10)
    .reverse();
});

/** 按员工累计净差异工时，并选取绝对差异最大的十名员工。 */
const employeeRows = computed(() => {
  const employeeMap = new Map<string, { employeeId: string; employeeName: string; differenceHours: number; issueCount: number }>();
  props.rows.forEach((item) => {
    const employeeId = item.employeeId || '未维护工号';
    const row = employeeMap.get(employeeId) || {
      employeeId,
      employeeName: item.employeeName || '',
      differenceHours: 0,
      issueCount: 0
    };
    row.differenceHours += hours(item.differenceHours);
    if (getAuditIssues(item).length) row.issueCount += 1;
    // 同一工号首次缺少姓名时，允许后续记录补充HR员工姓名。
    if (!row.employeeName && item.employeeName) row.employeeName = item.employeeName;
    employeeMap.set(employeeId, row);
  });
  return [...employeeMap.values()]
    .sort((left, right) => Math.abs(right.differenceHours) - Math.abs(left.differenceHours))
    .slice(0, 10)
    .reverse();
});

/** 按工单类别累计异常工时绝对值，用于观察各类别对总异常的贡献占比。 */
const workOrderCategoryAbnormalRows = computed(() => {
  const categoryMap = new Map<string, { name: string; value: number; reportCount: number }>();
  (props.shopOrderAnalysisRows || []).forEach((item) => {
    const type = item.workOrderType || 'OTHER';
    const name = item.workOrderTypeName || (type === 'OTHER' ? '普通工单' : type);
    const row = categoryMap.get(type) || { name: `${type} ${name}`, value: 0, reportCount: 0 };
    row.value += Math.abs(hours(item.operationExceptionHours));
    row.reportCount += Number(item.reportCount || 0);
    categoryMap.set(type, row);
  });
  return [...categoryMap.values()]
    .filter((item) => item.value > 0)
    .sort((left, right) => right.value - left.value);
});

/** 初始化尚未创建的ECharts实例。 */
const initCharts = () => {
  if (hrCompositionRef.value && !hrCompositionChart) hrCompositionChart = echarts.init(hrCompositionRef.value);
  if (attendanceCompareRef.value && !attendanceCompareChart) attendanceCompareChart = echarts.init(attendanceCompareRef.value);
  if (costCenterAttendanceRef.value && !costCenterAttendanceChart) costCenterAttendanceChart = echarts.init(costCenterAttendanceRef.value);
  if (auditIssueRef.value && !auditIssueChart) auditIssueChart = echarts.init(auditIssueRef.value);
  if (workOrderCategoryAbnormalRef.value && !workOrderCategoryAbnormalChart) workOrderCategoryAbnormalChart = echarts.init(workOrderCategoryAbnormalRef.value);
  if (dailyAuditRef.value && !dailyAuditChart) dailyAuditChart = echarts.init(dailyAuditRef.value);
  if (departmentDifferenceRef.value && !departmentDifferenceChart) departmentDifferenceChart = echarts.init(departmentDifferenceRef.value);
  if (abnormalReasonRef.value && !abnormalReasonChart) abnormalReasonChart = echarts.init(abnormalReasonRef.value);
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

/** 对比各成本中心的HR应计与MES报工工时，并叠加考勤达成率。 */
const renderCostCenterAttendance = () => {
  const rows = costCenterAttendanceRows.value;
  costCenterAttendanceChart?.setOption(
    {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any[]) => {
          const row = rows[params?.[0]?.dataIndex];
          if (!row) return '';
          const name = row.costCenterName ? `${row.costCenterCode} ${row.costCenterName}` : row.costCenterCode;
          return [
            name,
            `HR应计工时：${row.attendanceHours.toFixed(2)} 小时`,
            `MES报工工时：${row.reportHours.toFixed(2)} 小时`,
            `差异工时：${row.differenceHours.toFixed(2)} 小时`,
            `考勤达成率：${row.achievementRate.toFixed(2)}%`
          ].join('<br/>');
        }
      },
      legend: { top: 0, data: ['HR应计工时', 'MES报工工时', '考勤达成率'], textStyle: { color: colors.subText } },
      grid: { left: 24, right: 38, top: 52, bottom: rows.length > 10 ? 74 : 54, containLabel: true },
      graphic: emptyGraphic(!rows.length),
      xAxis: {
        type: 'category',
        data: rows.map((item) => (item.costCenterName ? `${item.costCenterCode} ${item.costCenterName}` : item.costCenterCode)),
        axisLabel: { color: colors.text, rotate: rows.length > 6 ? 28 : 0, width: 130, overflow: 'truncate' },
        axisTick: { alignWithLabel: true }
      },
      yAxis: [
        { type: 'value', name: '工时(h)', min: 0, splitLine: { lineStyle: { color: colors.split } }, axisLabel: { color: colors.subText } },
        { type: 'value', name: '达成率(%)', min: 0, splitLine: { show: false }, axisLabel: { color: colors.subText, formatter: '{value}%' } }
      ],
      dataZoom: rows.length > 10 ? [{ type: 'slider', height: 18, bottom: 4, start: 0, end: Math.min(100, (10 / rows.length) * 100) }] : [],
      series: [
        {
          name: 'HR应计工时',
          type: 'bar',
          barMaxWidth: 30,
          data: rows.map((item) => Number(item.attendanceHours.toFixed(2))),
          itemStyle: { color: colors.attendance }
        },
        {
          name: 'MES报工工时',
          type: 'bar',
          barMaxWidth: 30,
          data: rows.map((item) => Number(item.reportHours.toFixed(2))),
          itemStyle: { color: colors.report }
        },
        {
          name: '考勤达成率',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          symbolSize: 7,
          data: rows.map((item) => Number(item.achievementRate.toFixed(2))),
          itemStyle: { color: colors.normal },
          lineStyle: { width: 2 }
        }
      ]
    },
    true
  );
};

/** 渲染稽核问题类型分布，一条员工日期记录可命中多个问题。 */
const renderAuditIssue = () => {
  const rows = auditIssueRows.value;
  auditIssueChart?.setOption(
    {
      tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 条（{d}%）' },
      legend: { orient: 'vertical', right: 18, top: 'middle', textStyle: { color: colors.subText } },
      graphic: emptyGraphic(!rows.length),
      series: [
        {
          name: '稽核问题',
          type: 'pie',
          radius: ['42%', '68%'],
          center: ['38%', '52%'],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: '#fff', borderWidth: 2 },
          label: { formatter: '{b}\n{c}条', color: colors.text },
          data: rows
        }
      ]
    },
    true
  );
};

/** 参照稽核异常构成，以环形图展示各工单类别的异常工时占比。 */
const renderWorkOrderCategoryAbnormal = () => {
  const rows = workOrderCategoryAbnormalRows.value;
  workOrderCategoryAbnormalChart?.setOption(
    {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const row = rows[params?.dataIndex];
          if (!row) return '';
          return `${row.name}<br/>异常工时：${row.value.toFixed(2)} 小时<br/>占比：${Number(params.percent || 0).toFixed(2)}%<br/>报工记录：${row.reportCount} 条`;
        }
      },
      legend: {
        type: 'scroll',
        orient: 'vertical',
        right: 12,
        top: 24,
        bottom: 16,
        textStyle: { color: colors.subText },
        formatter: (name: string) => (name.length > 18 ? `${name.slice(0, 18)}...` : name)
      },
      graphic: emptyGraphic(!rows.length),
      series: [
        {
          name: '工单类别异常工时',
          type: 'pie',
          radius: ['42%', '68%'],
          center: ['36%', '52%'],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: '#fff', borderWidth: 2 },
          label: { formatter: '{b}\n{d}%', color: colors.text },
          labelLine: { length: 10, length2: 8 },
          data: rows
        }
      ]
    },
    true
  );
};

/** 渲染每日稽核异常数量趋势，便于识别异常集中日期。 */
const renderDailyAudit = () => {
  const rows = dailyAuditRows.value;
  dailyAuditChart?.setOption(
    {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { top: 0, textStyle: { color: colors.subText } },
      grid: { left: 18, right: 24, top: 48, bottom: 20, containLabel: true },
      graphic: emptyGraphic(!rows.length),
      xAxis: { type: 'category', data: rows.map((item) => item.date), axisLabel: { color: colors.subText, hideOverlap: true } },
      yAxis: { type: 'value', name: '条数', minInterval: 1, splitLine: { lineStyle: { color: colors.split } }, axisLabel: { color: colors.subText } },
      series: [
        { name: '报工不足', type: 'bar', stack: 'audit', data: rows.map((item) => item.shortage), itemStyle: { color: colors.shortage } },
        { name: '报工超出', type: 'bar', stack: 'audit', data: rows.map((item) => item.excess), itemStyle: { color: colors.excess } },
        { name: '时段差异', type: 'bar', stack: 'audit', data: rows.map((item) => item.timeRange), itemStyle: { color: '#0ea5e9' } }
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

/** 渲染有效异常时长最大的十个异常原因。 */
const renderAbnormalReason = () => {
  const rows = abnormalReasonRows.value;
  abnormalReasonChart?.setOption(
    {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (value: number) => `${Number(value || 0).toFixed(2)} 小时` },
      grid: { left: 20, right: 78, top: 18, bottom: 18, containLabel: true },
      graphic: emptyGraphic(!rows.length),
      xAxis: { type: 'value', name: '小时', min: 0, splitLine: { lineStyle: { color: colors.split } }, axisLabel: { color: colors.subText } },
      yAxis: {
        type: 'category',
        data: rows.map((item) => `${item.reason}（${item.count}条）`),
        axisLabel: { color: colors.text, width: 180, overflow: 'truncate' },
        axisTick: { show: false },
        axisLine: { show: false }
      },
      series: [
        {
          name: '有效异常时长',
          type: 'bar',
          barMaxWidth: 42,
          data: rows.map((item) => ({
            value: item.duration,
            itemStyle: { color: colors.overtime },
            label: { show: true, position: 'right', formatter: `${item.duration.toFixed(2)} h` }
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
        data: rows.map((item) => `${item.employeeId} ${item.employeeName || ''}（${item.issueCount}条）`),
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
  renderCostCenterAttendance();
  renderAuditIssue();
  renderWorkOrderCategoryAbnormal();
  renderDailyAudit();
  renderAbnormalReason();
  renderDepartmentDifference();
  renderEmployeeDifference();
  nextTick(resizeCharts);
};

/** 调整全部图表尺寸，供Tab切换及父页面主动调用。 */
const resizeCharts = () => {
  hrCompositionChart?.resize();
  attendanceCompareChart?.resize();
  costCenterAttendanceChart?.resize();
  auditIssueChart?.resize();
  workOrderCategoryAbnormalChart?.resize();
  dailyAuditChart?.resize();
  departmentDifferenceChart?.resize();
  abnormalReasonChart?.resize();
  employeeDifferenceChart?.resize();
};

defineExpose({ resizeCharts });

/** 完整图表数据变化后重新绘图。 */
watch([() => props.rows, () => props.abnormalRows, () => props.shopOrderAnalysisRows, () => props.shutdownReasonOptions], renderCharts, { deep: true });

onMounted(() => {
  nextTick(renderCharts);
  chartResizeObserver = new ResizeObserver(resizeCharts);
  if (hrCompositionRef.value) chartResizeObserver.observe(hrCompositionRef.value);
});

onBeforeUnmount(() => {
  chartResizeObserver?.disconnect();
  hrCompositionChart?.dispose();
  attendanceCompareChart?.dispose();
  costCenterAttendanceChart?.dispose();
  auditIssueChart?.dispose();
  workOrderCategoryAbnormalChart?.dispose();
  dailyAuditChart?.dispose();
  departmentDifferenceChart?.dispose();
  abnormalReasonChart?.dispose();
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
  grid-template-columns: repeat(8, minmax(0, 1fr));
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
.summary-item.achievement {
  --summary-color: #16a34a;
}
.summary-item.operation {
  --summary-color: #2563eb;
}
.summary-item.person-time {
  --summary-color: #14b8a6;
}
.summary-item.operation-exception {
  --summary-color: #b91c1c;
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

/* 全屏时汇总卡占固定高度，五行图表均分剩余空间。 */
.attendance-difference-charts.is-fill {
  height: 100%;
  min-height: 0;
  grid-template-rows: auto repeat(5, minmax(260px, 1fr));
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
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.chart-panel--wide {
  grid-column: 1 / -1;
}

@media (max-width: 700px) {
  .chart-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
