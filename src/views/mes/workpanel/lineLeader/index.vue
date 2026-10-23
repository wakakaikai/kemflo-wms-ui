<template>
  <div class="p-2 line-leader-page">
    <div class="workbench-shell">
      <aside class="workbench-side">
        <section class="side-section">
          <div class="side-title">
            <span>当前资源</span>
            <el-button link type="primary" icon="Search" @click="openResourceDialog">选择</el-button>
          </div>
          <button type="button" class="resource-card" @click="openResourceDialog">
            <el-icon>
              <Cpu />
            </el-icon>
            <span>
              <strong>{{ podConfig.resource || '未选择资源' }}</strong>
              <small>{{ podConfig.resourceDesc || '选择资源后可加载工单记录' }}</small>
            </span>
          </button>
        </section>

        <section class="side-section side-section--grow">
          <div class="side-title">
            <span>工单收藏</span>
            <el-button link type="primary" icon="Plus" @click="openShopOrderDialog">添加</el-button>
          </div>
          <div class="side-panel-body" :class="{ 'is-empty': !workOrderFavoriteList.length }">
            <el-empty v-if="!workOrderFavoriteList.length" description="暂无收藏" :image-size="56" />
            <div v-else class="order-list">
              <button v-for="item in workOrderFavoriteList" :key="item.shopOrder" type="button" class="order-list-item" :class="{ 'is-active': item.shopOrder === podConfig.shopOrder }" @click="switchWorkOrder(item)">
                <span>
                  <strong>{{ item.shopOrder }}</strong>
                  <small>{{ item.shopOrderDesc || '-' }}</small>
                </span>
                <el-button link type="danger" icon="Close" @click.stop="removeWorkOrderFavorite(item.shopOrder)" />
              </button>
            </div>
          </div>
        </section>

        <section class="side-section side-section--grow">
          <div class="side-title">
            <span>最近工单</span>
            <el-button link type="primary" icon="Search" @click="openShopOrderDialog">查找</el-button>
          </div>
          <div class="side-panel-body" :class="{ 'is-empty': !recentWorkOrderList.length }">
            <el-empty v-if="!recentWorkOrderList.length" description="暂无最近工单" :image-size="56" />
            <div v-else class="order-list">
              <button v-for="item in recentWorkOrderList" :key="item.shopOrder" type="button" class="order-list-item" :class="{ 'is-active': item.shopOrder === podConfig.shopOrder }" @click="switchWorkOrder(item)">
                <span>
                  <strong>{{ item.shopOrder }}</strong>
                  <small>{{ item.shopOrderDesc || '-' }}</small>
                </span>
              </button>
            </div>
          </div>
        </section>
      </aside>

      <main class="workbench-main">
        <el-card shadow="hover" class="main-panel-card">
          <div class="work-order-head">
            <div class="work-order-title">
              <strong>{{ podConfig.shopOrder || '' }}</strong>
            </div>
            <div class="head-actions">
              <el-button type="primary" icon="Search" @click="openShopOrderDialog">查找工单</el-button>
              <el-button plain type="primary" icon="Star" :disabled="!podConfig.shopOrder" @click="addCurrentWorkOrderFavorite">收藏工单</el-button>
              <el-button plain icon="Close" :disabled="!podConfig.shopOrder" @click="clearSelection('shopOrder')">清空</el-button>
            </div>
          </div>

          <div class="metric-grid">
            <div class="metric-item">
              <span>产品描述</span>
              <strong>{{ podConfig.shopOrderDesc || '-' }}</strong>
            </div>
            <div class="metric-item">
              <span>计划数量</span>
              <strong>{{ formatIntegerValue(podConfig.qtyToBuild) }}</strong>
            </div>
            <div class="metric-item">
              <span>已完成数量</span>
              <strong>{{ formatIntegerValue(podConfig.qtyDone) }}</strong>
            </div>
            <div class="metric-item">
              <span>已报工数</span>
              <strong>{{ formatIntegerValue(qtyReportedCounted) }}</strong>
            </div>
            <div class="metric-item">
              <span>已报工待上传数</span>
              <strong>{{ formatIntegerValue(qtyPendingUpload) }}</strong>
            </div>
          </div>

          <div class="primary-actions">
            <el-button type="primary" @click="handleReleaseShopOrder">
              <el-icon>
                <DocumentAdd />
              </el-icon>
              工单下达
            </el-button>
            <el-button color="#3b82f6" class="text-white" @click="openWorkStartPage">
              <el-icon>
                <VideoPlay />
              </el-icon>
              开工登记
            </el-button>
            <el-button color="#22c55e" class="text-white" @click="openWorkCompletePage()">
              <el-icon>
                <CircleCheck />
              </el-icon>
              完工汇报
            </el-button>
            <el-button color="#10b981" class="text-white" @click="handleStaffOnline">
              <el-icon>
                <User />
              </el-icon>
              员工刷卡上线
            </el-button>
            <el-button color="#ef4444" class="text-white" @click="handleStaffOffline">
              <el-icon>
                <UserFilled />
              </el-icon>
              员工下线
            </el-button>
            <el-button plain type="primary" @click="openEmployeeFavoriteDialog">
              <el-icon>
                <Star />
              </el-icon>
              员工收藏
            </el-button>
          </div>

          <div class="records-section">
            <div class="detail-header">
              <span>开工/完工记录</span>
              <div class="records-actions">
                <el-button v-if="selectedReport?.status === 0" type="primary" @click="openWorkCompletePage(selectedReport)">完工登记</el-button>
                <el-button v-if="selectedReport?.status === 4 || selectedReport?.status === 7" type="warning" @click="openWorkCompletePage(selectedReport)">重新报工</el-button>
                <el-button v-if="selectedReport?.status === 8" type="warning" @click="handleRetryCancelReport(selectedReport)">重新取消SAP报工</el-button>
                <el-button v-if="selectedReport?.status === 0" type="danger" @click="handleReplayReport(selectedReport)">删除开工</el-button>
                <el-button v-if="selectedReport?.status === 1 || selectedReport?.status === 4 || selectedReport?.status === 7" type="danger" @click="handleReplayReport(selectedReport)">取消完工状态</el-button>
                <el-button v-if="selectedReport?.status === 3" type="danger" @click="handleReplayReport(selectedReport)">取消SAP报工</el-button>
                <el-button v-if="selectedReport?.status === 8" type="primary" @click="handleReplayReport(selectedReport)">恢复报工</el-button>
                <el-button link type="primary" icon="Refresh" :disabled="!podConfig.shopOrder" @click="() => loadPanelData()">刷新</el-button>
              </div>
            </div>
            <div class="records-body" :class="{ 'is-empty': !reportList.length && !loading }">
              <el-empty v-if="!reportList.length && !loading" description="暂无开工/完工记录" :image-size="72" />
              <el-table v-else ref="reportTableRef" v-loading="loading" :data="reportList" highlight-current-row height="100%" class="records-table" :row-class-name="reportRowClassName" @row-click="handleReportRowClick">
                <el-table-column width="48" align="center">
                  <template #default="{ row }">
                    <el-radio :model-value="selectedReport?.id" :value="row.id" :disabled="!isReportSelectable(row.status)" class="report-row-radio" />
                  </template>
                </el-table-column>
                <el-table-column label="状态" min-width="100">
                  <template #default="{ row }">
                    <div class="status-cell">
                      <small>{{ statusLabel(row.status) }}</small>
                      <small>{{ statusSubLabel(row.status) }}</small>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="开工时间" prop="startDateTime" min-width="155" align="center" />
                <el-table-column label="完工时间" prop="endDateTime" min-width="155" align="center" />
                <el-table-column label="班次" prop="productionShift" min-width="90" align="center" />
                <el-table-column label="人数" prop="personNumber" width="60" align="center" />
                <el-table-column label="良品数" prop="qtyReport" width="90" align="center">
                  <template #default="{ row }">{{ formatIntegerValue(row.qtyReport) }}</template>
                </el-table-column>
                <el-table-column label="不良数量" prop="qtyScrapped" width="90" align="center">
                  <template #default="{ row }">{{ formatIntegerValue(row.qtyScrapped) }}</template>
                </el-table-column>
                <el-table-column label="报工结果" min-width="180" show-overflow-tooltip>
                  <template #default="{ row }">
                    <span v-if="row.reportResult" :class="reportMessageClass(row.reportResult)">{{ row.reportMessage || '' }}</span>
                    <span v-else class="text-gray">-</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-card>
      </main>
    </div>

    <el-dialog v-model="employeeDialogVisible" :title="employeeDialogTitle" width="960px" class="workpanel-action-dialog" append-to-body destroy-on-close :close-on-click-modal="false">
      <WorkStartPanel
        v-model:active-tab="employeePanelTab"
        v-model:employee-card-input="employeeCardInput"
        v-model:employee-mode="employeeDialog.mode"
        :shop-order="employeeDialogShopOrder"
        :operation-desc="podConfig.operationDesc || podConfig.operation"
        :planned-item="podConfig.plannedItem"
        :product-desc="podConfig.shopOrderDesc"
        :qty-to-build="podConfig.qtyToBuild"
        :qty-done="podConfig.qtyDone"
        :standard-person-number="employeeDialogStandardPerson"
        :actual-person-number="workCenterOnlineEmployeeList.length"
        :production-shift="employeeDialogShift"
        :production-shift-list="productionShiftList"
        :shift-loading="productionShiftLoading"
        :start-date-time="employeeDialogStartTime"
        :shop-order-online-employees="shopOrderOnlineEmployeeList"
        :work-center-online-employees="workCenterOnlineEmployeeList"
        :report-employee-list="reportEmployeeList"
        :employee-favorite-list="employeeFavoriteList"
        :selected-employee-id="employeeForm.employeeId"
        show-mode-toggle
        show-history-tab
        @swipe-employee="handleSwipeCardEmployee"
        @favorite-select="applyFavoriteToEmployee"
        @add-favorite="addFavoriteFromInput"
        @select-online-employee="handleSelectOnlineEmployee"
      />
      <el-form ref="employeeFormRef" :model="employeeForm" :rules="employeeRules" class="hidden-employee-form">
        <el-form-item prop="employeeId">
          <el-input v-model="employeeForm.employeeId" />
        </el-form-item>
        <el-form-item prop="dateTime">
          <el-input v-model="employeeForm.dateTime" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="employeeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitEmployee">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="favoriteDialogVisible" title="员工收藏" width="640px" class="workpanel-action-dialog" append-to-body destroy-on-close>
      <div class="favorite-toolbar">
        <el-input v-model.trim="favoriteForm.employeeId" placeholder="员工工号" clearable />
        <el-input v-model.trim="favoriteForm.employeeName" placeholder="姓名" clearable />
        <el-button type="primary" @click="addFavoriteFromForm">添加</el-button>
      </div>
      <el-table :data="employeeFavoriteList" max-height="360">
        <el-table-column label="员工工号" prop="employeeId" />
        <el-table-column label="姓名" prop="employeeName" />
        <el-table-column label="操作" width="90">
          <template #default="{ row }">
            <el-button link type="danger" @click="removeFavorite(row)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="employeeConflictDialog.visible" title="员工已在线，请选择需要下线的条目" width="760px" append-to-body :close-on-click-modal="false">
      <el-alert type="warning" :closable="false" show-icon class="mb-[12px]" :title="employeeConflictDialog.status?.message || '员工已在其他位置上线，下线所选记录后可在当前工单重新上线'" />
      <el-table ref="employeeConflictTableRef" :data="employeeConflictDialog.status?.onlineBindingList || []" max-height="320" @selection-change="handleConflictSelectionChange">
        <el-table-column type="selection" width="48" />
        <el-table-column label="上线说明" min-width="420">
          <template #default="{ row }">
            {{ formatOnlineBindingDesc(row) }}
          </template>
        </el-table-column>
        <el-table-column label="工作中心" prop="workCenter" width="120" />
        <el-table-column label="工单号" prop="shopOrder" width="140" />
        <el-table-column label="上线时间" prop="onLineTime" min-width="170" />
      </el-table>
      <template #footer>
        <el-button @click="employeeConflictDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="confirmEmployeeConflictOnline">下线并当前工单上线</el-button>
      </template>
    </el-dialog>

    <ReleaseShopOrderDialog ref="releaseShopOrderDialogRef" :pod-config="podConfig" @closed="handleReleaseClosed" />
    <ResourceDialog ref="resourceDialogRef" @resource-call-back="resourceCallBack" />
    <ShopOrderDialog ref="shopOrderDialogRef" :podConfig="podConfig" @shop-order-call-back="shopOrderCallBack" />
  </div>
