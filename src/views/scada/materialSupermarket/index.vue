<template>
  <div ref="boardRef" class="material-board material-board-theme" :class="{ 'is-fullscreen': isFullscreen }">
    <div class="board-grid-bg" aria-hidden="true" />

    <header class="dashboard-header">
      <div class="header-left">
        <img src="@/assets/logo/kemflo-logo.jpg" alt="Logo" class="logo" title="点击切换全屏" @click.stop="toggleFullscreen" />
      </div>
      <div class="header-center" title="点击打开看板配置" @click="showSettings = true">
        <h2 class="page-title">物料超市看板</h2>
        <el-tag v-if="lastRefreshTime" type="primary" effect="light" class="refresh-tag">数据更新 {{ lastRefreshTime }}</el-tag>
      </div>
      <div class="header-right">
        <div class="time-wrap">
          <el-icon><Clock /></el-icon>
          <span class="current-time">{{ currentDateTime }}</span>
        </div>
      </div>
    </header>

    <div class="dashboard-content">
      <section class="kpi-strip">
        <article v-for="card in statCards" :key="card.key" class="kpi-card" :class="card.theme">
          <span class="kpi-corner kpi-corner-tl" />
          <span class="kpi-corner kpi-corner-tr" />
          <span class="kpi-corner kpi-corner-bl" />
          <span class="kpi-corner kpi-corner-br" />
          <div class="kpi-title">{{ card.title }}</div>
          <div class="kpi-value">{{ card.value }}</div>
          <div class="kpi-meta">
            <div v-for="(row, rowIdx) in card.rows" :key="rowIdx" class="kpi-meta-row">
              <span v-for="item in row" :key="item.label" class="kpi-meta-item">
                <span class="kpi-meta-label">{{ item.label }}</span>
                <span class="kpi-meta-value" :class="item.className">{{ item.value }}</span>
              </span>
            </div>
          </div>
        </article>
      </section>

      <section class="station-bottom">
        <div class="chart-panel">
          <div class="chart-panel-header">
            <div class="panel-title">物料库存状态</div>
            <div class="chart-panel-meta">
              <span v-if="materialGroups.length" class="page-indicator">
                {{ currentCarouselIndex + 1 }} / {{ materialGroups.length }}
              </span>
              <div class="stock-legend">
                <span class="legend-item legend-normal">正常</span>
                <span class="legend-item legend-low">不足</span>
                <span class="legend-item legend-over">超储</span>
              </div>
            </div>
          </div>
          <div ref="chartContainerRef" class="chart-container">
            <el-carousel
              v-if="materialGroups.length"
              class="material-carousel"
              indicator-position="outside"
              :height="carouselHeight"
              :interval="carouselInterval"
              arrow="always"
              @change="onCarouselChange"
            >
              <el-carousel-item v-for="(group, index) in materialGroups" :key="index">
                <div :ref="(el) => setCarouselChartRef(el, index)" class="chart" :id="`carousel-chart-${index}`" />
              </el-carousel-item>
            </el-carousel>
            <div v-else class="chart-empty">暂无物料数据</div>
          </div>
        </div>
      </section>
    </div>

    <footer class="board-bottom">
      <div class="board-bottom-text">
        <h5><span class="bottom-top">物料超市监控数据</span></h5>
        <p>Material Supermarket Monitoring Data</p>
      </div>
    </footer>

    <el-dialog
      v-model="showSettings"
      title="看板参数配置"
      width="520px"
      append-to-body
      class="config-dialog"
      modal-class="material-board-dialog-modal"
    >
      <div class="settings-content">
        <el-form ref="queryFormRef" :model="userSettingsForm" label-width="110px">
          <el-form-item label="数据刷新" prop="freshScadaData">
            <el-input-number v-model="userSettingsForm.freshScadaData" :min="5" :step="1" />
            <span class="settings-unit">秒</span>
          </el-form-item>
          <el-form-item label="轮播间隔" prop="autoPlayInterval">
            <el-input-number v-model="userSettingsForm.autoPlayInterval" :min="3" :step="1" />
            <span class="settings-unit">秒</span>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="showSettings = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="MaterialSupermarketScada" lang="ts">
import * as echarts from 'echarts';
import { useRequest } from 'vue-request';

import { ElMessage, ElCarousel, ElCarouselItem } from 'element-plus';
import { Clock } from '@element-plus/icons-vue';
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue';

interface UserSettingsForm {
  showOperationLine: number;
  showOperationPerRow: number;
  startTime: any;
  endTime: any;
  autoPlayCarousel: string | number;
  autoPlayInterval: number;
  freshScadaData: number;
}

