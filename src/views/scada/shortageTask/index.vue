<template>
  <div ref="boardRef" class="shortage-board shortage-board-theme" :class="{ 'is-fullscreen': isFullscreen }">
    <div class="dashboard-header">
      <div class="header-left">
        <img src="@/assets/logo/kemflo-logo.jpg" alt="Logo" class="logo" :title="'点击切换全屏'" @click.stop="toggleFullscreen" />
      </div>
      <div class="header-center" :title="'点击打开看板配置'" @click="showSettings = true">
        <h2 class="page-title">生产缺料监控看板</h2>
        <el-tag v-if="lastRefreshTime" type="primary" effect="light" class="refresh-tag"> 数据更新 {{ lastRefreshTime }} </el-tag>
      </div>
      <div class="header-right">
        <div class="time-wrap">
          <el-icon><Clock /></el-icon>
          <span class="current-time">{{ currentDateTime }}</span>
        </div>
      </div>
    </div>

    <!--    <div class="kpi-strip kpi-strip&#45;&#45;compact">
      <div v-for="card in statCards" :key="card.key" class="kpi-card" :class="card.themeClass">
        <div class="kpi-top">
          <span class="kpi-title">{{ card.title }}</span>
          <svg-icon :icon-class="card.iconClass" class="kpi-icon" />
        </div>
        <div class="kpi-value">{{ card.value }}</div>
        <div v-if="card.subValue" class="kpi-sub">{{ card.subLabel }} {{ card.subValue }}</div>
        <div v-else-if="card.subLabel" class="kpi-sub">{{ card.subLabel }}</div>
      </div>
    </div>-->

    <section class="main-stage">
      <aside class="col-left col-side">
        <ShortagePanel title="缺料物料TOP5" tone="orange">
          <ShortageMaterialBar :items="materialTop5" />
        </ShortagePanel>
        <ShortagePanel title="缺料明细清单" tone="danger" flex class="detail-panel-wrap">
          <template #title-extra>
            <div class="open-count-badge">
              <span class="badge-corner badge-corner-tl" />
              <span class="badge-corner badge-corner-tr" />
              <span class="badge-corner badge-corner-bl" />
              <span class="badge-corner badge-corner-br" />
              <span class="badge-text">
                共<em class="count-num">{{ openShortageLines.length }}</em> 条
              </span>
            </div>
          </template>
          <ShortageScrollTable bigscreen :rows="detailScrollRows" :columns="detailColumns" :display-limit="settingsForm.displayLimit" :scroll-speed="settingsForm.scrollSpeed" :enable-scroll="settingsForm.enableScroll" empty-text="暂无待处理缺料单据" />
        </ShortagePanel>
      </aside>

      <main class="col-center">
        <div ref="centerHubWrapRef" class="center-hub-wrap">
          <ShortageCenterHub ref="centerHubRef" :data="centerHubData" :stat-cards="hubStatCards" />
        </div>
      </main>

      <aside class="col-right col-side">
        <ShortagePanel title="指标水球图" tone="orange" class="liquid-panel-wrap">
          <div class="liquid-row">
            <ShortageLiquidGauge
              title="库存满足率"
              :value="liquidInventoryFulfillmentRate"
              threshold-mode="inventory-fulfillment"
            />
            <ShortageLiquidGauge title="需求满足率" :value="centerHubData.demandFulfillmentRate" color="cyan" />
          </div>
        </ShortagePanel>
        <ShortagePanel title="库存满足分析">
          <ShortageFulfillmentPanel :summary="fulfillmentSummary" />
        </ShortagePanel>
        <ShortagePanel title="可用库存" flex class="stock-panel-wrap">
          <template #title-extra>
            <div class="open-count-badge open-count-badge--stock">
              <span class="badge-corner badge-corner-tl" />
              <span class="badge-corner badge-corner-tr" />
              <span class="badge-corner badge-corner-bl" />
              <span class="badge-corner badge-corner-br" />
              <span class="badge-text">
                共<em class="count-num">{{ realtimeStockList.length }}</em> 条
              </span>
            </div>
          </template>
          <ShortageScrollTable bigscreen stock-mode :rows="stockScrollRows" :columns="stockColumns" :display-limit="settingsForm.stockDisplayLimit" :scroll-speed="settingsForm.stockScrollSpeed" :enable-scroll="settingsForm.enableScroll" empty-text="暂无实时库存数据" />
        </ShortagePanel>
      </aside>
    </section>

    <div class="board-bottom">
      <div class="board-bottom-text">
        <h5><span class="bottom-top">缺料监控数据</span></h5>
        <p>Shortage Monitoring Data</p>
      </div>
    </div>

    <el-dialog v-model="showSettings" :title="'看板参数配置'" width="700px" append-to-body class="config-dialog" modal-class="shortage-board-dialog-modal">
      <el-form :model="settingsForm" label-width="130px" size="large">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="'明细展示行数'">
              <el-slider v-model="settingsForm.displayLimit" :min="5" :max="100" :step="1" show-input />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="'明细滚动速度'">
              <el-slider v-model="settingsForm.scrollSpeed" :min="0.2" :max="2" :step="0.1" show-input />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="'可用库存展示行数'">
              <el-slider v-model="settingsForm.stockDisplayLimit" :min="5" :max="100" :step="1" show-input />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="'可用库存滚动速度'">
              <el-slider v-model="settingsForm.stockScrollSpeed" :min="0.2" :max="2" :step="0.1" show-input />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="'自动刷新'">
              <el-switch v-model="settingsForm.autoRefresh"  />
            </el-form-item>
          </el-col>
          <el-col :span="24" v-if="settingsForm.autoRefresh">
            <el-form-item :label="'刷新间隔'">
              <el-input-number v-model="settingsForm.refreshInterval" :min="15" :max="300" :step="5">
                <template #suffix>秒</template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button size="large" @click="showSettings = false">取消</el-button>
        <el-button type="primary" size="large" @click="saveSettings">保存配置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch, getCurrentInstance, type ComponentInternalInstance } from 'vue';
