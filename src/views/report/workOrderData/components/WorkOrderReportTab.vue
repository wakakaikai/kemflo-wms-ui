<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="工单号" prop="workOrderNo">
              <el-input v-model="queryParams.workOrderNo" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="入库标识卡号" prop="workOrderSn">
              <el-input v-model="queryParams.workOrderSn" placeholder="请输入入库标识卡号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="never">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:workOrderReport:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="reportList" :height="tableHeight" border fixed-header>
        <el-table-column type="expand">
          <template #default="scope">
            <el-table :data="scope.row.mesShopOrderReportVoList" style="width: calc(100% - 50px); margin: 10px 0 10px 50px" empty-text="暂无数据">
<!--              <el-table-column label="工单号" align="center" prop="shopOrder" />-->
              <el-table-column label="工作中心" align="center" prop="workCenter" />
              <el-table-column label="开工时间" align="center" prop="startDateTime" min-width="120" />
              <el-table-column label="完工时间" align="center" prop="endDateTime" min-width="120" />
              <el-table-column label="标准产能" align="center" prop="standardCapacity" />
              <el-table-column label="标准人数" align="center" prop="standardPersonNumber" />
              <el-table-column label="平均人数" align="center" prop="personNumber" />
              <el-table-column label="报工数量" align="center" prop="mesReportQty">
                <template #default="scope">
                  {{ scope.row.qtyReport ? parseFloat(scope.row.qtyReport) : '-' }}
                </template>
              </el-table-column>
              <el-table-column label="不良数量" align="center" prop="qtyScrapped">
                <template #default="scope">
                  {{ scope.row.qtyScrapped ? parseFloat(scope.row.qtyScrapped) : '-' }}
                </template>
              </el-table-column>
              <el-table-column label="起迄时长" align="center" prop="totalDuration" />
              <el-table-column label="休息时长" align="center" prop="restDuration" />
              <el-table-column label="操作时长" align="center" prop="operationDuration" />
