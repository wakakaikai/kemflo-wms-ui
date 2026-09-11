<template>
  <div ref="pageRef" v-loading="loading" :class="['machine-status-page', { 'image-capture-mode': imageCaptureMode }]">
    <div class="page-heading">
      <div class="heading-tabs">
        <span class="active-tab"><i class="tab-icon">≡</i> 状态</span>
        <span>{{ machineScopeTitle }}</span>
      </div>
    </div>

    <section class="filter-bar no-print">
      <el-select v-model="selectedMachines" class="machine-select" multiple collapse-tags collapse-tags-tooltip :max-collapse-tags="1" clearable placeholder="请选择机器" @change="handleFilterChange">
        <template #header>
          <div class="machine-select-header">
            <el-input v-model="machineKeyword" clearable prefix-icon="Search" placeholder="搜索机器名称" class="machine-search-input" />
            <div class="machine-select-actions">
              <button type="button" @click.stop="clearMachineSelection">全部清除</button>
              <button type="button" @click.stop="selectAllMachines">{{ machineKeyword.trim() ? '选择搜索结果' : '全部选择' }}</button>
            </div>
          </div>
        </template>
        <el-option v-for="machine in filteredMachineOptions" :key="machine" :label="machine" :value="machine" />
      </el-select>
      <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" unlink-panels :clearable="false" start-placeholder="开始日期" end-placeholder="结束日期" class="date-range-picker" @change="handleDateRangeChange" />
      <div class="filter-spacer"></div>
      <el-button type="success" icon="Download" @click="handleDownload">导出</el-button>
      <el-button type="primary" icon="Camera" @click="handlePrint">截图</el-button>
    </section>

    <section class="chart-grid">
      <article class="chart-card">
        <header>机器停止/闲置原因（分钟）</header>
        <div class="chart-body">
          <div ref="reasonChartRef" class="chart-canvas"></div>
          <ul class="chart-legend">
            <li
              v-for="item in reasonChartItems"
              :key="item.name"
              :class="{ 'is-disabled': reasonLegendSelected[item.name] === false }"
              :title="`${item.name} ${Number(item.minutes).toFixed(2)} 分钟`"
              @click="toggleChartLegend('reason', item.name)"
              @mouseenter="highlightChartItem('reason', item.name)"
              @mouseleave="downplayChartItem('reason', item.name)"
            >
              <i :style="{ backgroundColor: item.color }"></i>
              <span>{{ item.name }}</span>
            </li>
            <li v-if="dashboard.reasonDistribution.length === 0" class="legend-empty">暂无停止/闲置原因</li>
          </ul>
        </div>
        <footer>时间（小时）：{{ formatHours(windowHours) }}</footer>
      </article>
      <article class="chart-card">
        <header>机器状态（分钟）</header>
        <div class="chart-body">
          <div ref="statusChartRef" class="chart-canvas"></div>
          <ul class="chart-legend">
            <li
              v-for="item in dashboard.statusDistribution"
              :key="item.name"
              :class="{ 'is-disabled': statusLegendSelected[item.name] === false }"
              :title="`${item.name} ${Number(item.minutes).toFixed(2)} 分钟`"
              @click="toggleChartLegend('status', item.name)"
              @mouseenter="highlightChartItem('status', item.name)"
              @mouseleave="downplayChartItem('status', item.name)"
            >
              <i :style="{ backgroundColor: item.color }"></i>
              <span>{{ item.name }}</span>
            </li>
            <li v-if="dashboard.statusDistribution.length === 0" class="legend-empty">暂无机器状态</li>
          </ul>
        </div>
        <footer>时间（小时）：{{ formatHours(windowHours) }}</footer>
      </article>
    </section>

    <section class="timeline-section">
      <div class="timeline-title-row">
        <h2>机器状态</h2>
        <div class="timeline-tools no-print">
          <template v-if="singleMachineMode">
            <span class="timeline-hint">{{ selectedMachines[0] }} · 按所选日期范围逐日显示</span>
          </template>
          <template v-else>
            <span class="timeline-hint">按生产日 08:00～次日 08:00 显示</span>
            <el-date-picker v-model="timelineDate" type="date" value-format="YYYY-MM-DD" :clearable="false" :disabled-date="disableTimelineDate" class="timeline-date-picker" @change="handleTimelineDateChange" />
          </template>
        </div>
      </div>

      <div class="timeline-scroll">
        <div class="timeline-table">
          <div class="summary-row table-grid">
            <div></div>
            <strong>机器状态（24小时）</strong>
            <strong>平均 OEE</strong>
            <strong class="average-oee">{{ formatPercent(timelineAverageOee) }}</strong>
            <span>总不良品：{{ timelineTotalDefective }}</span>
          </div>

          <div class="header-row table-grid">
            <div class="machine-cell">{{ singleMachineMode ? '日期' : '机器' }}</div>
            <div class="hour-axis">
              <span v-for="hour in hours" :key="hour" :class="{ nextDay: hour >= 20 || hour < 8 }">{{ hour }}:00</span>
            </div>
            <div>OEE %</div>
            <div>数量</div>
            <div>不良品</div>
          </div>

          <div v-for="timeline in timelineRows" :key="timeline.rowKey" class="machine-row table-grid">
            <div
              :class="['machine-cell', 'ellipsis', { 'is-clickable': !singleMachineMode }]"
              :title="timeline.rowLabel"
              @click="handleTimelineMachineClick(timeline.machine)"
            >
              {{ timeline.rowLabel }}
            </div>
            <div class="status-track">
              <div class="hour-lines">
                <i v-for="hour in 24" :key="hour"></i>
              </div>
              <el-tooltip v-for="segment in timeline.segments" :key="`${timeline.rowKey}-${segment.id}-${segment.startSecond}`" placement="top" effect="dark">
                <template #content>
                  <div class="segment-tooltip">
                    <strong>{{ segment.statusName }}</strong>
                    <span>英文状态：{{ segment.status || '-' }}</span>
                    <span>时间：{{ segment.startAt }} ～ {{ segment.endAt }}</span>
                    <span>时长：{{ formatDuration(segment.durationSeconds) }}</span>
                    <span>原因：{{ segment.reason || '没有原因' }}</span>
                    <span v-if="segment.inherited">来源：跨时段继承前一状态</span>
                    <span v-if="segment.jobId">工单：{{ segment.jobId }}</span>
                    <span v-if="segment.moldId">模具：{{ segment.moldId }}</span>
                  </div>
                </template>
                <span class="status-segment" :style="getSegmentStyle(segment)"></span>
              </el-tooltip>
            </div>
            <div :class="['oee-cell', getOeeClass(timeline.oee)]">{{ formatPercent(timeline.oee) }}</div>
            <div>{{ timeline.quantity ?? 0 }}</div>
            <div>{{ timeline.defectiveCount ?? 0 }}</div>
          </div>

          <div v-if="timelineRows.length === 0" class="empty-row">所选日期暂无机器状态数据</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup name="InjectMachineStatus" lang="ts">
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import * as echarts from 'echarts';
import html2canvas from 'html2canvas';
import FileSaver from 'file-saver';
import { getMachineNames, getMachineStatusDashboard } from '@/api/inject/machineStatus';
import type { MachineStatusDashboardVO, MachineStatusDistributionVO, MachineStatusSegmentVO, MachineTimelineVO } from '@/api/inject/machineStatus/types';