import { dayjs } from 'element-plus';
import { Clock } from '@element-plus/icons-vue';
import {
  aggregateShortageMaterialRank,
  loadScadaShortageBoardData,
  totalInventoryByItemCodes,
  type ShortageFulfillmentLineResult,
  type ShortageFulfillmentSimulationResult,
  type ShortageTaskLineVO
} from '@/api/scada/shortageTask';
import { useAppStore } from '@/store/modules/app';
import { formatQty } from '@/utils/ruoyi';
import ShortageCenterHub, { type HubStatCard, type ShortageHubDatum } from './components/ShortageCenterHub.vue';
import ShortagePanel from './components/ShortagePanel.vue';
import ShortageMaterialBar from './components/ShortageMaterialBar.vue';
import ShortageLiquidGauge from './components/ShortageLiquidGauge.vue';
import ShortageFulfillmentPanel from './components/ShortageFulfillmentPanel.vue';
import ShortageScrollTable, { type BoardRow, type ScrollColumn } from './components/ShortageScrollTable.vue';

const STORAGE_KEY = 'shortageTaskScadaSettings';

interface SettingsForm {
  displayLimit: number;
  stockDisplayLimit: number;
  scrollSpeed: number;
  stockScrollSpeed: number;
  refreshInterval: number;
  autoRefresh: boolean;
  enableScroll: boolean;
}

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const appStore = useAppStore();
const boardRef = ref<HTMLElement | null>(null);
const centerHubWrapRef = ref<HTMLElement | null>(null);
const centerHubRef = ref<InstanceType<typeof ShortageCenterHub> | null>(null);
const showSettings = ref(false);
const currentDateTime = ref('');
const lastRefreshTime = ref('');
const isFullscreen = ref(false);
const allLines = ref<BoardRow[]>([]);
const fulfillmentResult = ref<ShortageFulfillmentSimulationResult | null>(null);
const fulfillmentSummary = computed(() => fulfillmentResult.value?.summary ?? null);