interface DashboardStats {
  totalMaterialTypes: number;
  materialsWithLowStock: number;
  materialsWithOverStock: number;
  materialsWithShortage: number;
  totalInventory: number;
  unrestrictedStock: number;
  inspectionStock: number;
  frozenStock: number;
  restockTimelinessRate: number;
  todayRestockRate: number;
  thisWeekRestockRate: number;
  inventoryWarnings: number;
  criticalWarnings: number;
  normalWarnings: number;
  processingWarnings: number;
}

const currentDateTime = ref('');
const lastRefreshTime = ref('');
const userSettingsForm = ref<UserSettingsForm>({
  showOperationLine: 10,
  showOperationPerRow: 6,
  startTime: null,
  endTime: null,
  autoPlayCarousel: '1',
  autoPlayInterval: 10,
  freshScadaData: 30
});
const dashboardStats = ref<DashboardStats>({
  totalMaterialTypes: 0,
  materialsWithLowStock: 0,
  materialsWithOverStock: 0,
  materialsWithShortage: 0,
  totalInventory: 0,
  unrestrictedStock: 0,
  inspectionStock: 0,
  frozenStock: 0,
  restockTimelinessRate: 0,
  todayRestockRate: 0,
  thisWeekRestockRate: 0,
  inventoryWarnings: 0,
  criticalWarnings: 0,
  normalWarnings: 0,
  processingWarnings: 0
});

// 添加物料分组数据
const materialGroups = ref<any[][]>([]);

// 图表DOM引用
const batteryChart = ref();
const carouselChartRefs = ref([]);

// 图表实例
let batteryChartInstance = null;
const carouselChartInstances = {};

// 当前轮播索引
const currentCarouselIndex = ref(0);

const boardRef = ref(null);
const chartContainerRef = ref(null);
const isFullscreen = ref(false);
const carouselHeight = ref('520px');

const carouselInterval = computed(() => userSettingsForm.value.autoPlayInterval * 1000);

const updateCarouselHeight = () => {
  const container = chartContainerRef.value;
  if (!container) return;
  const height = Math.max(container.clientHeight - 48, 320);
  carouselHeight.value = `${height}px`;
};

// 计算属性：补货趋势显示
const restockTrendClass = computed(() => {
  if (dashboardStats.value.restockTimelinessRate > 100) {
    return 'text-success';
  } else if (dashboardStats.value.restockTimelinessRate < 100) {
    return 'text-danger';
  }
  return '';
});

const restockTrendText = computed(() => {
  const diff = dashboardStats.value.restockTimelinessRate - 100;
  return diff >= 0 ? `↑ ${Math.abs(diff).toFixed(2)}%` : `↓ ${Math.abs(diff).toFixed(2)}%`;
});

const statCards = computed(() => {
  const s = dashboardStats.value;
  return [
    {
      key: 'types',
      theme: 'kpi-card--blue',
      title: '总物料种类',
      value: s.totalMaterialTypes,
      rows: [
        [
          { label: '安全库存', value: s.materialsWithLowStock },
          { label: '超储物料', value: s.materialsWithOverStock }
        ],
        [{ label: '缺料物料', value: s.materialsWithShortage }]
      ]
    },
    {
      key: 'inventory',
      theme: 'kpi-card--gold',
      title: '库存总量',
      value: s.totalInventory,
      rows: [
        [
          { label: '非限制', value: s.unrestrictedStock },
          { label: '质检库存', value: s.inspectionStock }
        ],
        [{ label: '冻结库存', value: s.frozenStock }]
      ]
    },
    {
      key: 'restock',
      theme: 'kpi-card--cyan',
      title: '补货及时率',
      value: `${s.restockTimelinessRate}%`,
      rows: [
        [
          { label: '今日', value: `${s.todayRestockRate}%` },
          { label: '本周', value: `${s.thisWeekRestockRate}%` }
        ],
        [{ label: '趋势', value: restockTrendText.value, className: restockTrendClass.value }]
      ]
    },
    {
      key: 'warning',
      theme: 'kpi-card--danger',
      title: '库存预警',
      value: s.inventoryWarnings,
      rows: [
        [
          { label: '紧急', value: s.criticalWarnings },
          { label: '一般', value: s.normalWarnings }
        ],
        [{ label: '处理中', value: s.processingWarnings }]
      ]
    }
  ];
});

// 更新当前时间
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
};

// 切换全屏
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

// 全屏状态变化处理
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
};

