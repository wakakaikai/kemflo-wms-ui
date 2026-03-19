<template>
  <div ref="boardRef" class="app-container home" :class="{ 'fullscreen': isFullscreen }">
    <!-- 顶部标题栏 -->
    <div class="dashboard-header" @click="showSettings = true">
      <div class="header-left">
        <img src="@/assets/logo/kemflo-logo.jpg" alt="Logo" class="logo" @click.stop="toggleFullscreen" />
      </div>
      <div class="header-center">
        <h2>入库待拣看板</h2>
        <!--        <el-tag type="info" class="header-tag">暂存区</el-tag>-->
      </div>
      <div class="header-right">
        <div class="current-time">{{ currentDateTime }}</div>
      </div>
    </div>

    <!-- 统计卡片区域 - 增加已预约统计 -->
    <div class="station-top">
      <div class="cards-container">
        <div class="card-wrapper">
          <div class="top-item-box item-box-one">
            <div class="card-content">
              <div class="card-title-large">水处理</div>
              <div class="card-main">
                <div class="card-value-wrapper">
                  <div class="card-value">{{ stats.sclAvailableReservedQty }}</div>
                </div>
                <div class="card-details">
                  <div class="detail-row">
                    <div class="detail-item">
                      <span class="detail-label">总移转:</span>
                      <span class="detail-value">{{ stats.sclTotalTransferQty }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">部门移转:</span>
                      <span class="detail-value">{{ stats.sclDeptTransferQty }}</span>
                    </div>
                  </div>
                  <div class="detail-row">
                    <div class="detail-item">
                      <span class="detail-label">仓库移转:</span>
                      <span class="detail-value">{{ stats.sclWarehouseTransferQty }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">已预约:</span>
                      <span class="detail-value">{{ stats.sclReservedQty }}</span>
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
              <div class="card-title-large">饮水机</div>
              <div class="card-main">
                <div class="card-value-wrapper">
                  <div class="card-value">{{ stats.ysjAvailableReservedQty }}</div>
                </div>
                <div class="card-details">
                  <div class="detail-row">
                    <div class="detail-item">
                      <span class="detail-label">总移转:</span>
                      <span class="detail-value">{{ stats.ysjTotalTransferQty }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">部门移转:</span>
                      <span class="detail-value">{{ stats.ysjDeptTransferQty }}</span>
                    </div>
                  </div>
                  <div class="detail-row">
                    <div class="detail-item">
                      <span class="detail-label">仓库移转:</span>
                      <span class="detail-value">{{ stats.ysjWarehouseTransferQty }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">已预约:</span>
                      <span class="detail-value">{{ stats.ysjReservedQty }}</span>
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
              <div class="card-title-large">滤芯</div>
              <div class="card-main">
                <div class="card-value-wrapper">
                  <div class="card-value">{{ stats.lxAvailableReservedQty }}</div>
                </div>
                <div class="card-details">
                  <div class="detail-row">
                    <div class="detail-item">
                      <span class="detail-label">总移转:</span>
                      <span class="detail-value">{{ stats.lxTotalTransferQty }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">部门移转:</span>
                      <span class="detail-value">{{ stats.lxDeptTransferQty }}</span>
                    </div>
                  </div>
                  <div class="detail-row">
                    <div class="detail-item">
                      <span class="detail-label">仓库移转:</span>
                      <span class="detail-value">{{ stats.lxWarehouseTransferQty }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">已预约:</span>
                      <span class="detail-value">{{ stats.lxReservedQty }}</span>
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
              <div class="card-title-large">PP</div>
              <div class="card-main">
                <div class="card-value-wrapper">
                  <div class="card-value">{{ stats.ppAvailableReservedQty }}</div>
                </div>
                <div class="card-details">
                  <div class="detail-row">
                    <div class="detail-item">
                      <span class="detail-label">总移转:</span>
                      <span class="detail-value">{{ stats.ppTotalTransferQty }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">部门移转:</span>
                      <span class="detail-value">{{ stats.ppDeptTransferQty }}</span>
                    </div>
                  </div>
                  <div class="detail-row">
                    <div class="detail-item">
                      <span class="detail-label">仓库移转:</span>
                      <span class="detail-value">{{ stats.ppWarehouseTransferQty }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">已预约:</span>
                      <span class="detail-value">{{ stats.ppReservedQty }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="card-wrapper">
          <div class="top-item-box item-box-six">
            <div class="card-content">
              <div class="card-title-large">出精密</div>
              <div class="card-main">
                <div class="card-value-wrapper">
                  <div class="card-value">{{ stats.cn10AvailableReservedQty }}</div>
                </div>
                <div class="card-details">
                  <div class="detail-row">
                    <div class="detail-item">
                      <span class="detail-label">总移转:</span>
                      <span class="detail-value">{{ stats.cn10TotalTransferQty }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">部门移转:</span>
                      <span class="detail-value">{{ stats.cn10DeptTransferQty }}</span>
                    </div>
                  </div>
                  <div class="detail-row">
                    <div class="detail-item">
                      <span class="detail-label">仓库移转:</span>
                      <span class="detail-value">{{ stats.cn10WarehouseTransferQty }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">已预约:</span>
                      <span class="detail-value">{{ stats.cn10ReservedQty }}</span>
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
              <div class="card-title-large">其他</div>
              <div class="card-main">
                <div class="card-value-wrapper">
                  <div class="card-value">{{ stats.otherAvailableReservedQty }}</div>
                </div>
                <div class="card-details">
                  <div class="detail-row">
                    <div class="detail-item">
                      <span class="detail-label">总移转:</span>
                      <span class="detail-value">{{ stats.otherTotalTransferQty }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">部门移转:</span>
                      <span class="detail-value">{{ stats.otherDeptTransferQty }}</span>
                    </div>
                  </div>
                  <div class="detail-row">
                    <div class="detail-item">
                      <span class="detail-label">仓库移转:</span>
                      <span class="detail-value">{{ stats.otherWarehouseTransferQty }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">已预约:</span>
                      <span class="detail-value">{{ stats.otherReservedQty }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 物料清单表格区域 -->
    <div class="station-middle">
      <el-card class="box-card" shadow="never">
        <div class="card-header">
          <div class="card-title">库存清单</div>
        </div>
        <div class="scroll-table-container">
          <!-- 固定表头 -->
          <div class="table-header-fixed layout-desktop">
            <div class="header-row">
              <div class="header-cell work-order">工单</div>
              <div class="header-cell material-code">料号</div>
              <div class="header-cell material-desc">描述</div>
              <div class="header-cell quantity">数量</div>
              <div class="header-cell unit">单位</div>
              <div class="header-cell next-process">下制程</div>
              <div class="header-cell next-process-unit">下制程单位</div>
              <div class="header-cell start-date">开工日</div>
              <div class="header-cell days-to-start">距开工天数</div>
              <div class="header-cell reserved-status">预约状态</div>
              <div class="header-cell material-operator">物料员</div>
              <div class="header-cell location">库位</div>
            </div>
          </div>

          <!-- 滚动内容区 -->
          <div class="scroll-wrapper layout-desktop">
            <div class="scroll-container">
              <!-- 无数据提示 -->
              <div v-if="filteredTableData.length === 0" class="no-data">暂无数据</div>

              <!-- 无缝滚动表格 -->
              <Vue3SeamlessScroll v-else :list="filteredTableData" :visibleCount="10" :hover="true" :step="stepVal" :wheel="true" ref="seamlessScrollRef" v-if="showScroll">
                <template v-slot="{ data }">
                  <div class="seamless-item">
                    <div class="item-row" :class="tableRowClassName({ row: data })">
                      <div class="item-cell work-order">
                        <span class="cell-content">{{ data.workOrder }}</span>
                      </div>
                      <div class="item-cell material-code">
                        <span class="cell-content">{{ data.materialCode }}</span>
                      </div>
                      <div class="item-cell material-desc">
                        <span class="cell-content">{{ data.materialName }}</span>
                      </div>
                      <div class="item-cell quantity">{{ data.availableQuantity }}</div>
                      <div class="item-cell unit">{{ data.unit }}</div>
                      <div class="item-cell next-process">{{ data.nextStepOrderNo || '-' }} {{ data.nextStepWorkCenter || '' }}</div>
                      <div class="item-cell next-process-unit">{{ data.nextStepOrderNo ? data.nextStepDeptName : '-' }}</div>
                      <div class="item-cell start-date">{{ formatDate(data.nextStepStartTime) }}</div>
                      <div class="item-cell days-to-start">
                        <div class="days-badge" :class="getDaysBadgeClass(data.distanceToStart)" v-if="data.distanceToStart">
                          <span class="days-value">{{ data.distanceToStart }}</span>
                          <span class="days-unit">天</span>
                        </div>
                        <div v-else>-</div>
                      </div>

                      <div class="item-cell reserved-status">
                        <div class="status-badge" :class="data.isReserved ? 'status-reserved' : 'status-unreserved'">
                          {{ data.isReserved ? '已预约' : '未预约' }}
                        </div>
                      </div>
                      <div class="item-cell material-operator">{{ data.reservedName || '-' }}</div>
                      <div class="item-cell location">
                        <span class="cell-content">{{ data.locationCode }}</span>
                      </div>
                    </div>
                  </div>
                </template>
              </Vue3SeamlessScroll>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 设置对话框 -->
    <el-dialog v-model="showSettings" title="看板配置" width="600px" class="settings-dialog">
      <div class="settings-content">
        <el-form :model="settingsForm" label-width="120px">
          <el-form-item label="显示数量">
            <el-slider v-model="settingsForm.displayLimit" :min="1" :max="50" :step="1" show-input @change="saveSettings" />
            <div class="setting-tip">设置表格同时显示的数据条数</div>
          </el-form-item>

          <el-form-item label="滚动速度">
            <el-slider v-model="settingsForm.scrollSpeed" :min="0.1" :max="2" :step="0.1" show-input @change="saveSettings" />
            <div class="setting-tip">数值越大滚动越快</div>
          </el-form-item>

          <el-form-item label="启用滚动">
            <el-switch v-model="settingsForm.enableScroll" @change="saveSettings" />
          </el-form-item>

          <el-form-item label="自动刷新">
            <el-switch v-model="settingsForm.autoRefresh" @change="saveSettings" />
          </el-form-item>

          <el-form-item label="刷新间隔" v-if="settingsForm.autoRefresh">
            <el-input-number v-model="settingsForm.refreshInterval" :min="10" :max="300" :step="10" @change="saveSettings">
              <template #suffix>
                <span>秒</span>
              </template>
            </el-input-number>
          </el-form-item>

          <el-form-item label="仓库">
            <el-input v-model="settingsForm.warehouseCode" placeholder="请输入仓库代码" clearable style="width: 100%" @change="saveSettings" />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="showSettings = false">关闭</el-button>
        <el-button type="primary" @click="resetSettings">恢复默认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue';
import { dayjs, ElMessage, ElMessageBox } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import { Vue3SeamlessScroll } from 'vue3-seamless-scroll';
import moment from 'moment';
import { queryPendingPickingList } from '@/api/wms/scada';

// 类型定义
interface InboundItem {
  id: string;
  workOrder: string;
  materialCode: string;
  materialDesc: string;
  availableQuantity: number;
  nextProcess: string;
  nextProcessStartDate: string;
  daysToStart: number;
  nextProcessUnit: string;
  isReserved: boolean;
  materialOperator: string;
  picked: boolean;
  transferredToAuto: boolean;
  costCenter: string;
}

interface SettingsForm {
  selectedProcess: string;
  warehouseCode: string;
  refreshInterval: number;
  autoRefresh: boolean;
  enableScroll: boolean;
  scrollSpeed: number;
  displayLimit: number;
}

// 响应式数据
const tableData = ref<InboundItem[]>([]);
const selectedRows = ref<InboundItem[]>([]);
const showSettings = ref(false);
const currentDateTime = ref('');
const boardRef = ref(null);
const isFullscreen = ref(false);
const seamlessScrollRef = ref();

// 部门统计数据
const deptStatsList = ref<
  Array<{
    deptCode: string;
    deptName: string;
    outTimeQty: string;
    totalQty: string;
    unreservedQty: string;
    reservedQty: string;
    claimedQty: string;
  }>
>([]);

// 设置表单
const settingsForm = reactive<SettingsForm>({
  selectedProcess: '',
  warehouseCode: 'KB10',
  refreshInterval: 30,
  autoRefresh: true,
  enableScroll: true,
  scrollSpeed: 0.5,
  displayLimit: 15
});

// 制程选项
const processOptions = [
  { label: '水处理装配', value: '水处理装配' },
  { label: '饮水机', value: '饮水机' },
  { label: '滤芯', value: '滤芯' },
  { label: 'PP', value: 'PP' },
  { label: '空', value: '空' }
];

const stepVal = ref(1);
const showScroll = ref(true);

// 滚动配置
// const scrollOption = computed(() => {
//   return {
//     step: stepVal.value,
//     hoverStop: true,
//     direction: 1,
//     limitMoveNum: settingsForm.displayLimit,
//     switchOffset: 30,
//     autoPlay: settingsForm.enableScroll,
//     navigation: false,
//     singleHeight: 0,
//     singleWaitTime: 0,
//     isRem: false,
//     waitTime: 0
//   };
// });

const scrollOption = computed(() => ({
  step: stepVal.value,
  hoverStop: true,
  direction: 1,
  limitMoveNum: 3, // ⚠️ 固定写死先测试
  autoPlay: settingsForm.enableScroll,
  singleHeight: 0,
  singleWaitTime: 0
}));

// 显示限制
const displayLimit = computed(() => settingsForm.displayLimit);

// 计算属性
const filteredTableData = computed(() => {
  // return tableData.value.filter((item) => {
  //   if (item.picked || item.transferredToAuto) return false;
  //   if (settingsForm.selectedProcess && item.nextProcess !== settingsForm.selectedProcess) return false;
  //   return true;
  // });
  return tableData.value;
});

// 统计数据
const stats = computed(() => {
  // 从接口返回的部门统计数据中提取
  const sclDept = deptStatsList.value.find((dept) => dept.deptCode === 'SCL');
  const ysjDept = deptStatsList.value.find((dept) => dept.deptCode === 'YSJ');
  const lxDept = deptStatsList.value.find((dept) => dept.deptCode === 'LX');
  const ppDept = deptStatsList.value.find((dept) => dept.deptCode === 'PP');
  const cn10Dept = deptStatsList.value.find((dept) => dept.deptCode === 'CN10');
  const otherDept = deptStatsList.value.find((dept) => dept.deptCode === 'OTHER');

  // 水处理
  const sclAvailableReservedQty = parseInt(sclDept?.availableReservedQty || '0');
  const sclTotalTransferQty = parseInt(sclDept?.totalTransferQty || '0');
  const sclDeptTransferQty = parseInt(sclDept?.deptTransferQty || '0');
  const sclWarehouseTransferQty = parseInt(sclDept?.totalTransferQty - sclDept?.deptTransferQty || '0');
  const sclReservedQty = parseInt(sclDept?.reservedQty || '0');
  //饮水机
  const ysjAvailableReservedQty = parseInt(ysjDept?.availableReservedQty || '0');
  const ysjTotalTransferQty = parseInt(ysjDept?.totalTransferQty || '0');
  const ysjDeptTransferQty = parseInt(ysjDept?.deptTransferQty || '0');
  const ysjWarehouseTransferQty = parseInt(ysjDept?.ysjrTotalTransferQty - ysjDept?.deptTransferQty || '0');
  const ysjReservedQty = parseInt(ysjDept?.reservedQty || '0');

  //滤芯
  const lxAvailableReservedQty = parseInt(lxDept?.availableReservedQty || '0');
  const lxTotalTransferQty = parseInt(lxDept?.totalTransferQty || '0');
  const lxDeptTransferQty = parseInt(lxDept?.deptTransferQty || '0');
  const lxWarehouseTransferQty = parseInt(lxDept?.totalTransferQty - lxDept?.deptTransferQty || '0');
  const lxReservedQty = parseInt(lxDept?.reservedQty || '0');

  // PP
  const ppAvailableReservedQty = parseInt(ppDept?.availableReservedQty || '0');
  const ppTotalTransferQty = parseInt(ppDept?.totalTransferQty || '0');
  const ppDeptTransferQty = parseInt(ppDept?.deptTransferQty || '0');
  const ppWarehouseTransferQty = parseInt(ppDept?.totalTransferQty - ppDept?.deptTransferQty || '0');
  const ppReservedQty = parseInt(ppDept?.reservedQty || '0');

  // 出精密相关统计
  const cn10AvailableReservedQty = parseInt(cn10Dept?.availableReservedQty || '0');
  const cn10TotalTransferQty = parseInt(cn10Dept?.totalTransferQty || '0');
  const cn10DeptTransferQty = parseInt(cn10Dept?.deptTransferQty || '0');
  const cn10WarehouseTransferQty = parseInt(cn10Dept?.totalTransferQty - cn10Dept?.deptTransferQty || '0');
  const cn10ReservedQty = parseInt(cn10Dept?.reservedQty || '0');

  // 其他部门
  const otherAvailableReservedQty = parseInt(otherDept?.availableReservedQty || '0');
  const otherTotalTransferQty = parseInt(otherDept?.totalTransferQty || '0');
  const otherDeptTransferQty = parseInt(otherDept?.deptTransferQty || '0');
  const otherWarehouseTransferQty = parseInt(otherDept?.totalTransferQty - otherDept?.deptTransferQty || '0');
  const otherReservedQty = parseInt(otherDept?.reservedQty || '0');

  return {
    // 水处理卡片
    sclAvailableReservedQty: sclAvailableReservedQty,
    sclTotalTransferQty: sclTotalTransferQty,
    sclDeptTransferQty: sclDeptTransferQty,
    sclWarehouseTransferQty: sclWarehouseTransferQty,
    sclReservedQty: sclReservedQty,

    // 饮水机卡片
    ysjAvailableReservedQty: ysjAvailableReservedQty,
    ysjTotalTransferQty: ysjTotalTransferQty,
    ysjDeptTransferQty: ysjDeptTransferQty,
    ysjWarehouseTransferQty: ysjWarehouseTransferQty,
    ysjReservedQty: ysjReservedQty,

    // 滤芯卡片
    lxAvailableReservedQty: lxAvailableReservedQty,
    lxTotalTransferQty: lxTotalTransferQty,
    lxDeptTransferQty: lxDeptTransferQty,
    lxWarehouseTransferQty: lxWarehouseTransferQty,
    lxReservedQty: lxReservedQty,

    // PP 卡片
    ppAvailableReservedQty: ppAvailableReservedQty,
    ppTotalTransferQty: ppTotalTransferQty,
    ppDeptTransferQty: ppDeptTransferQty,
    ppWarehouseTransferQty: ppWarehouseTransferQty,
    ppReservedQty: ppReservedQty,

    // 出精密卡片
    cn10AvailableReservedQty: cn10AvailableReservedQty,
    cn10TotalTransferQty: cn10TotalTransferQty,
    cn10DeptTransferQty: cn10DeptTransferQty,
    cn10WarehouseTransferQty: cn10WarehouseTransferQty,
    cn10ReservedQty: cn10ReservedQty,

    // 其他卡片
    otherAvailableReservedQty: otherAvailableReservedQty,
    otherTotalTransferQty: otherTotalTransferQty,
    otherDeptTransferQty: otherDeptTransferQty,
    otherWarehouseTransferQty: otherWarehouseTransferQty,
    otherReservedQty: otherReservedQty
  };
});

// 方法
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return dayjs(dateStr).format('YYYY-MM-DD');
};

const getDaysBadgeClass = (days: number): string => {
  if (days < 0) return 'days-danger';
  if (days <= 2) return 'days-warning';
  if (days <= 5) return 'days-primary';
  return 'days-info';
};

// 表格行样式
const tableRowClassName = ({ row }: { row: InboundItem }) => {
  if (row.daysToStart < 0) return 'danger-row';
  if (row.daysToStart <= 2) return 'urgent-row';
  if (row.isReserved) return 'reserved-row';
  return '';
};

// 加载数据
const loadData = async () => {
  try {
    const res = await queryPendingPickingList({
      warehouseCode: settingsForm.warehouseCode
    });
    // 获取表格数据
    tableData.value = res.data.palletInventoryPendingPickingScadaVoList || [];
    deptStatsList.value = res.data.deptStatisticsVoList || [];
  } catch (error) {
    console.error(error);
  }
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

// 全屏状态处理
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
  showScroll.value = false;
  nextTick(() => {
    showScroll.value = true;
  });
};

// 刷新数据
const handleRefresh = () => {
  loadData();
};

// 保存设置
const saveSettings = () => {
  localStorage.setItem('inboundWaitPickSettings', JSON.stringify(settingsForm));
  ElMessage.success('设置已保存');

  stepVal.value = settingsForm.scrollSpeed;

  if (seamlessScrollRef.value) {
    if (settingsForm.enableScroll) {
      seamlessScrollRef.value.continue();
    } else {
      seamlessScrollRef.value.stop();
    }
  }
};

// 恢复默认设置
const resetSettings = () => {
  Object.assign(settingsForm, {
    selectedProcess: '',
    refreshInterval: 30,
    autoRefresh: true,
    enableScroll: true,
    scrollSpeed: 0.5,
    displayLimit: 15
  });
  saveSettings();
  showSettings.value = false;
};

let timer: number | null = null;
let refreshTimer: number | null = null;

// 组件挂载
onMounted(() => {
  updateDateTime();
  timer = window.setInterval(updateDateTime, 10000);

  const savedSettings = localStorage.getItem('inboundWaitPickSettings');
  if (savedSettings) {
    Object.assign(settingsForm, JSON.parse(savedSettings));
  }

  loadData();

  document.addEventListener('fullscreenchange', handleFullscreenChange);

  if (settingsForm.autoRefresh) {
    refreshTimer = window.setInterval(handleRefresh, settingsForm.refreshInterval * 1000);
  }
});

// 监听自动刷新设置
watch(
  () => settingsForm.autoRefresh,
  (newVal) => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
    if (newVal) {
      refreshTimer = window.setInterval(handleRefresh, settingsForm.refreshInterval * 1000);
    }
  }
);

// 监听刷新间隔变化
watch(
  () => settingsForm.refreshInterval,
  (newVal) => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }
    if (settingsForm.autoRefresh) {
      refreshTimer = window.setInterval(handleRefresh, newVal * 1000);
    }
  }
);

// 组件卸载
onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
});
</script>

<style scoped>
/* ==================== 全局容器样式 ==================== */
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
  padding: 10px;
}

/* ==================== 顶部标题栏 ==================== */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 70px;
  background: rgba(16, 13, 68, 0.8);
  border-radius: 12px;
  padding: 0;
  margin-bottom: 5px;
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
  gap: 12px;
}

.header-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 16px;
  gap: 15px;
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

.header-tag {
  font-size: 14px;
}

.current-time {
  font-size: 18px;
  font-weight: 500;
  color: #fff;
  text-shadow: 0 0 5px rgba(100, 150, 255, 0.5);
}

.refresh-btn {
  background: linear-gradient(45deg, #4facfe, #00f2fe);
  border: none;
  box-shadow: 0 2px 10px rgba(0, 100, 255, 0.3);
}

/* ==================== 统计卡片区域 ==================== */
.station-top {
  flex: 0 0 auto;
  padding: 10px 0 5px 0;
}

.cards-container {
  display: flex;
  gap: 12px;
  margin-top: 5px;
  flex-wrap: wrap;
}

.card-wrapper {
  flex: 1;
  min-width: 0px;
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

/* 卡片主题色 */
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

.item-box-five {
  background: linear-gradient(30deg, #2a7a4a, #3a9a5a, #4aba6a);
}

.item-box-six {
  background: linear-gradient(30deg, #2a5a7a, #3a7a9a, #4a9aba);
}
/* ==================== 表格区域 ==================== */
.station-middle {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0;
}

.box-card {
  height: 100%;
  margin-bottom: 0;
  background-color: rgba(30, 30, 40, 0.7);
  border-color: rgba(100, 100, 200, 0.3);
  color: #fff;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.box-card :deep(.el-card__body) {
  height: calc(100% - 50px);
  background-color: transparent;
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 0;
  position: relative;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 50px;
  padding: 10px 15px;
  margin-bottom: 0;
  position: relative;
  z-index: 10;
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
  gap: 15px;
  align-items: center;
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

.selected-info {
  font-size: 14px;
  color: #ccc;
  white-space: nowrap;
}

/* ==================== 表格布局核心样式 ==================== */
.scroll-table-container {
}
.table-header-fixed,
.scroll-wrapper {
  width: 100%;
  overflow-x: auto;
}

.header-row,
.item-row {
  display: flex;
  width: 100%;
}

/* 固定表头 */
.table-header-fixed {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(100, 100, 200, 0.3);
  padding: 0 10px;
  flex-shrink: 0;
}

.header-row {
  align-items: center;
  height: 40px;
  font-weight: bold;
  color: #00f2fe;
  border-bottom: 1px solid rgba(100, 100, 200, 0.2);
}

.header-cell {
  color: #00f2fe;
  font-size: 14px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 8px;
  box-sizing: border-box;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-cell > * {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* 滚动内容区 */
.scroll-wrapper {
  position: relative;
  flex: 1;
  overflow: hidden;
  padding: 0 10px 10px 10px;
  min-height: 0;
}

.scroll-container {
  height: calc(100vh - 400px);
  overflow: hidden;
  position: relative;
}

.seamless-item {
  height: 50px;
  cursor: pointer;
}

.item-row {
  align-items: center;
  height: 100%;
  padding: 0;
  border-bottom: 1px solid rgba(100, 100, 200, 0.2);
  margin: 0;
}

.item-row:hover {
  background-color: rgba(100, 100, 200, 0.1);
}

.item-cell {
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 0px;
  box-sizing: border-box;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-cell > * {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.item-cell .cell-content {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

/* ==================== 桌面端列宽定义（统一宽度）==================== */
/* 工单列 */
.layout-desktop .work-order {
  width: 8%;
}

/* 料号列 */
.layout-desktop .material-code {
  width: 10%;
}

/* 描述列 */
.layout-desktop .material-desc {
  width: 20%;
}

/* 数量列 */
.layout-desktop .quantity {
  width: 5%;
}

/* 单位列 */
.layout-desktop .unit {
  width: 5%;
}

/* 下制程列 */
.layout-desktop .next-process {
  width: 15%;
}

/* 下制程单位列 */
.layout-desktop .next-process-unit {
  width: 10%;
}

/* 开工日列 */
.layout-desktop .start-date {
  width: 10%;
}

/* 距开工天数列 */
.layout-desktop .days-to-start {
  width: 8%;
}

/* 预约状态列 */
.layout-desktop .reserved-status {
  width: 7%;
}

/* 物料员列 */
.layout-desktop .material-operator {
  width: 10%;
}

/* 库位列 */
.layout-desktop .location {
  width: 12%;
}

/* ==================== 内容列对齐方式（独立于表头）==================== */
/* 需要左对齐的内容列 */
.layout-desktop .item-cell.material-desc {
  justify-content: flex-start !important;
  text-align: left !important;
}

/* 需要居中的内容列 */
.layout-desktop .item-cell.work-order,
.layout-desktop .item-cell.material-code,
.layout-desktop .item-cell.quantity,
.layout-desktop .item-cell.unit,
.layout-desktop .item-cell.next-process,
.layout-desktop .item-cell.next-process-unit,
.layout-desktop .item-cell.start-date,
.layout-desktop .item-cell.days-to-start,
.layout-desktop .item-cell.reserved-status,
.layout-desktop .item-cell.location,
.layout-desktop .item-cell.material-operator {
  justify-content: center !important;
  text-align: center !important;
}

/* ==================== 特殊行样式 ==================== */
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

.reserved-row {
  background-color: rgba(79, 172, 254, 0.1) !important;
}

/* ==================== 天数标签样式 ==================== */
.days-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.days-badge .days-value {
  font-size: 14px;
  font-weight: bold;
}

.days-badge .days-unit {
  font-size: 12px;
  opacity: 0.9;
}

/* 危险 - 逾期 */
.days-badge.days-danger {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  color: #fff;
  box-shadow: 0 2px 12px rgba(255, 77, 79, 0.4);
}

/* 警告 - 紧急 */
.days-badge.days-warning {
  background: linear-gradient(135deg, #faad14 0%, #ffc53d 100%);
  color: #fff;
  box-shadow: 0 2px 12px rgba(250, 173, 20, 0.4);
}

/* 主要 - 较近 */
.days-badge.days-primary {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  color: #fff;
  box-shadow: 0 2px 12px rgba(24, 144, 255, 0.4);
}

/* 信息 - 正常 */
.days-badge.days-info {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  color: #fff;
  box-shadow: 0 2px 12px rgba(82, 196, 26, 0.4);
}

/* ==================== 预约状态标签样式 ==================== */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

/* 已预约状态 */
.status-badge.status-reserved {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  color: #fff;
  box-shadow: 0 2px 12px rgba(24, 144, 255, 0.4);
}

/* 未预约状态 */
.status-badge.status-unreserved {
  background: linear-gradient(135deg, #8c8c8c 0%, #bfbfbf 100%);
  color: #fff;
  box-shadow: 0 2px 12px rgba(140, 140, 140, 0.3);
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

/* ==================== 无数据提示 ==================== */
.no-data {
  text-align: center;
  padding: 50px 20px;
  color: #ccc;
  font-size: 16px;
  background: rgba(100, 100, 200, 0.05);
  border: 1px dashed rgba(100, 100, 200, 0.3);
  border-radius: 8px;
  margin: 20px;
}

/* ==================== 设置对话框 ==================== */

/* ==================== 滚动条样式 ==================== */
.table-header-fixed::-webkit-scrollbar,
.scroll-wrapper::-webkit-scrollbar {
  height: 8px;
}

.table-header-fixed::-webkit-scrollbar-track,
.scroll-wrapper::-webkit-scrollbar-track {
  background: rgba(30, 30, 40, 0.3);
  border-radius: 4px;
}

.table-header-fixed::-webkit-scrollbar-thumb,
.scroll-wrapper::-webkit-scrollbar-thumb {
  background: rgba(100, 100, 200, 0.5);
  border-radius: 4px;
}

.table-header-fixed::-webkit-scrollbar-thumb:hover,
.scroll-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 100, 200, 0.7);
}

/* ==================== 通用工具类 ==================== */
</style>
