<template>
  <main ref="boardRef" class="dashboard-shell" :class="{ 'is-fullscreen': isFullscreen }">
    <div class="dashboard-canvas" :style="canvasStyle">
      <header class="dashboard-header">
        <div class="header-left">
          <img v-if="tenantId === '000001'" src="@/assets/logo/yakima-logo.png" alt="Logo" class="logo" title="点击切换全屏" @click="toggleFullscreen" />
          <img v-else src="@/assets/logo/kemflo-logo.jpg" alt="Logo" class="logo" title="点击切换全屏" @click="toggleFullscreen" />
        </div>

        <button class="header-title" type="button" @click="showSettings = true">
          <strong>容器看板</strong>
          <span>CONTAINER MANAGEMENT DASHBOARD</span>
        </button>

        <div class="header-right">
          <el-icon class="time-icon"><Clock /></el-icon>
          <div class="time-block">
            <span class="current-time">{{ currentDateTime }}</span>
            <span class="weekday">{{ currentWeekday }}</span>
          </div>
        </div>
      </header>

      <section class="metric-row">
        <article v-for="card in metrics" :key="card.title" :class="['metric-card', card.tone]">
          <div class="metric-icon"><img :src="iconMap[card.icon]" :alt="card.title" /></div>
          <div class="metric-content">
            <span>{{ card.title }}</span>
            <strong>{{ card.value }}</strong>
            <em :class="{ down: card.down }">{{ card.compareLabel }}　{{ card.down ? '▼' : '▲' }} {{ card.rate }}</em>
          </div>
          <div class="metric-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
        </article>
      </section>

      <section class="middle-grid">
        <DashboardPanel title="出入库趋势" class="trend-panel">
          <template #extra>
            <div class="range-tabs">
              <button v-for="option in rangeOptions" :key="option.days" :class="{ active: activeRangeDays === option.days }" type="button" :aria-pressed="activeRangeDays === option.days" @click="setRangeDays(option.days)">
                {{ option.label }}
              </button>
            </div>
          </template>
          <div ref="flowChartRef" class="chart trend-chart"></div>
        </DashboardPanel>

        <DashboardPanel title="容器类型库存" class="type-panel">
          <div class="container-list compact">
            <article v-for="item in inventoryCards" :key="item.key" class="container-card">
              <div class="product-wrap"><img :class="item.productClass" :src="item.product" :alt="item.name" /></div>
              <strong :title="item.name">{{ item.name }}</strong>
              <b>{{ formatNumber(item.value) }}</b>
            </article>
            <div v-if="inventoryCards.length === 0" class="empty-state">暂无库存数据</div>
          </div>
        </DashboardPanel>
      </section>

      <section class="partner-section">
        <DashboardPanel title="容器流转明细" class="partner-panel">
          <div class="partner-table-wrap">
            <div class="partner-head partner-row">
              <span>序号</span>
              <span>业务伙伴编码</span>
              <span>业务伙伴名称</span>
              <span v-for="column in containerColumns" :key="column.key">{{ column.name }}</span>
              <span>状态</span>
            </div>
            <div class="partner-body" :class="{ 'is-seamless': shouldUsePartnerScroll }">
              <Vue3SeamlessScroll v-if="shouldUsePartnerScroll" :key="partnerScrollKey" :list="partnerTableScrollRows" :visible-count="partnerVisibleCount" :hover="true" :step="stepVal" :wheel="true">
                <template #default="{ data: row }">
                  <div class="partner-row">
                    <span>{{ row.displayIndex }}</span>
                    <span class="ellipsis" :title="row.businessCode">{{ row.businessCode || '-' }}</span>
                    <span class="ellipsis" :title="row.businessName">{{ row.businessName || '-' }}</span>
                    <span v-for="column in containerColumns" :key="column.key" :class="getDiffClass(row.quantities[column.key])">{{ formatDiff(row.quantities[column.key]) }}</span>
                    <span><i :class="['status-dot', statusMeta(row.status).class]"></i>{{ statusMeta(row.status).label }}</span>
                  </div>
                </template>
              </Vue3SeamlessScroll>
              <template v-else>
                <div v-for="(row, index) in partnerTableRows" :key="row.businessCode || row.businessName || index" class="partner-row">
                  <span>{{ index + 1 }}</span>
                  <span class="ellipsis" :title="row.businessCode">{{ row.businessCode || '-' }}</span>
                  <span class="ellipsis" :title="row.businessName">{{ row.businessName || '-' }}</span>
                  <span v-for="column in containerColumns" :key="column.key" :class="getDiffClass(row.quantities[column.key])">{{ formatDiff(row.quantities[column.key]) }}</span>
                  <span><i :class="['status-dot', statusMeta(row.status).class]"></i>{{ statusMeta(row.status).label }}</span>
                </div>
                <div v-if="partnerTableRows.length === 0" class="empty-state compact">暂无流转数据</div>
              </template>
            </div>
          </div>
        </DashboardPanel>
      </section>

      <footer class="dashboard-footer">
        <div v-for="item in footerStats" :key="item.label" class="footer-stat">
          <img :src="iconMap[item.icon]" :alt="item.label" />
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
        <p>KEMFLO&nbsp;&nbsp;|&nbsp;&nbsp;智能制造&nbsp;&nbsp;数字物流</p>
      </footer>
    </div>

    <el-dialog v-model="showSettings" title="看板设置" width="620px" append-to-body :append-to="settingsDialogAppendTo">
      <el-form ref="queryFormRef" :model="queryParams" label-width="110px">
        <el-form-item label="显示数量"><el-slider v-model="settingsForm.displayLimit" :min="5" :max="30" show-input /></el-form-item>
        <el-form-item label="滚动速度"><el-slider v-model="settingsForm.scrollSpeed" :min="0.1" :max="2" :step="0.1" show-input /></el-form-item>
        <el-form-item label="刷新间隔"><el-input-number v-model="settingsForm.refreshInterval" :min="10" :max="300" :step="5" /> 秒</el-form-item>
        <el-form-item label="自动滚动"><el-switch v-model="settingsForm.enableScroll" /></el-form-item>
        <el-form-item label="报废客户">
          <el-select v-model="settingsForm.scrapBusinessCodes" multiple filterable allow-create default-first-option clearable collapse-tags collapse-tags-tooltip placeholder="输入业务伙伴编码后回车，可配置多个" style="width: 100%">
            <el-option v-for="code in settingsForm.scrapBusinessCodes" :key="code" :label="code" :value="code" />
          </el-select>
        </el-form-item>
        <el-form-item label="移动时间" prop="dateTimeRange">
          <el-date-picker v-model="queryParams.dateTimeRange" type="datetimerange" value-format="YYYY-MM-DD HH:mm:ss" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" :teleported="!isFullscreen" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="showSettings = false">取消</el-button><el-button @click="resetQuery">重置</el-button><el-button type="primary" @click="saveSettings">保存</el-button></template>
    </el-dialog>
  </main>
