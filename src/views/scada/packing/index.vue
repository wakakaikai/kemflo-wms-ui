<template>
  <div ref="boardRef" class="app-container home">
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

    <!-- 顶部统计卡片 -->
    <div class="station-top">
      <el-row :gutter="12" class="mt5">
        <el-col :span="6">
          <div class="top-item-box item-box-one" style="display: flex">
            <div style="flex: 2; height: 100%">
              <div>打包</div>
              <div style="text-align: center; margin-top: 30px"><span style="font-size: 26px; font-weight: bold">96</span></div>
            </div>
            <div style="flex: 3; display: flex; flex-direction: column; justify-content: space-evenly">
              <div>今日打包：96</div>
              <div>昨日打包：91</div>
              <div>本周平均：68</div>
              <div>本月累计：462</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="top-item-box item-box-two" style="display: flex">
            <div style="flex: 2; height: 100%">
              <div>送仓</div>
              <div style="text-align: center; margin-top: 30px"><span style="font-size: 26px; font-weight: bold">96</span></div>
            </div>
            <div style="flex: 3; display: flex; flex-direction: column; justify-content: space-evenly">
              <div>今日送仓：96</div>
              <div>昨日送仓：91</div>
              <div>本周平均：68</div>
              <div>本月累计：462</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="top-item-box item-box-three" style="display: flex">
            <div style="flex: 2; height: 100%">
              <div>接收</div>
              <div style="text-align: center; margin-top: 30px"><span style="font-size: 26px; font-weight: bold">81</span></div>
            </div>
            <div style="flex: 3; display: flex; flex-direction: column; justify-content: space-evenly">
              <div>今日接收：81</div>
              <div>昨日接收：77</div>
              <div>接收率：84.4%</div>
              <div>退回数：1</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="top-item-box item-box-four" style="display: flex">
            <div style="flex: 2; height: 100%">
              <div>异常</div>
              <div style="text-align: center; margin-top: 30px"><span style="font-size: 26px; font-weight: bold">1</span></div>
            </div>
            <div style="flex: 3; display: flex; flex-direction: column; justify-content: space-evenly">
              <div>今日异常：1</div>
              <div>昨日异常：0</div>
              <div>本周平均：0.1</div>
              <div>本月累计：1</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 中间图表区 -->
    <div class="station-middle">
      <el-row :gutter="12">
        <el-col :span="6">
          <el-card class="box-card" shadow="never">
            <div class="card-title">仓库接收占比</div>
            <div style="height: calc(100% - 30px)">
              <div ref="pieChart" style="height: 100%"></div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="18">
          <el-card class="box-card" shadow="never">
            <div style="display: flex; justify-content: space-between; align-items: center">
              <div class="card-title">打包入库趋势</div>
              <el-radio-group v-model="tabPosition" @change="dateChange">
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month">本月</el-radio-button>
              </el-radio-group>
            </div>
            <div style="height: calc(100% - 30px)">
              <div ref="barChart" style="height: 100%"></div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 底部折线图区 -->
    <div class="station-bottom">
      <el-row :gutter="12">
        <el-col :span="6">
          <el-card class="box-card" shadow="never">
            <div class="card-title">近7日打包数</div>
            <div style="height: calc(100% - 30px)">
              <div ref="lineChart1" style="height: 100%"></div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="box-card" shadow="never">
            <div class="card-title">近7日送仓数</div>
            <div style="height: calc(100% - 30px)">
              <div ref="lineChart2" style="height: 100%"></div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="box-card" shadow="never">
            <div class="card-title">近7日接收数</div>
            <div style="height: calc(100% - 30px)">
              <div ref="lineChart3" style="height: 100%"></div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="box-card" shadow="never">
            <div class="card-title">近7日退回数</div>
            <div style="height: calc(100% - 30px)">
              <div ref="lineChart4" style="height: 100%"></div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts';
