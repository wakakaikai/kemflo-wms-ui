<template>
  <div ref="boardRef" class="exception-dashboard">
    <!-- 顶部标题 -->
    <div class="dashboard-header">
      <div class="header-left">
        <img src="@/assets/logo/kemflo-logo.jpg" alt="Logo" class="logo" @click="toggleFullscreen" />
      </div>
      <div class="header-center">
        <h2>异常呼叫看板（{{ currentDateTime }}）</h2>
      </div>
      <div class="header-right">
        <!--        <el-button :icon="isFullscreen ? 'el-icon-close' : 'el-icon-full-screen'" circle  />-->
      </div>
    </div>

    <!-- 呼叫统计卡片区域 -->
    <div class="call-cards">
      <el-card v-for="(value, key) in summary" :key="key" shadow="hover" class="call-card">
        <template #header>
          <div class="card-header">
            <div class="call-title">{{ titles[key] }}</div>
            <div class="call-count">合计：{{ value.total }}</div>
          </div>
        </template>
        <div class="stats-row">
          <div class="stat-box">
            <div class="stat-label">平均响应时间(分)</div>
            <div class="stat-value">{{ value.avgTime }}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">异常关闭率</div>
            <div
              class="stat-value"
              :class="{
                success: value.closeRate >= 80,
                danger: value.closeRate < 80
              }"
            >
              {{ value.closeRate }}%
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 产线展示区 -->
    <div class="production-list">
      <!-- 表头 -->
      <div class="production-header">
        <div class="header-cell">线体/工序</div>
        <div v-for="processKey in processOrder" :key="processKey" class="header-cell">
          {{ processNameMap[processKey] }}
        </div>
      </div>

      <!-- 生产线数据 -->
      <div v-for="line in productionLines" :key="line.line" class="line-row">
        <!-- 线体名称 -->
        <div class="line-name">{{ line.line }}</div>

        <!-- 工序状态 -->
        <div
          v-for="processKey in processOrder"
          :key="processKey"
          class="station-cell"
          :class="{
            abnormal: isAbnormal(line.processes[processKey]),
            empty: !line.processes[processKey]
          }"
        >
          {{ line.processes[processKey] || '' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';

interface SummaryItem {
  total: number;
  avgTime: number;
  closeRate: number;
}

interface ProductionLine {
  line: string;
  processes: Record<string, string>;
}

const boardRef = ref<HTMLElement | null>(null);
const isFullscreen = ref(false);
const currentDateTime = ref('');

// 工序顺序定义
const processOrder = ['ZZPCB', 'ZZLD', 'TEST-FUNC', 'TEST-SAFETY', 'WGT-PACK', 'REPAIR'] as const;

// 工序名称映射
const processNameMap = {
  'ZZPCB': '组装PCB',
  'ZZMD': '组装马达',
  'ZZSLB': '组装水路板',
  'ZZLD': '组装冷胆',
  'WGT-BF': '功能测试前称重',
  'TEST-FUNC': '功能测试',
  'WGT-AF': '功能测试后称重',
  'TEST-SAFETY': '安规测试',
  'TRSF-PROD': '转码',
  'WGT-PACK': '包装称重',
  'REPAIR': '维修'
};

const titles = {
  material: '物料呼叫',
  equipment: '设备呼叫',
  quality: '品质呼叫',
  other: '其他呼叫'
};

const summary = ref<Record<string, SummaryItem>>({
  material: { total: 4, avgTime: 2.2, closeRate: 100 },
  equipment: { total: 3, avgTime: 0.8, closeRate: 100 },
  quality: { total: 8, avgTime: 0.9, closeRate: 50 },
  other: { total: 3, avgTime: 0.8, closeRate: 100 }
});

const productionLines = ref<ProductionLine[]>([
  {
    line: 'SA0081-1',
    processes: {
      'ZZPCB': '组装PCB',
      'ZZLD': '组装冷胆',
      'TEST-FUNC': '功能测试',
      'TEST-SAFETY': '安规测试',
      'WGT-PACK': '包装',
      'REPAIR': '维修'
    }
  },
  {
    line: 'SA0082-1',
    processes: {
      ZZPCB: '组装PCB\n品质呼叫3个异常',
      ZZMD: '组装马达',
      'REPAIR': '维修'
    }
  },
  {
    line: 'SA0029-1',
    processes: {
      'ZZPCB': '组装PCB',
      'REPAIR': '维修\n品质异常'
    }
  }
]);

// 判断是否是异常状态
const isAbnormal = (value?: string): boolean => {
  return value?.includes('异常') ?? false;
};

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

onMounted(() => {
  // 初始化时间并设置定时器
  updateDateTime();
  const timer = setInterval(updateDateTime, 1000);

  document.addEventListener('fullscreenchange', handleFullscreenChange);

  // 组件卸载时清除定时器
  onUnmounted(() => {
    clearInterval(timer);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
  });
});
</script>

<style scoped>
.exception-dashboard {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  padding: 16px;
  overflow: hidden;
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
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(100, 100, 255, 0.2);
}

.header-left,
.header-center,
.header-right {
  flex: 1;
  display: flex;
  align-items: center;
}

.header-center {
  justify-content: center;
}

.header-right {
  justify-content: flex-end;
}

.logo {
  height: 45px;
  filter: drop-shadow(0 0 5px rgba(100, 150, 255, 0.8));
}

.dashboard-header h2 {
  font-size: 28px;
  font-weight: bold;
  background: linear-gradient(to right, #4facfe, #00f2fe);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 10px rgba(0, 100, 255, 0.3);
  letter-spacing: 1px;
}

/* 呼叫卡片区域样式 */
.call-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 18px;
  margin-bottom: 25px;
}

.call-card {
  background: linear-gradient(145deg, rgba(16, 13, 68, 0.9), rgba(10, 37, 64, 0.9)) !important;
  border-radius: 12px !important;
  overflow: hidden;
  border: 1px solid rgba(100, 100, 255, 0.3) !important;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4) !important;
  transition: all 0.4s ease;
}

.call-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 30px rgba(0, 100, 255, 0.5) !important;
}

