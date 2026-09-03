<template>
  <div class="p-2 line-leader-page">
    <div class="workbench-shell">
      <aside class="workbench-side">
        <section class="side-section">
          <div class="side-title">
            <span>当前资源</span>
            <el-button link type="primary" @click="openResourceDialog">选择</el-button>
          </div>
          <button type="button" class="resource-card" @click="openResourceDialog">
            <el-icon><Cpu /></el-icon>
            <span>
              <strong>{{ podConfig.resource || '未选择资源' }}</strong>
              <small>{{ podConfig.resourceDesc || '选择资源后可加载在线员工和工单记录' }}</small>
            </span>
          </button>
        </section>

        <section class="side-section">
          <div class="side-title">
            <span>工单收藏</span>
            <el-button link type="primary" icon="Plus" @click="openShopOrderDialog">添加</el-button>
          </div>
          <el-empty v-if="!workOrderFavoriteList.length" description="暂无收藏" :image-size="64" />
          <div v-else class="order-list">
            <button
              v-for="item in workOrderFavoriteList"
              :key="item.shopOrder"
              type="button"
              class="order-list-item"
              :class="{ 'is-active': item.shopOrder === podConfig.shopOrder }"
              @click="switchWorkOrder(item)"
            >
              <span>
                <strong>{{ item.shopOrder }}</strong>
                <small>{{ item.shopOrderDesc || '-' }}</small>
              </span>
              <el-button link type="danger" icon="Close" @click.stop="removeWorkOrderFavorite(item.shopOrder)" />
            </button>
          </div>
        </section>

        <section class="side-section">
          <div class="side-title">
            <span>最近工单</span>
            <el-button link type="primary" icon="Search" @click="openShopOrderDialog">查找</el-button>
          </div>
          <div class="order-list compact">
            <button
              v-for="item in recentWorkOrderList"
              :key="item.shopOrder"
              type="button"
              class="order-list-item"
              :class="{ 'is-active': item.shopOrder === podConfig.shopOrder }"
              @click="switchWorkOrder(item)"
            >
              <span>
                <strong>{{ item.shopOrder }}</strong>
                <small>{{ item.shopOrderDesc || '-' }}</small>
              </span>
            </button>
          </div>
        </section>
      </aside>

      <main class="workbench-main">
        <el-card shadow="hover">
          <div class="work-order-head">
            <div class="work-order-title">
              <span>当前工单</span>
              <strong>{{ podConfig.shopOrder || '未选择工单' }}</strong>
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
              <span>当前工序</span>
              <button type="button" @click="openOperationDialog">{{ podConfig.operationDesc || podConfig.operation || '选择工序' }}</button>
            </div>
            <div class="metric-item">
              <span>计划数量</span>
              <strong>{{ podConfig.qtyToBuild ?? '-' }}</strong>
            </div>
            <div class="metric-item">
              <span>已完成数量</span>
              <strong>{{ podConfig.qtyDone ?? '-' }}</strong>
            </div>
            <div class="metric-item">
              <span>在线员工</span>
              <strong>{{ onlineEmployeeList.length }}</strong>
            </div>
          </div>

          <div class="primary-actions">
            <el-button type="primary" @click="handleReleaseShopOrder">
              <el-icon><DocumentAdd /></el-icon>
              工单下达
            </el-button>
            <el-button color="#3b82f6" class="text-white" :loading="submitLoading" @click="openWorkStartDialog">
              <el-icon><VideoPlay /></el-icon>
              开工登记
            </el-button>
            <el-button color="#22c55e" class="text-white" :loading="submitLoading" @click="openWorkCompleteDialog">
              <el-icon><CircleCheck /></el-icon>
              完工汇报
            </el-button>
            <el-button color="#10b981" class="text-white" @click="handleStaffOnline">
              <el-icon><User /></el-icon>
              员工刷卡上线
            </el-button>
            <el-button color="#ef4444" class="text-white" @click="handleStaffOffline">
              <el-icon><UserFilled /></el-icon>
              员工下线
            </el-button>
            <el-button plain type="primary" @click="openEmployeeFavoriteDialog">
              <el-icon><Star /></el-icon>
              员工收藏
            </el-button>
          </div>
        </el-card>

        <el-card shadow="never" class="mt-[10px]">
          <template #header>
            <div class="detail-header">
              <span>工艺路线</span>
              <el-button link type="primary" icon="Refresh" :loading="routeLoading" @click="handleQueryRoute">刷新</el-button>
            </div>
          </template>
          <div v-loading="routeLoading">
            <el-empty v-if="!routeTimelineSteps.length" description="暂无工艺路线" />
            <div v-else class="route-timeline">
              <button
                v-for="(step, index) in routeTimelineSteps"
                :key="`${step.operation}-${index}`"
                type="button"
                class="route-step"
                :class="{ 'is-active': isActiveRouteStep(step) }"
                @click="handleRouteStepClick(step)"
              >
                <span class="route-step-node">{{ index + 1 }}</span>
                <span class="route-step-line" />
                <span class="route-step-content">
                  <span class="route-step-title">{{ getRouteStepTitle(step) }}</span>
                  <span class="route-step-desc">{{ getRouteStepDesc(step) }}</span>
                  <span v-if="step.isReportingStep === 'true'" class="route-step-tag">报工</span>
                </span>
              </button>
            </div>
          </div>
        </el-card>

    <el-card shadow="never" class="mt-[10px] records-card">
      <template #header>
        <div class="detail-header">
          <span>查看详情</span>
          <el-button link type="primary" icon="Refresh" @click="loadPanelData">刷新</el-button>
        </div>
      </template>

      <el-tabs v-model="activeName">
        <el-tab-pane label="开工/完工记录" name="startRecord">
          <el-table v-loading="loading" :data="reportList" highlight-current-row @current-change="handleReportCurrentChange">
            <el-table-column label="工单号" prop="shopOrder" min-width="150" />
            <el-table-column label="工作中心" prop="workCenter" min-width="130" />
            <el-table-column label="班次" prop="productionShift" width="100" />
            <el-table-column label="人数" prop="personNumber" width="90" />
            <el-table-column label="开工时间" prop="startDateTime" min-width="170" />
            <el-table-column label="完工时间" prop="endDateTime" min-width="170" />
            <el-table-column label="良品数" prop="qtyReport" width="100" />
            <el-table-column label="报废数" prop="qtyScrapped" width="100" />
            <el-table-column label="状态" width="110">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" :disabled="row.status !== 0" @click="completeReport(row)">完工</el-button>
                <el-button link type="danger" @click="handleCancelReport(row)">撤销</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="员工上线情况" name="onlineEmployee">
          <el-table v-loading="loading" :data="onlineEmployeeList" @selection-change="handleOnlineSelectionChange">
            <el-table-column type="selection" width="55" />
            <el-table-column label="上线ID" prop="id" width="110" />
            <el-table-column label="工号" prop="employeeId" width="120" />
            <el-table-column label="姓名" prop="employeeName" width="140" />
            <el-table-column label="资源" prop="resrce" min-width="130" />
            <el-table-column label="工作中心" prop="workCenter" min-width="130" />
            <el-table-column label="工单号" prop="shopOrder" min-width="150" />
            <el-table-column label="上线时间" prop="onLineTime" min-width="170" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="报工员工明细" name="reportEmployee">
          <el-table v-loading="loading" :data="reportEmployeeList">
            <el-table-column label="工号" prop="employeeId" width="120" />
            <el-table-column label="姓名" prop="employeeName" width="140" />
            <el-table-column label="工单号" prop="shopOrder" min-width="150" />
            <el-table-column label="上线时间" prop="onLineTime" min-width="170" />
            <el-table-column label="下线时间" prop="offLineTime" min-width="170" />
            <el-table-column label="出勤时长(分钟)" prop="duration" width="140" />
            <el-table-column label="有效时长(分钟)" prop="effectiveDuration" width="140" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
      </main>
    </div>

    <el-dialog
      v-model="employeeDialog.visible"
      :title="employeeDialog.title"
      width="1120px"
      append-to-body
      class="android-workpanel-dialog"
      :close-on-click-modal="false"
    >
      <WorkPanelOperationPanel
        v-model:active-tab="employeePanelTab"
        v-model:employee-card-input="employeeCardInput"
        v-model:employee-mode="employeeDialog.mode"
        :shop-order="employeeDialogShopOrder"
        :operation-desc="podConfig.operationDesc || podConfig.operation"
        :item="podConfig.item || podConfig.itemBo"
        :product-desc="podConfig.shopOrderDesc"
        :qty-to-build="podConfig.qtyToBuild"
        :qty-done="podConfig.qtyDone"
        :standard-person-number="employeeDialogStandardPerson"
        :actual-person-number="workCenterOnlineEmployeeList.length"
        :production-shift="employeeDialogShift"
        :production-shift-list="productionShiftList"
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
        <el-button @click="employeeDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitEmployee">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="workStartDialogVisible"
      title="开工登记"
      width="1120px"
      append-to-body
      class="android-workpanel-dialog"
      :close-on-click-modal="false"
    >
      <WorkPanelOperationPanel
        v-model:active-tab="workStartPanelTab"
        v-model:employee-card-input="workStartCardInput"
        v-model:production-shift="quickForm.productionShift"
        v-model:start-date-time="quickForm.startDateTime"
        :shop-order="podConfig.shopOrder"
        :operation-desc="podConfig.operationDesc || podConfig.operation"
        :item="podConfig.item || podConfig.itemBo"
        :product-desc="podConfig.shopOrderDesc"
        :qty-to-build="podConfig.qtyToBuild"
        :qty-done="podConfig.qtyDone"
        :standard-person-number="workStartStandardPerson"
        :actual-person-number="workCenterOnlineEmployeeList.length"
        :production-shift-list="productionShiftList"
        :shop-order-online-employees="shopOrderOnlineEmployeeList"
        :work-center-online-employees="workCenterOnlineEmployeeList"
        :employee-favorite-list="employeeFavoriteList"
        :selected-employee-id="workStartCardInput"
        editable-shift
        editable-start-time
        :show-mode-toggle="false"
        :show-history-tab="false"
        @update:production-shift="handleProductionShiftChange"
        @favorite-select="applyWorkStartFavorite"
        @add-favorite="addFavoriteFromWorkStartInput"
      />
      <template #footer>
        <el-button @click="workStartDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleWorkStart">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="workCompleteDialogVisible"
      title="完工登记"
      width="1120px"
      append-to-body
      class="android-workpanel-dialog"
      :close-on-click-modal="false"
    >
      <WorkPanelCompletePanel
        v-model:active-tab="completePanelTab"
        :data="completePrepare"
        :loading="completePrepareLoading"
        @update:qty-report="handleCompleteFieldChange('qtyReport', $event)"
        @update:qty-scrapped="handleCompleteFieldChange('qtyScrapped', $event)"
        @update:end-date-time="handleCompleteFieldChange('endDateTime', $event)"
        @update:rest-duration="handleCompleteFieldChange('restDuration', $event)"
        @toggle-barcode="handleBarcodeToggle"
      />
      <template #footer>
        <el-button @click="workCompleteDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleWorkComplete">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="employeeConflictDialog.visible"
      title="员工已在线，请选择需要下线的条目"
      width="760px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        class="mb-[12px]"
        :title="employeeConflictDialog.status?.message || '员工已在其他位置上线，下线所选记录后可在当前工单重新上线'"
      />
      <el-table
        ref="employeeConflictTableRef"
        :data="employeeConflictDialog.status?.onlineBindingList || []"
        max-height="320"
        @selection-change="handleConflictSelectionChange"
      >
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

    <el-dialog v-model="favoriteDialogVisible" title="员工收藏" width="620px" append-to-body>
      <div class="favorite-toolbar">
        <el-input v-model.trim="favoriteForm.employeeId" placeholder="员工工号" clearable />
        <el-input v-model.trim="favoriteForm.employeeName" placeholder="姓名" clearable />
        <el-button type="primary" @click="addFavoriteFromForm">添加</el-button>
      </div>
      <el-table :data="employeeFavoriteList" height="360">
        <el-table-column label="员工工号" prop="employeeId" />
        <el-table-column label="姓名" prop="employeeName" />
        <el-table-column label="操作" width="90">
          <template #default="{ row }">
            <el-button link type="danger" @click="removeFavorite(row)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <OperationDialog ref="operationDialogRef" @operation-call-back="operationCallBack" />
    <ResourceDialog ref="resourceDialogRef" @resource-call-back="resourceCallBack" />
    <ShopOrderDialog ref="shopOrderDialogRef" :podConfig="podConfig" @shop-order-call-back="shopOrderCallBack" />
    <ReleaseShopOrderDialog ref="releaseShopOrderDialogRef" :podConfig="podConfig" @release-shop-order-call-back="releaseShopOrderCallBack" />
  </div>