const stockRecordList = ref<
  {
    rowKey: string;
    materialCode: string;
    materialName: string;
    qty: number;
  }[]
>([]);

const settingsForm = reactive<SettingsForm>({
  displayLimit: 20,
  stockDisplayLimit: 20,
  scrollSpeed: 0.4,
  stockScrollSpeed: 0.4,
  refreshInterval: 60,
  autoRefresh: true,
  enableScroll: true
});

const CLOSED_STATUSES = new Set(['FULFILLED', 'CLOSED', 'CANCELLED']);
const MAX_SCROLL_ROWS = 120;

function toNumber(value?: number | string | null) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function buildBoardRow(line: ShortageTaskLineVO): BoardRow {
  return {
    ...line,
    rowKey: String(line.id ?? `${line.demandNo}-${line.workOrderNo}-${line.materialCode}`)
  };
}

const openLineStats = computed(() => {
  const lines: BoardRow[] = [];
  let totalQty = 0;
  const materialCodes = new Set<string>();
  const workOrders = new Set<string>();
  const statusCounts = new Map<string, number>();

  for (const line of allLines.value) {
    const status = String(line.lineStatus || 'PENDING').toUpperCase();
    if (CLOSED_STATUSES.has(status)) continue;
    if (toNumber(line.shortageQty) <= 0) continue;

    lines.push(line);
    totalQty += toNumber(line.shortageQty);

    const code = String(line.materialCode || '').trim();
    if (code) materialCodes.add(code);

    const workOrderNo = String(line.workOrderNo || '').trim();
    if (workOrderNo) workOrders.add(workOrderNo);

    statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
  }

  return {
    lines,
    totalQty,
    materialCount: materialCodes.size,
    workOrderCount: workOrders.size,
    statusCounts
  };
});

const openShortageLines = computed(() => openLineStats.value.lines);
const uniqueShortageMaterialCount = computed(() => openLineStats.value.materialCount);
const uniqueShortageWorkOrderCount = computed(() => openLineStats.value.workOrderCount);

/** 缺料明细接口返回的有效缺料行（排除已结案/取消） */
const shortageDetailLines = computed(() => openShortageLines.value);

const detailScrollRows = computed(() => openShortageLines.value.slice(0, MAX_SCROLL_ROWS));

const statCards = computed(() => [
  {
    key: 'openLineCount',
    title: '缺料明细数',
    value: openShortageLines.value.length,
    subLabel: '待处理单据',
    subValue: '',
    themeClass: 'card-danger',
    iconClass: 'shortageMaterial'
  },
  {
    key: 'inventorySatisfied',
    title: '满足需求',
    value: fulfillmentSummary.value?.fullLineCount ?? 0,
    subLabel: '库存可满足单据',
    subValue: '',
    themeClass: 'card-blue',
    iconClass: 'issue'
  },
  {
    key: 'workOrderCount',
    title: '缺料工单数',
    value: uniqueShortageWorkOrderCount.value,
    subLabel: '涉及工单',
    subValue: '',
    themeClass: 'card-yellow',
    iconClass: 'task'
  },
  {
    key: 'materialCount',
    title: '缺料种数',
    value: uniqueShortageMaterialCount.value,
    subLabel: '物料种类',
    subValue: '',
    themeClass: 'card-orange',
    iconClass: 'barcode'
  },
  {
    key: 'closureDemand',
    title: '满足结案需求数',
    value: fulfillmentSummary.value?.fullCount ?? 0,
    subLabel: '历史结案需求',
    subValue: '',
    themeClass: 'card-green',
    iconClass: 'material-supermarket'
  }
]);

