<template>
  <main ref="boardRef" class="dashboard-shell">
    <div class="dashboard-canvas" :style="canvasStyle">
      <header class="dashboard-header">
        <section class="brand-block">
          <div class="brand-logo" @click="toggleFullscreen">KEMFLO</div>
          <i class="brand-divider"></i>
          <div class="title-wrap" @click="showSettings = true">
            <h1>容器管理大屏</h1>
            <span>CONTAINER MANAGEMENT DASHBOARD</span>
          </div>
        </section>

        <div class="header-decoration" aria-hidden="true">
          <i></i><i></i><i></i>
          <span>SMART CONTAINER · DIGITAL LOGISTICS · CUSTOMER {{ dashboardCustomerCode }}</span>
        </div>

        <section class="time-panel">
          <span class="clock-icon"></span>
          <div>
            <strong>{{ currentDateTime }}</strong>
            <span>{{ currentWeekday }}</span>
          </div>
          <button class="fullscreen-btn" type="button" title="全屏" @click="toggleFullscreen"><span></span><span></span><span></span><span></span></button>
        </section>
      </header>

      <section class="metric-row">
        <article v-for="card in metrics" :key="card.title" :class="['metric-card', card.tone]">
          <div class="metric-icon"><img :src="iconMap[card.icon]" :alt="card.title" /></div>
          <div class="metric-content">
            <span>{{ card.title }}</span>
            <small>{{ card.en }}</small>
            <strong>{{ card.value }}</strong>
            <em :class="{ down: card.down }">较昨日　{{ card.down ? '▼' : '▲' }} {{ card.rate }}</em>
          </div>
        </article>
      </section>

      <section class="middle-grid">
        <DashboardPanel title="出入库趋势" subtitle="INBOUND / OUTBOUND TREND" class="trend-panel">
          <template #extra>
            <div class="period-tabs">
              <button :class="{ active: periodDays === 7 }" type="button" @click="changePeriod(7)">7天</button>
              <button :class="{ active: periodDays === 30 }" type="button" @click="changePeriod(30)">30天</button>
              <button :class="{ active: periodDays === 0 }" type="button" @click="openCustomPeriod">自定义</button>
            </div>
          </template>
          <div ref="flowChartRef" class="chart trend-chart"></div>
        </DashboardPanel>

        <DashboardPanel title="容器类型分布" subtitle="CONTAINER TYPE DISTRIBUTION" class="type-panel">
          <div class="distribution-wrap">
            <div ref="typeChartRef" class="chart donut-chart"></div>
            <ul class="type-list">
              <li v-for="item in typeDistribution" :key="item.key">
                <i :style="{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}` }"></i>
                <span :title="item.name">{{ item.name }}</span>
                <strong>{{ formatNumber(item.value) }}</strong>
                <em>{{ item.percent }}</em>
              </li>
            </ul>
          </div>
        </DashboardPanel>
      </section>

      <section class="bottom-grid">
        <DashboardPanel title="容器库存明细" subtitle="CONTAINER INVENTORY" class="inventory-panel">
          <template #extra><button class="text-link" type="button" @click="showSettings = true">查看更多 →</button></template>
          <div class="container-list">
            <article v-for="item in inventoryCards" :key="item.key" class="container-card">
              <div class="product-wrap"><img :src="item.product" :alt="item.name" /></div>
              <strong :title="item.name">{{ item.name }}</strong>
              <span>{{ item.code }}</span>
              <b>{{ formatNumber(item.value) }}</b>
              <div class="progress-row">
                <div><i :style="{ width: item.percent, background: item.color, boxShadow: `0 0 12px ${item.color}` }"></i></div>
                <em>{{ item.percent }}</em>
              </div>
            </article>
            <div v-if="inventoryCards.length === 0" class="empty-state">暂无库存数据</div>
          </div>
        </DashboardPanel>

        <DashboardPanel title="今日出入库TOP10" subtitle="TOP 10 INBOUND/OUTBOUND TODAY" class="rank-panel">
          <template #extra>
            <div class="rank-tabs">
              <button :class="{ active: rankMode === 'inbound' }" type="button" @click="rankMode = 'inbound'">入库 TOP10</button>
              <button :class="{ active: rankMode === 'outbound' }" type="button" @click="rankMode = 'outbound'">出库 TOP10</button>
            </div>
          </template>
          <table class="data-table rank-table">
            <thead>
              <tr>
                <th>排名</th>
                <th>容器名称</th>
                <th>数量</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in topList" :key="`${rankMode}-${item.name}`">
                <td>
                  <span :class="['rank-badge', `rank-${index + 1}`]">{{ index + 1 }}</span>
                </td>
                <td class="ellipsis">{{ item.name }}</td>
                <td>{{ formatNumber(item.value) }}</td>
              </tr>
              <tr v-if="topList.length === 0">
                <td colspan="3" class="empty-cell">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </DashboardPanel>

        <DashboardPanel title="异常预警" subtitle="EXCEPTION ALERT" class="alert-panel">
          <template #extra><button class="text-link" type="button" @click="showSettings = true">查看更多 →</button></template>
          <div class="alert-scroll">
            <div class="alert-head alert-row"><span>容器名称</span><span>伙伴名称</span><span>入库</span><span>出库</span><span>差异</span></div>
            <div class="alert-body">
              <Vue3SeamlessScroll v-if="showScroll && exceptionRows.length > settingsForm.displayLimit" :key="diffScrollKey" :list="exceptionRows" :visible-count="settingsForm.displayLimit" :hover="true" :step="stepVal" :wheel="true">
                <template #default="{ data: row }">
                  <div class="alert-row">
                    <span class="ellipsis">{{ row.itemName || '-' }}</span
                    ><span class="ellipsis">{{ row.businessName || '-' }}</span
                    ><span>{{ row.inboundQuantity || 0 }}</span
                    ><span>{{ row.outboundQuantity || 0 }}</span
                    ><span :class="getDiffClass(row.diffQuantity)">{{ row.diffQuantity || 0 }}</span>
                  </div>
                </template>
              </Vue3SeamlessScroll>
              <template v-else>
                <div v-for="row in exceptionRows" :key="`${row.itemCode}-${row.businessCode}`" class="alert-row">
                  <span class="ellipsis">{{ row.itemName || '-' }}</span
                  ><span class="ellipsis">{{ row.businessName || '-' }}</span
                  ><span>{{ row.inboundQuantity || 0 }}</span
                  ><span>{{ row.outboundQuantity || 0 }}</span
                  ><span :class="getDiffClass(row.diffQuantity)">{{ row.diffQuantity || 0 }}</span>
                </div>
                <div v-if="exceptionRows.length === 0" class="empty-state compact">暂无异常数据</div>
              </template>
            </div>
          </div>
        </DashboardPanel>
      </section>

      <footer class="dashboard-footer">
        <div v-for="item in footerStats" :key="item.label" class="footer-stat">
          <img :src="iconMap[item.icon]" :alt="item.label" />
          <span>{{ item.label }}</span
          ><strong>{{ item.value }}</strong>
        </div>
        <p>KEMFLO&nbsp;&nbsp;|&nbsp;&nbsp;智能制造&nbsp;&nbsp;数字物流</p>
      </footer>
    </div>

    <el-dialog v-model="showSettings" title="看板设置" width="620px" append-to-body>
      <el-form ref="queryFormRef" :model="queryParams" label-width="110px">
        <el-form-item label="显示数量"><el-slider v-model="settingsForm.displayLimit" :min="5" :max="30" show-input /></el-form-item>
        <el-form-item label="滚动速度"><el-slider v-model="settingsForm.scrollSpeed" :min="0.1" :max="2" :step="0.1" show-input /></el-form-item>
        <el-form-item label="刷新间隔"><el-input-number v-model="settingsForm.refreshInterval" :min="10" :max="300" :step="5" /> 秒</el-form-item>
        <el-form-item label="容器编码" prop="itemCode"><el-input v-model.trim="queryParams.itemCode" clearable /></el-form-item>
        <el-form-item label="仓库编码" prop="warehouseCode"><el-input v-model.trim="queryParams.warehouseCode" clearable /></el-form-item>
        <el-form-item label="客户编码" prop="businessCode"><el-input v-model="queryParams.businessCode" disabled /></el-form-item>
        <el-form-item label="移动时间" prop="dateTimeRange">
          <el-date-picker v-model="queryParams.dateTimeRange" type="datetimerange" value-format="YYYY-MM-DD HH:mm:ss" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="showSettings = false">取消</el-button><el-button @click="resetQuery">重置</el-button><el-button type="primary" @click="saveSettings">保存</el-button></template>
    </el-dialog>
  </main>
