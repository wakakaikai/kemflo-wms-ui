<template>
  <div class="chart-summary">
    <div class="summary-item primary">
      <span>总出勤</span>
      <strong>{{ formatDisplayDuration(totalStats.totalDuration) }}</strong>
    </div>
    <div class="summary-item operation">
      <span>总操作</span>
      <strong>{{ formatDisplayDuration(totalStats.operationDuration) }}</strong>
    </div>
    <div class="summary-item effective">
      <span>有效时长</span>
      <strong>{{ formatDisplayDuration(totalStats.effectiveDuration) }}</strong>
    </div>
    <div class="summary-item warning">
      <span>重复上线</span>
      <strong>{{ formatDisplayDuration(totalStats.duplicateDuration) }}</strong>
    </div>
    <div class="summary-item">
      <span>员工数</span>
      <strong>{{ totalStats.employeeCount }}</strong>
    </div>
  </div>

  <div class="chart-grid">
    <div class="chart-panel">
      <div class="chart-title">
        <span>个人每日出勤趋势</span>
        <small>{{ props.employeeId ? `工号 ${props.employeeId}` : '自动展示出勤最高员工' }}</small>
      </div>
      <div class="trend-employee">{{ trendEmployeeLabel }}</div>
      <div ref="employeeTrendRef" class="chart-box"></div>
    </div>
    <div class="chart-panel">
      <div class="chart-title">
        <span>员工累计操作时长 TOP10</span>
        <small>按总操作{{ unitLabel }}排序</small>
      </div>
      <div ref="employeeTopRef" class="chart-box"></div>
    </div>
    <div class="chart-panel">
      <div class="chart-title">
        <span>重复上线 TOP10</span>
        <small>按重复上线{{ unitLabel }}排序</small>
      </div>
      <div ref="duplicateTopRef" class="chart-box"></div>
    </div>
    <div class="chart-panel">
      <div class="chart-title">
        <span>每日操作与重复趋势</span>
        <small>操作与异常对比</small>
      </div>
      <div ref="dailyCompareRef" class="chart-box"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import type { ShopOrderReportEmployeeDurationDuplicateVO, ShopOrderReportEmployeeDurationSummaryVO } from '@/api/mes/shopOrderReport/types';

const props = defineProps<{
  summaryList: ShopOrderReportEmployeeDurationSummaryVO[];
  duplicateList: ShopOrderReportEmployeeDurationDuplicateVO[];
  employeeId?: string;
  displayUnit?: 'hour' | 'minute';
}>();

type SummaryDisplayRow = Omit<ShopOrderReportEmployeeDurationSummaryVO, 'totalDuration' | 'operationDuration' | 'effectiveDuration' | 'distinctDuration' | 'duplicateDuration'> & {
  totalDuration: number;
  operationDuration: number;
  effectiveDuration: number;
  distinctDuration: number;
  duplicateDuration: number;
};

type DuplicateDisplayRow = Omit<ShopOrderReportEmployeeDurationDuplicateVO, 'duplicateDuration'> & {
  duplicateDuration: number;
};

const employeeTrendRef = ref<HTMLDivElement>();
const employeeTopRef = ref<HTMLDivElement>();
const duplicateTopRef = ref<HTMLDivElement>();
const dailyCompareRef = ref<HTMLDivElement>();

let employeeTrendChart: echarts.ECharts | undefined;
let employeeTopChart: echarts.ECharts | undefined;
let duplicateTopChart: echarts.ECharts | undefined;
let dailyCompareChart: echarts.ECharts | undefined;

const palette = {
  blue: '#2563eb',
  cyan: '#0f766e',
  green: '#15803d',
  orange: '#ea580c',
  amber: '#f59e0b',
  red: '#e11d48',
  indigo: '#1d4ed8',
  text: '#111827',
  subText: '#6b7280',
  muted: '#9ca3af',
  border: '#e5e7eb',
  split: '#f1f5f9'
};

