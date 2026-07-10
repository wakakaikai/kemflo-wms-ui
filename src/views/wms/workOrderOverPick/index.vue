<template>
  <div class="p-2 over-pick-page">
    <el-card shadow="never" class="page-card">
      <template #header>
        <div class="page-header">
          <div>
            <h2 class="title">工单超领</h2>
            <p class="subtitle">按工单BOM填写超领数量、选择超领原因，勾选物料，检查库存后生成备料计划</p>
          </div>
        </div>
      </template>

      <el-form :inline="true" label-width="auto" class="query-form">
        <el-form-item label="工单号" required>
          <el-input v-model="workOrderNo" placeholder="请输入工单号" clearable style="width: 200px" @keydown.tab.prevent="handleLoadWorkOrder" @keydown.enter.prevent="handleLoadWorkOrder" />
        </el-form-item>
        <el-form-item label="需求人" required>
          <div class="demand-user-field">
            <el-radio-group v-model="demandUserMode" @change="onDemandUserModeChange">
              <el-radio value="self">本人（{{ currentUserDisplay || '-' }}）</el-radio>
              <el-radio value="other">其他人</el-radio>
            </el-radio-group>
            <el-select v-if="demandUserMode === 'other'" v-model="otherUserCode" placeholder="请选择其他需求人员" filterable clearable style="width: 220px" @change="applyDemandUserSelection">
              <el-option v-for="dict in otherUserOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loadingWorkOrder" @click="handleLoadWorkOrder">查询工单</el-button>
          <el-button :disabled="!workOrder" @click="openBomPicker">从 BOM 选择物料</el-button>
        </el-form-item>
      </el-form>

      <el-descriptions v-if="workOrder" :column="4" border size="small" class="work-order-summary">
        <el-descriptions-item label="工单号">{{ workOrder.workOrderNo }}</el-descriptions-item>
        <el-descriptions-item label="产品料号">{{ workOrder.item || '-' }}</el-descriptions-item>
        <el-descriptions-item label="产品描述">{{ workOrder.itemDesc || '-' }}</el-descriptions-item>
        <el-descriptions-item label="计划数量">{{ workOrder.plannedQty }} {{ workOrder.unit }}</el-descriptions-item>
      </el-descriptions>

      <div class="list-toolbar">
        <span class="list-title">超领清单</span>
        <div class="list-actions">
          <el-button v-if="generatedDemand" type="primary" plain size="small" @click="startNewOverPick">继续超领</el-button>
          <el-button size="small" :disabled="!pickLines.length" :loading="checkingInventory" @click="handleCheckInventory">库存检查</el-button>
          <el-button type="primary" size="small" :disabled="!canGenerate" :loading="generating" @click="openTargetLocationDialog">生成备料计划</el-button>
          <el-button size="small" type="danger" plain :disabled="!pickLines.length" @click="clearPickLines">清空清单</el-button>
        </div>
      </div>

      <div v-if="resultMessage" class="result-alert">
        <el-alert show-icon :type="resultStatus ? 'success' : 'error'" :closable="false">
          <template #icon>
            <Bell />
          </template>
          <div class="result-alert-body">
            <span>{{ resultMessage }}</span>
            <el-button v-if="resultStatus && generatedDemand" type="primary" link @click="startNewOverPick">继续填写超领单</el-button>
          </div>
        </el-alert>
      </div>

      <el-table v-loading="checkingInventory" :data="pickLines" border stripe size="small" max-height="420" empty-text="请先查询工单并从 BOM 添加物料">
        <el-table-column type="index" label="序号" width="56" align="center" />
        <el-table-column label="库存" width="52" align="center">
          <template #default="{ row }">
            <inventory-status :material="row" />
          </template>
        </el-table-column>
        <el-table-column prop="componentMaterial" label="物料编码" min-width="120" />
        <el-table-column prop="componentDesc" label="物料描述" min-width="150" show-overflow-tooltip />
        <el-table-column label="BOM需求" width="100" align="right">
          <template #default="{ row }">{{ formatQty(row.componentQty) }}</template>
        </el-table-column>
        <el-table-column label="已发料" width="90" align="right">
          <template #default="{ row }">{{ formatQty(row.issuedQty) }}</template>
        </el-table-column>
        <el-table-column label="超领数量" min-width="170">
          <template #default="{ row, $index }">
            <issue-qty-dual-input :row="row" :max-issue-qty="999999999" @change="(val: number) => updatePickQty($index, val)" @unit-change="(altUnit: string) => updatePickUnit($index, altUnit)" />
          </template>
        </el-table-column>
        <el-table-column label="超领原因" min-width="180">
          <template #default="{ row, $index }">
            <el-select :model-value="row.overPickCode" placeholder="请选择" filterable clearable size="small" class="reason-select" @update:model-value="(val: string | number) => updateOverPickReason($index, val)">
              <el-option v-for="dict in overPickReasonOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="可用库存" width="100" align="right">
          <template #default="{ row }">{{ formatQty(row.availableQty) }}</template>
        </el-table-column>
        <el-table-column label="齐套率" width="100" align="center">
          <template #default="{ row }">
            <kit-rate-indicator :material="row" />
          </template>
        </el-table-column>
        <el-table-column label="推荐明细" min-width="220">
          <template #default="{ row, $index }">
            <template v-if="getRecommendItems(row, $index).length">
              <div v-for="(pick, lineIndex) in getRecommendItems(row, $index).slice(0, 2)" :key="lineIndex" class="recommend-pick-row" :class="{ 'is-other-line': pick.isOtherLine }">
                <span class="pick-loc" :title="pick.location">{{ pick.location }}</span>
                <span class="pick-batch" :title="pick.batch">{{ pick.batch }}</span>
                <span class="pick-qty">
                  <span v-if="pick.isOtherLine" class="qty-tag">其他线边</span>
                  {{ pick.qty }}<span v-if="pick.unit" class="pick-unit">{{ pick.unit }}</span>
                </span>
              </div>
              <span v-if="getRecommendItems(row, $index).length > 2" class="text-muted">等 {{ getRecommendItems(row, $index).length }} 项</span>
            </template>
            <span v-else class="text-muted">{{ hasInventoryChecked(row) ? '暂无推荐' : '请先库存检查' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="库位" width="140" align="center">
          <template #default="{ row, $index }">
            <el-button type="primary" link size="small" :disabled="!canOpenLocation(row)" @click="openLocationRecommend(row, $index)">系统推荐</el-button>
            <el-button type="primary" link size="small" @click="openLocationQuery(row, $index)">查库存</el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template #default="{ $index }">
            <el-button type="danger" link size="small" @click="removePickLine($index)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <prep-demand-plan-view v-if="generatedDemand" class="plan-view-card" :demand="generatedDemand" :material-user-code="materialUserCode" :material-user-name="materialUserLabel" hide-shortage-section show-continue-over-pick @refresh="reloadGeneratedDemand" @continue="startNewOverPick" />

    <over-pick-bom-picker-dialog v-model="bomPickerVisible" :work-order="workOrder" :existing-lines="pickLines" @confirm="onBomPicked" />
    <target-demand-location-dialog v-model="targetLocationVisible" :user-name="materialUserCode" :submitting="generating" @confirm="handleGeneratePrepDemand" />

    <location-detail-dialog v-model="showLocationDialog" :material="selectedMaterial" :work-order-no="workOrder?.workOrderNo" :mode="locationDialogMode" :peer-reserved-inventory-qty="locationPeerReservedQty" :peer-location-picks="locationPeerPicks" :base-location-rows="locationDialogMode === 'recommend' ? locationBaseRows : undefined" @confirm="onLocationConfirm" />
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, ref, toRefs, watch } from 'vue';
import { Bell } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { HttpStatus } from '@/enums/RespEnum';
import InventoryApi, { applyIssueUnitSelection, collectPeerLocationPicks, getBomRecommendInfoItems, getPeerReservedInventoryQty, getWorkOrderByNo, generateAllocation, normalizeMaterialInventoryResponse, refreshBomRowRecommendations, resolvePrepDemandTargetLocationFromItems, type AllocationGenerateResult } from '@/api/wms/allocation/index';
import type { MaterialLocationRow, WorkOrderVO } from '@/api/wms/allocation/types';
import { getPrepDemand, normalizePrepDemand, PREP_DEMAND_TYPE_OVER_PICK } from '@/api/wms/workOrderPrepDemand/index';
import type { WorkOrderPrepDemandVO } from '@/api/wms/workOrderPrepDemand/types';
import { applyOverPickReasonOption, buildOverPickPrepItems, buildWorkOrderFromOverPickLines, checkOverPickInventory, classifyOverPickWorkOrder, isOverPickInventorySufficient, isOverPickLineReady, mergeOverPickLines, validateOverPickClassifiedOrder, validateOverPickInventorySufficient, validateOverPickLines, type OverPickLine } from '@/api/wms/workOrderOverPick/index';
import OverPickBomPickerDialog from './components/OverPickBomPickerDialog.vue';
import TargetDemandLocationDialog from '@/views/wms/allocation/components/TargetDemandLocationDialog.vue';
import type { TargetDemandLocationSelection } from '@/views/wms/allocation/components/TargetDemandLocationDialog.vue';
import PrepDemandPlanView from '@/views/wms/allocation/components/PrepDemandPlanView.vue';
import IssueQtyDualInput from '@/views/wms/allocation/components/IssueQtyDualInput.vue';
import InventoryStatus from '@/views/wms/allocation/components/InventoryStatus.vue';
import KitRateIndicator from '@/views/wms/allocation/components/KitRateIndicator.vue';
import LocationDetailDialog, { type LocationDialogMode } from '@/views/wms/allocation/components/LocationDetailDialog.vue';
import { useUserStore } from '@/store/modules/user';

type DemandUserMode = 'self' | 'other';

const userStore = useUserStore();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_material_user, wms_material_over_pick } = toRefs<any>(proxy?.useDict('wms_material_user', 'wms_material_over_pick'));