</template>

<script setup lang="ts">
import {
  CircleCheck,
  Close,
  Cpu,
  Document,
  DocumentAdd,
  Operation,
  Search,
  Star,
  User,
  UserFilled,
  VideoPlay
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { useRouter } from 'vue-router';
import type { ShopOrderReportVO } from '@/api/mes/shopOrderReport/types';
import type { ShopOrderReportEmployeeVO } from '@/api/mes/shopOrderReportEmployee/types';
import {
  cancelWorkReport,
  checkEmployeeOnlineStatus,
  completeWork,
  employeeOffline,
  employeeOnline,
  getProductionShiftList,
  getShopOrderRouterStep,
  getWorkPanelData,
  listEmployeeFavorite,
  prepareCompleteWork,
  saveEmployeeFavorite,
  deleteEmployeeFavorite,
  startWork
} from '@/api/mes/workpanel';
import type {
  WorkCenterEmployeeBindingVO,
  WorkPanelCompletePrepareVO,
  WorkPanelEmployeeFavoriteVO,
  WorkPanelEmployeeForm,
  WorkPanelEmployeeOnlineStatusVO,
  WorkPanelProductionShiftVO,
  WorkPanelRouterStepVO,
  WorkPanelSfcSelectionForm
} from '@/api/mes/workpanel/types';

import OperationDialog from '@/views/mes/workpanel/components/operationDialog.vue';
import ResourceDialog from '@/views/mes/workpanel/components/resourceDialog.vue';
import ShopOrderDialog from '@/views/mes/workpanel/components/shopOrderDialog.vue';
import ReleaseShopOrderDialog from '@/views/mes/workpanel/components/releaseShopOrderDialog.vue';
import WorkPanelOperationPanel from '@/views/mes/workpanel/components/WorkPanelOperationPanel.vue';
import WorkPanelCompletePanel from '@/views/mes/workpanel/components/WorkPanelCompletePanel.vue';
import { formatShiftDetail } from '@/views/mes/workpanel/utils/workPanelShift';
import { debounce } from '@/utils/index';

defineProps({
  id: {
    required: true,
    type: String
  }
});

const { currentRoute } = useRouter();
const operationDialogRef = ref<InstanceType<typeof OperationDialog>>();
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
  item?: string;
  itemBo?: string;
  qtyToBuild?: number | string;
  qtyDone?: number | string;
  qtyReleased?: number | string;
  operation?: string;
  operationDesc?: string;
};

