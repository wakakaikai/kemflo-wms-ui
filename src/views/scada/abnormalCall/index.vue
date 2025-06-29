<template>
  <div ref="boardRef" class="exception-dashboard">
    <!-- 顶部标题 -->
    <div class="dashboard-header">
      <div class="header-left">
        <img src="@/assets/logo/kemflo-logo.jpg" alt="Logo" class="logo" @click="toggleFullscreen" />
      </div>
      <div class="header-center" @click="showSettings = true">
        <!--        <h2>异常呼叫看板（ {{ currentDateTime }}）</h2>-->
        <h2>异常呼叫看板（{{ userSettingsForm.startTime }}~{{ userSettingsForm.endTime ? userSettingsForm.endTime : currentDateTime }}）</h2>
      </div>
      <div class="header-right" @click="showSettings = true">
        <!--        <el-button type="primary" circle >
          <el-icon><Setting /></el-icon>
        </el-button>-->
        <!--        <h2>{{ userSettingsForm.startTime }}~{{ userSettingsForm.endTime ? userSettingsForm.endTime : currentDateTime }}</h2>-->
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
      <template v-if="chunkedProductionLines.length > 0">
        <el-carousel :autoplay="shouldAutoPlay" :height="carouselItemHeight" indicator-position="outside" :interval="carouselInterval" arrow="always" class="responsive-carousel">
          <!--      <el-carousel :autoplay="false" :height="carouselItemHeight" indicator-position="outside" :interval="5000" arrow="always" class="responsive-carousel">-->
          <el-carousel-item v-for="(chunk, index) in chunkedProductionLines" :key="index" class="carousel-item">
            <div v-for="line in chunk.lines" :key="line" class="line-group">
              <!-- 每个工序组作为一个独立行 -->
              <div v-for="(group, groupIndex) in line.processGroups" :key="groupIndex" class="line-row" :style="{ '--process-count': userSettingsForm.showOperationPerRow }">
                <!-- 第一行显示 line.name -->
                <div v-if="group.rowIndex === 0" class="line-name">{{ line.line }}</div>
                <!-- 其他行插入空 div 占位 -->
                <div v-else class="line-name-placeholder"></div>

                <!-- 渲染该组的工序单元格 -->
                <div v-for="processKey in group.items" :key="processKey" class="station-cell" :class="{ abnormal: isAbnormal(processKey), empty: !processKey }">
                  <div class="cell-content">
                    {{ processKey || '' }}
                  </div>
                </div>
              </div>
            </div>
          </el-carousel-item>
        </el-carousel>
      </template>
      <!-- 无数据时显示空状态 -->
      <div v-else class="empty-state">
        <div class="empty-content">
          <el-icon class="empty-icon"><Warning /></el-icon>
          <h3 class="empty-title">当前无异常呼叫数据</h3>
          <p class="empty-subtitle">请检查以下可能原因：</p>
          <ul class="empty-tips">
            <li>时间范围设置是否正确</li>
            <li>是否所有异常都已处理</li>
            <li>系统数据是否正常同步</li>
          </ul>
          <el-button type="primary" @click="showSettings = true" class="empty-action">
            <el-icon><Setting /></el-icon>
            <span>检查显示设置</span>
          </el-button>
        </div>
      </div>
    </div>

    <el-dialog v-model="showSettings" title="显示设置" width="40%">
      <div class="settings-content">
        <el-form ref="queryFormRef" :model="userSettingsForm" :inline="true" label-width="auto">
          <el-row :gutter="20">
            <el-col :sm="24" :md="24" :lg="24">
              <el-form-item label="展示行数" prop="showOperationLine">
                <el-input-number v-model="userSettingsForm.showOperationLine" :min="1" :max="100" :step="1">
                  <template #suffix>
                    <span>行</span>
                  </template>
                </el-input-number>
              </el-form-item>
            </el-col>
            <el-col :sm="24" :md="24" :lg="24">
              <el-form-item label="展示列数" prop="showOperationPerRow">
                <el-input-number v-model="userSettingsForm.showOperationPerRow" :min="1" :max="100" :step="1">
                  <template #suffix>
                    <span>列</span>
                  </template>
                </el-input-number>
                <div class="form-tip">注意：不包括首列的线体名称</div>
              </el-form-item>
            </el-col>
            <el-col :sm="24" :md="24" :lg="24">
              <el-form-item label="开始时间" prop="startTime">
                <el-date-picker
                  v-model="userSettingsForm.startTime"
                  type="datetime"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  placeholder="请选择开始时间"
                  clearable
                  :disabled-date="disabledFutureDate"
                  :shortcuts="dateShortcuts"
                />
              </el-form-item>
            </el-col>
            <el-col :sm="24" :md="24" :lg="24">
              <el-form-item label="结束时间" prop="endTime">
                <el-date-picker
                  v-model="userSettingsForm.endTime"
                  type="datetime"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  placeholder="请选择结束时间"
                  clearable
                  :disabled-date="disabledFutureDate"
                  :shortcuts="dateShortcuts"
                />
                <div class="form-tip">如果不填写，则默认为系统当前时间。如果填写，则展示该时间段内的数据。</div>
              </el-form-item>
            </el-col>

            <el-col :sm="24" :md="24" :lg="24">
              <el-form-item label="自动轮播" prop="autoPlayCarousel">
                <el-radio-group v-model="userSettingsForm.autoPlayCarousel">
                  <el-radio value="1" border>是</el-radio>
                  <el-radio value="0" border>否</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :sm="24" :md="24" :lg="24">
              <el-form-item label="轮播间隔" prop="autoPlayInterval">
                <el-input-number v-model="userSettingsForm.autoPlayInterval" :min="1" :max="100" :step="1">
                  <template #suffix>
                    <span>秒</span>
                  </template>
                </el-input-number>
              </el-form-item>
            </el-col>
            <el-col :sm="24" :md="24" :lg="24">
              <el-form-item label="数据刷新" prop="freshScadaData">
                <el-input-number v-model="userSettingsForm.freshScadaData" :min="1" :step="1">
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

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { queryAbnormalCallScada } from '@/api/mes/message';
import { parseTime } from '@/utils/ruoyi';
import { CaretRight } from '@element-plus/icons-vue';
import { useRequest } from 'vue-request';
interface SummaryItem {
  total: number;
  avgTime: number;
  closeRate: number;
}