</template>

<script setup name="ScadaContainerBoard" lang="ts">
import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, reactive, ref, toRefs, watch } from 'vue';
import * as echarts from 'echarts';
import { Vue3SeamlessScroll } from 'vue3-seamless-scroll';
import { listContainerDiff, listContainerInventory, listContainerMovement } from '@/api/scada/container';
import type { ContainerDiffQuery, ContainerDiffVO, ContainerMovementVO } from '@/api/scada/container/types';
import type { InventoryDetailQuery, InventoryDetailVO } from '@/api/wms/inventoryDetail/types';

import customerIcon from '@/assets/images/scada/container-dashboard/icons/customer.svg';
import inboundIcon from '@/assets/images/scada/container-dashboard/icons/inbound.svg';
import insideFactoryIcon from '@/assets/images/scada/container-dashboard/icons/insideFactory.svg';
import inventoryIcon from '@/assets/images/scada/container-dashboard/icons/inventory.svg';
import outboundIcon from '@/assets/images/scada/container-dashboard/icons/outbound.svg';
import outsideFactoryIcon from '@/assets/images/scada/container-dashboard/icons/outsideFactory.svg';
import scrapIcon from '@/assets/images/scada/container-dashboard/icons/scrap.svg';
import turnoverIcon from '@/assets/images/scada/container-dashboard/icons/turnover.svg';
import warningIcon from '@/assets/images/scada/container-dashboard/icons/warning.svg';
import plasticCrateBlue from '@/assets/images/scada/container-dashboard/products/plasticCrateBlue.png';
import plasticCrateGreen from '@/assets/images/scada/container-dashboard/products/plasticCrateGreen.png';
import metalCage from '@/assets/images/scada/container-dashboard/products/metalCage.png';
import metalPallet from '@/assets/images/scada/container-dashboard/products/metalPallet.png';

type RankMode = 'inbound' | 'outbound';
type IconName = 'customer' | 'inbound' | 'insideFactory' | 'inventory' | 'outbound' | 'outsideFactory' | 'scrap' | 'turnover' | 'warning';

interface TypeItem {
  key: string;
  name: string;
  code: string;
  value: number;
  percent: string;
  color: string;
  product: string;
}

const dashboardCustomerCode = '802N11569';
const designWidth = 1920;
const designHeight = 987;
const maxStatisticPageSize = 50000;
const palette = ['#36e1bb', '#248fff', '#ffad43', '#55d9f7', '#ffc34f'];
const productImages = [plasticCrateBlue, plasticCrateGreen, plasticCrateBlue, metalCage, metalPallet];

const DashboardPanel = defineComponent({
  name: 'DashboardPanel',
  props: { title: { type: String, required: true }, subtitle: { type: String, required: true } },
  setup(props, { slots }) {
    return () => h('section', { class: 'dashboard-panel' }, [h('header', { class: 'panel-title' }, [h('div', [h('h2', props.title), h('span', props.subtitle)]), slots.extra?.()]), h('div', { class: 'panel-body' }, slots.default?.())]);
  }
});

