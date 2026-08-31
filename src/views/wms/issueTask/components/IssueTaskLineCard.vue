<template>
  <div class="issue-task-line-card" :class="{ 'is-pending': isLineIssueable, 'is-selected': selected, 'has-select-box': selectable }" :style="{ '--status-border-color': statusBorderColor }">
    <div v-if="selectable" class="card-select-box" @click.stop>
      <el-checkbox :model-value="selected" @change="(val: boolean | string | number) => $emit('toggle-select', row, !!val)" />
    </div>
    <div class="card-top">
      <div class="card-header-row">
        <div class="card-header-main">
          <el-tag v-if="row.isEmergency" type="danger" size="small" effect="dark">紧急</el-tag>
          <span class="work-order-no" :title="row.workOrderNo">{{ row.workOrderNo || '-' }}</span>
        </div>
        <div class="card-header-tags">
          <span class="demand-no" :title="row.demandNo">{{ row.demandNo || '-' }}</span>
          <el-tag :type="lineStatusTag(row.lineStatus)" size="small" effect="dark">{{ lineStatusLabel(row.lineStatus) }}</el-tag>
        </div>
      </div>
      <div class="card-material-row">
        <div class="material-main">
          <span class="material-code">{{ row.materialCode || '-' }}</span>
          <span class="material-name" :title="row.materialName">{{ row.materialName || '-' }}</span>
        </div>
      </div>
    </div>

    <div v-if="showLocationFlow" class="location-flow card-data-grid">
      <div v-if="showLocation" class="location-node location-node--source">
        <span class="location-node-label">原始库位</span>
        <span class="location-node-code" :title="sourceLocationTitle">{{ sourceLocationCode }}</span>
        <span v-if="sourceLocationName" class="location-node-desc" :title="sourceLocationName">{{ sourceLocationName }}</span>
      </div>
      <div v-else class="location-flow-placeholder" />
      <div class="location-flow-arrow" aria-hidden="true">
        <el-icon v-if="showLocation && (showTargetLocation || materialUserLabel !== '-')" class="location-flow-icon"><Right /></el-icon>
      </div>
      <div v-if="showTargetLocation || materialUserLabel !== '-'" class="location-node location-node--target location-node--combined">
        <div v-if="materialUserLabel !== '-'" class="location-node-inline location-node-inline--user">
          <span class="location-node-label">需求人</span>
          <span class="location-node-code" :title="materialUserLabel">{{ materialUserLabel }}</span>
        </div>
        <div v-if="materialUserLabel !== '-' && showTargetLocation" class="location-node-split" aria-hidden="true" />
        <div v-if="showTargetLocation" class="location-node-inline location-node-inline--target">
          <span class="location-node-label">目标库位</span>
          <span class="location-node-code" :title="targetLocationTitle">{{ targetLocationCode }}</span>
        </div>
      </div>
      <div v-else class="location-flow-placeholder" />
    </div>

    <div class="card-metrics card-data-grid">
      <div class="metric-item">
        <span class="metric-label">预留号</span>
        <span class="metric-value">{{ row.reserveNo || '-' }}</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">预留项次</span>
        <span class="metric-value">{{ row.reserveItemNo || '-' }}</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">批次</span>
        <span class="metric-value">{{ row.batchCode || '-' }}</span>
      </div>
      <div class="metric-item highlight primary">
        <span class="metric-label">待发</span>
        <span class="metric-value">{{ formatQtyWithUnit(row.issueQty, row.inventoryUnit) }}</span>
      </div>
      <div class="metric-item highlight">
        <span class="metric-label">已发</span>
        <span class="metric-value">{{ formatQtyWithUnit(row.issuedQty, row.inventoryUnit) }}</span>
      </div>
      <div class="metric-item highlight success actual-issue">
        <span class="metric-label">
          实发
          <span v-if="canEditActualIssue" class="actual-issue-unit">（{{ row.inventoryUnit }}）</span>
        </span>
        <div v-if="canEditActualIssue" class="actual-issue-editor">
          <el-input-number v-model="actualIssueQty" :min="0" :precision="3" :step="1" controls-position="right" size="small" class="actual-issue-input-inline" />
        </div>
        <span v-else class="metric-value">{{ formatQtyWithUnit(displayActualIssueQty, row.inventoryUnit) }}</span>
      </div>
    </div>

    <div class="card-tags">
      <div class="card-tags-left">
        <el-tag :type="warehouseRouteTag(row.warehouseRoute)" size="small" effect="plain">
          {{ warehouseRouteLabel(row.warehouseRoute) }}
        </el-tag>
        <el-popover v-if="isUserSelectedLocation" placement="top" :width="280" trigger="hover" :show-after="80" :show-arrow="true">
          <template #reference>
            <el-tag type="danger" size="small" effect="plain" class="tag-popover-trigger">用户选择</el-tag>
          </template>
          <div class="recommendation-reason-popover">
            <div class="recommendation-reason-title">选择原因</div>
            <div class="recommendation-reason-value">{{ userSelectedReason || '-' }}</div>
          </div>
        </el-popover>
        <el-tag v-else-if="row.recommendationSource == 'SYSTEM_RECOMMENDED'" type="primary" size="small" effect="plain">系统推荐</el-tag>
        <el-popover v-if="isSpecialInventory" v-model:visible="partnerPopoverVisible" placement="top" :width="280" trigger="hover" :show-arrow="true">
          <template #reference>
            <span class="inventory-flag-trigger" @mouseenter="openPartnerPopover" @mouseleave="closePartnerPopoverLater" @click.stop="togglePartnerPopover">
              <dict-tag :options="wms_inventory_special_flag" :value="inventoryFlag" />
            </span>
          </template>
          <div class="partner-popover" @mouseenter="openPartnerPopover" @mouseleave="closePartnerPopoverLater">
            <div class="partner-popover-title">特殊库存明细</div>
            <div class="partner-popover-row">
              <span class="partner-popover-label">业务伙伴</span>
              <span class="partner-popover-value" :title="businessPartner.businessCode">{{ businessPartner.businessCode || '-' }}</span>
            </div>
            <div class="partner-popover-row">
              <span class="partner-popover-label">伙伴名称</span>
              <span class="partner-popover-value" :title="businessPartner.businessName">{{ businessPartner.businessName || '-' }}</span>
            </div>
          </div>
        </el-popover>
        <dict-tag v-else :options="wms_inventory_special_flag" :value="inventoryFlag" />
      </div>
    </div>

    <div class="card-actions card-actions-main">
      <el-button color="#626aef" size="small" icon="Printer" @click="$emit('print', row)">打印</el-button>
      <template v-if="canShowIssue">
        <el-tooltip v-if="!canExecute" content="缺少需求单或库位信息" placement="top">
          <el-button link type="success" size="small" disabled v-hasPermi="['wms:materialIssue:issue']">{{ issueActionLabel }}</el-button>
        </el-tooltip>
        <el-button v-else-if="canExecute" type="primary" size="small" @click="$emit('issue', row)" v-hasPermi="['wms:materialIssue:issue']"> {{ issueActionLabel }} </el-button>
      </template>
    </div>
    <div v-if="!canShowIssue && isLineCompleted" class="card-actions card-remark">
      <span class="remark-label">备注</span>
      <span class="remark-text" :title="lineRemark">{{ lineRemark || '-' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, ref, toRefs, watch } from 'vue';
import { Right } from '@element-plus/icons-vue';
import type { IssueTaskLineVO } from '@/api/wms/issueTask/types';
import { isPrepRowSpecialInventory, resolvePrepRowBusinessPartner, resolvePrepRowInventoryFlag, resolvePrepRowLocationAdjustRemark } from '@/api/wms/workOrderPrepDemand/index';
import { canExecuteIssueTaskLine261, canIssueTaskLine261, canEditIssueTaskLineActualIssue, getIssueTaskLineActionLabel, isIssueTaskLineCompleted, isIssueTaskLineIssueable, lineStatusBadgeColor, lineStatusLabel, lineStatusTag, resolveIssueTaskLineRemark, resolveLineActualIssueQty, resolveLineIssuedQty, syncIssueTaskLineActualIssueDefault, warehouseRouteLabel, warehouseRouteTag } from '@/api/wms/issueTask';

const props = withDefaults(
  defineProps<{
    row: IssueTaskLineVO;
    selectable?: boolean;
    selected?: boolean;
  }>(),
  {
    selectable: false,
    selected: false
  }
);
const emit = defineEmits<{
  issue: [row: IssueTaskLineVO];
  print: [row: IssueTaskLineVO];
  'toggle-select': [row: IssueTaskLineVO, selected: boolean];
  'actual-issue-change': [row: IssueTaskLineVO, value: number | undefined];
}>();

const { proxy } = getCurrentInstance()!;
const { wms_inventory_special_flag } = toRefs<any>(proxy?.useDict('wms_inventory_special_flag'));

const inventoryFlag = computed(() => resolvePrepRowInventoryFlag(props.row));
const businessPartner = computed(() => resolvePrepRowBusinessPartner(props.row));
const isSpecialInventory = computed(() => isPrepRowSpecialInventory(props.row));
const isUserSelectedLocation = computed(() => String(props.row.recommendationSource || '').toUpperCase() === 'USER_SELECTED');
const userSelectedReason = computed(() => resolvePrepRowLocationAdjustRemark(props.row));
const partnerPopoverVisible = ref(false);
let partnerPopoverTimer: ReturnType<typeof setTimeout> | undefined;

const openPartnerPopover = () => {
  if (!isSpecialInventory.value) return;
  if (partnerPopoverTimer) clearTimeout(partnerPopoverTimer);
  partnerPopoverVisible.value = true;
};

const closePartnerPopoverLater = () => {
  partnerPopoverTimer = setTimeout(() => {
    partnerPopoverVisible.value = false;
  }, 120);
};

const togglePartnerPopover = () => {
  if (!isSpecialInventory.value) return;
  if (partnerPopoverTimer) clearTimeout(partnerPopoverTimer);
  partnerPopoverVisible.value = !partnerPopoverVisible.value;
};
const isLineIssueable = computed(() => isIssueTaskLineIssueable(props.row.lineStatus));
const isLineCompleted = computed(() => isIssueTaskLineCompleted(props.row.lineStatus));
const lineRemark = computed(() => resolveIssueTaskLineRemark(props.row));
const canShowIssue = computed(() => canIssueTaskLine261(props.row));
const canExecute = computed(() => canExecuteIssueTaskLine261(props.row));
const issueActionLabel = computed(() => getIssueTaskLineActionLabel(props.row));
const statusBorderColor = computed(() => lineStatusBadgeColor(props.row.lineStatus));
const isFlatWarehouse = computed(() => String(props.row.warehouseRoute || '').toUpperCase() === 'FLAT');
const showLocation = computed(() => {
  const code = String(props.row.locationCode || '').trim();
  return !!code && code !== '-';
});

const sourceLocationCode = computed(() => String(props.row.locationCode || '').trim() || '-');
const sourceLocationName = computed(() => String(props.row.locationName || '').trim());
const sourceLocationTitle = computed(() => sourceLocationName.value || sourceLocationCode.value);

const targetLocationCode = computed(() => String(props.row.targetDemandLocationCode || '').trim() || '-');
const showTargetLocation = computed(() => targetLocationCode.value !== '-');
const showLocationFlow = computed(() => showLocation.value || showTargetLocation.value || materialUserLabel.value !== '-');
const targetLocationTitle = computed(() => {
  const desc = String(props.row.targetDemandLocationCodeDesc || '').trim();
  if (desc && targetLocationCode.value !== '-') return `${targetLocationCode.value}（${desc}）`;
  return targetLocationCode.value;
});

const materialUserLabel = computed(() => String(props.row.materialUserName || '').trim() || '-');

const pendingIssueQty = computed(() => {
  const qty = Number(props.row.issueQty ?? 0);
  return Number.isFinite(qty) && qty > 0 ? qty : undefined;
});

const issueUnit = computed(() => String(props.row.inventoryUnit || '').trim());

function resolveEffectiveActualIssueQty(actual?: number | string | null, pending?: number) {
  return resolveLineActualIssueQty({
    actualIssueQty: actual,
    issueQty: pending
  });
}

const canEditActualIssue = computed(() => canEditIssueTaskLineActualIssue(props.row));

const displayActualIssueQty = computed(() => resolveEffectiveActualIssueQty(props.row.actualIssueQty, pendingIssueQty.value));

const actualIssueQty = computed({
  get() {
    return displayActualIssueQty.value;
  },
  set(value: number | undefined) {
    emit('actual-issue-change', props.row, value);
  }
});

const syncActualIssueDefault = () => {
  syncIssueTaskLineActualIssueDefault(props.row);
};

watch(() => props.row.id, syncActualIssueDefault, { immediate: true });
watch(pendingIssueQty, syncActualIssueDefault);

function formatQty(value?: number | string) {
  if (value == null || Number.isNaN(Number(value))) return '-';
  return Number(value);
}

function formatQtyWithUnit(value?: number | string, unit?: string) {
  const qtyText = formatQty(value);
  if (qtyText === '-') return '-';
  const unitText = String(unit || '').trim();
  return unitText ? `${qtyText} ${unitText}` : qtyText;
}
</script>

<style scoped lang="scss">
.issue-task-line-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 10px 12px;
  align-self: stretch;
  height: fit-content;
  border: 2px solid var(--status-border-color, var(--el-border-color));
  border-radius: 10px;
  background: var(--el-bg-color);
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    transform 0.2s;

  &.is-selected {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.18);
  }

  &:hover {
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
    transform: translateY(-1px);
  }

  &.is-pending {
    background: linear-gradient(180deg, rgba(64, 158, 255, 0.04) 0%, var(--el-bg-color) 72px);
  }
}

