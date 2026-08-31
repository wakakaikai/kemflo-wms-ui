<template>
  <div class="p-2 issue-task-page">
    <el-tabs v-model="statusTab" class="status-tabs" @tab-change="onStatusTabChange">
      <el-tab-pane v-for="opt in ISSUE_TASK_STATUS_TAB_OPTIONS" :key="opt.value" :name="opt.value">
        <template #label>
          <el-badge :value="tabCounts[opt.value]" class="item" :color="lineStatusBadgeColor(opt.value)" :offset="[10, 0]" :max="9999999999">
            <span>{{ opt.label }}</span>
          </el-badge>
        </template>
      </el-tab-pane>
    </el-tabs>

    <el-card shadow="hover" class="issue-main-card">
      <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
        <el-form v-show="showSearch" ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto" class="issue-search-form">
          <el-form-item label="当前仓别" required class="warehouse-form-item">
            <div class="warehouse-inline">
              <el-button class="warehouse-picker-btn" size="small" @click="showWarehouseDialog">{{ warehouseDisplayLabel }}</el-button>
              <el-button v-if="queryParams.warehouseCode" text size="small" class="warehouse-clear-btn" @click="clearWarehouseSelection">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </el-form-item>
          <el-form-item label="视图">
            <el-radio-group v-model="viewMode" @change="onViewModeChange">
              <el-radio-button value="group">聚合</el-radio-button>
              <el-radio-button value="detail">明细</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="需求单号" prop="demandNo">
            <el-input v-model="queryParams.demandNo" placeholder="需求单号" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="工单号" prop="workOrderNo">
            <el-input v-model="queryParams.workOrderNo" placeholder="工单号" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="需求人姓名" prop="materialUserName">
            <el-input v-model="queryParams.materialUserName" placeholder="需求人姓名" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="物料编码" prop="materialCode">
            <el-input v-model="queryParams.materialCode" placeholder="物料编码" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="特殊库存" prop="specialInventoryFlag">
            <el-select v-model="queryParams.specialInventoryFlag" placeholder="特殊库存" clearable style="width: 120px">
              <el-option v-for="dict in wms_inventory_special_flag" :key="dict.value" :label="dict.value + ' - ' + dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </transition>

      <issue-task-line-card-list v-if="viewMode === 'detail'" :rows="issueTaskList" :loading="loading" :total="total" v-model:page-num="queryParams.pageNum" v-model:page-size="queryParams.pageSize" :selected-line-ids="selectedLineIds" :selected-total-count="selectedLineIds.size" :issueable-count="selectedIssueableRows.length" :consignment-print-count="selectedConsignmentPrintRows.length" :result-message="resultMessage" :result-status="resultStatus" @pagination="getList()" @toggle-select-all="toggleSelectAllLines" @toggle-select="toggleLineSelect" @actual-issue-change="updateLineActualIssueQty" @print="printSingleLine" @issue="openLineIssueAction" @print-selected="printSelectedLines" @print-consignment-selected="printSelectedConsignmentLines" @issue-selected="issueSelectedLines" />

      <div v-else-if="total > 0" class="list-action-bar list-action-bar--group">
        <pagination class="list-action-pagination" :auto-scroll="false" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
      </div>

      <template v-if="viewMode === 'group'">
        <div v-loading="loading" class="card-grid">
          <issue-task-group-card v-for="row in issueTaskGroupList" :key="row.key" :row="row" @detail="goIssueTaskDetail" />
          <el-empty v-if="!loading && !issueTaskGroupList.length" description="暂无发料任务" />
        </div>
      </template>

    </el-card>

    <issue-task-line-issue-dialog v-model="issueDialogVisible" :row="issueDialogRow" @success="() => getList(true)" @result="onLineIssueResult" />
    <issue-task-batch-issue-dialog v-model="batchIssueDialogVisible" :rows="batchIssueRows" @success="() => getList(true)" @result="onLineIssueResult" />
    <warehouse-dialog ref="warehouseDialogRef" @warehouse-select-call-back="warehouseSelectCallBack" />
    <issue-print ref="issuePrintRef" />
  </div>
</template>