import { onMounted, ref, nextTick, onUnmounted } from 'vue';
import moment from 'moment';

const tabPosition = ref('week');
const currentDateTime = ref('');
const showSettings = ref(false);

// 图表DOM引用
const pieChart = ref();
const barChart = ref();
const lineChart1 = ref();
const lineChart2 = ref();
const lineChart3 = ref();
const lineChart4 = ref();

// 图表实例
let pieChartInstance = null;
let barChartInstance = null;
let lineChartInstance1 = null;
let lineChartInstance2 = null;
let lineChartInstance3 = null;
let lineChartInstance4 = null;

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
    alert('浏览器不支持全屏');
    return;
  }

  if (!isFullscreen.value) {
    if (boardRef.value.requestFullscreen) {
      boardRef.value.requestFullscreen();
    } else if (boardRef.value.mozRequestFullScreen) {
      boardRef.value.mozRequestFullScreen();
    } else if (boardRef.value.webkitRequestFullscreen) {
      boardRef.value.webkitRequestFullscreen();
    } else if (boardRef.value.msRequestFullscreen) {
      boardRef.value.msRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
};

// 全屏状态变化处理
const handleFullscreenChange = () => {
  isFullscreen.value = !!(document.fullscreenElement ||
                          document.mozFullScreenElement ||
                          document.webkitFullscreenElement ||
                          document.msFullscreenElement);
};

// 刷新数据函数
const refreshData = () => {
  // 模拟刷新数据
  console.log('刷新数据');
  initCharts();
};

// 初始化所有图表
const initCharts = () => {
  initPieChart();
  initBarChart();
  initLineCharts();
};

// 初始化饼图 (优化暗色模式)
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
          show: false,
          position: 'center',
          color: '#fff'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold',
            color: '#fff'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 81, name: '已接收', itemStyle: { color: '#5c9bff' } },
          { value: 1, name: '已退回', itemStyle: { color: '#ff6b6b' } },
          { value: 0, name: '接收失败', itemStyle: { color: '#a0a0ff' } },
          { value: 14, name: '待处理', itemStyle: { color: '#ffd166' } }
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

// 初始化折线图 (优化暗色模式)
const initLineCharts = () => {
  // 近7日数据
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    dates.push(moment().subtract(i, 'days').format('MM-DD'));
  }

  // 打包数折线图
  lineChartInstance1 = echarts.init(lineChart1.value);
  lineChartInstance1.setOption(getLineChartOption(dates, [32, 68, 65, 29, 81, 91, 96], '#5c9bff'));

  // 送仓数折线图
  lineChartInstance2 = echarts.init(lineChart2.value);
  lineChartInstance2.setOption(getLineChartOption(dates, [32, 68, 65, 29, 81, 91, 96], '#6bc9ff'));

  // 接收数折线图
  lineChartInstance3 = echarts.init(lineChart3.value);
  lineChartInstance3.setOption(getLineChartOption(dates, [32, 68, 65, 29, 81, 77, 81], '#a0a0ff'));

  // 退回数折线图
  lineChartInstance4 = echarts.init(lineChart4.value);
  lineChartInstance4.setOption(getLineChartOption(dates, [0, 0, 0, 0, 0, 0, 1], '#ff6b6b'));
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

