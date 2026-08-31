<template>
  <div class="p-2 issue-task-detail-page">
    <div class="detail-header">
      <el-button class="detail-back-btn" text @click="goBack">
        <el-icon><ArrowLeftBold /></el-icon>
        <span>返回</span>
      </el-button>
      <el-divider direction="vertical" class="detail-header-divider" />
      <div class="detail-header-content">
        <span class="detail-title">{{ demandNo || '发料任务明细' }}</span>
        <dict-tag v-if="summary?.demandType" :options="wms_prepare_demand_type" :value="summary.demandType" class="detail-header-tag" />
        <dict-tag v-if="summary?.demandStatus" :options="wms_prepare_demand_status" :value="summary.demandStatus" class="detail-header-tag" />
      </div>
    </div>

    <el-card shadow="hover" class="issue-main-card">
      <issue-task-line-card-list :rows="lineList" :loading="loading" :total="total" v-model:page-num="queryParams.pageNum" v-model:page-size="queryParams.pageSize" :selected-line-ids="selectedLineIds" :selected-total-count="selectedLineIds.size" :issueable-count="selectedIssueableRows.length" :consignment-print-count="selectedConsignmentPrintRows.length" :result-message="resultMessage" :result-status="resultStatus" @pagination="handlePagination" @toggle-select-all="toggleSelectAllCards" @toggle-select="toggleLineSelect" @actual-issue-change="updateLineActualIssueQty" @print="printSingleLine" @issue="openLineIssueAction" @print-selected="printSelectedLines" @print-consignment-selected="printSelectedConsignmentLines" @issue-selected="issueSelectedLines">
        <template #summary>
          <div class="detail-summary-bar">
            <span class="detail-summary-item">领料人：{{ formatMaterialUser(summary) }}</span>
            <span class="detail-summary-item">当前仓别：{{ currentWarehouseLabel }}</span>
            <span class="detail-summary-item">目标库位：{{ targetWarehouseLabel }}</span>
          </div>
        </template>
      </issue-task-line-card-list>
    </el-card>

    <issue-task-line-issue-dialog v-model="issueDialogVisible" :row="issueDialogRow" @success="() => loadPage(true)" @result="onLineIssueResult" />
    <issue-task-batch-issue-dialog v-model="batchIssueDialogVisible" :rows="batchIssueRows" @success="() => loadPage(true)" @result="onLineIssueResult" />
    <issue-print ref="issuePrintRef" />
  </div>
</template>

<script setup name="IssueTaskDemandDetail" lang="ts">
import { computed, getCurrentInstance, ref, watch } from 'vue';
import type { ComponentInternalInstance } from 'vue';
import { ArrowLeftBold } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { canExecuteIssueTaskLine261, listIssueTaskDemandDetail, listIssueTaskGroup, normalizeIssueTaskGroup, normalizeIssueTaskLineListResponse, resolveIssueTaskCurrentWarehouseLabel, syncIssueTaskLineActualIssueDefaults } from '@/api/wms/issueTask';
import type { IssueTaskDemandGroup, IssueTaskDemandGroupVO, IssueTaskLineVO, IssueTaskQuery } from '@/api/wms/issueTask/types';
import IssueTaskLineCardList from './components/IssueTaskLineCardList.vue';
import IssueTaskLineIssueDialog from './components/IssueTaskLineIssueDialog.vue';
import IssueTaskBatchIssueDialog from './components/IssueTaskBatchIssueDialog.vue';
import IssuePrint from './components/IssuePrint.vue';
import { PREP_DEMAND_STATUS_DICT, PREP_DEMAND_TYPE_DICT } from '@/api/wms/workOrderPrepDemand/index';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_prepare_demand_type, wms_prepare_demand_status } = toRefs<any>(proxy?.useDict(PREP_DEMAND_TYPE_DICT, PREP_DEMAND_STATUS_DICT));
const router = useRouter();
const route = useRoute();

const lineList = ref<IssueTaskLineVO[]>([]);
const summary = ref<IssueTaskDemandGroup | null>(null);
const loading = ref(true);
const total = ref(0);
const issueDialogVisible = ref(false);
const issueDialogRow = ref<IssueTaskLineVO | null>(null);
const batchIssueDialogVisible = ref(false);
const batchIssueRows = ref<IssueTaskLineVO[]>([]);
const resultMessage = ref('');
const resultStatus = ref(false);
const selectedLineIds = ref<Set<string>>(new Set());
const selectedLineRows = ref<Map<string, IssueTaskLineVO>>(new Map());
const issuePrintRef = ref<InstanceType<typeof IssuePrint>>();