<script setup name="IssueTask" lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Close } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { ISSUE_TASK_STATUS_TAB_OPTIONS, canExecuteIssueTaskLine261, getIssueTaskViewMode, getIssueTaskWarehouse, lineStatusBadgeColor, listIssueTaskDetail, listIssueTaskGroup, normalizeIssueTaskGroup, normalizeIssueTaskLineListResponse, removeIssueTaskWarehouse, saveIssueTaskViewMode, saveIssueTaskWarehouse, syncIssueTaskLineActualIssueDefaults } from '@/api/wms/issueTask';
import type { IssueTaskDemandGroup, IssueTaskDemandGroupVO, IssueTaskLineVO, IssueTaskQuery, IssueTaskViewMode } from '@/api/wms/issueTask/types';
import type { WarehouseVO } from '@/api/wms/warehouse/types';
import WarehouseDialog from '@/views/wms/warehouse/components/warehouseDialog.vue';
import IssueTaskGroupCard from './components/IssueTaskGroupCard.vue';
import IssueTaskLineCardList from './components/IssueTaskLineCardList.vue';
import IssueTaskLineIssueDialog from './components/IssueTaskLineIssueDialog.vue';
import IssueTaskBatchIssueDialog from './components/IssueTaskBatchIssueDialog.vue';
import IssuePrint from './components/IssuePrint.vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_inventory_special_flag } = toRefs<any>(proxy?.useDict('wms_inventory_special_flag'));
const router = useRouter();
const { currentRoute } = router;

const issueTaskList = ref<IssueTaskLineVO[]>([]);
const issueTaskGroupList = ref<IssueTaskDemandGroup[]>([]);
const viewMode = ref<IssueTaskViewMode>('group');
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const statusTab = ref('WAIT_PICK');
const tabCounts = ref<Record<string, number>>(Object.fromEntries(ISSUE_TASK_STATUS_TAB_OPTIONS.map((opt) => [opt.value, 0])));
const selectedWarehouseName = ref('');
const warehouseDialogRef = ref<InstanceType<typeof WarehouseDialog>>();
const queryFormRef = ref<ElFormInstance>();
const issueDialogVisible = ref(false);
const issueDialogRow = ref<IssueTaskLineVO | null>(null);
const batchIssueDialogVisible = ref(false);
const batchIssueRows = ref<IssueTaskLineVO[]>([]);
const resultMessage = ref('');
const resultStatus = ref(false);
const selectedLineIds = ref<Set<string>>(new Set());
const selectedLineRows = ref<Map<string, IssueTaskLineVO>>(new Map());
const issuePrintRef = ref<InstanceType<typeof IssuePrint>>();

const queryParams = ref<IssueTaskQuery>({
  pageNum: 1,
  pageSize: 10,
  warehouseCode: undefined,
  demandNo: undefined,
  workOrderNo: undefined,
  materialUserName: undefined,
  materialCode: undefined,
  specialInventoryFlag: undefined,
  lineStatus: 'WAIT_PICK',
  warehouseRoute: undefined
});

const warehouseDisplayLabel = computed(() => {
  const code = String(queryParams.value.warehouseCode || '').trim();
  if (!code) return '选择仓别';
  const name = String(selectedWarehouseName.value || '').trim();
  return name && name !== code ? `${code} ${name}` : code;
});

const resolveLineKey = (row: IssueTaskLineVO) => String(row.id);

const isLineSelected = (row: IssueTaskLineVO) => selectedLineIds.value.has(resolveLineKey(row));

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
    await issuePrintRef.value?.print(rows, {
      printMode,
      sourceWarehouseCode: queryParams.value.warehouseCode,
      sourceWarehouseName: selectedWarehouseName.value
    });
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