const workOrderNo = ref('');
const workOrder = ref<WorkOrderVO | null>(null);
const pickLines = ref<OverPickLine[]>([]);
const loadingWorkOrder = ref(false);
const checkingInventory = ref(false);
const generating = ref(false);
const bomPickerVisible = ref(false);
const targetLocationVisible = ref(false);
const classifiedOrder = ref<WorkOrderVO | null>(null);
const generatedDemand = ref<WorkOrderPrepDemandVO | null>(null);
const resultMessage = ref('');
const resultStatus = ref(false);
const selectedMaterial = ref<OverPickLine | null>(null);
const selectedMaterialIndex = ref(-1);
const showLocationDialog = ref(false);
const locationDialogMode = ref<LocationDialogMode>('recommend');
const materialLocationCache = ref(new Map<string, MaterialLocationRow[]>());
const inventoryChecked = ref(false);

const materialUserOptions = computed(() => (wms_material_user.value || []) as DictDataOption[]);
const demandUserMode = ref<DemandUserMode>('self');
const otherUserCode = ref('');
const materialUserCode = ref('');
const materialUserLabel = ref('');

const currentUserDisplay = computed(() => userStore.nickname || userStore.name || '');

const resolveSelfDictOption = (): DictDataOption | undefined => {
  const userName = String(userStore.name || '').trim();
  if (!userName) return undefined;
  return materialUserOptions.value.find((d) => String(d.value) === userName);
};

