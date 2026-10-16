<template>
  <main ref="boardRef" class="shipping-board" :class="{ 'is-fullscreen': isFullscreen }">
    <div class="dashboard-stage" :style="stageStyle">
      <div class="dashboard-canvas" :style="canvasStyle">
        <header class="dashboard-header">
          <div class="header-left">
            <img v-if="tenantId == '000001'" src="@/assets/logo/yakima-logo.png" alt="Logo" class="logo" @click="toggleFullscreen" />
            <img v-else src="@/assets/logo/kemflo-logo.jpg" alt="Logo" class="logo" @click="toggleFullscreen" />
          </div>

          <button class="header-title" type="button" @click="showSettings = true">
            <strong>出货扫码看板</strong>
            <span>OUTBOUND SCAN DASHBOARD</span>
          </button>

          <div class="header-right">
            <el-icon class="time-icon">
              <Clock />
            </el-icon>
            <div class="time-block">
              <span class="current-time">{{ currentDateTime }}</span>
              <span class="date-row">
                <span class="weekday">{{ currentWeekday }}</span>
                <span v-if="selectedDateLabel" class="selected-date">{{ selectedDateLabel }}</span>
                <span v-if="selectedDateWeekday" class="selected-date-weekday">（{{ selectedDateWeekday }}）</span>
              </span>
            </div>
          </div>
        </header>

        <section class="metric-row">
          <article v-for="card in metrics" :key="card.title" :class="['metric-card', card.tone]">
            <div class="metric-icon">
              <img :src="iconMap[card.icon]" :alt="card.title" />
            </div>
            <div class="metric-main">
              <span>{{ card.title }}</span>
              <strong>{{ card.value }}</strong>
              <em :class="{ down: card.down }">
                <span class="compare-text">{{ comparisonLabel }}</span>
                <i class="trend-icon">{{ card.down ? '▼' : '▲' }}</i>
                <span class="compare-rate">{{ card.rate }}</span>
              </em>
            </div>
            <div class="metric-spark" aria-hidden="true"><i /><i /><i /><i /><i /></div>
          </article>
        </section>

        <section class="middle-grid">
          <article class="dashboard-panel trend-panel">
            <header class="panel-title">
              <h2>扫码数量趋势</h2>
              <div class="legend-inline">
                <span class="normal">正常</span>
                <span class="abnormal">异常</span>
              </div>
            </header>
            <div class="unit-label">单位：次</div>
            <div class="panel-body">
              <div ref="trendChartRef" class="chart"></div>
            </div>
          </article>

          <article class="dashboard-panel ratio-panel">
            <header class="panel-title">
              <h2>扫码状态占比</h2>
            </header>
            <div class="panel-body ratio-body">
              <div ref="ratioChartRef" class="chart ratio-chart"></div>
              <ul class="ratio-legend">
                <li v-for="item in normalizedStatusRatio" :key="String(item.status)">
                  <i :style="{ background: item.color }"></i>
                  <span>{{ item.name }}</span>
                  <strong>{{ formatPercent(item.percent) }}</strong>
                  <em>{{ formatNumber(item.qty) }}</em>
                </li>
              </ul>
            </div>
          </article>

          <article class="dashboard-panel top-panel">
            <header class="panel-title">
              <h2>TOP5 发货客户</h2>
            </header>
            <div class="top-list">
              <div v-for="(item, index) in topCustomers.slice(0, 5)" :key="`${item.customerCode}-${index}`" class="top-row">
                <span class="top-index">{{ index + 1 }}</span>
                <span class="top-name" :title="item.customerName || item.customerCode">{{ item.customerName || item.customerCode || '-' }}</span>
                <span class="top-bar"><i :style="{ width: `${topBarPercent(item.qty)}%` }"></i></span>
                <strong>{{ formatNumber(item.qty) }}</strong>
              </div>
              <div v-if="topCustomers.length === 0" class="empty-state">暂无客户排行</div>
            </div>
          </article>
        </section>

        <section class="dashboard-panel detail-panel">
          <header class="panel-title">
            <h2>实时出货扫码明细</h2>
          </header>
          <div class="detail-table-wrap">
            <div class="detail-head detail-row">
              <span>序号</span>
              <span>扫码时间</span>
              <span>客户代码</span>
              <span>客户名称</span>
              <span>客户单号</span>
              <span>条码</span>
              <span>状态</span>
              <span>工单号</span>
              <span>物料</span>
              <span>物料描述</span>
            </div>
            <div class="detail-body">
              <Vue3SeamlessScroll v-if="showScroll && settingsForm.enableScroll && detailRows.length > settingsForm.displayLimit" :key="detailScrollKey" :list="detailScrollRows" :visible-count="settingsForm.displayLimit" :hover="true" :step="stepVal" :wheel="true">
                <template #default="{ data: row }">
                  <div class="detail-row">
                    <span>{{ row.displayIndex }}</span>
                    <span>{{ row.dateTime || '-' }}</span>
                    <span>{{ row.customerCode || '-' }}</span>
                    <span class="ellipsis" :title="row.customerName">{{ row.customerName || '-' }}</span>
                    <span class="ellipsis" :title="row.customerNo">{{ row.customerNo || '-' }}</span>
                    <span class="ellipsis" :title="row.sfc">{{ row.sfc || '-' }}</span>
                    <span
                      ><i :class="['status-tag', isAbnormalStatus(row.status) ? 'abnormal' : 'normal']">{{ isAbnormalStatus(row.status) ? '异常' : '正常' }}</i></span
                    >
                    <span class="ellipsis" :title="row.shopOrder">{{ row.shopOrder || '-' }}</span>
                    <span class="ellipsis" :title="row.item">{{ row.item || '-' }}</span>
                    <span class="ellipsis" :title="row.itemDesc">{{ row.itemDesc || '-' }}</span>
                  </div>
                </template>
              </Vue3SeamlessScroll>
              <template v-else>
                <div v-for="(row, index) in detailRows" :key="`${row.id}-${index}`" class="detail-row">
                  <span>{{ index + 1 }}</span>
                  <span>{{ row.dateTime || '-' }}</span>
                  <span>{{ row.customerCode || '-' }}</span>
                  <span class="ellipsis" :title="row.customerName">{{ row.customerName || '-' }}</span>
                  <span class="ellipsis" :title="row.customerNo">{{ row.customerNo || '-' }}</span>
                  <span class="ellipsis" :title="row.sfc">{{ row.sfc || '-' }}</span>
                  <span
                    ><i :class="['status-tag', isAbnormalStatus(row.status) ? 'abnormal' : 'normal']">{{ isAbnormalStatus(row.status) ? '异常' : '正常' }}</i></span
                  >
                  <span class="ellipsis" :title="row.shopOrder">{{ row.shopOrder || '-' }}</span>
                  <span class="ellipsis" :title="row.item">{{ row.item || '-' }}</span>
                  <span class="ellipsis" :title="row.itemDesc">{{ row.itemDesc || '-' }}</span>
                </div>
                <div v-if="detailRows.length === 0" class="empty-state">暂无扫码明细</div>
              </template>
            </div>
          </div>
        </section>
      </div>
    </div>

    <el-dialog v-model="showSettings" title="看板设置" width="520px" append-to-body :append-to="settingsDialogAppendTo" class="shipping-config-dialog">
      <el-form label-width="110px">
        <el-form-item label="显示数量">
          <el-slider v-model="settingsForm.displayLimit" :min="5" :max="10000" show-input />
        </el-form-item>
        <el-form-item label="滚动速度">
          <el-slider v-model="settingsForm.scrollSpeed" :min="0.1" :max="2" :step="0.1" show-input />
        </el-form-item>
        <el-form-item label="刷新间隔">
          <el-input-number v-model="settingsForm.refreshInterval" :min="30" :max="300" :step="5" />
          <span class="setting-suffix">秒</span>
        </el-form-item>
        <el-form-item label="自动更新日期">
          <el-switch v-model="settingsForm.autoUpdateDate" @change="handleAutoUpdateDateChange" />
        </el-form-item>
        <el-form-item label="查看日期">
          <el-date-picker v-model="settingsForm.selectedDate" type="date" value-format="YYYY-MM-DD" :disabled="settingsForm.autoUpdateDate" :disabled-date="disableFutureDate" :teleported="!isFullscreen" :clearable="!settingsForm.autoUpdateDate" />
        </el-form-item>
        <el-form-item label="自动滚动">
          <el-switch v-model="settingsForm.enableScroll" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSettings = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">保存</el-button>
      </template>
    </el-dialog>
  </main>