interface ProductionLine {
  line: string;
  processes: Record<string, string>;
}
interface UserSettingsForm {
  showOperationLine: number;
  showOperationPerRow: number;
  startTime: any;
  endTime: any;
  autoPlayCarousel: string | number;
  autoPlayInterval: number;
  freshScadaData: number;
}
const boardRef = ref<HTMLElement | null>(null);
const isFullscreen = ref(false);
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
// 工序顺序定义
const disabledFutureDate = (time: Date) => {
  // 获取当前时间，并将毫秒设为0以确保精确到秒
  const now = new Date();
  // 加上指定秒数（默认3秒）
  now.setSeconds(now.getSeconds() + 3);
  now.setMilliseconds(0);

  // 禁止选择当前时间之后的日期
  return time.getTime() > now.getTime();
};

const titles = {
  material: '物料呼叫',
  equipment: '设备呼叫',
  quality: '品质呼叫',
  other: '其他呼叫'
};

const summary = ref<Record<string, SummaryItem>>({
  // material: { total: 4, avgTime: 2.2, closeRate: 100 },
  // equipment: { total: 3, avgTime: 0.8, closeRate: 100 },
  // quality: { total: 8, avgTime: 0.9, closeRate: 50 },
  // other: { total: 3, avgTime: 0.8, closeRate: 100 }
});