const DAY_SECONDS = 86400;
const FILTER_CACHE_KEY = 'inject-machine-status-filter';
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const pageRef = ref<HTMLElement>();
const reasonChartRef = ref<HTMLElement>();
const statusChartRef = ref<HTMLElement>();
const reasonLegendSelected = ref<Record<string, boolean>>({});
const statusLegendSelected = ref<Record<string, boolean>>({});
const loading = ref(false);
const imageCaptureMode = ref(false);
const imageGenerating = ref(false);
const machineOptions = ref<string[]>([]);
const machineKeyword = ref('');
const selectedMachines = ref<string[]>([]);
const dateRange = ref<[string, string]>([getDefaultDate(), getDefaultDate()]);
const timelineDate = ref(getDefaultDate());
const emptyDashboard = (): MachineStatusDashboardVO => ({
  date: dateRange.value[0],
  startDate: dateRange.value[0],
  endDate: dateRange.value[1],
  startAt: '',
  endAt: '',
  windowSeconds: DAY_SECONDS,
  reasonDistribution: [],
  statusDistribution: [],
  timelines: []
});
const dashboard = ref<MachineStatusDashboardVO>(emptyDashboard());
const hours = Array.from({ length: 24 }, (_, index) => (index + 8) % 24);
let reasonChart: echarts.ECharts | undefined;
let statusChart: echarts.ECharts | undefined;
let filterTimer: ReturnType<typeof setTimeout> | undefined;
let hasCachedMachineSelection = false;
let cachedSelectAllMachines = false;

