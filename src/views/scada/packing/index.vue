<template>
  <div ref="boardRef" class="app-container">
    <!-- 顶部标题 -->
    <div class="dashboard-header">
      <div class="header-left">
        <img src="@/assets/logo/kemflo-logo.jpg" alt="Logo" class="logo" @click="toggleFullscreen" />
      </div>
      <div class="header-center" @click="showSettings = true">
        <h2>打包看板</h2>
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
                <div class="card-title-large">打包</div>
                <div class="card-main">
                  <div class="card-value-wrapper">
                    <div class="card-value">{{ packingData.totalInQueuePackedQty }}</div>
                  </div>
                  <div class="card-details">
                    <div class="detail-row">
                      <div class="detail-item">
                        <span class="detail-label">今日：</span>
                        <span class="detail-value">{{ packingData.todayTotalPackedQty }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">昨日：</span>
                        <span class="detail-value">{{ packingData.yesterdayTotalPackedQty }}</span>
                      </div>
                    </div>
                    <div class="detail-row">
                      <div class="detail-item">
                        <span class="detail-label">周平均：</span>
                        <span class="detail-value">{{ packingData.weekAvgPackedQty }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">周累计：</span>
                        <span class="detail-value">{{ packingData.weekTotalPackedQty }}</span>
                      </div>
                    </div>
                    <div class="detail-row">
                      <div class="detail-item">
                        <span class="detail-label">月累计：</span>
                        <span class="detail-value">{{ packingData.monthTotalPackedQty }}</span>
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
                <div class="card-title-large">待入库</div>
                <div class="card-main">
                  <div class="card-value-wrapper">
                    <div class="card-value">{{ packingData.totalInQueueInboundPendingQty }}</div>
                  </div>
                  <div class="card-details">
                    <div class="detail-row">
                      <div class="detail-item">
                        <span class="detail-label">今日：</span>
                        <span class="detail-value">{{ packingData.todayTotalInboundPendingQty }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">昨日：</span>
                        <span class="detail-value">{{ packingData.yesterdayTotalInboundPendingQty }}</span>
                      </div>
                    </div>
                    <div class="detail-row">
                      <div class="detail-item">
                        <span class="detail-label">周平均：</span>
                        <span class="detail-value">{{ packingData.weekAvgInboundPendingQty }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">周累计：</span>
                        <span class="detail-value">{{ packingData.weekTotalInboundPendingQty }}</span>
                      </div>
                    </div>
                    <div class="detail-row">
                      <div class="detail-item">
                        <span class="detail-label">月累计：</span>
                        <span class="detail-value">{{ packingData.monthTotalInboundPendingQty }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="card-wrapper">
            <div class="top-item-box item-box-three">
              <div class="card-content">
                <div class="card-title-large">已接收</div>
                <div class="card-main">
                  <div class="card-value-wrapper">
                    <div class="card-value">{{ packingData.todayTotalReceivedQty }}</div>
                  </div>
                  <div class="card-details">
                    <div class="detail-row">
                      <div class="detail-item">
                        <span class="detail-label">今日：</span>
                        <span class="detail-value">{{ packingData.todayTotalReceivedQty }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">昨日：</span>
                        <span class="detail-value">{{ packingData.yesterdayTotalReceivedQty }}</span>
                      </div>
                    </div>
                    <div class="detail-row">
                      <div class="detail-item">
                        <span class="detail-label">周平均：</span>
                        <span class="detail-value">{{ packingData.weekAvgReceivedQty }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">周累计：</span>
                        <span class="detail-value">{{ packingData.weekTotalReceivedQty }}</span>
                      </div>
                    </div>
                    <div class="detail-row">
                      <div class="detail-item">
                        <span class="detail-label">月累计：</span>
                        <span class="detail-value">{{ packingData.monthTotalReceivedQty }}</span>
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
                <div class="card-title-large">已退回</div>
                <div class="card-main">
                  <div class="card-value-wrapper">
                    <div class="card-value">{{ packingData.totalInQueueRejectedQty }}</div>
                  </div>
                  <div class="card-details">
                    <div class="detail-row">
                      <div class="detail-item">
                        <span class="detail-label">今日：</span>
                        <span class="detail-value">{{ packingData.todayTotalRejectedQty }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">昨日：</span>
                        <span class="detail-value">{{ packingData.yesterdayTotalRejectedQty }}</span>
                      </div>
                    </div>
                    <div class="detail-row">
                      <div class="detail-item">
                        <span class="detail-label">周平均：</span>
                        <span class="detail-value">{{ packingData.weekAvgRejectedQty }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">周累计：</span>
                        <span class="detail-value">{{ packingData.weekTotalRejectedQty }}</span>
                      </div>
                    </div>
                    <div class="detail-row">
                      <div class="detail-item">
                        <span class="detail-label">月累计：</span>
                        <span class="detail-value">{{ packingData.monthTotalRejectedQty }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="card-wrapper">
            <div class="top-item-box item-box-five">
              <div class="card-content">
                <div class="card-title-large">接收失败</div>
                <div class="card-main">
                  <div class="card-value-wrapper">
                    <div class="card-value">{{ packingData.totalInQueueReceivedFailedQty }}</div>
                  </div>
                  <div class="card-details">
                    <div class="detail-row">
                      <div class="detail-item">
                        <span class="detail-label">今日：</span>
                        <span class="detail-value">{{ packingData.todayTotalReceivedFailedQty }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">昨日：</span>
                        <span class="detail-value">{{ packingData.yesterdayTotalReceivedFailedQty }}</span>
                      </div>
                    </div>
                    <div class="detail-row">
                      <div class="detail-item">
                        <span class="detail-label">周平均：</span>
                        <span class="detail-value">{{ packingData.weekAvgReceivedFailedQty }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">周累计：</span>
                        <span class="detail-value">{{ packingData.weekTotalReceivedFailedQty }}</span>
                      </div>
                    </div>
                    <div class="detail-row">
                      <div class="detail-item">
                        <span class="detail-label">月累计：</span>
                        <span class="detail-value">{{ packingData.monthTotalReceivedFailedQty }}</span>
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
      <div class="station-middle">
        <el-row :gutter="12" class="chart-row">
          <el-col :span="6">
            <el-card class="box-card" shadow="never">
              <div class="card-title">仓库接收占比</div>
              <div class="chart-container">
                <div ref="pieChart" class="chart"></div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="18">
            <el-card class="box-card" shadow="never">
              <div style="display: flex; justify-content: space-between; align-items: center">
                <div class="card-title">打包入库趋势</div>
                <el-radio-group v-model="tabPosition" @change="dateChange">
                  <el-radio-button label="week">近一周</el-radio-button>
                  <el-radio-button label="month">本月</el-radio-button>
                </el-radio-group>
              </div>
              <div class="chart-container">
                <div ref="barChart" class="chart"></div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 底部折线图区 -->
      <div class="station-bottom">
        <div class="line-charts-container">
          <div class="chart-wrapper">
            <el-card class="box-card" shadow="never">
              <div class="card-title">近7日打包数</div>
              <div class="chart-container">
                <div ref="lineChart1" class="chart"></div>
              </div>
            </el-card>
          </div>
          <div class="chart-wrapper">
            <el-card class="box-card" shadow="never">
              <div class="card-title">近7日送仓数</div>
              <div class="chart-container">
                <div ref="lineChart2" class="chart"></div>
              </div>
            </el-card>
          </div>
          <div class="chart-wrapper">
            <el-card class="box-card" shadow="never">
              <div class="card-title">近7日接收数</div>
              <div class="chart-container">
                <div ref="lineChart3" class="chart"></div>
              </div>
            </el-card>
          </div>
          <div class="chart-wrapper">
            <el-card class="box-card" shadow="never">
              <div class="card-title">近7日退回数</div>
              <div class="chart-container">
                <div ref="lineChart4" class="chart"></div>
              </div>
            </el-card>
          </div>
          <div class="chart-wrapper">
            <el-card class="box-card" shadow="never">
              <div class="card-title">近7日接收失败</div>
              <div class="chart-container">
                <div ref="lineChart5" class="chart"></div>
              </div>
            </el-card>
          </div>
        </div>
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

<script setup name="PackingScada" lang="ts">
import * as echarts from 'echarts';
import { useRequest } from 'vue-request';
import moment from 'moment';
import { ElMessage } from 'element-plus';
import { packingScada } from '@/api/wms/scada/index';
import { ref } from 'vue';
interface UserSettingsForm {
  showOperationLine: number;
  showOperationPerRow: number;
  startTime: any;
  endTime: any;
  autoPlayCarousel: string | number;
  autoPlayInterval: number;
  freshScadaData: number;
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
const packingData = ref<Record<string, any>>({});

// 图表DOM引用
const pieChart = ref();
const barChart = ref();
const lineChart1 = ref();
const lineChart2 = ref();
const lineChart3 = ref();
const lineChart4 = ref();
const lineChart5 = ref();

// 图表实例
let pieChartInstance = null;
let barChartInstance = null;
let lineChartInstance1 = null;
let lineChartInstance2 = null;
let lineChartInstance3 = null;
let lineChartInstance4 = null;
let lineChartInstance5 = null;

const boardRef = ref(null);
const isFullscreen = ref(false);

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

// 刷新数据函数
const refreshData = async () => {
  // 默认本月1号0点到当前时间
  userSettingsForm.value.startTime = moment().startOf('month').format('YYYY-MM-DD HH:mm:ss');
  userSettingsForm.value.endTime = moment().format('YYYY-MM-DD HH:mm:ss');
  const res = await packingScada({ startTime: userSettingsForm.value.startTime, endTime: userSettingsForm.value.endTime });
  packingData.value = res.data;
  initCharts();
};
// 控制弹框显示
const showSettings = ref(false);
// 保存设置
const saveSettings = () => {
  showSettings.value = false;
  localStorage.setItem('packingScada', JSON.stringify(userSettingsForm.value));
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
  initPieChart();
  initBarChart();
  initLineCharts();
};

// 初始化饼图
const initPieChart = () => {
  pieChartInstance = echarts.init(pieChart.value);
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      textStyle: {
        color: '#fff'
      },
      backgroundColor: 'rgba(30, 30, 30, 0.8)'
    },
    legend: {
      textStyle: {
        color: '#e0e0e0'
      },
      // 修改图例位置到底部
      orient: 'horizontal',
      bottom: 10,
      left: 'center'
    },
    series: [
      {
        name: '接收状态',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#2c343c',
          borderWidth: 2
        },
        label: {
          show: true, // 显示标签
          position: 'outside', // 标签位置在外部
          color: '#fff',
          // formatter: '{b}\n{c} ({d}%)' // 显示名称、数值和百分比
          formatter: '{d}%' // 显示名称、数值和百分比
        },
        labelLine: {
          show: true, // 显示标签线
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.3)'
          }
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold',
            color: '#fff'
          }
        },
        data: [
          { value: packingData.value.totalInQueueInboundPendingQty, name: '待入库', itemStyle: { color: '#9a8a4a' } },
          { value: packingData.value.todayTotalReceivedQty, name: '已接收', itemStyle: { color: '#4a9a6a' } },
          { value: packingData.value.totalInQueueRejectedQty, name: '已退回', itemStyle: { color: '#ff6b6b' } },
          { value: packingData.value.totalInQueueReceivedFailedQty, name: '接收失败', itemStyle: { color: '#9a4a4a' } }
        ]
      }
    ]
  };
  pieChartInstance.setOption(option);
};

// 初始化主柱状图 (优化暗色模式)
const initBarChart = () => {
  barChartInstance = echarts.init(barChart.value);
  dateChange('week');
};

// 初始化折线图
const initLineCharts = () => {
  // 近7日数据
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    dates.push(moment().subtract(i, 'days').format('MM-DD'));
  }

  // 打包数折线图
  lineChartInstance1 = echarts.init(lineChart1.value);
  lineChartInstance1.setOption(getLineChartOption(dates, packingData.value.weekPackedQtyList, '#5c9bff'));

  // 送仓数折线图
  lineChartInstance2 = echarts.init(lineChart2.value);
  lineChartInstance2.setOption(getLineChartOption(dates, packingData.value.weekInboundQtyList, '#6bc9ff'));

  // 接收数折线图
  lineChartInstance3 = echarts.init(lineChart3.value);
  lineChartInstance3.setOption(getLineChartOption(dates, packingData.value.weekReceivedQtyList, '#a0a0ff'));

  // 退回数折线图
  lineChartInstance4 = echarts.init(lineChart4.value);
  lineChartInstance4.setOption(getLineChartOption(dates, packingData.value.weekRejectedQtyList, '#ff6b6b'));

  // 退回数折线图
  lineChartInstance5 = echarts.init(lineChart5.value);
  lineChartInstance5.setOption(getLineChartOption(dates, packingData.value.weekReceivedFailedQtyList, '#9a4a4a'));
};

// 获取折线图配置（带填充效果，优化暗色模式）
const getLineChartOption = (xData, yData, color) => {
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      textStyle: {
        color: '#fff'
      },
      backgroundColor: 'rgba(30, 30, 30, 0.8)'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xData,
      axisLine: {
        lineStyle: {
          color: '#aaa'
        }
      },
      axisLabel: {
        color: '#ddd'
      },
      splitLine: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#aaa'
        }
      },
      axisLabel: {
        color: '#ddd'
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: 'rgba(200, 200, 200, 0.1)'
        }
      }
    },
    series: [
      {
        name: '数量',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: true,
        lineStyle: {
          width: 3,
          color: color
        },
        itemStyle: {
          color: color,
          borderWidth: 2,
          borderColor: '#fff'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: color + '60' // 透明度38%
              },
              {
                offset: 1,
                color: color + '00' // 透明度0%
              }
            ]
          }
        },
        data: yData
      }
    ]
  };
};

