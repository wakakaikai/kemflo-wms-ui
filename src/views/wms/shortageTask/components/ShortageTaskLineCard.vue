<template>
  <div class="shortage-task-line-card" :class="{ 'is-open': isOpen }">
    <div class="card-top">
      <div class="card-demand-row">
        <span class="demand-no" :title="row.demandNo">{{ row.demandNo || '-' }}</span>
        <el-tag :type="lineStatusTag(row.lineStatus)" size="small">{{ lineStatusLabel(row.lineStatus) }}</el-tag>
      </div>
      <div v-if="row.createTime" class="card-time-row">{{ row.createTime }}</div>
      <div class="card-material-row">
        <span class="material-code">{{ row.materialCode || '-' }}</span>
        <span class="material-name" :title="row.materialName">{{ row.materialName || '-' }}</span>
      </div>
    </div>

    <div class="card-metrics">
      <div class="metric-item">
        <span class="metric-label">工单号</span>
        <span class="metric-value">{{ row.workOrderNo || '-' }}</span>
      </div>
      <div class="metric-item shortage">
        <span class="metric-label">缺料数量</span>
        <span class="metric-value">{{ formatQty(row.shortageQty) }}</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">待发</span>
        <span class="metric-value">{{ formatQty(row.pendingQty) }}</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">可用</span>
        <span class="metric-value">{{ formatQty(row.availableQty) }}</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">单位</span>
        <span class="metric-value">{{ row.unit || '-' }}</span>
      </div>
      <div class="metric-item inventory">
        <span class="metric-label">库存类型</span>
        <dict-tag :options="wms_inventory_special_flag" :value="inventoryFlag" />
      </div>
      <template v-if="showSalesOrderInfo">
        <div class="metric-item span-2">
          <span class="metric-label">销售单号</span>
          <span class="metric-value">{{ businessPartner.businessCode || row.salesOrderNo || '-' }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">项次</span>
          <span class="metric-value">{{ businessPartner.businessName || row.salesOrderItem || '-' }}</span>
        </div>
      </template>
    </div>

    <div v-if="!hideDemandAction && row.demandId" class="card-actions">
      <el-button
        link
        type="primary"
        size="small"
        @click="$emit('demand', row.demandId!)"
        v-hasPermi="['wms:workOrderPrepDemand:query']"
      >
        需求
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, toRefs, withDefaults } from 'vue';
import type { ShortageTaskLineVO } from '@/api/wms/shortageTask/types';
import {
  isPrepRowSpecialInventory,
  resolvePrepRowBusinessPartner,
  resolvePrepRowInventoryFlag
} from '@/api/wms/workOrderPrepDemand/index';
import { isShortageTaskOpen, lineStatusLabel, lineStatusTag } from '@/api/wms/shortageTask';

const props = withDefaults(defineProps<{ row: ShortageTaskLineVO; hideDemandAction?: boolean }>(), {
  hideDemandAction: false
});
defineEmits<{ demand: [demandId: number | string] }>();

const { proxy } = getCurrentInstance()!;
const { wms_inventory_special_flag } = toRefs<any>(proxy?.useDict('wms_inventory_special_flag'));

const inventoryFlag = computed(() => resolvePrepRowInventoryFlag(props.row));
const businessPartner = computed(() => resolvePrepRowBusinessPartner(props.row));
const showSalesOrderInfo = computed(() => {
  if (!isPrepRowSpecialInventory(props.row)) return false;
  const flag = String(inventoryFlag.value || '').toUpperCase();
  return flag === 'E' || !!businessPartner.value.businessCode || !!props.row.salesOrderNo;
});
const isOpen = computed(() => isShortageTaskOpen(props.row));

function formatQty(value?: number | string) {
  if (value == null || Number.isNaN(Number(value))) return '-';
  return Number(value);
}
</script>

<style scoped lang="scss">
.shortage-task-line-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-bg-color);
  border-top: 3px solid #f56c6c;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:hover {
    border-color: var(--el-color-danger-light-5);
    box-shadow: 0 4px 12px rgba(245, 108, 108, 0.08);
  }

  &.is-open {
    background: linear-gradient(180deg, #fff8f8 0%, var(--el-bg-color) 56px);
  }
}

.card-top {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-demand-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card-time-row {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.demand-no {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-material-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.material-code {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.material-name {
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.metric-item {
  padding: 7px 9px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  min-width: 0;

  &.span-2 {
    grid-column: span 2;
  }

  &.shortage .metric-value {
    color: var(--el-color-danger);
    font-weight: 700;
    font-size: 15px;
  }

  &.inventory {
    display: flex;
    flex-direction: column;
    gap: 4px;
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
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  line-height: 1.35;
  word-break: break-all;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
  border-top: 1px dashed var(--el-border-color-lighter);
}
</style>