</template>

<script setup name="ScadaShippingDetailBoard" lang="ts">
import { Clock } from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { Vue3SeamlessScroll } from 'vue3-seamless-scroll';
import { getShippingDetailHourlyTrend, getShippingDetailOverview, getShippingDetailStatusRatio, getShippingDetailTopCustomers, listShippingDetailScada } from '@/api/scada/shippingDetail';
import type { ShippingDetailHourlyTrendVO, ShippingDetailOverviewVO, ShippingDetailRowVO, ShippingDetailScadaQuery, ShippingDetailStatusRatioVO, ShippingDetailTopCustomerVO } from '@/api/scada/shippingDetail/types';

import boxIcon from '@/assets/images/scada/shipping-dashboard/icons/scan-box.svg';
import orderIcon from '@/assets/images/scada/shipping-dashboard/icons/order.svg';
import itemIcon from '@/assets/images/scada/shipping-dashboard/icons/item.svg';
import truckIcon from '@/assets/images/scada/shipping-dashboard/icons/truck.svg';

type IconName = 'box' | 'order' | 'item' | 'truck';

interface WebMcpModelContext {
  registerTool: (
    tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: Record<string, unknown>;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => Promise<Record<string, unknown>>;
    },
    options?: { signal?: AbortSignal }
  ) => void | Promise<void>;
}

const SETTINGS_KEY = 'scada-shipping-detail-settings';
const designWidth = 1920;
const designHeight = 1080;
const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

const iconMap: Record<IconName, string> = {
  box: boxIcon,
  order: orderIcon,
  item: itemIcon,
  truck: truckIcon
};