const otherUserOptions = computed(() => {
  const userName = String(userStore.name || '').trim();
  if (!userName) return materialUserOptions.value;
  return materialUserOptions.value.filter((d) => String(d.value) !== userName);
});

const applyDemandUserSelection = (): boolean => {
  if (demandUserMode.value === 'self') {
    const userName = String(userStore.name || '').trim();
    if (!userName) return false;
    materialUserCode.value = userName;
    const self = resolveSelfDictOption();
    materialUserLabel.value = self?.label || userStore.nickname || userName;
    return true;
  }
  const code = String(otherUserCode.value || '').trim();
  if (!code) return false;
  const hit = materialUserOptions.value.find((d) => String(d.value) === code);
  materialUserCode.value = code;
  materialUserLabel.value = hit?.label || code;
  return true;
};

const onDemandUserModeChange = () => {
  if (demandUserMode.value === 'self') {
    applyDemandUserSelection();
    return;
  }
  materialUserCode.value = '';
  materialUserLabel.value = '';
};

watch(
  materialUserOptions,
  () => {
    if (demandUserMode.value === 'self') {
      applyDemandUserSelection();
    }
  },
  { immediate: true }
);

const overPickReasonOptions = computed(() => (wms_material_over_pick.value || []) as DictDataOption[]);

const canGenerate = computed(() => {
  if (!workOrder.value || !inventoryChecked.value) return false;
  if (!pickLines.value.some((row) => isOverPickLineReady(row))) return false;
  if (!isOverPickInventorySufficient(pickLines.value)) return false;
  if (classifiedOrder.value && validateOverPickClassifiedOrder(classifiedOrder.value)) return false;
  return true;
});

const formatQty = (qty?: number) => {
  const n = Number(qty ?? 0);
  return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '-';
};

const getRecommendItems = (row: OverPickLine, index: number) => getBomRecommendInfoItems(row, pickLines.value, index);

