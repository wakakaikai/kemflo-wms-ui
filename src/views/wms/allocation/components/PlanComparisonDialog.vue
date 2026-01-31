<!-- views/allocation/components/PlanComparisonDialog.vue -->
<template>
  <el-dialog v-model="visible" title="分配方案对比" width="1400px" destroy-on-close>
    <div class="plan-comparison-dialog">
      <!-- 方案筛选 -->
      <div class="filter-area">
        <el-checkbox-group v-model="selectedPlanIds" @change="updateComparison">
          <el-checkbox v-for="plan in plans" :key="plan.id" :label="plan.id">
            {{ plan.planName }}
          </el-checkbox>
        </el-checkbox-group>
      </div>

      <!-- 方案对比表格 -->
      <div class="comparison-table">
        <el-table :data="comparisonData" border stripe size="small" :max-height="500">
          <el-table-column prop="indicator" label="对比指标" width="150" fixed />
          <el-table-column v-for="plan in selectedPlans" :key="plan.id" :label="plan.planName" width="180">
            <template #default="{ row }">
              <div class="plan-cell" :class="{ 'best': row.bestPlanId === plan.id }">
                <div class="cell-value">{{ row[plan.id] }}</div>
                <div v-if="row.bestPlanId === plan.id" class="best-badge">
                  <el-tag type="success" size="small">最佳</el-tag>
                </div>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 对比图表 -->
      <div class="comparison-chart">
        <el-tabs v-model="activeChart">
          <el-tab-pane label="雷达图" name="radar">
            <div ref="radarChartRef" style="width: 100%; height: 300px"></div>
          </el-tab-pane>
          <el-tab-pane label="柱状图" name="bar">
            <div ref="barChartRef" style="width: 100%; height: 300px"></div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- 详细对比 -->
      <div class="detailed-comparison">
        <el-tabs v-model="activeDetailTab">
          <el-tab-pane label="拣货效率" name="efficiency">
            <efficiency-comparison :plans="selectedPlans" />
          </el-tab-pane>
          <el-tab-pane label="齐套率分析" name="kitRate">
            <kit-rate-comparison :plans="selectedPlans" />
          </el-tab-pane>
          <el-tab-pane label="批次使用" name="batch">
            <batch-comparison :plans="selectedPlans" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="exportComparison">
          <el-icon><Download /></el-icon>导出对比报告
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Download } from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import type { AllocationPlanVO } from '@/api/wms/allocation/types';
// import EfficiencyComparison from './comparison/EfficiencyComparison.vue';
// import KitRateComparison from './comparison/KitRateComparison.vue';
// import BatchComparison from './comparison/BatchComparison.vue';

interface Props {
  modelValue: boolean;
  plans: AllocationPlanVO[];
}

const props = defineProps<Props>();

const emit = defineEmits(['update:modelValue']);

const visible = ref(false);
const selectedPlanIds = ref<number[]>([]);
const activeChart = ref('radar');
const activeDetailTab = ref('efficiency');
const radarChartRef = ref();
const barChartRef = ref();
let radarChart: echarts.ECharts | null = null;
let barChart: echarts.ECharts | null = null;

// 计算选中的方案
const selectedPlans = computed(() => {
  return props.plans.filter((plan) => selectedPlanIds.value.includes(plan.id));
});

// 对比数据
const comparisonData = ref<any[]>([]);

// 监听props变化
watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val) {
      // 默认选择前3个方案
      selectedPlanIds.value = props.plans.slice(0, 3).map((p) => p.id);
      nextTick(() => {
        initCharts();
        updateComparison();
      });
    } else {
      // 销毁图表
      if (radarChart) {
        radarChart.dispose();
        radarChart = null;
      }
      if (barChart) {
        barChart.dispose();
        barChart = null;
      }
    }
  }
);

// 监听visible变化
watch(visible, (val) => {
  emit('update:modelValue', val);
});