const hubStatCards = computed(() =>
  statCards.value.slice(0, 4).map((card) => ({
    key: card.key,
    title: card.title,
    value: String(card.value),
    subLabel: card.subLabel,
    subValue: card.subValue,
    themeClass: card.themeClass
  }))
);

/** 工单结案率 = 缺料行库存检查后满足的工单号去重数 / 缺料工单数 */
function computeWorkOrderClosureRate(
  shortageLines: BoardRow[],
  lineMap: Record<string, ShortageFulfillmentLineResult> | undefined
) {
  const workOrderLines = new Map<string, BoardRow[]>();
  for (const line of shortageLines) {
    const workOrderNo = String(line.workOrderNo || '').trim();
    if (!workOrderNo) continue;
    const bucket = workOrderLines.get(workOrderNo) || [];
    bucket.push(line);
    workOrderLines.set(workOrderNo, bucket);
  }

  const shortageWorkOrderCount = workOrderLines.size;
  if (!shortageWorkOrderCount) return 0;

  let fulfilledWorkOrderCount = 0;
  workOrderLines.forEach((rows) => {
    const satisfied = rows.length > 0 && rows.every((line) => lineMap?.[String(line.id)]?.fulfillmentStatus === 'FULL');
    if (satisfied) fulfilledWorkOrderCount += 1;
  });

  return Math.round((fulfilledWorkOrderCount / shortageWorkOrderCount) * 100);
}

const centerHubData = computed<ShortageHubDatum>(() => {
  const { totalQty } = openLineStats.value;
  const summary = fulfillmentSummary.value;
  const lineMap = fulfillmentResult.value?.lineMap;

  return {
    totalQty,
    // 缺料率 = 剩余缺料数量 / 总缺料数量
    shortageRate:
      summary && summary.totalShortageQty > 0
        ? Math.round((summary.totalRemainingQty / summary.totalShortageQty) * 100)
        : 0,
    // 库存满足率 = 库存可用满足缺料数量 / 总缺料数量
    inventoryFulfillmentRate:
      summary && summary.totalShortageQty > 0
        ? Math.round((summary.totalAllocatedQty / summary.totalShortageQty) * 100)
        : 0,
    // 需求满足率 = 库存完全满足行数 / 总需求行数
    demandFulfillmentRate:
      summary && summary.shortageLineCount > 0
        ? Math.round((summary.fullLineCount / summary.shortageLineCount) * 100)
        : 0,
    // 工单结案率 = 库存检查后满足的工单号去重数 / 缺料工单数
    closureRate: computeWorkOrderClosureRate(shortageDetailLines.value, lineMap),
    // 零库存断料占比 = checkInventory 可用库存为 0 的缺料物料种类 / 缺料物料种类
    zeroStockShortageRate: summary?.zeroStockShortageRate ?? 0,
    // 重复物料占比 = checkInventory 返回的在多条缺料行中出现的物料种类占比
    repeatMaterialRate: summary?.repeatMaterialRate ?? 0
  };
});

/** 水球图-库存满足率：库存可用满足数量 / 总缺料数量 */
const liquidInventoryFulfillmentRate = computed(() => centerHubData.value.inventoryFulfillmentRate);

const realtimeStockList = computed(() => stockRecordList.value.slice().sort((a, b) => b.qty - a.qty));

const stockScrollRows = computed(() => realtimeStockList.value.slice(0, MAX_SCROLL_ROWS));

/** 缺料物料 Top5：缺料明细接口数据按物料编码累加 shortageQty 后排名 */
const materialTop5 = computed(() => aggregateShortageMaterialRank(shortageDetailLines.value, 5));