</template>

<script setup name="ScadaContainerBoard" lang="ts">
import { Clock } from '@element-plus/icons-vue';
import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, reactive, ref, toRefs, watch } from 'vue';
import * as echarts from 'echarts';
import { Vue3SeamlessScroll } from 'vue3-seamless-scroll';
import { getContainerFooter, getContainerInventorySummary, getContainerOverview, getContainerTrend, listContainerPartnerTurnover } from '@/api/scada/container';
import type { ContainerFooterVO, ContainerInventorySummaryVO, ContainerOverviewVO, ContainerPartnerTurnoverVO, ContainerScadaQuery, ContainerTrendVO } from '@/api/scada/container/types';
import { useAppStore } from '@/store/modules/app';

import customerIcon from '@/assets/images/scada/container-dashboard/icons/customer.svg';
import inboundIcon from '@/assets/images/scada/container-dashboard/icons/inbound.svg';
import insideFactoryIcon from '@/assets/images/scada/container-dashboard/icons/insideFactory.svg';
import inventoryIcon from '@/assets/images/scada/container-dashboard/icons/inventory.svg';
import outboundIcon from '@/assets/images/scada/container-dashboard/icons/outbound.svg';
import outsideFactoryIcon from '@/assets/images/scada/container-dashboard/icons/outsideFactory.svg';
import scrapIcon from '@/assets/images/scada/container-dashboard/icons/scrap.svg';
import warningIcon from '@/assets/images/scada/container-dashboard/icons/warning.svg';
import metalTeflonCageProduct from '@/assets/images/scada/container-dashboard/products/metalTeflonCage.png';
import metalPalletProduct from '@/assets/images/scada/container-dashboard/products/metalPallet.png';
import plasticCrateBlueProduct from '@/assets/images/scada/container-dashboard/products/plasticCrateBlue.png';
import plasticCrateGreenProduct from '@/assets/images/scada/container-dashboard/products/plasticCrateGreen.png';

type IconName = 'customer' | 'inbound' | 'insideFactory' | 'inventory' | 'outbound' | 'outsideFactory' | 'scrap' | 'warning';

interface TypeItem {
  key: string;
  name: string;
  code: string;
  value: number;
  product: string;
  productClass: string;
}

interface PartnerTableRow {
  businessCode: string;
  businessName: string;
  quantities: Record<string, number>;
  status: ContainerPartnerTurnoverVO['status'];
}

const designWidth = 1680;
const designHeight = 945;
const rangeOptions = [
  { label: '近7天', days: 7 },
  { label: '近30天', days: 30 },
  { label: '近90天', days: 90 }
];
const appStore = useAppStore();
const defaultInventoryTypes = [
  { itemCode: 'L-CRATE', itemName: '大号胶框', inventoryQty: 0 },
  { itemCode: 'M-CRATE', itemName: '中号胶框', inventoryQty: 0 },
  { itemCode: 'S-CRATE', itemName: '小号胶框', inventoryQty: 0 },
  { itemCode: 'METAL-CAGE', itemName: '大号铁氟笼', inventoryQty: 0 },
  { itemCode: 'METAL-PALLET', itemName: '大号铁栈板', inventoryQty: 0 }
];
const inventorySortOrder = new Map(defaultInventoryTypes.map((item, index) => [item.itemCode, index]));
const inventoryNameSortOrder = new Map(defaultInventoryTypes.map((item, index) => [item.itemName, index]));