const commonTooltip = {
  trigger: 'axis',
  confine: true,
  backgroundColor: '#ffffff',
  borderColor: '#e5e7eb',
  borderWidth: 1,
  padding: [8, 10],
  textStyle: {
    color: palette.text,
    fontSize: 12
  },
  extraCssText: 'box-shadow:0 10px 24px rgba(15,23,42,.12);border-radius:6px;',
  axisPointer: {
    type: 'line',
    lineStyle: {
      color: '#cbd5e1',
      width: 1
    }
  },
  valueFormatter: (value: number) => formatDurationByDisplayValue(value)
};

const commonGrid = { left: 18, right: 44, top: 54, bottom: 22, containLabel: true };

const categoryAxis = (data: string[], rotate = 0) => ({
  type: 'category',
  data,
  boundaryGap: true,
  axisTick: { show: false },
  axisLine: { lineStyle: { color: palette.border } },
  axisLabel: { color: palette.subText, rotate, hideOverlap: true, margin: 12 }
});

const valueAxis = () => ({
  type: 'value',
  splitNumber: 4,
  splitLine: { lineStyle: { color: palette.split } },
  axisLabel: { color: palette.subText, formatter: (value: number) => compactDurationByDisplayValue(value) },
  axisLine: { show: false },
  axisTick: { show: false }
});

const emptyGraphic = (show: boolean) => ({
  type: 'text',
  left: 'center',
  top: 'middle',
  silent: true,
  invisible: !show,
  style: {
    text: '暂无图表数据',
    fill: palette.muted,
    fontSize: 13
  }
});

const lineSeries = (name: string, data: number[], color: string) => ({
  name,
  type: 'line',
  smooth: true,
  symbol: 'emptyCircle',
  symbolSize: 7,
  showSymbol: true,
  lineStyle: { width: 2.5, color },
  itemStyle: { color, borderColor: color, borderWidth: 2 },
  emphasis: { focus: 'series' },
  markLine: {
    symbol: 'none',
    label: {
      position: 'end',
      color,
      padding: [0, 2],
      formatter: ({ value }: { value: number }) => compactDurationByDisplayValue(value)
    },
    lineStyle: {
      color,
      type: 'dashed',
      width: 1
    },
    data: [{ type: 'average', name: `${name}平均` }]
  },
  data
});

const barSeries = (name: string, data: number[], color: string) => ({
  name,
  type: 'bar',
  barWidth: 12,
  barMaxWidth: 18,
  label: {
    show: true,
    position: 'right',
    color: palette.subText,
    fontSize: 11,
    formatter: ({ value }: { value: number }) => compactDurationByDisplayValue(value)
  },
  itemStyle: {
    borderRadius: [3, 3, 3, 3],
    color
  },
  emphasis: { focus: 'series' },
  data
});

const displaySummaryList = computed<SummaryDisplayRow[]>(() =>
  props.summaryList.map((item) => ({
    ...item,
    totalDuration: toDisplayValue(item.totalDuration),
    operationDuration: toDisplayValue(item.operationDuration),
    effectiveDuration: toDisplayValue(item.effectiveDuration),
    distinctDuration: toDisplayValue(item.distinctDuration),
    duplicateDuration: toDisplayValue(item.duplicateDuration)
  }))
);

const displayDuplicateList = computed<DuplicateDisplayRow[]>(() =>
  props.duplicateList.map((item) => ({
    ...item,
    duplicateDuration: toDisplayValue(item.duplicateDuration)
  }))
);

const totalStats = computed(() => {
  const employeeSet = new Set<string>();
  return displaySummaryList.value.reduce(
    (stats, item) => {
      employeeSet.add(item.employeeId);
      stats.totalDuration += Number(item.totalDuration || 0);
      stats.operationDuration += Number(item.operationDuration || 0);
      stats.effectiveDuration += Number(item.effectiveDuration || 0);
      stats.duplicateDuration += Number(item.duplicateDuration || 0);
      stats.employeeCount = employeeSet.size;
      return stats;
    },
    { totalDuration: 0, operationDuration: 0, effectiveDuration: 0, duplicateDuration: 0, employeeCount: 0 }
  );
});

