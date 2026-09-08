<template>
  <div ref="boardRef" class="packing-board" :class="{ 'is-fullscreen': isFullscreen }">
    <header class="dashboard-header">
      <div class="header-left">
        <img v-if="tenantId === '000001'" src="@/assets/logo/yakima-logo.png" alt="Logo" class="logo" @click="toggleFullscreen" />
        <img v-else src="@/assets/logo/kemflo-logo.jpg" alt="Logo" class="logo" @click="toggleFullscreen" />
      </div>
      <button class="header-title" type="button" @click="showSettings = true">打包看板</button>
      <div class="header-right">
        <el-icon class="time-icon"><Clock /></el-icon>
        <div class="time-block">
          <span class="current-time">{{ currentDateTime }}</span>
          <span class="weekday">{{ currentWeekday }}</span>
        </div>
      </div>
    </header>

    <main class="dashboard-content">
      <section class="kpi-grid">
        <article v-for="card in statCards" :key="card.key" class="kpi-card" :class="card.tone">
          <div class="kpi-icon-wrap">
            <el-icon><component :is="card.icon" /></el-icon>
          </div>
          <div class="kpi-body">
            <div class="kpi-title">{{ card.title }}</div>
            <div class="kpi-value">{{ card.value }}</div>
            <div class="kpi-details">
              <span>今日：{{ card.today }}</span>
              <span>昨日：{{ card.yesterday }}</span>
              <span>周平均：{{ card.weekAvg }}</span>
              <span>周累计：{{ card.weekTotal }}</span>
              <span>月累计：{{ card.monthTotal }}</span>
            </div>
          </div>
          <div class="kpi-bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </article>
      </section>

      <section class="middle-grid">
        <article class="panel pie-panel">
          <div class="panel-title">仓库接收占比</div>
          <div class="chart-area">
            <div ref="pieChart" class="chart"></div>
          </div>
        </article>
        <article class="panel trend-panel">
          <div class="panel-header">
            <div class="panel-title">打包入库趋势</div>
            <el-radio-group v-model="tabPosition" class="range-switch" @change="dateChange">
              <el-radio-button label="week">近一周</el-radio-button>
              <el-radio-button label="month">近一月</el-radio-button>
            </el-radio-group>
          </div>
          <div class="chart-area">
            <div ref="barChart" class="chart"></div>
          </div>
        </article>
      </section>

      <section class="bottom-grid">
        <article v-for="item in lineChartMetas" :key="item.title" class="panel small-panel">
          <div class="panel-title" :style="{ '--accent': item.color }">{{ item.title }}</div>
          <div class="chart-area">
            <div :ref="item.refSetter" class="chart"></div>
          </div>
        </article>
      </section>
    </main>

    <el-dialog v-model="showSettings" title="显示设置" width="520px" append-to-body class="packing-config-dialog">
      <el-form :model="userSettingsForm" label-width="110px">
        <el-form-item label="数据刷新" prop="freshScadaData">
          <el-input-number v-model="userSettingsForm.freshScadaData" :min="5" :step="1">
            <template #suffix>
              <span>秒</span>
            </template>
          </el-input-number>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSettings = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="PackingScada" lang="ts">
import * as echarts from 'echarts';
import moment from 'moment';
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useRequest } from 'vue-request';
import { ElMessage } from 'element-plus';
import { Box, Check, CircleClose, Clock, RefreshLeft, Timer } from '@element-plus/icons-vue';
import { packingScada } from '@/api/wms/scada/index';

interface UserSettingsForm {
  showOperationLine: number;
  showOperationPerRow: number;
  startTime: string | null;
  endTime: string | null;
  autoPlayCarousel: string | number;
  autoPlayInterval: number;
  freshScadaData: number;
}

interface LineChartMeta {
  title: string;
  color: string;
  field: string;
  refSetter: (el: Element | null) => void;
}