const iconMap: Record<IconName, string> = {
  customer: customerIcon,
  inbound: inboundIcon,
  insideFactory: insideFactoryIcon,
  inventory: inventoryIcon,
  outbound: outboundIcon,
  outsideFactory: outsideFactoryIcon,
  scrap: scrapIcon,
  turnover: turnoverIcon,
  warning: warningIcon
};

const boardRef = ref<HTMLElement>();
const queryFormRef = ref<ElFormInstance>();
const flowChartRef = ref<HTMLElement>();
const typeChartRef = ref<HTMLElement>();
const diffList = ref<ContainerDiffVO[]>([]);
const inventoryList = ref<InventoryDetailVO[]>([]);
const movementList = ref<ContainerMovementVO[]>([]);
const statsMovementList = ref<ContainerMovementVO[]>([]);
const currentDateTime = ref('');
const periodDays = ref(7);
const rankMode = ref<RankMode>('inbound');
const showSettings = ref(false);
const showScroll = ref(true);
const stepVal = ref(0.35);
const diffScrollKey = ref(0);
const viewport = reactive({ scale: 1, left: 0, top: 0 });
let clockTimer: number | undefined;
let refreshTimer: number | undefined;
let flowChart: echarts.ECharts | undefined;
let typeChart: echarts.ECharts | undefined;

const settingsForm = reactive({ displayLimit: 9, scrollSpeed: 0.35, refreshInterval: 30 });
const data = reactive<PageData<Record<string, never>, ContainerDiffQuery>>({
  form: {},
  queryParams: { pageNum: 1, pageSize: 50, itemCode: undefined, warehouseCode: undefined, businessCode: dashboardCustomerCode, dateTimeRange: undefined, params: {} },
  rules: {}
});
const { queryParams } = toRefs(data);
const inventoryQuery = ref<InventoryDetailQuery>({ pageNum: 1, pageSize: maxStatisticPageSize, itemCode: undefined, warehouseCode: undefined, businessCode: dashboardCustomerCode, params: {} });

const canvasStyle = computed(() => ({ transform: `scale(${viewport.scale})`, left: `${viewport.left}px`, top: `${viewport.top}px` }));
const currentWeekday = computed(() => ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][new Date().getDay()]);
const sum = (rows: unknown[], field: string) => rows.reduce((total, row) => total + Number((row as Record<string, unknown>)[field] || 0), 0);
const formatNumber = (value: number) => Number(value || 0).toLocaleString('zh-CN');
const getInventoryQuantity = (row: InventoryDetailVO) => Number(row.availableQuantity || 0) + Number(row.inspectionQuantity || 0) + Number(row.blockedQuantity || 0);

const stats = computed(() => {
  const inboundTotal = statsMovementList.value.filter((item) => Number(item.inventoryDirection) === 1).reduce((total, item) => total + Number(item.quantity || 0), 0);
  const outboundTotal = statsMovementList.value.filter((item) => Number(item.inventoryDirection) === -1).reduce((total, item) => total + Number(item.quantity || 0), 0);
  const inventoryTotal = sum(inventoryList.value, 'availableQuantity') + sum(inventoryList.value, 'inspectionQuantity') + sum(inventoryList.value, 'blockedQuantity');
  return { inventoryTotal, inboundTotal, outboundTotal, diffTotal: inboundTotal - outboundTotal, turnoverRate: outboundTotal > 0 ? (outboundTotal / Math.max(inboundTotal, 1)) * 100 : 0 };
});

const metrics = computed(() => [
  { title: '当前库存', en: 'TOTAL INVENTORY', value: formatNumber(stats.value.inventoryTotal), icon: 'inventory' as IconName, tone: 'blue', rate: '+2.3%' },
  { title: '入库数量', en: 'INBOUND', value: formatNumber(stats.value.inboundTotal), icon: 'inbound' as IconName, tone: 'green', rate: '+5.8%' },
  { title: '出库数量', en: 'OUTBOUND', value: formatNumber(stats.value.outboundTotal), icon: 'outbound' as IconName, tone: 'amber', rate: '-3.1%', down: true },
  { title: '差异数量', en: 'DIFFERENCE', value: formatNumber(stats.value.diffTotal), icon: 'warning' as IconName, tone: 'red', rate: '-8.6%', down: stats.value.diffTotal < 0 },
  { title: '容器周转率', en: 'TURNOVER RATE', value: `${stats.value.turnoverRate.toFixed(1)}%`, icon: 'turnover' as IconName, tone: 'violet', rate: '+1.5%' }
]);

const inventoryCards = computed<TypeItem[]>(() => {
  const grouped = new Map<string, { name: string; code: string; value: number }>();
  inventoryList.value.forEach((row) => {
    const code = row.itemCode || '-';
    const current = grouped.get(code) || { name: row.itemName || code, code, value: 0 };
    current.value += getInventoryQuantity(row);
    grouped.set(code, current);
  });
  const rows = Array.from(grouped.values())
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  const total = rows.reduce((amount, item) => amount + item.value, 0);
  return rows.map((item, index) => ({ ...item, key: item.code, color: palette[index], percent: total ? `${((item.value / total) * 100).toFixed(1)}%` : '0%', product: productImages[index] }));
});
const typeDistribution = computed(() => inventoryCards.value);