const trendEmployeeLabel = computed(() => {
  const employeeId = props.employeeId || findTopEmployeeId();
  const row = displaySummaryList.value.find((item) => item.employeeId === employeeId);
  if (!row) {
    return props.employeeId ? `${props.employeeId}工号` : '自动展示出勤最高员工';
  }
  return formatEmployeeLabel(row.employeeName, row.employeeId);
});

const unitLabel = computed(() => (props.displayUnit === 'minute' ? '分钟' : '小时'));

const toDisplayValue = (minute?: number) => {
  const value = Number(minute || 0);
  return props.displayUnit === 'minute' ? value : Number((value / 60).toFixed(2));
};

const formatDisplayNumber = (value?: number) => {
  const numberValue = Number(value || 0);
  if (props.displayUnit === 'minute') {
    return numberValue.toLocaleString();
  }
  return numberValue.toFixed(2);
};

const formatDisplayDuration = (value?: number) => `${formatDisplayNumber(value)} ${unitLabel.value}`;

const formatDurationByDisplayValue = (value?: number) => `${formatDisplayNumber(value)} ${unitLabel.value}`;

const compactDurationByDisplayValue = (value?: number) => {
  const numberValue = Number(value || 0);
  if (numberValue >= 10000) {
    return `${Math.round(numberValue / 1000) / 10}万`;
  }
  return props.displayUnit === 'minute' ? `${numberValue}` : numberValue.toFixed(2);
};

const formatEmployeeLabel = (employeeName?: string, employeeId?: string) => {
  if (employeeName && employeeId) {
    return `${employeeId} ${employeeName} `;
  }
  return employeeName || employeeId || '-';
};

const initCharts = () => {
  if (employeeTrendRef.value && !employeeTrendChart) {
    employeeTrendChart = echarts.init(employeeTrendRef.value);
  }
  if (employeeTopRef.value && !employeeTopChart) {
    employeeTopChart = echarts.init(employeeTopRef.value);
  }
  if (duplicateTopRef.value && !duplicateTopChart) {
    duplicateTopChart = echarts.init(duplicateTopRef.value);
  }
  if (dailyCompareRef.value && !dailyCompareChart) {
    dailyCompareChart = echarts.init(dailyCompareRef.value);
  }
};

const renderCharts = () => {
  initCharts();
  renderEmployeeTrend();
  renderEmployeeTop();
  renderDuplicateTop();
  renderDailyCompare();
  nextTick(resizeCharts);
};

const renderEmployeeTrend = () => {
  const employeeId = props.employeeId || findTopEmployeeId();
  const rows = displaySummaryList.value
    .filter((item) => item.employeeId === employeeId)
    .slice()
    .sort((a, b) => String(a.reportDate).localeCompare(String(b.reportDate)));
  employeeTrendChart?.setOption(
    {
      color: [palette.blue, palette.orange, palette.green],
      tooltip: commonTooltip,
      legend: {
        top: 0,
        right: 0,
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        selected: { '总出勤': false, '总操作': true, '总有效': false },
        textStyle: { color: palette.subText }
      },
      grid: commonGrid,
      graphic: emptyGraphic(!rows.length),
      xAxis: categoryAxis(
        rows.map((item) => item.reportDate),
        rows.length > 8 ? 35 : 0
      ),
      yAxis: valueAxis(),
      series: [
        lineSeries(
          '总出勤',
          rows.map((item) => item.totalDuration),
          palette.blue
        ),
        lineSeries(
          '总操作',
          rows.map((item) => item.operationDuration),
          palette.orange
        ),
        lineSeries(
          '总有效',
          rows.map((item) => item.effectiveDuration),
          palette.green
        )
      ]
    },
    true
  );
};