const tenantId = ref('000000');
const tabPosition = ref('week');
const currentDateTime = ref('');
const currentWeekday = ref('');
const showSettings = ref(false);
const packingData = ref<Record<string, any>>({});

const userSettingsForm = ref<UserSettingsForm>({
  showOperationLine: 10,
  showOperationPerRow: 6,
  startTime: null,
  endTime: null,
  autoPlayCarousel: '1',
  autoPlayInterval: 10,
  freshScadaData: 30
});

const boardRef = ref<HTMLElement | null>(null);
const isFullscreen = ref(false);
const pieChart = ref<HTMLElement | null>(null);
const barChart = ref<HTMLElement | null>(null);
const lineChart1 = ref<HTMLElement | null>(null);
const lineChart2 = ref<HTMLElement | null>(null);
const lineChart3 = ref<HTMLElement | null>(null);
const lineChart4 = ref<HTMLElement | null>(null);
const lineChart5 = ref<HTMLElement | null>(null);

let pieChartInstance: echarts.ECharts | null = null;
let barChartInstance: echarts.ECharts | null = null;
let lineChartInstance1: echarts.ECharts | null = null;
let lineChartInstance2: echarts.ECharts | null = null;
let lineChartInstance3: echarts.ECharts | null = null;
let lineChartInstance4: echarts.ECharts | null = null;
let lineChartInstance5: echarts.ECharts | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let resizeObserver: ResizeObserver | null = null;

const num = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeSeries = (value: unknown, length = 7) => {
  const source = Array.isArray(value) ? value : [];
  const list = source.map((item) => num(item)).slice(0, length);
  while (list.length < length) list.push(0);
  return list;
};

const statCards = computed(() => [
  {
    key: 'packed',
    title: '打包',
    tone: 'tone-blue',
    icon: Box,
    value: num(packingData.value.totalInQueuePackedQty),
    today: num(packingData.value.todayTotalPackedQty),
    yesterday: num(packingData.value.yesterdayTotalPackedQty),
    weekAvg: num(packingData.value.weekAvgPackedQty),
    weekTotal: num(packingData.value.weekTotalPackedQty),
    monthTotal: num(packingData.value.monthTotalPackedQty)
  },
  {
    key: 'pending',
    title: '待入库',
    tone: 'tone-gold',
    icon: Timer,
    value: num(packingData.value.totalInQueueInboundPendingQty),
    today: num(packingData.value.todayTotalInboundPendingQty),
    yesterday: num(packingData.value.yesterdayTotalInboundPendingQty),
    weekAvg: num(packingData.value.weekAvgInboundPendingQty),
    weekTotal: num(packingData.value.weekTotalInboundPendingQty),
    monthTotal: num(packingData.value.monthTotalInboundPendingQty)
  },
  {
    key: 'received',
    title: '已接收',
    tone: 'tone-green',
    icon: Check,
    value: num(packingData.value.todayTotalReceivedQty),
    today: num(packingData.value.todayTotalReceivedQty),
    yesterday: num(packingData.value.yesterdayTotalReceivedQty),
    weekAvg: num(packingData.value.weekAvgReceivedQty),
    weekTotal: num(packingData.value.weekTotalReceivedQty),
    monthTotal: num(packingData.value.monthTotalReceivedQty)
  },
  {
    key: 'rejected',
    title: '已退回',
    tone: 'tone-red',
    icon: RefreshLeft,
    value: num(packingData.value.totalInQueueRejectedQty),
    today: num(packingData.value.todayTotalRejectedQty),
    yesterday: num(packingData.value.yesterdayTotalRejectedQty),
    weekAvg: num(packingData.value.weekAvgRejectedQty),
    weekTotal: num(packingData.value.weekTotalRejectedQty),
    monthTotal: num(packingData.value.monthTotalRejectedQty)
  },
  {
    key: 'failed',
    title: '接收失败',
    tone: 'tone-purple',
    icon: CircleClose,
    value: num(packingData.value.totalInQueueReceivedFailedQty),
    today: num(packingData.value.todayTotalReceivedFailedQty),
    yesterday: num(packingData.value.yesterdayTotalReceivedFailedQty),
    weekAvg: num(packingData.value.weekAvgReceivedFailedQty),
    weekTotal: num(packingData.value.weekTotalReceivedFailedQty),
    monthTotal: num(packingData.value.monthTotalReceivedFailedQty)
  }
]);

