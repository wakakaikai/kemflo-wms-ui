<template>
  <div class="allocation-workbench p-2">
    <el-card shadow="never">
      <template #header>
        <div class="workbench-header">
          <div>
            <h2 class="title">工单发料工作台</h2>
            <p class="subtitle">选择工单 → 智能分配 → 确认执行 → 现场领料</p>
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
        <el-step title="分配方案" description="生成并确认方案" />
        <el-step title="执行领料" description="生成发料单并领料" />
      </el-steps>

      <!-- Step 1 -->
      <div v-show="activeStep === 0" class="step-body">
        <div class="step-toolbar">
          <el-button type="primary" @click="showOrderSelection">
            <el-icon><Plus /></el-icon>选择工单
          </el-button>
          <el-button type="success" :disabled="selectedOrders.length === 0" @click="generatePlansAndNext">
            <el-icon><MagicStick /></el-icon>智能分配
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

      <!-- Step 2 -->
      <div v-show="activeStep === 1" class="step-body">
        <div class="step-toolbar">
          <el-button @click="activeStep = 0">上一步</el-button>
          <el-button v-if="allocationPlans.length >= 2" type="info" plain @click="showComparison">
            <el-icon><TrendCharts /></el-icon>方案对比
          </el-button>
        </div>
        <el-empty v-if="allocationPlans.length === 0" description="请返回上一步生成方案" />
        <el-row v-else :gutter="16">
          <el-col v-for="plan in allocationPlans" :key="plan.id" :xs="24" :sm="12" :lg="8">
            <allocation-plan-card
              :plan="plan"
              :selected="selectedPlanId === plan.id"
              @select="selectPlan"
              @view-detail="viewPlanDetail"
              @confirm="confirmPlan"
              @execute="onPlanCardExecute"
            />
          </el-col>
        </el-row>
        <div v-if="selectedPlanDetail" class="plan-detail-panel">
          <div class="panel-title">方案明细</div>
          <allocation-detail-view
            :plan="selectedPlanDetail"
            :details="planDetails"
            @execute="showExecuteDialog"
            @go-issue="goToMaterialIssue"
          />
        </div>
      </div>

      <!-- Step 3 hint -->
      <div v-show="activeStep === 2" class="step-body step-done">
        <el-result icon="success" title="发料单已就绪" sub-title="请在右侧抽屉完成领料登记与明细确认">
          <template #extra>
            <el-button @click="activeStep = 1">返回方案</el-button>
            <el-button v-if="currentIssueId" type="primary" @click="issueDrawerVisible = true">继续领料</el-button>
          </template>
        </el-result>
      </div>
    </el-card>

    <order-selection-dialog v-model="showOrderDialog" :selected-orders="selectedOrders" @confirm="handleOrderSelection" />
    <plan-comparison-dialog v-model="showComparisonDialog" :plans="allocationPlans" />
    <emergency-order-dialog v-model="showEmergencyDialogVisible" @confirm="handleEmergencyOrder" />
    <execute-confirm-dialog v-model="showExecuteDialogVisible" :plan="selectedPlanDetail" @confirm="executeAllocation" />
    <issue-process-drawer v-model="issueDrawerVisible" :issue-id="currentIssueId" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, MagicStick, Warning, TrendCharts } from '@element-plus/icons-vue';

import OrderSelectionDialog from './components/OrderSelectionDialog.vue';
import AllocationPlanCard from './components/AllocationPlanCard.vue';
import AllocationDetailView from './components/AllocationDetailView.vue';
import PlanComparisonDialog from './components/PlanComparisonDialog.vue';
import EmergencyOrderDialog from './components/EmergencyOrderDialog.vue';
import ExecuteConfirmDialog from './components/ExecuteConfirmDialog.vue';
import IssueProcessDrawer from '@/views/wms/materialIssue/components/IssueProcessDrawer.vue';
import AllocationApi, { getPlanDetail } from '@/api/wms/allocation/index';
import { getMaterialIssueByPlan as fetchIssueByPlan } from '@/api/wms/materialIssue';
import type { WorkOrderVO, AllocationPlanVO, AllocationDetailVO } from '@/api/wms/allocation/types';
import { useUserStore } from '@/store/modules/user';

const userStore = useUserStore();
const activeStep = ref(0);

const showOrderDialog = ref(false);
const showComparisonDialog = ref(false);
const showEmergencyDialogVisible = ref(false);
const showExecuteDialogVisible = ref(false);
const issueDrawerVisible = ref(false);
const currentIssueId = ref<number | string | null>(null);