const windowHours = computed(() => (dashboard.value.windowSeconds || DAY_SECONDS) / 3600);
const filteredMachineOptions = computed(() => {
  const keyword = machineKeyword.value.trim().toLowerCase();
  return keyword ? machineOptions.value.filter((machine) => machine.toLowerCase().includes(keyword)) : machineOptions.value;
});
const reasonChartItems = computed(() => dashboard.value.reasonDistribution || []);
const singleMachineMode = computed(() => selectedMachines.value.length === 1);
const machineScopeTitle = computed(() => {
  if (singleMachineMode.value) return selectedMachines.value[0];
  if (selectedMachines.value.length === 0) return '未选择机器';
  if (selectedMachines.value.length === machineOptions.value.length) return '所有机器';
  return `已选${selectedMachines.value.length}台机器`;
});

const timelineDayOffset = computed(() => {
  const startDate = dashboard.value.startDate || dateRange.value[0];
  const selected = timelineDate.value || startDate;
  const startMs = parseLocalDate(startDate).getTime();
  const selectedMs = parseLocalDate(selected).getTime();
  const dayIndex = Math.max(0, Math.round((selectedMs - startMs) / 86400000));
  return dayIndex * DAY_SECONDS;
});

const timelineRows = computed(() => {
  if (selectedMachines.value.length === 0) return [];
  if (singleMachineMode.value) {
    const selectedMachine = selectedMachines.value[0];
    const timeline = (dashboard.value.timelines || []).find((item) => item.machine === selectedMachine);
    if (!timeline) return [];
    return dateValues(dashboard.value.startDate || dateRange.value[0], dashboard.value.endDate || dateRange.value[1]).map((date, dayIndex) =>
      buildTimelineDisplayRow(timeline, dayIndex * DAY_SECONDS, date, `${timeline.machine}-${date}`)
    );
  }
  const dayStart = timelineDayOffset.value;
  return (dashboard.value.timelines || []).map((timeline) => buildTimelineDisplayRow(timeline, dayStart, timeline.machine, timeline.machine));
});

const timelineAverageOee = computed(() => {
  const running = timelineRows.value.reduce((total, item) => total + Number(item.runningSeconds || 0), 0);
  const seconds = timelineRows.value.reduce((total, item) => total + Number(item.totalSeconds || 0), 0);
  return seconds > 0 ? (running * 100) / seconds : 0;
});

const timelineTotalDefective = computed(() => timelineRows.value.reduce((total, item) => total + Number(item.defectiveCount || 0), 0));

function getDefaultDate() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return formatLocalDate(date);
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function dateValues(startDate: string, endDate: string) {
  const result: string[] = [];
  const current = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  while (current <= end) {
    result.push(formatLocalDate(current));
    current.setDate(current.getDate() + 1);
  }
  return result;
}

function buildQuery() {
  const allSelected = selectedMachines.value.length === machineOptions.value.length;
  const [startDate, endDate] = dateRange.value;
  return {
    startDate,
    endDate,
    date: startDate,
    machines: allSelected ? undefined : selectedMachines.value.length ? selectedMachines.value.join(',') : '__NONE__'
  };
}

function syncTimelineDate() {
  const [startDate, endDate] = dateRange.value;
  if (!timelineDate.value || timelineDate.value < startDate || timelineDate.value > endDate) {
    timelineDate.value = endDate || startDate;
  }
}