// 更新对比数据
const updateComparison = () => {
  if (selectedPlans.value.length < 2) {
    ElMessage.warning('请至少选择2个方案进行对比');
    return;
  }

  // 准备对比数据
  const indicators = [
    { key: 'strategyTypeDesc', label: '策略类型', format: (val: any) => val },
    { key: 'totalScore', label: '综合评分', format: (val: number) => val.toFixed(1) },
    { key: 'avgKitRate', label: '平均齐套率', format: (val: number) => `${(val * 100).toFixed(1)}%` },
    { key: 'totalDistance', label: '总行走距离', format: (val: number) => `${val.toFixed(1)}m` },
    { key: 'pickLocationCount', label: '拣货点数', format: (val: number) => val },
    { key: 'totalQuantity', label: '总分配数量', format: (val: number) => val },
    { key: 'workOrderCount', label: '工单数量', format: (val: number) => val }
  ];

  // 找出每个指标的最佳方案
  const bestPlanIds: Record<string, number> = {};

  // 对于评分指标，数值越大越好
  const maxBetterIndicators = ['totalScore', 'avgKitRate'];
  maxBetterIndicators.forEach((indicator) => {
    let bestPlanId = -1;
    let bestValue = -Infinity;
    selectedPlans.value.forEach((plan) => {
      const value = plan[indicator as keyof AllocationPlanVO] as number;
      if (value > bestValue) {
        bestValue = value;
        bestPlanId = plan.id;
      }
    });
    bestPlanIds[indicator] = bestPlanId;
  });

  // 对于距离和拣货点数，数值越小越好
  const minBetterIndicators = ['totalDistance', 'pickLocationCount'];
  minBetterIndicators.forEach((indicator) => {
    let bestPlanId = -1;
    let bestValue = Infinity;
    selectedPlans.value.forEach((plan) => {
      const value = plan[indicator as keyof AllocationPlanVO] as number;
      if (value < bestValue) {
        bestValue = value;
        bestPlanId = plan.id;
      }
    });
    bestPlanIds[indicator] = bestPlanId;
  });

  // 生成表格数据
  comparisonData.value = indicators.map((indicator) => {
    const row: any = {
      indicator: indicator.label
    };

    selectedPlans.value.forEach((plan) => {
      const value = plan[indicator.key as keyof AllocationPlanVO];
      row[plan.id] = indicator.format(value);
    });

    // 标记最佳方案
    row.bestPlanId = bestPlanIds[indicator.key];

    return row;
  });

  // 更新图表
  updateCharts();
};

// 初始化图表
const initCharts = () => {
  if (!radarChartRef.value || !barChartRef.value) return;

  radarChart = echarts.init(radarChartRef.value);
  barChart = echarts.init(barChartRef.value);
};

// 更新图表
const updateCharts = () => {
  if (!radarChart || !barChart || selectedPlans.value.length === 0) return;

  // 雷达图数据
  const radarOption = {
    title: {
      text: '方案性能对比雷达图',
      left: 'center'
    },
    tooltip: {},
    legend: {
      data: selectedPlans.value.map((p) => p.planName),
      bottom: 10
    },
    radar: {
      indicator: [
        { name: '综合评分', max: 10 },
        { name: '齐套率', max: 1 },
        { name: '效率(距离)', max: Math.max(...selectedPlans.value.map((p) => p.totalDistance)) * 1.2 },
        { name: '拣货点数', max: Math.max(...selectedPlans.value.map((p) => p.pickLocationCount)) * 1.2 },
        { name: 'FIFO符合度', max: 1 }
      ]
    },
    series: [
      {
        type: 'radar',
        data: selectedPlans.value.map((plan) => ({
          value: [plan.totalScore, plan.avgKitRate, plan.totalDistance, plan.pickLocationCount, plan.fifoScore || 0.8],
          name: plan.planName
        }))
      }
    ]
  };
  radarChart.setOption(radarOption);

  // 柱状图数据
  const barOption = {
    title: {
      text: '方案关键指标对比',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: selectedPlans.value.map((p) => p.planName),
      top: 30
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['综合评分', '齐套率', '行走距离', '拣货点数']
    },
    yAxis: {
      type: 'value'
    },
    series: selectedPlans.value.map((plan) => ({
      name: plan.planName,
      type: 'bar',
      data: [plan.totalScore, plan.avgKitRate * 100, plan.totalDistance, plan.pickLocationCount],
      label: {
        show: true,
        position: 'top'
      }
    }))
  };
  barChart.setOption(barOption);
};

// 窗口大小变化时重新渲染图表
const handleResize = () => {
  if (radarChart) radarChart.resize();
  if (barChart) barChart.resize();
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

// 导出对比报告
const exportComparison = () => {
  ElMessage.success('对比报告导出成功！');
};

// 关闭对话框
const handleClose = () => {
  visible.value = false;
};
</script>

<style scoped>
.plan-comparison-dialog {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-area {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
}

.filter-area .el-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.comparison-table {
  flex: 1;
}

.plan-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  position: relative;
  padding: 8px;
}

.plan-cell.best {
  background: linear-gradient(135deg, #f0f9eb 25%, #e1f3d8 100%);
}

.cell-value {
  font-weight: bold;
  font-size: 14px;
}

.best-badge {
  position: absolute;
  top: 4px;
  right: 4px;
}

.comparison-chart {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 16px;
}

.detailed-comparison {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