const lineChartMetas: LineChartMeta[] = [
  { title: '近7日打包数', color: '#28a8ff', field: 'weekPackedQtyList', refSetter: (el) => (lineChart1.value = el as HTMLElement | null) },
  { title: '近7日送仓数', color: '#24dfc1', field: 'weekInboundQtyList', refSetter: (el) => (lineChart2.value = el as HTMLElement | null) },
  { title: '近7日接收数', color: '#9b75ff', field: 'weekReceivedQtyList', refSetter: (el) => (lineChart3.value = el as HTMLElement | null) },
  { title: '近7日退回数', color: '#ff5c76', field: 'weekRejectedQtyList', refSetter: (el) => (lineChart4.value = el as HTMLElement | null) },
  { title: '近7日接收失败数', color: '#ffad40', field: 'weekReceivedFailedQtyList', refSetter: (el) => (lineChart5.value = el as HTMLElement | null) }
];

const updateDateTime = () => {
  const now = new Date();
  currentDateTime.value = now
    .toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    .replace(/\//g, '-');
  currentWeekday.value = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()];
};

const toggleFullscreen = () => {
  if (!document.fullscreenEnabled) {
    ElMessage.warning('浏览器不支持全屏');
    return;
  }
  if (!isFullscreen.value) {
    boardRef.value?.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
  nextTick(resizeCharts);
};

const refreshData = async () => {
  userSettingsForm.value.startTime = moment().startOf('month').format('YYYY-MM-DD HH:mm:ss');
  userSettingsForm.value.endTime = moment().format('YYYY-MM-DD HH:mm:ss');
  const res = await packingScada({ startTime: userSettingsForm.value.startTime, endTime: userSettingsForm.value.endTime });
  packingData.value = res.data || {};
  await nextTick();
  initCharts();
};

const saveSettings = () => {
  showSettings.value = false;
  localStorage.setItem('packingScada', JSON.stringify(userSettingsForm.value));
  cancel();
  setTimeout(() => run(), 1000);
};

const { run, cancel } = useRequest(refreshData, {
  manual: true,
  pollingInterval: computed(() => userSettingsForm.value.freshScadaData * 1000)
});

const disposeCharts = () => {
  pieChartInstance?.dispose();
  barChartInstance?.dispose();
  lineChartInstance1?.dispose();
  lineChartInstance2?.dispose();
  lineChartInstance3?.dispose();
  lineChartInstance4?.dispose();
  lineChartInstance5?.dispose();
  pieChartInstance = null;
  barChartInstance = null;
  lineChartInstance1 = null;
  lineChartInstance2 = null;
  lineChartInstance3 = null;
  lineChartInstance4 = null;
  lineChartInstance5 = null;
};

const initCharts = () => {
  disposeCharts();
  initPieChart();
  initBarChart();
  initLineCharts();
  resizeCharts();
};

const initPieChart = () => {
  if (!pieChart.value) return;
  pieChartInstance = echarts.init(pieChart.value);
  const chartData = [
    { value: num(packingData.value.totalInQueueInboundPendingQty), name: '待入库', itemStyle: { color: '#ffc04d' } },
    { value: num(packingData.value.todayTotalReceivedQty), name: '已接收', itemStyle: { color: '#2ee6a6' } },
    { value: num(packingData.value.totalInQueueRejectedQty), name: '已退回', itemStyle: { color: '#ff5268' } },
    { value: num(packingData.value.totalInQueueReceivedFailedQty), name: '接收失败', itemStyle: { color: '#75a7ff' } }
  ];
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  pieChartInstance.setOption({
    backgroundColor: 'transparent',
    tooltip: chartTooltip(),
    legend: {
      orient: 'vertical',
      right: 8,
      top: 'middle',
      itemWidth: 12,
      itemHeight: 12,
      textStyle: { color: '#d8eeff', fontSize: 14 },
      formatter: (name: string) => {
        const item = chartData.find((row) => row.name === name);
        const percent = total ? Math.round(((item?.value || 0) / total) * 100) : 0;
        return `${name}        ${percent}%`;
      }
    },
    graphic: [
      { type: 'text', left: '30%', top: '40%', style: { text: String(total), fill: '#fff', fontSize: 30, fontWeight: 700, textAlign: 'center' } },
      { type: 'text', left: '29%', top: '53%', style: { text: '总数量', fill: '#c6ddf8', fontSize: 14, textAlign: 'center' } }
    ],
    series: [
      {
        name: '仓库接收占比',
        type: 'pie',
        center: ['34%', '50%'],
        radius: ['50%', '72%'],
        startAngle: 90,
        minAngle: 8,
        avoidLabelOverlap: true,
        itemStyle: { borderWidth: 0 },
        label: { color: '#f2f8ff', formatter: '{d}%', fontSize: 14 },
        labelLine: { length: 14, length2: 18, lineStyle: { color: 'rgba(128, 210, 255, 0.55)' } },
        data: chartData
      }
    ]
  });
};

const initBarChart = () => {
  if (!barChart.value) return;
  barChartInstance = echarts.init(barChart.value);
  dateChange(tabPosition.value);
};

const initLineCharts = () => {
  const dates = Array.from({ length: 7 }, (_, index) =>
    moment()
      .subtract(6 - index, 'days')
      .format('MM-DD')
  );
  const refs = [lineChart1, lineChart2, lineChart3, lineChart4, lineChart5];
  const instances = refs.map((chartRef, index) => {
    if (!chartRef.value) return null;
    const instance = echarts.init(chartRef.value);
    const meta = lineChartMetas[index];
    instance.setOption(getLineChartOption(dates, normalizeSeries(packingData.value[meta.field]), meta.color));
    return instance;
  });

  [lineChartInstance1, lineChartInstance2, lineChartInstance3, lineChartInstance4, lineChartInstance5] = instances;
};

const chartTooltip = () => ({
  trigger: 'axis',
  backgroundColor: 'rgba(2, 14, 36, 0.92)',
  borderColor: 'rgba(70, 182, 255, 0.55)',
  borderWidth: 1,
  textStyle: { color: '#eaf7ff' }
});

const axisStyle = () => ({
  axisLine: { lineStyle: { color: 'rgba(170, 218, 255, 0.72)' } },
  axisTick: { show: false },
  axisLabel: { color: '#d7eaff', fontSize: 12 },
  splitLine: { lineStyle: { color: 'rgba(82, 150, 210, 0.18)', type: 'dashed' } }
});

const getLineChartOption = (xData: string[], yData: number[], color: string) => ({
  backgroundColor: 'transparent',
  tooltip: chartTooltip(),
  grid: { left: 36, right: 16, top: 28, bottom: 28 },
  xAxis: { type: 'category', boundaryGap: false, data: xData, ...axisStyle(), splitLine: { show: true, lineStyle: { color: 'rgba(82, 150, 210, 0.12)' } } },
  yAxis: { type: 'value', minInterval: 1, ...axisStyle() },
  series: [
    {
      name: '数量',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 7,
      showSymbol: true,
      lineStyle: { width: 4, color },
      itemStyle: { color: '#ffffff', borderWidth: 3, borderColor: color },
      label: { show: true, position: 'top', color, fontSize: 12 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: `${color}66` },
          { offset: 1, color: `${color}00` }
        ])
      },
      data: yData
    }
  ]
});

