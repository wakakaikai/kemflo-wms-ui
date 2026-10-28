<template>
  <div class="p-2 mes-shop-order-report-data">
    <template v-if="!detailVisible">
      <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
        <div v-show="showSearch" class="mb-[10px]">
          <el-card shadow="hover">
            <el-form ref="queryFormRef" :model="queryParams" :rules="rules" :inline="true" label-width="auto">
              <el-form-item label="报工时间" prop="reportTimeRange">
                <el-date-picker v-model="queryParams.reportTimeRange" type="datetimerange" value-format="YYYY-MM-DD HH:mm:ss" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" :default-time="defaultReportTime" :shortcuts="shortcuts" clearable style="width: 360px" />
              </el-form-item>
              <el-form-item label="工单号" prop="shopOrder">
                <el-input v-model="queryParams.shopOrder" placeholder="请输入工单号" clearable style="width: 200px" @keyup.enter="handleQuery" />
              </el-form-item>
              <el-form-item label="工作中心" prop="workCenter">
                <el-input v-model="queryParams.workCenter" placeholder="请输入工作中心" clearable style="width: 200px" @keyup.enter="handleQuery" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" icon="Search" :loading="reportLoading" @click="handleQuery">查询</el-button>
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
              <el-button v-hasPermi="['mes:shopOrderReport:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
            </el-col>
            <right-toolbar v-model:showSearch="showSearch" @query-table="handleQuery" />
          </el-row>
        </template>

        <el-table v-loading="reportLoading" :data="reportList" border fit class="report-table">
          <el-table-column label="工单号" prop="shopOrder" min-width="165" fixed="left">
            <template #default="scope">
              <span class="link-type" @click="openReportDetail(scope.row)">{{ scope.row.shopOrder }}</span>
            </template>
          </el-table-column>
          <el-table-column label="工作中心" prop="workCenter" min-width="100" />
          <el-table-column label="开工时间" prop="startDateTime" min-width="170">
            <template #default="scope">{{ parseTime(scope.row.startDateTime) }}</template>
          </el-table-column>
          <el-table-column label="完工时间" prop="endDateTime" min-width="170">
            <template #default="scope">{{ parseTime(scope.row.endDateTime) }}</template>
          </el-table-column>
          <el-table-column label="良品数" prop="qtyReport" width="90" />
          <el-table-column label="起迄时长" prop="totalDuration" min-width="100" />
          <el-table-column label="休息时长" prop="restDuration" min-width="100" />
          <el-table-column label="操作时长" prop="loadDuration" min-width="100" />
          <el-table-column label="负荷时间" prop="effectiveDuration" min-width="100" />
          <el-table-column label="有效时长" prop="effectiveDuration" min-width="100" />
        </el-table>
        <pagination v-show="reportTotal > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="reportTotal" @pagination="getReportList" />
      </el-card>
    </template>

    <el-card v-else shadow="never">
      <mes-shop-order-report-detail v-if="selectedReport?.id" :report-id="selectedReport.id" :shop-order="selectedReport.shopOrder" :work-center="selectedReport.workCenter" @back="closeReportDetail" />
    </el-card>
  </div>
</template>

<script setup name="MesShopOrderReportData" lang="ts">
import type { ShopOrderReportVO } from '@/api/report/mesShopOrderReportData';
import { listMesShopOrderReportDataReport } from '@/api/report/mesShopOrderReportData';
import MesShopOrderReportDetail from './components/MesShopOrderReportDetail.vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const queryFormRef = ref<ElFormInstance>();
const showSearch = ref(true);
const detailVisible = ref(false);

const defaultReportTime: [Date, Date] = [new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59, 999)];

const shortcuts = [
  {
    text: '今天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '昨天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近两天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近三天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 2);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近一周',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近一月',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  }
];

const MAX_REPORT_RANGE_DAYS = 90;

const rules = {
  reportTimeRange: [{ required: true, message: '请选择报工时间范围', trigger: 'change' }]
};

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  shopOrder: undefined as string | undefined,
  workCenter: undefined as string | undefined,
  reportTimeRange: [] as string[]
});

const reportLoading = ref(false);
const reportList = ref<ShopOrderReportVO[]>([]);
const reportTotal = ref(0);
const selectedReport = ref<ShopOrderReportVO | null>(null);

const buildReportBody = () => {
  const body: Record<string, unknown> = {
    shopOrder: queryParams.shopOrder,
    workCenter: queryParams.workCenter,
    status: 3
  };
  const reportTimeRange = queryParams.reportTimeRange || [];
  if (reportTimeRange.length === 2 && reportTimeRange[0] && reportTimeRange[1]) {
    body.reportBeginTime = reportTimeRange[0];
    body.reportEndTime = reportTimeRange[1];
  }
  return body;
};

const hasReportTimeRange = () => {
  const reportTimeRange = queryParams.reportTimeRange || [];
  return reportTimeRange.length === 2 && !!reportTimeRange[0] && !!reportTimeRange[1];
};

const isReportTimeRangeWithinLimit = () => {
  const reportTimeRange = queryParams.reportTimeRange || [];
  const start = new Date(String(reportTimeRange[0]).replace(/-/g, '/'));
  const end = new Date(String(reportTimeRange[1]).replace(/-/g, '/'));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }
  const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= MAX_REPORT_RANGE_DAYS;
};

const validateReportTimeRange = () => {
  if (!hasReportTimeRange()) {
    proxy?.$modal.msgWarning('请选择报工时间范围');
    queryFormRef.value?.validateField('reportTimeRange').catch(() => undefined);
    return false;
  }
  if (!isReportTimeRangeWithinLimit()) {
    proxy?.$modal.msgWarning('报工时间范围最长不超过90天');
    return false;
  }
  return true;
};

const getReportList = async () => {
  if (!validateReportTimeRange()) {
    return;
  }
  reportLoading.value = true;
  try {
    const res = await listMesShopOrderReportDataReport({
      ...buildReportBody(),
      pageNum: queryParams.pageNum,
      pageSize: queryParams.pageSize
    });
    reportList.value = res.rows || [];
    reportTotal.value = Number(res.total) || 0;
  } finally {
    reportLoading.value = false;
  }
};

const openReportDetail = (row: ShopOrderReportVO) => {
  if (!row?.id) {
    return;
  }
  selectedReport.value = row;
  detailVisible.value = true;
};

const closeReportDetail = () => {
  detailVisible.value = false;
};

const handleQuery = () => {
  closeReportDetail();
  queryParams.pageNum = 1;
  getReportList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.shopOrder = undefined;
  queryParams.workCenter = undefined;
  queryParams.reportTimeRange = [];
  queryParams.pageNum = 1;
  queryParams.pageSize = 10;
  reportList.value = [];
  reportTotal.value = 0;
  selectedReport.value = null;
  closeReportDetail();
};

const handleExport = () => {
  if (!validateReportTimeRange()) {
    return;
  }
  proxy?.download('wms/report/shopOrderReport/export', buildReportBody(), `报工记录_${new Date().getTime()}.xlsx`);
};
</script>

<style scoped lang="scss">
.mes-shop-order-report-data {
  .section-title {
    font-weight: 600;
    font-size: 15px;
  }

  .report-table {
    width: 100%;
  }
}
</style>
