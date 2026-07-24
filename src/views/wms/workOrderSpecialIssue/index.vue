<template>
  <div class="p-2 special-issue-page">
    <el-card shadow="never" class="page-card">
      <template #header>
        <div class="page-header">
          <div>
            <h2 class="title">特殊工单领料</h2>
            <p class="subtitle">ZP92-拆解工单 / ZP93-粉碎工单 261 领料：领料行加入清单后，点击「查库存」自行选择库位，确认后生成备料计划</p>
          </div>
        </div>
      </template>

      <!-- 模式切换 -->
      <div class="mode-selector">
        <el-radio-group v-model="issueMode" @change="onModeChange">
          <el-radio value="ZP92">ZP92-拆解工单（加载 BOM）</el-radio>
          <el-radio value="ZP93">ZP93-粉碎工单（手动添加）</el-radio>
        </el-radio-group>
      </div>

      <!-- 需求人 -->
      <div class="top-bar">
        <div class="demand-user-field">
          <span class="field-label">需求人：</span>
          <el-radio-group v-model="demandUserMode" size="small" @change="onDemandUserModeChange">
            <el-radio value="self">本人{{ currentUserDisplay || '-' }}</el-radio>
            <el-radio value="other">其他人</el-radio>
          </el-radio-group>
          <el-select v-if="demandUserMode === 'other'" v-model="otherUserCode" placeholder="请选择" filterable clearable size="small" style="width: 200px" @change="applyDemandUserSelection">
            <el-option v-for="dict in otherUserOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </div>
      </div>

      <!-- 工单区域 -->
      <div class="work-order-bar">
        <el-button type="primary" size="small" @click="showOrderDialog = true">
          <el-icon><Plus /></el-icon>
          选择工单
        </el-button>
        <el-descriptions v-if="workOrder" :column="4" border size="small" class="wo-summary">
          <el-descriptions-item label="工单号">{{ workOrder.workOrderNo }}</el-descriptions-item>
          <el-descriptions-item label="产品料号">{{ workOrder.item || '-' }}</el-descriptions-item>
          <el-descriptions-item label="产品描述">{{ workOrder.itemDesc || '-' }}</el-descriptions-item>
          <el-descriptions-item label="计划数量">{{ formatQty(workOrder.plannedQty) }} {{ workOrder.unit }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- ZP93：手动添加物料 -->
      <div v-if="issueMode === 'ZP93'" class="material-add-row">
        <HistoryInput v-model="materialCode" :config="materialCodeConfig" placeholder="请输入物料编码" style="width: 240px" @keydown.enter.prevent="handleAddByMaterial">
          <template #append>
            <el-button icon="Search" @click="showItemDialog" />
          </template>
        </HistoryInput>
        <el-input-number v-model="requiredQty" :min="0" :precision="3" :step="1" controls-position="right" placeholder="需求数量" style="width: 170px" @keydown.enter.prevent="handleAddByMaterial" />
        <el-button type="primary" :loading="loadingAdd" :disabled="!canAddMaterial" @click="handleAddByMaterial">添加</el-button>
      </div>

      <!-- ZP92：BOM 加载提示 -->
      <div v-if="issueMode === 'ZP92' && workOrder && pickLines.length" class="bom-hint">
        <el-alert type="success" :closable="false" show-icon>
          <template #title>已加载 BOM {{ pickLines.length }} 条物料，填写领料数量后点击「查库存」自行选择库位</template>
        </el-alert>
      </div>

      <!-- 清单工具栏 -->
      <div class="list-toolbar">
        <span class="list-title">领料清单</span>
        <div class="list-actions">
          <el-button v-if="generatedDemand" type="primary" plain size="small" @click="startNewIssue">继续领料</el-button>
          <el-button type="primary" size="small" :disabled="!canGenerate" :loading="generating" @click="openTargetLocationDialog">生成备料计划</el-button>
          <el-button size="small" type="danger" plain :disabled="!pickLines.length" @click="clearPickLines">清空清单</el-button>
        </div>
      </div>

      <!-- 结果提示 -->
      <div v-if="resultMessage" class="result-alert">
        <el-alert show-icon :type="resultStatus ? 'success' : 'error'" :closable="false">
          <template #icon>
            <Bell />
          </template>
          <div class="result-alert-body">
            <span>{{ resultMessage }}</span>
            <el-button v-if="resultStatus && generatedDemand" type="primary" link @click="startNewIssue">继续填写领料单</el-button>
          </div>
        </el-alert>
      </div>

      <!-- 领料清单表格 -->
      <el-table :data="pickLines" border stripe size="small" max-height="420" empty-text="ZP92 模式选择工单后自动加载 BOM；ZP93 模式输入物料编码与数量后点击「添加」">
        <el-table-column type="index" label="序号" width="56" align="center" />
        <el-table-column label="库存" width="52" align="center">
          <template #default="{ row }">
            <inventory-status :material="row" />
          </template>
        </el-table-column>
        <el-table-column prop="componentMaterial" label="物料编码" min-width="120" />
        <el-table-column prop="componentDesc" label="物料描述" min-width="150" show-overflow-tooltip />
        <el-table-column label="BOM需求" width="90" align="right">
          <template #default="{ row }">{{ formatQty(row.componentQty) }}</template>
        </el-table-column>
        <el-table-column label="已发料" width="80" align="right">
          <template #default="{ row }">{{ formatQty(row.issuedQty) }}</template>
        </el-table-column>
        <el-table-column label="待发" width="80" align="right">
          <template #default="{ row }">{{ formatQty(row.pendingQty) }}</template>
        </el-table-column>
        <el-table-column label="领料数量" min-width="160">
          <template #default="{ row, $index }">
            <issue-qty-dual-input :row="row" :max-issue-qty="999999999" @change="(val: number) => updatePickQty($index, val)" @unit-change="(altUnit: string) => updatePickUnit($index, altUnit)" />
          </template>
        </el-table-column>
        <el-table-column label="可用库存" width="90" align="right">
          <template #default="{ row }">{{ formatQty(row.availableQty) }}</template>
        </el-table-column>
        <el-table-column label="齐套率" width="90" align="center">
          <template #default="{ row }">
            <kit-rate-indicator :material="row" />
          </template>
        </el-table-column>
        <el-table-column label="已选库位" min-width="160">
          <template #default="{ row }">
            <template v-if="row.manualLocationSelections?.length">
              <div v-for="(loc, li) in row.manualLocationSelections.slice(0, 2)" :key="li" class="selected-loc-row">
                <span class="loc-code">{{ loc.locationCode }}</span>
                <span class="loc-qty">{{ formatQty(loc.recommendedQty) }}</span>
              </div>
              <span v-if="row.manualLocationSelections.length > 2" class="text-muted">等 {{ row.manualLocationSelections.length }} 项</span>
            </template>
            <span v-else class="text-muted">未选择</span>
          </template>
        </el-table-column>
        <el-table-column label="库位选择" width="110" align="center" fixed="right">
          <template #default="{ row, $index }">
            <el-button type="primary" link size="small" :disabled="!canSelectLocation(row)" @click="openLocationQuery(row, $index)">查库存</el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="70" align="center" fixed="right">
          <template #default="{ $index }">
            <el-button type="danger" link size="small" @click="removePickLine($index)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 已生成的备料计划 -->
      <prep-demand-plan-view v-if="generatedDemand" class="plan-view-card" :demand="generatedDemand" :material-user-code="materialUserCode" :material-user-name="materialUserLabel" hide-shortage-section @refresh="reloadGeneratedDemand" @continue="startNewIssue" />
    </el-card>

    <!-- 工单选择对话框 -->
    <work-order-selection-dialog v-model="showOrderDialog" :selected-orders="dialogSelectedOrders" :show-bom-action="false" @confirm="handleOrderSelection" />

    <!-- 目标库位对话框 -->
    <target-demand-location-dialog v-model="targetLocationVisible" :user-name="materialUserCode" :submitting="generating" @confirm="handleGeneratePrepDemand" />

    <!-- 库存选择对话框 -->
    <InventorySelectionDialog v-model="showLocationDialog" :material-code="selectedMaterialCode" :material-desc="selectedMaterialDesc" :issue-qty="selectedIssueQty" :unit="selectedUnit" @confirm="onInventoryLocationConfirm" />

    <!-- 物料选择对话框 -->
    <ItemDialog ref="itemDialogRef" @item-select-call-back="itemSelectCallBack" />
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, ref, toRefs, watch } from 'vue';
import { Bell, Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { HttpStatus } from '@/enums/RespEnum';
import HistoryInput from '@/components/HistoryInput/index.vue';
import { HistoryConfig } from '@/types/history';
import { applyIssueUnitSelection, generateAllocation, getWorkOrderBom, resolvePrepDemandTargetLocationFromItems, type AllocationGenerateResult } from '@/api/wms/allocation/index';
import type { WorkOrderVO } from '@/api/wms/allocation/types';
import { getPrepDemand, normalizePrepDemand } from '@/api/wms/workOrderPrepDemand/index';
import type { WorkOrderPrepDemandVO } from '@/api/wms/workOrderPrepDemand/types';
import {
  PREP_DEMAND_TYPE_NORMAL,
  buildWorkOrderFromSpecialIssueLines,
  buildSpecialPrepItems,
  classifySpecialIssueWorkOrder,
  isSpecialIssueLineReady,
  mapApiBomToSpecialIssueRow,
  mergeSpecialIssueLines,
  padWorkOrderNo,
  validateSpecialClassifiedOrder,
  validateSpecialInventorySufficient,
  type SpecialIssueLine
} from '@/api/wms/workOrderSpecialIssue/index';
import WorkOrderSelectionDialog from '@/views/wms/workOrder/components/WorkOrderSelectionDialog.vue';
import TargetDemandLocationDialog from '@/views/wms/allocation/components/TargetDemandLocationDialog.vue';
import type { TargetDemandLocationSelection } from '@/views/wms/allocation/components/TargetDemandLocationDialog.vue';
import PrepDemandPlanView from '@/views/wms/allocation/components/PrepDemandPlanView.vue';
import IssueQtyDualInput from '@/views/wms/allocation/components/IssueQtyDualInput.vue';
import InventoryStatus from '@/views/wms/allocation/components/InventoryStatus.vue';
import KitRateIndicator from '@/views/wms/allocation/components/KitRateIndicator.vue';
import InventorySelectionDialog from '@/views/wms/inventoryDetail/components/InventorySelectionDialog.vue';
import ItemDialog from '@/views/wms/item/components/itemDialog.vue';
import { useUserStore } from '@/store/modules/user';

type DemandUserMode = 'self' | 'other';

const userStore = useUserStore();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_material_user } = toRefs<any>(proxy?.useDict('wms_material_user'));