function restoreFilterState() {
  try {
    const rawValue = localStorage.getItem(FILTER_CACHE_KEY);
    if (!rawValue) return;
    const cached = JSON.parse(rawValue) as {
      selectedMachines?: unknown;
      allMachinesSelected?: unknown;
      dateRange?: unknown;
      timelineDate?: unknown;
    };
    if (Array.isArray(cached.selectedMachines)) {
      selectedMachines.value = cached.selectedMachines.filter((item): item is string => typeof item === 'string');
      hasCachedMachineSelection = true;
      cachedSelectAllMachines = cached.allMachinesSelected === true;
    }
    if (
      Array.isArray(cached.dateRange) &&
      cached.dateRange.length === 2 &&
      typeof cached.dateRange[0] === 'string' &&
      typeof cached.dateRange[1] === 'string' &&
      cached.dateRange[0] <= cached.dateRange[1]
    ) {
      dateRange.value = [cached.dateRange[0], cached.dateRange[1]];
    }
    if (typeof cached.timelineDate === 'string') {
      timelineDate.value = cached.timelineDate;
    }
    syncTimelineDate();
  } catch (error) {
    console.warn('恢复机器状态查询条件失败:', error);
  }
}

function persistFilterState() {
  try {
    localStorage.setItem(
      FILTER_CACHE_KEY,
      JSON.stringify({
        selectedMachines: selectedMachines.value,
        allMachinesSelected: machineOptions.value.length > 0 && selectedMachines.value.length === machineOptions.value.length,
        dateRange: dateRange.value,
        timelineDate: timelineDate.value
      })
    );
  } catch (error) {
    console.warn('保存机器状态查询条件失败:', error);
  }
}

function disableTimelineDate(date: Date) {
  const [startDate, endDate] = dateRange.value;
  const value = formatLocalDate(date);
  return value < startDate || value > endDate;
}

async function loadMachines() {
  const response = await getMachineNames();
  machineOptions.value = response.data || [];
  if (!hasCachedMachineSelection || cachedSelectAllMachines) {
    selectedMachines.value = [...machineOptions.value];
  } else {
    const availableMachines = new Set(machineOptions.value);
    selectedMachines.value = selectedMachines.value.filter((machine) => availableMachines.has(machine));
  }
  persistFilterState();
}

async function loadDashboard() {
  loading.value = true;
  try {
    syncTimelineDate();
    const response = await getMachineStatusDashboard(buildQuery());
    dashboard.value = response.data || emptyDashboard();
    syncTimelineDate();
    await nextTick();
    renderCharts();
  } finally {
    loading.value = false;
  }
}

function handleFilterChange() {
  persistFilterState();
  if (filterTimer) clearTimeout(filterTimer);
  filterTimer = setTimeout(loadDashboard, 180);
}

function clearMachineSelection() {
  selectedMachines.value = [];
  handleFilterChange();
}

function selectAllMachines() {
  selectedMachines.value = Array.from(new Set([...selectedMachines.value, ...filteredMachineOptions.value]));
  handleFilterChange();
}

function handleTimelineMachineClick(machine: string) {
  if (singleMachineMode.value || !machine) return;
  selectedMachines.value = [machine];
  machineKeyword.value = '';
  handleFilterChange();
}

function handleDateRangeChange() {
  if (!dateRange.value || dateRange.value.length !== 2) {
    const fallback = getDefaultDate();
    dateRange.value = [fallback, fallback];
  }
  syncTimelineDate();
  handleFilterChange();
}

function handleTimelineDateChange() {
  syncTimelineDate();
  persistFilterState();
}

function clipSegmentToDay(segment: MachineStatusSegmentVO, dayStart: number, dayEnd: number): MachineStatusSegmentVO | null {
  const segStart = Number(segment.startSecond || 0);
  const segEnd = segStart + Number(segment.durationSeconds || 0);
  if (segEnd <= dayStart || segStart >= dayEnd) {
    return null;
  }
  const clippedStart = Math.max(segStart, dayStart);
  const clippedEnd = Math.min(segEnd, dayEnd);
  return {
    ...segment,
    startSecond: clippedStart - dayStart,
    durationSeconds: Math.max(0, clippedEnd - clippedStart)
  };
}