const topList = computed(() => {
  const grouped = new Map<string, number>();
  movementList.value.filter((item) => Number(item.inventoryDirection) === (rankMode.value === 'inbound' ? 1 : -1)).forEach((item) => grouped.set(item.itemName || item.moveType || '-', (grouped.get(item.itemName || item.moveType || '-') || 0) + Number(item.quantity || 0)));
  return Array.from(grouped, ([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
});

const exceptionRows = computed(() =>
  diffList.value
    .filter((item) => Number(item.diffQuantity || 0) !== 0)
    .sort((a, b) => Math.abs(Number(b.diffQuantity || 0)) - Math.abs(Number(a.diffQuantity || 0)))
    .slice(0, 50)
);
const footerStats = computed(() => {
  const customerTotal = new Set(inventoryList.value.map((item) => item.businessCode).filter(Boolean)).size;
  const outside = inventoryList.value.filter((item) => Boolean(item.businessCode) && item.warehouseCode === item.businessCode).reduce((total, item) => total + getInventoryQuantity(item), 0);
  const scrap = inventoryList.value.filter((item) => Number(item.status) === 3).reduce((total, item) => total + getInventoryQuantity(item), 0);
  return [
    { label: '客户总数', value: formatNumber(customerTotal), icon: 'customer' as IconName },
    { label: '厂内容器', value: formatNumber(Math.max(stats.value.inventoryTotal - outside, 0)), icon: 'insideFactory' as IconName },
    { label: '场外容器', value: formatNumber(outside), icon: 'outsideFactory' as IconName },
    { label: '报废容器', value: formatNumber(scrap), icon: 'scrap' as IconName },
    { label: '异常容器', value: formatNumber(Math.abs(stats.value.diffTotal)), icon: 'warning' as IconName }
  ];
});

function getDiffClass(value: number) {
  const diff = Number(value || 0);
  return diff > 0 ? 'diff-positive' : diff < 0 ? 'diff-negative' : 'diff-zero';
}
const formatDateTime = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};
const getDateRange = (days: number) => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);
  return [formatDateTime(start), formatDateTime(end)];
};

const buildInventoryQuery = () => {
  inventoryQuery.value.itemCode = queryParams.value.itemCode;
  inventoryQuery.value.warehouseCode = queryParams.value.warehouseCode;
  inventoryQuery.value.businessCode = dashboardCustomerCode;
  return { ...inventoryQuery.value, itemType: 3 };
};
const movementQuery = (allTime = false) => ({ ...queryParams.value, businessCode: dashboardCustomerCode, dateTimeRange: allTime ? undefined : queryParams.value.dateTimeRange, pageNum: 1, pageSize: maxStatisticPageSize });

async function refreshAll() {
  const [diffResult, inventoryResult, movementResult, statsResult] = await Promise.allSettled([listContainerDiff({ ...queryParams.value, businessCode: dashboardCustomerCode }), listContainerInventory(buildInventoryQuery()), listContainerMovement(movementQuery()), listContainerMovement(movementQuery(true))]);
  diffList.value = diffResult.status === 'fulfilled' ? diffResult.value.rows || [] : [];
  inventoryList.value = inventoryResult.status === 'fulfilled' ? inventoryResult.value.rows || [] : [];
  movementList.value = movementResult.status === 'fulfilled' ? (movementResult.value.rows || []).filter((item) => !item.warehouseCode || !item.businessCode || item.warehouseCode !== item.businessCode) : [];
  statsMovementList.value = statsResult.status === 'fulfilled' ? (statsResult.value.rows || []).filter((item) => !item.warehouseCode || !item.businessCode || item.warehouseCode !== item.businessCode) : [];
  diffScrollKey.value += 1;
  await nextTick();
  renderCharts();
}

function changePeriod(days: number) {
  periodDays.value = days;
  queryParams.value.dateTimeRange = getDateRange(days);
  refreshAll();
}
function openCustomPeriod() {
  periodDays.value = 0;
  showSettings.value = true;
}
function resetQuery() {
  queryFormRef.value?.resetFields();
  queryParams.value.itemCode = undefined;
  queryParams.value.warehouseCode = undefined;
  queryParams.value.businessCode = dashboardCustomerCode;
  periodDays.value = 7;
  queryParams.value.dateTimeRange = getDateRange(7);
  showSettings.value = false;
  refreshAll();
}
function saveSettings() {
  queryParams.value.businessCode = dashboardCustomerCode;
  stepVal.value = settingsForm.scrollSpeed;
  localStorage.setItem('scadaContainerBoardSettings', JSON.stringify(settingsForm));
  showSettings.value = false;
  resetRefreshTimer();
  refreshAll();
}
function resetRefreshTimer() {
  if (refreshTimer) window.clearInterval(refreshTimer);
  refreshTimer = window.setInterval(refreshAll, settingsForm.refreshInterval * 1000);
}

function renderFlowChart() {
  if (!flowChartRef.value) return;
  flowChart ||= echarts.init(flowChartRef.value);
  const grouped = new Map<string, { inbound: number; outbound: number }>();
  movementList.value.forEach((item) => {
    const date = String(item.moveDate || '').slice(0, 10);
    if (!date) return;
    const row = grouped.get(date) || { inbound: 0, outbound: 0 };
    if (Number(item.inventoryDirection) === 1) row.inbound += Number(item.quantity || 0);
    if (Number(item.inventoryDirection) === -1) row.outbound += Number(item.quantity || 0);
    grouped.set(date, row);
  });
  const rows = Array.from(grouped, ([date, value]) => ({ date, ...value, diff: value.inbound - value.outbound })).sort((a, b) => a.date.localeCompare(b.date));
  flowChart.setOption(
    {
      animationDuration: 900,
      color: ['#38ddb9', '#ffad43', '#36aaff'],
      tooltip: { trigger: 'axis', backgroundColor: 'rgba(3,25,51,.96)', borderColor: '#19b8f1', textStyle: { color: '#eaf8ff' } },
      legend: { top: 13, right: 32, itemWidth: 18, itemHeight: 9, textStyle: { color: '#c9e8fa', fontSize: 13 }, data: ['入库', '出库', '差异'] },
      grid: { left: 54, right: 26, top: 54, bottom: 36 },
      xAxis: { type: 'category', data: rows.map((item) => item.date), axisTick: { show: false }, axisLine: { lineStyle: { color: '#397496' } }, axisLabel: { color: '#bed9ed', fontSize: 12 } },
      yAxis: { type: 'value', name: '数量', nameTextStyle: { color: '#a7cfe7', padding: [0, 30, 0, 0] }, axisLabel: { color: '#bed9ed' }, splitLine: { lineStyle: { color: 'rgba(89,170,216,.16)' } } },
      series: [
        { name: '入库', type: 'bar', barWidth: 26, data: rows.map((item) => item.inbound), itemStyle: { borderRadius: [3, 3, 0, 0], shadowBlur: 8, shadowColor: 'rgba(54,225,187,.28)' } },
        { name: '出库', type: 'bar', barWidth: 26, data: rows.map((item) => item.outbound), itemStyle: { borderRadius: [3, 3, 0, 0], shadowBlur: 8, shadowColor: 'rgba(255,173,67,.28)' } },
        { name: '差异', type: 'line', smooth: false, symbol: 'circle', symbolSize: 8, lineStyle: { width: 2 }, itemStyle: { borderColor: '#e6f7ff', borderWidth: 2 }, data: rows.map((item) => item.diff) }
      ]
    },
    true
  );
}

