<template>
  <div class="p-2 prep-demand-page">
    <el-row :gutter="12" class="stats-row">
      <el-col :xs="12" :sm="6">
        <div class="stat-card">
          <div class="stat-label">需求单总数</div>
          <div class="stat-value">{{ total }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card warning">
          <div class="stat-label">本页缺料单</div>
          <div class="stat-value">{{ pageShortageCount }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card danger">
          <div class="stat-label">本页紧急单</div>
          <div class="stat-value">{{ pageEmergencyCount }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card primary">
          <div class="stat-label">本页平均齐套率</div>
          <div class="stat-value">{{ pageAvgKitRate }}%</div>
        </div>
      </el-col>
    </el-row>

    <el-tabs v-model="statusTab" class="status-tabs" @tab-change="onStatusTabChange">
      <el-tab-pane name="all">
        <template #label>
          <el-badge :value="tabCounts.all" class="tab-badge" :color="ALL_TAB_BADGE_COLOR" :offset="[10, 0]" :show-zero="true" :max="9999999999">
            <span>全部</span>
          </el-badge>
        </template>
      </el-tab-pane>
      <el-tab-pane v-for="opt in wms_prepare_demand_status" :key="opt.value" :name="opt.value">
        <template #label>
          <el-badge :value="tabCounts[opt.value]" class="tab-badge" :color="prepDemandTabBadgeColor(opt.value)" :offset="[10, 0]" :show-zero="true" :max="9999999999">
            <span>{{ opt.label }}</span>
          </el-badge>
        </template>
      </el-tab-pane>
      <el-tab-pane name="overPick">
        <template #label>
          <el-badge :value="tabCounts.overPick" class="tab-badge" color="#f56c6c" :offset="[10, 0]" :show-zero="true" :max="9999999999">
            <span>超领单</span>
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
            <el-form-item label="物料编码" prop="materialCode">
              <el-input v-model="queryParams.materialCode" placeholder="物料编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="单据类型" prop="demandType">
              <el-select v-model="queryParams.demandType" placeholder="全部" clearable style="width: 140px">
                <el-option v-for="opt in wms_prepare_demand_type" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="demandStatus">
              <el-select v-model="queryParams.demandStatus" placeholder="全部" clearable :disabled="statusTab !== 'all'" style="width: 140px">
                <el-option v-for="opt in wms_prepare_demand_status" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="紧急" prop="isEmergency">
              <el-select v-model="queryParams.isEmergency" placeholder="全部" clearable style="width: 100px">
                <el-option label="是" :value="true" />
                <el-option label="否" :value="false" />
              </el-select>
            </el-form-item>
            <!--            <el-form-item label="创建时间">
              <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" range-separator="-" start-placeholder="开始" end-placeholder="结束" style="width: 240px" />
            </el-form-item>-->
            <el-form-item label="创建时间" prop="dateTimeRange">
              <el-date-picker v-model="dateRange" type="datetimerange" :shortcuts="shortcuts" value-format="YYYY-MM-DD HH:mm:ss" range-separator="-" start-placeholder="请选择开始日期" end-placeholder="请选择结束日期" :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="never" class="list-card">
      <template #header>
        <div class="list-toolbar">
          <div class="toolbar-left">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:workOrderPrepDemand:edit']">修改</el-button>
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:workOrderPrepDemand:remove']">删除</el-button>
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:workOrderPrepDemand:export']">导出</el-button>
          </div>
          <div class="toolbar-right">
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button value="card">卡片</el-radio-button>
              <el-radio-button value="table">表格</el-radio-button>
            </el-radio-group>
            <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
          </div>
        </div>
      </template>

      <div v-loading="loading">
        <div v-if="viewMode === 'card'" class="card-grid">
          <prep-demand-card v-for="row in prepDemandList" :key="row.id" :row="row" @detail="openDetail" @issue="openIssue" @edit="handleUpdate" @delete="handleDelete" />
          <el-empty v-if="!prepDemandList.length" description="暂无备料需求" />
        </div>

        <template v-else>
          <el-table :data="prepDemandList" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column label="需求单号" align="center" prop="demandNo" min-width="160">
              <template #default="{ row }">
                <router-link :to="'/workOrderPrepDemandLine?demandNo=' + row.demandNo" class="link-type">
                  <span>{{ row.demandNo }}</span>
                </router-link>
              </template>
            </el-table-column>
            <el-table-column label="单据类型" align="center" min-width="110">
              <template #default="{ row }">
                <dict-tag :options="wms_prepare_demand_type" :value="row.demandType" />
              </template>
            </el-table-column>
            <el-table-column label="状态" align="center" prop="demandStatus" min-width="100">
              <template #default="{ row }">
                <dict-tag :options="wms_prepare_demand_status" :value="row.demandStatus" />
              </template>
            </el-table-column>
            <el-table-column label="齐套率" align="center" min-width="120">
              <template #default="{ row }">
                <div class="table-kit">
                  <span :style="{ color: kitRateColor(resolvePrepDemandKitRate(row)) }">{{ formatKitRate(resolvePrepDemandKitRate(row)) }}%</span>
                  <el-progress :percentage="kitRatePercentValue(resolvePrepDemandKitRate(row))" :color="kitRateColor(resolvePrepDemandKitRate(row))" :stroke-width="8" :show-text="false" />
                </div>
              </template>
            </el-table-column>
            <!--            <el-table-column label="工单数" align="center" prop="workOrderCount" min-width="80" />-->
            <el-table-column label="待发" align="center" min-width="80">
              <template #default="{ row }">{{ formatQty(row.totalRequired) ?? '-' }}</template>
            </el-table-column>
            <el-table-column label="已发" align="center" min-width="80">
              <template #default="{ row }">{{ formatQty(row.totalIssuedQty) ?? '-' }}</template>
            </el-table-column>
            <el-table-column label="缺料" align="center" min-width="80">
              <template #default="{ row }">{{ formatQty(row.totalShortage) ?? '-' }}</template>
            </el-table-column>
            <el-table-column label="紧急" align="center" min-width="70">
              <template #default="{ row }"><el-tag v-if="row.isEmergency" type="danger" size="small">是</el-tag><span v-else>-</span></template>
            </el-table-column>
            <el-table-column label="创建时间" align="center" prop="createTime" min-width="160"> </el-table-column>
            <el-table-column label="操作" align="center" width="160" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" icon="View" @click="openDetail(row.id)" v-hasPermi="['wms:workOrderPrepDemand:query']"></el-button>
                <el-button link type="primary" icon="Edit" @click="handleUpdate(row)" v-hasPermi="['wms:workOrderPrepDemand:edit']" />
                <el-button link type="danger" icon="Delete" @click="handleDelete(row)" v-hasPermi="['wms:workOrderPrepDemand:remove']" />
              </template>
            </el-table-column>
          </el-table>
        </template>
      </div>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <prep-demand-detail-drawer v-model="detailVisible" :demand-id="currentDemandId" @edit="openEditFromDetail" @go-issue="openIssue" />

    <el-dialog :title="dialog.title" v-model="dialog.visible" width="520px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="需求单号"><el-input v-model="form.demandNo" disabled /></el-form-item>
        <el-form-item label="单据类型">
          <el-input :model-value="proxy?.selectDictLabel(wms_prepare_demand_type, form.demandType)" disabled />
        </el-form-item>
        <el-form-item label="状态" prop="demandStatus">
          <el-select v-model="form.demandStatus" placeholder="请选择状态" style="width: 100%">
            <el-option v-for="opt in wms_prepare_demand_status" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="紧急" prop="isEmergency"><el-switch v-model="form.isEmergency" /></el-form-item>
        <el-form-item v-if="form.isEmergency" label="紧急等级" prop="emergencyLevel"><el-input-number v-model="form.emergencyLevel" :min="1" :max="9" /></el-form-item>
        <el-form-item v-if="form.isEmergency" label="紧急原因" prop="emergencyReason"><el-input v-model="form.emergencyReason" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="备注" prop="remark"><el-input v-model="form.remark" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="buttonLoading" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <issue-process-drawer v-model="issueDrawerVisible" :issue-id="currentIssueId" />
  </div>
</template>

<script setup name="WorkOrderPrepDemand" lang="ts">
import { formatQty, formatQtyWithUnit } from '@/utils/ruoyi';
import { listWorkOrderPrepDemand, getPrepDemand, updateWorkOrderPrepDemand, delWorkOrderPrepDemand } from '@/api/wms/workOrderPrepDemand';
import type { WorkOrderPrepDemandForm, WorkOrderPrepDemandQuery, WorkOrderPrepDemandVO } from '@/api/wms/workOrderPrepDemand/types';
import PrepDemandDetailDrawer from './components/PrepDemandDetailDrawer.vue';
import PrepDemandCard from './components/PrepDemandCard.vue';
import IssueProcessDrawer from '@/views/wms/materialIssue/components/IssueProcessDrawer.vue';
import { demandStatusTag, formatKitRate, kitRateColor, kitRatePercentValue, resolvePrepDemandKitRate, PREP_DEMAND_STATUS_DICT, PREP_DEMAND_TYPE_DICT, PREP_DEMAND_TYPE_OVER_PICK } from '@/api/wms/workOrderPrepDemand/index';

const ALL_TAB_BADGE_COLOR = '#909399';

const BADGE_COLOR_MAP: Record<string, string> = {
  primary: '#409eff',
  success: '#67c23a',
  info: '#909399',
  warning: '#e6a23c',
  danger: '#f56c6c'
};

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_prepare_demand_type, wms_prepare_demand_status } = toRefs<any>(proxy?.useDict(PREP_DEMAND_TYPE_DICT, PREP_DEMAND_STATUS_DICT));
const prepDemandList = ref<WorkOrderPrepDemandVO[]>([]);
const loading = ref(true);
const buttonLoading = ref(false);
const showSearch = ref(true);
const viewMode = ref<'card' | 'table'>('card');
const statusTab = ref('all');
const tabCounts = ref<Record<string, number>>({
  all: 0,
  shortage: 0,
  overPick: 0
});
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const dateRange = ref<[string, string] | null>(null);
const queryFormRef = ref<ElFormInstance>();
const formRef = ref<ElFormInstance>();
const detailVisible = ref(false);
const currentDemandId = ref<number | string | null>(null);
const issueDrawerVisible = ref(false);
const currentIssueId = ref<number | string | null>(null);
const dialog = reactive<DialogOption>({ visible: false, title: '' });
const initFormData: WorkOrderPrepDemandForm = { id: undefined, demandNo: undefined, demandType: undefined, demandStatus: undefined, isEmergency: false, emergencyLevel: undefined, emergencyReason: undefined, remark: undefined };
const data = reactive<PageData<WorkOrderPrepDemandForm, WorkOrderPrepDemandQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    demandNo: undefined,
    demandType: undefined,
    materialCode: undefined,
    demandStatus: undefined,
    checkPassed: undefined,
    isEmergency: undefined,
    params: {}
  },
  rules: { demandStatus: [{ required: true, message: '状态不能为空', trigger: 'change' }] }
});
const { queryParams, form, rules } = toRefs(data);