const DashboardPanel = defineComponent({
  name: 'DashboardPanel',
  props: { title: { type: String, required: true } },
  setup(props, { slots }) {
    return () => h('section', { class: 'dashboard-panel' }, [h('header', { class: 'panel-title' }, [h('div', [h('h2', props.title)]), slots.extra?.()]), h('div', { class: 'panel-body' }, slots.default?.())]);
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
  warning: warningIcon
};

const emptyOverview = (): ContainerOverviewVO => ({
  inventoryTotal: 0,
  inventoryYesterdayTotal: 0,
  inventoryChangeRate: 0,
  inboundTotal: 0,
  inboundYesterdayTotal: 0,
  inboundChangeRate: 0,
  outboundTotal: 0,
  outboundYesterdayTotal: 0,
  outboundChangeRate: 0,
  diffTotal: 0,
  diffYesterdayTotal: 0,
  diffChangeRate: 0,
  scrapTotal: 0,
  scrapYesterdayTotal: 0,
  scrapChangeRate: 0
});

const emptyFooter = (): ContainerFooterVO => ({
  customerTotal: 0,
  insideQuantity: 0,
  outsideQuantity: 0,
  transitQuantity: 0
});

const boardRef = ref<HTMLElement>();
const queryFormRef = ref<ElFormInstance>();
const flowChartRef = ref<HTMLElement>();
const overview = ref<ContainerOverviewVO>(emptyOverview());
const trendList = ref<ContainerTrendVO[]>([]);
const inventorySummary = ref<ContainerInventorySummaryVO[]>([]);
const partnerRows = ref<ContainerPartnerTurnoverVO[]>([]);
const footer = ref<ContainerFooterVO>(emptyFooter());
const currentDateTime = ref('');
const currentWeekday = ref('');
const showSettings = ref(false);
const showScroll = ref(true);
const isFullscreen = ref(false);
const tenantId = ref('000000');
const stepVal = ref(0.35);
const partnerScrollKey = ref(0);
const activeRangeDays = ref(7);
const viewport = reactive({ scale: 1, left: 0, top: 0 });
let clockTimer: number | undefined;
let refreshTimer: number | undefined;
let flowRenderFrame: number | undefined;
let flowChart: echarts.ECharts | undefined;
let sidebarHiddenByThisBoard = false;

const settingsForm = reactive({ displayLimit: 12, scrollSpeed: 0.35, refreshInterval: 30, enableScroll: true, scrapBusinessCodes: [] as string[] });
const data = reactive<PageData<Record<string, never>, ContainerScadaQuery>>({
  form: {},
  queryParams: {
    itemCode: undefined,
    warehouseCode: undefined,
    businessCode: undefined,
    dateTimeRange: undefined,
    params: {}
  },
  rules: {}
});
const { queryParams } = toRefs(data);

const canvasStyle = computed(() => ({ transform: `scale(${viewport.scale})`, left: `${viewport.left}px`, top: `${viewport.top}px` }));
const settingsDialogAppendTo = computed<HTMLElement | string>(() => (isFullscreen.value && boardRef.value ? boardRef.value : 'body'));

const formatNumber = (value: number | string | undefined) => Number(value || 0).toLocaleString('zh-CN');
const formatDiff = (value: number | string | undefined) => {
  const diff = Number(value || 0);
  return diff > 0 ? `+${formatNumber(diff)}` : formatNumber(diff);
};
const formatRate = (value: number | string | undefined) => {
  const rate = Number(value || 0);
  return `${rate >= 0 ? '+' : ''}${rate.toFixed(1)}%`;
};

function resolveProductImage(name?: string, code?: string) {
  const text = `${name || ''}${code || ''}`;
  if (/栈板|托盘|pallet/i.test(text)) return metalPalletProduct;
  if (/铁氟笼|铁笼|铁筐|笼|筐/i.test(text)) return metalTeflonCageProduct;
  if (/小号|small|s\b/i.test(text)) return plasticCrateBlueProduct;
  return plasticCrateGreenProduct;
}

function resolveProductClass(name?: string, code?: string) {
  const text = `${name || ''}${code || ''}`;
  if (/栈板|托盘|pallet/i.test(text)) return 'product-pallet';
  if (/铁笼|铁筐|笼|筐/i.test(text)) return 'product-cage';
  if (/小号|small|s\b/i.test(text)) return 'product-crate product-crate-small';
  if (/中号|medium|m\b/i.test(text)) return 'product-crate product-crate-medium';
  return 'product-crate product-crate-large';
}

function formatContainerName(name?: string) {
  return String(name || '').replace(/^容器[-－]/, '');
}

function statusMeta(status?: string) {
  if (status === 'high') return { label: '异常', class: 'status-high' };
  if (status === 'recovery') return { label: '异常', class: 'status-high' };
  return { label: '正常', class: 'status-normal' };
}

function getDiffClass(value: number | string | undefined) {
  const diff = Number(value || 0);
  if (diff < 0) return 'diff-negative';
  if (diff > 0) return 'diff-positive';
  return 'diff-zero';
}

const metrics = computed(() => {
  const o = overview.value;
  return [
    { title: '当前库存', value: formatNumber(o.inventoryTotal), icon: 'inventory' as IconName, tone: 'blue', compareLabel: '较昨日', rate: formatRate(o.inventoryChangeRate), down: Number(o.inventoryChangeRate) < 0 },
    { title: '今日入库', value: formatNumber(o.inboundTotal), icon: 'inbound' as IconName, tone: 'green', compareLabel: '较昨日', rate: formatRate(o.inboundChangeRate), down: Number(o.inboundChangeRate) < 0 },
    { title: '今日出库', value: formatNumber(o.outboundTotal), icon: 'outbound' as IconName, tone: 'amber', compareLabel: '较昨日', rate: formatRate(o.outboundChangeRate), down: Number(o.outboundChangeRate) < 0 },
    { title: '当前差异', value: formatDiff(o.diffTotal), icon: 'warning' as IconName, tone: 'red', compareLabel: '较昨日', rate: formatRate(o.diffChangeRate), down: Number(o.diffChangeRate) < 0 },
    { title: '报废数量', value: formatNumber(o.scrapTotal), icon: 'scrap' as IconName, tone: 'violet', compareLabel: '较昨日', rate: formatRate(o.scrapChangeRate), down: Number(o.scrapChangeRate) < 0 }
  ];
});

const inventoryCards = computed<TypeItem[]>(() =>
  [...(inventorySummary.value.length ? inventorySummary.value : defaultInventoryTypes)]
    .sort((a, b) => {
      const aIndex = inventorySortOrder.get(a.itemCode) ?? inventoryNameSortOrder.get(a.itemName) ?? Number.MAX_SAFE_INTEGER;
      const bIndex = inventorySortOrder.get(b.itemCode) ?? inventoryNameSortOrder.get(b.itemName) ?? Number.MAX_SAFE_INTEGER;
      return aIndex - bIndex || formatContainerName(a.itemName).localeCompare(formatContainerName(b.itemName), 'zh-CN');
    })
    .slice(0, 5)
    .map((item) => ({
      key: item.itemCode,
      name: formatContainerName(item.itemName),
      code: item.itemCode,
      value: Number(item.inventoryQty || 0),
      product: resolveProductImage(item.itemName, item.itemCode),
      productClass: resolveProductClass(item.itemName, item.itemCode)
    }))
);

const containerColumns = computed(() => inventoryCards.value.map((item) => ({ key: item.code || item.key, name: item.name })));

const partnerTableRows = computed<PartnerTableRow[]>(() => {
  const groups = new Map<string, PartnerTableRow>();
  partnerRows.value.forEach((row) => {
    const groupKey = row.businessCode || row.businessName || 'unknown';
    const itemKey = row.itemCode || row.itemName || 'unknown';
    const inbound = Number(row.inboundQuantity || 0);
    const outbound = Number(row.outboundQuantity || 0);
    const diff = Number(row.diffQuantity ?? inbound - outbound);
    const existed = groups.get(groupKey);
    const group =
      existed ||
      ({
        businessCode: row.businessCode,
        businessName: row.businessName,
        quantities: {},
        status: 'normal'
      } satisfies PartnerTableRow);

    group.quantities[itemKey] = (group.quantities[itemKey] || 0) + diff;
    if (group.quantities[itemKey] < 0) group.status = 'high';
    groups.set(groupKey, group);
  });
  return Array.from(groups.values());
});

const partnerTableScrollRows = computed(() => partnerTableRows.value.map((row, index) => ({ ...row, displayIndex: index + 1 })));
const partnerVisibleCount = computed(() => Math.min(settingsForm.displayLimit, 8));
const shouldUsePartnerScroll = computed(() => showScroll.value && settingsForm.enableScroll && partnerTableRows.value.length > partnerVisibleCount.value);

const footerStats = computed(() => {
  return [
    { label: '客户总数', value: `${formatNumber(footer.value.customerTotal)} 家`, icon: 'customer' as IconName },
    { label: '厂内容器', value: formatNumber(footer.value.insideQuantity), icon: 'insideFactory' as IconName },
    { label: '厂外容器', value: formatNumber(footer.value.outsideQuantity), icon: 'outsideFactory' as IconName },
    { label: '差异数', value: formatDiff(overview.value.diffTotal), icon: 'warning' as IconName }
  ];
});

function normalizeScrapBusinessCodes(codes: unknown): string[] {
  if (!Array.isArray(codes)) return [];
  return [...new Set(codes.map((code) => String(code).trim()).filter(Boolean))];
}

const buildScadaQuery = (): ContainerScadaQuery => {
  const dateTimeRange = queryParams.value.dateTimeRange;
  const params = Array.isArray(dateTimeRange) && dateTimeRange.length >= 2 ? { beginTime: dateTimeRange[0], endTime: dateTimeRange[1] } : {};

  return {
    businessCode: queryParams.value.businessCode || undefined,
    scrapBusinessCodes: normalizeScrapBusinessCodes(settingsForm.scrapBusinessCodes),
    warehouseCode: queryParams.value.warehouseCode || undefined,
    itemCode: queryParams.value.itemCode || undefined,
    dateTimeRange,
    params
  };
};

function getResponseList<T>(response: unknown): T[] {
  if (!response) return [];
  if (Array.isArray(response)) return response as T[];

  const payload = response as { data?: unknown; rows?: T[]; records?: T[] };
  if (Array.isArray(payload.data)) return payload.data as T[];
  if (Array.isArray(payload.rows)) return payload.rows;
  if (Array.isArray(payload.records)) return payload.records;

  const data = payload.data as { rows?: T[]; records?: T[] } | undefined;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.records)) return data.records;
  return [];
}