// ==================== 模式状态 ====================
const issueMode = ref<'ZP92' | 'ZP93'>('ZP93');
const showOrderDialog = ref(false);
const dialogSelectedOrders = ref<WorkOrderVO[]>([]);

const onModeChange = () => {
  clearAll();
};

// ==================== 需求人状态 ====================
const demandUserMode = ref<DemandUserMode>('self');
const otherUserCode = ref('');
const materialUserCode = ref('');
const materialUserLabel = ref('');

const materialUserOptions = computed(() => (wms_material_user.value || []) as DictDataOption[]);
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

// ==================== 工单与物料状态 ====================
const workOrderNo = ref('');
const materialCode = ref('');
const materialUnit = ref('');
const requiredQty = ref(0);
const workOrder = ref<WorkOrderVO | null>(null);
const pickLines = ref<SpecialIssueLine[]>([]);
const loadingAdd = ref(false);
const generating = ref(false);
const targetLocationVisible = ref(false);
const classifiedOrder = ref<WorkOrderVO | null>(null);
const generatedDemand = ref<WorkOrderPrepDemandVO | null>(null);
const resultMessage = ref('');
const resultStatus = ref(false);
const selectedMaterialCode = ref('');
const selectedMaterialDesc = ref('');
const selectedIssueQty = ref(0);
const selectedUnit = ref('');
const selectedLineIndex = ref(-1);
const showLocationDialog = ref(false);
const itemDialogRef = ref<InstanceType<typeof ItemDialog>>();

