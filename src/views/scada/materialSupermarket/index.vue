<template>
  <div ref="boardRef" class="app-container">
    <!-- 顶部标题 -->
    <div class="dashboard-header">
      <div class="header-left">
        <img src="@/assets/logo/kemflo-logo.jpg" alt="Logo" class="logo" @click="toggleFullscreen" />
      </div>
      <div class="header-center" @click="showSettings = true">
        <h2>物料超市看板</h2>
      </div>
      <div class="header-right">
        <div class="current-time">{{ currentDateTime }}</div>
      </div>
    </div>

    <div class="dashboard-content">
      <!-- 顶部统计卡片 -->
      <div class="station-top">
        <div class="cards-container">
          <div class="card-wrapper">
            <div class="top-item-box item-box-one">
              <div class="card-content">
                <div class="card-title-large">总物料种类</div>
                <div class="card-main">
                  <div class="card-value-wrapper">
                    <div class="card-value">{{ dashboardStats.totalMaterialTypes }}</div>
                  </div>
                  <div class="card-details">
                    <div class="detail-row">
                      <div class="detail-item">
                        <span class="detail-label">安全库存:</span>
                        <span class="detail-value">{{ dashboardStats.materialsWithLowStock }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">超储物料:</span>
                        <span class="detail-value">{{ dashboardStats.materialsWithOverStock }}</span>
                      </div>
                    </div>
                    <div class="detail-row">
                      <div class="detail-item">
                        <span class="detail-label">缺料物料:</span>
                        <span class="detail-value">{{ dashboardStats.materialsWithShortage }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="card-wrapper">
            <div class="top-item-box item-box-two">
              <div class="card-content">
                <div class="card-title-large">库存总量</div>
                <div class="card-main">
                  <div class="card-value-wrapper">
                    <div class="card-value">{{ dashboardStats.totalInventory }}</div>
                  </div>
                  <div class="card-details">
                    <div class="detail-row">
                      <div class="detail-item">
                        <span class="detail-label">非限制:</span>
                        <span class="detail-value">{{ dashboardStats.unrestrictedStock }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">质检库存:</span>
                        <span class="detail-value">{{ dashboardStats.inspectionStock }}</span>
                      </div>
                    </div>
                    <div class="detail-row">
                      <div class="detail-item">
                        <span class="detail-label">冻结库存:</span>
                        <span class="detail-value">{{ dashboardStats.frozenStock }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
<!--          <div class="card-wrapper">
            <div class="top-item-box item-box-three">
              <div class="card-content">
                <div class="card-title-large">库存周转率</div>
                <div class="card-main">
                  <div class="card-value-wrapper">
                    <div class="card-value">{{ dashboardStats.inventoryTurnoverRate }}%</div>
                  </div>
                  <div class="card-details">
                    <div class="detail-row">
                      <div class="detail-item">
                        <span class="detail-label">上周:</span>
                        <span class="detail-value">{{ dashboardStats.lastWeekTurnoverRate }}%</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">上月:</span>
                        <span class="detail-value">{{ dashboardStats.lastMonthTurnoverRate }}%</span>
                      </div>
                    </div>
                    <div class="detail-row">
                      <div class="detail-item">
                        <span class="detail-label">同比:</span>
                        <span class="detail-value" :class="turnoverTrendClass">{{ turnoverTrendText }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>-->
          <div class="card-wrapper">
            <div class="top-item-box item-box-four">
              <div class="card-content">
                <div class="card-title-large">补货及时率</div>
                <div class="card-main">
                  <div class="card-value-wrapper">
                    <div class="card-value">{{ dashboardStats.restockTimelinessRate }}%</div>
                  </div>
                  <div class="card-details">
                    <div class="detail-row">
                      <div class="detail-item">
                        <span class="detail-label">今日:</span>
                        <span class="detail-value">{{ dashboardStats.todayRestockRate }}%</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">本周:</span>
                        <span class="detail-value">{{ dashboardStats.thisWeekRestockRate }}%</span>
                      </div>
                    </div>
                    <div class="detail-row">
                      <div class="detail-item">
                        <span class="detail-label">趋势:</span>
                        <span class="detail-value" :class="restockTrendClass">{{ restockTrendText }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="card-wrapper">
            <div class="top-item-box item-box-four">
              <div class="card-content">
                <div class="card-title-large">库存预警</div>
                <div class="card-main">
                  <div class="card-value-wrapper">
                    <div class="card-value">{{ dashboardStats.inventoryWarnings }}</div>
                  </div>
                  <div class="card-details">
                    <div class="detail-row">
                      <div class="detail-item">
                        <span class="detail-label">紧急:</span>
                        <span class="detail-value">{{ dashboardStats.criticalWarnings }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">一般:</span>
                        <span class="detail-value">{{ dashboardStats.normalWarnings }}</span>
                      </div>
                    </div>
                    <div class="detail-row">
                      <div class="detail-item">
                        <span class="detail-label">处理中:</span>
                        <span class="detail-value">{{ dashboardStats.processingWarnings }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间图表区 -->
      <!--      <div class="station-middle">
        <el-row :gutter="12" class="chart-row">
          <el-col :span="24">
            <el-card class="box-card" shadow="never">
              <div class="card-title">物料库存状态 - 电池柱状图</div>
              <div class="chart-container">
                <div ref="batteryChart" class="chart"></div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>-->

      <!-- 底部轮播区 -->
      <div class="station-bottom">
        <el-row :gutter="12" class="chart-row">
          <el-col :span="24">
            <el-card class="box-card" shadow="never">
              <div class="card-title">物料库存状态</div>
              <div class="chart-container">
                <el-carousel indicator-position="outside" height="600px" :interval="5000" arrow="always" @change="onCarouselChange">
                  <el-carousel-item v-for="(group, index) in materialGroups" :key="index">
                    <div :ref="(el) => setCarouselChartRef(el, index)" class="chart" :id="`carousel-chart-${index}`"></div>
                  </el-carousel-item>
                </el-carousel>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>

    <el-dialog v-model="showSettings" title="显示设置" width="40%">
      <div class="settings-content">
        <el-form ref="queryFormRef" :model="userSettingsForm" :inline="true" label-width="auto">
          <el-row :gutter="20">
            <el-col :sm="24" :md="24" :lg="24">
              <el-form-item label="数据刷新" prop="freshScadaData">
                <el-input-number v-model="userSettingsForm.freshScadaData" :min="5" :step="1">
                  <template #suffix>
                    <span>秒</span>
                  </template>
                </el-input-number>
              </el-form-item>
            </el-col>
          </el-row>
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
import { ref, computed, nextTick, onMounted, onUnmounted, reactive } from 'vue';

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
  inventoryWarnings: number;
  criticalWarnings: number;
  normalWarnings: number;
  processingWarnings: number;
}

const tabPosition = ref('week');
const currentDateTime = ref('');
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
const isFullscreen = ref(false);

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
    inventoryWarnings: 10,
    criticalWarnings: 3,
    normalWarnings: 7,
    processingWarnings: 5
  };

  // 初始化物料分组
  initializeMaterialGroups();

  initCharts();
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
  // 确保当前索引的图表已初始化
  if (carouselChartRefs.value[currentIndex]) {
    initCarouselChart(currentIndex);
  }
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

  // 根据参考代码配置选项
  // 根据参考代码配置选项
  const option = {
    backgroundColor: '#071347',
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
    grid: {
      left: 250,
      top: 100, // 设置条形图的边距
      right: 250,
      bottom: 100
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
        // 内
        type: 'bar',
        barWidth: 28,
        silent: true,
        itemStyle: {
          color: '#1588D1'
        },
        label: {
          formatter: '{b}',
          textStyle: {
            color: '#fff',
            fontSize: 14
          },
          position: 'left',
          distance: 20, // 向右偏移位置
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
          color: '#07314a'
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
          formatter: (params) => {
            var text;
            text = '{f| ' + ((params.data * 100) / total).toFixed(2) + '%}';
            return text;
          },
          rich: {
            f: {
              color: '#ffffff'
            }
          },
          position: 'right',
          distance: 10, // 向右偏移位置
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
          barBorderRadius: [5, 5, 5, 5],
          color: 'transparent', // 填充色
          borderColor: '#1588D1', // 边框色
          borderWidth: 3 // 边框宽度
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
          color: '#1588D1'
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
  batteryChartInstance?.resize();

  // 重绘所有轮播图表
  Object.values(carouselChartInstances).forEach((instance) => {
    if (instance) {
      instance.resize();
    }
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
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  padding: 16px;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(0, 10, 255, 0.3);
}

.app-container.fullscreen {
  padding: 0;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  gap: 10px;
}

/* 顶部标题样式 */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 70px;
  background: rgba(16, 13, 68, 0.8);
  border-radius: 12px;
  padding: 0;
  margin-bottom: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(100, 100, 255, 0.2);
  cursor: pointer;
}

.dashboard-header:hover {
  background: rgba(16, 13, 68, 0.9);
}

.header-left {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 16px;
}

.header-center {
  flex: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 16px;
}

.logo {
  height: 45px;
  filter: drop-shadow(0 0 5px rgba(100, 150, 255, 0.8));
  cursor: pointer;
}

.dashboard-header h2 {
  font-size: 28px;
  font-weight: bold;
  background: linear-gradient(to right, #4facfe, #00f2fe);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 10px rgba(0, 100, 255, 0.3);
  letter-spacing: 1px;
  cursor: pointer;
}

.current-time {
  font-size: 28px;
  font-weight: bold;
  color: #00f2fe;
  text-shadow: 0 2px 10px rgba(0, 100, 255, 0.3);
}

/* 使用flex布局的卡片容器 */
.station-top {
  flex: 0 0 auto;
}

.cards-container {
  display: flex;
  gap: 12px;
  margin-top: 5px;
}

.card-wrapper {
  flex: 1;
  min-width: 0; /* 允许卡片收缩 */
}

.top-item-box {
  height: 160px;
  background: #2a2a4a;
  border-radius: 10px;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(100, 120, 255, 0.2);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
}

.card-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-title-large {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 5px;
}

.card-main {
  display: flex;
  flex: 1;
  gap: 10px;
  align-items: center;
}

.card-value-wrapper {
  flex: 0.5;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin: 0 5px;
  min-width: 0;
  line-height: 60px;
}

.card-value {
  font-size: 26px;
  font-weight: bold;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-details {
  flex: 2;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 5px;
  gap: 5px;
}

.detail-row {
  display: flex;
  gap: 5px;
}

.detail-item {
  flex: 1;
  display: flex;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail-label {
  display: flex;
  justify-content: flex-end;
  padding-right: 5px;
  color: #ddd;
  min-width: 45px;
}

.detail-value {
  flex: 1;
  display: flex;
  justify-content: flex-start;
  font-weight: bold;
  color: #fff;
}

.text-success {
  color: #67c23a;
}

.text-danger {
  color: #f56c6c;
}

.item-box-one {
  background: linear-gradient(30deg, #2a4a7a, #3a5a9a, #4a6abc);
}

.item-box-two {
  background: linear-gradient(30deg, #5a4a2a, #7a6a3a, #9a8a4a);
}

.item-box-three {
  background: linear-gradient(30deg, #2a5a4a, #3a7a5a, #4a9a6a);
}

.item-box-four {
  background: linear-gradient(30deg, #5a2a3a, #7a3a4a, #9a4a5a);
}

.item-box-five {
  background: linear-gradient(30deg, #5a2a2a, #7a3a3a, #9a4a4a);
}

.station-middle {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.chart-row {
  height: 100%;
}

.station-bottom {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 0;
}

.box-card {
  height: 100%;
  background-color: rgba(30, 30, 40, 0.7);
  border-color: rgba(100, 100, 200, 0.3);
  color: #fff;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
}

.box-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: transparent;
  color: #fff;
  padding: 0;
}

.card-title {
  font-weight: bold;
  height: 30px;
  display: flex;
  align-items: center;
  color: #fff;
  padding: 10px 20px 5px;
  flex-shrink: 0;
}

.card-title::before {
  content: '';
  height: 16px;
  width: 5px;
  background: #3671e8;
  margin-right: 8px;
}

.chart-container {
  flex: 1;
  padding: 0 15px 15px;
  min-height: 0;
}

.chart {
  height: 100%;
  width: 100%;
}

.line-charts-container {
  display: flex;
  gap: 12px;
  height: 100%;
}

.chart-wrapper {
  flex: 1;
  min-width: 0;
}

.station-top {
  padding: 10px 0 5px 0;
}

.station-middle {
  padding: 0;
}

.station-bottom {
  padding: 0;
}
</style>