const dateChange = (value: string | number | boolean | undefined) => {
  if (!barChartInstance) return;

  const isMonth = value === 'month';
  const length = isMonth ? moment().daysInMonth() : 7;
  const xData = Array.from({ length }, (_, index) => {
    const date = isMonth ? moment().startOf('month').add(index, 'days') : moment().subtract(length - 1 - index, 'days');
    return date.format('MM-DD');
  });
  const packedData = normalizeSeries(isMonth ? packingData.value.monthPackedQtyList : packingData.value.weekPackedQtyList, length);
  const receivedData = normalizeSeries(isMonth ? packingData.value.monthReceivedQtyList : packingData.value.weekReceivedQtyList, length);

  barChartInstance.setOption({
    backgroundColor: 'transparent',
    tooltip: { ...chartTooltip(), axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(50, 170, 255, 0.08)' } } },
    legend: {
      top: 4,
      left: 'center',
      itemWidth: 12,
      itemHeight: 12,
      textStyle: { color: '#d8eeff', fontSize: 14 },
      data: ['打包数', '接收数']
    },
    grid: { left: 48, right: 28, top: 58, bottom: 38 },
    xAxis: { type: 'category', data: xData, ...axisStyle(), splitLine: { show: true, lineStyle: { color: 'rgba(82, 150, 210, 0.13)' } } },
    yAxis: { type: 'value', minInterval: 1, name: '数量', nameTextStyle: { color: '#d7eaff', padding: [0, 0, 6, -28] }, ...axisStyle() },
    series: [
      {
        name: '打包数',
        type: 'bar',
        barWidth: isMonth ? 10 : 38,
        data: packedData,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#48b9ff' },
            { offset: 1, color: '#137ee9' }
          ])
        },
        label: { show: true, position: 'top', color: '#28a8ff', fontSize: 13 }
      },
      {
        name: '接收数',
        type: 'bar',
        barWidth: isMonth ? 10 : 38,
        data: receivedData,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#58eaa4' },
            { offset: 1, color: '#1ebd7f' }
          ])
        },
        label: { show: true, position: 'top', color: '#2ee6a6', fontSize: 13 }
      }
    ]
  });
};