function renderTypeChart() {
  if (!typeChartRef.value) return;
  typeChart ||= echarts.init(typeChartRef.value);
  const rows = typeDistribution.value;
  typeChart.setOption(
    {
      color: rows.map((item) => item.color),
      tooltip: { trigger: 'item', backgroundColor: 'rgba(3,25,51,.96)', borderColor: '#19b8f1', textStyle: { color: '#eaf8ff' } },
      graphic: [
        { type: 'text', left: 'center', top: '40%', style: { text: formatNumber(stats.value.inventoryTotal), fill: '#fff', font: '700 28px DIN, Arial', textAlign: 'center', textShadowBlur: 8, textShadowColor: '#38bfff' } },
        { type: 'text', left: 'center', top: '55%', style: { text: '总数量', fill: '#a9cee5', font: '14px Microsoft YaHei', textAlign: 'center' } }
      ],
      series: [{ type: 'pie', radius: ['48%', '73%'], center: ['50%', '50%'], startAngle: 90, minAngle: 4, label: { show: false }, labelLine: { show: false }, data: rows.map((item) => ({ name: item.name, value: item.value })), itemStyle: { borderColor: 'rgba(2,22,46,.32)', borderWidth: 1 } }]
    },
    true
  );
}
function renderCharts() {
  renderFlowChart();
  renderTypeChart();
}
function fitCanvas() {
  viewport.scale = Math.min(window.innerWidth / designWidth, window.innerHeight / designHeight);
  viewport.left = Math.max((window.innerWidth - designWidth * viewport.scale) / 2, 0);
  viewport.top = Math.max((window.innerHeight - designHeight * viewport.scale) / 2, 0);
  nextTick(() => {
    flowChart?.resize();
    typeChart?.resize();
  });
}
function toggleFullscreen() {
  if (!document.fullscreenElement) boardRef.value?.requestFullscreen?.();
  else document.exitFullscreen?.();
  setTimeout(fitCanvas, 250);
}
function updateTime() {
  currentDateTime.value = formatDateTime(new Date());
}

watch(inventoryCards, () => nextTick(renderTypeChart));
onMounted(() => {
  const saved = localStorage.getItem('scadaContainerBoardSettings');
  if (saved) Object.assign(settingsForm, JSON.parse(saved));
  stepVal.value = settingsForm.scrollSpeed;
  queryParams.value.businessCode = dashboardCustomerCode;
  queryParams.value.dateTimeRange = getDateRange(7);
  updateTime();
  fitCanvas();
  clockTimer = window.setInterval(updateTime, 1000);
  resetRefreshTimer();
  window.addEventListener('resize', fitCanvas);
  refreshAll();
});
onBeforeUnmount(() => {
  if (clockTimer) window.clearInterval(clockTimer);
  if (refreshTimer) window.clearInterval(refreshTimer);
  window.removeEventListener('resize', fitCanvas);
  flowChart?.dispose();
  typeChart?.dispose();
});
</script>

<style lang="scss" scoped>
.dashboard-shell {
  position: fixed;
  inset: 0;
  z-index: 2200;
  overflow: hidden;
  color: #eaf8ff;
  background: #010b1a;
  font-family: DIN, Bahnschrift, 'Microsoft YaHei', Arial, sans-serif;
}