const emptyOverview = (): ShippingDetailOverviewVO => ({
  todayScanQty: 0,
  yesterdayScanQty: 0,
  scanQtyChangeRate: 0,
  todayCustomerCount: 0,
  yesterdayCustomerCount: 0,
  customerChangeRate: 0,
  todayOrderCount: 0,
  yesterdayOrderCount: 0,
  orderChangeRate: 0,
  todayItemCount: 0,
  yesterdayItemCount: 0,
  itemChangeRate: 0
});

const tenantId = ref('000000');
const boardRef = ref<HTMLElement>();
const trendChartRef = ref<HTMLElement>();
const ratioChartRef = ref<HTMLElement>();
const overview = ref<ShippingDetailOverviewVO>(emptyOverview());
const hourlyTrend = ref<ShippingDetailHourlyTrendVO[]>([]);
const statusRatio = ref<ShippingDetailStatusRatioVO[]>([]);
const topCustomers = ref<ShippingDetailTopCustomerVO[]>([]);
const detailRows = ref<ShippingDetailRowVO[]>([]);
const currentDateTime = ref('');
const currentWeekday = ref('');
const showSettings = ref(false);
const showScroll = ref(true);
const isFullscreen = ref(false);
const stepVal = ref(0.35);
const detailScrollKey = ref(0);
const viewport = reactive({ scale: 1, left: 0, top: 0 });
const queryParams = reactive<ShippingDetailScadaQuery>({ customerCode: undefined });
const settingsForm = reactive({ displayLimit: 100, scrollSpeed: 0.35, refreshInterval: 60, enableScroll: true, autoUpdateDate: true, selectedDate: todayDate() });

let clockTimer: number | undefined;
let refreshTimer: number | undefined;
let trendChart: echarts.ECharts | undefined;
let ratioChart: echarts.ECharts | undefined;
let webMcpController: AbortController | undefined;

const stageStyle = computed(() => ({
  width: `${designWidth * viewport.scale}px`,
  height: `${designHeight * viewport.scale}px`,
  marginLeft: `${viewport.left}px`,
  marginTop: `${viewport.top}px`
}));
const canvasStyle = computed(() => ({ transform: `scale(${viewport.scale})` }));
const settingsDialogAppendTo = computed<HTMLElement | string>(() => (isFullscreen.value && boardRef.value ? boardRef.value : 'body'));
const detailScrollRows = computed(() => detailRows.value.map((row, index) => ({ ...row, displayIndex: index + 1 })));
const topCustomerMax = computed(() => Math.max(1, ...topCustomers.value.map((item) => Number(item.qty || 0))));
const queryDate = computed(() => settingsForm.selectedDate || todayDate());
const isSelectedToday = computed(() => queryDate.value === todayDate());
const metricDatePrefix = computed(() => (isSelectedToday.value ? '今日' : ''));
const selectedDateLabel = computed(() => (isSelectedToday.value ? '' : queryDate.value));
const selectedDateWeekday = computed(() => (selectedDateLabel.value ? getWeekday(queryDate.value) : ''));
const comparisonLabel = computed(() => (isSelectedToday.value ? '较昨日' : '较前日'));

const normalizedStatusRatio = computed(() => {
  const fallback = [
    { status: 0, statusName: '正常', qty: overview.value.todayScanQty || 0, percent: 100 },
    { status: 1, statusName: '异常', qty: 0, percent: 0 }
  ];
  return (statusRatio.value.length ? statusRatio.value : fallback).map((item) => ({
    status: item.status,
    name: item.statusName || statusName(item.status),
    qty: Number(item.qty || 0),
    percent: Number(item.percent || 0),
    color: statusColor(item.status)
  }));
});

const metrics = computed(() => {
  const o = overview.value;
  const prefix = metricDatePrefix.value;
  return [
    { title: `${prefix}扫码数量`, value: formatNumber(o.todayScanQty), icon: 'box' as IconName, tone: 'blue', rate: formatRate(o.scanQtyChangeRate), down: Number(o.scanQtyChangeRate) < 0 },
    { title: `${prefix}发货客户`, value: formatNumber(o.todayCustomerCount), icon: 'truck' as IconName, tone: 'green', rate: formatRate(o.customerChangeRate), down: Number(o.customerChangeRate) < 0 },
    { title: `${prefix}发货单数`, value: formatNumber(o.todayOrderCount), icon: 'order' as IconName, tone: 'amber', rate: formatRate(o.orderChangeRate), down: Number(o.orderChangeRate) < 0 },
    { title: `${prefix}发货物料`, value: formatNumber(o.todayItemCount), icon: 'item' as IconName, tone: 'violet', rate: formatRate(o.itemChangeRate), down: Number(o.itemChangeRate) < 0 }
  ];
});