.card-select-box {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
}

.card-top {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.has-select-box .card-top {
  padding-left: 28px;
}

.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card-header-main {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.card-header-tags {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  max-width: 52%;
}

.demand-no {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.work-order-no {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-material-row {
  display: flex;
  align-items: flex-start;
  min-width: 0;
}

.material-main {
  flex: 1;
  min-width: 0;
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
  display: block;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-data-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  align-items: stretch;
}

.location-flow {
  grid-template-columns: minmax(0, 1fr) 18px minmax(0, 1.45fr);
  gap: 4px;
  margin-top: 2px;
}

.location-node {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  min-height: 100%;
  padding: 6px 8px;
  border-radius: 6px;
  background: var(--el-bg-color);
  border: 1px solid transparent;
}

.location-node-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.location-node--combined {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8px;
  min-width: 0;
}

.location-node-inline {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  min-width: 0;
  overflow: hidden;
}

.location-node-inline--user {
  flex: 0 1 32%;
  max-width: 36%;
}

.location-node-inline--target {
  flex: 1 1 0;
  min-width: 0;
}

.location-node--combined .location-node-inline:only-child {
  flex: 1 1 0;
  max-width: none;
}

.location-node--combined .location-node-inline .location-node-label {
  flex-shrink: 0;
  white-space: nowrap;
}

.location-node--combined .location-node-inline .location-node-code {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location-node-split {
  width: 1px;
  align-self: stretch;
  margin: 1px 0;
  background: var(--el-border-color-lighter);
  flex-shrink: 0;
}

.location-node--source {
  border-color: rgba(64, 158, 255, 0.22);
  background: linear-gradient(180deg, rgba(64, 158, 255, 0.08) 0%, var(--el-bg-color) 100%);

  .location-node-label {
    color: var(--el-color-primary);
  }

  .location-node-code {
    color: var(--el-color-primary);
  }
}

.location-node--target {
  border-color: rgba(230, 162, 60, 0.28);
  background: linear-gradient(180deg, rgba(230, 162, 60, 0.1) 0%, var(--el-bg-color) 100%);

  .location-node-label {
    color: var(--el-color-warning);
  }

  .location-node-code {
    color: #c77d1a;
  }
}

.location-node-label {
  font-size: 11px;
  line-height: 1.2;
  font-weight: 600;
}

.location-node-code {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
  min-width: 0;
  word-break: break-all;
  overflow-wrap: anywhere;
}

.location-node-desc {
  font-size: 11px;
  line-height: 1.3;
  color: var(--el-text-color-secondary);
  word-break: break-all;
  overflow-wrap: anywhere;
}

.location-flow-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  min-width: 18px;
}

.location-flow-icon {
  font-size: 16px;
  color: var(--el-text-color-secondary);
}

.location-flow-placeholder {
  width: 18px;
  min-width: 18px;
}

.card-metrics {
  align-items: start;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 6px 8px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-extra-light);
  min-width: 0;

  &.span-2 {
    grid-column: span 2;
  }

  &.highlight .metric-value {
    font-weight: 600;
  }

  &.highlight.primary .metric-value {
    color: var(--el-color-primary);
  }

  &.highlight.success .metric-value {
    color: var(--el-color-success);
  }
}

.inventory-flag-trigger,
.tag-popover-trigger {
  display: inline-flex;
  cursor: pointer;
}

.recommendation-reason-popover {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.recommendation-reason-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.recommendation-reason-value {
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
  word-break: break-all;
  white-space: pre-wrap;
}

.partner-popover {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.partner-popover-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.partner-popover-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.partner-popover-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.partner-popover-value {
  font-size: 13px;
  color: var(--el-text-color-primary);
  line-height: 1.4;
  word-break: break-all;
}

.actual-issue-editor {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.actual-issue-unit {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.actual-issue-input-inline {
  flex: 1;
  min-width: 0;

  :deep(.el-input-number) {
    width: 100%;
  }

  :deep(.el-input__wrapper) {
    padding-left: 8px;
    padding-right: 28px;
    min-height: 28px;
    box-shadow: 0 0 0 1px var(--el-border-color) inset;
  }
}

.metric-label {
  display: block;
  font-size: 11px;
  line-height: 1.2;
  color: var(--el-text-color-secondary);
}

.metric-value {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  line-height: 1.35;
  word-break: break-all;
}

.card-tags {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.card-tags-left,
.card-tags-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.card-tags-right {
  margin-left: auto;
}

.tag-extra {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.location-transfer {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.35;
  white-space: nowrap;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 10px;
  margin-top: 0;
  border-top: 1px dashed var(--el-border-color);
}

.card-actions-main {
  justify-content: space-between;
}

.card-remark {
  justify-content: flex-start;
  align-items: flex-start;
  gap: 8px;
  min-height: 44px;
}

.remark-label {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.remark-text {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
  word-break: break-all;
  white-space: pre-wrap;
}
</style>