const materialCodeConfig: HistoryConfig = {
  key: 'materialCode',
  storage: 'indexedDB',
  maxSize: 10,
  page: 'workOrderSpecialIssue',
  autoSave: true,
  component: {
    showDropdown: true,
    showTime: false,
    showDelete: true,
    dropdownMaxHeight: '300px'
  }
};

// ==================== 工单选择 ====================
const handleOrderSelection = async (orders: WorkOrderVO[]) => {
  showOrderDialog.value = false;
  if (!orders.length) return;
  const order = orders[0];
  if (orders.length > 1) {
    ElMessage.warning('特殊工单仅支持单个工单，已选择首个工单');
  }
  workOrderNo.value = order.workOrderNo;
  workOrder.value = order;
  clearAll();

  if (issueMode.value === 'ZP92') {
    loadingAdd.value = true;
    try {
      const bomRes = await getWorkOrderBom(order.workOrderNo);
      if (bomRes.code !== 200) {
        ElMessage.error(bomRes.msg || '查询工单 BOM 失败');
        return;
      }
      const rows = (bomRes.data || []).map((bom: any) => mapApiBomToSpecialIssueRow(bom, order));
      if (!rows.length) {
        ElMessage.warning('工单 BOM 为空，无物料可领');
        return;
      }
      pickLines.value = mergeSpecialIssueLines([], rows);
      ElMessage.success(`已加载 BOM ${rows.length} 条物料，请填写领料数量并点击「查库存」选择库位`);
    } catch (error) {
      ElMessage.error((error as Error)?.message || '加载 BOM 失败');
    } finally {
      loadingAdd.value = false;
    }
  } else {
    ElMessage.success(`已选择工单：${order.workOrderNo}`);
  }
};