const podConfig = ref<Record<string, any>>({});
const activeName = ref('startRecord');
const loading = ref(false);
const routeLoading = ref(false);
const submitLoading = ref(false);
const reportList = ref<ShopOrderReportVO[]>([]);
const productionShiftList = ref<WorkPanelProductionShiftVO[]>([]);
const onlineEmployeeList = ref<WorkCenterEmployeeBindingVO[]>([]);
const workCenterOnlineEmployeeList = ref<WorkCenterEmployeeBindingVO[]>([]);
const reportEmployeeList = ref<ShopOrderReportEmployeeVO[]>([]);
const routeStepList = ref<WorkPanelRouterStepVO[]>([]);
const selectedReport = ref<ShopOrderReportVO>();
const selectedOnlineRows = ref<WorkCenterEmployeeBindingVO[]>([]);
const employeeCardInput = ref('');
const workStartCardInput = ref('');
const employeePanelTab = ref<'shopOrder' | 'workCenter' | 'history'>('shopOrder');
const workStartPanelTab = ref<'shopOrder' | 'workCenter' | 'history'>('shopOrder');
const completePanelTab = ref<'barcode' | 'exception' | 'employee'>('barcode');
const employeeFavoriteList = ref<EmployeeFavorite[]>([]);
const workOrderFavoriteList = ref<WorkOrderFavorite[]>([]);
const recentWorkOrderList = ref<WorkOrderFavorite[]>([]);
const favoriteDialogVisible = ref(false);
const workStartDialogVisible = ref(false);
const workCompleteDialogVisible = ref(false);
const completePrepareLoading = ref(false);
const completePrepare = ref<WorkPanelCompletePrepareVO>({});