const demandNo = computed(() => {
  const fromParam = String(route.params.demandNo || '').trim();
  const fromQuery = String(route.query.demandNo || '').trim();
  return fromParam || fromQuery;
});

const queryParams = ref<IssueTaskQuery>({
  pageNum: 1,
  pageSize: 10,
  warehouseCode: undefined,
  lineStatus: undefined
});

function formatMaterialUser(row?: IssueTaskDemandGroup | null) {
  if (!row) return '-';
  const name = String(row.materialUserName || '').trim();
  const code = String(row.materialUserCode || '').trim();
  if (name && code) return `${name} (${code})`;
  return name || code || '-';
}

const currentWarehouseLabel = computed(() => resolveIssueTaskCurrentWarehouseLabel(String(route.query.warehouseCode || queryParams.value.warehouseCode || ''), String(route.query.warehouseName || '')));

const targetWarehouseLabel = computed(() => {
  const code = summary.value?.targetDemandLocationCode;
  const desc = summary.value?.targetDemandLocationCodeDesc;
  if (!code) return desc || '-';
  if (!desc) return code;
  return `${code}（${desc}）`;
});

const resolveLineKey = (row: IssueTaskLineVO) => String(row.id);

const isLineSelected = (row: IssueTaskLineVO) => selectedLineIds.value.has(resolveLineKey(row));

const buildPrintContext = () => ({
  demandNo: demandNo.value || undefined,
  materialUserCode: summary.value?.materialUserCode,
  materialUserName: summary.value?.materialUserName,
  sourceWarehouseCode: String(route.query.warehouseCode || queryParams.value.warehouseCode || '').trim() || undefined,
  sourceWarehouseName: String(route.query.warehouseName || '').trim() || undefined,
  targetDemandLocationCode: summary.value?.targetDemandLocationCode,
  targetDemandLocationCodeDesc: summary.value?.targetDemandLocationCodeDesc
});

const isConsignmentLine = (row: IssueTaskLineVO) =>
  String(row.specialInventoryFlag || '')
    .trim()
    .toUpperCase() === 'K';

const selectedRows = computed(() => Array.from(selectedLineRows.value.values()));

const selectedIssueableRows = computed(() => selectedRows.value.filter((row) => canExecuteIssueTaskLine261(row)));

const selectedConsignmentPrintRows = computed(() => selectedRows.value.filter(isConsignmentLine));

const syncSelectedRowsFromList = (rows: IssueTaskLineVO[]) => {
  const nextRows = new Map(selectedLineRows.value);
  rows.forEach((row) => {
    const key = resolveLineKey(row);
    if (selectedLineIds.value.has(key)) {
      nextRows.set(key, row);
    }
  });
  selectedLineRows.value = nextRows;
};

const printLines = async (rows: IssueTaskLineVO[], printMode: 'normal' | 'consignment') => {
  if (!rows.length) {
    ElMessage.warning(printMode === 'consignment' ? '请选择特殊库存标识为 K 的托售物料' : '请选择要打印的备料明细');
    return;
  }
  try {
    await issuePrintRef.value?.print(rows, { ...buildPrintContext(), printMode });
  } catch (error) {
    if (error instanceof Error && error.message === 'PRINT_WINDOW_BLOCKED') {
      ElMessage.warning('浏览器拦截了打印窗口，请允许弹窗后重试');
      return;
    }
    ElMessage.error('打印失败，请重试');
  }
};

const printSingleLine = (row: IssueTaskLineVO) => {
  printLines([row], isConsignmentLine(row) ? 'consignment' : 'normal');
};

const printSelectedLines = () => {
  printLines(selectedRows.value, 'normal');
};

const printSelectedConsignmentLines = () => {
  printLines(selectedConsignmentPrintRows.value, 'consignment');
};

const issueSelectedLines = () => {
  const rows = selectedIssueableRows.value;
  if (!rows.length) {
    ElMessage.warning('请选择可领料的发料明细');
    return;
  }
  batchIssueRows.value = rows;
  batchIssueDialogVisible.value = true;
};

const toggleLineSelect = (row: IssueTaskLineVO, selected: boolean) => {
  const key = resolveLineKey(row);
  const nextIds = new Set(selectedLineIds.value);
  const nextRows = new Map(selectedLineRows.value);
  if (selected) {
    nextIds.add(key);
    nextRows.set(key, row);
  } else {
    nextIds.delete(key);
    nextRows.delete(key);
  }
  selectedLineIds.value = nextIds;
  selectedLineRows.value = nextRows;
};

