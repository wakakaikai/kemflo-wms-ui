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

    <el-card shadow="never" class="line-card">
      <template #header>
        <div class="line-toolbar">
          <div class="line-toolbar-left">
            <span class="line-toolbar-title">备料明细</span>
            <span class="line-toolbar-meta">
              <span class="meta-item">领料人：{{ formatMaterialUser(summary) }}</span>
              <span class="meta-item">当前仓别：{{ currentWarehouseLabel }}</span>
              <span class="meta-item">目标库位：{{ targetWarehouseLabel }}</span>
            </span>
          </div>
          <el-radio-group v-model="lineViewMode" size="small">
            <el-radio-button value="card">卡片</el-radio-button>
            <el-radio-button value="table">表格</el-radio-button>
          </el-radio-group>
        </div>
        <div v-if="lineViewMode === 'card'" class="card-batch-toolbar">
          <el-checkbox :model-value="isAllCardsSelected" :indeterminate="isCardSelectionIndeterminate" @change="toggleSelectAllCards">全选当前页</el-checkbox>
          <span class="card-batch-meta">已选 {{ selectedLineIds.size }} / {{ lineList.length }}</span>
          <el-button color="#626aef" icon="Printer" :disabled="!selectedLineIds.size" @click="printSelectedLines">批量打印</el-button>
        </div>
      </template>

      <div v-if="resultMessage" class="result-alert">
        <el-alert show-icon :title="resultMessage" :type="resultStatus ? 'success' : 'error'" :closable="false">
          <template #icon>
            <Bell />
          </template>
        </el-alert>
      </div>

      <div v-if="lineViewMode === 'card'" v-loading="loading" class="card-grid">
        <issue-task-line-card v-for="row in lineList" :key="String(row.id)" :row="row" selectable :selected="isLineSelected(row)" @toggle-select="toggleLineSelect" @print="printSingleLine" @issue="openLineIssueAction" />
        <el-empty v-if="!loading && !lineList.length" description="暂无备料明细" />
      </div>

      <el-table v-else v-loading="loading" :data="lineList" border stripe>
        <el-table-column label="工单号" align="center" prop="workOrderNo" min-width="120" show-overflow-tooltip />
        <el-table-column label="物料编码" align="center" prop="materialCode" min-width="120" show-overflow-tooltip />
        <el-table-column label="物料描述" align="left" prop="materialName" min-width="160" show-overflow-tooltip />
        <el-table-column label="仓别" align="center" prop="warehouseCode" width="90" />
        <el-table-column label="库位" align="center" prop="locationCode" min-width="100" show-overflow-tooltip />
        <el-table-column label="批次" align="center" prop="batchCode" min-width="100" show-overflow-tooltip />
        <el-table-column label="待发" align="right" width="96">
          <template #default="{ row }">{{ formatQtyWithUnit(row.issueQty, row.inventoryUnit) }}</template>
        </el-table-column>
        <el-table-column label="已发" align="right" width="120">
          <template #default="{ row }">{{ formatQtyWithUnit(row.issuedQty, row.inventoryUnit) }}</template>
        </el-table-column>
        <el-table-column label="实发" align="right" width="120">
          <template #default="{ row }">
            <span class="table-actual-issue-readonly">{{ formatIssueTaskLineActualIssueDisplay(row) }}</span>
          </template>
        </el-table-column>
        <prep-demand-inventory-columns />
        <prep-demand-location-source-column show-remark :rows="lineList" />
        <el-table-column label="目标库位" align="center" min-width="100" show-overflow-tooltip>
          <template #default="{ row }">{{ row.targetDemandLocationCode || '-' }}</template>
        </el-table-column>
        <el-table-column label="行状态" align="center" width="96" fixed="right">
          <template #default="{ row }">
            <el-tag :type="lineStatusTag(row.lineStatus)" size="small">{{ lineStatusLabel(row.lineStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="160" fixed="right">
          <template #default="{ row }">
            <div class="line-action-cell">
              <el-button v-if="canIssueTaskLine261(row)" link type="success" :disabled="!canExecuteIssueTaskLine261(row)" @click="openLineIssueAction(row)" v-hasPermi="['wms:materialIssue:issue']">
                {{ getIssueTaskLineActionLabel(row) }}
              </el-button>
              <span v-else-if="isIssueTaskLineCompleted(row.lineStatus)" class="line-remark" :title="resolveIssueTaskLineRemark(row)">
                {{ resolveIssueTaskLineRemark(row) || '-' }}
              </span>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="handlePagination" />
    </el-card>

    <issue-task-line-issue-dialog v-model="issueDialogVisible" :row="issueDialogRow" @success="loadPage" @result="onLineIssueResult" />
    <issue-print ref="issuePrintRef" />
  </div>
</template>

<script setup name="IssueTaskDemandDetail" lang="ts">
import { formatQty, formatQtyWithUnit } from '@/utils/ruoyi';
import { computed, getCurrentInstance, ref, watch } from 'vue';
import type { ComponentInternalInstance } from 'vue';
import { Bell, ArrowLeftBold } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { canExecuteIssueTaskLine261, canIssueTaskLine261, formatIssueTaskLineActualIssueDisplay, getIssueTaskLineActionLabel, isIssueTaskLineCompleted, lineStatusLabel, lineStatusTag, listIssueTaskDemandDetail, listIssueTaskGroup, normalizeIssueTaskGroup, normalizeIssueTaskLineListResponse, resolveIssueTaskCurrentWarehouseLabel, resolveIssueTaskLineRemark, syncIssueTaskLineActualIssueDefaults } from '@/api/wms/issueTask';
import type { IssueTaskDemandGroup, IssueTaskDemandGroupVO, IssueTaskLineVO, IssueTaskQuery } from '@/api/wms/issueTask/types';
import IssueTaskLineCard from './components/IssueTaskLineCard.vue';
import IssueTaskLineIssueDialog from './components/IssueTaskLineIssueDialog.vue';
import IssuePrint from './components/issuePrint.vue';
import PrepDemandInventoryColumns from '@/views/wms/allocation/components/PrepDemandInventoryColumns.vue';
import PrepDemandLocationSourceColumn from '@/views/wms/allocation/components/PrepDemandLocationSourceColumn.vue';
import { PREP_DEMAND_STATUS_DICT, PREP_DEMAND_TYPE_DICT } from '@/api/wms/workOrderPrepDemand/index';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_prepare_demand_type, wms_prepare_demand_status } = toRefs<any>(proxy?.useDict(PREP_DEMAND_TYPE_DICT, PREP_DEMAND_STATUS_DICT));
const router = useRouter();
const route = useRoute();

const lineList = ref<IssueTaskLineVO[]>([]);
const summary = ref<IssueTaskDemandGroup | null>(null);
const lineViewMode = ref<'card' | 'table'>('card');
const loading = ref(true);
const total = ref(0);
const issueDialogVisible = ref(false);
const issueDialogRow = ref<IssueTaskLineVO | null>(null);
const resultMessage = ref('');
const resultStatus = ref(false);
const selectedLineIds = ref<Set<string>>(new Set());
const issuePrintRef = ref<InstanceType<typeof IssuePrint>>();

const demandNo = computed(() => {
  const fromParam = String(route.params.demandNo || '').trim();
  const fromQuery = String(route.query.demandNo || '').trim();
  return fromParam || fromQuery;
});

const queryParams = ref<IssueTaskQuery>({
  pageNum: 1,
  pageSize: 20,
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

const isAllCardsSelected = computed(() => lineList.value.length > 0 && lineList.value.every((row) => isLineSelected(row)));

const isCardSelectionIndeterminate = computed(() => {
  const selectedCount = lineList.value.filter((row) => isLineSelected(row)).length;
  return selectedCount > 0 && selectedCount < lineList.value.length;
});

const buildPrintContext = () => ({
  demandNo: demandNo.value || undefined
});

const printLines = async (rows: IssueTaskLineVO[]) => {
  if (!rows.length) {
    ElMessage.warning('请选择要打印的备料明细');
    return;
  }
  try {
    await issuePrintRef.value?.print(rows, buildPrintContext());
  } catch (error) {
    if (error instanceof Error && error.message === 'PRINT_WINDOW_BLOCKED') {
      ElMessage.warning('浏览器拦截了打印窗口，请允许弹窗后重试');
      return;
    }
    ElMessage.error('打印失败，请重试');
  }
};

const printSingleLine = (row: IssueTaskLineVO) => {
  printLines([row]);
};

const printSelectedLines = () => {
  const rows = lineList.value.filter((row) => isLineSelected(row));
  printLines(rows);
};

const toggleLineSelect = (row: IssueTaskLineVO, selected: boolean) => {
  const key = resolveLineKey(row);
  const next = new Set(selectedLineIds.value);
  if (selected) next.add(key);
  else next.delete(key);
  selectedLineIds.value = next;
};

const toggleSelectAllCards = (checked: boolean | string | number) => {
  if (!checked) {
    selectedLineIds.value = new Set();
    return;
  }
  selectedLineIds.value = new Set(lineList.value.map((row) => resolveLineKey(row)));
};

const resetCardSelection = () => {
  selectedLineIds.value = new Set();
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

const getLineList = async () => {
  if (!demandNo.value) return;
  const res = await listIssueTaskDemandDetail(demandNo.value, queryParams.value);
  const { rows, total: listTotal } = normalizeIssueTaskLineListResponse(res);
  syncIssueTaskLineActualIssueDefaults(rows);
  lineList.value = rows;
  total.value = listTotal;
  resetCardSelection();
};

const handlePagination = async () => {
  loading.value = true;
  try {
    await getLineList();
  } finally {
    loading.value = false;
  }
};

const loadPage = async () => {
  if (!demandNo.value) return;
  syncQueryFromRoute();
  restoreSummaryFromState();
  loading.value = true;
  try {
    await Promise.all([loadSummary(), getLineList()]);
  } finally {
    loading.value = false;
  }
};

const openLineIssueAction = (row: IssueTaskLineVO) => {
  if (!canExecuteIssueTaskLine261(row) || row.demandId == null) {
    return;
  }
  resultMessage.value = '';
  issueDialogRow.value = row;
  issueDialogVisible.value = true;
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
    loadPage();
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.issue-task-detail-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.line-card {
  flex: 1;
}

.line-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.line-toolbar-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  min-width: 0;
}

.line-toolbar-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.line-toolbar-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.meta-item {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.result-alert {
  margin-bottom: 12px;
}

.result-alert :deep(.el-alert) {
  padding: 6px 10px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 12px;
  align-items: start;
}

.card-batch-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--el-border-color-lighter);
}

.card-batch-meta {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.table-actual-issue-readonly {
  color: var(--el-color-success);
  font-weight: 600;
}

.line-action-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  width: 100%;
}

.line-remark {
  display: block;
  max-width: 100%;
  font-size: 12px;
  line-height: 32px;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