.dashboard-canvas {
  position: absolute;
  width: 1920px;
  height: 987px;
  padding: 8px 16px 0;
  overflow: hidden;
  transform-origin: left top;
  box-sizing: border-box;
  background: linear-gradient(rgba(13, 73, 119, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(13, 73, 119, 0.05) 1px, transparent 1px), radial-gradient(circle at 76% 18%, rgba(0, 135, 255, 0.2), transparent 24%), radial-gradient(circle at 13% 80%, rgba(0, 208, 255, 0.12), transparent 22%), linear-gradient(180deg, #041a37 0%, #031329 58%, #021124 100%);
  background-size:
    36px 36px,
    36px 36px,
    auto,
    auto,
    auto;
}

.dashboard-header {
  position: relative;
  height: 66px;
  display: grid;
  grid-template-columns: 520px 1fr 330px;
  align-items: center;
  border-bottom: 1px solid rgba(29, 170, 240, 0.68);
  background: linear-gradient(180deg, rgba(6, 37, 72, 0.94), rgba(3, 22, 46, 0.78));
  box-shadow:
    0 7px 18px rgba(0, 118, 205, 0.14),
    inset 0 -8px 20px rgba(0, 155, 255, 0.08);
}
.dashboard-header::after {
  position: absolute;
  left: 520px;
  right: 335px;
  bottom: -1px;
  height: 2px;
  content: '';
  background: linear-gradient(90deg, transparent, #13d4ff 28%, rgba(19, 212, 255, 0.25) 72%, transparent);
}
.brand-block {
  display: flex;
  align-items: center;
  height: 100%;
}
.brand-logo {
  width: 186px;
  height: 48px;
  display: grid;
  place-items: center;
  border: 1px solid #0abfff;
  border-radius: 6px;
  color: #fff;
  font-size: 32px;
  font-weight: 900;
  font-style: italic;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #087bbb, #092856 78%);
  box-shadow:
    0 0 18px rgba(15, 190, 255, 0.44),
    inset 0 0 20px rgba(32, 159, 255, 0.28);
  cursor: pointer;
  text-shadow: 0 0 8px #55caff;
}
.brand-divider {
  width: 2px;
  height: 43px;
  margin: 0 26px 0 10px;
  background: linear-gradient(transparent, #14d4ff 18%, #14d4ff 82%, transparent);
  box-shadow: 0 0 8px #14d4ff;
}
.title-wrap {
  cursor: pointer;
}
.title-wrap h1 {
  margin: 0 0 2px;
  color: #f3fbff;
  font-size: 27px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: 7px;
  text-shadow: 0 0 8px rgba(90, 188, 255, 0.28);
}
.title-wrap span {
  color: #18beff;
  font-size: 11px;
  letter-spacing: 1px;
}
.header-decoration {
  position: relative;
  align-self: stretch;
  overflow: hidden;
  color: rgba(79, 199, 255, 0.44);
  text-align: center;
}
.header-decoration::before,
.header-decoration::after {
  position: absolute;
  top: 12px;
  width: 42%;
  height: 36px;
  content: '';
  border-top: 1px solid rgba(24, 178, 243, 0.42);
  border-bottom: 1px solid rgba(24, 178, 243, 0.18);
  transform: skewX(-36deg);
}
.header-decoration::before {
  left: 5%;
  border-left: 1px solid rgba(24, 178, 243, 0.42);
}
.header-decoration::after {
  right: 5%;
  border-right: 1px solid rgba(24, 178, 243, 0.42);
}
.header-decoration i {
  position: relative;
  z-index: 1;
  display: inline-block;
  width: 4px;
  height: 4px;
  margin: 15px 5px 0;
  border-radius: 50%;
  background: #21cfff;
  box-shadow: 0 0 8px #21cfff;
}
.header-decoration span {
  position: relative;
  z-index: 1;
  display: block;
  margin-top: 6px;
  font-size: 10px;
  letter-spacing: 2px;
}
.time-panel {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 14px;
  padding-right: 12px;
}
.clock-icon {
  position: relative;
  width: 28px;
  height: 28px;
  border: 3px solid #72cfff;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(67, 190, 255, 0.32);
}
.clock-icon::before {
  position: absolute;
  left: 12px;
  top: 4px;
  width: 2px;
  height: 9px;
  content: '';
  background: #72cfff;
  transform-origin: bottom;
  transform: rotate(-8deg);
}
.clock-icon::after {
  position: absolute;
  left: 13px;
  top: 12px;
  width: 7px;
  height: 2px;
  content: '';
  background: #72cfff;
  transform: rotate(28deg);
  transform-origin: left;
}
.time-panel strong {
  display: block;
  font-size: 15px;
}
.time-panel div span {
  display: block;
  margin-top: 3px;
  color: #82bfdf;
  font-size: 12px;
}
.fullscreen-btn {
  position: relative;
  width: 44px;
  height: 38px;
  margin-left: 12px;
  border: 0;
  border-left: 1px solid rgba(39, 117, 168, 0.25);
  background: transparent;
  cursor: pointer;
}
.fullscreen-btn span {
  position: absolute;
  width: 9px;
  height: 9px;
  border-color: #6fd0ff;
}
.fullscreen-btn span:nth-child(1) {
  left: 12px;
  top: 7px;
  border-left: 2px solid;
  border-top: 2px solid;
}
.fullscreen-btn span:nth-child(2) {
  right: 3px;
  top: 7px;
  border-right: 2px solid;
  border-top: 2px solid;
}
.fullscreen-btn span:nth-child(3) {
  left: 12px;
  bottom: 6px;
  border-left: 2px solid;
  border-bottom: 2px solid;
}
.fullscreen-btn span:nth-child(4) {
  right: 3px;
  bottom: 6px;
  border-right: 2px solid;
  border-bottom: 2px solid;
}

.metric-row {
  height: 158px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  margin-top: 14px;
}
.metric-card {
  --accent: #1daaff;
  --glow: rgba(0, 137, 255, 0.34);
  --surface: rgba(3, 62, 119, 0.9);
  position: relative;
  display: flex;
  align-items: center;
  gap: 23px;
  padding: 15px 25px;
  overflow: hidden;
  border: 1px solid var(--accent);
  border-radius: 7px;
  background: linear-gradient(135deg, var(--surface), rgba(3, 25, 63, 0.94));
  box-shadow:
    inset 0 0 44px var(--glow),
    0 0 13px var(--glow);
}
.metric-card::before {
  position: absolute;
  inset: 0;
  content: '';
  background: linear-gradient(110deg, rgba(255, 255, 255, 0.05), transparent 36%);
}
.metric-card::after {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 64px;
  height: 5px;
  content: '';
  border-right: 2px solid var(--accent);
  border-bottom: 2px solid var(--accent);
}
.metric-card.green {
  --accent: #12d7aa;
  --glow: rgba(0, 210, 162, 0.31);
  --surface: rgba(0, 101, 78, 0.9);
}
.metric-card.amber {
  --accent: #e29431;
  --glow: rgba(235, 140, 37, 0.29);
  --surface: rgba(106, 60, 16, 0.9);
}
.metric-card.red {
  --accent: #ef3e5c;
  --glow: rgba(229, 44, 76, 0.3);
  --surface: rgba(111, 17, 43, 0.9);
}
.metric-card.violet {
  --accent: #5361ff;
  --glow: rgba(73, 72, 255, 0.35);
  --surface: rgba(34, 46, 144, 0.92);
}
.metric-icon {
  position: relative;
  z-index: 1;
  width: 78px;
  height: 78px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border: 1px solid var(--accent);
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.16), var(--glow) 45%, rgba(5, 35, 80, 0.38));
  box-shadow:
    0 0 20px var(--glow),
    inset 0 0 18px var(--glow);
}
.metric-icon img {
  width: 54px;
  height: 54px;
  filter: drop-shadow(0 0 5px var(--accent));
}
.metric-card.green .metric-icon img {
  filter: hue-rotate(320deg) saturate(1.35) drop-shadow(0 0 5px var(--accent));
}
.metric-card.amber .metric-icon img {
  filter: hue-rotate(200deg) saturate(1.75) drop-shadow(0 0 5px var(--accent));
}
.metric-card.red .metric-icon img {
  filter: hue-rotate(170deg) saturate(1.8) drop-shadow(0 0 5px var(--accent));
}
.metric-card.violet .metric-icon img {
  filter: hue-rotate(50deg) saturate(1.45) drop-shadow(0 0 5px var(--accent));
}
.metric-content {
  position: relative;
  z-index: 1;
  min-width: 0;
}
.metric-content span,
.metric-content small,
.metric-content strong,
.metric-content em {
  display: block;
}
.metric-content span {
  font-size: 19px;
  font-weight: 800;
}
.metric-content small {
  margin-top: 1px;
  color: #9ccfea;
  font-size: 12px;
}
.metric-content strong {
  margin: 9px 0 8px;
  color: #fff;
  font-size: 39px;
  line-height: 1;
  white-space: nowrap;
  text-shadow: 0 0 12px rgba(255, 255, 255, 0.2);
}
.metric-content em {
  color: #38eab2;
  font-size: 15px;
  font-style: normal;
  font-weight: 800;
  white-space: nowrap;
}
.metric-content em.down {
  color: #ff575e;
}

.middle-grid {
  height: 296px;
  display: grid;
  grid-template-columns: 1.58fr 1fr;
  gap: 14px;
  margin-top: 14px;
}
.bottom-grid {
  height: 330px;
  display: grid;
  grid-template-columns: 2.08fr 0.89fr 1.02fr;
  gap: 14px;
  margin-top: 14px;
}
.dashboard-panel {
  position: relative;
  height: 100%;
  overflow: hidden;
  border: 1px solid rgba(19, 178, 255, 0.88);
  border-radius: 7px;
  background: linear-gradient(135deg, rgba(5, 42, 78, 0.97), rgba(2, 20, 43, 0.97));
  box-shadow:
    inset 0 0 34px rgba(0, 140, 255, 0.12),
    0 0 9px rgba(7, 165, 255, 0.23);
}
.dashboard-panel::before {
  position: absolute;
  z-index: 2;
  left: 13px;
  top: 0;
  width: 82px;
  height: 2px;
  content: '';
  background: #15dbff;
  box-shadow: 0 0 12px #15dbff;
}
.dashboard-panel::after {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 48px;
  height: 3px;
  content: '';
  border-right: 1px solid #1ccaff;
  border-bottom: 1px solid #1ccaff;
}
.panel-title {
  position: relative;
  z-index: 1;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 0 29px;
  border-bottom: 1px solid rgba(58, 146, 205, 0.14);
  background: linear-gradient(90deg, rgba(8, 52, 91, 0.46), transparent);
  box-sizing: border-box;
}
.panel-title::before {
  position: absolute;
  left: 13px;
  top: 14px;
  width: 5px;
  height: 17px;
  border-radius: 2px;
  content: '';
  background: #22d6ff;
  box-shadow: 0 0 9px #22d6ff;
}
.alert-panel :deep(.panel-title)::before {
  background: #ff3d61;
  box-shadow: 0 0 9px #ff3d61;
}
.panel-title h2 {
  display: inline;
  margin: 0;
  font-size: 18px;
  line-height: 1;
}
.panel-title span {
  margin-left: 5px;
  color: #58b6e7;
  font-size: 10px;
}
.panel-body {
  height: calc(100% - 44px);
}
.period-tabs,
.rank-tabs {
  display: flex;
}
.period-tabs button,
.rank-tabs button {
  height: 31px;
  min-width: 62px;
  padding: 0 12px;
  border: 1px solid rgba(35, 153, 214, 0.62);
  color: #cceeff;
  font-size: 12px;
  background: linear-gradient(180deg, rgba(8, 47, 86, 0.95), rgba(3, 24, 49, 0.94));
  cursor: pointer;
}
.period-tabs button:first-child,
.rank-tabs button:first-child {
  border-radius: 5px 0 0 5px;
}
.period-tabs button:last-child,
.rank-tabs button:last-child {
  border-radius: 0 5px 5px 0;
}
.period-tabs button.active,
.rank-tabs button.active {
  color: #fff;
  background: linear-gradient(180deg, #13bfff, #0879ca 72%, #075286);
  box-shadow:
    0 0 13px rgba(27, 195, 255, 0.44),
    inset 0 -5px 10px rgba(255, 255, 255, 0.12);
}
.rank-tabs button {
  min-width: 80px;
}
.text-link {
  border: 0;
  color: #1ecbff;
  font-size: 13px;
  background: transparent;
  cursor: pointer;
}
.chart {
  width: 100%;
  height: 252px;
}
.distribution-wrap {
  height: 252px;
  display: grid;
  grid-template-columns: 46% 54%;
  align-items: center;
  padding-right: 22px;
  box-sizing: border-box;
}
.type-list {
  margin: 0;
  padding: 3px 0 0;
  list-style: none;
}
.type-list li {
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr) 88px 50px;
  align-items: center;
  gap: 7px;
  min-height: 37px;
  color: #d9f2ff;
  font-size: 13px;
}
.type-list li > i {
  width: 14px;
  height: 14px;
  border-radius: 50%;
}
.type-list li > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.type-list strong,
.type-list em {
  text-align: right;
}
.type-list em {
  color: #c1deef;
  font-style: normal;
}

.container-list {
  height: 100%;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  padding: 12px 14px 14px;
  box-sizing: border-box;
}
.container-card {
  position: relative;
  min-width: 0;
  overflow: hidden;
  padding: 8px 11px 11px;
  border: 1px solid rgba(42, 150, 207, 0.72);
  border-radius: 6px;
  background: linear-gradient(180deg, rgba(7, 50, 86, 0.92), rgba(4, 29, 55, 0.97));
  box-shadow: inset 0 0 22px rgba(31, 179, 255, 0.1);
  box-sizing: border-box;
}
.container-card::after {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  content: '';
  background: linear-gradient(90deg, transparent, #19cfff, transparent);
  box-shadow: 0 0 10px #19cfff;
}
.product-wrap {
  height: 111px;
  display: grid;
  place-items: center;
  overflow: hidden;
}
.product-wrap img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 0 8px rgba(42, 184, 255, 0.46));
  transform: scale(1.06);
}
.container-card strong,
.container-card span,
.container-card b {
  display: block;
}
.container-card strong {
  overflow: hidden;
  font-size: 17px;
  line-height: 22px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.container-card > span {
  color: #4bcaff;
  font-size: 12px;
}
.container-card b {
  margin-top: 7px;
  color: #fff;
  font-size: 27px;
  line-height: 1;
}
.progress-row {
  display: grid;
  grid-template-columns: 1fr 39px;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}
.progress-row > div {
  height: 10px;
  overflow: hidden;
  border-radius: 3px;
  background: rgba(34, 105, 163, 0.56);
}
.progress-row i {
  display: block;
  height: 100%;
  border-radius: 3px;
}
.progress-row em {
  color: #d4eafb;
  font-size: 12px;
  font-style: normal;
}
.data-table {
  width: calc(100% - 24px);
  margin: 8px 12px 0;
  border-collapse: collapse;
  table-layout: fixed;
}
.data-table th,
.data-table td {
  height: 25px;
  padding: 0 8px;
  overflow: hidden;
  border-bottom: 1px solid rgba(55, 140, 196, 0.15);
  color: #d8efff;
  font-size: 12px;
  text-align: left;
  white-space: nowrap;
}
.data-table th {
  height: 28px;
  color: #78c8f5;
  font-weight: 700;
  background: rgba(9, 57, 99, 0.82);
}
.data-table th:first-child,
.data-table td:first-child {
  width: 58px;
  text-align: center;
}
.data-table th:last-child,
.data-table td:last-child {
  width: 70px;
  text-align: right;
}
.rank-badge {
  display: inline-grid;
  width: 21px;
  height: 21px;
  place-items: center;
  color: #a6dcff;
  font-weight: 800;
}
.rank-1,
.rank-2,
.rank-3 {
  border-radius: 50%;
  color: #fff;
  background: linear-gradient(180deg, #ffd95c, #ff7b22);
  box-shadow: 0 0 9px rgba(255, 175, 38, 0.52);
}
.rank-2 {
  filter: saturate(0.72);
}
.rank-3 {
  filter: hue-rotate(-12deg) brightness(0.9);
}
.alert-scroll {
  height: 100%;
  padding: 8px 12px 0;
  box-sizing: border-box;
}
.alert-row {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr) 50px 50px 50px;
  align-items: center;
  gap: 6px;
  height: 25px;
  padding: 0 8px;
  border-bottom: 1px solid rgba(55, 140, 196, 0.15);
  color: #d8efff;
  font-size: 12px;
  box-sizing: border-box;
}
.alert-row span:nth-child(n + 3) {
  text-align: right;
}
.alert-head {
  height: 28px;
  color: #78c8f5;
  font-weight: 700;
  background: rgba(9, 57, 99, 0.82);
}
.alert-body {
  height: 240px;
  overflow: hidden;
}
.diff-positive {
  color: #ff5d68;
  font-weight: 800;
}
.diff-negative {
  color: #ffb52f;
  font-weight: 800;
}
.diff-zero {
  color: #4bdfb4;
  font-weight: 800;
}
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.empty-state,
.empty-cell {
  color: rgba(203, 233, 249, 0.55) !important;
  text-align: center !important;
}
.empty-state {
  grid-column: 1/-1;
  padding: 70px 0;
}
.empty-state.compact {
  padding: 55px 0;
}

.dashboard-footer {
  height: 63px;
  display: grid;
  grid-template-columns: repeat(5, 1fr) 250px;
  align-items: center;
  margin-top: 10px;
  border-top: 1px solid rgba(31, 159, 227, 0.68);
  background: linear-gradient(180deg, rgba(4, 31, 60, 0.94), rgba(2, 18, 37, 0.98));
  box-shadow: inset 0 8px 20px rgba(0, 130, 222, 0.08);
}
.footer-stat {
  display: grid;
  grid-template-columns: 46px auto;
  grid-template-rows: 19px 25px;
  align-items: center;
  column-gap: 12px;
  padding-left: 26px;
  border-right: 1px solid rgba(56, 139, 194, 0.22);
}
.footer-stat img {
  grid-row: 1/3;
  width: 39px;
  height: 39px;
  filter: drop-shadow(0 0 7px rgba(55, 199, 255, 0.34));
}
.footer-stat span {
  color: #89c7e7;
  font-size: 13px;
}
.footer-stat strong {
  color: #fff;
  font-size: 20px;
}
.dashboard-footer p {
  margin: 0;
  color: #8ebeda;
  font-size: 12px;
  text-align: center;
  letter-spacing: 1px;
}
</style>