const resizeCharts = () => {
  pieChartInstance?.resize();
  barChartInstance?.resize();
  lineChartInstance1?.resize();
  lineChartInstance2?.resize();
  lineChartInstance3?.resize();
  lineChartInstance4?.resize();
  lineChartInstance5?.resize();
};

onMounted(async () => {
  tenantId.value = localStorage.getItem('tenantId') || '000000';
  updateDateTime();
  timer = setInterval(updateDateTime, 1000);

  const settings = localStorage.getItem('packingScada');
  if (settings) {
    userSettingsForm.value = { ...userSettingsForm.value, ...JSON.parse(settings) };
  }

  await run();
  window.addEventListener('resize', resizeCharts);
  document.addEventListener('fullscreenchange', handleFullscreenChange);

  if (window.ResizeObserver && boardRef.value) {
    resizeObserver = new ResizeObserver(resizeCharts);
    resizeObserver.observe(boardRef.value);
  }
});

onUnmounted(() => {
  cancel();
  if (timer) clearInterval(timer);
  window.removeEventListener('resize', resizeCharts);
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  resizeObserver?.disconnect();
  disposeCharts();
});
</script>

<style lang="scss" scoped>
.packing-board {
  --panel-border: rgba(38, 172, 255, 0.66);
  --panel-bg: rgba(2, 22, 50, 0.76);
  --text-main: #f3f9ff;
  --text-sub: #c5dcf5;
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  min-width: 1280px;
  min-height: 720px;
  padding: 12px 16px 22px;
  overflow: hidden;
  color: var(--text-main);
  background:
    linear-gradient(180deg, rgba(0, 9, 27, 0.1), rgba(0, 7, 22, 0.44)),
    url('@/assets/images/scada/packing/board-bg.png') center / cover no-repeat,
    #020915;
  font-family: 'Microsoft YaHei', Arial, sans-serif;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(90deg, rgba(31, 161, 255, 0.08) 1px, transparent 1px), linear-gradient(0deg, rgba(31, 161, 255, 0.06) 1px, transparent 1px);
    background-size: 78px 78px;
    mask-image: linear-gradient(180deg, transparent 0, #000 18%, #000 82%, transparent 100%);
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

.packing-board.is-fullscreen {
  padding: 12px 16px 22px;
}

.dashboard-header {
  display: grid;
  grid-template-columns: minmax(300px, 1fr) minmax(420px, 1.2fr) minmax(300px, 1fr);
  align-items: center;
  flex-shrink: 0;
  height: 66px;
  border: 1px solid rgba(31, 160, 255, 0.72);
  border-radius: 6px;
  background: linear-gradient(90deg, rgba(4, 38, 83, 0.82), rgba(3, 28, 67, 0.42), rgba(4, 38, 83, 0.82));
  box-shadow:
    inset 0 0 24px rgba(26, 159, 255, 0.18),
    0 0 24px rgba(0, 144, 255, 0.18);
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  min-width: 0;
  height: 100%;
}

.header-left {
  padding-left: 26px;
}

.header-right {
  justify-content: flex-end;
  gap: 12px;
  padding-right: 28px;
}

.logo {
  max-width: 250px;
  height: 44px;
  object-fit: contain;
  filter: drop-shadow(0 0 9px rgba(58, 177, 255, 0.95));
  cursor: pointer;
}

.header-title {
  justify-self: center;
  min-width: 470px;
  height: 66px;
  border: 0;
  color: #ffffff;
  background: linear-gradient(180deg, rgba(30, 163, 255, 0.38), rgba(4, 50, 112, 0.9));
  clip-path: polygon(8% 0, 92% 0, 100% 50%, 92% 100%, 8% 100%, 0 50%);
  cursor: pointer;
  font-size: 34px;
  font-weight: 800;
  text-shadow:
    0 0 8px rgba(255, 255, 255, 0.9),
    0 0 18px rgba(22, 153, 255, 0.9);
}

.time-icon {
  width: 42px;
  height: 42px;
  color: #2ca8ff;
  border: 3px solid rgba(44, 168, 255, 0.75);
  border-radius: 50%;
  font-size: 27px;
  box-shadow: 0 0 14px rgba(42, 166, 255, 0.4);
}

.time-block {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.current-time {
  color: #f2f8ff;
  font-size: 20px;
  font-weight: 700;
}

.weekday {
  color: #a9c8e9;
  font-size: 13px;
}

.dashboard-content {
  display: grid;
  grid-template-rows: 190px minmax(270px, 1fr) minmax(230px, 0.95fr);
  flex: 1;
  gap: 12px;
  min-height: 0;
  padding-top: 14px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  min-height: 0;
}

.kpi-card,
.panel {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--panel-border);
  border-radius: 6px;
  background: var(--panel-bg);
  box-shadow:
    inset 0 0 26px rgba(22, 147, 255, 0.13),
    0 0 18px rgba(15, 142, 255, 0.18);

  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 74px;
    height: 3px;
    background: currentColor;
    filter: drop-shadow(0 0 7px currentColor);
  }

  &::before {
    top: -1px;
    left: 18px;
  }

  &::after {
    right: 18px;
    bottom: -1px;
  }
}

.kpi-card {
  display: grid;
  grid-template-columns: 84px 1fr;
  gap: 10px;
  padding: 20px 16px 16px;
}

.kpi-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin-top: 2px;
  border: 4px solid currentColor;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
  font-size: 38px;
  box-shadow:
    inset 0 0 18px currentColor,
    0 0 16px color-mix(in srgb, currentColor 62%, transparent);
}

