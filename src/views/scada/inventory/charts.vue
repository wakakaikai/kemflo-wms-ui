<template>
  <div ref="boardRef" class="app-container home" :class="{ 'fullscreen': isFullscreen }">
    <!-- 顶部标题 -->
    <div class="dashboard-header">
      <div class="header-left">
        <img src="@/assets/logo/kemflo-logo.jpg" alt="Logo" class="logo" @click="toggleFullscreen" />
      </div>
      <div class="header-center" @click="showSettingDialog">
        <h2>出货看板</h2>
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
              <div>今日出货</div>
              <div style="text-align: center; margin-top: 30px">
                <span style="font-size: 26px; font-weight: bold">{{ stats.today }}</span>
              </div>
            </div>
            <div style="flex: 3; display: flex; flex-direction: column; justify-content: space-evenly">
              <div>待出货：{{ stats.pending }}</div>
              <div>昨日出货：{{ stats.yesterday }}</div>
              <div>本周平均：{{ stats.weekAvg }}</div>
              <div>本月累计：{{ stats.monthTotal }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="top-item-box item-box-two" style="display: flex">
            <div style="flex: 2; height: 100%">
              <div>紧急订单</div>
              <div style="text-align: center; margin-top: 30px">
                <span style="font-size: 26px; font-weight: bold">{{ stats.urgent }}</span>
              </div>
            </div>
            <div style="flex: 3; display: flex; flex-direction: column; justify-content: space-evenly">
              <div>今日紧急：{{ stats.urgentToday }}</div>
              <div>昨日紧急：{{ stats.urgentYesterday }}</div>
              <div>超时订单：{{ stats.overdue }}</div>
              <div>准时率：{{ stats.onTimeRate }}%</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="top-item-box item-box-three" style="display: flex">
            <div style="flex: 2; height: 100%">
              <div>运输方式</div>
              <div style="text-align: center; margin-top: 30px">
                <span style="font-size: 26px; font-weight: bold">{{ stats.transportType }}</span>
              </div>
            </div>
            <div style="flex: 3; display: flex; flex-direction: column; justify-content: space-evenly">
              <div>快递：{{ stats.express }}</div>
              <div>物流：{{ stats.logistics }}</div>
              <div>自提：{{ stats.selfPickup }}</div>
              <div>其他：{{ stats.other }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="top-item-box item-box-four" style="display: flex">
            <div style="flex: 2; height: 100%">
              <div>异常</div>
              <div style="text-align: center; margin-top: 30px">
                <span style="font-size: 26px; font-weight: bold">{{ stats.exception }}</span>
              </div>
            </div>
            <div style="flex: 3; display: flex; flex-direction: column; justify-content: space-evenly">
              <div>今日异常：{{ stats.exceptionToday }}</div>
              <div>昨日异常：{{ stats.exceptionYesterday }}</div>
              <div>破损：{{ stats.damaged }}</div>
              <div>缺货：{{ stats.shortage }}</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 中间表格区 -->
    <div class="station-middle">
      <el-card class="box-card" shadow="never">
        <div class="card-header" v-show="!isFullscreen">
          <div class="card-title">今日出货明细</div>
        </div>
        <div class="scroll-wrapper">
          <div class="scroll-container">
            <Vue3SeamlessScroll :list="shipmentList" :hoverStop="true" :step="stepVal" :limitScrollNum="5" :wheel="true" ref="seamlessScrollRef" :class-option="scrollOption">
              <div class="seamless-item" v-for="(item, index) in shipmentList" :key="index" @click="showDetail(item)">
                <div class="item-row" :class="tableRowClassName({ row: item })">
                  <div class="item-cell order-no">{{ item.orderNo }}</div>
                  <div class="item-cell customer">{{ item.customerName }}</div>
                  <div class="item-cell product-code">{{ item.productCode }}</div>
                  <div class="item-cell product-name">{{ item.productName }}</div>
                  <div class="item-cell specification">{{ item.specification }}</div>
                  <div class="item-cell quantity">{{ item.quantity }}</div>
                  <div class="item-cell unit">{{ item.unit }}</div>
                  <div class="item-cell batch-no">{{ item.batchNo }}</div>
                  <div class="item-cell transport">
                    <el-tag :type="getTransportTagType(item.transportType)" size="small">
                      {{ item.transportType }}
                    </el-tag>
                  </div>
                  <div class="item-cell status">
                    <el-tag :type="getStatusTagType(item.status)" size="small">
                      {{ item.status }}
                    </el-tag>
                  </div>
                  <div class="item-cell plan-time">{{ item.planTime }}</div>
                  <div class="item-cell actual-time">{{ item.actualTime }}</div>
                </div>
              </div>
            </Vue3SeamlessScroll>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 底部图表区 -->
    <div class="station-bottom">
      <el-row :gutter="12">
        <el-col :span="12">
          <el-card class="box-card" shadow="never">
            <div class="card-title" v-show="!isFullscreen">出货趋势</div>
            <div style="height: calc(100% - 30px)">
              <div ref="trendChart" style="height: 100%"></div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="box-card" shadow="never">
            <div class="card-title" v-show="!isFullscreen">出货客户</div>
            <div style="height: calc(100% - 30px)">
              <div ref="customerChart" style="height: 100%"></div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 出货详情对话框 -->
    <el-dialog v-model="detailVisible" title="出货详情" width="60%">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单号">{{ currentShipment.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ currentShipment.customerName }}</el-descriptions-item>
        <el-descriptions-item label="产品编码">{{ currentShipment.productCode }}</el-descriptions-item>
        <el-descriptions-item label="产品名称">{{ currentShipment.productName }}</el-descriptions-item>
        <el-descriptions-item label="规格型号">{{ currentShipment.specification }}</el-descriptions-item>
        <el-descriptions-item label="批次号">{{ currentShipment.batchNo }}</el-descriptions-item>
        <el-descriptions-item label="出货数量">{{ currentShipment.quantity }} {{ currentShipment.unit }}</el-descriptions-item>
        <el-descriptions-item label="运输方式">{{ currentShipment.transportType }}</el-descriptions-item>
        <el-descriptions-item label="物流单号">{{ currentShipment.trackingNo || '暂无' }}</el-descriptions-item>
        <el-descriptions-item label="计划时间">{{ currentShipment.planTime }}</el-descriptions-item>
        <el-descriptions-item label="实际时间">{{ currentShipment.actualTime || '未完成' }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ currentShipment.status }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ currentShipment.remark || '无' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="printShipment">打印出货单</el-button>
      </template>
    </el-dialog>

    <!-- 设置对话框 -->
    <el-dialog v-model="settingVisible" title="看板设置" width="500px">
      <el-form :model="settingForm" label-width="120px">
        <el-form-item label="查询日期">
          <el-date-picker v-model="settingForm.queryDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="启用滚动">
          <el-switch v-model="settingForm.enableScroll" />
        </el-form-item>
        <el-form-item label="滚动速度">
          <el-slider v-model="settingForm.scrollSpeed" :min="0.1" :max="2" :step="0.1" show-input :disabled="!settingForm.enableScroll" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="settingVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import { onMounted, ref, nextTick, onUnmounted, reactive, computed } from 'vue';
import moment from 'moment';
import { VideoPlay, VideoPause, ArrowUp, ArrowDown } from '@element-plus/icons-vue';
import { Vue3SeamlessScroll } from 'vue3-seamless-scroll';
import { ElMessage } from 'element-plus';

// 数据定义
const stats = ref({
  today: 86,
  pending: 12,
  yesterday: 78,
  weekAvg: 72,
  monthTotal: 892,
  urgent: 5,
  urgentToday: 3,
  urgentYesterday: 2,
  overdue: 1,
  onTimeRate: 98.5,
  transportType: '快递',
  express: 56,
  logistics: 22,
  selfPickup: 8,
  other: 0,
  exception: 2,
  exceptionToday: 1,
  exceptionYesterday: 0,
  damaged: 1,
  shortage: 1
});

const shipmentList = ref([
  {
    orderNo: 'SO20230815001',
    customerName: '客户A',
    productCode: 'P1001',
    productName: '智能控制器',
    specification: 'V2.0',
    quantity: 120,
    unit: '个',
    batchNo: 'B20230801',
    transportType: '快递',
    status: '已发货',
    planTime: '2023-08-15 09:00',
    actualTime: '2023-08-15 08:45',
    trackingNo: 'SF123456789',
    remark: '易碎品'
  },
  {
    orderNo: 'SO20230815002',
    customerName: '客户B',
    productCode: 'P2005',
    productName: '温度传感器',
    specification: 'T-100',
    quantity: 300,
    unit: '个',
    batchNo: 'B20230802',
    transportType: '物流',
    status: '待发货',
    planTime: '2023-08-15 14:00',
    actualTime: '',
    trackingNo: '',
    remark: ''
  },
  {
    orderNo: 'SO20230815003',
    customerName: '客户C',
    productCode: 'P3002',
    productName: '压力传感器',
    specification: 'P-200',
    quantity: 150,
    unit: '个',
    batchNo: 'B20230803',
    transportType: '快递',
    status: '已发货',
    planTime: '2023-08-15 10:30',
    actualTime: '2023-08-15 10:15',
    trackingNo: 'YT987654321',
    remark: '防潮'
  },
  {
    orderNo: 'SO20230815004',
    customerName: '客户D',
    productCode: 'P1001',
    productName: '智能控制器',
    specification: 'V2.0',
    quantity: 80,
    unit: '个',
    batchNo: 'B20230801',
    transportType: '自提',
    status: '待发货',
    planTime: '2023-08-15 15:00',
    actualTime: '',
    trackingNo: '',
    remark: ''
  },
  {
    orderNo: 'SO20230815005',
    customerName: '客户E',
    productCode: 'P4001',
    productName: '流量计',
    specification: 'F-150',
    quantity: 45,
    unit: '台',
    batchNo: 'B20230804',
    transportType: '物流',
    status: '已发货',
    planTime: '2023-08-15 11:00',
    actualTime: '2023-08-15 10:45',
    trackingNo: 'ZT1234567890',
    remark: '精密仪器'
  },
  {
    orderNo: 'SO20230815006',
    customerName: '客户F',
    productCode: 'P2005',
    productName: '温度传感器',
    specification: 'T-100',
    quantity: 200,
    unit: '个',
    batchNo: 'B20230802',
    transportType: '快递',
    status: '紧急',
    planTime: '2023-08-15 16:00',
    actualTime: '',
    trackingNo: '',
    remark: '加急订单'
  },
  {
    orderNo: 'SO20230815007',
    customerName: '客户G',
    productCode: 'P3002',
    productName: '压力传感器',
    specification: 'P-200',
    quantity: 90,
    unit: '个',
    batchNo: 'B20230803',
    transportType: '快递',
    status: '已发货',
    planTime: '2023-08-15 13:00',
    actualTime: '2023-08-15 12:40',
    trackingNo: 'SF135792468',
    remark: ''
  },
  {
    orderNo: 'SO20230815008',
    customerName: '客户H',
    productCode: 'P4002',
    productName: '液位计',
    specification: 'L-200',
    quantity: 30,
    unit: '台',
    batchNo: 'B20230805',
    transportType: '快递',
    status: '已发货',
    planTime: '2023-08-15 14:30',
    actualTime: '2023-08-15 14:15',
    trackingNo: 'SF987654321',
    remark: ''
  },
  {
    orderNo: 'SO20230815009',
    customerName: '客户I',
    productCode: 'P1001',
    productName: '智能控制器',
    specification: 'V2.0',
    quantity: 60,
    unit: '个',
    batchNo: 'B20230801',
    transportType: '物流',
    status: '待发货',
    planTime: '2023-08-15 17:00',
    actualTime: '',
    trackingNo: '',
    remark: ''
  }
]);

const currentDateTime = ref('');
const detailVisible = ref(false);
const settingVisible = ref(false);
const currentShipment = ref({});
const trendChart = ref();
const customerChart = ref();
const seamlessScrollRef = ref();

const boardRef = ref(null);
const isFullscreen = ref(false);

let trendChartInstance = null;
let customerChartInstance = null;
let timer = null;

const isScrolling = ref(true);
const stepVal = ref(0.5);

// 设置表单
const settingForm = reactive({
  queryDate: moment().format('YYYY-MM-DD'),
  enableScroll: true,
  scrollSpeed: 0.5
});

// 滚动配置
const scrollOption = computed(() => {
  return {
    step: stepVal.value,
    hoverStop: true,
    direction: 1, // 向下滚动
    limitMoveNum: 5,
    switchOffset: 30,
    autoPlay: settingForm.enableScroll,
    navigation: false // 禁用导航按钮，避免遮挡
  };
});

// 表格行样式
const tableRowClassName = ({ row }) => {
  if (row.status === '延迟') return 'warning-row';
  if (row.status === '已取消') return 'danger-row';
  if (row.status === '紧急') return 'urgent-row';
  return '';
};

// 获取运输方式标签类型
const getTransportTagType = (type) => {
  const map = {
    '快递': 'success',
    '物流': '',
    '自提': 'warning',
    '其他': 'info'
  };
  return map[type] || '';
};

// 获取状态标签类型
const getStatusTagType = (status) => {
  const map = {
    '待发货': '',
    '已发货': 'success',
    '已签收': 'success',
    '延迟': 'warning',
    '已取消': 'danger',
    '紧急': 'danger'
  };
  return map[status] || '';
};

// 显示详情
const showDetail = (row) => {
  currentShipment.value = row;
  detailVisible.value = true;
};

// 打印出货单
const printShipment = () => {
  console.log('打印出货单:', currentShipment.value);
  // 实际项目中调用打印API
};

// 初始化图表
const initCharts = () => {
  initTrendChart();
  initCustomerChart();
};

// 初始化趋势图
const initTrendChart = () => {
  trendChartInstance = echarts.init(trendChart.value);
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    dates.push(moment().subtract(i, 'days').format('MM-DD'));
  }

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      textStyle: {
        color: '#fff'
      },
      backgroundColor: 'rgba(30, 30, 30, 0.8)'
    },
    legend: {
      data: ['计划出货', '实际出货', '紧急订单'],
      textStyle: {
        color: '#e0e0e0'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLine: {
        lineStyle: {
          color: '#aaa'
        }
      },
      axisLabel: {
        color: '#ddd'
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
        lineStyle: {
          color: 'rgba(200, 200, 200, 0.1)'
        }
      }
    },
    series: [
      {
        name: '计划出货',
        type: 'line',
        smooth: true,
        data: [65, 72, 78, 82, 89, 86, 92],
        itemStyle: {
          color: '#5c9bff'
        },
        lineStyle: {
          width: 3
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
                color: '#5c9bff60'
              },
              {
                offset: 1,
                color: '#5c9bff00'
              }
            ]
          }
        }
      },
      {
        name: '实际出货',
        type: 'line',
        smooth: true,
        data: [60, 70, 75, 80, 85, 86, 88],
        itemStyle: {
          color: '#6bc9ff'
        },
        lineStyle: {
          width: 3
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
                color: '#6bc9ff60'
              },
              {
                offset: 1,
                color: '#6bc9ff00'
              }
            ]
          }
        }
      },
      {
        name: '紧急订单',
        type: 'bar',
        barWidth: '30%',
        data: [2, 1, 3, 2, 4, 3, 5],
        itemStyle: {
          color: '#ff6b6b'
        }
      }
    ]
  };
  trendChartInstance.setOption(option);
};

