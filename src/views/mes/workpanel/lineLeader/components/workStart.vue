<template>
  <div class="p-2 work-start-page">
    <div class="work-start-header">
      <div class="header-main">
        <el-button class="back-button" circle icon="ArrowLeft" @click="goBack" />
        <div class="header-icon">
          <el-icon><VideoPlay /></el-icon>
        </div>
        <div>
          <h2 class="work-start-title">开工登记</h2>
          <p>确认班别与开工人员，创建本次生产开工记录</p>
        </div>
      </div>
      <div class="shop-order-badge">
        <span>当前工单</span>
        <strong>{{ podConfig.shopOrder || '-' }}</strong>
      </div>
    </div>

    <el-card shadow="never" class="work-start-card">
      <WorkStartPanel
        v-model:active-tab="workStartPanelTab"
        v-model:employee-card-input="workStartCardInput"
        v-model:production-shift="quickForm.productionShift"
        v-model:start-date-time="quickForm.startDateTime"
        layout="page"
        :shop-order="podConfig.shopOrder"
        :operation-desc="podConfig.operationDesc || podConfig.operation"
        :planned-item="podConfig.plannedItem"
        :product-desc="podConfig.shopOrderDesc"
        :qty-to-build="podConfig.qtyToBuild"
        :qty-done="podConfig.qtyDone"
        :standard-person-number="workStartStandardPerson"
        :actual-person-number="workStartActualPersonNumber"
        :production-shift-list="productionShiftList"
        :shift-loading="productionShiftLoading"
        :shop-order-online-employees="shopOrderOnlineEmployeeList"
        :work-center-online-employees="workCenterOnlineEmployeeList"
        :employee-favorite-list="employeeFavoriteList"
        :selected-employee-id="workStartCardInput"
        favorite-multiple
        :favorite-action-loading="employeeAdding"
        show-pending-employee-remove
        editable-shift
        editable-start-time
        :min-start-date-time="startTimeLimit.minStartDateTime"
        :max-start-date-time="startTimeLimit.maxStartDateTime"
        :show-mode-toggle="false"
        :show-history-tab="false"
        @update:production-shift="handleProductionShiftChange"
        @swipe-employee="addWorkStartEmployeeFromInput"
        @favorite-select="applyWorkStartFavorite"
        @favorite-add="addWorkStartEmployeesFromFavorites"
        @add-favorite="addFavoriteFromWorkStartInput"
        @remove-pending-employee="removePendingEmployee"
      />

      <div class="work-start-footer">
        <span class="footer-tip">待上线员工将在确认开工后统一上线</span>
        <el-button class="work-start-action-button" size="large" @click="goBack">取消</el-button>
        <el-button class="work-start-action-button" type="primary" size="large" :loading="submitLoading" @click="handleWorkStart">确认开工</el-button>
      </div>
    </el-card>

    <el-dialog v-model="employeeConflictDialog.visible" title="员工已在线，请选择需要下线的条目" width="760px" append-to-body :close-on-click-modal="false" @closed="showNextEmployeeConflict">
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
        <el-button type="primary" @click="confirmEmployeeConflict">加入待上线列表</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { VideoPlay } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useRoute, useRouter } from 'vue-router';
import {
  checkEmployeeOnlineStatus,
  getProductionShiftList,
  getWorkPanelData,
  getWorkPanelStartTimeLimit,
  listEmployeeFavorite,
  saveEmployeeFavorite,
  startWork
} from '@/api/mes/workpanel';
import type { WorkCenterEmployeeBindingVO, WorkPanelEmployeeFavoriteVO, WorkPanelProductionShiftVO, WorkPanelStartTimeLimitVO } from '@/api/mes/workpanel/types';
import type { WorkPanelEmployeeForm, WorkPanelEmployeeOnlineStatusVO } from '@/api/mes/workpanel/types';
import { listShopOrder } from '@/api/mes/shopOrder';
import WorkStartPanel from './WorkStartPanel.vue';
import { findProductionShiftByDateTime, isDateTimeWithinShift, isStartDateTimeWithinLimit } from '@/views/mes/workpanel/utils/workPanelShift';