// 模拟获取数据
const refreshData = async () => {
  // 模拟API调用，返回模拟数据
  dashboardStats.value = {
    totalMaterialTypes: 23,
    materialsWithLowStock: 5,
    materialsWithOverStock: 2,
    materialsWithShortage: 3,
    totalInventory: 15420,
    unrestrictedStock: 12580,
    inspectionStock: 1840,
    frozenStock: 1000,
    restockTimelinessRate: 96.5,
    todayRestockRate: 98.2,
    thisWeekRestockRate: 95.8,
    inventoryWarnings: 10,
    criticalWarnings: 3,
    normalWarnings: 7,
    processingWarnings: 5
  };

  // 初始化物料分组
  initializeMaterialGroups();

  lastRefreshTime.value = new Date().toLocaleTimeString('zh-CN', { hour12: false });

  initCharts();
  nextTick(() => {
    updateCarouselHeight();
  });
};

// 初始化物料分组
const initializeMaterialGroups = () => {
  const allMaterials = [
    { name: '物料A001', currentStock: 750, maxStock: 1000, safetyStock: 200 },
    { name: '物料B002', currentStock: 150, maxStock: 800, safetyStock: 200 },
    { name: '物料C003', currentStock: 1100, maxStock: 1200, safetyStock: 300 },
    { name: '物料D004', currentStock: 300, maxStock: 600, safetyStock: 150 },
    { name: '物料E005', currentStock: 450, maxStock: 900, safetyStock: 200 },
    { name: '物料F006', currentStock: 1200, maxStock: 1500, safetyStock: 400 },
    { name: '物料G007', currentStock: 100, maxStock: 700, safetyStock: 150 },
    { name: '物料H008', currentStock: 800, maxStock: 1100, safetyStock: 300 },
    { name: '物料I009', currentStock: 850, maxStock: 950, safetyStock: 250 },
    { name: '物料J010', currentStock: 1250, maxStock: 1300, safetyStock: 350 },
    { name: '物料K011', currentStock: 50, maxStock: 500, safetyStock: 100 },
    { name: '物料L012', currentStock: 700, maxStock: 850, safetyStock: 180 },
    { name: '物料M013', currentStock: 1350, maxStock: 1400, safetyStock: 400 },
    { name: '物料N014', currentStock: 200, maxStock: 650, safetyStock: 150 },
    { name: '物料O015', currentStock: 950, maxStock: 1150, safetyStock: 280 },
    { name: '物料P016', currentStock: 300, maxStock: 750, safetyStock: 175 },
    { name: '物料Q017', currentStock: 1100, maxStock: 1250, safetyStock: 320 },
    { name: '物料R018', currentStock: 80, maxStock: 900, safetyStock: 180 },
    { name: '物料S019', currentStock: 650, maxStock: 1050, safetyStock: 220 },
    { name: '物料T020', currentStock: 750, maxStock: 800, safetyStock: 200 },
    { name: '物料U021', currentStock: 1300, maxStock: 1350, safetyStock: 380 },
    { name: '物料V022', currentStock: 40, maxStock: 600, safetyStock: 120 },
    { name: '物料W023', currentStock: 880, maxStock: 980, safetyStock: 260 }
  ];

  // 计算百分比并添加到物料数据中
  const materialsWithPercentage = allMaterials.map((material) => ({
    ...material,
    percentage: Math.round((material.currentStock / material.maxStock) * 100)
  }));

  // 每组5个物料进行分组
  const groups = [];
  for (let i = 0; i < materialsWithPercentage.length; i += 5) {
    groups.push(materialsWithPercentage.slice(i, i + 5));
  }

  materialGroups.value = groups;
};

// 获取物料颜色
const getMaterialColor = (material: any) => {
  if (material.currentStock < material.safetyStock) {
    // 低于安全库存，使用红色
    return '#F56C6C';
  } else if (material.currentStock > material.maxStock) {
    // 超过最大库存，使用橙色
    return '#E6A23C';
  } else {
    // 正常库存，使用绿色
    return '#67C23A';
  }
};

// 设置carouselChartRefs的方法
const setCarouselChartRef = (el, index) => {
  if (el && !carouselChartRefs.value[index]) {
    carouselChartRefs.value[index] = el;
    // 初始化对应索引的图表
    initCarouselChart(index);
  }
};

// 轮播切换事件
const onCarouselChange = (currentIndex) => {
  currentCarouselIndex.value = currentIndex;
  nextTick(() => {
    if (carouselChartRefs.value[currentIndex]) {
      initCarouselChart(currentIndex);
      carouselChartInstances[currentIndex]?.resize();
    }
  });
};