// 时间范围切换
const dateChange = (value) => {
  let xData = [];
  const packedData = [];
  const receivedData = [];

  if (value === 'week') {
    // 近一周数据
    for (let i = 6; i >= 0; i--) {
      const date = moment().subtract(i, 'days');
      xData.push(date.format('MM-DD'));
      // packedData.push(getRandomInt(20, 100));
      // receivedData.push(getRandomInt(20, 90));
    }
    packedData.push(...(packingData.value.weekPackedQtyList || [0]));
    receivedData.push(...(packingData.value.weekReceivedQtyList || [0]));
  } else {
    // 本月数据
    const daysInMonth = moment().daysInMonth();
    for (let i = daysInMonth; i > 0; i--) {
      const date = moment().date(i);
      xData.push(date.format('MM-DD'));
      // packedData.push(getRandomInt(20, 100));
      // receivedData.push(getRandomInt(20, 90));
    }
    xData = xData.reverse();

    packedData.push(...packingData.value.monthPackedQtyList);
    receivedData.push(...packingData.value.monthReceivedQtyList);
  }
  console.log(xData, packedData, receivedData);

  // 计算各项平均值
  // const calcAverage = (arr) => (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
  // const packedAvg = calcAverage(packedData);
  // const receivedAvg = calcAverage(receivedData);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      textStyle: {
        color: '#fff'
      },
      backgroundColor: 'rgba(30, 30, 30, 0.8)'
    },
    legend: {
      textStyle: {
        color: '#e0e0e0'
      },
      data: ['打包数', '接收数']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xData,
      axisLine: {
        lineStyle: {
          color: '#aaa'
        }
      },
      axisLabel: {
        color: '#ddd'
      },
      splitLine: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#aaa'
        }
      },
      axisLabel: {
        color: '#ddd'
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: 'rgba(200, 200, 200, 0.1)'
        }
      }
    },
    series: [
      {
        name: '打包数',
        type: 'bar',
        data: packedData,
        itemStyle: {
          color: '#5c9bff'
        },
        label: {
          show: true,
          position: 'top',
          color: '#5c9bff',
          formatter: '{c}'
        },
        markLine: {
          silent: true,
          symbol: 'none',
          data: [
            {
              type: 'average',
              name: '打包平均',
              label: {
                position: 'end',
                formatter: '{c}',
                color: '#5c9bff'
              },
              lineStyle: {
                color: '#5c9bff',
                type: 'dashed'
              }
            }
          ]
        }
      },
      {
        name: '接收数',
        type: 'bar',
        data: receivedData,
        itemStyle: {
          color: '#4a9a6a'
        },
        label: {
          show: true,
          position: 'top',
          color: '#4a9a6a',
          formatter: '{c}'
        },
        markLine: {
          silent: true,
          symbol: 'none',
          data: [
            {
              type: 'average',
              name: '接收平均',
              label: {
                position: 'end',
                formatter: '{c}',
                color: '#4a9a6a'
              },
              lineStyle: {
                color: '#4a9a6a',
                type: 'dashed'
              }
            }
          ]
        }
      }
    ]
  };

  barChartInstance.setOption(option);
};

// 生成随机数
const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// 窗口大小变化时重绘图表
const resizeCharts = () => {
  pieChartInstance?.resize();
  barChartInstance?.resize();
  lineChartInstance1?.resize();
  lineChartInstance2?.resize();
  lineChartInstance3?.resize();
  lineChartInstance4?.resize();
  lineChartInstance5?.resize();
};

let timer = null;
let resizeObserver = null;
onMounted(async () => {
  // 初始化时间并设置定时器
  updateDateTime();
  timer = setInterval(updateDateTime, 1000);

  const userSettingsFormObj = localStorage.getItem('packingScada');
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
  pieChartInstance?.dispose();
  barChartInstance?.dispose();
  lineChartInstance1?.dispose();
  lineChartInstance2?.dispose();
  lineChartInstance3?.dispose();
  lineChartInstance4?.dispose();
  lineChartInstance5?.dispose();
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
  border-radius: 10px;
  padding: 0;
  margin-bottom: 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(100, 100, 255, 0.2);
  flex-shrink: 0;
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

/* 全屏模式优化 */
.app-container:fullscreen {
  padding: 10px;
}

.app-container:fullscreen .dashboard-header {
  height: 80px;
}

.app-container:fullscreen .logo {
  height: 50px;
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
</style>