<!--              <el-table-column label="停止时间" align="center" prop="stopDuration" />-->
              <el-table-column label="异常时间" align="center" prop="abnormalDuration" />
              <el-table-column label="有效时长" align="center" prop="effectiveDuration" />
              <el-table-column label="实际人时" align="center" prop="personTime" />
              <el-table-column label="速度稼动率" align="center" prop="speedRate" width="120">
                <template #default="scope">
                  <el-progress type="circle" :percentage="Number(scope.row.speedRate) || 0" :width="70" :color="getProgressColor(Number(scope.row.speedRate))" class="custom-speed-progress-circle">
                    <template #default="{ percentage }">
                      <span class="percentage-value" :style="{ color: getProgressTextColor(percentage) }">{{ percentage }}%</span>
                    </template>
                  </el-progress>
                </template>
              </el-table-column>
              <el-table-column label="时间稼动率" align="center" prop="timeRate" width="120">
                <template #default="scope">
                  <el-progress type="circle" :percentage="Number(scope.row.timeRate) || 0" :width="70" :color="getProgressColor(Number(scope.row.timeRate))" class="custom-time-progress-circle">
                    <template #default="{ percentage }">
                      <span class="percentage-value" :style="{ color: getProgressTextColor(percentage) }">{{ percentage }}%</span>
                    </template>
                  </el-progress>
                </template>
              </el-table-column>

              <el-table-column label="良品率" align="center" prop="goodRate" width="120">
                <template #default="scope">
                  <el-progress type="circle" :percentage="Number(scope.row.goodRate) || 0" :width="70" :color="getProgressColor(Number(scope.row.goodRate))" class="custom-good-progress-circle">
                    <template #default="{ percentage }">
                      <span class="percentage-value" :style="{ color: getProgressTextColor(percentage) }">{{ percentage }}%</span>
                    </template>
                  </el-progress>
                </template>
              </el-table-column>
              <el-table-column label="综合OEE" align="center" prop="oeeRate" width="120">
                <template #default="scope">
                  <el-progress type="circle" :percentage="Number(scope.row.oeeRate) || 0" :width="70" :color="getProgressColor(Number(scope.row.oeeRate))" class="custom-oee-progress-circle">
                    <template #default="{ percentage }">
                      <span class="percentage-value" :style="{ color: getProgressTextColor(percentage) }">{{ percentage }}%</span>
                    </template>
                  </el-progress>
                </template>
              </el-table-column>
              <el-table-column label="操作" align="center" width="120" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" icon="View" @click="handleViewDetail(row)"> 查看明细 </el-button>
                </template>
              </el-table-column>
            </el-table>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="left" min-width="200">
          <template #default="scope">
            <div class="status-with-detail">
              <div class="status-indicator-inline">
                <span v-if="scope.row.finalStatus === 0" class="indicator-dot success"></span>
                <span v-else-if="scope.row.finalStatus === 1" class="indicator-dot warning"></span>
                <span v-else-if="scope.row.finalStatus === 2" class="indicator-dot danger"></span>
                <span v-else class="indicator-dot default"></span>
                <span class="status-text">{{ scope.row.finalStatusDesc }}</span>
              </div>
              <div class="status-detail-content" v-if="scope.row.finalStatusDetail">
                <div v-for="(item, index) in scope.row.finalStatusDetail.split('|')" :key="index">
                  {{ item.trim() }}
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="工单号" align="center" prop="workOrderNo" />
        <el-table-column label="工序" align="center" prop="process" />
        <el-table-column label="工序名称" align="center" prop="processShortDesc" show-overflow-tooltip />
        <el-table-column label="产品料号" align="center" prop="item" />
        <el-table-column label="产品描述" align="left" prop="itemDesc" show-overflow-tooltip />
        <el-table-column label="工作中心" align="center" prop="workCenter" />
        <el-table-column label="计划数量" align="center" prop="plannedQty" />
        <el-table-column label="报工数量" align="center" prop="mesReportQty">
          <template #default="scope">
            <span>
              {{ scope.row.mesReportQty ? parseFloat(scope.row.mesReportQty) : '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="计划开始时间" align="center" prop="plannedStartDate" />
        <el-table-column label="计划结束时间" align="center" prop="plannedEndDate" />
        <el-table-column label="实际开始时间" align="center" prop="actualStartDate" />
        <el-table-column label="实际结束时间" align="center" prop="actualEndDate" />
        <!--        <el-table-column label="速度稼动率" align="center" prop="speedRate" width="120">
          <template #default="scope">
            <el-progress
              type="circle"
              :percentage="Number(scope.row.speedRate) || 0"
              :width="70"
              :color="Number(scope.row.speedRate) >= 100 ? '#67c23a' : '#409eff'"
              class="custom-speed-progress-circle"
            >
              <template #default="{ percentage }">
                <span class="percentage-value" :style="{ color: percentage < 100 && percentage > 0 ? '#409eff' : '#67c23a' }">{{ percentage }}%</span>
              </template>
            </el-progress>
          </template>
        </el-table-column>
        <el-table-column label="时间稼动率" align="center" prop="timeRate" width="120">
          <template #default="scope">
            <el-progress type="circle" :percentage="Number(scope.row.timeRate) || 0" :width="70" :color="Number(scope.row.timeRate) >= 100 ? '#67c23a' : '#e6a23c'" class="custom-time-progress-circle">
              <template #default="{ percentage }">
                <span class="percentage-value" :style="{ color: percentage < 100 ? '#e6a23c' : '#67c23a' }">{{ percentage }}%</span>
              </template>
            </el-progress>
          </template>
        </el-table-column>

        <el-table-column label="良品率" align="center" prop="goodRate" width="120">
          <template #default="scope">
            <el-progress type="circle" :percentage="Number(scope.row.goodRate) || 0" :width="70" :color="Number(scope.row.goodRate) >= 100 ? '#67c23a' : '#f56c6c'" class="custom-good-progress-circle">
              <template #default="{ percentage }">
                <span class="percentage-value" :style="{ color: percentage < 100 && percentage > 0 ? '#f56c6c' : '#67c23a' }">{{ percentage }}%</span>
              </template>
            </el-progress>
          </template>
        </el-table-column>
        <el-table-column label="综合OEE" align="center" prop="oeeRate" width="120">
          <template #default="scope">
            <el-progress type="circle" :percentage="Number(scope.row.oeeRate) || 0" :width="70" :color="Number(scope.row.oeeRate) >= 100 ? '#67c23a' : '#909399'" class="custom-oee-progress-circle">
              <template #default="{ percentage }">
                <span class="percentage-value" :style="{ color: percentage < 100 && percentage > 0 ? '#909399' : '#67c23a' }">{{ percentage }}%</span>
              </template>
            </el-progress>
          </template>
        </el-table-column>-->

        <el-table-column label="速度稼动率" align="center" prop="speedRate" width="120">
          <template #default="scope">
            <el-progress type="circle" :percentage="Number(scope.row.speedRate) || 0" :width="70" :color="getProgressColor(Number(scope.row.speedRate))" class="custom-speed-progress-circle">
              <template #default="{ percentage }">
                <span class="percentage-value" :style="{ color: getProgressTextColor(percentage) }">{{ percentage }}%</span>
              </template>
            </el-progress>
          </template>
        </el-table-column>
        <el-table-column label="时间稼动率" align="center" prop="timeRate" width="120">
          <template #default="scope">
            <el-progress type="circle" :percentage="Number(scope.row.timeRate) || 0" :width="70" :color="getProgressColor(Number(scope.row.timeRate))" class="custom-time-progress-circle">
              <template #default="{ percentage }">
                <span class="percentage-value" :style="{ color: getProgressTextColor(percentage) }">{{ percentage }}%</span>
              </template>
            </el-progress>
          </template>
        </el-table-column>

        <el-table-column label="良品率" align="center" prop="goodRate" width="120">
          <template #default="scope">
            <el-progress type="circle" :percentage="Number(scope.row.goodRate) || 0" :width="70" :color="getProgressColor(Number(scope.row.goodRate))" class="custom-good-progress-circle">
              <template #default="{ percentage }">
                <span class="percentage-value" :style="{ color: getProgressTextColor(percentage) }">{{ percentage }}%</span>
              </template>
            </el-progress>
          </template>
        </el-table-column>
        <el-table-column label="综合OEE" align="center" prop="oeeRate" width="120">
          <template #default="scope">
            <el-progress type="circle" :percentage="Number(scope.row.oeeRate) || 0" :width="70" :color="getProgressColor(Number(scope.row.oeeRate))" class="custom-oee-progress-circle">
              <template #default="{ percentage }">
                <span class="percentage-value" :style="{ color: getProgressTextColor(percentage) }">{{ percentage }}%</span>
              </template>
            </el-progress>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <!-- 查看明细抽屉 -->
    <el-drawer v-model="detailDrawer.visible" size="85%" direction="rtl" destroy-on-close>
      <template #header>
        <div class="drawer-header">
          <div class="drawer-title-main">{{ detailDrawer.title }}</div>
        </div>
      </template>
      <!-- 内容区域 -->
      <div class="drawer-content">
        <div class="flex gap-2">
          <el-tag type="primary" effect="dark" size="large"> 报工工序：{{ reportDetail.shopOrder }} </el-tag>
          <el-tag type="primary" effect="dark" size="large"> 报工时间：{{ reportDetail.startDateTime }} ~ {{ reportDetail.endDateTime }} </el-tag>
        </div>
        <MesReportDetail v-if="detailDrawer.visible" :reportId="reportId" />
      </div>
    </el-drawer>
  </div>
</template>

<script setup name="WorkOrderReport" lang="ts">
import { listWorkOrderReport } from '@/api/report/workOrder';
import { WorkOrderProcessForm, WorkOrderProcessQuery } from '@/api/wms/workOrderProcess/types';
import MesReportDetail from './MesReportDetail.vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const initFormData: WorkOrderProcessForm = {
  id: undefined,
  workOrderNo: undefined,
  workOrderSn: undefined,
  router: undefined,
  process: undefined,
  processShortDesc: undefined,
  workCenter: undefined,
  processStatus: undefined,
  baseQty: undefined,
  personNumber: undefined,
  machineTime: undefined,
  machineTimeUnit: undefined,
  personTime: undefined,
  personTimeUnit: undefined,
  schedulingTime: undefined,
  schedulingTimeUnit: undefined,
  moduleQty: undefined,
  moduleUnit: undefined,
  remark: undefined
};
const data = reactive<PageData<WorkOrderProcessForm, WorkOrderProcessQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    workOrderNo: '',
    workOrderSn: undefined,
    router: undefined,
    process: undefined,
    processShortDesc: undefined,
    workCenter: undefined,
    processStatus: undefined,
    baseQty: undefined,
    personNumber: undefined,
    machineTime: undefined,
    machineTimeUnit: undefined,
    personTime: undefined,
    personTimeUnit: undefined,
    schedulingTime: undefined,
    schedulingTimeUnit: undefined,
    moduleQty: undefined,
    moduleUnit: undefined,
    params: {}
  },
  rules: {}
});