const hasInventoryChecked = (row: OverPickLine) => inventoryChecked.value || row.availableQty != null || !!row.checkInventoryRecommendedLocations?.length;

const canOpenLocation = (row: OverPickLine) => Number(row.issueQty ?? 0) > 0 && hasInventoryChecked(row);

const locationPeerReservedQty = computed(() => (selectedMaterialIndex.value >= 0 ? getPeerReservedInventoryQty(pickLines.value, selectedMaterialIndex.value) : 0));

const locationPeerPicks = computed(() => (selectedMaterialIndex.value >= 0 ? collectPeerLocationPicks(pickLines.value, selectedMaterialIndex.value) : []));

const locationBaseRows = computed(() => {
  const row = selectedMaterial.value;
  if (!row) return undefined;
  if (row.checkInventoryRecommendedLocations?.length) {
    return row.checkInventoryRecommendedLocations;
  }
  return materialLocationCache.value.get(row.componentMaterial);
});

const ensureMaterialLocations = async (materialCode: string) => {
  const cached = materialLocationCache.value.get(materialCode);
  if (cached) return cached;
  const response = await InventoryApi.getMaterialLocations(materialCode);
  if (response.code !== 200) return [];
  const rows = normalizeMaterialInventoryResponse(response.data);
  materialLocationCache.value.set(materialCode, rows);
  return rows;
};

const refreshPickLineRecommendations = () => {
  if (!inventoryChecked.value) return;
  pickLines.value = refreshBomRowRecommendations(pickLines.value, materialLocationCache.value);
};

const clearPickLineLocationState = (index: number) => {
  const row = pickLines.value[index];
  if (!row) return;
  pickLines.value[index] = {
    ...row,
    manualLocationSelections: undefined,
    locationOverrideReason: undefined,
    fifoRecommendedLocations: undefined
  };
};

const openLocationRecommend = async (row: OverPickLine, index: number) => {
  if (Number(row.issueQty ?? 0) <= 0) {
    ElMessage.warning('请先填写超领数量');
    return;
  }
  if (!hasInventoryChecked(row)) {
    ElMessage.warning('请先执行库存检查');
    return;
  }
  await ensureMaterialLocations(row.componentMaterial);
  selectedMaterial.value = pickLines.value[index] ?? row;
  selectedMaterialIndex.value = index;
  locationDialogMode.value = 'recommend';
  showLocationDialog.value = true;
};

const openLocationQuery = (row: OverPickLine, index: number) => {
  selectedMaterial.value = pickLines.value[index] ?? row;
  selectedMaterialIndex.value = index;
  locationDialogMode.value = 'query';
  showLocationDialog.value = true;
};

const onLocationConfirm = async (payload: { material: OverPickLine | null; locations: MaterialLocationRow[]; overrideReason?: string }) => {
  if (selectedMaterialIndex.value < 0) return;
  if (!payload.locations.length) {
    ElMessage.warning('超领仅能领取现有库存，请选择库位');
    return;
  }
  const idx = selectedMaterialIndex.value;
  const current = pickLines.value[idx];
  if (!current) return;
  pickLines.value[idx] = {
    ...current,
    manualLocationSelections: payload.locations.map((loc) => ({ ...loc, recommendedQty: Number(loc.recommendedQty ?? 0) })),
    locationOverrideReason: payload.overrideReason
  };
  classifiedOrder.value = null;
  if (!workOrder.value) return;
  try {
    const classified = await classifyOverPickWorkOrder(buildWorkOrderFromOverPickLines(workOrder.value, pickLines.value));
    const classifiedError = validateOverPickClassifiedOrder(classified, pickLines.value);
    if (classifiedError) {
      ElMessage.warning(classifiedError);
      return;
    }
    classifiedOrder.value = classified;
  } catch {
    classifiedOrder.value = null;
  }
  ElMessage.success(payload.overrideReason ? '库位选择已保存（已记录数量调整原因）' : '库位选择已保存');
};

const ensureDemandUser = () => {
  if (!applyDemandUserSelection()) {
    ElMessage.warning(demandUserMode.value === 'other' ? '请选择其他需求人员' : '无法获取登录工号（userName）');
    return false;
  }
  return true;
};