const productionLines = ref<ProductionLine[]>([
  // {
  //   line: 'SA0081-1',
  //   processes: {
  //     'ZZPCB': '组装PCB',
  //     'ZZMD': '组装马达',
  //     'ZZSLB': '组装水路板',
  //     'ZZLD': '组装冷胆',
  //     'WGT-BF': '功能测试前称重',
  //     'TEST-FUNC': '功能测试\n品质呼叫3个异常',
  //     'WGT-AF': '功能测试后称重',
  //     'TEST-SAFETY': '安规测试',
  //     'TRSF-PROD': '转码',
  //     'WGT-PACK': '包装称重',
  //     'REPAIR': '维修'
  //   }
  // }
]);
const transformResponseToProductionLines = (data: any): ProductionLine[] => {
  if (!data?.workCenterAbnormalCallVoList) return [];

  return data.workCenterAbnormalCallVoList.map((workCenter: any) => {
    const processes: Record<string, string> = {};

    workCenter.resourceTypeVoList?.forEach((resource: any) => {
      if (resource.messageSummaryTitle) {
        processes[resource.resourceType] = `${resource.description}\n${resource.messageSummaryTitle}`;
      } else if (resource.description) {
        processes[resource.resourceType] = resource.description;
      }
    });

    return {
      line: workCenter.workCenter,
      processes
    };
  });
};
const loadAbnormalCallScadaData = async () => {
  const res = await queryAbnormalCallScada({
    startTime: userSettingsForm.value.startTime
  });
  // 更新统计卡片数据
  summary.value.material = {
    total: res?.data.itemCallCount,
    avgTime: res.data.itemCallAvgResponseTime || 0,
    closeRate: res.data.itemCallExceptionCloseRate || 100
  };
  summary.value.equipment = {
    total: res?.data.equipmentCallCount,
    avgTime: res.data.equipmentCallAvgResponseTime || 0,
    closeRate: res.data.equipmentCallExceptionCloseRate || 100
  };
  summary.value.quality = {
    total: res?.data.qualityCallCount,
    avgTime: res.data.qualityCallAvgResponseTime || 0,
    closeRate: res.data.qualityCallExceptionCloseRate || 100
  };
  summary.value.other = {
    total: res?.data.otherCallCount,
    avgTime: res.data.otherCallAvgResponseTime || 0,
    closeRate: res.data.otherCallExceptionCloseRate || 100
  };
  // 转换并更新生产线数据
  productionLines.value = transformResponseToProductionLines(res.data);
};
// 控制弹框显示
const showSettings = ref(false);
const totalPages = ref(0);
// 保存设置
const saveSettings = () => {
  showSettings.value = false;
  localStorage.setItem('abnormalCallScada', JSON.stringify(userSettingsForm.value));
  cancel();
  setTimeout(() => {
    run();
  }, 1000);
};

const { run, cancel } = useRequest(loadAbnormalCallScadaData, {
  manual: true,
  pollingInterval: computed(() => userSettingsForm.value.freshScadaData * 1000),
  onSuccess: async (data, params) => {}
});

const dateShortcuts = [
  {
    text: '今天早上8点',
    value: () => {
      const date = new Date();
      date.setHours(8, 0, 0, 0);
      return date;
    }
  },
  {
    text: '今天晚上20点',
    value: () => {
      const now = new Date();
      const target = new Date();
      target.setHours(20, 0, 0, 0);
      // 如果目标时间还没到，则返回当前时间
      return target > now ? now : target;
    }
  },
  {
    text: '昨天早上8点',
    value: () => {
      const date = new Date();
      date.setDate(date.getDate() - 1);
      date.setHours(8, 0, 0, 0);
      return date;
    }
  },
  {
    text: '昨天晚上20点',
    value: () => {
      const date = new Date();
      date.setDate(date.getDate() - 1);
      date.setHours(20, 0, 0, 0);
      return date;
    }
  },
  {
    text: '1小时前',
    value: () => {
      const date = new Date();
      date.setHours(date.getHours() - 1, 0, 0, 0);
      return date;
    }
  },
  {
    text: '当前时间',
    value: () => new Date()
  }
];