const { queryParams, form, rules } = toRefs(data);

const reportList = ref<any[]>([]);
const reportDetail = ref<any>({});

const loading = ref(false);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const currentShopOrder = ref<string>('');
const reportId = ref<any>(null);
// 明细抽屉
const detailDrawer = reactive({
  visible: false,
  title: '报工明细'
});
// 动态表格高度
const tableHeight = ref<number>(350);

// 计算表格高度（核心方法）
const calcTableHeight = () => {
  // 窗口高度 - 页面其他占位高度（根据你的页面自行调整）
  const clientHeight = document.documentElement.clientHeight;
  // 减去：搜索表单 + 按钮栏 + 分页 + 间距等（自行调整）
  const subtractHeight = 480;
  let height = clientHeight - subtractHeight;

  // 最小高度限制（避免表格太矮）
  if (height < 300) height = 300;
  tableHeight.value = height;
};

// 监听窗口变化
let resizeTimer: NodeJS.Timeout | null = null;
const handleResize = () => {
  // 防抖
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    calcTableHeight();
  }, 100);
};

/** 查询工单报工列表 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await listWorkOrderReport(queryParams.value);
    reportList.value = res.rows;
    total.value = res.total;
  } catch (error) {
    console.error('查询工单报工信息失败:', error);
  } finally {
    loading.value = false;
  }
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/scada/exportWorkOrderReport',
    {
      ...queryParams.value
    },
    `workOrderReport_${new Date().getTime()}.xlsx`
  );
};
/** 查看明细 */
const handleViewDetail = (row: any) => {
  currentShopOrder.value = row.shopOrder || '';
  detailDrawer.title = `报工明细`;
  reportDetail.value = row;
  detailDrawer.visible = true;
  reportId.value = row.id;
};