// 初始化客户出货图
const initCustomerChart = () => {
  customerChartInstance = echarts.init(customerChart.value);
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
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: {
        color: '#e0e0e0'
      }
    },
    series: [
      {
        name: '客户出货',
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
          position: 'center'
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
          { value: 35, name: '客户A' },
          { value: 25, name: '客户B' },
          { value: 18, name: '客户C' },
          { value: 12, name: '客户D' },
          { value: 10, name: '其他' }
        ]
      }
    ]
  };
  customerChartInstance.setOption(option);
};

// 更新时间
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

// 窗口大小变化时重绘图表
const resizeCharts = () => {
  trendChartInstance?.resize();
  customerChartInstance?.resize();
};

// 切换滚动状态
const toggleScroll = () => {
  isScrolling.value = !isScrolling.value;
  if (seamlessScrollRef.value) {
    if (isScrolling.value) {
      seamlessScrollRef.value.continue();
    } else {
      seamlessScrollRef.value.stop();
    }
  }
};

// 向上滚动
const scrollUp = () => {
  if (seamlessScrollRef.value) {
    seamlessScrollRef.value.scrollUp();
  }
};

// 向下滚动
const scrollDown = () => {
  if (seamlessScrollRef.value) {
    seamlessScrollRef.value.scrollDown();
  }
};