function todayDate() {
  return formatDate(new Date());
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildDateTimeRange(date: string) {
  return [`${date} 00:00:00`, `${date} 23:59:59`];
}

function getWeekday(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return weekdays[new Date(year, month - 1, day).getDay()];
}

function disableFutureDate(date: Date) {
  return formatDate(date) > todayDate();
}

const formatNumber = (value: number | string | undefined) => Number(value || 0).toLocaleString('zh-CN');
const formatRate = (value: number | string | undefined) => {
  const rate = Number(value || 0);
  return `${rate >= 0 ? '+' : ''}${rate.toFixed(1)}%`;
};
const formatPercent = (value: number | string | undefined) => `${Number(value || 0).toFixed(1)}%`;
const isAbnormalStatus = (status?: number | string) => Number(status || 0) !== 0;
const statusName = (status?: number) => (isAbnormalStatus(status) ? '异常' : '正常');
const statusColor = (status?: number) => (isAbnormalStatus(status) ? '#ff7448' : '#2aa8ff');
const topBarPercent = (value: number | string | undefined) => Math.max(8, (Number(value || 0) / topCustomerMax.value) * 100);

function buildQuery(): ShippingDetailScadaQuery {
  return {
    customerCode: queryParams.customerCode || undefined,
    topLimit: 5,
    dateTimeRange: buildDateTimeRange(queryDate.value)
  };
}

async function refreshAll() {
  const query = buildQuery();
  const [overviewRes, trendRes, ratioRes, topRes, listRes] = await Promise.allSettled([getShippingDetailOverview(query), getShippingDetailHourlyTrend(query), getShippingDetailStatusRatio(query), getShippingDetailTopCustomers(query), listShippingDetailScada(query)]);

  overview.value = overviewRes.status === 'fulfilled' ? overviewRes.value.data || emptyOverview() : emptyOverview();
  hourlyTrend.value = trendRes.status === 'fulfilled' ? trendRes.value.data || [] : [];
  statusRatio.value = ratioRes.status === 'fulfilled' ? ratioRes.value.data || [] : [];
  topCustomers.value = topRes.status === 'fulfilled' ? topRes.value.data || [] : [];
  detailRows.value = listRes.status === 'fulfilled' ? listRes.value.data || [] : [];
  detailScrollKey.value += 1;
  await nextTick();
  renderCharts();
}

function renderCharts() {
  renderTrendChart();
  renderRatioChart();
}

function renderTrendChart() {
  if (!trendChartRef.value) return;
  if (!trendChart) trendChart = echarts.init(trendChartRef.value);
  const hours = hourlyTrend.value.map((item) => item.hourLabel || '');
  const normal = hourlyTrend.value.map((item) => Number(item.normalQty || 0));
  const abnormal = hourlyTrend.value.map((item) => Number(item.abnormalQty || 0));
  trendChart.setOption({
    backgroundColor: 'transparent',
    grid: { left: 54, right: 18, top: 22, bottom: 34 },
    tooltip: chartTooltip(),
    xAxis: {
      type: 'category',
      data: hours,
      axisLabel: { color: '#cfe9ff', fontSize: 13, interval: 1 },
      axisLine: { lineStyle: { color: 'rgba(121, 197, 255, 0.42)' } },
      axisTick: { show: false },
      splitLine: { show: true, lineStyle: { color: 'rgba(86, 165, 230, 0.14)' } }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: '#cfe9ff', fontSize: 13 },
      splitLine: { lineStyle: { color: 'rgba(86, 165, 230, 0.18)' } }
    },
    series: [
      {
        name: '正常',
        type: 'bar',
        stack: 'scan',
        barWidth: 18,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#3ec7ff' },
            { offset: 1, color: '#117fe8' }
          ])
        },
        data: normal
      },
      {
        name: '异常',
        type: 'bar',
        stack: 'scan',
        barWidth: 18,
        itemStyle: { color: '#ffb447', borderRadius: [4, 4, 0, 0] },
        data: abnormal
      }
    ]
  });
}

function renderRatioChart() {
  if (!ratioChartRef.value) return;
  if (!ratioChart) ratioChart = echarts.init(ratioChartRef.value);
  const total = normalizedStatusRatio.value.reduce((sum, item) => sum + item.qty, 0);
  ratioChart.setOption({
    backgroundColor: 'transparent',
    tooltip: chartTooltip('item'),
    title: {
      text: `{n|${formatNumber(total)}}\n{s|总扫码数}`,
      left: '38%',
      top: '40%',
      textAlign: 'center',
      textStyle: {
        rich: {
          n: { fontSize: 32, fontWeight: 800, color: '#ffffff', lineHeight: 38 },
          s: { fontSize: 15, color: '#d1eaff', lineHeight: 24 }
        }
      }
    },
    series: [
      {
        type: 'pie',
        radius: ['58%', '78%'],
        center: ['40%', '52%'],
        minAngle: 6,
        startAngle: 90,
        label: { show: false },
        labelLine: { show: false },
        data: normalizedStatusRatio.value.map((item) => ({
          name: item.name,
          value: item.qty,
          itemStyle: { color: item.color }
        }))
      }
    ]
  });
}

function chartTooltip(trigger: 'axis' | 'item' = 'axis') {
  return {
    trigger,
    backgroundColor: 'rgba(2, 14, 36, 0.94)',
    borderColor: 'rgba(71, 190, 255, 0.62)',
    borderWidth: 1,
    textStyle: { color: '#eaf7ff' }
  };
}

