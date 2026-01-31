<template>
  <div class="allocation-container">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">工单发料管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="showOrderSelection">
              <el-icon><Plus /></el-icon>选择工单
            </el-button>
            <el-button type="success" :disabled="selectedOrders.length === 0" @click="generatePlans">
              <el-icon><MagicStick /></el-icon>智能分配
            </el-button>
            <el-button type="warning" @click="showEmergencyDialog">
              <el-icon><Warning /></el-icon>紧急插单
            </el-button>
          </div>
        </div>
      </template>

      <!-- 已选工单展示 -->
      <div v-if="selectedOrders.length >= 0" class="selected-orders">
        <div class="section-title">已选工单 ({{ selectedOrders.length }})</div>
        <el-table :data="selectedOrders" border size="small">
          <el-table-column prop="workOrderNo" label="工单号" />
          <el-table-column prop="itemDesc" label="产品描述" />
          <el-table-column prop="plannedQty" label="计划数量">
            <template #default="{ row }"> {{ row.plannedQty }} {{ row.unit }} </template>
          </el-table-column>
          <el-table-column prop="plannedStartDate" label="计划开始" />
          <el-table-column prop="plannedEndDate" label="计划完成" />
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-button type="danger" size="small" link @click="removeOrder(row.workOrderNo)"> 移除 </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分配方案展示 -->
      <div v-if="allocationPlans.length > 0" class="allocation-plans">
        <div class="section-title">
          <span>分配方案 ({{ allocationPlans.length }})</span>
          <el-button type="primary" size="small" @click="showComparison">
            <el-icon><TrendCharts /></el-icon>方案对比
          </el-button>
        </div>

        <el-row :gutter="20">
          <el-col v-for="plan in allocationPlans" :key="plan.id" :xs="24" :sm="12" :lg="8">
            <allocation-plan-card :plan="plan" :selected="selectedPlanId === plan.id" @select="selectPlan" @view-detail="viewPlanDetail" @confirm="confirmPlan" />
          </el-col>
        </el-row>
      </div>

      <!-- 方案详情 -->
      <div v-if="selectedPlanDetail" class="plan-detail">
        <div class="section-title">方案详情</div>
        <allocation-detail-view :plan="selectedPlanDetail" :details="planDetails" @execute="showExecuteDialog" />
      </div>
    </el-card>

    <!-- 工单选择对话框 -->
    <order-selection-dialog v-model="showOrderDialog" :selected-orders="selectedOrders" @confirm="handleOrderSelection" />

    <!-- 方案对比对话框 -->
    <plan-comparison-dialog v-model="showComparisonDialog" :plans="allocationPlans" />

    <!-- 紧急插单对话框 -->
    <emergency-order-dialog v-model="showEmergencyDialogVisible" @confirm="handleEmergencyOrder" />

    <!-- 执行确认对话框 -->
    <execute-confirm-dialog v-model="showExecuteDialogVisible" :plan="selectedPlanDetail" @confirm="executeAllocation" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, MagicStick, Warning, TrendCharts } from '@element-plus/icons-vue';
import dayjs from 'dayjs';

import OrderSelectionDialog from './components/OrderSelectionDialog.vue';
import AllocationPlanCard from './components/AllocationPlanCard.vue';
import AllocationDetailView from './components/AllocationDetailView.vue';
import PlanComparisonDialog from './components/PlanComparisonDialog.vue';
import EmergencyOrderDialog from './components/EmergencyOrderDialog.vue';
import ExecuteConfirmDialog from './components/ExecuteConfirmDialog.vue';
import AllocationApi from '@/api/wms/allocation/index';
import type { WorkOrderVO, AllocationPlanVO, AllocationDetailVO } from '@/api/wms/allocation/types';
// 响应式数据
const showOrderDialog = ref(false);
const showComparisonDialog = ref(false);
const showEmergencyDialogVisible = ref(false);
const showExecuteDialogVisible = ref(false);

const selectedOrders = ref<WorkOrderVO[]>([]);
const allocationPlans = ref<AllocationPlanVO[]>([]);
const selectedPlanId = ref<number | null>(null);
const selectedPlanDetail = ref<AllocationPlanVO | null>(null);
const planDetails = ref<AllocationDetailVO[]>([]);

// 格式化日期
const formatDate = (dateStr: string) => {
  return dayjs(dateStr).format('MM/DD HH:mm');
};

// 显示工单选择对话框
const showOrderSelection = () => {
  showOrderDialog.value = true;
};