const quickForm = reactive({
  productionShift: '',
  qtyReport: 0,
  qtyScrapped: 0,
  startDateTime: '',
  endDateTime: '',
  restDuration: 0
});

const employeeDialog = reactive<{ visible: boolean; title: string; mode: 'online' | 'offline' }>({
  visible: false,
  title: '员工上线',
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

const normalizeOperation = (operation?: string) =>
  String(operation || '')
    .trim()
    .toUpperCase();

const routeTimelineSteps = computed(() => routeStepList.value);

const getRouteStepTitle = (step: WorkPanelRouterStepVO) => step.operation || '-';

const getRouteStepDesc = (step: WorkPanelRouterStepVO) =>
  step.operationDesc || step.defaultResource || '-';

const isActiveRouteStep = (step: WorkPanelRouterStepVO) => {
  return normalizeOperation(step.operation) === normalizeOperation(podConfig.value.operation);
};

const loadPanelData = async () => {
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
  } finally {
    loading.value = false;
  }
};

const openOperationDialog = () => operationDialogRef.value?.openDialog();
const openResourceDialog = () => resourceDialogRef.value?.openDialog();
const openShopOrderDialog = () => {
  if (!podConfig.value.resource) {
    ElMessage.warning('请先选择资源');
    return;
  }
  shopOrderDialogRef.value?.openDialog();
};

const operationCallBack = (data: any) => {
  podConfig.value.operation = data.operation;
  podConfig.value.operationDesc = data.description;
  saveRouteCache('workPanelOperation', { operation: data.operation, operationDesc: data.description });
};

const resourceCallBack = (data: any) => {
  podConfig.value.resource = data.resrce;
  podConfig.value.resourceBo = data.handle;
  podConfig.value.resourceDesc = data.description;
  saveRouteCache('workPanelResource', { resource: data.resrce, resourceBo: data.handle, resourceDesc: data.description });
  selectedReport.value = undefined;
  loadPanelData();
};

const shopOrderCallBack = async (data: any) => {
  podConfig.value.shopOrder = data.shopOrder;
  podConfig.value.shopOrderDesc = data.itemDesc;
  podConfig.value.item = data.item;
  podConfig.value.itemBo = data.itemBo;
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
  item: podConfig.value.item,
  itemBo: podConfig.value.itemBo,
  qtyToBuild: podConfig.value.qtyToBuild,
  qtyDone: podConfig.value.qtyDone,
  qtyReleased: podConfig.value.qtyReleased,
  operation: podConfig.value.operation,
  operationDesc: podConfig.value.operationDesc
});