function updateClock() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  currentDateTime.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  currentWeekday.value = weekdays[now.getDay()];
  const currentDate = formatDate(now);
  if (settingsForm.autoUpdateDate && settingsForm.selectedDate !== currentDate) {
    settingsForm.selectedDate = currentDate;
    saveScrollSetting();
    void refreshAll();
  }
}

function resizeCanvas() {
  if (!boardRef.value) return;
  const { clientWidth, clientHeight } = boardRef.value;
  const scale = clientWidth / designWidth;
  viewport.scale = scale;
  viewport.left = 0;
  viewport.top = Math.max(0, (clientHeight - designHeight * scale) / 2);
  trendChart?.resize();
  ratioChart?.resize();
}

function toggleFullscreen() {
  const el = boardRef.value;
  if (!el) return;
  if (!document.fullscreenElement) {
    el.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement;
  nextTick(resizeCanvas);
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    Object.assign(settingsForm, parsed);
    settingsForm.selectedDate = settingsForm.selectedDate || todayDate();
    if (settingsForm.selectedDate > todayDate()) settingsForm.selectedDate = todayDate();
    if (settingsForm.autoUpdateDate) settingsForm.selectedDate = todayDate();
    stepVal.value = Number(settingsForm.scrollSpeed || 0.35);
  } catch {
    /* ignore invalid local settings */
  }
}

function handleAutoUpdateDateChange(enabled: boolean | string | number) {
  if (Boolean(enabled)) settingsForm.selectedDate = todayDate();
}

function saveScrollSetting() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsForm));
  stepVal.value = Number(settingsForm.scrollSpeed || 0.35);
  detailScrollKey.value += 1;
}

function saveSettings() {
  saveScrollSetting();
  restartRefreshTimer();
  showSettings.value = false;
  refreshAll();
}

function restartRefreshTimer() {
  if (refreshTimer) window.clearInterval(refreshTimer);
  refreshTimer = window.setInterval(refreshAll, Math.max(10, settingsForm.refreshInterval) * 1000);
}

function registerWebMcpTools() {
  const context = (document as Document & { modelContext?: WebMcpModelContext }).modelContext;
  if (!context?.registerTool) return;
  webMcpController = new AbortController();
  const tool = {
    name: 'set_shipping_detail_live_scroll',
    title: '设置明细实时滚动',
    description: '启用或暂停出货扫码明细的实时滚动，并同步更新看板上的可见状态。',
    inputSchema: {
      type: 'object',
      properties: { enabled: { type: 'boolean', description: 'true 启用实时滚动，false 暂停实时滚动' } },
      required: ['enabled'],
      additionalProperties: false
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    async execute(input: unknown) {
      if (!input || typeof input !== 'object' || typeof (input as { enabled?: unknown }).enabled !== 'boolean') {
        throw new TypeError('enabled 必须是布尔值');
      }
      settingsForm.enableScroll = (input as { enabled: boolean }).enabled;
      saveScrollSetting();
      await nextTick();
      return { enabled: settingsForm.enableScroll, status: settingsForm.enableScroll ? 'running' : 'paused' };
    }
  };
  try {
    void Promise.resolve(context.registerTool(tool, { signal: webMcpController.signal })).catch(() => webMcpController?.abort());
  } catch {
    webMcpController.abort();
  }
}

onMounted(async () => {
  tenantId.value = localStorage.getItem('tenantId') || '000000';
  loadSettings();
  updateClock();
  clockTimer = window.setInterval(updateClock, 1000);
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  registerWebMcpTools();
  await refreshAll();
  restartRefreshTimer();
});

onBeforeUnmount(() => {
  if (clockTimer) window.clearInterval(clockTimer);
  if (refreshTimer) window.clearInterval(refreshTimer);
  window.removeEventListener('resize', resizeCanvas);
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  webMcpController?.abort();
  trendChart?.dispose();
  ratioChart?.dispose();
});
</script>

<style lang="scss" scoped>
.shipping-board {
  position: relative;
  width: 100%;
  height: calc(100vh - 84px);
  min-height: 0;
  overflow: auto;
  color: #f3f9ff;
  background:
    linear-gradient(180deg, rgba(0, 8, 26, 0.08), rgba(0, 8, 26, 0.48)),
    url('@/assets/images/scada/shipping-dashboard/backgrounds/logistics-command-bg.png') center / cover no-repeat,
    #020915;
  font-family: 'Microsoft YaHei', Arial, sans-serif;

  &::before {
    position: absolute;
    inset: 0;
    content: '';
    pointer-events: none;
    background: linear-gradient(90deg, rgba(31, 161, 255, 0.08) 1px, transparent 1px), linear-gradient(0deg, rgba(31, 161, 255, 0.06) 1px, transparent 1px);
    background-size: 82px 82px;
    mask-image: linear-gradient(180deg, transparent 0, #000 16%, #000 86%, transparent 100%);
  }
}

.shipping-board.is-fullscreen,
.shipping-board:fullscreen {
  width: 100vw;
  height: 100vh;
}

.dashboard-stage {
  position: relative;
  flex: none;
  overflow: hidden;
}

.dashboard-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 1920px;
  height: 1080px;
  transform-origin: left top;
  padding: 14px 18px 16px;
  box-sizing: border-box;
}

.dashboard-header {
  position: relative;
  display: grid;
  grid-template-columns: minmax(360px, 1fr) minmax(560px, 1.25fr) minmax(360px, 1fr);
  align-items: center;
  height: 72px;
  overflow: hidden;
  border: 1px solid rgba(41, 168, 255, 0.58);
  border-radius: 10px;
  background: linear-gradient(90deg, rgba(8, 58, 116, 0.74), rgba(3, 25, 62, 0.42) 35%, rgba(3, 25, 62, 0.42) 65%, rgba(8, 58, 116, 0.74)), repeating-linear-gradient(120deg, transparent 0 88px, rgba(68, 181, 255, 0.045) 89px 90px), rgba(2, 19, 48, 0.9);
  box-shadow:
    inset 0 1px 0 rgba(157, 222, 255, 0.18),
    inset 0 -18px 28px rgba(0, 41, 92, 0.2),
    0 8px 26px rgba(0, 7, 28, 0.34),
    0 0 22px rgba(0, 144, 255, 0.14);

  &::before {
    position: absolute;
    top: 0;
    left: 6%;
    width: 88%;
    height: 1px;
    content: '';
    pointer-events: none;
    background: linear-gradient(90deg, transparent, rgba(78, 204, 255, 0.82) 24%, rgba(78, 204, 255, 0.82) 76%, transparent);
    box-shadow: 0 0 10px rgba(38, 185, 255, 0.72);
  }

  &::after {
    position: absolute;
    inset: 0;
    content: '';
    pointer-events: none;
    background: radial-gradient(circle at 0 50%, rgba(29, 173, 255, 0.15), transparent 24%), radial-gradient(circle at 100% 50%, rgba(29, 173, 255, 0.15), transparent 24%);
  }
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  min-width: 0;
  height: 100%;
}

.header-left {
  position: relative;
  z-index: 1;
  padding-left: 26px;

  &::after {
    width: 120px;
    height: 1px;
    margin-left: 18px;
    content: '';
    background: linear-gradient(90deg, rgba(53, 191, 255, 0.72), transparent);
    box-shadow: 0 0 8px rgba(35, 177, 255, 0.38);
  }
}

.header-right {
  position: relative;
  z-index: 1;
  justify-content: flex-end;
  gap: 16px;
  padding-right: 30px;

  &::before {
    width: 96px;
    height: 1px;
    content: '';
    background: linear-gradient(90deg, transparent, rgba(53, 191, 255, 0.68));
    box-shadow: 0 0 8px rgba(35, 177, 255, 0.34);
  }
}

.logo {
  height: 44px;
  border: 1px solid rgba(116, 205, 255, 0.46);
  border-radius: 4px;
  box-shadow:
    0 0 0 3px rgba(12, 91, 162, 0.16),
    0 0 18px rgba(42, 166, 255, 0.3);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow:
      0 0 0 3px rgba(12, 113, 198, 0.2),
      0 0 24px rgba(42, 185, 255, 0.44);
  }
}