</template>

<script setup lang="ts">
import { CircleCheck, Cpu, DocumentAdd, Star, User, UserFilled, VideoPlay } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { useRouter } from 'vue-router';
import type { ShopOrderReportVO } from '@/api/mes/shopOrderReport/types';
import type { ShopOrderReportEmployeeVO } from '@/api/mes/shopOrderReportEmployee/types';
import { cancelWorkReport, checkEmployeeOnlineStatus, deleteEmployeeFavorite, employeeOffline, employeeOnline, getProductionShiftList, getShopOrderRouterStep, getWorkPanelData, listEmployeeFavorite, retryCancelWorkReport, saveEmployeeFavorite } from '@/api/mes/workpanel';
import type { WorkCenterEmployeeBindingVO, WorkPanelEmployeeFavoriteVO, WorkPanelEmployeeForm, WorkPanelEmployeeOnlineStatusVO, WorkPanelProductionShiftVO, WorkPanelRouterStepVO } from '@/api/mes/workpanel/types';

import ResourceDialog from '@/views/mes/workpanel/components/resourceDialog.vue';
import ShopOrderDialog from '@/views/mes/workpanel/components/shopOrderDialog.vue';
import ReleaseShopOrderDialog from '@/views/mes/workpanel/components/releaseShopOrderDialog.vue';
import WorkStartPanel from './components/WorkStartPanel.vue';
import { findProductionShiftByDateTime } from '@/views/mes/workpanel/utils/workPanelShift';