const toggleSelectAllLines = (checked: boolean | string | number) => {
  const nextIds = new Set(selectedLineIds.value);
  const nextRows = new Map(selectedLineRows.value);
  issueTaskList.value.forEach((row) => {
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

const resetLineSelection = () => {
  selectedLineIds.value = new Set();
  selectedLineRows.value = new Map();
};

const goIssueTaskDetail = (row: IssueTaskDemandGroup) => {
  const demandNo = String(row.demandNo || '').trim();
  if (!demandNo) return;
  router.push({
    name: 'IssueTaskDemandDetail',
    params: { demandNo },
    query: {
      warehouseCode: queryParams.value.warehouseCode || undefined,
      warehouseName: selectedWarehouseName.value || undefined,
      lineStatus: queryParams.value.lineStatus || undefined
    },
    state: { issueTaskDemandSummary: { ...row } }
  });
};

const restoreWarehouseFromCache = () => {
  const cached = getIssueTaskWarehouse(currentRoute.value.fullPath);
  if (!cached?.warehouseCode) return;
  queryParams.value.warehouseCode = cached.warehouseCode;
  selectedWarehouseName.value = String(cached.warehouseName || '').trim();
};

const showWarehouseDialog = () => {
  warehouseDialogRef.value?.openDialog();
  warehouseDialogRef.value?.handleQuery();
};

const warehouseSelectCallBack = (record: WarehouseVO) => {
  const warehouseCode = String(record.warehouseCode || '').trim();
  const warehouseName = String(record.warehouseName || '').trim();
  queryParams.value.warehouseCode = warehouseCode;
  selectedWarehouseName.value = warehouseName;
  saveIssueTaskWarehouse(currentRoute.value.fullPath, { warehouseCode, warehouseName });
  queryParams.value.pageNum = 1;
  getList(true);
};

const clearWarehouseSelection = () => {
  queryParams.value.warehouseCode = undefined;
  selectedWarehouseName.value = '';
  removeIssueTaskWarehouse(currentRoute.value.fullPath);
  queryParams.value.pageNum = 1;
  getList(true);
};

const getList = async (resetSelection = false) => {
  loading.value = true;
  try {
    if (viewMode.value === 'group') {
      applyStatusTabToQuery(statusTab.value);
      const res = await listIssueTaskGroup(queryParams.value);
      issueTaskGroupList.value = (res.rows || []).map((row: IssueTaskDemandGroupVO) => normalizeIssueTaskGroup(row));
      total.value = res.total || 0;
      tabCounts.value[statusTab.value] = total.value;
    } else {
      applyStatusTabToQuery(statusTab.value);
      const res = await listIssueTaskDetail(queryParams.value);
      const { rows, total: listTotal } = normalizeIssueTaskLineListResponse(res);
      syncIssueTaskLineActualIssueDefaults(rows);
      issueTaskList.value = rows;
      total.value = listTotal;
      tabCounts.value[statusTab.value] = listTotal;
      if (resetSelection) {
        resetLineSelection();
      } else {
        syncSelectedRowsFromList(rows);
      }
    }
  } finally {
    loading.value = false;
  }
};

const onViewModeChange = () => {
  saveIssueTaskViewMode(currentRoute.value.fullPath, viewMode.value);
  queryParams.value.pageNum = 1;
  applyStatusTabToQuery(statusTab.value);
  getList(true);
};

const applyStatusTabToQuery = (tab: string) => {
  queryParams.value.lineStatus = tab || undefined;
};

const onStatusTabChange = (tab: string | number) => {
  applyStatusTabToQuery(String(tab));
  queryParams.value.pageNum = 1;
  getList(true);
};

const handleQuery = () => {
  applyStatusTabToQuery(statusTab.value);
  queryParams.value.pageNum = 1;
  getList(true);
};

const resetQuery = () => {
  statusTab.value = 'WAIT_PICK';
  queryFormRef.value?.resetFields();
  applyStatusTabToQuery(statusTab.value);
  queryParams.value.pageNum = 1;
  getList(true);
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

onMounted(() => {
  viewMode.value = getIssueTaskViewMode(currentRoute.value.fullPath);
  applyStatusTabToQuery(statusTab.value);
  restoreWarehouseFromCache();
  getList();
});
</script>

<style scoped lang="scss">
.issue-task-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }
}

.issue-main-card {
  width: 100%;
  min-width: 0;

  :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-top: 14px;
    min-width: 0;
  }
}

.issue-search-form {
  margin-bottom: 0;

  :deep(.el-form-item) {
    margin-bottom: 10px;
    margin-right: 12px;
  }

  :deep(.el-form-item__label) {
    padding-right: 6px;
  }
}

.warehouse-form-item {
  :deep(.el-form-item__label) {
    &::before {
      margin-right: 2px;
    }
  }
}

.warehouse-inline {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.warehouse-picker-btn {
  max-width: 200px;
  border: 1px dashed var(--el-color-primary);
  color: var(--el-color-primary);
  background: rgba(64, 158, 255, 0.04);

  :deep(span) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.warehouse-clear-btn {
  color: var(--el-text-color-placeholder);

  &:hover {
    color: var(--el-color-danger);
  }
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

.list-action-bar--group {
  justify-content: flex-end;
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

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
  gap: 12px;
  align-items: start;
  width: 100%;
  min-width: 0;

  :deep(.issue-task-group-card) {
    min-width: 0;
  }

  :deep(.el-empty) {
    grid-column: 1 / -1;
  }
}
</style>