.shipping-board:fullscreen .logo {
  height: 50px;
}

.header-title {
  position: relative;
  z-index: 1;
  justify-self: center;
  width: 540px;
  height: 62px;
  padding: 0;
  overflow: hidden;
  border: 0;
  color: #ffffff;
  background: linear-gradient(90deg, rgba(43, 176, 244, 0.26), rgba(93, 210, 255, 0.68) 18%, rgba(93, 210, 255, 0.68) 82%, rgba(43, 176, 244, 0.26));
  clip-path: polygon(7% 0, 93% 0, 100% 50%, 93% 100%, 7% 100%, 0 50%);
  cursor: pointer;
  text-align: center;
  filter: drop-shadow(0 5px 9px rgba(0, 13, 43, 0.38));

  &::before {
    position: absolute;
    inset: 1px;
    content: '';
    pointer-events: none;
    background:
      linear-gradient(180deg, rgba(17, 91, 164, 0.9), rgba(5, 43, 96, 0.95) 56%, rgba(3, 29, 72, 0.96)),
      radial-gradient(ellipse at center, rgba(50, 181, 255, 0.2), transparent 68%);
    clip-path: inherit;
  }

  &::after {
    position: absolute;
    right: 20%;
    bottom: 4px;
    left: 20%;
    height: 1px;
    content: '';
    pointer-events: none;
    background: linear-gradient(90deg, transparent, rgba(112, 218, 255, 0.76), transparent);
    box-shadow: 0 0 7px rgba(72, 196, 255, 0.38);
  }

  strong {
    position: relative;
    z-index: 1;
    display: block;
    margin-top: 5px;
    font-size: 30px;
    font-weight: 800;
    letter-spacing: 6px;
    line-height: 1.08;
    text-shadow:
      0 1px 0 rgba(255, 255, 255, 0.25),
      0 0 10px rgba(87, 188, 255, 0.34);
  }

  span {
    position: relative;
    z-index: 1;
    display: block;
    margin-top: 6px;
    color: #80c9ed;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 4.5px;
    text-shadow: none;
  }

  &:hover::before {
    background:
      linear-gradient(180deg, rgba(20, 106, 185, 0.92), rgba(6, 52, 111, 0.96) 56%, rgba(3, 33, 78, 0.97)),
      radial-gradient(ellipse at center, rgba(62, 190, 255, 0.24), transparent 68%);
  }
}