defineProps({
  id: {
    required: true,
    type: String
  }
});

const route = useRoute();
const router = useRouter();

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

const cacheContextPath = computed(() => {
  const from = route.query.from;
  return typeof from === 'string' && from ? from : route.fullPath;
});

const podConfig = ref<Record<string, any>>({});
const productionShiftList = ref<WorkPanelProductionShiftVO[]>([]);
const productionShiftLoading = ref(false);
const submitLoading = ref(false);
const onlineEmployeeList = ref<WorkCenterEmployeeBindingVO[]>([]);
const workCenterOnlineEmployeeList = ref<WorkCenterEmployeeBindingVO[]>([]);
const employeeFavoriteList = ref<EmployeeFavorite[]>([]);
const pendingEmployeeList = ref<WorkPanelEmployeeForm[]>([]);
const workStartCardInput = ref('');
const workStartPanelTab = ref<'shopOrder' | 'workCenter' | 'history'>('shopOrder');
const employeeAdding = ref(false);
const employeeConflictTableRef = ref();
const selectedConflictBindingIds = ref<Array<string | number>>([]);

type EmployeeConflictItem = {
  employee: EmployeeFavorite;
  status: WorkPanelEmployeeOnlineStatusVO;
};

const employeeConflictQueue = ref<EmployeeConflictItem[]>([]);
const employeeConflictDialog = reactive<{
  visible: boolean;
  employee?: EmployeeFavorite;
  status?: WorkPanelEmployeeOnlineStatusVO;
}>({
  visible: false
});

const quickForm = reactive({
  productionShift: '',
  startDateTime: ''
});

const startTimeLimit = reactive<WorkPanelStartTimeLimitVO>({
  minStartDateTime: '',
  maxStartDateTime: ''
});