// ==================== 计算属性 ====================
const canAddMaterial = computed(() => !!workOrder.value && Number(requiredQty.value) > 0 && !!materialCode.value?.trim());

const canGenerate = computed(() => {
  if (!workOrder.value) return false;
  return pickLines.value.some((row) => isSpecialIssueLineReady(row));
});

const canSelectLocation = (row: SpecialIssueLine) => Number(row.issueQty ?? 0) > 0;

// ==================== 工具方法 ====================
const formatQty = (qty?: number | string) => {
  const n = Number(qty ?? 0);
  return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '-';
};

const clearAll = () => {
  pickLines.value = [];
  classifiedOrder.value = null;
  generatedDemand.value = null;
  resultMessage.value = '';
  resultStatus.value = false;
  workOrderNo.value = '';
  materialCode.value = '';
  requiredQty.value = 0;
  workOrder.value = null;
};

// ==================== 物料添加（ZP93） ====================
const handleAddByMaterial = () => {
  const woNo = padWorkOrderNo(workOrderNo.value);
  const matCode = String(materialCode.value || '').trim();
  const qty = Number(requiredQty.value) || 0;
  if (!woNo) {
    ElMessage.warning('请先选择工单');
    return;
  }
  if (!matCode) {
    ElMessage.warning('请输入料号');
    return;
  }
  if (qty <= 0) {
    ElMessage.warning('请输入需求数量');
    return;
  }

  const existingIndex = pickLines.value.findIndex((row) => row.componentMaterial === matCode);
  if (existingIndex >= 0) {
    pickLines.value[existingIndex] = { ...pickLines.value[existingIndex], issueQty: qty };
  } else {
    pickLines.value.push({
      componentMaterial: matCode,
      componentQty: 0,
      issueQty: qty,
      unit: materialUnit.value || undefined,
      workOrderNo: woNo
    });
  }
  classifiedOrder.value = null;
  generatedDemand.value = null;
  materialCode.value = '';
  requiredQty.value = 0;
};