const detailColumns: ScrollColumn[] = [
  { key: 'workOrderNo', label: '工单号', flex: 0.85, minWidth: '72px', render: (row) => row.workOrderNo || '-' },
  {
    key: 'materialCode',
    label: '物料编码',
    flex: 1.2,
    minWidth: '96px',
    headerAlign: 'center',
    align: 'left',
    className: 'cell-material-code',
    render: (row) => row.materialCode || '-'
  },
  { key: 'materialName', label: '物料名称', flex: 1.2, headerAlign: 'center', align: 'left', render: (row) => row.materialName || '-' },
  {
    key: 'shortageQty',
    label: '缺料数量',
    flex: 0.75,
    minWidth: '64px',
    headerAlign: 'center',
    align: 'right',
    className: 'qty-cell',
    render: (row) => String(formatQty(row.shortageQty))
  }
];

const stockColumns: ScrollColumn[] = [
  { key: 'materialCode', label: '物料编码', flex: 1, render: (row) => String(row.materialCode || '-') },
  { key: 'materialName', label: '物料名称', flex: 1.35, align: 'left', render: (row) => String(row.materialName || '-') },
  {
    key: 'qty',
    label: '数量',
    flex: 0.75,
    headerAlign: 'right',
    align: 'right',
    className: 'stock-qty',
    render: (row) => String(formatQty(row.qty))
  }
];

function collectShortageMaterialContext(lines: BoardRow[]) {
  const codes = new Set<string>();
  const nameMap = new Map<string, string>();
  for (const line of lines) {
    const status = String(line.lineStatus || 'PENDING').toUpperCase();
    if (CLOSED_STATUSES.has(status)) continue;
    if (toNumber(line.shortageQty) <= 0) continue;
    const code = String(line.materialCode || '').trim();
    if (!code) continue;
    codes.add(code);
    if (!nameMap.has(code) && line.materialName) {
      nameMap.set(code, String(line.materialName));
    }
  }
  return { itemCodes: [...codes], nameMap };
}

async function loadRealtimeInventory(lines: BoardRow[]) {
  const { itemCodes, nameMap } = collectShortageMaterialContext(lines);
  if (!itemCodes.length) {
    stockRecordList.value = [];
    return;
  }
  const res = await totalInventoryByItemCodes({ itemCodes });
  const rows = Array.isArray(res.data) ? res.data : [];
  stockRecordList.value = rows
    .map((row) => {
      const code = String(row.itemCode || '').trim();
      if (!code) return null;
      return {
        rowKey: code,
        materialCode: code,
        materialName: String(row.itemName || nameMap.get(code) || code),
        qty: toNumber(row.totalQuantity)
      };
    })
    .filter((row): row is NonNullable<typeof row> => !!row)
    .sort((a, b) => b.qty - a.qty);
}

let loadDataRunning = false;

async function loadData() {
  if (loadDataRunning) return;
  loadDataRunning = true;
  try {
    const { lines, fulfillment } = await loadScadaShortageBoardData();
    allLines.value = lines.map(buildBoardRow);
    lastRefreshTime.value = dayjs().format('HH:mm:ss');
    try {
      await loadRealtimeInventory(allLines.value);
    } catch (error) {
      stockRecordList.value = [];
      console.error('加载实时库存失败：', error);
    }
    fulfillmentResult.value = fulfillment;
  } catch (error) {
    fulfillmentResult.value = null;
    console.error('加载缺料数据失败：', error);
  } finally {
    loadDataRunning = false;
  }
}

function updateDateTime() {
  currentDateTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss');
}

function toggleFullscreen() {
  if (!document.fullscreenEnabled) {
    proxy?.$modal?.msgWarning('当前浏览器不支持全屏模式');
    return;
  }
  if (!isFullscreen.value) {
    boardRef.value?.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

let layoutRaf = 0;

/** 看板 rem 基准：仅作用于 .shortage-board，避免影响顶部标签页等全局布局 */
function updateBoardRem() {
  const board = boardRef.value;
  if (!board) return;
  board.style.setProperty('--board-rem', `${board.clientWidth / 80}px`);
}

function refreshBoardLayout() {
  if (layoutRaf) cancelAnimationFrame(layoutRaf);
  layoutRaf = requestAnimationFrame(() => {
    layoutRaf = 0;
    updateBoardRem();
    centerHubRef.value?.syncLayout?.();
  });
}

function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement;
  appStore.toggleSideBarHide(isFullscreen.value);
  refreshBoardLayout();
  window.setTimeout(refreshBoardLayout, 120);
}

function syncChromeVisibility() {
  appStore.toggleSideBarHide(isFullscreen.value);
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settingsForm }));
  proxy?.$modal?.msgSuccess('看板配置保存成功');
  showSettings.value = false;
}