defineProps({
  id: {
    required: true,
    type: String
  }
});

const router = useRouter();
const { currentRoute } = router;
const resourceDialogRef = ref<InstanceType<typeof ResourceDialog>>();
const shopOrderDialogRef = ref<InstanceType<typeof ShopOrderDialog>>();
const releaseShopOrderDialogRef = ref<InstanceType<typeof ReleaseShopOrderDialog>>();
const employeeFormRef = ref<FormInstance>();
const employeeConflictTableRef = ref();
const selectedConflictBindingIds = ref<Array<string | number>>([]);

type EmployeeFavorite = {
  id?: string | number;
  employeeId: string;
  employeeName: string;
};

const mapEmployeeFavorite = (item: WorkPanelEmployeeFavoriteVO): EmployeeFavorite => ({
  id: item.id,
  employeeId: item.content,
  employeeName: item.description || ''
});

type WorkOrderFavorite = {
  shopOrder: string;
  shopOrderDesc?: string;
  plannedItem?: string;
  plannedItemBo?: string;
  item?: string;
  itemBo?: string;
  qtyToBuild?: number | string;
  qtyDone?: number | string;
  qtyReleased?: number | string;
  operation?: string;
  operationDesc?: string;
};

const podConfig = ref<Record<string, any>>({});
const loading = ref(false);
const routeLoading = ref(false);
const submitLoading = ref(false);
const reportList = ref<ShopOrderReportVO[]>([]);
const productionShiftList = ref<WorkPanelProductionShiftVO[]>([]);
const productionShiftLoading = ref(false);
const employeeDialogVisible = ref(false);
const favoriteDialogVisible = ref(false);
const onlineEmployeeList = ref<WorkCenterEmployeeBindingVO[]>([]);
const workCenterOnlineEmployeeList = ref<WorkCenterEmployeeBindingVO[]>([]);
const reportEmployeeList = ref<ShopOrderReportEmployeeVO[]>([]);
/** 已报工数：ERP 集成消息 counted=true 累加 */
const qtyReportedCounted = ref(0);
/** 已报工待上传数：报工记录 status 非 3 且非 -1 累加 */
const qtyPendingUpload = ref(0);
const routeStepList = ref<WorkPanelRouterStepVO[]>([]);
const selectedReport = ref<ShopOrderReportVO>();
const selectedOnlineRows = ref<WorkCenterEmployeeBindingVO[]>([]);
const employeeCardInput = ref('');
const employeePanelTab = ref<'shopOrder' | 'workCenter' | 'history'>('shopOrder');
const employeeFavoriteList = ref<EmployeeFavorite[]>([]);
const workOrderFavoriteList = ref<WorkOrderFavorite[]>([]);
const recentWorkOrderList = ref<WorkOrderFavorite[]>([]);
const employeeDialogTitle = computed(() => (employeeDialog.mode === 'offline' ? '员工下线' : '员工刷卡上线'));

const quickForm = reactive({
  productionShift: '',
  startDateTime: ''
});

const employeeDialog = reactive<{ title: string; mode: 'online' | 'offline' }>({
  title: '员工刷卡上线',
  mode: 'online'
});

const employeeConflictDialog = reactive<{
  visible: boolean;
  status?: WorkPanelEmployeeOnlineStatusVO;
  payload?: WorkPanelEmployeeForm;
}>({
  visible: false
});

const employeeForm = reactive<WorkPanelEmployeeForm>({
  reportId: undefined,
  workCenter: '',
  resrce: '',
  shopOrder: '',
  employeeId: '',
  employeeName: '',
  dateTime: ''
});

const favoriteForm = reactive<EmployeeFavorite>({
  employeeId: '',
  employeeName: ''
});

const employeeRules: FormRules = {
  employeeId: [{ required: true, message: '员工工号不能为空', trigger: 'blur' }],
  dateTime: [{ required: true, message: '时间不能为空', trigger: 'change' }]
};

