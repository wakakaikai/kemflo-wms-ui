<template>
  <div class="issue-line-card-list">
    <slot name="summary" />

    <div class="list-action-bar">
      <div class="list-action-left">
        <el-checkbox :model-value="allSelected" :indeterminate="indeterminate" @change="(val) => emit('toggle-select-all', val)"></el-checkbox>
        <span class="list-action-meta">{{ '\u5df2\u9009' }} {{ selectedTotalCount }}</span>
        <el-button color="#626aef" icon="Printer" :disabled="!selectedTotalCount" @click="emit('print-selected')">{{ '\u6279\u91cf\u6253\u5370' }}</el-button>
        <el-button type="warning" icon="Printer" :disabled="!consignmentPrintCount" @click="emit('print-consignment-selected')">{{ '\u6258\u552e\u6253\u5370' }}</el-button>
        <el-button type="primary" icon="TakeawayBox" :disabled="!issueableCount" @click="emit('issue-selected')" v-hasPermi="['wms:materialIssue:issue']">{{ '\u6279\u91cf\u9886\u6599' }}</el-button>
      </div>
      <pagination v-show="total > 0" class="list-action-pagination" :auto-scroll="false" :total="total" :page="pageNum" :limit="pageSize" @update:page="(val) => emit('update:pageNum', val)" @update:limit="(val) => emit('update:pageSize', val)" @pagination="emit('pagination')" />
    </div>

    <div v-if="resultMessage" class="result-alert">
      <el-alert show-icon center :title="resultMessage" :type="resultStatus ? 'success' : 'error'" :closable="true">
        <template #icon>
          <Bell />
        </template>
      </el-alert>
    </div>

    <div v-if="layoutMode === 'card'" v-loading="loading" class="card-grid">
      <issue-task-line-card v-for="row in rows" :key="String(row.id)" :row="row" selectable :selected="isSelected(row)" @actual-issue-change="(row, value) => emit('actual-issue-change', row, value)" @toggle-select="(row, selected) => emit('toggle-select', row, selected)" @print="(row) => emit('print', row)" @issue="(row) => emit('issue', row)" />
      <el-empty v-if="!loading && !rows.length" :description="emptyText" />
    </div>

    <el-table v-else v-loading="loading" :data="rows" border stripe row-key="id" class="line-table">
      <el-table-column width="46" align="center" fixed="left">
        <template #header>
          <el-checkbox :model-value="allSelected" :indeterminate="indeterminate" @change="(val) => emit('toggle-select-all', val)" />
        </template>
        <template #default="{ row }">
          <el-checkbox :model-value="isSelected(row)" @change="(val) => emit('toggle-select', row, !!val)" />
        </template>
      </el-table-column>
      <el-table-column label="状态" width="92" align="center" fixed="left">
        <template #default="{ row }">
          <el-tag :type="lineStatusTag(row.lineStatus)" size="small" effect="dark">{{ lineStatusLabel(row.lineStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="demandNo" label="需求单号" min-width="150" show-overflow-tooltip />
      <el-table-column prop="workOrderNo" label="工单号" min-width="145" show-overflow-tooltip>
        <template #default="{ row }">
          <el-tag v-if="row.isEmergency" type="danger" size="small" effect="dark">急</el-tag>
          <span>{{ row.workOrderNo || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="materialCode" label="物料编码" min-width="145" show-overflow-tooltip />
      <el-table-column prop="materialName" label="物料名称" min-width="180" show-overflow-tooltip />
      <el-table-column label="原始库位" min-width="120" show-overflow-tooltip>
        <template #default="{ row }">{{ formatLocation(row.locationCode, row.locationName) }}</template>
      </el-table-column>
      <el-table-column prop="targetDemandLocationCode" label="目标库位" min-width="110" show-overflow-tooltip />
      <el-table-column prop="batchCode" label="批次" min-width="118" show-overflow-tooltip />
      <el-table-column label="特殊库存" width="105" align="center">
        <template #default="{ row }"><dict-tag :options="wms_inventory_special_flag" :value="row.specialInventoryFlag" /></template>
      </el-table-column>
      <el-table-column label="待发" width="105" align="right">
        <template #default="{ row }">{{ formatQtyWithUnit(row.issueQty, row.inventoryUnit) }}</template>
      </el-table-column>
      <el-table-column label="已发" width="105" align="right">
        <template #default="{ row }">{{ formatQtyWithUnit(row.issuedQty, row.inventoryUnit) }}</template>
      </el-table-column>
      <el-table-column label="实发" width="150" align="right">
        <template #default="{ row }">
          <el-input-number v-if="canEditIssueTaskLineActualIssue(row)" :model-value="numberValue(row.actualIssueQty ?? row.issueQty)" :min="0" :precision="3" :step="1" controls-position="right" size="small" class="table-actual-input" @update:model-value="(value) => emit('actual-issue-change', row, value)" />
          <span v-else>{{ formatQtyWithUnit(row.actualIssueQty ?? row.issueQty, row.inventoryUnit) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="materialUserName" label="需求人" min-width="100" show-overflow-tooltip />
      <el-table-column label="操作" width="150" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" icon="Printer" @click="emit('print', row)">打印</el-button>
          <el-button v-if="canExecuteIssueTaskLine261(row)" type="primary" link size="small" @click="emit('issue', row)" v-hasPermi="['wms:materialIssue:issue']">{{ getIssueTaskLineActionLabel(row) }}</el-button>
          <el-tooltip v-else-if="canIssueTaskLine261(row)" content="缺少需求单或库位信息" placement="top">
            <el-button link type="success" size="small" disabled>{{ getIssueTaskLineActionLabel(row) }}</el-button>
          </el-tooltip>
        </template>
      </el-table-column>
      <template #empty><el-empty :description="emptyText" /></template>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, toRefs } from 'vue';
import { Bell } from '@element-plus/icons-vue';
import { canEditIssueTaskLineActualIssue, canExecuteIssueTaskLine261, canIssueTaskLine261, getIssueTaskLineActionLabel, lineStatusLabel, lineStatusTag } from '@/api/wms/issueTask';
import type { IssueTaskLineLayoutMode, IssueTaskLineVO } from '@/api/wms/issueTask/types';
import IssueTaskLineCard from './IssueTaskLineCard.vue';

const props = withDefaults(
  defineProps<{
    rows: IssueTaskLineVO[];
    loading?: boolean;
    total?: number;
    pageNum?: number;
    pageSize?: number;
    selectedLineIds: Set<string>;
    selectedTotalCount?: number;
    issueableCount?: number;
    consignmentPrintCount?: number;
    resultMessage?: string;
    resultStatus?: boolean;
    emptyText?: string;
    layoutMode?: IssueTaskLineLayoutMode;
  }>(),
  {
    loading: false,
    total: 0,
    pageNum: 1,
    pageSize: 10,
    selectedTotalCount: 0,
    issueableCount: 0,
    consignmentPrintCount: 0,
    resultMessage: '',
    resultStatus: false,
    emptyText: '\u6682\u65e0\u53d1\u6599\u4efb\u52a1',
    layoutMode: 'card'
  }
);

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_inventory_special_flag } = toRefs<any>(proxy?.useDict('wms_inventory_special_flag'));

const emit = defineEmits<{
  'update:pageNum': [value: number];
  'update:pageSize': [value: number];
  pagination: [];
  'toggle-select-all': [checked: boolean | string | number];
  'toggle-select': [row: IssueTaskLineVO, selected: boolean];
  'actual-issue-change': [row: IssueTaskLineVO, value?: number];
  print: [row: IssueTaskLineVO];
  issue: [row: IssueTaskLineVO];
  'print-selected': [];
  'print-consignment-selected': [];
  'issue-selected': [];
}>();

const resolveLineKey = (row: IssueTaskLineVO) => String(row.id);

const isSelected = (row: IssueTaskLineVO) => props.selectedLineIds.has(resolveLineKey(row));

const selectedCount = computed(() => props.rows.filter((row) => isSelected(row)).length);

const allSelected = computed(() => props.rows.length > 0 && props.rows.every((row) => isSelected(row)));

const indeterminate = computed(() => selectedCount.value > 0 && selectedCount.value < props.rows.length);

const numberValue = (value?: number | string) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

const formatQtyWithUnit = (value?: number | string, unit?: string) => {
  const quantity = numberValue(value);
  const unitText = String(unit || '').trim();
  return unitText ? `${quantity} ${unitText}` : String(quantity);
};

const formatLocation = (code?: string, name?: string) => {
  const locationCode = String(code || '').trim();
  const locationName = String(name || '').trim();
  if (!locationCode) return '-';
  return locationName && locationName !== locationCode ? `${locationCode} ${locationName}` : locationCode;
};
</script>

<style scoped lang="scss">
.issue-line-card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  min-width: 0;
}

.list-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 2px;
  border-top: 1px dashed var(--el-border-color-lighter);
}

.list-action-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  min-width: 0;
}

.list-action-pagination {
  margin-left: auto;
  margin-top: 0;
  margin-bottom: 0;

  :deep(.pagination-container) {
    margin-top: 0;
    padding: 0 !important;
  }

  :deep(.el-pagination) {
    float: none;
  }
}

.list-action-meta {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.result-alert {
  margin-bottom: 0;
}

.result-alert :deep(.el-alert) {
  padding: 6px 10px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
  gap: 12px;
  align-items: start;
  width: 100%;
  min-width: 0;

  :deep(.issue-task-line-card) {
    min-width: 0;
  }

  :deep(.el-empty) {
    grid-column: 1 / -1;
  }
}

.line-table {
  width: 100%;

  :deep(.el-table__cell) {
    padding: 7px 0;
  }
}

.table-actual-input {
  width: 126px;
}
</style>