const handleLoadWorkOrder = async () => {
  const woNo = String(workOrderNo.value || '').trim();
  if (!woNo) {
    ElMessage.warning('请输入工单号');
    return;
  }
  loadingWorkOrder.value = true;
  resultMessage.value = '';
  try {
    const response = await getWorkOrderByNo(woNo);
    if (response.code !== 200 || !response.data) {
      ElMessage.error(response.msg || '未找到工单');
      workOrder.value = null;
      return;
    }
    workOrder.value = response.data;
    pickLines.value = [];
    classifiedOrder.value = null;
    generatedDemand.value = null;
    inventoryChecked.value = false;
    materialLocationCache.value.clear();
  } catch (error) {
    ElMessage.error((error as Error)?.message || '查询工单失败');
  } finally {
    loadingWorkOrder.value = false;
  }
};

const openBomPicker = () => {
  if (!workOrder.value) {
    ElMessage.warning('请先查询工单');
    return;
  }
  bomPickerVisible.value = true;
};

const onBomPicked = (lines: OverPickLine[]) => {
  pickLines.value = mergeOverPickLines(pickLines.value, lines);
  classifiedOrder.value = null;
  generatedDemand.value = null;
  inventoryChecked.value = false;
  resultMessage.value = '';
};

const updatePickQty = (index: number, val: number) => {
  const row = pickLines.value[index];
  if (!row) return;
  pickLines.value[index] = { ...row, issueQty: Math.max(0, Number(val) || 0) };
  clearPickLineLocationState(index);
  refreshPickLineRecommendations();
  classifiedOrder.value = null;
};

const updatePickUnit = (index: number, altUnit: string) => {
  const row = pickLines.value[index];
  if (!row) return;
  pickLines.value[index] = applyIssueUnitSelection(row, altUnit);
  clearPickLineLocationState(index);
  refreshPickLineRecommendations();
  classifiedOrder.value = null;
};

const updateOverPickReason = (index: number, code: string | number) => {
  const row = pickLines.value[index];
  if (!row) return;
  pickLines.value[index] = applyOverPickReasonOption(row, code, overPickReasonOptions.value);
  classifiedOrder.value = null;
};

const removePickLine = (index: number) => {
  pickLines.value.splice(index, 1);
  classifiedOrder.value = null;
};

const clearPickLines = () => {
  pickLines.value = [];
  classifiedOrder.value = null;
  generatedDemand.value = null;
  inventoryChecked.value = false;
  materialLocationCache.value.clear();
  resultMessage.value = '';
};

const handleCheckInventory = async () => {
  if (!workOrder.value) {
    ElMessage.warning('请先查询工单');
    return;
  }
  if (!ensureDemandUser()) return;
  const validationError = validateOverPickLines(pickLines.value);
  if (validationError) {
    ElMessage.warning(validationError);
    return;
  }
  checkingInventory.value = true;
  resultMessage.value = '';
  try {
    const materialCodes = [...new Set(pickLines.value.map((row) => row.componentMaterial).filter(Boolean))];
    await Promise.all(materialCodes.map((code) => ensureMaterialLocations(code)));
    pickLines.value = await checkOverPickInventory(workOrder.value, pickLines.value, materialUserCode.value);
    pickLines.value = refreshBomRowRecommendations(pickLines.value, materialLocationCache.value);
    const classified = await classifyOverPickWorkOrder(buildWorkOrderFromOverPickLines(workOrder.value, pickLines.value));
    const inventoryError = validateOverPickInventorySufficient(pickLines.value);
    if (inventoryError) {
      resultStatus.value = false;
      resultMessage.value = inventoryError;
      classifiedOrder.value = null;
      return;
    }
    const classifiedError = validateOverPickClassifiedOrder(classified, pickLines.value);
    if (classifiedError) {
      resultStatus.value = false;
      resultMessage.value = classifiedError;
      classifiedOrder.value = null;
      return;
    }
    classifiedOrder.value = classified;
    inventoryChecked.value = true;
    resultStatus.value = true;
    resultMessage.value = '库存检查完成，可查看推荐明细或点击「系统推荐」调整库位后生成备料计划';
  } catch (error) {
    resultStatus.value = false;
    resultMessage.value = (error as Error)?.message;
  } finally {
    checkingInventory.value = false;
  }
};

const openTargetLocationDialog = async () => {
  if (!workOrder.value) {
    ElMessage.warning('请先查询工单');
    return;
  }
  if (!ensureDemandUser()) return;
  if (!canGenerate.value) {
    ElMessage.warning('请添加超领物料、填写数量并选择超领原因');
    return;
  }
  if (!classifiedOrder.value) {
    await handleCheckInventory();
    if (!classifiedOrder.value) return;
  }
  targetLocationVisible.value = true;
};

