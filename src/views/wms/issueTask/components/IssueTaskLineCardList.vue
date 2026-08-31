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
      <el-alert show-icon :title="resultMessage" :type="resultStatus ? 'success' : 'error'" :closable="true">
        <template #icon>
          <Bell />
        </template>
      </el-alert>
    </div>

    <div v-loading="loading" class="card-grid">
      <issue-task-line-card v-for="row in rows" :key="String(row.id)" :row="row" selectable :selected="isSelected(row)" @actual-issue-change="(row, value) => emit('actual-issue-change', row, value)" @toggle-select="(row, selected) => emit('toggle-select', row, selected)" @print="(row) => emit('print', row)" @issue="(row) => emit('issue', row)" />
      <el-empty v-if="!loading && !rows.length" :description="emptyText" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Bell } from '@element-plus/icons-vue';
import type { IssueTaskLineVO } from '@/api/wms/issueTask/types';
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
    emptyText: '\u6682\u65e0\u53d1\u6599\u4efb\u52a1'
  }
);

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
</style>