async function refreshAll() {
  const query = buildScadaQuery();
  const [overviewRes, trendRes, summaryRes, partnerRes, footerRes] = await Promise.allSettled([getContainerOverview(query), getContainerTrend(query), getContainerInventorySummary(query), listContainerPartnerTurnover(query), getContainerFooter(query)]);

  overview.value = overviewRes.status === 'fulfilled' ? overviewRes.value.data || emptyOverview() : emptyOverview();
  trendList.value = trendRes.status === 'fulfilled' ? getResponseList<ContainerTrendVO>(trendRes.value) : [];
  inventorySummary.value = summaryRes.status === 'fulfilled' ? getResponseList<ContainerInventorySummaryVO>(summaryRes.value) : [];
  partnerRows.value = partnerRes.status === 'fulfilled' ? getResponseList<ContainerPartnerTurnoverVO>(partnerRes.value) : [];
  footer.value = footerRes.status === 'fulfilled' ? footerRes.value.data || emptyFooter() : emptyFooter();

  partnerScrollKey.value += 1;
  await nextTick();
  scheduleFlowChartRender();
}

function resetQuery() {
  queryFormRef.value?.resetFields();
  queryParams.value.itemCode = undefined;
  queryParams.value.warehouseCode = undefined;
  queryParams.value.businessCode = undefined;
  settingsForm.scrapBusinessCodes = [];
  activeRangeDays.value = 7;
  queryParams.value.dateTimeRange = getDateRange(7);
  showSettings.value = false;
  refreshAll();
}