let clockTimer: number | null = null;
let refreshTimer: number | null = null;
let boardResizeObserver: ResizeObserver | null = null;

function setupRefreshTimer() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = null;
  if (settingsForm.autoRefresh) {
    refreshTimer = window.setInterval(loadData, settingsForm.refreshInterval * 1000);
  }
}

onMounted(async () => {
  syncChromeVisibility();
  updateBoardRem();
  updateDateTime();
  clockTimer = window.setInterval(updateDateTime, 1000);
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) Object.assign(settingsForm, JSON.parse(saved));
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  window.addEventListener('resize', refreshBoardLayout);
  if (centerHubWrapRef.value) {
    boardResizeObserver = new ResizeObserver(refreshBoardLayout);
    boardResizeObserver.observe(centerHubWrapRef.value);
  }
  await loadData();
  setupRefreshTimer();
  refreshBoardLayout();
});

watch(
  () => [settingsForm.autoRefresh, settingsForm.refreshInterval],
  () => setupRefreshTimer()
);

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer);
  if (refreshTimer) clearInterval(refreshTimer);
  if (layoutRaf) cancelAnimationFrame(layoutRaf);
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  window.removeEventListener('resize', refreshBoardLayout);
  if (document.fullscreenElement === boardRef.value) {
    document.exitFullscreen().catch(() => undefined);
  }
  appStore.toggleSideBarHide(false);
  boardResizeObserver?.disconnect();
  boardResizeObserver = null;
});
</script>

<style scoped lang="scss">
.shortage-board,
.shortage-board-theme {
  --board-rem: 16px;
  position: relative;
  width: 100%;
  height: calc(100vh - 84px);
  min-height: calc(100vh - 84px);
  padding: 0;
  box-sizing: border-box;
  background: #020818;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow: hidden;
  color: #e8f4ff;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  color-scheme: dark;
  --el-bg-color: #0f1936;
  --el-bg-color-overlay: #0f1936;
  --el-text-color-primary: #e8f4ff;
  --el-text-color-regular: #c6e0ff;
  --el-border-color: rgba(10, 193, 199, 0.2);
  --ref-cyan: #0ac1c7;
  --ref-orange: #f29701;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background: url('@/assets/images/scada/shortageTask/hub/53bg.png') no-repeat;
    background-size: 100% 100%;
  }

  > * {
    position: relative;
    z-index: 2;
  }
}

.shortage-board.is-fullscreen {
  height: 100vh;
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  height: 76px;
  padding: 0 10px;
  box-sizing: border-box;
  border-radius: 0;
  background: url('@/assets/images/scada/shortageTask/hub/53titlebg.png') no-repeat top center;
  background-size: 100% 100%;
  border: none;
  box-shadow: none;

  .header-left,
  .header-right {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    align-self: flex-start;
    padding-top: 8px;
  }

  .header-left {
    justify-content: flex-start;

    .logo {
      height: 48px;
      border-radius: 6px;
      cursor: pointer;
      box-shadow: 0 0 10px rgba(0, 200, 255, 0.3);
    }
  }

  .header-right {
    justify-content: flex-end;
  }

  .header-center {
    flex: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    cursor: pointer;

    .page-title {
      font-size: 30px;
      font-weight: 500;
      margin: 0;
      letter-spacing: 3px;
      background: linear-gradient(180deg, #86919e, #fff);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      white-space: nowrap;
      text-shadow: 0 0 30px rgba(10, 193, 199, 0.2);
    }

    .refresh-tag {
      background: rgba(10, 193, 199, 0.12);
      border: 1px solid rgba(10, 193, 199, 0.32);
      color: #93f8fb;
    }
  }

  .time-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    color: #93f8fb;

    .el-icon {
      color: var(--ref-cyan);
      font-size: 20px;
    }
  }

  .current-time {
    font-variant-numeric: tabular-nums;
  }
}