// 处理工单选择
const handleOrderSelection = (orders: WorkOrderVO[]) => {
  selectedOrders.value = orders;
  showOrderDialog.value = false;
};

// 移除工单
const removeOrder = (workOrderNo: string) => {
  selectedOrders.value = selectedOrders.value.filter((order) => order.workOrderNo !== workOrderNo);
};

// 生成分配方案
const generatePlans = async () => {
  if (selectedOrders.value.length === 0) {
    ElMessage.warning('请先选择工单');
    return;
  }

  try {
    const workOrderNos = selectedOrders.value.map((order) => order.workOrderNo);
    const response = await AllocationApi.generateAllocation({
      workOrderNos,
      generateMultiple: true
    });

    if (response.code === 200) {
      allocationPlans.value = response.data;
      ElMessage.success(`成功生成 ${response.data.length} 个分配方案`);

      // 默认选择评分最高的方案
      if (response.data.length > 0) {
        const bestPlan = response.data.reduce((prev, current) => (prev.totalScore > current.totalScore ? prev : current));
        selectPlan(bestPlan.id);
      }
    }
  } catch (error) {
    ElMessage.error('生成分配方案失败');
    console.error(error);
  }
};

// 选择方案
const selectPlan = async (planId: number) => {
  selectedPlanId.value = planId;

  try {
    const response = await AllocationApi.getPlanDetail(planId);
    if (response.code === 200) {
      planDetails.value = response.data;
      selectedPlanDetail.value = allocationPlans.value.find((plan) => plan.id === planId) || null;
    }
  } catch (error) {
    ElMessage.error('获取方案详情失败');
    console.error(error);
  }
};

// 查看方案详情
const viewPlanDetail = (planId: number) => {
  selectPlan(planId);
};

// 确认方案
const confirmPlan = async (planId: number) => {
  try {
    await ElMessageBox.confirm('确认该分配方案？确认后将锁定库存，不可修改。', '确认分配方案', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    });

    const response = await AllocationApi.confirmAllocation(planId, 'system');
    if (response.code === 200) {
      ElMessage.success('方案确认成功');
      // 更新方案状态
      const plan = allocationPlans.value.find((p) => p.id === planId);
      if (plan) {
        plan.planStatus = 'CONFIRMED';
      }
    }
  } catch (error) {
    // 用户取消确认
  }
};

// 显示方案对比
const showComparison = () => {
  if (allocationPlans.value.length < 2) {
    ElMessage.warning('请先生成至少2个方案进行对比');
    return;
  }
  showComparisonDialog.value = true;
};

// 显示紧急插单对话框
const showEmergencyDialog = () => {
  showEmergencyDialogVisible.value = true;
};

// 处理紧急插单
const handleEmergencyOrder = async (emergencyData: any) => {
  try {
    const response = await AllocationApi.handleEmergency(emergencyData);
    if (response.code === 200) {
      ElMessage.success('紧急插单处理成功');
      // 添加新方案到列表
      allocationPlans.value.push(response.data);
      selectPlan(response.data.id);
      showEmergencyDialogVisible.value = false;
    }
  } catch (error) {
    ElMessage.error('紧急插单处理失败');
    console.error(error);
  }
};

// 显示执行对话框
const showExecuteDialog = () => {
  if (!selectedPlanDetail.value) return;

  if (selectedPlanDetail.value.planStatus !== 'CONFIRMED') {
    ElMessage.warning('请先确认分配方案');
    return;
  }

  showExecuteDialogVisible.value = true;
};

// 执行分配方案
const executeAllocation = async (operator: string) => {
  if (!selectedPlanId.value) return;

  try {
    const response = await AllocationApi.executeAllocation(selectedPlanId.value, operator);

    if (response.code === 200) {
      ElMessage.success('分配方案执行成功');
      showExecuteDialogVisible.value = false;

      // 重置状态
      selectedOrders.value = [];
      allocationPlans.value = [];
      selectedPlanId.value = null;
      selectedPlanDetail.value = null;
      planDetails.value = [];
    }
  } catch (error) {
    ElMessage.error('执行分配方案失败');
    console.error(error);
  }
};
</script>

<style scoped>
.allocation-container {
  padding: 20px;
}

.main-card {
  min-height: calc(100vh - 40px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 18px;
  font-weight: bold;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0 15px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
  font-size: 16px;
  font-weight: bold;
}

.selected-orders,
.allocation-plans,
.plan-detail {
  margin-top: 20px;
}

:deep(.el-table) {
  margin-top: 10px;
}

:deep(.el-col) {
  margin-bottom: 20px;
}
</style>
