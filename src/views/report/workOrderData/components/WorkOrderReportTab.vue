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
        <!--        <el-table-column type="selection" width="55" align="center" />-->
        <el-table-column type="expand">
          <template #default="scope">
            <el-table :data="scope.row.mesShopOrderReportVoList" style="width: calc(100% - 50px); margin: 10px 0 10px 50px" empty-text="暂无数据">
              <el-table-column label="工单号" align="center" prop="shopOrder" />
              <el-table-column label="工作中心" align="center" prop="workCenter" />
              <el-table-column label="开工时间" align="center" prop="startDateTime" min-width="120" />
              <el-table-column label="完工时间" align="center" prop="endDateTime" min-width="120" />
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
              <el-table-column label="停止时间" align="center" prop="stopDuration" />
              <el-table-column label="异常时间" align="center" prop="abnormalDuration" />
              <el-table-column label="有效时长" align="center" prop="effectiveDuration" />
              <el-table-column label="实际人时" align="center" prop="personTime" />
            </el-table>
          </template>
        </el-table-column>
        <el-table-column label="工单号" align="center" prop="workOrderNo" />
        <el-table-column label="工序" align="center" prop="process" />
        <el-table-column label="工序名称" align="center" prop="processShortDesc" show-overflow-tooltip />
        <el-table-column label="产品料号" align="center" prop="material" />
        <el-table-column label="产品描述" align="left" prop="materialDesc" show-overflow-tooltip />
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
        <el-table-column label="速度稼动率" align="center" prop="speedRate" width="120">
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
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
  </div>
</template>

<script setup name="WorkOrderReport" lang="ts">
import { listWorkOrderReport } from '@/api/report/workOrder';
import { WorkOrderProcessForm, WorkOrderProcessQuery } from '@/api/wms/workOrderProcess/types';

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
    workOrderNo: '000130088653',
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

const loading = ref(false);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();

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
:deep(.custom-speed-progress-circle .el-progress-circle__track) {
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
}

.percentage-value {
  display: block;
  margin-top: 0px;
  font-size: 12px;
}
</style>