const now = () => {
  const date = new Date();
  const pad = (value: number) => `${value}`.padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const formatIntegerValue = (value?: number | string) => {
  if (value === undefined || value === null || value === '') return '-';
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? String(value) : numberValue.toFixed(0);
};

const requirePanelSelection = () => {
  if (!podConfig.value.resource) {
    ElMessage.warning('请先选择资源');
    return false;
  }
  if (!podConfig.value.shopOrder) {
    ElMessage.warning('请先选择工单号');
    return false;
  }
  return true;
};

const sumReportQty = (list: ShopOrderReportVO[], predicate: (row: ShopOrderReportVO) => boolean) => list.reduce((total, row) => (predicate(row) ? total + Number(row.qtyReport || 0) : total), 0);

const loadPanelData = async (options?: { keepSelection?: boolean }) => {
  if (!podConfig.value.shopOrder) {
    reportList.value = [];
    onlineEmployeeList.value = [];
    reportEmployeeList.value = [];
    qtyReportedCounted.value = 0;
    qtyPendingUpload.value = 0;
    selectedReport.value = undefined;
    return;
  }
  const keepId = options?.keepSelection ? selectedReport.value?.id : undefined;
  loading.value = true;
  try {
    const res = await getWorkPanelData({
      workCenter: podConfig.value.workCenter,
      resrce: podConfig.value.resource,
      shopOrder: podConfig.value.shopOrder,
      reportId: selectedReport.value?.id
    });
    reportList.value = res.data?.reportList || [];
    onlineEmployeeList.value = res.data?.onlineEmployeeList || [];
    reportEmployeeList.value = res.data?.reportEmployeeList || [];
    qtyReportedCounted.value = Number(res.data?.qtyReportedCounted ?? 0);
    // 后端优先；若未返回则前端按 status 非 3 且非 -1 累加良品数
    const pendingFromApi = res.data?.qtyPendingUpload;
    qtyPendingUpload.value = pendingFromApi !== undefined && pendingFromApi !== null ? Number(pendingFromApi) : sumReportQty(reportList.value, (row) => row.status !== 3 && row.status !== -1);
    if (keepId !== undefined && keepId !== null) {
      const matched = reportList.value.find((item) => item.id === keepId);
      selectedReport.value = matched && isReportSelectable(matched.status) ? matched : undefined;
      nextTick(() => reportTableRef.value?.setCurrentRow?.(selectedReport.value));
    } else if (!options?.keepSelection) {
      selectedReport.value = undefined;
    }
  } finally {
    loading.value = false;
  }
};

const openResourceDialog = () => resourceDialogRef.value?.openDialog();
const openShopOrderDialog = () => {
  if (!podConfig.value.resource) {
    ElMessage.warning('请先选择资源');
    return;
  }
  shopOrderDialogRef.value?.openDialog();
};

const resourceCallBack = (data: any) => {
  podConfig.value.resource = data.resrce;
  podConfig.value.resourceBo = data.handle;
  podConfig.value.resourceDesc = data.description;
  saveRouteCache('workPanelResource', { resource: data.resrce, resourceBo: data.handle, resourceDesc: data.description });
  selectedReport.value = undefined;
  loadPanelData();
};

/** 从 ItemBO:SITE,ITEM,REV 解析品号，与后端 MesUtils.getRemoveBoAndVersion 一致 */
const resolvePlannedItem = (plannedItem?: string, plannedItemBo?: string, fallbackItem?: string) => {
  if (plannedItem) return plannedItem;
  if (fallbackItem) return fallbackItem;
  if (!plannedItemBo) return '';
  const first = plannedItemBo.indexOf(',');
  if (first < 0) return plannedItemBo;
  const second = plannedItemBo.indexOf(',', first + 1);
  if (second < 0) return plannedItemBo;
  return plannedItemBo.substring(first + 1, second);
};

const shopOrderCallBack = async (data: any) => {
  podConfig.value.shopOrder = data.shopOrder;
  podConfig.value.shopOrderDesc = data.itemDesc;
  podConfig.value.plannedItemBo = data.plannedItemBo;
  podConfig.value.plannedItem = resolvePlannedItem(data.plannedItem, data.plannedItemBo, data.item);
  podConfig.value.qtyToBuild = data.qtyToBuild;
  podConfig.value.qtyDone = data.qtyDone;
  podConfig.value.qtyReleased = data.qtyReleased;
  const workOrder = currentWorkOrderSnapshot();
  saveRouteCache('workPanelShopOrder', workOrder);
  addRecentWorkOrder(workOrder);
  selectedReport.value = undefined;
  await Promise.all([loadPanelData(), handleQueryRoute()]);
};

const currentWorkOrderSnapshot = (): WorkOrderFavorite => ({
  shopOrder: podConfig.value.shopOrder || '',
  shopOrderDesc: podConfig.value.shopOrderDesc,
  plannedItem: podConfig.value.plannedItem,
  plannedItemBo: podConfig.value.plannedItemBo,
  qtyToBuild: podConfig.value.qtyToBuild,
  qtyDone: podConfig.value.qtyDone,
  qtyReleased: podConfig.value.qtyReleased,
  operation: podConfig.value.operation,
  operationDesc: podConfig.value.operationDesc
});

const applyWorkOrder = (data: WorkOrderFavorite) => {
  const plannedItemBo = data.plannedItemBo ?? data.itemBo;
  Object.assign(podConfig.value, {
    shopOrder: data.shopOrder,
    shopOrderDesc: data.shopOrderDesc,
    plannedItem: resolvePlannedItem(data.plannedItem, plannedItemBo, data.item),
    plannedItemBo,
    qtyToBuild: data.qtyToBuild,
    qtyDone: data.qtyDone,
    qtyReleased: data.qtyReleased,
    operation: data.operation || podConfig.value.operation,
    operationDesc: data.operationDesc || podConfig.value.operationDesc
  });
  saveRouteCache('workPanelShopOrder', currentWorkOrderSnapshot());
};

const switchWorkOrder = async (data: WorkOrderFavorite) => {
  applyWorkOrder(data);
  selectedReport.value = undefined;
  addRecentWorkOrder(currentWorkOrderSnapshot());
  await Promise.all([loadPanelData(), handleQueryRoute()]);
};

const handleQueryRoute = async () => {
  if (!podConfig.value.shopOrder) {
    ElMessage.warning('请先选择工单号');
    return;
  }
  routeLoading.value = true;
  try {
    const res = await getShopOrderRouterStep(podConfig.value.shopOrder);
    routeStepList.value = res.data || [];
    const reportingStep = routeStepList.value.find((item) => item.isReportingStep === 'true') || routeStepList.value[0];
    if (reportingStep) {
      applyRouteStep(reportingStep);
    }
  } finally {
    routeLoading.value = false;
  }
};

const applyRouteStep = (row: WorkPanelRouterStepVO) => {
  podConfig.value.operation = row.operation;
  podConfig.value.operationDesc = row.operationDesc;
  saveRouteCache('workPanelOperation', { operation: row.operation, operationDesc: row.operationDesc });
};

const handleReleaseShopOrder = () => {
  releaseShopOrderDialogRef.value?.openDialog();
};

const handleReleaseClosed = async () => {
  await loadPanelData();
};

const activeEmployeeReport = computed(() => {
  if (selectedReport.value?.status === 0) {
    return selectedReport.value;
  }
  return reportList.value.find((item) => item.status === 0);
});

const shopOrderOnlineEmployeeList = computed(() => {
  const shopOrder = podConfig.value.shopOrder;
  if (!shopOrder) return onlineEmployeeList.value;
  return onlineEmployeeList.value.filter((item) => item.shopOrder === shopOrder);
});

const employeeDialogShopOrder = computed(() => employeeForm.shopOrder || podConfig.value.shopOrder);

const employeeDialogShift = computed(() => activeEmployeeReport.value?.productionShift || quickForm.productionShift || '');

const employeeDialogStartTime = computed(() => activeEmployeeReport.value?.startDateTime || quickForm.startDateTime || now());

const employeeDialogStandardPerson = computed(() => (activeEmployeeReport.value as ShopOrderReportVO & { standardPersonNumber?: number })?.standardPersonNumber ?? podConfig.value.standardPersonNumber);

const loadWorkCenterOnlineEmployees = async () => {
  if (!podConfig.value.workCenter && !podConfig.value.resource) {
    workCenterOnlineEmployeeList.value = [];
    return;
  }
  const res = await getWorkPanelData({
    workCenter: podConfig.value.workCenter,
    resrce: podConfig.value.resource
  });
  workCenterOnlineEmployeeList.value = res.data?.onlineEmployeeList || [];
};

const applyDefaultProductionShift = (referenceDateTime?: string) => {
  if (quickForm.productionShift) {
    return;
  }
  const cachedShift = localStorage.getItem(productionShiftCacheKey.value);
  if (cachedShift && productionShiftList.value.some((item) => item.shiftId === cachedShift)) {
    quickForm.productionShift = cachedShift;
    return;
  }
  const referenceTime = referenceDateTime || quickForm.startDateTime || now();
  const matched = findProductionShiftByDateTime(productionShiftList.value, referenceTime);
  if (matched?.shiftId) {
    quickForm.productionShift = matched.shiftId;
  }
};

const loadProductionShiftList = async (referenceDateTime?: string) => {
  productionShiftLoading.value = true;
  try {
    const res = await getProductionShiftList();
    productionShiftList.value = res.data || [];
    applyDefaultProductionShift(referenceDateTime);
  } finally {
    productionShiftLoading.value = false;
  }
};

const openWorkStartPage = () => {
  if (!requirePanelSelection()) return;
  // 进入开工页前刷新缓存，确保产品品号(plannedItem)等字段写入 workPanelShopOrder
  saveRouteCache('workPanelShopOrder', currentWorkOrderSnapshot());
  router.push({
    path: '/mes/workpanel/work-start',
    query: { from: currentRoute.value.fullPath }
  });
};

const canCompleteOrRetryReport = (status?: number) => status === 0 || status === 4 || status === 7;

const openWorkCompletePage = (targetReport?: ShopOrderReportVO) => {
  const report = targetReport || (canCompleteOrRetryReport(selectedReport.value?.status) ? selectedReport.value : undefined) || reportList.value.find((item) => canCompleteOrRetryReport(item.status));
  if (!report) {
    ElMessage.warning('请选择一条可完工登记/重新报工的记录');
    return;
  }
  if (!canCompleteOrRetryReport(report.status)) {
    ElMessage.warning('当前状态不可完工登记或重新报工');
    return;
  }
  router.push({
    path: '/mes/workpanel/work-complete',
    query: {
      reportId: String(report.id),
      from: currentRoute.value.fullPath
    }
  });
};

const handleStaffOnline = () => openEmployeeDialog('online');
const handleStaffOffline = () => openEmployeeDialog('offline');

const openEmployeeDialog = async (mode: 'online' | 'offline') => {
  if (!podConfig.value.resource && !selectedReport.value) {
    ElMessage.warning('请先选择资源或开工记录');
    return;
  }
  const report = selectedReport.value && selectedReport.value.status === 0 ? selectedReport.value : undefined;
  Object.assign(employeeForm, {
    reportId: report?.id,
    workCenter: report?.workCenter || podConfig.value.workCenter,
    resrce: podConfig.value.resource,
    shopOrder: report?.shopOrder || podConfig.value.shopOrder,
    employeeId: selectedOnlineRows.value[0]?.employeeId || '',
    employeeName: '',
    dateTime: now(),
    bindingIdList: selectedOnlineRows.value.map((item) => item.id)
  });
  employeeDialog.mode = mode;
  employeeDialog.title = mode === 'online' ? '员工上下线（依工单）' : '员工上下线（依工单）';
  employeePanelTab.value = 'shopOrder';
  employeeCardInput.value = employeeForm.employeeId || '';
  await Promise.all([loadProductionShiftList(), loadWorkCenterOnlineEmployees(), loadEmployeeFavorites()]);
  employeeDialogVisible.value = true;
};

const handleSelectOnlineEmployee = (row: WorkCenterEmployeeBindingVO) => {
  employeeForm.employeeId = row.employeeId;
  employeeForm.employeeName = row.employeeName || '';
  employeeCardInput.value = row.employeeId;
  if (employeeDialog.mode === 'offline') {
    employeeForm.bindingIdList = [row.id];
  }
};

const buildEmployeePayload = (): WorkPanelEmployeeForm => ({ ...employeeForm });

const formatOnlineBindingDesc = (binding: WorkCenterEmployeeBindingVO) => {
  const employeeId = binding.employeeId || employeeForm.employeeId;
  if (binding.shopOrder) {
    return `${employeeId} 于 ${binding.onLineTime || '-'} 在工作中心 ${binding.workCenter || '-'} 的工单 ${binding.shopOrder} 上线`;
  }
  return `${employeeId} 于 ${binding.onLineTime || '-'} 在工作中心 ${binding.workCenter || '-'} 上线`;
};

const handleConflictSelectionChange = (rows: WorkCenterEmployeeBindingVO[]) => {
  selectedConflictBindingIds.value = rows.map((item) => item.id);
};

const openEmployeeConflictDialog = (status: WorkPanelEmployeeOnlineStatusVO, payload: WorkPanelEmployeeForm) => {
  employeeConflictDialog.status = status;
  employeeConflictDialog.payload = payload;
  selectedConflictBindingIds.value = [];
  employeeConflictDialog.visible = true;
  nextTick(() => {
    employeeConflictTableRef.value?.clearSelection?.();
  });
};

const performEmployeeOnline = async (payload: WorkPanelEmployeeForm) => {
  await employeeOnline(payload);
  ElMessage.success('员工上线成功');
  employeeDialogVisible.value = false;
  employeeConflictDialog.visible = false;
  await loadPanelData();
};

const submitEmployeeOnline = async () => {
  const payload = buildEmployeePayload();
  const checkRes = await checkEmployeeOnlineStatus(payload);
  const status = checkRes.data;

  if (status.onlineStatus === 1 || status.onlineStatus === 2) {
    ElMessage.warning(status.message || '员工已在线');
    return;
  }

  if (status.onlineStatus === 3 || status.onlineStatus === 4) {
    openEmployeeConflictDialog(status, payload);
    return;
  }

  await performEmployeeOnline(payload);
};

const confirmEmployeeConflictOnline = async () => {
  if (!employeeConflictDialog.payload) return;
  if (!selectedConflictBindingIds.value.length) {
    ElMessage.warning('请选择需要下线的记录');
    return;
  }
  submitLoading.value = true;
  try {
    await performEmployeeOnline({
      ...employeeConflictDialog.payload,
      bindingIdList: [...selectedConflictBindingIds.value]
    });
  } finally {
    submitLoading.value = false;
  }
};

const submitEmployee = () => {
  employeeForm.dateTime = now();
  employeeFormRef.value?.validate(async (valid) => {
    if (!valid) return;
    submitLoading.value = true;
    try {
      if (employeeDialog.mode === 'online') {
        await submitEmployeeOnline();
      } else {
        await employeeOffline({ ...employeeForm });
        ElMessage.success('员工下线成功');
        employeeDialogVisible.value = false;
        await loadPanelData();
      }
    } finally {
      submitLoading.value = false;
    }
  });
};

const handleSwipeCardEmployee = async () => {
  if (!employeeCardInput.value) return;
  employeeForm.employeeId = employeeCardInput.value;
  employeeForm.dateTime = now();
  const favorite = employeeFavoriteList.value.find((item) => item.employeeId === employeeCardInput.value);
  employeeForm.employeeName = favorite?.employeeName || employeeForm.employeeName;
  if (employeeDialog.mode === 'online') {
    try {
      await addFavorite({
        employeeId: employeeForm.employeeId,
        employeeName: employeeForm.employeeName || favorite?.employeeName || ''
      });
    } catch {
      /* 收藏失败不阻断上线 */
    }
  }
  submitEmployee();
};

const openEmployeeFavoriteDialog = async () => {
  favoriteForm.employeeId = '';
  favoriteForm.employeeName = '';
  await loadEmployeeFavorites();
  favoriteDialogVisible.value = true;
};

const productionShiftCacheKey = computed(() => `lineLeaderProductionShift:${currentRoute.value.fullPath}`);
const workOrderFavoriteCacheKey = computed(() => `lineLeaderWorkOrderFavorite:${currentRoute.value.fullPath}`);
const recentWorkOrderCacheKey = computed(() => `lineLeaderRecentWorkOrder:${currentRoute.value.fullPath}`);

const loadEmployeeFavorites = async () => {
  const res = await listEmployeeFavorite(1);
  employeeFavoriteList.value = (res.data || []).map(mapEmployeeFavorite);
};

const addFavorite = async (employee: EmployeeFavorite) => {
  const employeeId = employee.employeeId?.trim();
  if (!employeeId) return;
  await saveEmployeeFavorite({
    type: 1,
    content: employeeId,
    description: employee.employeeName || ''
  });
  await loadEmployeeFavorites();
};

const addFavoriteFromInput = async () => {
  const employeeId = employeeCardInput.value || employeeForm.employeeId;
  if (!employeeId) {
    ElMessage.warning('请先输入员工工号');
    return;
  }
  try {
    await addFavorite({
      employeeId,
      employeeName: employeeForm.employeeName || ''
    });
    ElMessage.success('收藏成功');
  } catch {
    /* request 拦截器已提示 */
  }
};

const addFavoriteFromForm = async () => {
  if (!favoriteForm.employeeId) {
    ElMessage.warning('请先输入员工工号');
    return;
  }
  try {
    await addFavorite({ ...favoriteForm });
    favoriteForm.employeeId = '';
    favoriteForm.employeeName = '';
    ElMessage.success('添加成功');
  } catch {
    /* request 拦截器已提示 */
  }
};

const removeFavorite = async (row: EmployeeFavorite) => {
  if (!row.id) return;
  await deleteEmployeeFavorite(row.id);
  await loadEmployeeFavorites();
  ElMessage.success('已移除收藏');
};

const applyFavoriteToEmployee = (row?: EmployeeFavorite) => {
  if (!row) return;
  employeeForm.employeeId = row.employeeId;
  employeeForm.employeeName = row.employeeName;
  employeeCardInput.value = row.employeeId;
};

const loadWorkOrderCaches = () => {
  const favoriteValue = localStorage.getItem(workOrderFavoriteCacheKey.value);
  const recentValue = localStorage.getItem(recentWorkOrderCacheKey.value);
  workOrderFavoriteList.value = favoriteValue ? JSON.parse(favoriteValue) : [];
  recentWorkOrderList.value = recentValue ? JSON.parse(recentValue) : [];
};

const saveWorkOrderFavorites = () => {
  localStorage.setItem(workOrderFavoriteCacheKey.value, JSON.stringify(workOrderFavoriteList.value));
};

const saveRecentWorkOrders = () => {
  localStorage.setItem(recentWorkOrderCacheKey.value, JSON.stringify(recentWorkOrderList.value));
};

const upsertWorkOrder = (list: WorkOrderFavorite[], workOrder: WorkOrderFavorite, maxSize?: number) => {
  const shopOrder = workOrder.shopOrder?.trim();
  if (!shopOrder) return list;
  const next = [workOrder, ...list.filter((item) => item.shopOrder !== shopOrder)];
  return maxSize ? next.slice(0, maxSize) : next;
};

const addRecentWorkOrder = (workOrder: WorkOrderFavorite) => {
  recentWorkOrderList.value = upsertWorkOrder(recentWorkOrderList.value, workOrder, 8);
  saveRecentWorkOrders();
};

const addCurrentWorkOrderFavorite = () => {
  if (!podConfig.value.shopOrder) {
    ElMessage.warning('请先选择工单号');
    return;
  }
  workOrderFavoriteList.value = upsertWorkOrder(workOrderFavoriteList.value, currentWorkOrderSnapshot());
  saveWorkOrderFavorites();
  ElMessage.success('工单已收藏');
};

const removeWorkOrderFavorite = (shopOrder: string) => {
  workOrderFavoriteList.value = workOrderFavoriteList.value.filter((item) => item.shopOrder !== shopOrder);
  saveWorkOrderFavorites();
};

/** 对齐 Android：已删除/上传锁定/撤销锁定不可选 */
const isReportSelectable = (status?: number) => status !== -1 && status !== 2 && status !== 5 && status !== 6;

const reportTableRef = ref();

const selectReport = (row?: ShopOrderReportVO) => {
  if (row && !isReportSelectable(row.status)) {
    ElMessage.warning('当前状态不可选中');
    return;
  }
  selectedReport.value = row;
  reportTableRef.value?.setCurrentRow?.(row);
};

/** 整行点击选中（单选仅展示状态） */
const handleReportRowClick = (row: ShopOrderReportVO) => {
  if (!isReportSelectable(row.status)) return;
  selectReport(row);
};

const reportRowClassName = ({ row }: { row: ShopOrderReportVO }) => (isReportSelectable(row.status) ? '' : 'is-disabled-row');

/** 按状态回退 */
const handleReplayReport = async (row?: ShopOrderReportVO) => {
  if (!row) {
    ElMessage.warning('请选择一项需要取消的完工记录');
    return;
  }
  const tipMap: Record<number, string> = {
    0: '确定删除开工登记吗？',
    1: '确定取消完工状态，恢复到开工状态吗？',
    3: '确定取消SAP报工吗？',
    4: '确定取消完工状态，恢复到开工状态吗？',
    7: '确定取消完工状态，恢复到开工状态吗？',
    8: '确定恢复报工吗？'
  };
  const tip = tipMap[row.status] || '确定执行该操作吗？';
  await ElMessageBox.confirm(tip, '提示', { type: 'warning' });
  await cancelWorkReport(row.id);
  ElMessage.success('操作成功');
  selectedReport.value = undefined;
  await loadPanelData();
};

/** SAP撤销失败(8)：重新取消 SAP 报工 */
const handleRetryCancelReport = async (row?: ShopOrderReportVO) => {
  if (!row) {
    ElMessage.warning('请至少选择一项待报工项');
    return;
  }
  await ElMessageBox.confirm('确认重新发起取消 SAP 报工吗？', '提示', { type: 'warning' });
  await retryCancelWorkReport(row.id);
  ElMessage.success('已提交重新取消 SAP 报工');
  selectedReport.value = undefined;
  await loadPanelData();
};

/** 主状态文案 */
const statusLabel = (status: number) => {
  const map: Record<number, string> = {
    [-1]: 'MES已删除',
    0: 'MES已开工',
    1: 'MES已报工',
    2: 'MES上传锁定',
    3: 'SAP报工完成',
    4: 'SAP报工失败',
    5: 'MES撤销',
    6: 'MES撤销锁定',
    7: 'SAP已撤销',
    8: 'SAP撤销失败'
  };
  return map[status] || `${status}`;
};

/** 副状态文案 */
const statusSubLabel = (status: number) => {
  const map: Record<number, string> = {
    [-1]: '不可操作',
    0: '待MES报工',
    1: '待上传SAP',
    2: '待SAP回馈',
    3: '任务结案',
    4: '待MES处理',
    5: '待SAP处理',
    6: '待SAP回馈',
    7: '待MES处理',
    8: '待MES处理'
  };
  return map[status] || '';
};

/** S 绿 / F 红 / 其它灰 */
const reportMessageClass = (reportResult?: string) => {
  if (reportResult === 'S') return 'report-msg report-msg--success';
  if (reportResult === 'F') return 'report-msg report-msg--fail';
  return 'report-msg report-msg--muted';
};

const clearSelection = (type: string) => {
  podConfig.value[type] = '';
  const storageKeyMap: Record<string, string> = {
    resource: 'workPanelResource',
    operation: 'workPanelOperation',
    shopOrder: 'workPanelShopOrder'
  };
  saveRouteCache(storageKeyMap[type], null);
  if (type === 'resource') {
    podConfig.value.resourceBo = '';
    podConfig.value.resourceDesc = '';
  }
  if (type === 'resource' || type === 'shopOrder') {
    selectedReport.value = undefined;
    routeStepList.value = [];
    loadPanelData();
  }
};

const saveRouteCache = (key: string, value: unknown) => {
  if (!key) return;
  const localValue = localStorage.getItem(key);
  const cache = JSON.parse(localValue || '{}');
  cache[currentRoute.value.fullPath] = value;
  localStorage.setItem(key, JSON.stringify(cache));
};

const getRouteCache = <T,>(key: string): T | null => {
  const localValue = localStorage.getItem(key);
  return localValue ? JSON.parse(localValue)[currentRoute.value.fullPath] : null;
};

const findPodConfig = () => {
  Object.assign(podConfig.value, getRouteCache('workPanelResource'));
  Object.assign(podConfig.value, getRouteCache('workPanelOperation'));
  Object.assign(podConfig.value, getRouteCache('workPanelShopOrder'));
};

onMounted(async () => {
  findPodConfig();
  await loadEmployeeFavorites();
  loadWorkOrderCaches();
  await loadProductionShiftList();
  if (podConfig.value.shopOrder) {
    addRecentWorkOrder(currentWorkOrderSnapshot());
  }
  loadPanelData();
  if (podConfig.value.shopOrder) {
    handleQueryRoute();
  }
});

onActivated(() => {
  loadPanelData();
});
</script>

<style scoped>
.line-leader-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px);
  min-height: 640px;
  background: #f3f4f6;
}