// 初始化轮播图表
const initCarouselChart = (index) => {
  if (!carouselChartRefs.value[index] || !materialGroups.value[index]) return;

  // 如果该索引的图表实例已存在，则跳过
  if (carouselChartInstances[index]) {
    return;
  }

  const chartDom = carouselChartRefs.value[index];
  carouselChartInstances[index] = echarts.init(chartDom);

  const group = materialGroups.value[index];

  // 准备数据
  const category = group.map((item) => ({
    name: item.name,
    value: item.currentStock,
    maxStock: item.maxStock,
    safetyStock: item.safetyStock
  }));

  const total = Math.max(...group.map((item) => item.maxStock));
  const datas = group.map((item) => item.currentStock);
  const barAreaHeight = Math.max(group.length * 72 + 80, 280);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(16, 13, 68, 0.92)',
      borderColor: 'rgba(100, 150, 255, 0.35)',
      textStyle: { color: '#fff' },
      formatter(params) {
        const item = group[params[0]?.dataIndex];
        if (!item) return '';
        const percentage = ((item.currentStock / item.maxStock) * 100).toFixed(1);
        return [
          `<strong>${item.name}</strong>`,
          `当前库存: ${item.currentStock}`,
          `库存上限: ${item.maxStock}`,
          `安全库存: ${item.safetyStock}`,
          `库存占比: ${percentage}%`,
          `状态: ${getStatusText(item)}`
        ].join('<br/>');
      }
    },
    xAxis: {
      max: total,
      splitLine: { show: false },
      axisLine: { show: false },
      axisLabel: { show: false },
      axisTick: { show: false }
    },
    grid: {
      left: 220,
      top: 36,
      right: 120,
      bottom: 36,
      height: barAreaHeight
    },
    yAxis: [
      {
        type: 'category',
        inverse: false,
        data: category,
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          show: false
        }
      }
    ],
    series: [
      {
        type: 'bar',
        barWidth: 28,
        silent: true,
        itemStyle: {
          color(params) {
            return getMaterialColor(group[params.dataIndex]);
          },
          borderRadius: [4, 0, 0, 4]
        },
        label: {
          formatter: '{b}',
          color: '#fff',
          fontSize: 14,
          position: 'left',
          distance: 16,
          show: true
        },
        data: category,
        z: 1,
        animationEasing: 'elasticOut'
      },
      {
        type: 'pictorialBar',
        itemStyle: {
          color: 'rgba(7, 49, 74, 0.85)'
        },
        symbolRepeat: 'fixed',
        symbolMargin: 2,
        symbol: 'rect',
        symbolClip: true,
        symbolSize: [3, 28],
        symbolPosition: 'start',
        symbolOffset: [3, -4],
        symbolBoundingData: total,
        data: Array(group.length).fill(total),
        z: 2,
        animationEasing: 'elasticOut'
      },
      {
        // label
        type: 'pictorialBar',
        symbolBoundingData: total,
        itemStyle: {
          color: 'none'
        },
        label: {
          formatter(params) {
            const item = group[params.dataIndex];
            const percent = ((params.data * 100) / item.maxStock).toFixed(1);
            return `{value|${params.data}}  {percent|${percent}%}`;
          },
          rich: {
            value: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
            percent: { color: '#8ec5ff', fontSize: 12 }
          },
          position: 'right',
          distance: 12,
          show: true
        },
        data: datas,
        z: 0
      },
      {
        name: '外框',
        type: 'bar',
        barGap: '-130%', // 设置外框粗细
        data: Array(group.length).fill(total),
        barWidth: 45,
        itemStyle: {
          barBorderRadius: [6, 6, 6, 6],
          color: 'transparent',
          borderColor: 'rgba(21, 136, 209, 0.65)',
          borderWidth: 2
        },
        z: 0
      },
      {
        type: 'scatter',
        name: '条形',
        symbol: 'roundRect',
        symbolSize: [7, 20],
        symbolOffset: [3, -5],
        symbolKeepAspect: true,
        itemStyle: {
          color(params) {
            return getMaterialColor(group[params.dataIndex]);
          }
        },
        data: Array(group.length).fill(total)
      }
    ]
  };

  carouselChartInstances[index].setOption(option);
};

// 获取物料颜色（基于值）
const getMaterialColorByValue = (item: any) => {
  const percentage = (item.currentStock / item.maxStock) * 100;
  // 低于安全库存，使用红色
  if (percentage < 25) {
    return '#F54C4C'; // 深红色，表示严重警告
  } else if (percentage < 50) {
    return '#FF9900'; // 橙色，表示警告
  }else {
    return '#1588D1'; // 蓝色，表示正常
  }
};

// 控制弹框显示
const showSettings = ref(false);

// 保存设置
const saveSettings = () => {
  showSettings.value = false;
  localStorage.setItem('materialSupermarketScada', JSON.stringify(userSettingsForm.value));
  cancel();
  setTimeout(() => {
    run();
  }, 1000);
};

const { run, cancel } = useRequest(refreshData, {
  manual: true,
  pollingInterval: computed(() => userSettingsForm.value.freshScadaData * 1000),
  onSuccess: async (data, params) => {}
});