.call-card ::v-deep(.el-card__header) {
  background: linear-gradient(90deg, #1306bf, #1e40af) !important;
  padding: 15px 20px !important;
  border-bottom: 1px solid rgba(100, 100, 255, 0.5) !important;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.call-title {
  font-size: 22px;
  font-weight: bold;
  letter-spacing: 1px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  color: #fff;
  //text-shadow: 0 2px 4px rgb(62, 113, 172);
}

.call-count {
  font-size: 22px;
  font-weight: bold;
  background: linear-gradient(to right, #ffd166, #ff9e6d);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stats-row {
  display: flex;
  justify-content: space-between;
  padding: 15px 10px;
}

.stat-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background: rgba(20, 25, 80, 0.5);
  border-radius: 8px;
  margin: 0 5px;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
}

.stat-label {
  font-size: 18px;
  margin-bottom: 8px;
  color: #a0a0ff;
}

.stat-value {
  font-size: 26px;
  font-weight: bold;
  color: #ffffff;
}

.success {
  color: #4ade80;
  text-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
}

.danger {
  color: #f87171;
  text-shadow: 0 0 10px rgba(248, 113, 113, 0.5);
}

/* 生产线区域样式 */
.production-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: rgba(10, 15, 40, 0.6);
  border-radius: 12px;
  padding: 15px;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(100, 100, 255, 0.2);
}

.production-header {
  display: grid;
  grid-template-columns: 120px repeat(6, 1fr);
  margin-bottom: 10px;
  font-weight: bold;
}

.header-cell {
  padding: 10px;
  text-align: center;
  background: rgba(20, 25, 80, 0.7);
  margin: 0 5px;
  border-radius: 8px;
  font-size: 18px;
  color: #4facfe;
  text-shadow: 0 0 8px rgba(79, 172, 254, 0.5);
}

.line-row {
  display: grid;
  grid-template-columns: 120px repeat(6, 1fr);
  margin-bottom: 10px;
  animation: fadeIn 0.5s ease;
}

/* 默认模式下的线体列宽度 */
.line-header,
.line-name {
  width: 150px; /* 默认宽度 */
  min-width: 150px;
}

/* 全屏模式下的线体列宽度 */
.exception-dashboard:fullscreen .line-header,
.exception-dashboard:fullscreen .line-name {
  width: 200px; /* 全屏时加宽 */
  min-width: 200px;
}
/* 修改线体列宽度相关样式开始 */
/* 调整网格布局 */
.production-header,
.line-row {
  display: grid;
  grid-template-columns:
    [line] minmax(150px, auto) /* 线体列 */
    [input] 1fr
    [electric] 1fr
    [water] 1fr
    [final] 1fr
    [pack] 1fr
    [fqc] 1fr;
}

.exception-dashboard:fullscreen .production-header,
.exception-dashboard:fullscreen .line-row {
  grid-template-columns:
    [line] minmax(200px, auto) /* 全屏时线体列更宽 */
    [input] 1fr
    [electric] 1fr
    [water] 1fr
    [final] 1fr
    [pack] 1fr
    [fqc] 1fr;
}
/* 修改线体列宽度相关样式结束 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.line-name {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  margin: 0 5px;
  border-radius: 8px;
  background: linear-gradient(45deg, #1e3a8a, #3b82f6);
  font-weight: bold;
  font-size: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.station-cell {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 10px;
  margin: 0 5px;
  min-height: 80px;
  border-radius: 8px;
  color: #ffffff;
  background: rgba(22, 16, 118, 0.8);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  font-size: 18px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(100, 100, 255, 0.3);
  white-space: pre-line;
}

.station-cell::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, rgba(100, 200, 255, 0.7), transparent);
}

.station-cell:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 100, 255, 0.4);
}

.station-cell.empty {
  opacity: 0.6;
}

.abnormal {
  background: linear-gradient(45deg, #b91c1c, #ef4444) !important;
  animation: pulse 2s infinite;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
  font-weight: bold;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
  }
  50% {
    box-shadow: 0 0 30px rgba(239, 68, 68, 0.8);
  }
  100% {
    box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
  }
}

.abnormal::after {
  content: '!';
  position: absolute;
  top: 5px;
  right: 8px;
  width: 22px;
  height: 22px;
  background: #fff;
  color: #ef4444;
  border-radius: 50%;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

/* 全屏模式优化 */
.exception-dashboard:fullscreen {
  padding: 20px;
}

.exception-dashboard:fullscreen .dashboard-header {
  height: 80px;
}

.exception-dashboard:fullscreen .logo {
  height: 50px;
}

.exception-dashboard:fullscreen .call-cards {
  margin-bottom: 30px;
}

.exception-dashboard:fullscreen .station-cell {
  min-height: 100px;
  font-size: 22px;
}

.exception-dashboard:fullscreen .line-name,
.exception-dashboard:fullscreen .header-cell {
  font-size: 22px;
}
</style>
