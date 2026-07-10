<template>
  <div class="liquid-gauge">
    <div class="liquid-title">{{ title }}</div>
    <div ref="chartRef" class="liquid-chart" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import * as echarts from 'echarts';
import 'echarts-liquidfill';

const props = withDefaults(
  defineProps<{
    title: string;
    value: number;
    color?: 'cyan' | 'orange';
    /** 库存满足率：<80 红，80~90 告警，>=90 绿 */
    thresholdMode?: 'none' | 'inventory-fulfillment';
  }>(),
  { color: 'cyan', thresholdMode: 'none' }
);

type GaugePalette = {
  fill: [string, string];
  border: string;
  label: string;
};

const FIXED_PALETTES: Record<'cyan' | 'orange', GaugePalette> = {
  orange: {
    fill: ['#c87800', '#f29701'],
    border: '#f29701',
    label: '#ffb347'
  },
  cyan: {
    fill: ['#09828e', '#09c2c8'],
    border: '#0ac1c7',
    label: '#93f8fb'
  }
};

const THRESHOLD_PALETTES = {
  danger: {
    fill: ['#b42318', '#f56c6c'] as [string, string],
    border: '#f56c6c',
    label: '#ffc9c9'
  },
  warning: {
    fill: ['#c87800', '#e6a23c'] as [string, string],
    border: '#e6a23c',
    label: '#ffd28a'
  },
  success: {
    fill: ['#15803d', '#67c23a'] as [string, string],
    border: '#67c23a',
    label: '#d9f7be'
  }
};

function palette(): GaugePalette {
  if (props.thresholdMode === 'inventory-fulfillment') {
    const value = Math.max(0, Math.min(100, props.value));
    if (value < 80) return THRESHOLD_PALETTES.danger;
    if (value < 90) return THRESHOLD_PALETTES.warning;
    return THRESHOLD_PALETTES.success;
  }
  return FIXED_PALETTES[props.color];
}

const chartRef = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;
let resizeRaf = 0;

function renderChart() {
  if (!chartRef.value) return;
  if (!chart) chart = echarts.init(chartRef.value);

  const pct = Math.max(0, Math.min(100, props.value)) / 100;
  const colors = palette();

  chart.setOption(
    {
      series: [
        {
          type: 'liquidFill',
          data: [pct, pct - 0.02],
          radius: '88%',
          color: colors.fill,
          waveAnimation: true,
          amplitude: 8,
          period: 4000,
          outline: { show: false },
          backgroundStyle: {
            color: 'transparent',
            borderColor: colors.border,
            borderWidth: 1,
            shadowColor: 'rgba(0, 0, 0, 0.35)',
            shadowBlur: 16
          },
          label: {
            formatter: () => `${Math.round(pct * 100)}%`,
            fontSize: 22,
            fontWeight: 700,
            color: colors.label
          }
        }
      ]
    },
    true
  );
}

onMounted(() => {
  renderChart();
  if (chartRef.value) {
    resizeObserver = new ResizeObserver(() => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        chart?.resize();
      });
    });
    resizeObserver.observe(chartRef.value);
  }
});

watch(() => [props.value, props.color, props.thresholdMode], renderChart);

onUnmounted(() => {
  if (resizeRaf) cancelAnimationFrame(resizeRaf);
  resizeObserver?.disconnect();
  chart?.dispose();
  chart = null;
});
</script>

<style scoped lang="scss">
.liquid-gauge {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.liquid-title {
  flex-shrink: 0;
  text-align: center;
  font-size: 14px;
  color: rgba(198, 224, 255, 0.85);
  margin-bottom: 2px;
}

.liquid-chart {
  flex: 1;
  min-height: 110px;
}
</style>
