<template>
  <div class="p-2 issue-task-page">
    <el-card shadow="never" class="warehouse-filter-card">
      <div class="warehouse-filter-panel">
        <div class="warehouse-filter-bar">
          <div class="warehouse-select-group">
            <div class="flex items-center min-w-[88px]">
              <span class="text-red-500 mr-1.5">*</span>
              <span class="text-sm font-medium text-gray-600">当前仓别:</span>
            </div>
            <div class="flex items-center gap-1">
              <el-button class="dashed-blue-btn min-w-[180px]" size="small" @click="showWarehouseDialog">
                {{ warehouseDisplayLabel }}
              </el-button>
              <el-button v-if="queryParams.warehouseCode" text size="small" class="!text-gray-400 hover:!text-red-500" @click="clearWarehouseSelection">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </div>
          <div class="view-mode-switch">
            <span class="view-mode-label">列表视图</span>
            <div class="view-mode-tabs">
              <button type="button" class="view-mode-tab" :class="{ active: viewMode === 'group' }" @click="setViewMode('group')">聚合</button>
              <button type="button" class="view-mode-tab" :class="{ active: viewMode === 'detail' }" @click="setViewMode('detail')">明细</button>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <el-tabs v-model="statusTab" class="status-tabs mb-2" @tab-change="onStatusTabChange">
      <el-tab-pane v-for="opt in ISSUE_TASK_STATUS_TAB_OPTIONS" :key="opt.value" :name="opt.value">
        <template #label>
          <el-badge :value="tabCounts[opt.value]" class="item" :color="lineStatusBadgeColor(opt.value)" :offset="[10, 0]" :max="9999999999">
            <span>{{ opt.label }}</span>
          </el-badge>
        </template>
      </el-tab-pane>
    </el-tabs>

    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="需求单号" prop="demandNo">
              <el-input v-model="queryParams.demandNo" placeholder="需求单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工单号" prop="workOrderNo">
              <el-input v-model="queryParams.workOrderNo" placeholder="工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="物料编码" prop="materialCode">
              <el-input v-model="queryParams.materialCode" placeholder="物料编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="never">
      <template v-if="viewMode === 'group'" #header>
        <div class="list-toolbar">
          <span class="list-title">发料任务</span>
          <el-radio-group v-model="groupLayoutMode" size="small" @change="onGroupLayoutChange">
            <el-radio-button value="card">卡片</el-radio-button>
            <el-radio-button value="table">表格</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <template v-else #header>
        <div class="list-toolbar">
          <span class="list-title">发料明细</span>
          <el-radio-group v-model="lineLayoutMode" size="small" @change="onLineLayoutChange">
            <el-radio-button value="card">卡片</el-radio-button>
            <el-radio-button value="table">表格</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <div v-if="resultMessage" class="result-alert">
        <el-alert show-icon :title="resultMessage" :type="resultStatus ? 'success' : 'error'" :closable="false">
          <template #icon>
            <Bell />
          </template>
        </el-alert>
      </div>

      <template v-if="viewMode === 'group'">
        <div v-if="groupLayoutMode === 'card'" v-loading="loading" class="card-grid">
          <issue-task-group-card v-for="row in issueTaskGroupList" :key="row.key" :row="row" @detail="goIssueTaskDetail" />
          <el-empty v-if="!loading && !issueTaskGroupList.length" description="暂无发料任务" />
        </div>

        <el-table v-else v-loading="loading" :data="issueTaskGroupList" border stripe row-key="key">
          <el-table-column label="需求单号" align="center" prop="demandNo" min-width="140" fixed="left">
            <template #default="{ row }">
              <el-link v-if="row.demandNo" type="primary" @click="goIssueTaskDetail(row)">{{ row.demandNo }}</el-link>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="单据类型" align="center" width="110">
            <template #default="scope">
              <dict-tag :options="wms_prepare_demand_type" :value="scope.row.demandType" />
            </template>
          </el-table-column>
          <el-table-column label="状态" align="center" width="96">
            <template #default="{ row }">
              <dict-tag :options="wms_prepare_demand_status" :value="row.demandStatus" />
            </template>
          </el-table-column>
          <el-table-column label="齐套率" align="center" min-width="120">
            <template #default="{ row }">
              <div class="kit-rate-cell">
                <span :style="{ color: kitRateColor(resolvePrepDemandKitRate(row)) }">{{ formatKitRate(resolvePrepDemandKitRate(row)) }}%</span>
                <el-progress :percentage="kitRatePercentValue(resolvePrepDemandKitRate(row))" :color="kitRateColor(resolvePrepDemandKitRate(row))" :stroke-width="10" :show-text="false" />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="待发" align="center" min-width="80">
            <template #default="{ row }">{{ formatQty(row.totalRequired) }}</template>
          </el-table-column>
          <el-table-column label="已发" align="center" min-width="80">
            <template #default="{ row }">{{ formatQty(row.totalIssuedQty) }}</template>
          </el-table-column>
          <el-table-column label="缺料" align="center" min-width="80">
            <template #default="{ row }">{{ formatQty(row.totalShortage) }}</template>
          </el-table-column>
          <el-table-column label="紧急" align="center" min-width="70">
            <template #default="{ row }"><el-tag v-if="row.isEmergency" type="danger" size="small">是</el-tag><span v-else>-</span></template>
          </el-table-column>
          <el-table-column label="领料人" align="center" prop="materialUserName" />
          <el-table-column label="创建时间" align="center" prop="createTime" min-width="160" />
        </el-table>
      </template>

      <template v-else>
        <div v-if="lineLayoutMode === 'card'" v-loading="loading" class="card-grid">
          <issue-task-line-card v-for="row in issueTaskList" :key="String(row.id)" :row="row" @issue="openLineIssueAction" />
          <el-empty v-if="!loading && !issueTaskList.length" description="暂无发料任务" />
        </div>

        <el-table v-else v-loading="loading" :data="issueTaskList" border stripe>
          <el-table-column label="需求单号" align="center" prop="demandNo" min-width="140" fixed="left">
            <template #default="{ row }">
              <el-link v-if="row.demandId" type="primary" @click="openDemandDetail(row.demandId)">{{ row.demandNo || '-' }}</el-link>
              <span v-else>{{ row.demandNo || '-' }}</span>
            </template>
          </el-table-column>
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

          <el-table-column label="单位" align="center" prop="inventoryUnit" width="64" />
          <prep-demand-inventory-columns />
          <prep-demand-location-source-column show-remark :rows="issueTaskList" />
          <el-table-column label="目标库位" align="center" min-width="100" show-overflow-tooltip>
            <template #default="{ row }">{{ row.targetDemandLocationCode || '-' }}</template>
          </el-table-column>
          <el-table-column label="行状态" align="center" width="96" fixed="right">
            <template #default="{ row }">
              <el-tag :type="lineStatusTag(row.lineStatus)" size="small">{{ lineStatusLabel(row.lineStatus) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="120" fixed="right">
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
      </template>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <prep-demand-detail-drawer v-model="detailVisible" :demand-id="currentDemandId" @go-issue="openIssueProcess" />
    <issue-process-drawer v-model="issueDrawerVisible" :issue-id="currentIssueId" @success="getList" />
    <issue-task-line-issue-dialog v-model="issueDialogVisible" :row="issueDialogRow" @success="getList" @result="onLineIssueResult" />
    <warehouse-dialog ref="warehouseDialogRef" @warehouse-select-call-back="warehouseSelectCallBack" />
  </div>
</template>

<script setup name="IssueTask" lang="ts">
import { formatQty, formatQtyWithUnit } from '@/utils/ruoyi';
import { computed, onMounted, ref } from 'vue';
import { Close, Bell } from '@element-plus/icons-vue';
import { ISSUE_TASK_STATUS_TAB_OPTIONS, canExecuteIssueTaskLine261, canIssueTaskLine261, formatIssueTaskLineActualIssueDisplay, formatIssueTaskLineIssuedDisplay, getIssueTaskGroupLayout, getIssueTaskLineActionLabel, getIssueTaskLineLayout, getIssueTaskViewMode, getIssueTaskWarehouse, isIssueTaskLineCompleted, lineStatusBadgeColor, lineStatusLabel, lineStatusTag, listIssueTaskDetail, listIssueTaskGroup, normalizeIssueTaskGroup, normalizeIssueTaskLineListResponse, removeIssueTaskWarehouse, resolveIssueTaskLineRemark, saveIssueTaskGroupLayout, saveIssueTaskLineLayout, saveIssueTaskViewMode, saveIssueTaskWarehouse, syncIssueTaskLineActualIssueDefaults } from '@/api/wms/issueTask';
import type { IssueTaskDemandGroup, IssueTaskDemandGroupVO, IssueTaskGroupLayoutMode, IssueTaskLineLayoutMode, IssueTaskLineVO, IssueTaskQuery, IssueTaskViewMode } from '@/api/wms/issueTask/types';
import type { WarehouseVO } from '@/api/wms/warehouse/types';
import WarehouseDialog from '@/views/wms/warehouse/components/warehouseDialog.vue';
import PrepDemandDetailDrawer from '@/views/wms/workOrderPrepDemand/components/PrepDemandDetailDrawer.vue';
import IssueProcessDrawer from '@/views/wms/materialIssue/components/IssueProcessDrawer.vue';
import IssueTaskGroupCard from './components/IssueTaskGroupCard.vue';
import IssueTaskLineCard from './components/IssueTaskLineCard.vue';
import IssueTaskLineIssueDialog from './components/IssueTaskLineIssueDialog.vue';
import PrepDemandInventoryColumns from '@/views/wms/allocation/components/PrepDemandInventoryColumns.vue';
import PrepDemandLocationSourceColumn from '@/views/wms/allocation/components/PrepDemandLocationSourceColumn.vue';
import { formatKitRate, kitRateColor, kitRatePercentValue, resolvePrepDemandKitRate } from '@/api/wms/workOrderPrepDemand/index';
import { PREP_DEMAND_STATUS_DICT, PREP_DEMAND_TYPE_DICT } from '@/api/wms/workOrderPrepDemand/index';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_prepare_demand_type, wms_prepare_demand_status } = toRefs<any>(proxy?.useDict(PREP_DEMAND_TYPE_DICT, PREP_DEMAND_STATUS_DICT));
const router = useRouter();
const { currentRoute } = router;

const issueTaskList = ref<IssueTaskLineVO[]>([]);
const issueTaskGroupList = ref<IssueTaskDemandGroup[]>([]);
const viewMode = ref<IssueTaskViewMode>('group');
const groupLayoutMode = ref<IssueTaskGroupLayoutMode>('card');
const lineLayoutMode = ref<IssueTaskLineLayoutMode>('card');
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const statusTab = ref('WAIT_PICK');
const tabCounts = ref<Record<string, number>>(Object.fromEntries(ISSUE_TASK_STATUS_TAB_OPTIONS.map((opt) => [opt.value, 0])));
const selectedWarehouseName = ref('');
const warehouseDialogRef = ref<InstanceType<typeof WarehouseDialog>>();
const queryFormRef = ref<ElFormInstance>();
const detailVisible = ref(false);
const currentDemandId = ref<number | string | null>(null);
const issueDrawerVisible = ref(false);
const currentIssueId = ref<number | string | null>(null);
const issueDialogVisible = ref(false);
const issueDialogRow = ref<IssueTaskLineVO | null>(null);
const resultMessage = ref('');
const resultStatus = ref(false);

const queryParams = ref<IssueTaskQuery>({
  pageNum: 1,
  pageSize: 10,
  warehouseCode: undefined,
  demandNo: undefined,
  workOrderNo: undefined,
  materialCode: undefined,
  lineStatus: 'WAIT_PICK',
  warehouseRoute: undefined
});

const warehouseDisplayLabel = computed(() => {
  const code = String(queryParams.value.warehouseCode || '').trim();
  if (!code) return '点击选择仓别';
  const name = String(selectedWarehouseName.value || '').trim();
  return name && name !== code ? `${code} ${name}` : code;
});

function formatMaterialUser(row: IssueTaskDemandGroup) {
  const name = String(row.materialUserName || '').trim();
  const code = String(row.materialUserCode || '').trim();
  if (name && code) return `${name} (${code})`;
  return name || code || '-';
}

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
  getList();
};