const now = () => {
  const date = new Date();
  const pad = (value: number) => `${value}`.padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const productionShiftCacheKey = computed(() => `lineLeaderProductionShift:${cacheContextPath.value}`);

const getRouteCache = <T,>(key: string): T | null => {
  const localValue = localStorage.getItem(key);
  return localValue ? JSON.parse(localValue)[cacheContextPath.value] : null;
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

const findPodConfig = () => {
  Object.assign(podConfig.value, getRouteCache('workPanelResource'));
  Object.assign(podConfig.value, getRouteCache('workPanelOperation'));
  Object.assign(podConfig.value, getRouteCache('workPanelShopOrder'));
  podConfig.value.plannedItem = resolvePlannedItem(podConfig.value.plannedItem, podConfig.value.plannedItemBo, podConfig.value.item);
};

/** 缓存无品号时按工单号回查 plannedItem */
const ensurePlannedItem = async () => {
  if (podConfig.value.plannedItem || !podConfig.value.shopOrder) return;
  try {
    const res = await listShopOrder({ shopOrder: podConfig.value.shopOrder, pageNum: 1, pageSize: 1 });
    const row = res.rows?.[0];
    if (!row) return;
    podConfig.value.plannedItemBo = row.plannedItemBo || podConfig.value.plannedItemBo;
    podConfig.value.plannedItem = resolvePlannedItem(row.plannedItem, row.plannedItemBo, row.item);
    if (!podConfig.value.shopOrderDesc) {
      podConfig.value.shopOrderDesc = row.itemDesc;
    }
    if (podConfig.value.qtyToBuild === undefined || podConfig.value.qtyToBuild === null || podConfig.value.qtyToBuild === '') {
      podConfig.value.qtyToBuild = row.qtyToBuild;
    }
    if (podConfig.value.qtyDone === undefined || podConfig.value.qtyDone === null || podConfig.value.qtyDone === '') {
      podConfig.value.qtyDone = row.qtyDone;
    }
  } catch (error) {
    console.error('加载工单计划物料失败', error);
  }
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

const shopOrderOnlineEmployeeList = computed(() => {
  const shopOrder = podConfig.value.shopOrder;
  const onlineList = shopOrder ? onlineEmployeeList.value.filter((item) => item.shopOrder === shopOrder) : onlineEmployeeList.value;
  const onlineEmployeeIds = new Set(onlineList.map((item) => item.employeeId));
  const pendingList: WorkCenterEmployeeBindingVO[] = pendingEmployeeList.value
    .filter((item) => !onlineEmployeeIds.has(item.employeeId))
    .map((item) => ({
      id: `pending-${item.employeeId}`,
      workCenter: item.workCenter || podConfig.value.workCenter || '',
      shopOrder: item.shopOrder || podConfig.value.shopOrder,
      resrce: item.resrce || podConfig.value.resource,
      employeeId: item.employeeId,
      employeeName: item.employeeName || '',
      status: 1,
      onLineTime: item.dateTime || quickForm.startDateTime || now(),
      remark: '待开工上线'
    }));
  return [...onlineList, ...pendingList];
});

const workStartActualPersonNumber = computed(() => {
  const employeeIds = new Set(workCenterOnlineEmployeeList.value.map((item) => item.employeeId));
  pendingEmployeeList.value.forEach((item) => employeeIds.add(item.employeeId));
  return employeeIds.size;
});

const workStartStandardPerson = computed(() => podConfig.value.standardPersonNumber);

const selectedProductionShift = computed(() => productionShiftList.value.find((item) => item.shiftId === quickForm.productionShift));

const loadOnlineEmployees = async () => {
  if (!podConfig.value.shopOrder && !podConfig.value.resource) {
    onlineEmployeeList.value = [];
    workCenterOnlineEmployeeList.value = [];
    return;
  }
  const res = await getWorkPanelData({
    workCenter: podConfig.value.workCenter,
    resrce: podConfig.value.resource,
    shopOrder: podConfig.value.shopOrder
  });
  onlineEmployeeList.value = res.data?.onlineEmployeeList || [];
};

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

const loadEmployeeFavorites = async () => {
  const res = await listEmployeeFavorite(1);
  employeeFavoriteList.value = (res.data || []).map(mapEmployeeFavorite);
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

const handleProductionShiftChange = (shiftId: string) => {
  if (shiftId) {
    localStorage.setItem(productionShiftCacheKey.value, shiftId);
  }
};

const loadStartTimeLimit = async () => {
  const { data } = await getWorkPanelStartTimeLimit();
  startTimeLimit.minStartDateTime = data?.minStartDateTime || '';
  startTimeLimit.maxStartDateTime = data?.maxStartDateTime || '';
};

const validateStartTimeLimit = () => {
  const startDateTime = quickForm.startDateTime || now();
  const result = isStartDateTimeWithinLimit(startDateTime, startTimeLimit.minStartDateTime, startTimeLimit.maxStartDateTime);
  if (!result.valid) {
    ElMessage.warning(result.message);
    return false;
  }
  return true;
};

const validateStartShiftTime = () => {
  const shift = selectedProductionShift.value;
  if (!shift) {
    ElMessage.warning('请先选择班别');
    return false;
  }
  const startDateTime = quickForm.startDateTime || now();
  if (!isDateTimeWithinShift(startDateTime, shift.startTime, shift.endTime)) {
    ElMessage.warning(`开工时间不在班别时间(${shift.startTime || '-'}~${shift.endTime || '-'})之内`);
    return false;
  }
  return true;
};

const applyWorkStartFavorite = (row?: EmployeeFavorite) => {
  if (!row) return;
  workStartCardInput.value = row.employeeId;
};

const buildWorkStartEmployee = (employee: EmployeeFavorite, bindingIdList?: Array<string | number>): WorkPanelEmployeeForm => ({
  workCenter: podConfig.value.workCenter,
  resrce: podConfig.value.resource,
  shopOrder: podConfig.value.shopOrder,
  employeeId: employee.employeeId.trim().toUpperCase(),
  employeeName: employee.employeeName || '',
  dateTime: quickForm.startDateTime || now(),
  bindingIdList
});

const addPendingEmployee = (employee: EmployeeFavorite, bindingIdList?: Array<string | number>) => {
  const item = buildWorkStartEmployee(employee, bindingIdList);
  if (pendingEmployeeList.value.some((pending) => pending.employeeId === item.employeeId)) {
    return false;
  }
  pendingEmployeeList.value.push(item);
  return true;
};

const removePendingEmployee = (employee: WorkCenterEmployeeBindingVO) => {
  pendingEmployeeList.value = pendingEmployeeList.value.filter((item) => item.employeeId !== employee.employeeId);
};

const validateAndAddWorkStartEmployee = async (employee: EmployeeFavorite) => {
  const employeeId = employee.employeeId.trim().toUpperCase();
  if (!employeeId) return;
  if (pendingEmployeeList.value.some((item) => item.employeeId === employeeId)) {
    ElMessage.warning(`${employeeId} 已在待上线列表中`);
    return;
  }

  const payload = buildWorkStartEmployee({ ...employee, employeeId });
  const { data: status } = await checkEmployeeOnlineStatus(payload);
  const resolvedEmployee = {
    employeeId,
    employeeName: status.employeeName || employee.employeeName || ''
  };
  if (status.onlineStatus === 0) {
    addPendingEmployee(resolvedEmployee);
    return;
  }
  if (status.onlineStatus === 1 || status.onlineStatus === 2) {
    ElMessage.warning(status.message || `${employeeId} 已在线`);
    return;
  }

  employeeConflictQueue.value.push({ employee: resolvedEmployee, status });
};

const showNextEmployeeConflict = () => {
  if (employeeConflictDialog.visible) return;
  const nextConflict = employeeConflictQueue.value.shift();
  if (!nextConflict) return;
  employeeConflictDialog.employee = nextConflict.employee;
  employeeConflictDialog.status = nextConflict.status;
  selectedConflictBindingIds.value = [];
  employeeConflictDialog.visible = true;
  nextTick(() => employeeConflictTableRef.value?.clearSelection?.());
};

const handleConflictSelectionChange = (rows: WorkCenterEmployeeBindingVO[]) => {
  selectedConflictBindingIds.value = rows.map((item) => item.id);
};

const confirmEmployeeConflict = () => {
  if (!employeeConflictDialog.employee) return;
  if (!selectedConflictBindingIds.value.length) {
    ElMessage.warning('请选择需要下线的记录');
    return;
  }
  addPendingEmployee(employeeConflictDialog.employee, [...selectedConflictBindingIds.value]);
  employeeConflictDialog.visible = false;
};

const formatOnlineBindingDesc = (binding: WorkCenterEmployeeBindingVO) => {
  const employeeId = binding.employeeId || employeeConflictDialog.employee?.employeeId || '';
  if (binding.shopOrder) {
    return `${employeeId} 于 ${binding.onLineTime || '-'} 在工作中心 ${binding.workCenter || '-'} 的工单 ${binding.shopOrder} 上线`;
  }
  return `${employeeId} 于 ${binding.onLineTime || '-'} 在工作中心 ${binding.workCenter || '-'} 上线`;
};

const addWorkStartEmployeeFromInput = async () => {
  const employeeId = workStartCardInput.value.trim();
  if (!employeeId || employeeAdding.value) return;
  employeeAdding.value = true;
  try {
    const favorite = employeeFavoriteList.value.find((item) => item.employeeId === employeeId);
    await validateAndAddWorkStartEmployee({ employeeId, employeeName: favorite?.employeeName || '' });
    showNextEmployeeConflict();
    workStartCardInput.value = '';
  } finally {
    employeeAdding.value = false;
  }
};

const addWorkStartEmployeesFromFavorites = async (rows: EmployeeFavorite[]) => {
  if (!rows.length || employeeAdding.value) return;
  employeeAdding.value = true;
  let addedCount = 0;
  const beforeCount = pendingEmployeeList.value.length;
  try {
    for (const row of rows) {
      await validateAndAddWorkStartEmployee(row);
    }
    addedCount = pendingEmployeeList.value.length - beforeCount;
    showNextEmployeeConflict();
    if (addedCount > 0) {
      ElMessage.success(`已加入 ${addedCount} 名待上线员工`);
    }
  } finally {
    employeeAdding.value = false;
  }
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

const goBack = () => {
  const from = route.query.from;
  if (typeof from === 'string' && from) {
    router.push(from);
    return;
  }
  router.back();
};

const handleWorkStart = async () => {
  if (!requirePanelSelection()) return;
  if (!quickForm.productionShift) {
    ElMessage.warning('请先选择班别');
    return;
  }
  if (!validateStartTimeLimit()) {
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
      businessType: 1,
      employeeList: pendingEmployeeList.value.map((item) => ({ ...item }))
    });
    ElMessage.success('开工登记成功');
    goBack();
  } finally {
    submitLoading.value = false;
  }
};

onMounted(async () => {
  findPodConfig();
  await ensurePlannedItem();
  quickForm.startDateTime = now();
  if (!requirePanelSelection()) {
    return;
  }
  workStartPanelTab.value = 'shopOrder';
  workStartCardInput.value = '';
  await Promise.all([
    loadStartTimeLimit(),
    loadProductionShiftList(quickForm.startDateTime),
    loadOnlineEmployees(),
    loadWorkCenterOnlineEmployees(),
    loadEmployeeFavorites()
  ]);
});
</script>

<style scoped>
.work-start-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px);
  box-sizing: border-box;
  padding: 18px !important;
  overflow: hidden;
  background: radial-gradient(circle at 90% 0%, rgb(59 130 246 / 11%), transparent 28%), linear-gradient(180deg, #f8fbff 0%, #f1f5f9 100%);
}

.work-start-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
  padding: 8px 12px;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  background: linear-gradient(90deg, #eff6ff 0%, #fff 42%, #fff 100%);
}

.header-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.back-button {
  border-color: #dbeafe;
  background: #fff;
  color: #2563eb;
}

.back-button:hover {
  border-color: #93c5fd;
  background: #eff6ff;
  color: #1d4ed8;
}

.header-icon {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 8px;
  background: #2563eb;
  color: #fff;
  font-size: 16px;
}

.work-start-title {
  margin: 0;
  color: #1e40af;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.header-main p {
  display: none;
}

.shop-order-badge {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  padding: 4px 10px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #fff;
  text-align: right;
}

.shop-order-badge span,
.shop-order-badge strong {
  display: inline;
}

.shop-order-badge span {
  color: #6b7280;
  font-size: 12px;
}

.shop-order-badge strong {
  margin-top: 0;
  color: #1d4ed8;
  font-size: 14px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.work-start-card {
  flex: 1;
  min-height: 0;
  border: 0;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgb(15 23 42 / 8%);
}

.work-start-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  padding: 18px 20px 16px;
  overflow: hidden;
}

.work-start-card :deep(.android-panel-dialog) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.work-start-footer {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 0 0;
  border-top: 1px solid #e5e7eb;
}

.work-start-action-button {
  width: 112px;
  height: 42px;
  margin-left: 0 !important;
}

.footer-tip {
  margin-right: auto;
  color: #94a3b8;
  font-size: 13px;
}

@media (max-width: 720px) {
  .work-start-header {
    padding: 6px 10px;
  }

  .header-main p,
  .shop-order-badge span,
  .footer-tip {
    display: none;
  }

  .shop-order-badge {
    min-width: auto;
  }
}
</style>