// 初始化所有图表
const initCharts = () => {
  initBatteryChart();
};

// 初始化电池柱状图
const initBatteryChart = () => {
  if (!batteryChart.value) return;

  batteryChartInstance = echarts.init(batteryChart.value);

  // 示例数据 - 实际应用中应从API获取 (扩展到20+物料)
  const materialData = [
    { name: '物料A001', maxStock: 1000, currentStock: 750, safetyStock: 200 },
    { name: '物料B002', maxStock: 800, currentStock: 150, safetyStock: 200 }, // 低于安全库存
    { name: '物料C003', maxStock: 1200, currentStock: 1100, safetyStock: 300 }, // 高于安全库存
    { name: '物料D004', maxStock: 600, currentStock: 300, safetyStock: 150 },
    { name: '物料E005', maxStock: 900, currentStock: 450, safetyStock: 200 },
    { name: '物料F006', maxStock: 1500, currentStock: 1200, safetyStock: 400 },
    { name: '物料G007', maxStock: 700, currentStock: 50, safetyStock: 150 }, // 低于安全库存且低于10%
    { name: '物料H008', maxStock: 1100, currentStock: 800, safetyStock: 300 },
    { name: '物料I009', maxStock: 950, currentStock: 850, safetyStock: 250 },
    { name: '物料J010', maxStock: 1300, currentStock: 1250, safetyStock: 350 },
    { name: '物料K011', maxStock: 500, currentStock: 30, safetyStock: 100 }, // 低于安全库存且低于10%
    { name: '物料L012', maxStock: 850, currentStock: 700, safetyStock: 180 },
    { name: '物料M013', maxStock: 1400, currentStock: 1350, safetyStock: 400 }, // 接近满库存
    { name: '物料N014', maxStock: 650, currentStock: 200, safetyStock: 150 }, // 低库存
    { name: '物料O015', maxStock: 1150, currentStock: 950, safetyStock: 280 },
    { name: '物料P016', maxStock: 750, currentStock: 300, safetyStock: 175 },
    { name: '物料Q017', maxStock: 1250, currentStock: 1100, safetyStock: 320 },
    { name: '物料R018', maxStock: 900, currentStock: 60, safetyStock: 180 }, // 低于安全库存且低于10%
    { name: '物料S019', maxStock: 1050, currentStock: 650, safetyStock: 220 },
    { name: '物料T020', maxStock: 800, currentStock: 750, safetyStock: 200 },
    { name: '物料U021', maxStock: 1350, currentStock: 1300, safetyStock: 380 },
    { name: '物料V022', maxStock: 600, currentStock: 40, safetyStock: 120 }, // 低于安全库存且低于10%
    { name: '物料W023', maxStock: 980, currentStock: 880, safetyStock: 260 }
  ];

  const category = materialData.map((item) => ({
    name: item.name,
    value: item.currentStock,
    maxStock: item.maxStock,
    safetyStock: item.safetyStock
  }));

  const total = Math.max(...materialData.map((item) => item.maxStock));
  const datas = materialData.map((item) => item.currentStock);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function (params) {
        const dataIndex = params[0].dataIndex;
        const item = materialData[dataIndex];
        const percentage = ((item.currentStock / item.maxStock) * 100).toFixed(1);
        const safetyPercentage = ((item.currentStock / item.safetyStock) * 100).toFixed(1);
        const currentVsSafety = item.currentStock < item.safetyStock ? '低于' : '高于';

        let warningText = '';
        if (item.currentStock < item.safetyStock) {
          if ((item.currentStock / item.maxStock) * 100 < 10) {
            warningText = '<br/>⚠️ 严重告警：库存低于10%!';
          } else {
            warningText = '<br/>⚠️ 告警：库存低于安全库存!';
          }
        }

        return `
          <strong>${item.name}</strong><br/>
          当前库存: ${item.currentStock}<br/>
          库存上限: ${item.maxStock}<br/>
          安全库存: ${item.safetyStock}<br/>
          库存状态: ${getStatusText(item)} (${percentage}%)<br/>
          安全库存状态: ${currentVsSafety}安全库存 (${safetyPercentage}%)${warningText}
        `;
      },
      textStyle: {
        color: '#fff'
      },
      backgroundColor: 'rgba(30, 30, 30, 0.8)'
    },
    grid: {
      left: 100,
      top: 60, // 设置条形图的边距
      right: 100,
      bottom: 60
    },
    xAxis: {
      max: total,
      splitLine: {
        show: false
      },
      axisLine: {
        show: false
      },
      axisLabel: {
        show: false
      },
      axisTick: {
        show: false
      }
    },
    yAxis: [
      {
        type: 'category',
        inverse: true, // 垂直翻转，从上到下
        data: materialData.map((item) => item.name),
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: '#ddd',
          fontSize: 10,
          interval: 0 // 显示所有标签
        }
      }
    ],
    series: [
      {
        // 内
        type: 'bar',
        barWidth: 20,
        silent: true,
        itemStyle: {
          color: function (params) {
            const item = materialData[params.dataIndex];
            return getBatteryGradientColor(item);
          }
        },
        label: {
          formatter: function (params) {
            return params.data.name;
          },
          color: '#fff',
          fontSize: 12,
          position: 'left',
          distance: 10, // 向左偏移位置
          show: true
        },
        data: category,
        z: 1,
        animationEasing: 'elasticOut'
      },
      {
        // 分隔
        type: 'pictorialBar',
        itemStyle: {
          color: '#333'
        },
        symbolRepeat: 'fixed',
        symbolMargin: 1,
        symbol: 'rect',
        symbolClip: true,
        symbolSize: [2, 20],
        symbolPosition: 'start',
        symbolOffset: [2, -3],
        symbolBoundingData: total,
        data: materialData.map(() => total),
        z: 2,
        animationEasing: 'elasticOut'
      },
      {
        // label
        type: 'pictorialBar',
        symbolBoundingData: total,
        itemStyle: {
          color: 'none'
        },
        label: {
          formatter: function (params) {
            const item = materialData[params.dataIndex];
            const text = ((params.value * 100) / item.maxStock).toFixed(1) + '%';
            return text;
          },
          color: '#ffffff',
          fontSize: 10,
          position: 'right',
          distance: 5, // 向右偏移位置
          show: true
        },
        data: datas,
        z: 0
      },
      {
        name: '外框',
        type: 'bar',
        barGap: '-130%', // 设置外框粗细
        data: materialData.map(() => total),
        barWidth: 28,
        itemStyle: {
          barBorderRadius: [5, 5, 5, 5],
          color: 'transparent', // 填充色
          borderColor: '#666', // 边框色
          borderWidth: 2 // 边框宽度
        },
        z: 0
      }
    ]
  };

  batteryChartInstance.setOption(option);
};

