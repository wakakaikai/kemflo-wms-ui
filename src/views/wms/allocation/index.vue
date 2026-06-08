<template>
  <div class="allocation-workbench p-2">
    <el-card shadow="never">
      <template #header>
        <div class="workbench-header">
          <div>
            <h2 class="title">工单发料工作台</h2>
            <p class="subtitle">选择工单 → 生成备料 → 确认执行 → 现场领料</p>
          </div>
          <div class="header-actions">
            <el-button type="warning" plain @click="showEmergencyDialog">
              <el-icon><Warning /></el-icon>紧急插单
            </el-button>
          </div>
        </div>
      </template>

      <el-steps :active="activeStep" finish-status="success" align-center class="workbench-steps">
        <el-step title="选择工单" description="勾选待发料工单" />
        <el-step title="备料清单" description="工单明细与备料汇总" />
        <el-step title="执行领料" description="生成发料单并领料" />
      </el-steps>

      <!-- Step 1 -->
      <div v-show="activeStep === 0" class="step-body">
        <div class="step-toolbar">
          <el-button type="primary" @click="showOrderSelection">
            <el-icon><Plus /></el-icon>选择工单
          </el-button>
          <el-button type="success" :disabled="selectedOrders.length === 0" :loading="generating" @click="generatePickingAndNext">
            <el-icon><MagicStick /></el-icon>生成备料
          </el-button>
          <span v-if="selectedOrders.length" class="hint">已选 {{ selectedOrders.length }} 个工单</span>
        </div>
        <el-table v-if="selectedOrders.length > 0" :data="selectedOrders" border size="small" max-height="420">
          <el-table-column prop="workOrderNo" label="工单号" min-width="120" />
          <el-table-column prop="itemDesc" label="产品描述" min-width="160" show-overflow-tooltip />
          <el-table-column label="计划数量" width="120">
            <template #default="{ row }">{{ row.plannedQty }} {{ row.unit }}</template>
          </el-table-column>
          <el-table-column prop="plannedStartDate" label="计划开始" width="110" />
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-button type="danger" link size="small" @click="removeOrder(row.workOrderNo)">移除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="请点击「选择工单」添加待发料工单" />
      </div>

      <!-- Step 2：备料清单 -->
      <div v-show="activeStep === 1" class="step-body">
        <div class="step-toolbar">
          <el-button @click="activeStep = 0">上一步</el-button>
          <el-button v-if="currentPlan?.planStatus === 'DRAFT'" type="success" :disabled="!currentPlan" @click="confirmCurrentPlan">
            确认备料
          </el-button>
          <el-button v-if="currentPlan?.planStatus === 'CONFIRMED'" type="primary" @click="showExecuteDialog">
            执行发料
          </el-button>
        </div>

        <el-empty v-if="!currentPlan" description="请返回上一步生成备料清单" />

        <template v-else>
          <el-alert
            v-if="selectedOrders.length > 1"
            type="info"
            :closable="false"
            show-icon
            class="picking-hint"
            title="已合并多个工单"
          >
            请查看「工单明细」了解各工单用料，「备料清单」可按物料或仓别汇总现场拣货。
          </el-alert>

          <el-descriptions :column="4" border size="small" class="plan-summary">
            <el-descriptions-item label="备料单号">{{ currentPlan.planNo }}</el-descriptions-item>
            <el-descriptions-item label="工单数">{{ currentPlan.workOrderCount }} 个</el-descriptions-item>
            <el-descriptions-item label="拣货点">{{ currentPlan.pickLocationCount }} 个</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="planStatusTag(currentPlan.planStatus)" size="small">{{ planStatusText(currentPlan.planStatus) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="齐套率">{{ ((currentPlan.avgKitRate || 0) * 100).toFixed(1) }}%</el-descriptions-item>
            <el-descriptions-item label="总距离">{{ (currentPlan.totalDistance || 0).toFixed(1) }} m</el-descriptions-item>
          </el-descriptions>

          <allocation-detail-view
            :plan="currentPlan"
            :details="planDetails"
            @confirm="confirmCurrentPlan"
            @execute="showExecuteDialog"
            @go-issue="goToMaterialIssue"
          />
        </template>
      </div>

      <!-- Step 3 -->
      <div v-show="activeStep === 2" class="step-body step-done">
        <el-result icon="success" title="发料单已就绪" sub-title="请在右侧抽屉完成领料登记与明细确认">
          <template #extra>
            <el-button @click="activeStep = 1">返回备料清单</el-button>
            <el-button v-if="currentIssueId" type="primary" @click="issueDrawerVisible = true">继续领料</el-button>
          </template>
        </el-result>
      </div>
    </el-card>

    <order-selection-dialog v-model="showOrderDialog" :selected-orders="selectedOrders" @confirm="handleOrderSelection" />
    <emergency-order-dialog v-model="showEmergencyDialogVisible" @confirm="handleEmergencyOrder" />
    <execute-confirm-dialog v-model="showExecuteDialogVisible" :plan="currentPlan" @confirm="executeAllocation" />
    <issue-process-drawer v-model="issueDrawerVisible" :issue-id="currentIssueId" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, MagicStick, Warning } from '@element-plus/icons-vue';

import OrderSelectionDialog from './components/OrderSelectionDialog.vue';
import AllocationDetailView from './components/AllocationDetailView.vue';
import EmergencyOrderDialog from './components/EmergencyOrderDialog.vue';
import ExecuteConfirmDialog from './components/ExecuteConfirmDialog.vue';
import IssueProcessDrawer from '@/views/wms/materialIssue/components/IssueProcessDrawer.vue';
import AllocationApi, { getPlanDetail } from '@/api/wms/allocation/index';
import { getMaterialIssueByPlan as fetchIssueByPlan } from '@/api/wms/materialIssue';
import type { WorkOrderVO, AllocationPlanVO, AllocationDetailVO } from '@/api/wms/allocation/types';
import { buildAllocationMaterialIssueItems } from './utils/workOrderMaterialIssue';
import { useUserStore } from '@/store/modules/user';

const userStore = useUserStore();
const activeStep = ref(0);
const generating = ref(false);

const showOrderDialog = ref(false);
const showEmergencyDialogVisible = ref(false);
const showExecuteDialogVisible = ref(false);
const issueDrawerVisible = ref(false);
const currentIssueId = ref<number | string | null>(null);

const selectedOrders = ref<WorkOrderVO[]>([]);
const currentPlan = ref<AllocationPlanVO | null>(null);
const currentPlanId = ref<number | null>(null);
const planDetails = ref<AllocationDetailVO[]>([]);

function normalizePlans(data: unknown): AllocationPlanVO[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as AllocationPlanVO[];
  return [data as AllocationPlanVO];
}

const planStatusText = (status: string) => {
  const map: Record<string, string> = {
    DRAFT: '草稿',
    CONFIRMED: '已确认',
    EXECUTING: '执行中',
    COMPLETED: '已完成',
    CANCELLED: '已取消'
  };
  return map[status] || status;
};

const planStatusTag = (status: string) => {
  const map: Record<string, string> = {
    DRAFT: 'info',
    CONFIRMED: 'success',
    EXECUTING: 'warning',
    COMPLETED: 'primary',
    CANCELLED: 'danger'
  };
  return map[status] || 'info';
};

const showOrderSelection = () => {
  showOrderDialog.value = true;
};

const handleOrderSelection = (orders: WorkOrderVO[]) => {
  selectedOrders.value = orders;
  showOrderDialog.value = false;
};

const removeOrder = (workOrderNo: string) => {
  selectedOrders.value = selectedOrders.value.filter((o) => o.workOrderNo !== workOrderNo);
};

const loadPlanDetail = async (planId: number) => {
  currentPlanId.value = planId;
  try {
    const response = await getPlanDetail(planId);
    if (response.code === 200) {
      const data = response.data;
      planDetails.value = data?.allocationDetails || (Array.isArray(data) ? data : []) || [];
      currentPlan.value = data?.planInfo || currentPlan.value;
    }
  } catch {
    ElMessage.error('获取备料明细失败');
  }
};

const generatePickingAndNext = async () => {
  if (selectedOrders.value.length === 0) {
    ElMessage.warning('请先选择工单');
    return;
  }
  generating.value = true;
  try {
    const workOrderNos = selectedOrders.value.map((o) => o.workOrderNo);
    const response = await AllocationApi.generateAllocation({
      workOrderNos,
      generateMultiple: false,
      materialIssueItems: buildAllocationMaterialIssueItems(selectedOrders.value)
    });
    if (response.code === 200) {
      const plans = normalizePlans(response.data);
      if (plans.length === 0) {
        ElMessage.warning('未生成备料清单');
        return;
      }
      currentPlan.value = plans[0];
      ElMessage.success('备料清单已生成');
      activeStep.value = 1;
      await loadPlanDetail(plans[0].id);
    }
  } catch {
    ElMessage.error('生成备料清单失败');
  } finally {
    generating.value = false;
  }
};

const confirmCurrentPlan = async () => {
  if (!currentPlanId.value) return;
  try {
    await ElMessageBox.confirm('确认后将锁定库存，不可再改备料清单。', '确认备料', { type: 'warning' });
    const response = await AllocationApi.confirmAllocation(currentPlanId.value, userStore.nickname || 'system');
    if (response.code === 200) {
      ElMessage.success('备料已确认');
      if (currentPlan.value) currentPlan.value.planStatus = 'CONFIRMED';
    }
  } catch {
    /* cancelled */
  }
};

const showEmergencyDialog = () => {
  showEmergencyDialogVisible.value = true;
};

const handleEmergencyOrder = async (emergencyData: unknown) => {
  try {
    const response = await AllocationApi.handleEmergency(emergencyData);
    if (response.code === 200) {
      ElMessage.success('紧急插单已处理');
      const plans = normalizePlans(response.data);
      const plan = Array.isArray(plans) ? plans[0] : (response.data as AllocationPlanVO);
      currentPlan.value = plan;
      activeStep.value = 1;
      if (plan?.id) await loadPlanDetail(plan.id);
      showEmergencyDialogVisible.value = false;
    }
  } catch {
    ElMessage.error('紧急插单失败');
  }
};

const showExecuteDialog = () => {
  if (!currentPlan.value) return;
  if (currentPlan.value.planStatus !== 'CONFIRMED') {
    ElMessage.warning('请先确认备料清单');
    return;
  }
  showExecuteDialogVisible.value = true;
};

const executeAllocation = async (operator: string) => {
  if (!currentPlanId.value) return;
  try {
    const response = await AllocationApi.executeAllocation(currentPlanId.value, operator);
    if (response.code === 200) {
      ElMessage.success('已生成发料单');
      const issueId = response.data?.issueOrder?.id;
      if (issueId) {
        currentIssueId.value = issueId;
        issueDrawerVisible.value = true;
        activeStep.value = 2;
      }
      if (currentPlan.value) currentPlan.value.planStatus = 'EXECUTING';
    }
  } catch {
    ElMessage.error('执行失败');
  }
};

const goToMaterialIssue = async () => {
  if (!currentPlanId.value) return;
  try {
    const res = await fetchIssueByPlan(currentPlanId.value);
    if (res.data?.id) {
      currentIssueId.value = res.data.id;
      issueDrawerVisible.value = true;
      activeStep.value = 2;
    } else {
      ElMessage.info('未找到发料单，请先执行备料');
    }
  } catch {
    ElMessage.error('查询发料单失败');
  }
};
</script>

<style scoped>
.workbench-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.workbench-steps {
  margin: 8px 0 24px;
}
.step-body {
  min-height: 320px;
}
.step-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.hint {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.picking-hint {
  margin-bottom: 16px;
}
.plan-summary {
  margin-bottom: 16px;
}
.step-done {
  padding: 24px 0;
}
</style>