const shortcuts = [
  {
    text: '今天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate());
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '昨天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近两天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近三天',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 2);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近一周',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近一月',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  },
  {
    text: '近三月',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 3);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    }
  }
];

const pageShortageCount = computed(() => prepDemandList.value.filter((row) => Number(row.totalShortage ?? 0) > 0 || Number(row.shortageLines ?? 0) > 0).length);
const pageEmergencyCount = computed(() => prepDemandList.value.filter((row) => row.isEmergency).length);
const pageAvgKitRate = computed(() => {
  if (!prepDemandList.value.length) return '0.0';
  const sum = prepDemandList.value.reduce((acc, row) => acc + kitRatePercentValue(resolvePrepDemandKitRate(row)), 0);
  return (sum / prepDemandList.value.length).toFixed(1);
});

const prepDemandTabBadgeColor = (status: string) => {
  const tag = demandStatusTag(status, wms_prepare_demand_status.value);
  return BADGE_COLOR_MAP[tag] || ALL_TAB_BADGE_COLOR;
};

const syncTabCountKeys = () => {
  const next: Record<string, number> = {
    all: tabCounts.value.all ?? 0,
    shortage: tabCounts.value.shortage ?? 0,
    overPick: tabCounts.value.overPick ?? 0
  };
  (wms_prepare_demand_status.value || []).forEach((opt: DictDataOption) => {
    const key = String(opt.value);
    next[key] = tabCounts.value[key] ?? 0;
  });
  tabCounts.value = next;
};