const applyTargetDemandLocation = (selection: TargetDemandLocationSelection) => {
  if (!classifiedOrder.value) return;
  const locationCode = String(selection.locationCode || '').trim();
  const warehouseCode = String(selection.warehouseCode || '').trim() || undefined;
  classifiedOrder.value = {
    ...classifiedOrder.value,
    materialDemandDetails: (classifiedOrder.value.materialDemandDetails || []).map((line) => ({
      ...line,
      targetDemandLocationCode: locationCode,
      targetDemandWarehouseCode: warehouseCode
    }))
  };
};

const handleGeneratePrepDemand = async (selection: TargetDemandLocationSelection) => {
  if (!workOrder.value || !classifiedOrder.value) return;
  generating.value = true;
  resultMessage.value = '';
  try {
    applyTargetDemandLocation(selection);
    const inventoryError = validateOverPickInventorySufficient(pickLines.value);
    if (inventoryError) {
      resultStatus.value = false;
      resultMessage.value = inventoryError;
      return;
    }
    const classifiedError = validateOverPickClassifiedOrder(classifiedOrder.value);
    if (classifiedError) {
      resultStatus.value = false;
      resultMessage.value = classifiedError;
      return;
    }
    const prepItems = buildOverPickPrepItems(classifiedOrder.value);
    if (!prepItems.length) {
      resultStatus.value = false;
      resultMessage.value = '没有可生成的备料明细，请确认库存充足且库位已分配';
      return;
    }
    const targetDemand = resolvePrepDemandTargetLocationFromItems(prepItems);
    const response = await generateAllocation({
      workOrderNos: [workOrder.value.workOrderNo],
      prepItems,
      isEmergency: false,
      demandType: PREP_DEMAND_TYPE_OVER_PICK,
      materialUserCode: materialUserCode.value,
      materialUserName: materialUserLabel.value,
      targetDemandLocationCode: targetDemand.targetDemandLocationCode,
      targetDemandWarehouseCode: targetDemand.targetDemandWarehouseCode
    });
    if (response.code !== HttpStatus.SUCCESS) {
      resultStatus.value = false;
      resultMessage.value = response.msg || '生成备料计划失败';
      return;
    }
    const result = response.data as AllocationGenerateResult | undefined;
    if (result?.success === false) {
      resultStatus.value = false;
      resultMessage.value = result.message || '生成备料计划失败';
      return;
    }
    if (!result?.demand?.id) {
      resultStatus.value = false;
      resultMessage.value = '未生成备料需求';
      return;
    }
    targetLocationVisible.value = false;
    generatedDemand.value = normalizePrepDemand(result.demand);
    resultStatus.value = true;
    resultMessage.value = `超领单已生成：${result.demand.demandNo}`;
  } catch (error) {
    resultStatus.value = false;
    resultMessage.value = (error as Error)?.message || '生成备料计划失败';
  } finally {
    generating.value = false;
  }
};

const reloadGeneratedDemand = async () => {
  if (!generatedDemand.value?.id) return;
  const response = await getPrepDemand(generatedDemand.value.id);
  if (response.code === 200 && response.data) {
    generatedDemand.value = response.data;
  }
};

const startNewOverPick = async () => {
  pickLines.value = [];
  classifiedOrder.value = null;
  generatedDemand.value = null;
  inventoryChecked.value = false;
  materialLocationCache.value.clear();
  resultMessage.value = '';
  resultStatus.value = false;
  await nextTick();
  document.querySelector('.over-pick-page .query-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};
</script>

<style scoped>
.over-pick-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.page-header .title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.page-header .subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.query-form {
  margin-bottom: 12px;
}
.demand-user-field {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.work-order-summary {
  margin-bottom: 16px;
}
.list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.list-title {
  font-size: 15px;
  font-weight: 600;
}
.list-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.result-alert {
  margin-bottom: 12px;
}
.result-alert :deep(.el-alert) {
  padding: 6px 10px;
}
.result-alert-body {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.plan-view-card {
  margin-top: 4px;
}
.reason-select {
  width: 100%;
}
.recommend-pick-row {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
}
.recommend-pick-row.is-other-line {
  color: var(--el-text-color-secondary);
}
.pick-loc,
.pick-batch {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pick-qty {
  text-align: right;
  white-space: nowrap;
}
.pick-unit {
  margin-left: 2px;
}
.qty-tag {
  margin-right: 4px;
  font-size: 11px;
  color: var(--el-color-warning);
}
.text-muted {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
