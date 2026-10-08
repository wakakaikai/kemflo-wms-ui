<template>
  <el-row v-if="ready" :gutter="16" class="chart-row">
    <el-col :xs="24" :lg="16">
      <el-card shadow="never" class="chart-card">
        <template #header>
          <div class="chart-card-head">
            <span class="chart-title">近 7 日业务趋势</span>
            <span class="chart-sub">入库 / 出库 / 移库（示意）</span>
          </div>
        </template>
        <div ref="trendRef" class="chart-box chart-box--trend" />
      </el-card>
    </el-col>
    <el-col :xs="24" :lg="8">
      <el-card shadow="never" class="chart-card">
        <template #header>
          <div class="chart-card-head">
            <span class="chart-title">菜单模块分布</span>
            <span class="chart-sub">按当前账号权限统计</span>
          </div>
        </template>
        <div ref="pieRef" class="chart-box chart-box--pie" />
      </el-card>
    </el-col>
  </el-row>
  <el-row v-else :gutter="16" class="chart-row">
    <el-col :span="24">
      <el-card shadow="never" class="chart-card chart-card--placeholder">
        <el-skeleton animated :rows="6" />
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
import type { ECharts, EChartsOption } from 'echarts';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

export interface ModulePieItem {
  name: string;
  value: number;
}

const props = defineProps<{
  modulePie: ModulePieItem[];
}>();

const ready = ref(false);
const trendRef = ref<HTMLElement | null>(null);
const pieRef = ref<HTMLElement | null>(null);

let trendChart: ECharts | null = null;
let pieChart: ECharts | null = null;
let echartsLib: typeof import('echarts') | null = null;
let resizeTimer: ReturnType<typeof setTimeout> | null = null;
let disposed = false;

const modulePieSignature = computed(() => props.modulePie.map((item) => `${item.name}:${item.value}`).join('|'));

const weekLabels = () => {
  const labels: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
  }
  return labels;
};

const buildTrendOption = (): EChartsOption => {
  const seed = new Date().getDate();
  const mk = (base: number) => weekLabels().map((_, i) => base + ((seed + i * 3) % 7) * 2 + Math.round(Math.sin(i) * 3));
  return {
    color: ['#1d6fd8', '#0d8a68', '#c27a12'],
    grid: { left: 48, right: 20, top: 36, bottom: 32 },
    tooltip: { trigger: 'axis' },
    legend: { top: 0, right: 0, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 12 } },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: weekLabels(),
      axisLine: { lineStyle: { color: '#dce3eb' } },
      axisLabel: { color: '#64748b' }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: '#e8edf2' } },
      axisLabel: { color: '#64748b' }
    },
    series: [
      { name: '入库', type: 'line', smooth: true, symbolSize: 6, areaStyle: { opacity: 0.08 }, data: mk(12) },
      { name: '出库', type: 'line', smooth: true, symbolSize: 6, areaStyle: { opacity: 0.08 }, data: mk(18) },
      { name: '移库', type: 'line', smooth: true, symbolSize: 6, areaStyle: { opacity: 0.06 }, data: mk(8) }
    ]
  };
};

const buildPieOption = (items: ModulePieItem[]): EChartsOption => {
  const data = items.filter((item) => item.value > 0);
  return {
    color: ['#1d6fd8', '#0d8a68', '#e09a2b', '#5b6e86', '#14a8c2', '#2a9b8f', '#64748b'],
    tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 项 ({d}%)' },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: 0,
      top: 'middle',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { fontSize: 12 }
    },
    series: [
      {
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['38%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: data.length ? data : [{ name: '暂无菜单', value: 1, itemStyle: { color: '#e2e8f0' } }]
      }
    ]
  };
};

const handleResize = () => {
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (disposed) return;
    trendChart?.resize();
    pieChart?.resize();
  }, 120);
};

const renderCharts = async () => {
  if (disposed) return;
  if (!echartsLib) {
    echartsLib = await import('echarts');
  }
  await nextTick();
  if (disposed || !trendRef.value || !pieRef.value) return;

  if (!trendChart) {
    trendChart = echartsLib.init(trendRef.value, undefined, { renderer: 'canvas' });
  }
  if (!pieChart) {
    pieChart = echartsLib.init(pieRef.value, undefined, { renderer: 'canvas' });
  }
  trendChart.setOption(buildTrendOption(), { notMerge: true, lazyUpdate: true });
  pieChart.setOption(buildPieOption(props.modulePie), { notMerge: true, lazyUpdate: true });
};

onMounted(async () => {
  ready.value = true;
  await nextTick();
  requestAnimationFrame(() => {
    void renderCharts();
  });
  window.addEventListener('resize', handleResize, { passive: true });
});

watch(modulePieSignature, () => {
  if (!pieChart || disposed) return;
  pieChart.setOption(buildPieOption(props.modulePie), { notMerge: true, lazyUpdate: true });
});

onBeforeUnmount(() => {
  disposed = true;
  if (resizeTimer) clearTimeout(resizeTimer);
  window.removeEventListener('resize', handleResize);
  trendChart?.dispose();
  pieChart?.dispose();
  trendChart = null;
  pieChart = null;
  echartsLib = null;
});
</script>

<style scoped lang="scss">
.chart-row {
  margin-bottom: 16px;
}

.chart-card {
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);

  :deep(.el-card__header) {
    padding: 14px 16px 10px;
    border-bottom: 1px solid var(--el-border-color-extra-light);
  }

  :deep(.el-card__body) {
    padding: 8px 12px 12px;
  }
}

.chart-card--placeholder {
  min-height: 280px;
}

.chart-card-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.chart-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.chart-box {
  width: 100%;
}

.chart-box--trend,
.chart-box--pie {
  height: 280px;
}
</style>