function buildTimelineDisplayRow(timeline: MachineTimelineVO, dayStart: number, rowLabel: string, rowKey: string) {
  const dayEnd = dayStart + DAY_SECONDS;
  const segments = (timeline.segments || []).map((segment) => clipSegmentToDay(segment, dayStart, dayEnd)).filter((segment): segment is MachineStatusSegmentVO => segment != null);
  const runningSeconds = segments.filter((segment) => String(segment.status || '').toLowerCase() === 'running').reduce((total, segment) => total + Number(segment.durationSeconds || 0), 0);
  const totalSeconds = segments.reduce((total, segment) => total + Number(segment.durationSeconds || 0), 0);
  const oee = totalSeconds > 0 ? Number(((runningSeconds * 100) / totalSeconds).toFixed(2)) : 0;
  return {
    ...timeline,
    rowLabel,
    rowKey,
    segments,
    runningSeconds,
    totalSeconds,
    oee
  };
}

function buildPieOption(items: MachineStatusDistributionVO[], emptyText: string, selected: Record<string, boolean>): echarts.EChartsOption {
  if (!items.length) {
    return {
      title: { text: emptyText, left: 'center', top: 'middle', textStyle: { color: '#a8adb5', fontSize: 14, fontWeight: 'normal' } }
    };
  }
  return {
    animationDuration: 450,
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove|click',
      backgroundColor: 'transparent',
      borderWidth: 0,
      padding: 0,
      extraCssText: 'box-shadow:none;',
      formatter: (params: any) => {
        const color = typeof params.color === 'string' ? params.color : '#303744';
        return `<div class="pie-color-tooltip" style="background:${escapeHtml(color)}">${escapeHtml(params.name)}：${Number(params.value).toFixed(2)} 分钟（${Number(params.percent).toFixed(1)}%）</div>`;
      }
    },
    legend: {
      show: false,
      selected
    },
    series: [
      {
        name: '时长',
        type: 'pie',
        radius: ['0%', '84%'],
        center: ['50%', '50%'],
        selectedMode: false,
        avoidLabelOverlap: true,
        label: {
          show: true,
          position: 'inside',
          formatter: (params: any) => (params.percent >= 2.5 ? `${params.percent.toFixed(1)}%` : ''),
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          textBorderColor: 'rgba(0,0,0,.35)',
          textBorderWidth: 2
        },
        labelLine: { show: false },
        emphasis: {
          scale: false,
          itemStyle: {
            shadowBlur: 0
          },
          label: {
            show: true
          }
        },
        data: items.map((item) => ({
          name: item.name,
          value: Number(item.minutes),
          itemStyle: {
            color: item.color,
            borderColor: item.color,
            borderWidth: 0
          },
          emphasis: {
            itemStyle: {
              color: item.color,
              borderColor: item.color,
              borderWidth: 0,
              shadowBlur: 0
            }
          },
          select: {
            itemStyle: {
              color: item.color,
              borderColor: item.color,
              borderWidth: 0,
              shadowBlur: 5,
              shadowColor: item.color
            }
          }
        }))
      }
    ]
  };
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderCharts() {
  reasonLegendSelected.value = mergeLegendSelection(reasonChartItems.value, reasonLegendSelected.value);
  statusLegendSelected.value = mergeLegendSelection(dashboard.value.statusDistribution, statusLegendSelected.value);
  if (reasonChartRef.value) {
    reasonChart ||= echarts.init(reasonChartRef.value);
    reasonChart.setOption(buildPieOption(reasonChartItems.value, '暂无停止/闲置原因', reasonLegendSelected.value), true);
    bindLegendSelection(reasonChart, 'reason');
  }
  if (statusChartRef.value) {
    statusChart ||= echarts.init(statusChartRef.value);
    statusChart.setOption(buildPieOption(dashboard.value.statusDistribution, '暂无机器状态', statusLegendSelected.value), true);
    bindLegendSelection(statusChart, 'status');
  }
}

function mergeLegendSelection(items: MachineStatusDistributionVO[], current: Record<string, boolean>) {
  return Object.fromEntries(items.map((item) => [item.name, current[item.name] !== false]));
}

function chartByType(type: 'reason' | 'status') {
  return type === 'reason' ? reasonChart : statusChart;
}