const renderEmployeeTop = () => {
  const rows = aggregateByEmployee()
    .sort((a, b) => b.operationDuration - a.operationDuration)
    .slice(0, 10)
    .reverse();
  employeeTopChart?.setOption(
    {
      tooltip: commonTooltip,
      grid: { left: 28, right: 54, top: 12, bottom: 10, containLabel: true },
      graphic: emptyGraphic(!rows.length),
      xAxis: { ...valueAxis(), axisLabel: { show: false }, splitLine: { show: false } },
      yAxis: {
        ...categoryAxis(rows.map((item) => formatEmployeeLabel(item.employeeName, item.employeeId))),
        axisLine: { show: false },
        axisLabel: { color: palette.text, width: 132, overflow: 'truncate' }
      },
      series: [
        barSeries(
          '累计操作',
          rows.map((item) => item.operationDuration),
          palette.blue
        )
      ]
    },
    true
  );
};

const renderDuplicateTop = () => {
  const rows = displayDuplicateList.value
    .slice()
    .sort((a, b) => (b.duplicateDuration || 0) - (a.duplicateDuration || 0))
    .slice(0, 10)
    .reverse();
  duplicateTopChart?.setOption(
    {
      tooltip: commonTooltip,
      grid: { left: 28, right: 54, top: 12, bottom: 10, containLabel: true },
      graphic: emptyGraphic(!rows.length),
      xAxis: { ...valueAxis(), axisLabel: { show: false }, splitLine: { show: false } },
      yAxis: {
        ...categoryAxis(rows.map((item) => `${formatEmployeeLabel(item.employeeName, item.employeeId)} ${item.reportDate}`)),
        axisLine: { show: false },
        axisLabel: { color: palette.text, width: 164, overflow: 'truncate' }
      },
      series: [
        barSeries(
          '重复上线',
          rows.map((item) => item.duplicateDuration),
          palette.red
        )
      ]
    },
    true
  );
};

const renderDailyCompare = () => {
  const rows = aggregateByDate();
  dailyCompareChart?.setOption(
    {
      color: [palette.indigo, palette.blue, palette.amber],
      tooltip: {
        ...commonTooltip,
        axisPointer: {
          type: 'line',
          lineStyle: {
            color: '#94a3b8',
            width: 1,
            type: 'dashed'
          }
        }
      },
      legend: { top: 0, right: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: palette.subText } },
      grid: commonGrid,
      graphic: emptyGraphic(!rows.length),
      xAxis: categoryAxis(
        rows.map((item) => item.reportDate),
        rows.length > 8 ? 35 : 0
      ),
      yAxis: valueAxis(),
      series: [
        {
          name: '总操作',
          type: 'bar',
          selectedMode: false,
          barWidth: 14,
          barMaxWidth: 20,
          itemStyle: {
            borderRadius: [3, 3, 0, 0],
            color: palette.indigo
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              color: '#3730a3',
              shadowBlur: 0
            }
          },
          select: {
            disabled: true
          },
          data: rows.map((item) => item.operationDuration)
        },
        {
          ...lineSeries(
            '总操作趋势',
            rows.map((item) => item.operationDuration),
            palette.blue
          ),
          selectedMode: false,
          symbolSize: 7,
          areaStyle: undefined,
          markLine: undefined,
          emphasis: {
            focus: 'series',
            lineStyle: {
              width: 3
            },
            itemStyle: {
              color: palette.blue,
              borderColor: '#fff',
              borderWidth: 2
            }
          },
          select: {
            disabled: true
          }
        },
        {
          ...lineSeries(
            '重复上线',
            rows.map((item) => item.duplicateDuration),
            palette.amber
          ),
          selectedMode: false,
          symbolSize: 7,
          areaStyle: undefined,
          emphasis: {
            focus: 'series',
            lineStyle: {
              width: 3
            },
            itemStyle: {
              color: palette.amber,
              borderColor: '#fff',
              borderWidth: 2
            }
          },
          select: {
            disabled: true
          }
        }
      ]
    },
    true
  );
};