:deep(.workpanel-action-dialog .el-dialog__body) {
  padding-top: 8px;
  overflow: visible;
}

:deep(.workpanel-action-dialog .el-dialog__header) {
  margin-right: 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.workpanel-action-dialog .el-dialog__footer) {
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.workbench-shell {
  display: grid;
  flex: 1;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 12px;
  align-items: stretch;
  min-height: 0;
}

.workbench-side {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  height: 100%;
}

.side-section,
.employee-strip {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  padding: 12px;
}

.side-section--grow {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.side-panel-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 140px;
  overflow: auto;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  background: #fafafa;
  padding: 8px;
}

.side-panel-body.is-empty {
  align-items: center;
  justify-content: center;
}

.side-panel-body :deep(.el-empty) {
  padding: 12px 8px;
}

.side-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #111827;
  font-size: 15px;
  font-weight: 600;
}

.resource-card,
.order-list-item {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  text-align: left;
  cursor: pointer;
}

.resource-card {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px;
}

.resource-card .el-icon {
  margin-top: 2px;
  color: #2563eb;
  font-size: 22px;
}

.resource-card span,
.order-list-item span {
  min-width: 0;
}

.resource-card strong,
.resource-card small,
.order-list-item strong,
.order-list-item small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-card strong,
.order-list-item strong {
  color: #111827;
  font-size: 14px;
}