function legendSelectionByType(type: 'reason' | 'status') {
  return type === 'reason' ? reasonLegendSelected : statusLegendSelected;
}

function bindLegendSelection(chart: echarts.ECharts, type: 'reason' | 'status') {
  chart.off('legendselectchanged');
  chart.on('legendselectchanged', (params: any) => {
    legendSelectionByType(type).value = { ...params.selected };
  });
}

function toggleChartLegend(type: 'reason' | 'status', name: string) {
  const chart = chartByType(type);
  if (!chart) return;
  const selection = legendSelectionByType(type);
  selection.value = { ...selection.value, [name]: selection.value[name] === false };
  chart.dispatchAction({ type: 'legendToggleSelect', name });
}

function highlightChartItem(type: 'reason' | 'status', name: string) {
  chartByType(type)?.dispatchAction({ type: 'highlight', seriesIndex: 0, name });
}

function downplayChartItem(type: 'reason' | 'status', name: string) {
  chartByType(type)?.dispatchAction({ type: 'downplay', seriesIndex: 0, name });
}

function getSegmentStyle(segment: MachineStatusSegmentVO) {
  const left = Math.max(0, Math.min(100, (Number(segment.startSecond) * 100) / DAY_SECONDS));
  const remaining = Math.max(0, DAY_SECONDS - Number(segment.startSecond));
  const seconds = Math.max(0, Math.min(Number(segment.durationSeconds), remaining));
  const width = Math.max(0.06, (seconds * 100) / DAY_SECONDS);
  return { left: `${left}%`, width: `${Math.min(width, 100 - left)}%`, backgroundColor: segment.color };
}

function getOeeClass(value: number) {
  if (Number(value) >= 90) return 'oee-good';
  if (Number(value) >= 70) return 'oee-warning';
  return 'oee-danger';
}

function formatPercent(value: number) {
  return `${Number(value || 0).toFixed(2)}%`;
}

function formatHours(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatDuration(seconds: number) {
  const value = Math.max(0, Number(seconds || 0));
  const hoursValue = Math.floor(value / 3600);
  const minutesValue = Math.floor((value % 3600) / 60);
  const secondsValue = value % 60;
  return `${hoursValue}小时 ${minutesValue}分 ${secondsValue}秒`;
}

function waitForLayout() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('图片生成失败'));
      }
    }, 'image/png');
  });
}

async function handlePrint() {
  if (!pageRef.value || imageGenerating.value) return;
  imageGenerating.value = true;
  imageCaptureMode.value = true;
  const root = pageRef.value;
  const originalWidth = root.style.width;

  try {
    await nextTick();
    const captureWidth = Math.max(1900, root.scrollWidth, root.offsetWidth);
    root.style.width = `${captureWidth}px`;
    await waitForLayout();
    reasonChart?.resize();
    statusChart?.resize();
    await waitForLayout();

    const captureHeight = Math.max(root.scrollHeight, root.offsetHeight);
    const maxPixels = 32000000;
    const scale = Math.min(1.5, Math.sqrt(maxPixels / (captureWidth * captureHeight)));
    const canvas = await html2canvas(root, {
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      scale,
      width: captureWidth,
      height: captureHeight,
      windowWidth: captureWidth,
      windowHeight: captureHeight,
      scrollX: -window.scrollX,
      scrollY: -window.scrollY
    });
    const blob = await canvasToBlob(canvas);
    const [startDate, endDate] = dateRange.value;
    const rangeName = startDate === endDate ? startDate : `${startDate}_${endDate}`;
    FileSaver.saveAs(blob, `机器状态看板_${rangeName}_${timelineDate.value}.png`);
    proxy?.$modal.msgSuccess('页面图片已生成');
  } catch (error) {
    console.error('生成页面图片失败:', error);
    proxy?.$modal.msgError('页面图片生成失败');
  } finally {
    root.style.width = originalWidth;
    imageCaptureMode.value = false;
    imageGenerating.value = false;
    await nextTick();
    reasonChart?.resize();
    statusChart?.resize();
  }
}

function handleDownload() {
  const [startDate, endDate] = dateRange.value;
  const rangeName = startDate === endDate ? startDate : `${startDate}_${endDate}`;
  proxy?.download('/inject/machine-status/export', buildQuery(), `机器状态_${rangeName}_${Date.now()}.xlsx`);
}

