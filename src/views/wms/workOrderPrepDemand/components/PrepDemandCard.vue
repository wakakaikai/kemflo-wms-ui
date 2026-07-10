<template>
  <div class="prep-demand-card" :class="{ 'has-shortage': hasShortage }" @click="$emit('detail', row.id)">
    <div class="card-top">
      <div class="card-title">
        <span class="demand-no">{{ row.demandNo }}</span>
        <dict-tag :options="wms_prepare_demand_type" :value="row.demandType" />
        <el-tag v-if="row.isEmergency" type="danger" size="small" effect="dark">紧急</el-tag>
      </div>
      <dict-tag :options="wms_prepare_demand_status" :value="row.demandStatus" />
    </div>

    <div class="card-kit">
      <div class="kit-label">
        <span>齐套率</span>
        <strong :style="{ color: kitRateColor(displayKitRate) }">{{ formatKitRate(displayKitRate) }}%</strong>
      </div>
      <el-progress :percentage="kitRatePercent" :color="kitRateColor(displayKitRate)" :stroke-width="8" :show-text="false" />
    </div>

    <div class="card-metrics">
      <div class="metric-item metric-work-order">
        <span class="metric-label">工单</span>
        <span class="metric-value">{{ row.workOrderCount ?? 0 }}</span>
      </div>
      <div class="metric-item metric-required">
        <span class="metric-label">待发</span>
        <span class="metric-value">{{ formatQty(row.totalRequired) ?? '-' }}</span>
      </div>
      <div class="metric-item metric-available">
        <span class="metric-label">已发</span>
        <span class="metric-value">{{ formatQty(row.totalIssuedQty) ?? '-' }}</span>
      </div>
      <div class="metric-item metric-shortage" :class="{ danger: hasShortage }">
        <span class="metric-label">缺料</span>
        <span class="metric-value">{{ formatQty(row.totalShortage ?? 0) }}</span>
      </div>
    </div>

    <div class="card-tags">
      <el-tag :type="row.checkPassed ? 'success' : 'warning'" size="small" effect="plain">
        {{ row.checkPassed ? '库存通过' : '库存未通过' }}
      </el-tag>
      <el-tag v-if="row.shortageLines" type="danger" size="small" effect="plain">缺料 {{ row.shortageLines }} 行</el-tag>
      <span class="create-time">{{ row.createTime }}</span>
    </div>

    <div class="card-actions" @click.stop>
      <el-button link type="primary" @click="$emit('detail', row.id)" v-hasPermi="['wms:workOrderPrepDemand:query']">详情</el-button>
      <el-button v-if="row.issueId" link type="success" @click="$emit('issue', row.issueId)" v-hasPermi="['wms:materialIssue:query']">领料</el-button>
      <el-button link type="primary" @click="$emit('edit', row)" v-hasPermi="['wms:workOrderPrepDemand:edit']">修改</el-button>
      <el-button link type="danger" @click="$emit('delete', row)" v-hasPermi="['wms:workOrderPrepDemand:remove']">删除</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatQty, formatQtyWithUnit } from '@/utils/ruoyi';
import { computed, getCurrentInstance } from 'vue';
import type { ComponentInternalInstance } from 'vue';
import type { WorkOrderPrepDemandVO } from '@/api/wms/workOrderPrepDemand/types';
import { PREP_DEMAND_STATUS_DICT, PREP_DEMAND_TYPE_DICT } from '@/api/wms/workOrderPrepDemand/index';
import { formatKitRate, kitRateColor, kitRatePercentValue, resolvePrepDemandKitRate } from '@/api/wms/workOrderPrepDemand/index';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_prepare_demand_type, wms_prepare_demand_status } = toRefs<any>(
  proxy?.useDict(PREP_DEMAND_TYPE_DICT, PREP_DEMAND_STATUS_DICT)
);

const props = defineProps<{ row: WorkOrderPrepDemandVO }>();
defineEmits<{
  detail: [id: number | string];
  issue: [issueId: number | string];
  edit: [row: WorkOrderPrepDemandVO];
  delete: [row: WorkOrderPrepDemandVO];
}>();

const hasShortage = computed(() => Number(props.row.totalShortage ?? 0) > 0);
const displayKitRate = computed(() => resolvePrepDemandKitRate(props.row));
const kitRatePercent = computed(() => kitRatePercentValue(displayKitRate.value));
</script>

<style scoped lang="scss">
.prep-demand-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
    transform: translateY(-1px);
  }

  &.has-shortage {
    border-color: var(--el-color-warning-light-5);
  }
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.demand-no {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.kit-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.card-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.metric-item {
  padding: 8px 6px;
  border-radius: 8px;
  text-align: center;

  &.metric-work-order {
    background: var(--el-color-info-light-9);
  }

  &.metric-required {
    background: var(--el-color-warning-light-9);
  }

  &.metric-available {
    background: var(--el-color-success-light-9);
  }

  &.metric-shortage {
    background: var(--el-fill-color-light);

    &.danger {
      background: var(--el-color-danger-light-9);
    }
  }

  &.danger .metric-value {
    color: var(--el-color-danger);
  }
}

.metric-label {
  display: block;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.metric-value {
  display: block;
  margin-top: 2px;
  font-size: 15px;
  font-weight: 600;
}

.card-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.create-time {
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding-top: 4px;
  border-top: 1px dashed var(--el-border-color-lighter);
}
</style>
