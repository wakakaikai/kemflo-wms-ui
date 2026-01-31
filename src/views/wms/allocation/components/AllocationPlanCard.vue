<!-- views/allocation/components/AllocationPlanCard.vue -->
<template>
  <el-card class="plan-card" :class="{ 'selected': isSelected, 'confirmed': plan.planStatus === 'CONFIRMED' }" shadow="hover" @click="$emit('select', plan.id)">
    <template #header>
      <div class="plan-header">
        <div class="plan-title">
          <h4>{{ plan.planName }}</h4>
          <el-tag :type="getStatusTagType(plan.planStatus)" size="small">
            {{ getStatusText(plan.planStatus) }}
          </el-tag>
          <el-tag :type="getStrategyTagType(plan.strategyType)" size="small" class="strategy-tag">
            {{ plan.strategyTypeDesc }}
          </el-tag>
        </div>
        <div class="plan-score">
          <span class="score-label">综合评分</span>
          <span class="score-value">{{ plan.totalScore.toFixed(1) }}</span>
        </div>
      </div>
    </template>

    <div class="plan-content">
      <div class="plan-stats">
        <div class="stat-item">
          <span class="stat-label">工单数</span>
          <span class="stat-value">{{ plan.workOrderCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">拣货点</span>
          <span class="stat-value">{{ plan.pickLocationCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">总距离</span>
          <span class="stat-value">{{ plan.totalDistance.toFixed(1) }}m</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">齐套率</span>
          <span class="stat-value">{{ (plan.avgKitRate * 100).toFixed(1) }}%</span>
        </div>
      </div>

      <div class="plan-description">
        {{ plan.description }}
      </div>

      <div class="plan-actions">
        <el-button type="primary" size="small" @click.stop="$emit('view-detail', plan.id)"> 查看详情 </el-button>

        <el-button v-if="plan.planStatus === 'DRAFT'" type="success" size="small" @click.stop="$emit('confirm', plan.id)"> 确认方案 </el-button>

        <el-button v-if="plan.planStatus === 'CONFIRMED'" type="warning" size="small" @click.stop="$emit('execute', plan.id)"> 执行方案 </el-button>
      </div>
    </div>

    <template #footer>
      <div class="plan-footer">
        <span class="create-time">{{ formatDate(plan.createTime) }}</span>
        <span class="order-count">{{ plan.workOrderNos.length }}个工单</span>
      </div>
    </template>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import dayjs from 'dayjs';
import type { AllocationPlanVO } from '@/api/wms/allocation/types';

interface Props {
  plan: AllocationPlanVO;
  selected?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['select', 'view-detail', 'confirm', 'execute']);

const isSelected = computed(() => props.selected);

const formatDate = (dateStr: string) => {
  return dayjs(dateStr).format('MM/DD HH:mm');
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'DRAFT': '草稿',
    'CONFIRMED': '已确认',
    'EXECUTING': '执行中',
    'COMPLETED': '已完成',
    'CANCELLED': '已取消'
  };
  return statusMap[status] || status;
};

const getStatusTagType = (status: string) => {
  const typeMap: Record<string, string> = {
    'DRAFT': 'info',
    'CONFIRMED': 'success',
    'EXECUTING': 'warning',
    'COMPLETED': 'primary',
    'CANCELLED': 'danger'
  };
  return typeMap[status] || 'info';
};

const getStrategyTagType = (strategy: string) => {
  const typeMap: Record<string, string> = {
    'FIFO_STRICT': 'warning',
    'HIGH_KIT': 'success',
    'EFFICIENCY': 'info',
    'BALANCED': 'primary',
    'EMERGENCY': 'danger'
  };
  return typeMap[strategy] || 'info';
};
</script>

<style scoped>
.plan-card {
  cursor: pointer;
  transition: all 0.3s ease;
  height: 100%;
  border: 2px solid transparent;
}

.plan-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.plan-card.selected {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.plan-card.confirmed {
  border-left: 4px solid #67c23a;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.plan-title h4 {
  margin: 0 0 5px 0;
  font-size: 16px;
  color: #303133;
}

.plan-title .el-tag {
  margin-right: 5px;
}

.strategy-tag {
  margin-left: 5px;
}

.plan-score {
  text-align: right;
  min-width: 60px;
}

.score-label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 2px;
}

.score-value {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.plan-content {
  margin: 15px 0;
}

.plan-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 15px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
}

.plan-description {
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 15px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 4px;
}

.plan-actions {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.plan-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
}

.create-time {
  color: #606266;
}

.order-count {
  font-weight: bold;
}
</style>