function handleResize() {
  reasonChart?.resize();
  statusChart?.resize();
}

onMounted(async () => {
  window.addEventListener('resize', handleResize);
  loading.value = true;
  try {
    restoreFilterState();
    await loadMachines();
    await loadDashboard();
  } finally {
    loading.value = false;
  }
});

onBeforeUnmount(() => {
  if (filterTimer) clearTimeout(filterTimer);
  window.removeEventListener('resize', handleResize);
  reasonChart?.dispose();
  statusChart?.dispose();
});
</script>

<style scoped lang="scss">
.machine-status-page {
  min-height: calc(100vh - 84px);
  padding: 18px 24px 28px;
  color: #303744;
  background: #fff;
  box-sizing: border-box;
}

.page-heading {
  height: 34px;
  border-bottom: 1px solid #eef0f3;
}

.heading-tabs {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 13px;

  .active-tab {
    color: #1f2937;
    font-weight: 700;
  }

  .tab-icon {
    display: inline-block;
    margin-right: 4px;
    font-style: normal;
    font-size: 18px;
    transform: rotate(90deg);
  }
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 76px;

  .machine-select {
    width: 250px;
  }

  .date-range-picker {
    width: 360px;
  }

  .filter-spacer {
    flex: 1;
  }

  :deep(.machine-select .el-select__wrapper),
  :deep(.date-range-picker.el-range-editor) {
    height: 40px;
    min-height: 40px;
    box-sizing: border-box;
  }

  :deep(.machine-select .el-select__wrapper) {
    flex-wrap: nowrap;
    overflow: hidden;
  }

  :deep(.machine-select .el-select__selection) {
    flex-wrap: nowrap;
    overflow: hidden;
  }

  :deep(.el-button) {
    height: 40px;
  }
}

.machine-select-header {
  padding: 4px 6px 0;
}

.machine-search-input {
  margin-bottom: 8px;
}

.machine-select-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 0 8px;
  border-bottom: 1px solid #ebeef5;

  button {
    padding: 0;
    border: 0;
    color: #526581;
    background: transparent;
    cursor: pointer;
  }

  button:hover {
    color: var(--el-color-primary);
  }
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.chart-card {
  height: 434px;
  border: 1px solid #e5e8ed;
  background: #fff;
  box-shadow: 0 1px 2px rgba(31, 45, 61, 0.02);

  header {
    height: 52px;
    display: flex;
    align-items: center;
    padding: 0 18px;
    border-bottom: 1px solid #e9ebef;
    font-size: 14px;
    font-weight: 600;
  }

  .chart-body {
    height: 347px;
    display: grid;
    grid-template-columns: minmax(0, 1.08fr) minmax(220px, 0.92fr);
    gap: 10px;
    padding: 8px 6px 4px;
    box-sizing: border-box;
  }

  .chart-canvas {
    min-width: 0;
    width: 100%;
    height: 100%;
  }

  .chart-legend {
    min-width: 0;
    max-height: 100%;
    margin: 0;
    padding: 8px 8px 8px 0;
    overflow-x: hidden;
    overflow-y: auto;
    list-style: none;
    scrollbar-width: thin;
    scrollbar-color: #8c8f95 transparent;

    li {
      display: grid;
      grid-template-columns: 24px minmax(0, 1fr);
      align-items: center;
      gap: 8px;
      min-height: 31px;
      color: #303744;
      font-size: 15px;
      cursor: pointer;
      transition: opacity 0.15s ease;

      &:hover {
        color: var(--el-color-primary);
      }

      &.is-disabled {
        opacity: 0.35;
      }
    }

    i {
      width: 24px;
      height: 12px;
    }

    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .legend-empty {
      display: flex;
      justify-content: center;
      color: #a8adb5;
      cursor: default;
    }
  }

  footer {
    height: 34px;
    padding: 0 22px;
    color: #4b5563;
    font-size: 12px;
  }
}

:deep(.pie-color-tooltip) {
  padding: 8px 12px;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  box-shadow: 0 2px 9px rgba(0, 0, 0, 0.22);
}