const applyWorkOrder = (data: WorkOrderFavorite) => {
  Object.assign(podConfig.value, {
    shopOrder: data.shopOrder,
    shopOrderDesc: data.shopOrderDesc,
    item: data.item,
    itemBo: data.itemBo,
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

const handleRouteStepClick = (row: WorkPanelRouterStepVO) => {
  applyRouteStep(row);
};

const handleReleaseShopOrder = () => releaseShopOrderDialogRef.value?.openDialog();
const releaseShopOrderCallBack = () => loadPanelData();

const selectedProductionShift = computed(() =>
  productionShiftList.value.find((item) => item.shiftId === quickForm.productionShift)
);

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

const employeeDialogShift = computed(
  () => activeEmployeeReport.value?.productionShift || quickForm.productionShift || ''
);

const employeeDialogStartTime = computed(
  () => activeEmployeeReport.value?.startDateTime || quickForm.startDateTime || now()
);

const employeeDialogStandardPerson = computed(
  () => (activeEmployeeReport.value as ShopOrderReportVO & { standardPersonNumber?: number })?.standardPersonNumber ?? podConfig.value.standardPersonNumber
);

const workStartStandardPerson = computed(
  () => (activeEmployeeReport.value as ShopOrderReportVO & { standardPersonNumber?: number })?.standardPersonNumber ?? podConfig.value.standardPersonNumber
);

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

const parseShiftTime = (value?: string) => {
  if (!value) return null;
  const parts = value.trim().split(':').map((part) => Number(part));
  if (parts.length < 2 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }
  return { hour: parts[0], minute: parts[1], second: parts[2] || 0 };
};

const isWithinShiftTime = (dateTime: string, startTime?: string, endTime?: string) => {
  const start = parseShiftTime(startTime);
  const end = parseShiftTime(endTime);
  if (!start || !end) return true;
  const current = new Date(dateTime.replace(/-/g, '/'));
  if (Number.isNaN(current.getTime())) return true;

  const buildRange = (offsetDay: number) => {
    const rangeStart = new Date(current);
    rangeStart.setDate(rangeStart.getDate() + offsetDay);
    rangeStart.setHours(start.hour, start.minute, start.second, 0);
    const rangeEnd = new Date(current);
    rangeEnd.setDate(rangeEnd.getDate() + offsetDay);
    rangeEnd.setHours(end.hour, end.minute, end.second, 0);
    if (rangeEnd <= rangeStart) {
      rangeEnd.setDate(rangeEnd.getDate() + 1);
    }
    return { rangeStart, rangeEnd };
  };

  return [-1, 0, 1].some((offset) => {
    const { rangeStart, rangeEnd } = buildRange(offset);
    return current >= rangeStart && current <= rangeEnd;
  });
};

const loadProductionShiftList = async () => {
  const res = await getProductionShiftList();
  productionShiftList.value = res.data || [];
  if (!quickForm.productionShift) {
    const cachedShift = localStorage.getItem(productionShiftCacheKey.value);
    if (cachedShift && productionShiftList.value.some((item) => item.shiftId === cachedShift)) {
      quickForm.productionShift = cachedShift;
    }
  }
};

const handleProductionShiftChange = (shiftId: string) => {
  if (shiftId) {
    localStorage.setItem(productionShiftCacheKey.value, shiftId);
  }
};

const validateStartShiftTime = () => {
  const shift = selectedProductionShift.value;
  if (!shift) {
    ElMessage.warning('请先选择班别');
    return false;
  }
  const startDateTime = quickForm.startDateTime || now();
  if (!isWithinShiftTime(startDateTime, shift.startTime, shift.endTime)) {
    ElMessage.warning(`开工时间不在班别时间(${shift.startTime || '-'}~${shift.endTime || '-'})之内`);
    return false;
  }
  return true;
};

const openWorkStartDialog = async () => {
  if (!requirePanelSelection()) return;
  quickForm.startDateTime = now();
  workStartPanelTab.value = 'shopOrder';
  workStartCardInput.value = '';
  await loadWorkCenterOnlineEmployees();
  workStartDialogVisible.value = true;
};

const handleWorkStart = async () => {
  if (!requirePanelSelection()) return;
  if (!quickForm.productionShift) {
    ElMessage.warning('请先选择班别');
    return;
  }
  if (!validateStartShiftTime()) {
    return;
  }
  submitLoading.value = true;
  try {
    await startWork({
      workCenter: podConfig.value.workCenter || '',
      resrce: podConfig.value.resource,
      shopOrder: podConfig.value.shopOrder,
      productionShift: quickForm.productionShift,
      startDateTime: quickForm.startDateTime || now(),
      personNumber: onlineEmployeeList.value.length,
      machineNumber: 1,
      moduleNumber: 1,
      businessType: 1
    });
    ElMessage.success('开工登记成功');
    workStartDialogVisible.value = false;
    await loadPanelData();
  } finally {
    submitLoading.value = false;
  }
};

const buildSfcSelections = (): WorkPanelSfcSelectionForm[] =>
  (completePrepare.value.pendingBarcodeList || [])
    .filter((item) => item.type !== undefined && item.type !== null)
    .map((item) => ({
      type: Number(item.type),
      checked: Boolean(item.checked)
    }));

const loadCompletePrepare = async () => {
  const report = selectedReport.value;
  if (!report?.id) return;
  completePrepareLoading.value = true;
  try {
    const isAssemblyReport = selectedReport.value?.businessType === 1 || completePrepare.value.businessType === 1;
    const payload: Parameters<typeof prepareCompleteWork>[0] = {
      reportId: report.id,
      endDateTime: quickForm.endDateTime || now(),
      qtyScrapped: quickForm.qtyScrapped,
      restDuration: quickForm.restDuration,
      sfcSelections: buildSfcSelections()
    };
    if (!isAssemblyReport) {
      payload.qtyReport = quickForm.qtyReport;
    }
    const res = await prepareCompleteWork(payload);
    completePrepare.value = res.data || {};
    quickForm.endDateTime = completePrepare.value.endDateTime || quickForm.endDateTime;
    quickForm.qtyReport = Number(completePrepare.value.qtyReport ?? 0);
    quickForm.qtyScrapped = Number(completePrepare.value.qtyScrapped ?? quickForm.qtyScrapped);
    quickForm.restDuration = Number(completePrepare.value.restDuration ?? quickForm.restDuration);
  } finally {
    completePrepareLoading.value = false;
  }
};

const handleBarcodeToggle = (type: number | undefined, checked: boolean) => {
  if (type === undefined || type === null) return;
  const pendingBarcodeList = (completePrepare.value.pendingBarcodeList || []).map((item) =>
    item.type === type ? { ...item, checked } : item
  );
  completePrepare.value = {
    ...completePrepare.value,
    pendingBarcodeList
  };
  debouncedLoadCompletePrepare();
};

const debouncedLoadCompletePrepare = debounce(loadCompletePrepare, 300, false);

const handleCompleteFieldChange = (
  field: 'qtyReport' | 'qtyScrapped' | 'endDateTime' | 'restDuration',
  value: string | number
) => {
  if (field === 'endDateTime') {
    quickForm.endDateTime = String(value || '');
    completePrepare.value = { ...completePrepare.value, endDateTime: quickForm.endDateTime };
  } else if (field === 'qtyReport') {
    if (completePrepare.value.qtyReportReadOnly) {
      return;
    }
    quickForm.qtyReport = Number(value || 0);
    completePrepare.value = { ...completePrepare.value, qtyReport: quickForm.qtyReport };
  } else if (field === 'qtyScrapped') {
    quickForm.qtyScrapped = Number(value || 0);
    completePrepare.value = { ...completePrepare.value, qtyScrapped: quickForm.qtyScrapped };
  } else {
    quickForm.restDuration = Number(value || 0);
    completePrepare.value = { ...completePrepare.value, restDuration: quickForm.restDuration };
  }
  debouncedLoadCompletePrepare();
};

const openWorkCompleteDialog = async () => {
  const report = selectedReport.value || reportList.value.find((item) => item.status === 0);
  if (!report) {
    ElMessage.warning('请选择一条开工状态的记录');
    return;
  }
  selectedReport.value = report;
  quickForm.endDateTime = now();
  quickForm.qtyScrapped = 0;
  quickForm.qtyReport = 0;
  completePrepare.value = {};
  completePanelTab.value = 'barcode';
  workCompleteDialogVisible.value = true;
  await loadCompletePrepare();
};

const handleWorkComplete = async () => {
  const report = selectedReport.value || reportList.value.find((item) => item.status === 0);
  if (!report) {
    ElMessage.warning('请选择一条开工状态的记录');
    return;
  }
  await completeReport(report);
};

const completeReport = async (report: ShopOrderReportVO) => {
  if (Number(completePrepare.value.qtyReport || quickForm.qtyReport) <= 0) {
    ElMessage.warning('完工数必须大于0');
    return;
  }
  const endDateTime = completePrepare.value.endDateTime || quickForm.endDateTime;
  if (!endDateTime) {
    ElMessage.warning('请先选择完工时间');
    return;
  }
  submitLoading.value = true;
  try {
    await completeWork({
      reportId: report.id,
      endDateTime,
      qtyReport: Number(completePrepare.value.qtyReport ?? quickForm.qtyReport),
      qtyScrapped: Number(completePrepare.value.qtyScrapped ?? quickForm.qtyScrapped),
      restDuration: Number(completePrepare.value.restDuration ?? quickForm.restDuration),
      stopDuration: 0,
      loadDuration: 0,
      abnormalDuration: 0,
      sfcSelections: buildSfcSelections()
    });
    ElMessage.success('完工汇报成功');
    workCompleteDialogVisible.value = false;
    await loadPanelData();
  } finally {
    submitLoading.value = false;
  }
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
  await Promise.all([loadWorkCenterOnlineEmployees(), loadEmployeeFavorites()]);
  employeeDialog.visible = true;
};

const handleSelectOnlineEmployee = (row: WorkCenterEmployeeBindingVO) => {
  employeeForm.employeeId = row.employeeId;
  employeeForm.employeeName = row.employeeName || '';
  employeeCardInput.value = row.employeeId;
  if (employeeDialog.mode === 'offline') {
    employeeForm.bindingIdList = [row.id];
  }
};

const applyWorkStartFavorite = (row?: EmployeeFavorite) => {
  if (!row) return;
  workStartCardInput.value = row.employeeId;
};

const addFavoriteFromWorkStartInput = async () => {
  const employeeId = workStartCardInput.value.trim();
  if (!employeeId) {
    ElMessage.warning('请先输入员工工号');
    return;
  }
  try {
    await addFavorite({ employeeId, employeeName: '' });
    ElMessage.success('收藏成功');
  } catch {
    /* request 拦截器已提示 */
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
  employeeDialog.visible = false;
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
        employeeDialog.visible = false;
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
  favoriteDialogVisible.value = true;
  await loadEmployeeFavorites();
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

const handleCancelReport = async (row: ShopOrderReportVO) => {
  await ElMessageBox.confirm('撤销后该开工/完工记录不可继续操作，确定撤销吗？', '提示', { type: 'warning' });
  await cancelWorkReport(row.id);
  ElMessage.success('撤销成功');
  await loadPanelData();
};

const handleReportCurrentChange = (row?: ShopOrderReportVO) => {
  selectedReport.value = row;
  loadPanelData();
};

const handleOnlineSelectionChange = (selection: WorkCenterEmployeeBindingVO[]) => {
  selectedOnlineRows.value = selection;
};

const statusLabel = (status: number) => {
  const map: Record<number, string> = {
    [-1]: '已撤销',
    0: '开工',
    1: '完工',
    2: '同步中',
    3: 'SAP成功',
    4: 'SAP失败',
    5: '取消报工',
    6: '取消同步中',
    7: '取消成功',
    8: '取消失败'
  };
  return map[status] || `${status}`;
};

const statusTagType = (status: number) => {
  if (status === 0) return 'warning';
  if (status === 1 || status === 3) return 'success';
  if (status < 0 || status === 4 || status === 8) return 'danger';
  return 'info';
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
  loadProductionShiftList();
  if (podConfig.value.shopOrder) {
    addRecentWorkOrder(currentWorkOrderSnapshot());
  }
  loadPanelData();
  if (podConfig.value.shopOrder) {
    handleQueryRoute();
  }
});
</script>

<style scoped>
.line-leader-page {
  min-height: calc(100vh - 84px);
  background: #f3f4f6;
}

.workbench-shell {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.workbench-side {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: sticky;
  top: 8px;
}

.side-section,
.employee-strip {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  padding: 12px;
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

.order-list.compact {
  max-height: 240px;
  overflow: auto;
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
  min-width: 0;
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

.records-card {
  overflow: hidden;
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
}

.route-timeline {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0;
  padding: 10px 6px 4px;
}

.route-step {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  padding: 0 8px 8px;
  border: 0;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
}

.route-step-node {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  background: #fff;
  color: #6b7280;
  font-size: 13px;
  font-weight: 600;
}

.route-step-line {
  position: absolute;
  top: 14px;
  left: 50%;
  right: -50%;
  height: 2px;
  background: #d1d5db;
}

.route-step:last-child .route-step-line {
  display: none;
}

.route-step-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  margin-top: 8px;
  text-align: center;
}

.route-step-title {
  max-width: 100%;
  color: #111827;
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.route-step-desc {
  max-width: 100%;
  min-height: 18px;
  margin-top: 2px;
  color: #6b7280;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.route-step-tag {
  margin-top: 5px;
  padding: 1px 7px;
  border-radius: 999px;
  background: #ecfdf5;
  color: #059669;
  font-size: 12px;
  line-height: 18px;
}

.route-step.is-active .route-step-node {
  border-color: #409eff;
  background: #409eff;
  color: #fff;
}

.route-step.is-active .route-step-title {
  color: #409eff;
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
  .workbench-shell {
    grid-template-columns: 1fr;
  }

  .workbench-side {
    position: static;
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