const toggleSelectAllCards = (checked: boolean | string | number) => {
  const nextIds = new Set(selectedLineIds.value);
  const nextRows = new Map(selectedLineRows.value);
  lineList.value.forEach((row) => {
    const key = resolveLineKey(row);
    if (!checked) {
      nextIds.delete(key);
      nextRows.delete(key);
      return;
    }
    nextIds.add(key);
    nextRows.set(key, row);
  });
  selectedLineIds.value = nextIds;
  selectedLineRows.value = nextRows;
};

const resetCardSelection = () => {
  selectedLineIds.value = new Set();
  selectedLineRows.value = new Map();
};

const restoreSummaryFromState = () => {
  const state = history.state as { issueTaskDemandSummary?: IssueTaskDemandGroup };
  if (state?.issueTaskDemandSummary?.demandNo === demandNo.value) {
    summary.value = state.issueTaskDemandSummary;
    return;
  }
  summary.value = null;
};

const loadSummary = async () => {
  if (!demandNo.value) return;
  if (summary.value?.demandNo === demandNo.value) return;
  const res = await listIssueTaskGroup({
    demandNo: demandNo.value,
    warehouseCode: queryParams.value.warehouseCode,
    pageNum: 1,
    pageSize: 1
  });
  const row = (res.rows || [])[0] as IssueTaskDemandGroupVO | undefined;
  if (row) {
    summary.value = normalizeIssueTaskGroup(row);
  }
};

const syncQueryFromRoute = () => {
  const warehouseCode = String(route.query.warehouseCode || '').trim();
  const lineStatus = String(route.query.lineStatus || '').trim();
  queryParams.value.warehouseCode = warehouseCode || undefined;
  queryParams.value.lineStatus = lineStatus || undefined;
};

const getLineList = async (resetSelection = false) => {
  if (!demandNo.value) return;
  const res = await listIssueTaskDemandDetail(demandNo.value, queryParams.value);
  const { rows, total: listTotal } = normalizeIssueTaskLineListResponse(res);
  syncIssueTaskLineActualIssueDefaults(rows);
  lineList.value = rows;
  total.value = listTotal;
  if (resetSelection) {
    resetCardSelection();
  } else {
    syncSelectedRowsFromList(rows);
  }
};

const handlePagination = async () => {
  loading.value = true;
  try {
    await getLineList();
  } finally {
    loading.value = false;
  }
};

const loadPage = async (resetSelection = false) => {
  if (!demandNo.value) return;
  syncQueryFromRoute();
  restoreSummaryFromState();
  loading.value = true;
  try {
    await Promise.all([loadSummary(), getLineList(resetSelection)]);
  } finally {
    loading.value = false;
  }
};

const openLineIssueAction = (row: IssueTaskLineVO) => {
  if (!canExecuteIssueTaskLine261(row) || row.demandId == null) {
    proxy?.$modal?.msgWarning('当前备料行缺少需求单或库位信息，无法执行领料');
    return;
  }
  resultMessage.value = '';
  issueDialogRow.value = row;
  issueDialogVisible.value = true;
};

const updateLineActualIssueQty = (row: IssueTaskLineVO, value?: number) => {
  row.actualIssueQty = value;
  const key = resolveLineKey(row);
  if (selectedLineRows.value.has(key)) {
    const nextRows = new Map(selectedLineRows.value);
    nextRows.set(key, { ...row, actualIssueQty: value });
    selectedLineRows.value = nextRows;
  }
};

const onLineIssueResult = (payload: { message: string; success: boolean }) => {
  resultMessage.value = payload.message;
  resultStatus.value = payload.success;
};

const goBack = () => {
  router.back();
};

watch(
  () => [route.params.demandNo, route.query.demandNo, route.query.warehouseCode, route.query.warehouseName, route.query.lineStatus] as const,
  () => {
    queryParams.value.pageNum = 1;
    loadPage(true);
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.issue-task-detail-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0 8px;
  min-height: 40px;
}

.detail-back-btn {
  flex-shrink: 0;
  padding: 6px 8px;
  color: var(--el-text-color-regular);

  .el-icon {
    margin-right: 4px;
    font-size: 16px;
  }
}

.detail-header-divider {
  height: 1.2em;
  margin: 0 4px;
}

.detail-header-content {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.detail-header-tag {
  display: inline-flex;
  align-items: center;
  line-height: 1;
}

.detail-header-tag :deep(> div) {
  display: inline-flex;
  align-items: center;
}

.detail-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  white-space: nowrap;
}

.issue-main-card {
  width: 100%;
  min-width: 0;

  :deep(.el-card__body) {
    padding-top: 14px;
    min-width: 0;
  }
}

.detail-summary-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.detail-summary-item {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