const selectedOrders = ref<WorkOrderVO[]>([]);
const allocationPlans = ref<AllocationPlanVO[]>([]);
const selectedPlanId = ref<number | null>(null);
const selectedPlanDetail = ref<AllocationPlanVO | null>(null);
const planDetails = ref<AllocationDetailVO[]>([]);

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

const generatePlansAndNext = async () => {
  if (selectedOrders.value.length === 0) {
    ElMessage.warning('请先选择工单');
    return;
  }
  try {
    const workOrderNos = selectedOrders.value.map((o) => o.workOrderNo);
    const response = await AllocationApi.generateAllocation({ workOrderNos, generateMultiple: true });
    if (response.code === 200) {
      allocationPlans.value = response.data;
      ElMessage.success(`已生成 ${response.data.length} 个方案`);
      activeStep.value = 1;
      if (response.data.length > 0) {
        const best = response.data.reduce((a, b) => (a.totalScore > b.totalScore ? a : b));
        selectPlan(best.id);
      }
    }
  } catch {
    ElMessage.error('生成分配方案失败');
  }
};

const selectPlan = async (planId: number) => {
  selectedPlanId.value = planId;
  try {
    const response = await getPlanDetail(planId);
    if (response.code === 200) {
      const data = response.data;
      planDetails.value = data?.allocationDetails || data || [];
      selectedPlanDetail.value = data?.planInfo || allocationPlans.value.find((p) => p.id === planId) || null;
    }
  } catch {
    ElMessage.error('获取方案详情失败');
  }
};

const viewPlanDetail = (planId: number) => selectPlan(planId);

const confirmPlan = async (planId: number) => {
  try {
    await ElMessageBox.confirm('确认后将锁定库存，不可再改方案。', '确认分配方案', { type: 'warning' });
    const response = await AllocationApi.confirmAllocation(planId, userStore.nickname || 'system');
    if (response.code === 200) {
      ElMessage.success('方案已确认');
      const plan = allocationPlans.value.find((p) => p.id === planId);
      if (plan) plan.planStatus = 'CONFIRMED';
      if (selectedPlanDetail.value?.id === planId) selectedPlanDetail.value.planStatus = 'CONFIRMED';
    }
  } catch {
    /* cancelled */
  }
};

const showComparison = () => {
  if (allocationPlans.value.length < 2) {
    ElMessage.warning('需要至少 2 个方案才能对比');
    return;
  }
  showComparisonDialog.value = true;
};

const showEmergencyDialog = () => {
  showEmergencyDialogVisible.value = true;
};

const handleEmergencyOrder = async (emergencyData: unknown) => {
  try {
    const response = await AllocationApi.handleEmergency(emergencyData);
    if (response.code === 200) {
      ElMessage.success('紧急插单已处理');
      allocationPlans.value.push(response.data);
      activeStep.value = 1;
      selectPlan(response.data.id);
      showEmergencyDialogVisible.value = false;
    }
  } catch {
    ElMessage.error('紧急插单失败');
  }
};

const showExecuteDialog = () => {
  if (!selectedPlanDetail.value) return;
  if (selectedPlanDetail.value.planStatus !== 'CONFIRMED') {
    ElMessage.warning('请先确认分配方案');
    return;
  }
  showExecuteDialogVisible.value = true;
};

const executeAllocation = async (operator: string) => {
  if (!selectedPlanId.value) return;
  try {
    const response = await AllocationApi.executeAllocation(selectedPlanId.value, operator);
    if (response.code === 200) {
      ElMessage.success('已生成发料单');
      const issueId = response.data?.issueOrder?.id;
      if (issueId) {
        currentIssueId.value = issueId;
        issueDrawerVisible.value = true;
        activeStep.value = 2;
      }
      if (selectedPlanDetail.value) selectedPlanDetail.value.planStatus = 'EXECUTING';
    }
  } catch {
    ElMessage.error('执行失败');
  }
};

const onPlanCardExecute = (planId: number) => {
  selectPlan(planId);
  showExecuteDialog();
};

const goToMaterialIssue = async () => {
  if (!selectedPlanId.value) return;
  try {
    const res = await fetchIssueByPlan(selectedPlanId.value);
    if (res.data?.id) {
      currentIssueId.value = res.data.id;
      issueDrawerVisible.value = true;
      activeStep.value = 2;
    } else {
      ElMessage.info('未找到发料单，请先执行方案');
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
.plan-detail-panel {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.panel-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
}
.step-done {
  padding: 24px 0;
}
</style>