/** 获取进度条颜色 */
const getProgressColor = (value: number): string => {
  if (value >= 100) {
    return '#67c23a'; // 绿色
  } else if (value >= 85) {
    return '#e6a23c'; // 橙色
  } else if (value > 0) {
    return '#f56c6c'; // 红色
  } else {
    return '#909399'; // 灰色
  }
};

/** 获取进度条文字颜色 */
const getProgressTextColor = (percentage: number): string => {
  if (percentage >= 100) {
    return '#67c23a'; // 绿色
  } else if (percentage >= 85) {
    return '#e6a23c'; // 橙色
  } else if (percentage > 0) {
    return '#f56c6c'; // 红色
  } else {
    return '#909399'; // 灰色
  }
};

onMounted(() => {
  calcTableHeight();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (resizeTimer) clearTimeout(resizeTimer);
});
</script>
<style scoped lang="scss">
// 速度稼动率 - 蓝色轨道
/*:deep(.custom-speed-progress-circle .el-progress-circle__track) {
  stroke: rgba(64, 158, 255, 0.25) !important;
}

// 时间稼动率 - 橙色轨道
:deep(.custom-time-progress-circle .el-progress-circle__track) {
  stroke: rgba(230, 162, 60, 0.25) !important;
}

// 良品率 - 红色轨道
:deep(.custom-good-progress-circle .el-progress-circle__track) {
  stroke: rgba(245, 108, 108, 0.25) !important;
}

// 综合OEE - 灰色轨道
:deep(.custom-oee-progress-circle .el-progress-circle__track) {
  stroke: rgba(144, 147, 153, 0.25) !important;
}*/

// 统一修改进度条轨道的基础样式
:deep(.el-progress-circle__track) {
  stroke: rgba(0, 0, 0, 0.15) !important;
}

// 修改进度条路径的默认样式
:deep(.el-progress-circle__path) {
  transition: stroke 0.3s ease;
}
.percentage-value {
  display: block;
  margin-top: 0px;
  font-size: 12px;
}
/* 报工明细抽屉样式 */
.drawer-header {
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 16px;

  .drawer-title-main {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;
  }

  .drawer-info-row {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;

    .el-tag {
      display: flex;
      align-items: center;
      padding: 6px 12px;

      .el-icon {
        font-size: 14px;
      }
    }
  }
}

:deep(.el-drawer__header) {
  margin-bottom: 5px !important;
}
/* 展开行内状态与描述合并的样式 */
.status-with-detail {
  /*  padding: 4px 0;*/

  .status-indicator-inline {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 4px;

    .indicator-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 3px;
      box-shadow: 0 0 3px rgba(0, 0, 0, 0.15);

      &.success {
        background-color: #67c23a;
        box-shadow: 0 0 5px rgba(103, 194, 58, 0.4);
      }

      &.warning {
        background-color: #e6a23c;
        box-shadow: 0 0 5px rgba(230, 162, 60, 0.4);
      }

      &.danger {
        background-color: #f56c6c;
        box-shadow: 0 0 5px rgba(245, 108, 108, 0.4);
      }

      &.default {
        background-color: #909399;
        box-shadow: 0 0 3px rgba(144, 147, 153, 0.3);
      }
    }

    .status-info {
      flex: 1;
      min-width: 0;

      .status-text {
        font-size: 14px;
        color: #303133;
        font-weight: 500;
        line-height: 1.6;
        display: block;
        margin-bottom: 6px;
      }
    }
  }

  .status-detail-content {
    padding-left: 24px;
    max-height: 200px;
    overflow-y: auto;
    word-break: break-word;
    line-height: 1.8;
    color: #606266;
    font-size: 13px;

    div {
      padding: 2px 0;
      position: relative;

      &:before {
        content: '•';
        position: absolute;
        left: -12px;
        color: #909399;
      }
    }
  }
}
</style>