const findTopEmployeeId = () => aggregateByEmployee().sort((a, b) => b.totalDuration - a.totalDuration)[0]?.employeeId;

const aggregateByEmployee = () => {
  const map = new Map<string, { employeeId: string; employeeName: string; totalDuration: number; operationDuration: number }>();
  displaySummaryList.value.forEach((item) => {
    const key = item.employeeId;
    const row = map.get(key) || { employeeId: item.employeeId, employeeName: item.employeeName, totalDuration: 0, operationDuration: 0 };
    row.totalDuration += Number(item.totalDuration || 0);
    row.operationDuration += Number(item.operationDuration || 0);
    map.set(key, row);
  });
  return Array.from(map.values());
};

const aggregateByDate = () => {
  const map = new Map<string, { reportDate: string; operationDuration: number; duplicateDuration: number }>();
  displaySummaryList.value.forEach((item) => {
    const row = map.get(item.reportDate) || { reportDate: item.reportDate, operationDuration: 0, duplicateDuration: 0 };
    row.operationDuration += Number(item.operationDuration || 0);
    row.duplicateDuration += Number(item.duplicateDuration || 0);
    map.set(item.reportDate, row);
  });
  return Array.from(map.values()).sort((a, b) => a.reportDate.localeCompare(b.reportDate));
};

const resizeCharts = () => {
  employeeTrendChart?.resize();
  employeeTopChart?.resize();
  duplicateTopChart?.resize();
  dailyCompareChart?.resize();
};

defineExpose({
  resizeCharts
});

watch(() => [props.summaryList, props.duplicateList, props.employeeId, props.displayUnit], renderCharts, { deep: true });

onMounted(() => {
  nextTick(renderCharts);
  window.addEventListener('resize', resizeCharts);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts);
  employeeTrendChart?.dispose();
  employeeTopChart?.dispose();
  duplicateTopChart?.dispose();
  dailyCompareChart?.dispose();
});
</script>

<style scoped>
.chart-summary {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
  margin-bottom: 12px;
}

.summary-item {
  position: relative;
  min-width: 0;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px 14px;
  background: #fff;
}

.summary-item::before {
  position: absolute;
  top: 12px;
  bottom: 12px;
  left: 0;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: #d1d5db;
  content: '';
}

.summary-item span {
  display: block;
  margin-bottom: 6px;
  color: #6b7280;
  font-size: 12px;
}

.summary-item strong {
  display: block;
  overflow: hidden;
  color: #111827;
  font-size: 22px;
  font-weight: 650;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-item.primary::before {
  background: #2563eb;
}

.summary-item.operation::before {
  background: #ea580c;
}

.summary-item.effective::before {
  background: #15803d;
}

.summary-item.warning::before {
  background: #e11d48;
}

.summary-item.primary strong {
  color: #2563eb;
}

.summary-item.operation strong {
  color: #ea580c;
}

.summary-item.effective strong {
  color: #15803d;
}

.summary-item.warning strong {
  color: #e11d48;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
}

.chart-panel {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 16px 16px 10px;
  background: #fff;
}

.chart-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.chart-title small {
  overflow: hidden;
  max-width: 48%;
  color: #6b7280;
  font-size: 12px;
  font-weight: 400;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trend-employee {
  margin-top: -2px;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
}

.chart-box {
  width: 100%;
  height: clamp(340px, 34vh, 460px);
  min-width: 0;
}

@media (max-width: 960px) {
  .chart-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .chart-grid {
    grid-template-columns: 1fr;
  }

  .chart-title {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }

  .chart-title small {
    max-width: 100%;
  }

  .chart-box {
    height: 320px;
  }
}

@media (max-width: 520px) {
  .chart-summary {
    grid-template-columns: 1fr;
  }
}
</style>