// 获取电池渐变色
const getBatteryGradientColor = (item: any) => {
  const percentage = (item.currentStock / item.maxStock) * 100;
  const safetyPercentage = (item.currentStock / item.safetyStock) * 100;

  // 如果低于安全库存且低于10%，使用红色
  if (item.currentStock < item.safetyStock && percentage < 10) {
    return {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: '#ffcccc' }, // 浅红
        { offset: 0.5, color: '#ff6666' }, // 中红
        { offset: 1, color: '#cc0000' } // 深红
      ]
    };
  }
  // 如果低于安全库存但不低于10%，使用橙色
  else if (item.currentStock < item.safetyStock) {
    return {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: '#ffeaa7' }, // 浅橙
        { offset: 0.5, color: '#fdcb6e' }, // 中橙
        { offset: 1, color: '#e17055' } // 深橙
      ]
    };
  }
  // 正常库存，使用绿色
  else if (item.currentStock <= item.maxStock) {
    return {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: '#a8e6cf' }, // 浅绿
        { offset: 0.5, color: '#66d366' }, // 中绿
        { offset: 1, color: '#2e8b57' } // 深绿
      ]
    };
  }
  // 超过最大库存，使用蓝色
  else {
    return {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: '#b5e7ff' }, // 浅蓝
        { offset: 0.5, color: '#6bb8ff' }, // 中蓝
        { offset: 1, color: '#3474ac' } // 深蓝
      ]
    };
  }
};

// 获取库存颜色
const getStockColor = (item: any) => {
  if (item.currentStock < item.safetyStock) {
    // 低于安全库存，使用红色
    return '#F56C6C';
  } else if (item.currentStock > item.maxStock) {
    // 超过最大库存，使用橙色
    return '#E6A23C';
  } else {
    // 正常库存，使用绿色
    return '#67C23A';
  }
};

// 获取库存状态文本
const getStatusText = (item: any) => {
  if (item.currentStock < item.safetyStock) {
    return '库存不足';
  } else if (item.currentStock > item.maxStock) {
    return '库存超储';
  } else {
    return '库存正常';
  }
};

// 窗口大小变化时重绘图表
const resizeCharts = () => {
  updateCarouselHeight();
  batteryChartInstance?.resize();

  Object.values(carouselChartInstances).forEach((instance) => {
    instance?.resize();
  });
};

let timer = null;
let resizeObserver = null;