function saveSettings() {
  settingsForm.scrapBusinessCodes = normalizeScrapBusinessCodes(settingsForm.scrapBusinessCodes);
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

function setRangeDays(days: number) {
  if (activeRangeDays.value === days) return;
  activeRangeDays.value = days;
  queryParams.value.dateTimeRange = getDateRange(days);
  refreshAll();
}

function renderFlowChart() {
  if (!flowChartRef.value || !flowChartRef.value.clientWidth || !flowChartRef.value.clientHeight) return;
  flowChart ||= echarts.init(flowChartRef.value);
  const rows = trendList.value.map((item) => ({
    date: String(item.date || '')
      .slice(5)
      .replace('-', '-'),
    label: String(item.date || '').slice(5),
    inbound: Number(item.inbound || 0),
    outbound: Number(item.outbound || 0)
  }));
  const maxValue = Math.max(0, ...rows.flatMap((item) => [item.inbound, item.outbound]));
  const roughInterval = maxValue > 0 ? maxValue / 5 : 20;
  const magnitude = 10 ** Math.floor(Math.log10(roughInterval));
  const normalizedInterval = roughInterval / magnitude;
  const intervalFactor = normalizedInterval <= 1 ? 1 : normalizedInterval <= 2 ? 2 : normalizedInterval <= 5 ? 5 : 10;
  const yAxisInterval = Math.max(1, intervalFactor * magnitude);
  const yAxisMax = maxValue > 0 ? Math.max(yAxisInterval * 3, Math.ceil((maxValue * 1.08) / yAxisInterval) * yAxisInterval) : 100;

  flowChart.setOption(
    {
      animationDuration: 900,
      color: ['#23ffc9', '#3bb4ff'],
      tooltip: {
        trigger: 'axis',
        confine: true,
        axisPointer: { type: 'line', lineStyle: { color: 'rgba(87, 203, 255, 0.72)', type: 'dashed' } },
        backgroundColor: 'rgba(3,25,51,.96)',
        borderColor: '#19b8f1',
        textStyle: { color: '#eaf8ff' }
      },
      legend: { top: 10, left: 'center', itemGap: 30, itemWidth: 18, itemHeight: 8, textStyle: { color: '#d9efff', fontSize: 14 }, data: ['入库数量', '出库数量'] },
      grid: { left: 28, right: 24, top: 52, bottom: 24, containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: rows.map((item) => item.label),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: 'rgba(91, 181, 238, 0.42)' } },
        axisLabel: { color: '#d8e9ff', fontSize: 14, margin: 10, hideOverlap: true }
      },
      yAxis: {
        type: 'value',
        name: '数量',
        min: 0,
        max: yAxisMax,
        interval: yAxisInterval,
        nameGap: 12,
        nameTextStyle: { color: '#d8e9ff', fontSize: 14, align: 'right', padding: [0, 4, 0, 0] },
        axisLabel: { color: '#d8e9ff', fontSize: 14, margin: 10 },
        splitLine: { lineStyle: { color: 'rgba(119,190,239,.22)', type: 'dashed' } }
      },
      series: [
        {
          name: '入库数量',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 10,
          lineStyle: { width: 4, color: '#23ffc9', shadowBlur: 12, shadowColor: 'rgba(35,255,201,.5)' },
          itemStyle: { color: '#052c39', borderColor: '#23ffc9', borderWidth: 4 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(35,255,201,.34)' },
              { offset: 1, color: 'rgba(35,255,201,0)' }
            ])
          },
          data: rows.map((item) => item.inbound)
        },
        {
          name: '出库数量',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 10,
          lineStyle: { width: 4, color: '#3bb4ff', shadowBlur: 12, shadowColor: 'rgba(59,180,255,.45)' },
          itemStyle: { color: '#06345c', borderColor: '#57bcff', borderWidth: 4 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59,180,255,.28)' },
              { offset: 1, color: 'rgba(59,180,255,0)' }
            ])
          },
          data: rows.map((item) => item.outbound)
        }
      ]
    },
    true
  );
}

function scheduleFlowChartRender() {
  if (flowRenderFrame) window.cancelAnimationFrame(flowRenderFrame);
  flowRenderFrame = window.requestAnimationFrame(() => {
    flowRenderFrame = undefined;
    renderFlowChart();
  });
}

function fitCanvas() {
  const width = boardRef.value?.clientWidth || window.innerWidth;
  const height = boardRef.value?.clientHeight || window.innerHeight;
  viewport.scale = isFullscreen.value ? Math.min(width / designWidth, height / designHeight) : width / designWidth;
  viewport.left = 0;
  viewport.top = 0;
  nextTick(scheduleFlowChartRender);
}

function toggleFullscreen() {
  if (!document.fullscreenElement) boardRef.value?.requestFullscreen?.();
  else document.exitFullscreen?.();
  setTimeout(fitCanvas, 250);
}

function handleFullscreenChange() {
  const currentBoardFullscreen = document.fullscreenElement === boardRef.value;
  isFullscreen.value = currentBoardFullscreen;
  if (currentBoardFullscreen) {
    appStore.toggleSideBarHide(true);
    sidebarHiddenByThisBoard = true;
  } else if (sidebarHiddenByThisBoard && !document.fullscreenElement) {
    appStore.toggleSideBarHide(false);
    sidebarHiddenByThisBoard = false;
  }
  fitCanvas();
  window.setTimeout(fitCanvas, 120);
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

function updateTime() {
  const now = new Date();
  currentDateTime.value = formatDateTime(now);
  currentWeekday.value = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()];
}

watch(inventoryCards, () => nextTick(scheduleFlowChartRender));

onMounted(() => {
  tenantId.value = localStorage.getItem('tenantId') || '000000';
  const saved = localStorage.getItem('scadaContainerBoardSettings');
  if (saved) {
    try {
      Object.assign(settingsForm, JSON.parse(saved));
    } catch {
      localStorage.removeItem('scadaContainerBoardSettings');
    }
  }
  settingsForm.scrapBusinessCodes = normalizeScrapBusinessCodes(settingsForm.scrapBusinessCodes);
  stepVal.value = settingsForm.scrollSpeed;
  queryParams.value.dateTimeRange = getDateRange(activeRangeDays.value);
  updateTime();
  fitCanvas();
  clockTimer = window.setInterval(updateTime, 1000);
  resetRefreshTimer();
  window.addEventListener('resize', fitCanvas);
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  refreshAll();
});

onBeforeUnmount(() => {
  if (clockTimer) window.clearInterval(clockTimer);
  if (refreshTimer) window.clearInterval(refreshTimer);
  if (flowRenderFrame) window.cancelAnimationFrame(flowRenderFrame);
  window.removeEventListener('resize', fitCanvas);
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  const currentBoardFullscreen = document.fullscreenElement === boardRef.value;
  if (document.fullscreenElement === boardRef.value) {
    document.exitFullscreen().catch(() => undefined);
  }
  if (sidebarHiddenByThisBoard && (!document.fullscreenElement || currentBoardFullscreen)) {
    appStore.toggleSideBarHide(false);
    sidebarHiddenByThisBoard = false;
  }
  flowChart?.dispose();
});
</script>

