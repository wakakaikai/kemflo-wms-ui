<template>
  <div class="mes-shop-order-report-detail">
    <el-page-header icon="ArrowLeft" @back="emit('back')">
      <template #content>
        <span class="detail-title">工单号 {{ shopOrder || '—' }}</span>
        <span class="detail-meta">报工ID：{{ reportId }}</span>
        <span v-if="workCenter" class="detail-meta">工作中心：{{ workCenter }}</span>
      </template>
    </el-page-header>

    <el-tabs v-model="activeTab" class="detail-tabs">
      <el-tab-pane name="employee">
        <template #label>
          <span>员工上线明细</span>
          <el-badge v-if="employeeList.length" :value="employeeList.length" :max="999" class="tab-badge" />
        </template>
        <el-table v-loading="loading" :data="employeeList" border fit height="calc(100vh - 280px)" empty-text="暂无数据">
          <el-table-column label="员工工号" align="center" prop="employeeId" min-width="120" />
          <el-table-column label="员工姓名" align="center" prop="employeeName" min-width="120" />
          <el-table-column label="上线时间" align="center" prop="onLineTime" min-width="170">
            <template #default="scope">{{ parseTime(scope.row.onLineTime) }}</template>
          </el-table-column>
          <el-table-column label="下线时间" align="center" prop="offLineTime" min-width="170">
            <template #default="scope">{{ parseTime(scope.row.offLineTime) }}</template>
          </el-table-column>
          <el-table-column label="出勤时长" align="right" prop="duration" min-width="120" />
          <el-table-column label="有效时长" align="right" prop="effectiveDuration" min-width="120" />
          <el-table-column label="操作时长" align="right" prop="operationDuration" min-width="120" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane name="abnormal">
        <template #label>
          <span>报工异常明细</span>
          <el-badge v-if="abnormalList.length" :value="abnormalList.length" :max="999" class="tab-badge" />
        </template>
        <el-table v-loading="loading" :data="abnormalList" border fit height="calc(100vh - 280px)" empty-text="暂无数据">
          <el-table-column label="停机开始" align="center" prop="shutdownStartTime" min-width="170">
            <template #default="scope">{{ parseTime(scope.row.shutdownStartTime) }}</template>
          </el-table-column>
          <el-table-column label="停机结束" align="center" prop="shutdownEndTime" min-width="170">
            <template #default="scope">{{ parseTime(scope.row.shutdownEndTime) }}</template>
          </el-table-column>
          <el-table-column label="停机原因" align="center" prop="shutdownReason" min-width="120">
            <template #default="scope">
              <dict-tag :options="mes_shutdown_reason" :value="scope.row.shutdownReason" />
            </template>
          </el-table-column>
          <el-table-column label="停机时长" align="right" prop="shutdownDuration" min-width="120" />
          <el-table-column label="有效停机时长" align="right" prop="effectiveShutdownDuration" min-width="120" />
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import type { ShopOrderReportAbnormalTimeVO, ShopOrderReportEmployeeVO } from '@/api/report/mesShopOrderReportData';
import { listMesShopOrderReportDataAbnormalTime, listMesShopOrderReportDataEmployee } from '@/api/report/mesShopOrderReportData';

const props = defineProps<{
  reportId: string | number;
  shopOrder?: string;
  workCenter?: string;
}>();

const emit = defineEmits<{ back: [] }>();

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { mes_shutdown_reason } = toRefs<any>(proxy?.useDict('mes_shutdown_reason'));

const activeTab = ref('employee');
const loading = ref(false);
const employeeList = ref<ShopOrderReportEmployeeVO[]>([]);
const abnormalList = ref<ShopOrderReportAbnormalTimeVO[]>([]);

const loadDetail = async () => {
  if (!props.reportId) {
    return;
  }
  loading.value = true;
  try {
    const [employeeRes, abnormalRes] = await Promise.all([listMesShopOrderReportDataEmployee({ reportId: props.reportId }), listMesShopOrderReportDataAbnormalTime({ reportId: props.reportId })]);
    employeeList.value = employeeRes.data || [];
    abnormalList.value = abnormalRes.data || [];
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.reportId,
  () => {
    activeTab.value = 'employee';
    loadDetail();
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.mes-shop-order-report-detail {
  padding: 0 4px;

  .detail-title {
    font-weight: 600;
    font-size: 16px;
    margin-right: 16px;
  }

  .detail-meta {
    margin-right: 16px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  .detail-tabs {
    margin-top: 12px;
  }

  .tab-badge {
    margin-left: 6px;
  }
}
</style>