// 判断是否是异常状态
const isAbnormal = (value?: string): boolean => {
  return value?.includes('异常') ?? false;
};

const groupProcesses = (processes) => {
  const processKeys = Object.values(processes);
  const groups = [];

  // 每行最多8个工序
  for (let i = 0; i < processKeys.length; i += userSettingsForm.value.showOperationPerRow) {
    groups.push({
      items: processKeys.slice(i, i + userSettingsForm.value.showOperationPerRow),
      rowIndex: Math.floor(i / userSettingsForm.value.showOperationPerRow)
    });
  }

  return groups;
};

const chunkedProductionLines = computed(() => {
  // 1. 首先检查是否有数据
  if (productionLines.value.length === 0) return [];

  const linesPerPage = userSettingsForm.value.showOperationLine;
  const allLines = [];

  // 2. 计算所有产线的总行数并分组
  let totalRows = 0;
  const groupedLines = productionLines.value
    .map((line) => {
      const processGroups = groupProcesses(line.processes);
      const lineRows = processGroups.length;
      totalRows += lineRows;

      return {
        ...line,
        processGroups,
        lineRows
      };
    })
    // 过滤掉没有工序的分组
    .filter((line) => line.processGroups.length > 0);

  // 3. 按页数分块
  const chunks = [];
  let currentChunk = [];
  let currentChunkRows = 0;
  let currentPage = 1;

  for (const line of groupedLines) {
    // 如果添加当前产线会超出当前页限制
    if (currentChunkRows + line.lineRows > linesPerPage) {
      // 只有当currentChunk有数据时才添加
      if (currentChunk.length > 0) {
        chunks.push({
          page: currentPage,
          lines: [...currentChunk],
          totalRows: currentChunkRows
        });
      }

      // 开始新页
      currentPage++;
      currentChunk = [line];
      currentChunkRows = line.lineRows;
    } else {
      currentChunk.push(line);
      currentChunkRows += line.lineRows;
    }
  }

  // 添加最后一页（同样确保有数据）
  if (currentChunk.length > 0) {
    chunks.push({
      page: currentPage,
      lines: [...currentChunk],
      totalRows: currentChunkRows
    });
  }

  // 更新总页数（用于轮播控制）
  totalPages.value = chunks.length;

  return chunks;
});

const shouldAutoPlay = computed(() => {
  return userSettingsForm.value.autoPlayCarousel == '1' && chunkedProductionLines.value.length > 0;
});

const carouselInterval = computed(() => {
  return userSettingsForm.value.autoPlayInterval * 1000;
});