const applyStatusTabToQuery = (tab: string) => {
  if (tab === 'all') {
    queryParams.value.checkPassed = undefined;
    return;
  }
  if (tab === 'shortage') {
    queryParams.value.demandStatus = undefined;
    queryParams.value.checkPassed = false;
    queryParams.value.demandType = undefined;
    return;
  }
  if (tab === 'overPick') {
    queryParams.value.demandStatus = undefined;
    queryParams.value.checkPassed = undefined;
    queryParams.value.demandType = PREP_DEMAND_TYPE_OVER_PICK;
    return;
  }
  queryParams.value.demandStatus = tab;
  queryParams.value.checkPassed = undefined;
  queryParams.value.demandType = undefined;
};

const resetStatusTabQueryFilters = (tab: string) => {
  if (tab === 'all') {
    queryParams.value.demandStatus = undefined;
    queryParams.value.checkPassed = undefined;
    queryParams.value.demandType = undefined;
    return;
  }
  applyStatusTabToQuery(tab);
};

const buildTabQuery = (tab: string): WorkOrderPrepDemandQuery => {
  const base: WorkOrderPrepDemandQuery = {
    ...queryParams.value,
    pageNum: 1,
    pageSize: 1,
    demandStatus: undefined,
    checkPassed: undefined,
    demandType: undefined
  };
  if (tab === 'all') return base;
  if (tab === 'shortage') return { ...base, checkPassed: false };
  if (tab === 'overPick') return { ...base, demandType: PREP_DEMAND_TYPE_OVER_PICK };
  return { ...base, demandStatus: tab };
};