.timeline-section {
  margin-top: 24px;
}

.timeline-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;

  h2 {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
  }
}

.timeline-tools {
  display: flex;
  align-items: center;
  gap: 10px;
}

.timeline-hint {
  color: #909399;
  font-size: 12px;
}

.timeline-date-picker {
  width: 160px;
}

.timeline-scroll {
  max-height: 570px;
  overflow-y: auto;
  overflow-x: hidden;
  border: 1px solid #4c4f55;
}

.timeline-table {
  width: 100%;
  min-width: 0;
  font-size: 11px;
}

.table-grid {
  display: grid;
  grid-template-columns: clamp(88px, 8vw, 130px) minmax(0, 1fr) clamp(72px, 6vw, 110px) clamp(64px, 5.5vw, 100px) clamp(64px, 5.5vw, 100px);

  > div,
  > strong,
  > span {
    min-width: 0;
    border-right: 1px solid #4c4f55;
    border-bottom: 1px solid #4c4f55;
    box-sizing: border-box;
  }

  > :last-child {
    border-right: 0;
  }
}

.summary-row {
  min-height: 29px;
  background: #fff;

  > * {
    display: flex;
    align-items: center;
    padding: 0 8px;
  }

  > strong:nth-child(2) {
    justify-content: center;
  }

  .average-oee {
    justify-content: center;
    background: #f4c400;
  }
}

.header-row {
  position: sticky;
  top: 0;
  z-index: 8;
  height: 31px;
  background: #fff;

  > div {
    display: flex;
    align-items: center;
    padding: 0 8px;
  }

  .hour-axis {
    display: grid;
    grid-template-columns: repeat(24, minmax(0, 1fr));
    padding: 0;

    span {
      min-width: 0;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      overflow: hidden;
      box-sizing: border-box;
      border-right: 1px solid #9ba0a7;
      color: #0088e8;
      font-size: clamp(8px, 0.65vw, 11px);

      &:last-child {
        border-right: 0;
      }

      &.nextDay {
        color: #ff3c72;
      }
    }
  }
}

.machine-row {
  height: 29px;
  background: #fff;

  > div {
    display: flex;
    align-items: center;
    padding: 0 8px;
  }

  .status-track {
    position: relative;
    display: block;
    padding: 0;
    overflow: hidden;
    background: #f8fafb;
  }
}

.machine-cell {
  padding-left: 10px !important;
  color: #61758c;

  &.is-clickable {
    color: var(--el-color-primary);
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }
}

.hour-lines {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(24, minmax(0, 1fr));
  pointer-events: none;

  i {
    border-right: 1px solid rgba(49, 67, 86, 0.16);
  }
}

.status-segment {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 2;
  min-width: 1px;
  cursor: pointer;
  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.05);
}

.oee-cell {
  justify-content: flex-start;
  color: #1f2937;
}

.oee-good {
  background: #27c66c;
}

.oee-warning {
  background: #f2bd00;
}

.oee-danger {
  background: #f04444;
}

.empty-row {
  height: 90px;
  display: grid;
  place-items: center;
  color: #909399;
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.segment-tooltip {
  display: grid;
  gap: 4px;
  max-width: 360px;

  strong {
    margin-bottom: 2px;
  }
}

.machine-status-page.image-capture-mode {
  min-height: auto;

  .timeline-scroll {
    max-height: none;
    overflow: visible;
  }

  .header-row {
    position: static;
  }
}

@media (max-width: 1400px) {
  .chart-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1100px) {

  .table-grid {
    grid-template-columns: 88px minmax(0, 1fr) 72px 64px 64px;
  }

  .machine-cell,
  .machine-row > div,
  .header-row > div,
  .summary-row > * {
    padding-right: 4px;
    padding-left: 4px;
  }
}

@media print {
  .machine-status-page {
    min-height: auto;
    padding: 0;
  }

  .no-print,
  :deep(.el-loading-mask) {
    display: none !important;
  }

  .chart-card {
    break-inside: avoid;
  }

  .timeline-scroll {
    max-height: none;
    overflow: visible;
  }

  .timeline-table {
    min-width: 1500px;
    transform-origin: left top;
    transform: scale(0.72);
  }
}
</style>