const carouselItemHeight = computed(() => {
  const rowHeight = 100; // 每行高度
  const headerHeight = 60; // 表头高度
  const padding = 20; // 边距

  // 找出所有页中行数最多的页
  const maxRows = Math.max(...chunkedProductionLines.value.map((page) => page.totalRows), 0);
  return `${headerHeight + maxRows * rowHeight + padding}px`;
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

onMounted(async () => {
  // 初始化时间并设置定时器
  updateDateTime();
  const timer = setInterval(updateDateTime, 1000);

  const userSettingsFormObj = localStorage.getItem('abnormalCallScada');
  if (userSettingsFormObj) {
    userSettingsForm.value = JSON.parse(userSettingsFormObj);
  }

  if (!userSettingsForm.value.startTime) {
    const date = new Date();
    date.setHours(8, 0, 0, 0);
    userSettingsForm.value.startTime = parseTime(date, '{y}-{m}-{d} {h}:{i}:{s}');
  }

  await run();

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
  /*  overflow: hidden;*/
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
}

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
  padding: 0 16px;
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

.header-right h2 {
  font-size: 24px;
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
  margin-bottom: 15px;
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

/*.line-row {
  display: grid;
  grid-template-columns: 110px repeat(10, 1fr);
  !*  margin-bottom: 10px;*!
  animation: fadeIn 0.5s ease;
}*/

/* 默认模式下的线体列宽度 */
.line-header,
.line-name {
  width: 150px; /* 默认宽度 */
  min-width: 150px;
}
.line-name-placeholder {
  width: 150px; /* 默认宽度 */
  min-width: 150px;
}

/* 全屏模式下的线体列宽度 */
.exception-dashboard:fullscreen .line-header,
.exception-dashboard:fullscreen .line-name {
  width: 200px; /* 全屏时加宽 */
  min-width: 200px;
}
.exception-dashboard:fullscreen .line-name-placeholder {
  width: 200px; /* 全屏时加宽 */
  min-width: 200px;
}
/* 修改线体列宽度相关样式开始 */
/* 调整网格布局 */
.production-header,
.line-row {
  display: grid;
  grid-template-columns:
    [line] minmax(150px, auto)
    [processes] repeat(var(--process-count), 1fr);
  gap: 5px;
}

.exception-dashboard:fullscreen .production-header,
.exception-dashboard:fullscreen .line-row {
  display: grid;
  grid-template-columns:
    [line] minmax(150px, auto) /* 固定宽度的线体列 */
    [processes] repeat(auto-fill, minmax(260px, 1fr)); /* 自动等分工序列 */
  gap: 5px; /* 单元格间距 */
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
  margin: 5px 5px;
  border-radius: 8px;
  background: linear-gradient(45deg, #1e3a8a, #3b82f6);
  font-weight: bold;
  font-size: 22px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.line-name-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  margin: 5px 5px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 22px;
}

.station-cell {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 10px;
  margin: 5px 5px;
  min-height: 100px;
  border-radius: 8px;
  color: #ffffff;
  background: rgba(22, 16, 118, 0.8);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  font-size: 25px;
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
  padding: 10px;
}

.exception-dashboard:fullscreen .dashboard-header {
  height: 80px;
}

.exception-dashboard:fullscreen .logo {
  height: 50px;
}

.exception-dashboard:fullscreen .call-cards {
  margin-bottom: 10px;
}

.exception-dashboard:fullscreen .station-cell {
  min-height: 100px;
  font-size: 20px;
}

.exception-dashboard:fullscreen .line-name,
.exception-dashboard:fullscreen .header-cell {
  font-size: 20px;
}

.settings-content {
  padding: 10px 20px;
}

.setting-item span {
  display: inline-block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.form-tip {
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
  margin-top: 4px;
  padding-left: 2px;
  animation: fadeIn 0.3s ease;
}

/* 空状态样式 */
.empty-state {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(10, 15, 40, 0.6);
  border-radius: 12px;
  border: 1px dashed rgba(100, 100, 255, 0.3);
  padding: 20px;
  height: 100%;
}

.empty-content {
  text-align: center;
  max-width: 500px;
  padding: 30px;
  background: rgba(16, 13, 68, 0.5);
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
}

.empty-icon {
  font-size: 60px;
  color: #e6a23c;
  margin-bottom: 20px;
}

.empty-title {
  color: #e6a23c;
  font-size: 24px;
  margin-bottom: 15px;
}

.empty-subtitle {
  color: #a0a0ff;
  font-size: 16px;
  margin-bottom: 15px;
}

.empty-tips {
  text-align: left;
  color: #a0a0ff;
  padding-left: 20px;
  margin-bottom: 25px;

  li {
    margin-bottom: 8px;
    position: relative;

    &::before {
      content: '•';
      position: absolute;
      left: -15px;
      color: #409eff;
    }
  }
}

.empty-action {
  margin-top: 15px;
  padding: 12px 24px;

  .el-icon {
    margin-right: 8px;
  }
}
</style>