.time-icon {
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  color: #74ddff;
  border: 2px solid rgba(65, 190, 255, 0.7);
  border-radius: 50%;
  font-size: 26px;
  background: radial-gradient(circle, rgba(34, 157, 234, 0.18), rgba(3, 40, 87, 0.52));
  box-shadow:
    inset 0 0 14px rgba(72, 200, 255, 0.16),
    0 0 16px rgba(42, 166, 255, 0.34);
}

.time-block {
  display: flex;
  flex-direction: column;
  min-width: 230px;
  line-height: 1.25;
}

.current-time {
  color: #f2f8ff;
  font-size: 20px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.6px;
  text-shadow: 0 0 10px rgba(80, 192, 255, 0.3);
}

.weekday {
  color: #a9c8e9;
  font-size: 13px;
}

.date-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 2px;
  white-space: nowrap;
}

.selected-date {
  color: #6fe7ff;
  font-size: 14px;
  font-weight: 700;
}

.selected-date-weekday {
  color: #83b9dc;
  font-size: 13px;
}

.metric-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  height: 152px;
  margin-top: 14px;
}

.metric-card,
.dashboard-panel {
  position: relative;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, currentColor 52%, transparent);
  border-radius: 10px;
  background: rgba(2, 22, 50, 0.76);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    inset 0 0 32px color-mix(in srgb, currentColor 12%, transparent),
    0 8px 24px rgba(0, 8, 28, 0.32),
    0 0 16px color-mix(in srgb, currentColor 12%, transparent);

  &::before {
    position: absolute;
    top: 0;
    left: 10%;
    width: 80%;
    height: 1px;
    content: '';
    pointer-events: none;
    background: linear-gradient(90deg, transparent, currentColor 22%, currentColor 78%, transparent);
    opacity: 0.72;
    box-shadow: 0 0 10px currentColor;
  }

  &::after {
    position: absolute;
    inset: 0;
    content: '';
    pointer-events: none;
    background: radial-gradient(circle at 0 0, currentColor 0, transparent 24%), radial-gradient(circle at 100% 100%, currentColor 0, transparent 22%);
    opacity: 0.055;
  }
}

.metric-card {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr) 64px;
  align-items: center;
  gap: 14px;
  padding: 18px 20px 16px 30px;
  color: #25a8ff;
  background: linear-gradient(135deg, rgba(12, 103, 205, 0.48), rgba(2, 24, 58, 0.82));

  &.green {
    color: #2ee6a6;
    background: linear-gradient(135deg, rgba(11, 156, 110, 0.46), rgba(2, 44, 48, 0.78));
  }

  &.amber {
    color: #ffc04d;
    background: linear-gradient(135deg, rgba(180, 116, 24, 0.44), rgba(45, 30, 11, 0.76));
  }

  &.violet {
    color: #a36cff;
    background: linear-gradient(135deg, rgba(95, 57, 205, 0.48), rgba(28, 18, 75, 0.8));
  }
}

.metric-icon {
  display: grid;
  place-items: center;
  width: 96px;
  height: 96px;
  border: 4px solid currentColor;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
  box-shadow:
    inset 0 0 22px currentColor,
    0 0 18px color-mix(in srgb, currentColor 62%, transparent);

  img {
    width: 58px;
    height: 58px;
  }
}

.metric-main {
  min-width: 0;

  span {
    display: block;
    color: #f5fbff;
    font-size: 22px;
    font-weight: 800;
  }

  strong {
    display: block;
    margin-top: 8px;
    color: #fff;
    font-size: 46px;
    font-weight: 800;
    line-height: 1;
    text-shadow: 0 0 15px currentColor;
  }

  em {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 2px 6px;
    max-width: 100%;
    margin-top: 10px;
    color: #22ffc7;
    font-size: 17px;
    font-style: normal;
    font-weight: 800;
    line-height: 1.15;
    white-space: nowrap;

    &.down {
      color: #ff748e;
    }

    .trend-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 18px;
      font-size: 14px;
      font-style: normal;
      line-height: 1;
    }

    .compare-text,
    .compare-rate {
      min-width: 0;
    }
  }
}

.metric-spark {
  align-self: end;
  display: flex;
  align-items: flex-end;
  gap: 7px;
  height: 52px;

  i {
    width: 8px;
    background: currentColor;
    box-shadow: 0 0 10px currentColor;
  }

  i:nth-child(1) {
    height: 18px;
    opacity: 0.55;
  }

  i:nth-child(2) {
    height: 29px;
    opacity: 0.72;
  }

  i:nth-child(3) {
    height: 43px;
  }

  i:nth-child(4) {
    height: 34px;
    opacity: 0.82;
  }

  i:nth-child(5) {
    height: 48px;
  }
}

.middle-grid {
  display: grid;
  grid-template-columns: 1.05fr 1fr 1.28fr;
  gap: 14px;
  height: 306px;
  margin-top: 14px;
}