onMounted(async () => {
  // 初始化时间并设置定时器
  updateDateTime();
  timer = setInterval(updateDateTime, 1000);

  const userSettingsFormObj = localStorage.getItem('materialSupermarketScada');
  if (userSettingsFormObj) {
    userSettingsForm.value = JSON.parse(userSettingsFormObj);
  }

  await run();

  nextTick(() => {
    updateCarouselHeight();
    initCharts();
    window.addEventListener('resize', resizeCharts);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // 添加 ResizeObserver 监听容器大小变化
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(resizeCharts);
      if (boardRef.value) {
        resizeObserver.observe(boardRef.value);
      }
    }
  });
});

onUnmounted(() => {
  // 清除定时器
  if (timer) {
    clearInterval(timer);
  }

  // 移除事件监听器
  window.removeEventListener('resize', resizeCharts);
  document.removeEventListener('fullscreenchange', handleFullscreenChange);

  // 断开 ResizeObserver
  if (resizeObserver) {
    resizeObserver.disconnect();
  }

  // 销毁图表实例
  batteryChartInstance?.dispose();

  // 销毁所有轮播图表实例
  Object.values(carouselChartInstances).forEach((instance) => {
    if (instance) {
      instance.dispose();
    }
  });
});
</script>

<style lang="scss" scoped>
.material-board,
.material-board-theme {
  --ref-cyan: #0ac1c7;
  --ref-blue: #4facfe;
  position: relative;
  width: 100%;
  height: calc(100vh - 84px);
  min-height: calc(100vh - 84px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #e8f4ff;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  color-scheme: dark;
  background: #020818;
}

.material-board.is-fullscreen {
  height: 100vh;
  min-height: 100vh;
}

.board-grid-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(rgba(10, 193, 199, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(10, 193, 199, 0.04) 1px, transparent 1px),
    radial-gradient(circle at 20% 20%, rgba(79, 172, 254, 0.12), transparent 35%),
    radial-gradient(circle at 80% 80%, rgba(10, 193, 199, 0.1), transparent 40%),
    linear-gradient(180deg, #020818 0%, #071428 50%, #020818 100%);
  background-size: 48px 48px, 48px 48px, auto, auto, auto;
}

.material-board > *:not(.board-grid-bg) {
  position: relative;
  z-index: 1;
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  height: 76px;
  padding: 0 20px;
  border-bottom: 1px solid rgba(10, 193, 199, 0.25);
  background: linear-gradient(180deg, rgba(8, 24, 48, 0.95), rgba(4, 14, 30, 0.85));
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.35);
}

.header-left,
.header-right {
  flex: 1;
  display: flex;
  align-items: center;
}

.header-left {
  justify-content: flex-start;
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
}

.logo {
  height: 48px;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 0 12px rgba(0, 200, 255, 0.35);
}

.page-title {
  margin: 0;
  font-size: 30px;
  font-weight: 600;
  letter-spacing: 4px;
  background: linear-gradient(180deg, #b8c8dc, #fff);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.refresh-tag {
  background: rgba(10, 193, 199, 0.12);
  border: 1px solid rgba(10, 193, 199, 0.32);
  color: #93f8fb;
}

.time-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ref-cyan);
  font-size: 22px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.dashboard-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 16px;
  min-height: 0;
  overflow: hidden;
}

.kpi-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  flex-shrink: 0;
}

.kpi-card {
  position: relative;
  min-height: 132px;
  padding: 14px 16px;
  border: 1px solid rgba(79, 172, 254, 0.22);
  background: rgba(8, 20, 42, 0.72);
  backdrop-filter: blur(8px);
}

.kpi-card--blue {
  border-color: rgba(79, 172, 254, 0.35);
  background: linear-gradient(135deg, rgba(42, 74, 122, 0.55), rgba(8, 20, 42, 0.85));
}

.kpi-card--gold {
  border-color: rgba(230, 162, 60, 0.35);
  background: linear-gradient(135deg, rgba(90, 74, 42, 0.55), rgba(8, 20, 42, 0.85));
}

.kpi-card--cyan {
  border-color: rgba(10, 193, 199, 0.35);
  background: linear-gradient(135deg, rgba(42, 90, 74, 0.55), rgba(8, 20, 42, 0.85));
}

.kpi-card--danger {
  border-color: rgba(245, 108, 108, 0.35);
  background: linear-gradient(135deg, rgba(90, 42, 58, 0.55), rgba(8, 20, 42, 0.85));
}

.kpi-corner {
  position: absolute;
  width: 12px;
  height: 12px;
  border: 2px solid var(--ref-cyan);
}

.kpi-corner-tl {
  top: -1px;
  left: -1px;
  border-right: none;
  border-bottom: none;
}

.kpi-corner-tr {
  top: -1px;
  right: -1px;
  border-left: none;
  border-bottom: none;
}

.kpi-corner-bl {
  bottom: -1px;
  left: -1px;
  border-right: none;
  border-top: none;
}