.kpi-strip--compact {
  display: none;
}

.kpi-strip {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 80px;
  padding: 10px 10px 10px 10px;
}

.kpi-card {
  height: 82px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    right: -18px;
    bottom: -22px;
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.04);
  }
}

.kpi-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.kpi-title {
  font-size: 12px;
  color: rgba(198, 224, 255, 0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  opacity: 0.9;
}

.kpi-value {
  font-size: clamp(20px, 1.8vw, 28px);
  font-weight: 700;
  line-height: 1;
  font-family: Consolas, 'Courier New', monospace;
  font-variant-numeric: tabular-nums;
}

.kpi-sub {
  font-size: 11px;
  color: rgba(164, 216, 255, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-danger {
  background: linear-gradient(135deg, rgba(180, 30, 60, 0.22), rgba(100, 10, 30, 0.1));
  .kpi-value,
  .kpi-icon {
    color: #ff8a8a;
  }
}

.card-orange {
  background: linear-gradient(135deg, rgba(200, 100, 20, 0.2), rgba(100, 50, 10, 0.1));
  .kpi-value,
  .kpi-icon {
    color: #ffb366;
  }
}

.card-yellow {
  background: linear-gradient(135deg, rgba(180, 150, 20, 0.18), rgba(90, 70, 10, 0.1));
  .kpi-value,
  .kpi-icon {
    color: #ffe066;
  }
}

.card-blue {
  background: linear-gradient(135deg, rgba(0, 120, 200, 0.2), rgba(0, 60, 100, 0.1));
  .kpi-value,
  .kpi-icon {
    color: #74c0fc;
  }
}

.card-green {
  background: linear-gradient(135deg, rgba(30, 160, 80, 0.18), rgba(10, 80, 40, 0.1));
  .kpi-value,
  .kpi-icon {
    color: #69db7c;
  }
}

.main-stage {
  flex: 1;
  min-height: 0;
  padding: 0 10px;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(180px, 17.5%) minmax(0, 65%) minmax(180px, 17.5%);
  gap: 0;
}

.col-left,
.col-center,
.col-right {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.col-side {
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.col-center {
  gap: 0;
  flex: 1;
  min-height: 0;
}

.center-hub-wrap {
  flex: 1;
  min-height: 0;
  min-width: 0;
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

.detail-panel-wrap,
.stock-panel-wrap {
  :deep(.panel-body) {
    display: flex;
    flex-direction: column;
    padding-top: 4px;
  }
}

.open-count-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 12px;
  border: 1px solid rgba(255, 120, 120, 0.45);
  background: linear-gradient(90deg, rgba(255, 80, 80, 0.12), rgba(255, 140, 80, 0.08));
  box-shadow:
    0 0 12px rgba(255, 90, 90, 0.18),
    inset 0 0 10px rgba(255, 100, 100, 0.06);

  &--stock {
    border-color: rgba(10, 193, 199, 0.45);
    background: linear-gradient(90deg, rgba(10, 193, 199, 0.14), rgba(2, 166, 181, 0.08));
    box-shadow:
      0 0 12px rgba(10, 193, 199, 0.18),
      inset 0 0 10px rgba(10, 193, 199, 0.06);

    .badge-text {
      color: #d0f0f2;

      .count-num {
        color: #09c2c8;
        text-shadow: 0 0 8px rgba(9, 194, 200, 0.55);
      }
    }

    .badge-corner {
      border-color: rgba(10, 193, 199, 0.65);
    }
  }
}

.badge-text {
  font-size: 14px;
  color: #f0d8d8;
  letter-spacing: 0.5px;
  white-space: nowrap;

  .count-num {
    font-style: normal;
    font-family: Consolas, 'Courier New', monospace;
    font-size: 17px;
    font-weight: 700;
    color: #ff8a8a;
    margin: 0 3px;
    text-shadow: 0 0 8px rgba(255, 120, 120, 0.55);
  }
}

.badge-corner {
  position: absolute;
  width: 7px;
  height: 7px;
  border-color: #ff9e9e;
  border-style: solid;
  opacity: 0.95;
}

.badge-corner-tl {
  left: -1px;
  top: -1px;
  border-width: 2px 0 0 2px;
}

.badge-corner-tr {
  right: -1px;
  top: -1px;
  border-width: 2px 2px 0 0;
}

.badge-corner-bl {
  left: -1px;
  bottom: -1px;
  border-width: 0 0 2px 2px;
}

.badge-corner-br {
  right: -1px;
  bottom: -1px;
  border-width: 0 2px 2px 0;
}

.liquid-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  height: 132px;
}

.liquid-panel-wrap {
  flex-shrink: 0;

  :deep(.panel-body) {
    padding: 6px 8px 8px;
  }
}

.board-bottom {
  position: relative;
  flex-shrink: 0;
  height: 52px;
  margin-top: auto;
  overflow: visible;
  box-sizing: border-box;
  background: url('@/assets/images/scada/shortageTask/hub/53bottomsjbg.png') no-repeat bottom center;
  background-size: 100%;
  border: none;
}

.board-bottom-text {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;

  h5 {
    margin: 0;
    padding-bottom: 15px;
    font-weight: inherit;
  }

  .bottom-top {
    display: block;
    font-size: 16px;
    font-weight: 500;
    line-height: 1;
    background: linear-gradient(180deg, #86919e, #fff);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  p {
    margin: 0;
    font-size: 11px;
    line-height: 1;
    color: var(--ref-cyan);
    letter-spacing: 1px;
    text-transform: uppercase;
  }
}

.config-dialog :deep(.el-dialog) {
  background: #0f1936;
  border: 1px solid rgba(0, 160, 255, 0.2);
  border-radius: 12px;
}

.config-dialog :deep(.el-dialog__header) {
  background: #0f1936;
  border-radius: 12px 12px 0 0;
  color: #fff;
}

.config-dialog :deep(.el-dialog__body) {
  background: #0f1936;
  color: #e8f4ff;
  padding: 24px;
}

.config-dialog :deep(.el-dialog__footer) {
  background: #0f1936;
  border-radius: 0 0 12px 12px;
}

.config-dialog :deep(.el-dialog__title) {
  color: #fff;
}

.config-dialog :deep(.el-form-item__label) {
  color: #c6e0ff;
}

.config-dialog :deep(.el-slider__runway) {
  background: #1c2c54;
}

.config-dialog :deep(.el-input-number__inner) {
  background: #1c2c54;
  border-color: #305699;
}
</style>

<style lang="scss">
.shortage-board {
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.06);
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(73, 188, 247, 0.35);
    border-radius: 3px;
  }
}

.shortage-board-dialog-modal {
  background-color: rgba(2, 8, 24, 0.72) !important;
}

.shortage-board-select-popper.el-popper {
  --el-bg-color-overlay: #041633;
  --el-text-color-regular: #e8f6ff;
  background: #041633 !important;
  border: 1px solid rgba(73, 188, 247, 0.22) !important;

  .el-select-dropdown__item {
    color: #d8ecff;
  }
  .el-select-dropdown__item.is-hovering,
  .el-select-dropdown__item:hover {
    background: rgba(73, 188, 247, 0.16);
  }
  .el-select-dropdown__item.is-selected {
    color: #49bcf7;
    font-weight: 600;
  }
}
</style>