.dashboard-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  color: #2aa8ff;
}

.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  min-height: 48px;
  margin: 0;
  border-bottom: 0;
  padding: 12px 18px 0;
  line-height: normal;

  h2 {
    display: flex;
    align-items: center;
    margin: 0;
    color: #f5fbff;
    font-size: 24px;
    font-weight: 800;
    border-bottom: 0;
    text-decoration: none;
    text-shadow: 0 0 12px rgba(26, 152, 255, 0.52);

    &::before {
      width: 5px;
      height: 25px;
      margin-right: 12px;
      content: '';
      background: #2aa8ff;
      box-shadow: 0 0 12px #2aa8ff;
    }

    &::after {
      display: none;
      content: none;
    }
  }
}

.shipping-board .dashboard-panel > .panel-title {
  margin: 0;
  border-bottom: 0 !important;
  padding: 12px 18px 0;
}

.unit-label {
  margin: -2px 0 0 32px;
  color: #cde7f8;
  font-size: 14px;
}

.legend-inline {
  display: flex;
  gap: 24px;
  color: #d8eeff;
  font-size: 16px;

  span {
    position: relative;
    padding-left: 20px;
  }

  span::before {
    position: absolute;
    top: 5px;
    left: 0;
    width: 13px;
    height: 13px;
    content: '';
    border-radius: 50%;
  }

  .normal::before {
    background: #2aa8ff;
  }

  .abnormal::before {
    background: #ffc04d;
  }
}

.panel-body {
  flex: 1;
  min-height: 0;
  padding: 8px 16px 16px;
}

.chart {
  width: 100%;
  height: 100%;
}

.ratio-body {
  display: grid;
  grid-template-columns: 1.08fr 0.92fr;
  gap: 10px;
}

.ratio-legend {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20px;
  margin: 0;
  padding: 0 12px 0 0;
  list-style: none;

  li {
    display: grid;
    grid-template-columns: 16px minmax(52px, 1fr) 66px 72px;
    align-items: center;
    gap: 10px;
    color: #f2f8ff;
    font-size: 18px;
  }

  i {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    box-shadow: 0 0 10px currentColor;
  }

  strong,
  em {
    text-align: right;
  }

  em {
    color: #d1eaff;
    font-style: normal;
  }
}

.top-list {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
  gap: 18px;
  min-height: 0;
  padding: 8px 32px 22px;
}

.top-row {
  display: grid;
  grid-template-columns: 36px minmax(210px, 1fr) minmax(220px, 0.9fr) 72px;
  align-items: center;
  gap: 18px;
  color: #f5fbff;
  font-size: 16px;
}

.top-index,
.top-row strong {
  font-weight: 800;
  text-align: right;
}

.top-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top-bar {
  height: 24px;
  background: rgba(21, 96, 164, 0.42);

  i {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #1b8eef, #29c4ff);
    box-shadow: 0 0 12px rgba(35, 181, 255, 0.52);
  }
}

.detail-panel {
  height: 466px;
  margin-top: 14px;
}

.detail-table-wrap {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 10px 12px 14px;
}

.detail-row {
  display: grid;
  grid-template-columns: 58px 190px 126px 1.25fr 1fr 1.35fr 86px 1fr 1.08fr 1.8fr;
  align-items: center;
  gap: 12px;
  min-height: 32px;
  padding: 0 12px;
  color: #f0f8ff;
  font-size: 15px;

  > span {
    min-width: 0;
    text-align: center;
  }
}

.detail-head {
  min-height: 42px;
  color: #f5fbff;
  font-weight: 800;
  background: linear-gradient(180deg, rgba(31, 126, 202, 0.54), rgba(18, 77, 135, 0.48));
}

.detail-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;

  .detail-row:nth-child(odd) {
    background: rgba(16, 76, 132, 0.34);
  }

  .detail-row:nth-child(even) {
    background: rgba(7, 37, 82, 0.45);
  }
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 58px;
  height: 24px;
  border: 1px solid currentColor;
  border-radius: 5px;
  font-size: 14px;
  font-style: normal;
  font-weight: 800;
}

.status-tag.normal {
  color: #27e6a6;
  background: rgba(39, 230, 166, 0.16);
}

.status-tag.abnormal {
  color: #ff6f62;
  background: rgba(255, 111, 98, 0.18);
}

.empty-state {
  display: grid;
  place-items: center;
  height: 100%;
  color: #91c4ea;
  font-size: 16px;
}

.setting-suffix {
  margin-left: 8px;
}

.shipping-config-dialog :deep(.el-dialog) {
  background: #0f1936;
  border: 1px solid rgba(0, 160, 255, 0.28);
}

.shipping-config-dialog :deep(.el-dialog__header),
.shipping-config-dialog :deep(.el-dialog__footer) {
  background: #0f1936;
}

.shipping-config-dialog :deep(.el-dialog__title),
.shipping-config-dialog :deep(.el-form-item__label) {
  color: #f2f8ff;
}

.shipping-config-dialog :deep(.el-dialog__body) {
  color: #e8f4ff;
  background: #0f1936;
}
</style>