const clearWarehouseSelection = () => {
  queryParams.value.warehouseCode = undefined;
  selectedWarehouseName.value = '';
  removeIssueTaskWarehouse(currentRoute.value.fullPath);
  queryParams.value.pageNum = 1;
  getList();
};

const getList = async () => {
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
    }
  } finally {
    loading.value = false;
  }
};

const onLineLayoutChange = () => {
  saveIssueTaskLineLayout(currentRoute.value.fullPath, lineLayoutMode.value);
};

const onGroupLayoutChange = () => {
  saveIssueTaskGroupLayout(currentRoute.value.fullPath, groupLayoutMode.value);
};

const onViewModeChange = () => {
  saveIssueTaskViewMode(currentRoute.value.fullPath, viewMode.value);
  queryParams.value.pageNum = 1;
  applyStatusTabToQuery(statusTab.value);
  getList();
};

const applyStatusTabToQuery = (tab: string) => {
  queryParams.value.lineStatus = tab || undefined;
};

const setViewMode = (mode: IssueTaskViewMode) => {
  if (viewMode.value === mode) return;
  viewMode.value = mode;
  onViewModeChange();
};

const onStatusTabChange = (tab: string | number) => {
  applyStatusTabToQuery(String(tab));
  queryParams.value.pageNum = 1;
  getList();
};