.resource-card small,
.order-list-item small {
  margin-top: 4px;
  color: #6b7280;
  font-size: 12px;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.order-list-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px;
  align-items: center;
  padding: 10px;
}

.order-list-item.is-active {
  border-color: #409eff;
  background: #ecf5ff;
}

.workbench-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
}

.main-panel-card {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.main-panel-card :deep(.el-card__body) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.work-order-head {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.work-order-title {
  min-width: 0;
}

.work-order-title span {
  display: block;
  color: #6b7280;
  font-size: 12px;
}

.work-order-title strong {
  display: block;
  color: #111827;
  font-size: 24px;
  line-height: 32px;
}

.head-actions,
.primary-actions,
.quick-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.metric-item {
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}

.metric-item span {
  display: block;
  color: #6b7280;
  font-size: 12px;
}

.metric-item strong,
.metric-item button {
  display: block;
  width: 100%;
  margin-top: 5px;
  border: 0;
  background: transparent;
  color: #111827;
  font-size: 15px;
  font-weight: 600;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metric-item button {
  color: #2563eb;
  cursor: pointer;
}

.quick-form {
  margin-top: 14px;
}

.quick-form :deep(.el-input),
.quick-form :deep(.el-input-number),
.quick-form :deep(.el-select) {
  width: 180px;
}

.shift-hint {
  margin-top: 6px;
  font-size: 12px;
  color: #64748b;
}

.primary-actions {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #e5e7eb;
}

.employee-strip {
  margin-top: 10px;
}

.employee-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.employee-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid #dcfce7;
  border-radius: 999px;
  background: #f0fdf4;
  color: #15803d;
  cursor: pointer;
}

.employee-chip small {
  color: #6b7280;
}

.records-section {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #e5e7eb;
}

.records-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 220px;
  margin-top: 10px;
  overflow: hidden;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  background: #fafafa;
}

.records-body.is-empty {
  align-items: center;
  justify-content: center;
}

.records-table {
  flex: 1;
  min-height: 0;
  width: 100%;
}

.status-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.3;
}