const loadTabCounts = async () => {
  syncDateRange();
  syncTabCountKeys();
  const tabs = ['all', ...(wms_prepare_demand_status.value || []).map((opt: DictDataOption) => String(opt.value)), 'shortage', 'overPick'];
  const entries = await Promise.all(
    tabs.map(async (tab) => {
      const res = await listWorkOrderPrepDemand(buildTabQuery(tab));
      return [tab, res.total || 0] as const;
    })
  );
  tabCounts.value = Object.fromEntries(entries);
};

const syncDateRange = () => {
  if (dateRange.value?.length === 2) queryParams.value.params = { beginCreateTime: dateRange.value[0], endCreateTime: dateRange.value[1] };
  else queryParams.value.params = {};
};

const onStatusTabChange = (tab: string | number) => {
  queryParams.value.pageNum = 1;
  resetStatusTabQueryFilters(String(tab));
  loadTabCounts();
  getList();
};

const getList = async () => {
  loading.value = true;
  syncDateRange();
  applyStatusTabToQuery(statusTab.value);
  try {
    const res = await listWorkOrderPrepDemand(queryParams.value);
    prepDemandList.value = res.rows;
    total.value = res.total;
    tabCounts.value[statusTab.value] = res.total;
  } finally {
    loading.value = false;
  }
};

const reset = () => {
  form.value = { ...initFormData };
  formRef.value?.resetFields();
};
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};
const resetQuery = () => {
  dateRange.value = null;
  statusTab.value = 'all';
  queryFormRef.value?.resetFields();
  handleQuery();
};
const handleSelectionChange = (selection: WorkOrderPrepDemandVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length !== 1;
  multiple.value = !selection.length;
};
const openDetail = (id: number | string) => {
  currentDemandId.value = id;
  detailVisible.value = true;
};

const openIssue = (issueId: number | string) => {
  currentIssueId.value = issueId;
  issueDrawerVisible.value = true;
};
const fillFormFromDemand = (demand: WorkOrderPrepDemandVO) => {
  form.value = { id: demand.id, demandNo: demand.demandNo, demandType: demand.demandType, demandStatus: demand.demandStatus, isEmergency: demand.isEmergency ?? false, emergencyLevel: demand.emergencyLevel, emergencyReason: demand.emergencyReason, remark: demand.remark };
};
const handleUpdate = async (row?: WorkOrderPrepDemandVO) => {
  reset();
  const id = row?.id ?? ids.value[0];
  const res = await getPrepDemand(id);
  fillFormFromDemand(res.data);
  dialog.visible = true;
  dialog.title = '修改备料需求';
};
const openEditFromDetail = (demand: WorkOrderPrepDemandVO) => {
  reset();
  fillFormFromDemand(demand);
  dialog.visible = true;
  dialog.title = '修改备料需求';
};
const submitForm = () => {
  formRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    buttonLoading.value = true;
    try {
      await updateWorkOrderPrepDemand(form.value);
      proxy?.$modal.msgSuccess('修改成功');
      dialog.visible = false;
      await getList();
    } finally {
      buttonLoading.value = false;
    }
  });
};
const handleDelete = async (row?: WorkOrderPrepDemandVO) => {
  const deleteIds = row?.id ?? ids.value;
  await proxy?.$modal.confirm(`是否确认删除备料需求编号为"${deleteIds}"的数据项？`);
  await delWorkOrderPrepDemand(deleteIds);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};
const handleExport = () => {
  syncDateRange();
  applyStatusTabToQuery(statusTab.value);
  proxy?.download('wms/workOrderPrepDemand/export', { ...queryParams.value }, `workOrderPrepDemand_${Date.now()}.xlsx`);
};
watch(wms_prepare_demand_status, () => syncTabCountKeys(), { immediate: true });
onMounted(() => {
  loadTabCounts();
  getList();
});
</script>

<style scoped lang="scss">
.prep-demand-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stats-row {
  margin-bottom: 4px;
}

.stat-card {
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid var(--el-text-color-secondary);

  &.warning {
    border-color: var(--el-color-warning-light-5);
  }

  &.danger {
    border-color: var(--el-color-danger-light-5);
  }

  &.primary {
    border-color: var(--el-color-primary-light-5);
  }
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.stat-value {
  margin-top: 6px;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

.status-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }

  :deep(.tab-badge .el-badge__content) {
    border: none;
  }
}

.list-card {
  :deep(.el-card__header) {
    padding-bottom: 8px;
  }
}

.list-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
  min-height: 120px;
}

.table-kit {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 8px;
}
</style>