<style lang="scss" scoped>
.dashboard-shell {
  position: relative;
  width: 100%;
  height: calc(100vh - 84px);
  min-height: calc(100vh - 84px);
  overflow-x: hidden;
  overflow-y: auto;
  color: #eaf8ff;
  background: #010b1a;
  font-family: DIN, Bahnschrift, 'Microsoft YaHei', Arial, sans-serif;
}

.dashboard-shell.is-fullscreen,
.dashboard-shell:fullscreen {
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  overflow: hidden;
}

.dashboard-canvas {
  position: relative;
  width: 1680px;
  height: 945px;
  padding: 12px 14px 14px;
  overflow: hidden;
  transform-origin: left top;
  box-sizing: border-box;
  background:
    radial-gradient(circle at 50% 0, rgba(0, 128, 255, 0.2), transparent 34%),
    linear-gradient(180deg, rgba(0, 20, 54, 0.12), rgba(1, 10, 27, 0.78) 42%, rgba(1, 8, 22, 0.96)),
    url('@/assets/images/scada/container-dashboard/backgrounds/container-command-center-bg.png') center top / cover no-repeat,
    linear-gradient(rgba(29, 148, 230, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(29, 148, 230, 0.07) 1px, transparent 1px),
    linear-gradient(180deg, #041a37 0%, #031329 58%, #021124 100%);
  background-size:
    auto,
    cover,
    cover,
    36px 36px,
    36px 36px,
    auto;
}

.dashboard-header {
  position: relative;
  display: grid;
  grid-template-columns: minmax(300px, 1fr) minmax(520px, 1.25fr) minmax(300px, 1fr);
  align-items: center;
  height: 70px;
  border: 1px solid rgba(25, 190, 255, 0.48);
  border-radius: 6px;
  background: linear-gradient(90deg, rgba(4, 50, 102, 0.78), rgba(3, 21, 48, 0.28), rgba(4, 50, 102, 0.78));
  box-shadow:
    0 0 24px rgba(0, 154, 255, 0.22),
    inset 0 0 28px rgba(0, 155, 255, 0.1);
}

.dashboard-header::before,
.dashboard-header::after {
  position: absolute;
  bottom: -1px;
  width: 23%;
  height: 2px;
  content: '';
  background: linear-gradient(90deg, transparent, #20afff);
  box-shadow: 0 0 9px rgba(31, 175, 255, 0.86);
}

.dashboard-header::before {
  left: 0;
}

.dashboard-header::after {
  right: 0;
  transform: scaleX(-1);
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  min-width: 0;
  height: 100%;
}

.header-left {
  padding-left: 24px;
}

.header-right {
  justify-content: flex-end;
  gap: 14px;
  padding-right: 28px;
}

.logo {
  height: 45px;
  filter: drop-shadow(0 0 5px rgba(100, 150, 255, 0.8));
  cursor: pointer;
}

.dashboard-shell:fullscreen .logo {
  height: 50px;
}

.header-title {
  justify-self: center;
  width: 520px;
  height: 70px;
  border: 0;
  color: #ffffff;
  background: linear-gradient(180deg, rgba(29, 171, 255, 0.3), rgba(5, 48, 102, 0.58) 55%, rgba(2, 20, 50, 0.12)), linear-gradient(90deg, transparent, rgba(23, 177, 255, 0.46) 18%, rgba(23, 177, 255, 0.46) 82%, transparent);
  clip-path: polygon(9% 0, 91% 0, 100% 50%, 91% 100%, 9% 100%, 0 50%);
  cursor: pointer;
  text-align: center;
  text-shadow:
    0 0 8px rgba(255, 255, 255, 0.9),
    0 0 20px rgba(22, 153, 255, 0.9);
}

.header-title strong {
  display: block;
  margin-top: 5px;
  font-size: 36px;
  font-weight: 800;
  letter-spacing: 10px;
  line-height: 1.05;
}

.header-title span {
  display: block;
  margin-top: 5px;
  color: #8bd4ff;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 4px;
}

.time-icon {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  color: #2ca8ff;
  border: 3px solid rgba(44, 168, 255, 0.75);
  border-radius: 50%;
  font-size: 27px;
  box-shadow: 0 0 14px rgba(42, 166, 255, 0.4);
}

.time-block {
  width: 218px;
  flex: 0 0 218px;
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.current-time {
  display: block;
  color: #f2f8ff;
  font-size: 20px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
  white-space: nowrap;
}

.weekday {
  color: #a9c8e9;
  font-size: 13px;
}

.metric-row {
  height: 132px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  margin-top: 12px;
}

.metric-card {
  --accent: #1daaff;
  --glow: rgba(0, 137, 255, 0.34);
  --surface: rgba(3, 62, 119, 0.9);
  position: relative;
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 14px 22px;
  overflow: hidden;
  border: 1px solid var(--accent);
  border-radius: 5px;
  background: linear-gradient(135deg, var(--surface), rgba(3, 25, 63, 0.9)), linear-gradient(180deg, rgba(255, 255, 255, 0.1), transparent 34%);
  box-shadow:
    inset 0 0 48px var(--glow),
    0 0 15px var(--glow);
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
  width: 82px;
  height: 10px;
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
  width: 68px;
  height: 68px;
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
  width: 46px;
  height: 46px;
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
.metric-content strong,
.metric-content em {
  display: block;
}

.metric-content span {
  font-size: 18px;
  font-weight: 800;
}

.metric-content strong {
  margin: 7px 0 7px;
  color: #fff;
  font-size: 36px;
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

.metric-bars {
  position: absolute;
  right: 22px;
  bottom: 16px;
  display: flex;
  align-items: flex-end;
  gap: 5px;
  color: var(--accent);
}

.metric-bars i {
  display: block;
  width: 6px;
  background: currentColor;
  box-shadow: 0 0 8px currentColor;
}

.metric-bars i:nth-child(1) {
  height: 18px;
  opacity: 0.45;
}

.metric-bars i:nth-child(2) {
  height: 28px;
  opacity: 0.62;
}

.metric-bars i:nth-child(3) {
  height: 38px;
  opacity: 0.78;
}

.metric-bars i:nth-child(4) {
  height: 30px;
  opacity: 0.68;
}

.metric-bars i:nth-child(5) {
  height: 48px;
}

.middle-grid {
  height: 290px;
  display: grid;
  grid-template-columns: 910px 1fr;
  gap: 12px;
  margin-top: 12px;
}

.partner-section {
  height: 320px;
  margin-top: 10px;
}

.dashboard-panel {
  position: relative;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(24, 191, 255, 0.92);
  border-radius: 6px;
  background: linear-gradient(90deg, rgba(5, 65, 118, 0.32), transparent 26%, transparent 74%, rgba(5, 65, 118, 0.32)), linear-gradient(135deg, rgba(3, 39, 76, 0.66), rgba(2, 17, 39, 0.88)), linear-gradient(rgba(64, 162, 226, 0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(64, 162, 226, 0.08) 1px, transparent 1px);
  background-size:
    auto,
    auto,
    34px 34px,
    34px 34px;
  box-shadow:
    inset 0 0 38px rgba(0, 136, 255, 0.2),
    0 0 14px rgba(0, 190, 255, 0.34);
}

.dashboard-panel::before,
.dashboard-panel::after {
  position: absolute;
  z-index: 2;
  content: '';
  pointer-events: none;
}

.dashboard-panel::before {
  left: 11px;
  top: 0;
  width: 82px;
  height: 2px;
  background: #15dbff;
  box-shadow: 0 0 12px #15dbff;
}

.dashboard-panel::after {
  right: 0;
  bottom: 0;
  width: 72px;
  height: 3px;
  border-right: 1px solid #1ccaff;
  border-bottom: 1px solid #1ccaff;
}

.dashboard-panel :deep(.panel-title) {
  position: relative;
  z-index: 1;
  height: 54px;
  flex: 0 0 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px 0 30px;
  border-bottom: 1px solid rgba(62, 178, 244, 0.2);
  background: linear-gradient(90deg, rgba(8, 68, 116, 0.58), rgba(8, 42, 84, 0.12) 44%, transparent);
  box-sizing: border-box;
}

.dashboard-panel :deep(.panel-title)::before {
  position: absolute;
  left: 12px;
  top: 15px;
  width: 5px;
  height: 28px;
  border-radius: 2px;
  content: '';
  background: linear-gradient(180deg, #66f3ff, #0bc6ff);
  box-shadow: 0 0 12px #20d7ff;
}

.dashboard-panel :deep(.panel-title)::after {
  position: absolute;
  left: 14px;
  right: 18px;
  bottom: 0;
  height: 1px;
  content: '';
  background: linear-gradient(90deg, rgba(30, 211, 255, 0.84), rgba(30, 211, 255, 0.22), transparent);
}

.dashboard-panel :deep(.panel-title h2) {
  display: inline;
  margin: 0;
  color: #f4fbff;
  font-size: 27px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: 0;
  text-shadow:
    0 0 8px rgba(255, 255, 255, 0.44),
    0 0 14px rgba(31, 188, 255, 0.86);
}

.dashboard-panel :deep(.panel-body) {
  min-height: 0;
  flex: 1;
}

.panel-total {
  color: #cdefff;
  font-size: 16px;
  font-weight: 700;
}

.panel-total b {
  margin-left: 6px;
  color: #fff;
  font-size: 25px;
}

.range-tabs {
  display: flex;
  align-items: center;
  gap: 7px;
}

.range-tabs button {
  min-width: 82px;
  height: 36px;
  padding: 0 15px;
  border: 1px solid rgba(40, 158, 233, 0.78);
  border-radius: 5px;
  color: #cfeaff;
  font-size: 14px;
  font-weight: 700;
  background: linear-gradient(180deg, rgba(8, 60, 114, 0.92), rgba(2, 23, 61, 0.9));
  box-shadow: inset 0 0 12px rgba(31, 148, 255, 0.18);
  cursor: pointer;
}

.range-tabs button.active {
  color: #fff;
  border-color: #40c8ff;
  background: linear-gradient(180deg, rgba(41, 128, 255, 0.96), rgba(10, 65, 154, 0.98));
  box-shadow:
    inset 0 0 14px rgba(255, 255, 255, 0.34),
    0 0 12px rgba(45, 170, 255, 0.72),
    0 0 2px 1px rgba(93, 209, 255, 0.34);
}

.chart {
  width: 100%;
  height: 100%;
}

.container-list {
  height: 100%;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 9px;
  padding: 8px 14px 14px;
  box-sizing: border-box;
}

.container-card {
  position: relative;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  padding: 8px 11px 11px;
  border: 1px solid rgba(35, 159, 235, 0.82);
  border-radius: 5px;
  background: linear-gradient(180deg, rgba(12, 76, 129, 0.72), rgba(3, 35, 72, 0.94)), radial-gradient(circle at 52% 18%, rgba(59, 178, 255, 0.18), transparent 52%);
  box-shadow:
    inset 0 0 28px rgba(31, 179, 255, 0.16),
    0 0 10px rgba(0, 143, 255, 0.18);
  box-sizing: border-box;
}

.container-card::before {
  position: absolute;
  inset: 8px 10px auto;
  height: 1px;
  content: '';
  background: linear-gradient(90deg, transparent, rgba(28, 197, 255, 0.38), transparent);
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
  position: relative;
  height: 132px;
  width: calc(100% + 10px);
  flex: 0 0 132px;
  display: grid;
  place-items: center;
  overflow: hidden;
  margin: -1px -5px 7px;
  border-radius: 4px;
  background: linear-gradient(180deg, rgba(40, 173, 255, 0.07), rgba(40, 173, 255, 0.01));
}

.product-wrap::after {
  position: absolute;
  left: 16%;
  right: 16%;
  bottom: 9px;
  height: 1px;
  content: '';
  background: rgba(34, 198, 255, 0.52);
  box-shadow: 0 0 16px rgba(34, 198, 255, 0.5);
}

.product-wrap img {
  position: relative;
  z-index: 1;
  width: 148px;
  height: 96px;
  object-fit: contain;
  transform: translateX(-8px);
  filter: drop-shadow(0 12px 12px rgba(0, 0, 0, 0.38)) drop-shadow(0 0 9px rgba(42, 184, 255, 0.38));
}

.product-wrap img.product-crate {
  filter: grayscale(1) saturate(0.05) brightness(0.24) contrast(1.55) drop-shadow(0 13px 10px rgba(0, 0, 0, 0.62)) drop-shadow(0 0 8px rgba(64, 170, 255, 0.28));
}

.product-wrap img.product-crate-medium {
  width: 140px;
  height: 91px;
}

.product-wrap img.product-crate-small {
  width: 126px;
  height: 82px;
}

.product-wrap img.product-cage {
  width: 152px;
  height: 100px;
  filter: saturate(0.48) brightness(1.16) contrast(1.08) drop-shadow(0 11px 10px rgba(0, 0, 0, 0.42)) drop-shadow(0 0 8px rgba(102, 220, 255, 0.56));
}

.product-wrap img.product-pallet {
  width: 156px;
  height: 88px;
  filter: grayscale(1) saturate(0) brightness(1.65) contrast(1.22) drop-shadow(0 11px 10px rgba(0, 0, 0, 0.44)) drop-shadow(0 0 7px rgba(224, 244, 255, 0.42));
}

.container-card strong,
.container-card b {
  display: block;
  width: 100%;
  text-align: center;
  box-sizing: border-box;
}

.container-card strong {
  min-height: 20px;
  padding: 0 2px;
  overflow: hidden;
  display: -webkit-box;
  font-size: 16px;
  line-height: 20px;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.container-card b {
  margin-top: 3px;
  padding-bottom: 2px;
  color: #fff;
  font-size: 29px;
  line-height: 32px;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.28);
}

.partner-table-wrap {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 8px 12px 0;
  box-sizing: border-box;
}

.partner-row {
  display: grid;
  grid-template-columns: 70px minmax(160px, 0.85fr) minmax(250px, 1.35fr) repeat(5, minmax(120px, 1fr)) 110px;
  align-items: center;
  gap: 0;
  height: 27px;
  padding: 0 10px;
  border-bottom: 1px solid rgba(37, 117, 181, 0.36);
  color: #d8efff;
  font-size: 14px;
  box-sizing: border-box;
}

.partner-row span {
  min-width: 0;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 9px;
  border-right: 1px solid rgba(36, 113, 177, 0.38);
  box-sizing: border-box;
}

.partner-row span:not(:nth-child(2)):not(:nth-child(3)):not(:last-child) {
  justify-content: center;
}

.partner-row span:last-child {
  justify-content: center;
  border-right: 0;
}

.partner-row span:nth-child(2),
.partner-row span:nth-child(3) {
  justify-content: flex-start;
}

.partner-head {
  height: 34px;
  color: #aee9ff;
  font-weight: 800;
  background: linear-gradient(180deg, rgba(23, 94, 164, 0.94), rgba(9, 65, 124, 0.9));
  border: 1px solid rgba(42, 139, 211, 0.5);
  border-bottom-color: rgba(70, 185, 255, 0.44);
}

.partner-body {
  min-height: 0;
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  border-inline: 1px solid rgba(27, 107, 176, 0.34);
}

.partner-body.is-seamless {
  overflow-y: hidden;
}

.partner-body.is-seamless :deep(.vue3-seamless-wrapper),
.partner-body.is-seamless :deep(.vue3-seamless-vertical-wrapper) {
  height: 100%;
}

.partner-body::-webkit-scrollbar {
  width: 8px;
}

.partner-body::-webkit-scrollbar-thumb {
  border-radius: 8px;
  background: rgba(57, 177, 246, 0.5);
}

.partner-body::-webkit-scrollbar-track {
  background: rgba(6, 37, 77, 0.55);
}

.partner-body .partner-row:nth-child(odd) {
  background: rgba(4, 32, 73, 0.66);
}

.partner-body .partner-row:nth-child(even) {
  background: rgba(7, 58, 108, 0.68);
}

.partner-body .partner-row:hover {
  background: rgba(21, 103, 171, 0.74);
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 6px;
  border-radius: 50%;
  vertical-align: middle;
}

.status-dot.status-high {
  background: #ff5666;
  box-shadow: 0 0 8px #ff5666;
}

.status-dot.status-normal {
  background: #20ffc4;
  box-shadow: 0 0 8px #20ffc4;
}

.status-dot.status-recovery {
  background: #ffb52f;
  box-shadow: 0 0 8px #ffb52f;
}

.diff-positive {
  color: #20ffc4;
  font-weight: 800;
}

.diff-negative {
  color: #ff5364;
  font-weight: 800;
}

.diff-warning {
  color: #4bdfb4;
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

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  color: rgba(203, 233, 249, 0.55);
  text-align: center;
}

.empty-state.compact {
  min-height: 80px;
}

.dashboard-footer {
  height: 63px;
  display: grid;
  grid-template-columns: repeat(4, 1fr) 250px;
  align-items: center;
  margin-top: 10px;
  border: 1px solid rgba(31, 159, 227, 0.62);
  border-radius: 5px;
  background: linear-gradient(180deg, rgba(4, 41, 78, 0.88), rgba(2, 18, 37, 0.96));
  box-shadow:
    inset 0 8px 20px rgba(0, 130, 222, 0.1),
    0 0 12px rgba(8, 158, 255, 0.18);
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
  grid-row: 1 / 3;
  width: 39px;
  height: 39px;
  filter: drop-shadow(0 0 7px rgba(55, 199, 255, 0.34));
}

.footer-stat span {
  color: #9bd7f4;
  font-size: 13px;
}

.footer-stat strong {
  color: #fff;
  font-size: 23px;
}

.dashboard-footer p {
  margin: 0;
  color: #8ebeda;
  font-size: 12px;
  text-align: center;
  letter-spacing: 1px;
}
</style>