// 时间范围切换 (优化暗色模式)
const dateChange = (value) => {
  let xData = [];
  let packedData = [];
  let sentData = [];
  let receivedData = [];

  if (value === 'week') {
    // 本周数据
    for (let i = 6; i >= 0; i--) {
      const date = moment().subtract(i, 'days');
      xData.push(date.format('MM-DD'));
      packedData.push(getRandomInt(20, 100));
      sentData.push(getRandomInt(20, 100));
      receivedData.push(getRandomInt(20, 90));
    }
  } else {
    // 本月数据
    const daysInMonth = moment().daysInMonth();
    for (let i = daysInMonth; i > 0; i--) {
      const date = moment().date(i);
      xData.push(date.format('MM-DD'));
      packedData.push(getRandomInt(20, 100));
      sentData.push(getRandomInt(20, 100));
      receivedData.push(getRandomInt(20, 90));
    }
    xData = xData.reverse();
    packedData = packedData.reverse();
    sentData = sentData.reverse();
    receivedData = receivedData.reverse();
  }

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
      data: ['打包数', '送仓数', '接收数']
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
        }
      },
      {
        name: '送仓数',
        type: 'bar',
        data: sentData,
        itemStyle: {
          color: '#6bc9ff'
        }
      },
      {
        name: '接收数',
        type: 'bar',
        data: receivedData,
        itemStyle: {
          color: '#a0a0ff'
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
};

let timer = null;

onMounted(() => {
  // 初始化时间并设置定时器
  updateDateTime();
  timer = setInterval(updateDateTime, 1000);

  nextTick(() => {
    initCharts();
    window.addEventListener('resize', resizeCharts);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
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
  document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.removeEventListener('msfullscreenchange', handleFullscreenChange);

  // 销毁图表实例
  pieChartInstance?.dispose();
  barChartInstance?.dispose();
  lineChartInstance1?.dispose();
  lineChartInstance2?.dispose();
  lineChartInstance3?.dispose();
  lineChartInstance4?.dispose();
});
</script>

<style scoped>
/* header样式 */
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  padding: 16px;
  overflow: auto;
  box-shadow: 0 0 30px rgba(0, 10, 255, 0.3);
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
  margin: 0;
  cursor: pointer;
}

.current-time {
  font-size: 18px;
  font-weight: 500;
  color: #fff;
  text-shadow: 0 0 5px rgba(100, 150, 255, 0.5);
}

/* 全屏模式优化 */
.app-container:-webkit-full-screen {
  padding: 10px;
}

.app-container:-moz-full-screen {
  padding: 10px;
}

.app-container:fullscreen {
  padding: 10px;
}

.app-container:-webkit-full-screen .dashboard-header {
  height: 80px;
}

.app-container:-moz-full-screen .dashboard-header {
  height: 80px;
}

.app-container:fullscreen .dashboard-header {
  height: 80px;
}

.app-container:-webkit-full-screen .logo {
  height: 50px;
}

.app-container:-moz-full-screen .logo {
  height: 50px;
}

.app-container:fullscreen .logo {
  height: 50px;
}

.top-item-box {
  height: 160px;
  background: #2a2a4a;
  margin-bottom: 12px;
  border-radius: 12px;
  color: #fff;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(100, 120, 255, 0.2);
}

.item-box-one {
  background: linear-gradient(30deg, #2a4a7a, #3a5a9a, #4a6abc);
}

.item-box-two {
  background: linear-gradient(30deg, #5a4a2a, #7a6a3a, #9a8a4a);
}

.item-box-three {
  background: linear-gradient(30deg, #4a2a5a, #6a3a7a, #8a4a9a);
}

.item-box-four {
  background: linear-gradient(30deg, #5a2a3a, #7a3a4a, #9a4a5a);
}

.box-card {
  height: 400px;
  margin-bottom: 12px;
  background-color: rgba(30, 30, 40, 0.7);
  border-color: rgba(100, 100, 200, 0.3);
  color: #fff;
  backdrop-filter: blur(10px);
}

.box-card :deep(.el-card__body) {
  height: 100%;
  background-color: transparent;
  color: #fff;
}

.card-title {
  font-weight: bold;
  height: 30px;
  display: flex;
  align-items: center;
  color: #fff;
}

.card-title::before {
  content: '';
  height: 70%;
  width: 5px;
  background: #3671e8;
  margin-right: 8px;
}

.mt5 {
  margin-top: 5px;
}

.station-top,
.station-middle,
.station-bottom {
  padding: 12px;
}
</style>