.kpi-title {
  color: #f5fbff;
  font-size: 18px;
  font-weight: 700;
}

.kpi-value {
  margin-top: 2px;
  color: #fff;
  font-size: 36px;
  font-weight: 800;
  line-height: 1;
  text-shadow: 0 0 14px currentColor;
}

.kpi-details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 12px;
  margin-top: 12px;
  color: var(--text-sub);
  font-size: 14px;
  font-weight: 600;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.kpi-bars {
  position: absolute;
  right: 18px;
  bottom: 18px;
  display: flex;
  align-items: flex-end;
  gap: 5px;

  span {
    width: 6px;
    background: currentColor;
    box-shadow: 0 0 8px currentColor;
  }

  span:nth-child(1) {
    height: 16px;
    opacity: 0.55;
  }

  span:nth-child(2) {
    height: 24px;
    opacity: 0.75;
  }

  span:nth-child(3) {
    height: 34px;
  }
}

.tone-blue {
  color: #25a8ff;
  background: linear-gradient(135deg, rgba(12, 103, 205, 0.46), rgba(2, 24, 58, 0.78));
}

.tone-gold {
  color: #ffc04d;
  background: linear-gradient(135deg, rgba(180, 116, 24, 0.44), rgba(45, 30, 11, 0.76));
}