const handleQuery = () => {
  applyStatusTabToQuery(statusTab.value);
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  statusTab.value = 'WAIT_PICK';
  queryFormRef.value?.resetFields();
  applyStatusTabToQuery(statusTab.value);
  queryParams.value.pageNum = 1;
  getList();
};

const openDemandDetail = (demandId: number | string) => {
  currentDemandId.value = demandId;
  detailVisible.value = true;
};

const openIssueProcess = (issueId: number | string) => {
  currentIssueId.value = issueId;
  issueDrawerVisible.value = true;
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

const onLineIssueResult = (payload: { message: string; success: boolean }) => {
  resultMessage.value = payload.message;
  resultStatus.value = payload.success;
};

const handleExport = () => {
  const path = viewMode.value === 'group' ? 'wms/materialIssueWorkbench/prepLocationRec/groupExport' : 'wms/materialIssueWorkbench/prepLocationRec/export';
  proxy?.download(path, { ...queryParams.value }, `issueTask_${viewMode.value}_${Date.now()}.xlsx`);
};

onMounted(() => {
  viewMode.value = getIssueTaskViewMode(currentRoute.value.fullPath);
  groupLayoutMode.value = getIssueTaskGroupLayout(currentRoute.value.fullPath);
  lineLayoutMode.value = getIssueTaskLineLayout(currentRoute.value.fullPath);
  applyStatusTabToQuery(statusTab.value);
  restoreWarehouseFromCache();
  getList();
});
</script>

<style scoped lang="scss">
.issue-task-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.warehouse-filter-card {
  :deep(.el-card__body) {
    padding: 0;
  }
}

.warehouse-filter-panel {
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.warehouse-filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.warehouse-select-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.view-mode-switch {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 5px 10px 5px 12px;
  background: #fff;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.view-mode-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.view-mode-tabs {
  display: inline-flex;
  padding: 3px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  gap: 2px;
}

.view-mode-tab {
  min-width: 56px;
  padding: 5px 14px;
  font-size: 13px;
  line-height: 1.4;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition:
    color 0.2s,
    background 0.2s,
    box-shadow 0.2s;

  &.active {
    background: #fff;
    color: var(--el-color-primary);
    font-weight: 500;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
  }

  &:hover:not(.active) {
    color: var(--el-text-color-primary);
  }
}

.dashed-blue-btn {
  border: 1px dashed #3b82f6 !important;
  color: #3b82f6 !important;
  background-color: rgba(59, 130, 246, 0.05) !important;
}

.dashed-blue-btn:hover {
  border-color: #2563eb !important;
  color: #2563eb !important;
  background-color: rgba(59, 130, 246, 0.1) !important;
}

.status-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }
}

.kit-rate-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 8px;
  width: 100%;

  > span {
    text-align: center;
  }

  :deep(.el-progress) {
    width: 100%;
  }
}

.list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.list-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.list-toolbar-right {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.result-alert {
  margin-bottom: 12px;
}

.result-alert :deep(.el-alert) {
  padding: 6px 10px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
  align-items: start;
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