.kpi-corner-br {
  bottom: -1px;
  right: -1px;
  border-left: none;
  border-top: none;
}

.kpi-title {
  font-size: 14px;
  color: rgba(232, 244, 255, 0.75);
  margin-bottom: 6px;
}

.kpi-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.1;
  color: #fff;
  text-shadow: 0 0 16px rgba(79, 172, 254, 0.35);
}

.kpi-meta {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kpi-meta-row {
  display: flex;
  gap: 12px;
}

.kpi-meta-item {
  flex: 1;
  display: flex;
  gap: 4px;
  font-size: 12px;
  min-width: 0;
}

.kpi-meta-label {
  color: rgba(200, 214, 255, 0.65);
  white-space: nowrap;
}

.kpi-meta-value {
  color: #fff;
  font-weight: 600;

  &.text-success {
    color: #67c23a;
  }

  &.text-danger {
    color: #f56c6c;
  }
}

.station-bottom {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.chart-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(79, 172, 254, 0.22);
  background: rgba(8, 20, 42, 0.72);
  backdrop-filter: blur(8px);
}

.chart-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 18px 0;
  flex-shrink: 0;
}

.panel-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #fff;

  &::before {
    content: '';
    width: 4px;
    height: 16px;
    margin-right: 8px;
    border-radius: 2px;
    background: linear-gradient(180deg, var(--ref-blue), var(--ref-cyan));
  }
}

.chart-panel-meta {
  display: flex;
  align-items: center;
  gap: 20px;
}

.page-indicator {
  font-size: 13px;
  color: #8ec5ff;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(21, 136, 209, 0.15);
  border: 1px solid rgba(100, 150, 255, 0.25);
}

.stock-legend {
  display: flex;
  align-items: center;
  gap: 12px;
}

.legend-item {
  position: relative;
  padding-left: 14px;
  font-size: 12px;
  color: #c8d6ff;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 8px;
    height: 8px;
    border-radius: 2px;
  }
}

.legend-normal::before {
  background: #67c23a;
}

.legend-low::before {
  background: #f56c6c;
}

.legend-over::before {
  background: #e6a23c;
}

.chart-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 8px 16px 12px;
  min-height: 0;
}

.chart {
  height: 100%;
  width: 100%;
  min-height: 280px;
}

.chart-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(200, 214, 255, 0.65);
  font-size: 14px;
}

.material-carousel {
  height: 100%;

  :deep(.el-carousel__container) {
    border-radius: 8px;
    background: linear-gradient(180deg, rgba(7, 19, 71, 0.55) 0%, rgba(10, 24, 58, 0.35) 100%);
    border: 1px solid rgba(100, 150, 255, 0.12);
  }

  :deep(.el-carousel__arrow) {
    width: 40px;
    height: 40px;
    background: rgba(16, 13, 68, 0.85);
    border: 1px solid rgba(100, 150, 255, 0.35);
    color: #8ec5ff;

    &:hover {
      background: rgba(54, 113, 232, 0.85);
      color: #fff;
    }
  }

  :deep(.el-carousel__indicators--outside) {
    margin-top: 8px;
  }

  :deep(.el-carousel__indicator) {
    .el-carousel__button {
      width: 24px;
      height: 4px;
      border-radius: 2px;
      background: rgba(142, 197, 255, 0.25);
      opacity: 1;
    }

    &.is-active .el-carousel__button {
      background: linear-gradient(90deg, #4facfe, #00f2fe);
    }
  }

  :deep(.el-carousel__item) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.board-bottom {
  flex-shrink: 0;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid rgba(10, 193, 199, 0.18);
  background: rgba(4, 12, 28, 0.85);
}

.board-bottom-text {
  text-align: center;

  h5 {
    margin: 0;
    font-size: 13px;
    font-weight: 500;
    color: rgba(200, 214, 255, 0.75);
  }

  p {
    margin: 2px 0 0;
    font-size: 11px;
    color: rgba(200, 214, 255, 0.45);
    letter-spacing: 1px;
  }

  .bottom-top {
    color: var(--ref-cyan);
  }
}

.settings-unit {
  margin-left: 8px;
  color: rgba(200, 214, 255, 0.65);
}

@media (max-width: 1400px) {
  .kpi-strip {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

<style lang="scss">
.material-board-dialog-modal {
  .el-dialog {
    background: linear-gradient(180deg, #0f1936, #0a1228);
    border: 1px solid rgba(10, 193, 199, 0.25);
  }

  .el-dialog__title,
  .el-dialog__headerbtn .el-dialog__close {
    color: #c8d6ff;
  }

  .el-form-item__label {
    color: #c8d6ff;
  }
}
</style>