.tone-green {
  color: #2ee6a6;
  background: linear-gradient(135deg, rgba(11, 156, 110, 0.46), rgba(2, 44, 48, 0.78));
}

.tone-red {
  color: #ff5c76;
  background: linear-gradient(135deg, rgba(180, 33, 69, 0.46), rgba(54, 16, 40, 0.76));
}

.tone-purple {
  color: #a36cff;
  background: linear-gradient(135deg, rgba(95, 57, 205, 0.48), rgba(28, 18, 75, 0.8));
}

.middle-grid {
  display: grid;
  grid-template-columns: minmax(360px, 0.62fr) minmax(0, 1.62fr);
  gap: 12px;
  min-height: 0;
}

.bottom-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  min-height: 0;
}

.panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 16px 18px 12px;
  color: #2aa8ff;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  gap: 16px;
}

.panel-title {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  height: 30px;
  color: #f5fbff;
  font-size: 22px;
  font-weight: 800;
  text-shadow: 0 0 12px rgba(26, 152, 255, 0.52);

  &::before {
    content: '';
    width: 5px;
    height: 24px;
    margin-right: 10px;
    background: var(--accent, #2aa8ff);
    box-shadow: 0 0 12px var(--accent, #2aa8ff);
  }
}

.chart-area {
  flex: 1;
  min-height: 0;
  padding-top: 8px;
}

.chart {
  width: 100%;
  height: 100%;
}

.range-switch {
  flex-shrink: 0;

  :deep(.el-radio-button__inner) {
    min-width: 88px;
    border-color: rgba(63, 159, 255, 0.44);
    background: rgba(3, 22, 52, 0.82);
    color: #d8eeff;
    font-weight: 700;
    box-shadow: none;
  }

  :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
    border-color: #26a8ff;
    background: linear-gradient(180deg, #31b2ff, #167ee0);
    color: #fff;
  }
}

.small-panel {
  padding: 14px 14px 10px;

  .panel-title {
    height: 28px;
    font-size: 19px;
  }
}

.packing-config-dialog :deep(.el-dialog) {
  background: #0f1936;
  border: 1px solid rgba(0, 160, 255, 0.28);
}

.packing-config-dialog :deep(.el-dialog__header),
.packing-config-dialog :deep(.el-dialog__footer) {
  background: #0f1936;
}

.packing-config-dialog :deep(.el-dialog__title),
.packing-config-dialog :deep(.el-form-item__label) {
  color: #f2f8ff;
}

.packing-config-dialog :deep(.el-dialog__body) {
  background: #0f1936;
  color: #e8f4ff;
}
</style>