// ==================== 库位选择（手动） ====================
const openLocationQuery = (row: SpecialIssueLine, index: number) => {
  if (Number(row.issueQty ?? 0) <= 0) {
    ElMessage.warning('请先填写领料数量');
    return;
  }
  selectedMaterialCode.value = row.componentMaterial;
  selectedMaterialDesc.value = row.componentDesc || '';
  selectedIssueQty.value = Number(row.issueQty ?? 0);
  selectedUnit.value = row.unit || '';
  selectedLineIndex.value = index;
  showLocationDialog.value = true;
};

const onInventoryLocationConfirm = (payload: { locations: any[] }) => {
  const idx = selectedLineIndex.value;
  if (idx < 0 || idx >= pickLines.value.length) return;
  const current = pickLines.value[idx];
  if (!current) return;
  pickLines.value[idx] = {
    ...current,
    manualLocationSelections: payload.locations.map((loc) => ({
      rowKey: loc.rowKey,
      warehouseCode: loc.warehouseCode,
      locationCode: loc.locationCode,
      batchCode: loc.batchCode,
      availableQuantity: loc.availableQuantity,
      recommendedQty: loc.pickQty,
      unit: loc.unit
    })),
    locationOverrideReason: undefined
  };
  classifiedOrder.value = null;
  ElMessage.success('库位选择已保存');
  selectedLineIndex.value = -1;
};

// ==================== 生成备料计划 ====================
const openTargetLocationDialog = async () => {
  if (!workOrder.value) {
    ElMessage.warning('请先选择工单');
    return;
  }
  if (!canGenerate.value) {
    ElMessage.warning('请添加物料并填写领料数量');
    return;
  }
  if (!classifiedOrder.value) {
    try {
      classifiedOrder.value = await classifySpecialIssueWorkOrder(buildWorkOrderFromSpecialIssueLines(workOrder.value, pickLines.value));
    } catch {
      ElMessage.error('分类失败，请重试');
      return;
    }
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
    const inventoryError = validateSpecialInventorySufficient(pickLines.value);
    if (inventoryError) {
      resultStatus.value = false;
      resultMessage.value = inventoryError;
      return;
    }
    const classifiedError = validateSpecialClassifiedOrder(classifiedOrder.value);
    if (classifiedError) {
      resultStatus.value = false;
      resultMessage.value = classifiedError;
      return;
    }
    const prepItems = buildSpecialPrepItems(classifiedOrder.value);
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
      demandType: PREP_DEMAND_TYPE_NORMAL,
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
    resultMessage.value = `领料备料单已生成：${result.demand.demandNo}`;
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

const startNewIssue = async () => {
  clearAll();
  await nextTick();
};

// ==================== 行操作 ====================
const updatePickQty = (index: number, val: number) => {
  const row = pickLines.value[index];
  if (!row) return;
  pickLines.value[index] = { ...row, issueQty: Math.max(0, Number(val) || 0) };
  classifiedOrder.value = null;
};

const updatePickUnit = (index: number, altUnit: string) => {
  const row = pickLines.value[index];
  if (!row) return;
  pickLines.value[index] = applyIssueUnitSelection(row, altUnit);
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
  resultMessage.value = '';
};

/** 显示物料选择对话框 */
const showItemDialog = () => {
  itemDialogRef.value?.openDialog();
  itemDialogRef.value?.handleQuery();
};

/** 物料选择回调 */
const itemSelectCallBack = (record: any) => {
  materialCode.value = record.item;
  materialUnit.value = record.unit || '';
};
</script>

<style scoped>
.special-issue-page {
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
.mode-selector {
  margin-bottom: 16px;
}
.top-bar {
  margin-bottom: 12px;
}
.demand-user-field {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.field-label {
  font-size: 14px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}
.work-order-bar {
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.wo-summary {
  flex: 1;
}
.material-add-row {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.bom-hint {
  margin-bottom: 12px;
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
  margin-top: 8px;
}
.selected-loc-row {
  display: flex;
  gap: 6px;
  font-size: 12px;
  line-height: 1.5;
}
.loc-code {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.loc-qty {
  text-align: right;
  white-space: nowrap;
}
.text-muted {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>