.status-cell small {
  color: #6b7280;
  font-size: 12px;
}

.report-msg--success {
  color: #16a34a;
}

.report-msg--fail {
  color: #dc2626;
}

.report-msg--muted,
.text-gray {
  color: #9ca3af;
}

.records-body:not(.is-empty) {
  background: #fff;
  border-style: solid;
  border-color: #e5e7eb;
}

.side-panel-body:not(.is-empty) {
  background: #fff;
  border-style: solid;
  border-color: #e5e7eb;
}

.selector-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 24px;
  align-items: center;
}

.selector-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.required {
  color: #ef4444;
}

.selector-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 58px;
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
}

.action-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
  padding: 14px 10px;
  background: #f9fafb;
  border-radius: 8px;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.records-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.records-table :deep(.el-radio),
.report-row-radio {
  height: auto;
  margin-right: 0;
  pointer-events: none;
}

.records-table :deep(.el-table__row) {
  cursor: pointer;
}

.records-table :deep(.is-disabled-row) {
  color: #9ca3af;
  cursor: not-allowed;
}

.hidden-employee-form {
  display: none;
}

.android-workpanel-dialog :deep(.el-dialog__body) {
  padding-top: 8px;
}

.favorite-toolbar {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 10px;
  margin-bottom: 12px;
}

@media (max-width: 900px) {
  .line-leader-page {
    height: auto;
    min-height: calc(100vh - 84px);
  }

  .workbench-shell {
    grid-template-columns: 1fr;
  }

  .workbench-side {
    height: auto;
  }

  .side-section--grow {
    flex: none;
  }

  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .favorite-toolbar {
    grid-template-columns: 1fr;
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

.text-white {
  color: white !important;
}
</style>