// 显示设置对话框
const showSettingDialog = () => {
  settingVisible.value = true;
};

// 保存设置
const saveSettings = () => {
  // 应用滚动设置
  isScrolling.value = settingForm.enableScroll;
  stepVal.value = settingForm.scrollSpeed;

  // 控制滚动状态
  if (seamlessScrollRef.value) {
    if (settingForm.enableScroll) {
      seamlessScrollRef.value.continue();
    } else {
      seamlessScrollRef.value.stop();
    }
  }

  settingVisible.value = false;

  // 这里可以添加根据查询日期加载数据的逻辑
  console.log('查询日期:', settingForm.queryDate);
};

// 全屏切换
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

// 监听全屏变化事件
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
};

onMounted(() => {
  updateDateTime();
  timer = setInterval(updateDateTime, 1000);

  nextTick(() => {
    initCharts();
    window.addEventListener('resize', resizeCharts);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
  });
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  window.removeEventListener('resize', resizeCharts);
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  trendChartInstance?.dispose();
  customerChartInstance?.dispose();
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

.app-container.fullscreen {
  padding: 0;
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
  display: flex;
  flex-direction: column;
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 50px;
  padding: 10px 15px;
  margin-bottom: 0;
  position: relative;
  z-index: 10; /* 确保标题在滚动内容之上 */
  background: rgba(30, 30, 40, 0.7);
  border-bottom: 1px solid rgba(100, 100, 200, 0.3);
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

.table-controls {
  display: flex;
  gap: 8px;
}

.table-controls :deep(.el-button) {
  background: rgba(100, 100, 200, 0.3);
  border-color: rgba(100, 100, 200, 0.5);
  color: #fff;
}

.table-controls :deep(.el-button:hover) {
  background: rgba(100, 100, 200, 0.5);
  border-color: rgba(100, 100, 200, 0.8);
}

.table-controls :deep(.el-button.is-disabled) {
  background: rgba(100, 100, 200, 0.1);
  border-color: rgba(100, 100, 200, 0.2);
  color: #999;
}

.mt5 {
  margin-top: 5px;
}

.station-top,
.station-middle,
.station-bottom {
  padding: 12px;
}

.app-container.fullscreen .station-top,
.app-container.fullscreen .station-middle,
.app-container.fullscreen .station-bottom {
  padding: 5px;
}

/* 表格特殊行样式 */
.warning-row {
  background-color: rgba(255, 153, 0, 0.1) !important;
}

.danger-row {
  background-color: rgba(255, 77, 79, 0.1) !important;
}

.urgent-row {
  background-color: rgba(255, 0, 0, 0.1) !important;
  animation: blink 1.5s infinite;
}

@keyframes blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

/* 无缝滚动样式 */
.scroll-wrapper {
  position: relative;
  flex: 1;
  overflow: hidden;
  padding: 0 10px 10px 10px;
}

.app-container.fullscreen .scroll-wrapper {
  padding: 0 5px 5px 5px;
}

.scroll-container {
  height: 100%;
  overflow: hidden;
}

.seamless-item {
  height: 60px;
  cursor: pointer;
}

.item-row {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 10px;
  border-bottom: 1px solid rgba(100, 100, 200, 0.2);
  margin: 0 5px;
}

.item-row:hover {
  background-color: rgba(100, 100, 200, 0.1);
}

.item-cell {
  padding: 0 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #fff;
}

.order-no {
  width: 180px;
}

.customer {
  width: 120px;
}

.product-code {
  width: 120px;
}

.product-name {
  width: 180px;
}

.specification {
  width: 120px;
}

.quantity {
  width: 80px;
  text-align: center;
}

.unit {
  width: 60px;
  text-align: center;
}

.batch-no {
  width: 120px;
}

.transport {
  width: 100px;
}

.status {
  width: 100px;
}

.plan-time {
  width: 160px;
}

.actual-time {
  width: 160px;
}

/* 底部图表区 */
.station-bottom {
  flex: 1;
}
</style>
