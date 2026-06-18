<!-- views/allocation/components/WorkOrderBomDialog.vue -->
<template>
  <el-dialog v-model="visible" :title="`${dialogCopy.title} - ${dialogTitleSuffix}`" width="100%" destroy-on-close>
    <div class="order-bom-dialog">
      <el-alert v-if="isPrepMode" type="warning" :closable="false" show-icon class="prep-tip">
        <template #title>备料需求说明</template>
        缺料物料也可填写备料数量并生成需求计划；缺料项将进入缺料看板，仓库到料后可通知产线领料。
      </el-alert>
      <el-alert v-else-if="isAutoWarehouseIssueMode" type="success" :closable="false" show-icon class="prep-tip">
        <template #title>自动仓 261 发料</template>
        仅允许发料仓别为 <strong>{{ effectiveAutoWarehouseCodes.join('、') }}</strong> 且有可用库存的物料；提交后直接 261 扣料，流程结束。
      </el-alert>
      <!-- 工单基本信息 -->
      <div v-if="isMultiWorkOrderMode" class="order-summary">
        <el-table :data="effectiveWorkOrders" border size="small" max-height="160">
          <el-table-column type="index" label="序号" width="56" />
          <el-table-column prop="workOrderNo" label="工单号" min-width="120" />
          <el-table-column prop="item" label="产品料号" min-width="140" show-overflow-tooltip />
          <el-table-column prop="itemDesc" label="产品描述" min-width="160" show-overflow-tooltip />
          <el-table-column label="计划数量" width="120">
            <template #default="{ row }">{{ row.plannedQty }} {{ row.unit }}</template>
          </el-table-column>
          <el-table-column prop="plannedStartDate" label="计划开工" width="110" />
          <el-table-column label="优先级" width="80" align="center">
            <template #default="{ row }"><priority-badge :priority="row.priority || 0" /></template>
          </el-table-column>
        </el-table>
        <p class="merged-prep-hint">共用料按工单序号统一推荐库位；前序工单占用后，后序工单共享扣减库存池。</p>
      </div>
      <div v-else class="order-summary">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="产品料号">
            {{ workOrder?.item }}
          </el-descriptions-item>
          <el-descriptions-item label="产品描述">
            {{ workOrder?.itemDesc }}
          </el-descriptions-item>
          <el-descriptions-item label="计划数量"> {{ workOrder?.plannedQty }} {{ workOrder?.unit }} </el-descriptions-item>
          <el-descriptions-item :label="dialogCopy.setCountLabel">
            <el-input-number
              v-model="issueSetCount"
              :min="0"
              :max="workOrder?.plannedQty || 0"
              :precision="0"
              :step="1"
              controls-position="right"
              size="small"
              class="issue-set-input"
              @change="onIssueSetCountChange"
            />
            <span class="issue-set-hint">/ {{ workOrder?.plannedQty }} {{ workOrder?.unit }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="计划开工">
            {{ workOrder?.plannedStartDate }}
          </el-descriptions-item>
          <el-descriptions-item label="计划完工">
            {{ workOrder?.plannedEndDate }}
          </el-descriptions-item>
          <el-descriptions-item label="交货日期">
            {{ workOrder?.soDeliveryDate }}
          </el-descriptions-item>
          <el-descriptions-item label="优先级">
            <priority-badge :priority="workOrder?.priority || 0" />
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- BOM物料列表 -->
      <div class="bom-list">
        <div class="bom-header">
          <div>
            <span class="header-title">BOM物料清单</span>
            <span class="header-hint">{{ dialogCopy.listHint }}</span>
          </div>
          <div class="header-toolbar">
            <span class="filter-label">件型</span>
            <el-radio-group v-model="partSizeFilter" size="small" @change="onPartSizeFilterChange">
              <el-radio-button label="">全部</el-radio-button>
              <el-radio-button label="LARGE">大件</el-radio-button>
              <el-radio-button label="SMALL">小件</el-radio-button>
            </el-radio-group>
            <span class="filter-label">过滤已发料</span>
            <el-switch v-model="hideFullyIssued" size="small" @change="onHideFullyIssuedChange" />
            <span class="selection-hint">已选 {{ selectedBomRows.length }} / 显示 {{ displayBomList.length }} 种</span>
          </div>
          <div class="header-actions">
            <el-button v-if="!isMultiWorkOrderMode" size="small" @click="applyIssueSetCount">按套数填充</el-button>
            <el-button size="small" @click="clearAllIssue">本次清零</el-button>
            <el-button size="small" @click="checkInventory">
              <el-icon><Search /></el-icon>库存检查
            </el-button>
            <el-button size="small" @click="exportBom">
              <el-icon><Download /></el-icon>导出BOM
            </el-button>
          </div>
        </div>

        <el-table ref="bomTableRef" :data="displayBomList" border stripe :max-height="400" size="small" :row-key="resolveBomTableRowKey" @selection-change="onBomSelectionChange">
          <el-table-column type="selection" width="48" reserve-selection />
          <el-table-column label="库存" width="52" align="center" fixed="left">
            <template #default="{ row }">
              <inventory-status :material="row" />
            </template>
          </el-table-column>
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column v-if="isMultiWorkOrderMode" prop="workOrderNo" label="工单号" width="118" fixed="left" />
          <el-table-column prop="componentMaterial" label="物料编码" width="120" />
          <el-table-column prop="componentDesc" label="物料描述" min-width="150" show-overflow-tooltip />
          <el-table-column label="需求数量" width="110" align="right">
            <template #default="{ row }">
              {{ formatQty(row.componentQty) }}
              <span v-if="row.inventoryUnit" class="unit">{{ row.inventoryUnit }}</span>
            </template>
          </el-table-column>
          <el-table-column label="已发料" width="100" align="right">
            <template #default="{ row }">
              {{ formatQty(row.issuedQty) }}
              <span v-if="row.inventoryUnit" class="unit">{{ row.inventoryUnit }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="dialogCopy.qtyColumnLabel" min-width="180" align="left">
            <template #default="{ row }">
              <issue-qty-dual-input
                :row="row"
                :disabled="!canEditIssueQty(row)"
                :max-issue-qty="resolveIssueQtyMax(row)"
                @change="(val: number) => onIssueQtyChange(row, val)"
                @unit-change="(altUnit: string) => onIssueUnitChange(row, altUnit)"
              />
            </template>
          </el-table-column>
          <el-table-column label="库存单位数量" width="120" align="right">
            <template #default="{ row }">
              {{ formatQty(calcIssueInventoryQty(row)) }}
              <span v-if="getRowBaseUnit(row)" class="unit">{{ getRowBaseUnit(row) }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="isAutoWarehouseIssueMode" label="自动仓可用" width="110" align="right">
            <template #default="{ row }">
              <span :class="{ 'text-muted': !(row.autoWarehouseAvailableQty > 0) }">
                {{ formatQty(row.autoWarehouseAvailableQty) }}
              </span>
              <el-tag v-if="!(row.autoWarehouseAvailableQty > 0)" type="info" size="small">不可发</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="齐套率" width="100">
            <template #default="{ row }">
              <kit-rate-indicator :material="row" />
            </template>
          </el-table-column>
          <el-table-column label="特殊库存" width="120" align="center">
            <template #default="{ row }">
              <el-popover v-if="bomRequiresSalesOrderInventory(row)" trigger="click" width="260" placement="top">
                <template #reference>
                  <el-tag type="warning" size="small" class="so-inventory-tag">E 销售订单库存</el-tag>
                </template>
                <div class="so-inventory-popover">
                  <div>销售订单：{{ row.salesOrderNo || '-' }}</div>
                  <div>项次：{{ row.salesOrderItem || '-' }}</div>
                </div>
              </el-popover>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="库存信息" width="160">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openLocationRecommend(row)">系统推荐</el-button>
              <el-button type="primary" link size="small" @click="openLocationQuery(row)">查库存</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 库存分析 -->
      <div v-if="inventoryAnalysis" class="inventory-analysis">
        <div class="analysis-header">
          <span class="header-title">库存分析</span>
          <el-tag :type="getAnalysisTagType(inventoryAnalysis.kitRate)"> 齐套率: {{ (inventoryAnalysis.kitRate * 100).toFixed(1) }}% </el-tag>
        </div>

        <el-row :gutter="20" class="analysis-stats">
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-label">物料总数</div>
              <div class="stat-value">{{ inventoryAnalysis.totalMaterials }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-label">齐套物料</div>
              <div class="stat-value text-success">
                {{ inventoryAnalysis.kittedMaterials }}
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-label">部分缺料</div>
              <div class="stat-value text-warning">
                {{ inventoryAnalysis.partialMaterials }}
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-label">完全缺料</div>
              <div class="stat-value text-danger">
                {{ inventoryAnalysis.shortageMaterials }}
              </div>
            </div>
          </el-col>
        </el-row>

        <!-- 缺料明细 -->
        <div v-if="shortageMaterials.length > 0" class="shortage-detail">
          <div class="detail-title">缺料明细</div>
          <el-table :data="shortageMaterials" border size="small">
            <el-table-column v-if="isMultiWorkOrderMode" prop="workOrderNo" label="工单号" width="118" />
            <el-table-column prop="componentMaterial" label="物料编码" min-width="110" />
            <el-table-column prop="componentDesc" label="物料描述" min-width="140" show-overflow-tooltip />
            <el-table-column label="库存类型" width="100" align="center">
              <template #default="{ row }">
                <dict-tag :options="wms_inventory_special_flag" :value="row.specialInventoryFlag" />
              </template>
            </el-table-column>
            <el-table-column label="需求数量" min-width="110" align="right">
              <template #default="{ row }">{{ formatQtyWithUnit(row.requiredQty, row.inventoryUnit) }}</template>
            </el-table-column>
            <el-table-column label="可用库存" min-width="110" align="right">
              <template #default="{ row }">{{ formatQtyWithUnit(row.availableQty, row.inventoryUnit) }}</template>
            </el-table-column>
            <el-table-column label="缺料数量" min-width="110" align="right">
              <template #default="{ row }">
                <span class="text-danger">{{ formatQtyWithUnit(row.issueShortageQty, row.issueUnit) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="bom-dialog-footer">
        <span v-if="totalIssueQty >= 0" class="footer-summary">{{ dialogCopy.footerSummary }} {{ totalIssueQty }} 种物料</span>
        <div class="dialog-footer">
          <el-button v-if="!isPrepMode" @click="handleClose">关闭</el-button>
          <el-button type="success" :disabled="!workOrder?.workOrderNo" @click="saveMaterialIssues">{{ dialogCopy.saveBtn }}</el-button>
          <el-button v-if="!isPrepMode" type="primary" :disabled="!workOrder?.workOrderNo || totalIssueQty <= 0" @click="openAllocationPreview"> 分配预览 </el-button>
        </div>
      </div>
    </template>
  </el-dialog>

  <!-- 批次详情对话框 -->
  <batch-detail-dialog v-model="showBatchDialog" :material="selectedMaterial" :work-order-no="workOrder?.workOrderNo" />

  <!-- 库位详情对话框 -->
  <location-detail-dialog
    v-model="showLocationDialog"
    :material="selectedMaterial"
    :work-order-no="workOrder?.workOrderNo"
    :mode="locationDialogMode"
    :peer-reserved-inventory-qty="locationPeerReservedQty"
    :peer-location-picks="locationPeerPicks"
    :base-location-rows="locationDialogMode === 'recommend' ? locationBaseRows : undefined"
    :allow-shortage-confirm="isPrepMode"
    @confirm="onLocationConfirm"
  />

  <allocation-preview-dialog v-model="showPreviewDialog" :work-order-no="workOrder?.workOrderNo" :material-issue-items="previewMaterialIssueItems" />
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, getCurrentInstance, toRefs } from 'vue';
import type { TableInstance } from 'element-plus';
import { ElMessage } from 'element-plus';
import { Search, Download } from '@element-plus/icons-vue';

import type { WorkOrderVO, WorkOrderBomVO, WorkOrderMaterialIssueLine, MaterialLocationRow } from '@/api/wms/allocation/types';
import WorkOrderApi from '@/api/wms/allocation/index';
import InventoryApi from '@/api/wms/allocation/index';
import {
  applyIssueUnitSelection,
  bomRowsToIssueLines,
  bomRowsToIssueLinesByWorkOrder,
  buildSavedIssueLineMatcher,
  calcIssueQtyBySet,
  calcDefaultIssueQty,
  calcDefaultPrepIssueQty,
  calcMaxIssueQty,
  calcPrepMaxIssueQty,
  clampIssueQty,
  buildInventoryCheckLineResultIndex,
  refreshBomRowRecommendations,
  resolveInventoryCheckLineResultForBom,
  collectPeerLocationPicks,
  getBomRowKey,
  getOrderRequiredQty,
  getPeerReservedInventoryQty,
  initBomIssueRow,
  initBomPrepIssueRow,
  needsIssue,
  issueQtyToInventoryQty,
  inventoryQtyToIssueQty,
  normalizePartSizeType,
  buildInventoryAnalysisFromRows,
  refreshBomMaterialPoolMetrics,
  resolveBomBaseUnit,
  resolveBomIssueConversionRatio,
  resolveRowAvailableQty,
  parseAutoWarehousesFromCheckData,
  parseInventoryCheckPayload,
  normalizeCheckInventoryLocationRows,
  normalizeMaterialInventoryResponse,
  sumAllocatablePoolQty,
  bomRequiresSalesOrderInventory,
  resolveDemandRowInventoryFlag,
  resolveShortageInventoryType,
  enrichLocationRowsWithSalesOrderDefaults,
  sumSalesOrderAllocatablePoolQty
} from '@/api/wms/allocation/index';
import PriorityBadge from './PriorityBadge.vue';
import InventoryStatus from './InventoryStatus.vue';
import IssueQtyDualInput from './IssueQtyDualInput.vue';
import KitRateIndicator from './KitRateIndicator.vue';
import BatchDetailDialog from './BatchDetailDialog.vue';
import LocationDetailDialog, { type LocationDialogMode } from './LocationDetailDialog.vue';
import AllocationPreviewDialog from './AllocationPreviewDialog.vue';

export type BomDialogMode = 'issue' | 'prep';

interface Props {
  modelValue: boolean;
  workOrder: WorkOrderVO | null;
  /** 合并备料：按序号排列的多个工单 */
  workOrders?: WorkOrderVO[];
  /** 已保存的部分发料/备料数量 */
  materialIssues?: WorkOrderMaterialIssueLine[];
  /** 合并备料：各工单已保存的备料行 */
  materialIssuesByWorkOrder?: Record<string, WorkOrderMaterialIssueLine[]>;
  /** issue=261领料扣料；prep=平面仓备料需求计划 */
  mode?: BomDialogMode;
  /** 自动仓发料：限定可发料的仓别编码（如 A001） */
  restrictWarehouseCodes?: string[];
  /** 需求人工号（库存检查 /allocation/checkInventory） */
  demandUserNo?: string;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'issue',
  workOrders: undefined,
  materialIssuesByWorkOrder: undefined,
  restrictWarehouseCodes: undefined,
  demandUserNo: undefined
});

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_inventory_special_flag } = toRefs<any>(proxy?.useDict('wms_inventory_special_flag'));

const isMultiWorkOrderMode = computed(() => (props.workOrders?.length ?? 0) > 1);

const effectiveWorkOrders = computed(() => {
  if (props.workOrders?.length) return props.workOrders;
  return props.workOrder ? [props.workOrder] : [];
});

const dialogTitleSuffix = computed(() => {
  const orders = effectiveWorkOrders.value;
  if (!orders.length) return '-';
  if (orders.length === 1) return orders[0].workOrderNo;
  return `${orders.length}个工单（${orders.map((o) => o.workOrderNo).join('、')}）`;
});

const resolveSavedIssuesForOrder = (workOrderNo: string) => {
  const fromMap = props.materialIssuesByWorkOrder?.[workOrderNo];
  if (fromMap?.length) return fromMap;
  if (props.workOrder?.workOrderNo === workOrderNo) return props.materialIssues;
  return undefined;
};

/** 是否为备料模式（prep），否则为领料模式（issue） */
const isPrepMode = computed(() => props.mode === 'prep');
const apiAutoWarehouseCodes = ref<string[]>([]);
/** 生效的自动仓编码列表（优先取库存接口返回，否则用 props 限制） */
const effectiveAutoWarehouseCodes = computed(() => (apiAutoWarehouseCodes.value.length ? apiAutoWarehouseCodes.value : props.restrictWarehouseCodes || []));
/** 是否为自动仓 261 领料模式 */
const isAutoWarehouseIssueMode = computed(() => !isPrepMode.value && effectiveAutoWarehouseCodes.value.length > 0);
/** 自动仓编码集合（大写），用于库位仓别判断 */
const autoWarehouseCodeSet = computed(() => new Set(effectiveAutoWarehouseCodes.value.map((c) => String(c).trim().toUpperCase()).filter(Boolean)));

/** 弹框文案：备料与领料模式下的标题、列名、提示语 */
const dialogCopy = computed(() =>
  isPrepMode.value
    ? {
        title: '工单备料需求',
        setCountLabel: '备料套数',
        listHint: '填写或预填本次备料>0 后自动勾选；保存时仅纳入已勾选行。',
        qtyColumnLabel: '本次备料',
        footerSummary: '本次备料',
        saveBtn: '保存备料需求',
        selectWarning: '请勾选需要备料的物料',
        qtyWarning: '请为已勾选物料填写本次备料数量',
        setCountWarning: '暂无可备料物料（待发数量为 0）',
        saveSuccess: '备料需求已保存'
      }
    : {
        title: '工单261领料',
        setCountLabel: '发料套数',
        listHint: '发料套数默认等于工单计划数量，可按套调整；也可单独修改各物料「本次发料」',
        qtyColumnLabel: '本次发料',
        footerSummary: '本次发料',
        saveBtn: '保存发料数量',
        selectWarning: '请勾选需要发料的物料',
        qtyWarning: '请为已勾选物料填写本次发料数量',
        setCountWarning: '暂无可发料物料（待发数量为 0）',
        saveSuccess: '发料数量已保存'
      }
);

const emit = defineEmits<{
  'update:modelValue': [boolean];
  save: [
    {
      workOrderNo?: string;
      materialIssues?: WorkOrderMaterialIssueLine[];
      batch?: Array<{ workOrderNo: string; materialIssues: WorkOrderMaterialIssueLine[] }>;
    }
  ];
}>();

const visible = ref(false);
const showBatchDialog = ref(false);
const showLocationDialog = ref(false);
const locationDialogMode = ref<LocationDialogMode>('recommend');
const showMaterialDialog = ref(false);
const showPreviewDialog = ref(false);
const bomTableRef = ref<TableInstance>();
const selectedBomRows = ref<WorkOrderBomVO[]>([]);
/** 同步表格勾选时跳过 selection-change 副作用（避免 clearSelection 把本次备料清零） */
const syncingBomSelection = ref(false);
/** 发料套数，默认等于工单计划数量 */
const issueSetCount = ref(0);
/** 件型筛选：空=全部 */
const partSizeFilter = ref<'' | 'LARGE' | 'SMALL'>('');
/** 开启时隐藏待发数量为 0 的物料（已发完） */
const hideFullyIssued = ref(true);

// BOM列表
const bomList = ref<WorkOrderBomVO[]>([]);
const materialLocationCache = ref(new Map<string, MaterialLocationRow[]>());
const checkInventoryLocationCache = ref(new Map<string, MaterialLocationRow[]>());
// 库存分析
const inventoryAnalysis = ref<any>(null);
// 选中的物料
const selectedMaterial = ref<WorkOrderBomVO | null>(null);

/** 当前已勾选 BOM 行的行键集合 */
const selectedBomRowKeys = computed(() => new Set(selectedBomRows.value.map((r) => resolveBomTableRowKey(r))));

/** 解析 BOM 表格行唯一键（优先预留单号+项次，BOM 同步后 bomLineId 会变） */
const resolveBomTableRowKey = (row: WorkOrderBomVO) => {
  const index = bomList.value.findIndex((r, i) => r === row || getBomRowKey(r, i) === getBomRowKey(row));
  return getBomRowKey(row, index >= 0 ? index : undefined);
};

/** 按行键在 BOM 列表中查找对应物料行 */
const findBomRowByKey = (rowKey: string) => {
  return bomList.value.find((row, index) => getBomRowKey(row, index) === rowKey);
};

/** 刷新物料池可用量、齐套率等派生指标（刷新后按 rowKey 恢复勾选） */
const applyMaterialPoolMetrics = (options?: { ensureKeys?: string[]; dropKeys?: string[] }) => {
  const preserveKeys = new Set(selectedBomRowKeys.value);
  options?.ensureKeys?.forEach((k) => preserveKeys.add(k));
  options?.dropKeys?.forEach((k) => preserveKeys.delete(k));
  bomList.value = refreshBomMaterialPoolMetrics(bomList.value);
  void refreshAllFifoRecommendations().then(() => {
    inventoryAnalysis.value = buildInventoryAnalysisFromRows(bomList.value);
    if (preserveKeys.size > 0) {
      void resyncTableSelectionByKeys(preserveKeys);
    }
  });
};

const refreshAllFifoRecommendations = async () => {
  const needsFetch = bomList.value.filter((row) => Number(row.issueQty ?? 0) > 0 && !row.checkInventoryRecommendedLocations?.length);
  const materialCodes = [...new Set(needsFetch.map((row) => row.componentMaterial))];
  await Promise.all(materialCodes.map((code) => ensureMaterialLocations(code)));
  bomList.value = refreshBomRowRecommendations(bomList.value, materialLocationCache.value);
};

const clearMaterialLocationCache = () => {
  materialLocationCache.value.clear();
};

const ensureMaterialLocations = async (materialCode: string): Promise<MaterialLocationRow[]> => {
  const cached = materialLocationCache.value.get(materialCode);
  if (cached) return cached;
  const response = await InventoryApi.getMaterialLocations(materialCode);
  if (response.code !== 200) return [];
  const rows = normalizeMaterialInventoryResponse(response.data);
  materialLocationCache.value.set(materialCode, rows);
  return rows;
};

/** 同工单同物料备料数量变更时，清除已失效的手工库位 */
const clearSameMaterialManualLocations = (materialCode: string, workOrderNo?: string) => {
  bomList.value.forEach((row) => {
    if (row.componentMaterial !== materialCode) return;
    if (workOrderNo && row.workOrderNo !== workOrderNo) return;
    row.manualLocationSelections = undefined;
    row.locationOverrideReason = undefined;
  });
};

/** 按 rowKey 恢复表格勾选（metrics/FIFO 刷新后行对象会替换） */
const resyncTableSelectionByKeys = async (keys: Set<string>) => {
  await nextTick();
  const table = bomTableRef.value;
  if (!table) return;
  syncingBomSelection.value = true;
  try {
    table.clearSelection();
    const rows: WorkOrderBomVO[] = [];
    keys.forEach((key) => {
      const row = findBomRowByKey(key);
      if (row && Number(row.issueQty ?? 0) > 0) {
        table.toggleRowSelection(row, true);
        rows.push(row);
      }
    });
    selectedBomRows.value = rows;
  } finally {
    await nextTick();
    syncingBomSelection.value = false;
  }
};

/** 当前库位弹窗对应行在 bomList 中的索引 */
const selectedMaterialIndex = () => {
  const row = selectedMaterial.value;
  if (!row) return -1;
  const key = resolveBomTableRowKey(row);
  return bomList.value.findIndex((r, i) => resolveBomTableRowKey(r) === key);
};

/** 同物料前序 BOM 行已预留的库存量（用于库位推荐扣减） */
const locationPeerReservedQty = computed(() => {
  const index = selectedMaterialIndex();
  return index >= 0 ? getPeerReservedInventoryQty(bomList.value, index) : 0;
});

/** 同物料前序 BOM 行已占用的库位明细（与列表 FIFO 共用按库位扣减） */
const locationPeerPicks = computed(() => {
  const index = selectedMaterialIndex();
  return index >= 0 ? collectPeerLocationPicks(bomList.value, index) : [];
});

/** 与 BOM 列表共用的本行 checkInventory 推荐库位（按 BOM 行，非物料级） */
const locationBaseRows = computed(() => {
  const row = selectedMaterial.value;
  if (!row) return undefined;
  if (row.checkInventoryRecommendedLocations?.length) {
    return row.checkInventoryRecommendedLocations;
  }
  const index = selectedMaterialIndex();
  const rowKey = getBomRowKey(row, index >= 0 ? index : undefined);
  return checkInventoryLocationCache.value.get(rowKey) ?? materialLocationCache.value.get(row.componentMaterial);
});

/** 按件型、是否过滤已发料筛选后的 BOM 展示列表 */
const displayBomList = computed(() => {
  let list = bomList.value;
  if (partSizeFilter.value) {
    list = list.filter((row) => row.partSizeType === partSizeFilter.value);
  }
  if (hideFullyIssued.value) {
    list = list.filter((row) => needsIssue(row));
  }
  return list;
});

/** 当前表格展示行中，指定工单的去重物料编码（库存检查仅查这些） */
const getDisplayedMaterialCodesForOrder = (workOrderNo: string) => [...new Set(displayBomList.value.filter((bom) => bom.workOrderNo === workOrderNo).map((bom) => bom.componentMaterial))];

/** 仅当本次发料/备料数量 > 0 时可勾选（备料）；领料则按可发料行判断 */
const isRowSelectable = (row: WorkOrderBomVO) => {
  if (isPrepMode.value) {
    return Number(row.issueQty ?? 0) > 0;
  }
  return isIssueRowEligible(row);
};

/** 领料模式：待发>0 且（自动仓时须有可用库存） */
const isIssueRowEligible = (row: WorkOrderBomVO) => {
  if (!needsIssue(row)) return false;
  if (isAutoWarehouseIssueMode.value) {
    return Number(row.autoWarehouseAvailableQty ?? 0) > 0;
  }
  return true;
};

/** 件型筛选变更后清理无效勾选 */
const onPartSizeFilterChange = () => {
  nextTick(() => purgeInvalidSelection());
};

/** 过滤已发料开关变更后清理无效勾选 */
const onHideFullyIssuedChange = () => {
  nextTick(() => purgeInvalidSelection());
};

/** 判断 BOM 行是否已勾选 */
const isRowSelected = (row: WorkOrderBomVO) => selectedBomRowKeys.value.has(resolveBomTableRowKey(row));

/** 备料：有待发需求即可编辑（含缺料）；领料：须先勾选且满足发料条件 */
const canEditIssueQty = (row: WorkOrderBomVO) => {
  if (isPrepMode.value) {
    return needsIssue(row);
  }
  return isRowSelected(row) && isIssueRowEligible(row);
};

/** 备料模式下单行本次备料上限（不受库存限制） */
const calcPrepMaxForRow = (row: WorkOrderBomVO) => calcPrepMaxIssueQty(row, issueSetCount.value, props.workOrder?.plannedQty ?? 0);

/** 发料/备料数量钳制上限 */
const resolveIssueQtyMax = (row: WorkOrderBomVO) => (isPrepMode.value ? calcPrepMaxForRow(row) : calcMaxIssueQty(row));

/** 按当前发料/备料套数计算单行应发数量 */
const getLineIssueQtyBySet = (row: WorkOrderBomVO) => {
  const plannedQty = Number(props.workOrder?.plannedQty ?? 0);
  if (plannedQty <= 0) return 0;
  const setCount = Number(issueSetCount.value) > 0 ? Number(issueSetCount.value) : plannedQty;
  return calcIssueQtyBySet(row, setCount, plannedQty);
};

/** 将套数换算结果写入单行本次发料/备料数量 */
const applyIssueQtyBySet = (row: WorkOrderBomVO) => {
  if (!isPrepMode.value && !needsIssue(row)) {
    row.issueQty = 0;
    return;
  }
  row.issueQty = clampIssueQty(getLineIssueQtyBySet(row), resolveIssueQtyMax(row));
};

/** 备料模式：按待发数量预填本次备料（库存单位，需求数量-已发料数量） */
const applyPrepDefaultIssueQtyAll = () => {
  if (!isPrepMode.value) return;
  effectiveWorkOrders.value.forEach((order) => {
    const matchSaved = buildSavedIssueLineMatcher(resolveSavedIssuesForOrder(order.workOrderNo));
    bomList.value.forEach((row) => {
      if (row.workOrderNo !== order.workOrderNo) return;
      const saved = matchSaved(row);
      const hasSavedQty = saved?.issueQty != null && saved.issueQty > 0;
      if (!hasSavedQty && needsIssue(row)) {
        row.issueQty = clampIssueQty(calcDefaultPrepIssueQty(row), resolveIssueQtyMax(row));
      }
    });
  });
};

/** 发料/备料套数变更时批量重算已选或可发行数量 */
const onIssueSetCountChange = () => {
  if (!props.workOrder) return;
  const targets = resolveSetCountTargets();
  if (!targets.length) return;
  targets.forEach((row) => applyIssueQtyBySet(row));
  applyMaterialPoolMetrics({
    ensureKeys: targets.filter((r) => Number(r.issueQty) > 0).map((r) => resolveBomTableRowKey(r))
  });
};

/** 按套数填充的作用范围：有勾选时仅已勾选行，否则作用于全部 BOM 行 */
const resolveSetCountTargets = () => {
  if (selectedBomRows.value.length > 0) return [...selectedBomRows.value];
  return [...bomList.value];
};

/** 已勾选且数量大于 0 的物料行数 */
const totalIssueQty = computed(() => bomList.value.filter((row) => isRowSelected(row) && Number(row.issueQty) > 0).length);

/** 构建分配预览所需的发料明细（仅含已勾选且有数量的行） */
const previewMaterialIssueItems = computed(() => {
  if (!props.workOrder?.workOrderNo) return undefined;
  const lines = bomRowsToIssueLines(bomList.value, selectedBomRowKeys.value);
  if (lines.length === 0) return undefined;
  return lines.map((l) => ({
    workOrderNo: props.workOrder!.workOrderNo,
    materialCode: l.materialCode,
    issueQty: l.issueQty
  }));
});

/** 汇总当前范围内需求大于可用库存的缺料明细 */
const shortageMaterials = computed(() => {
  const scope = isPrepMode.value ? selectedBomRows.value : selectedBomRows.value.length > 0 ? selectedBomRows.value : bomList.value;
  return scope
    .filter((material) => {
      const req = getOrderRequiredQty(material);
      return req > 0 && material.availableQty !== undefined;
    })
    .map((material) => {
      const requiredQty = Number(material.componentQty ?? 0);
      const availableQty = resolveRowAvailableQty(material) ?? 0;
      const checkRequiredQty = getOrderRequiredQty(material);
      const shortageQty = Math.max(0, checkRequiredQty - availableQty);
      const inventoryUnit = getRowBaseUnit(material);
      const issueUnit = String(material.unit ?? '').trim();
      const ratio = resolveBomIssueConversionRatio(material, issueUnit);
      const issueShortageQty = inventoryQtyToIssueQty(shortageQty, ratio);
      return {
        workOrderNo: material.workOrderNo,
        componentMaterial: material.componentMaterial,
        componentDesc: material.componentDesc,
        requiredQty,
        availableQty,
        shortageQty,
        issueShortageQty,
        inventoryUnit,
        issueUnit,
        specialInventoryFlag: resolveDemandRowInventoryFlag({
          specialInventoryFlag: material.specialInventoryFlag,
          shortageInventoryType: resolveShortageInventoryType({
            salesOrderNo: material.salesOrderNo,
            salesOrderItem: material.salesOrderItem,
            specialInventoryFlag: material.specialInventoryFlag
          })
        })
      };
    })
    .filter((m) => m.shortageQty > 0);
});

/** 格式化数量显示（无效值归零） */
const formatQty = (val?: number) => {
  const n = Number(val ?? 0);
  return Number.isNaN(n) ? '0' : n;
};

const formatQtyWithUnit = (qty?: number, unit?: string) => {
  const u = String(unit ?? '').trim();
  const n = formatQty(qty);
  return u ? `${n} ${u}` : n;
};

/** 解析 BOM 行库存计量单位 */
const getRowBaseUnit = (row: WorkOrderBomVO) => resolveBomBaseUnit(row) || row.inventoryUnit || row.unit || '';

/** 将本次发料/备料数量换算为库存单位数量 */
const calcIssueInventoryQty = (row: WorkOrderBomVO) => issueQtyToInventoryQty(Number(row.issueQty ?? 0), row.conversionRatio);

/** 本次发料/备料数量变更：>0 自动勾选，=0 取消勾选 */
const onIssueQtyChange = (row: WorkOrderBomVO, val?: number) => {
  if (!canEditIssueQty(row)) {
    row.issueQty = 0;
    return;
  }
  const rowKey = resolveBomTableRowKey(row);
  const qty = clampIssueQty(val ?? 0, resolveIssueQtyMax(row));
  row.issueQty = qty;
  clearSameMaterialManualLocations(row.componentMaterial, row.workOrderNo);
  applyMaterialPoolMetrics({
    ensureKeys: qty > 0 ? [rowKey] : undefined,
    dropKeys: qty <= 0 ? [rowKey] : undefined
  });
};

/** 切换发料/备料计量单位并回写换算比例 */
const onIssueUnitChange = (row: WorkOrderBomVO, altUnit: string) => {
  if (!altUnit || !canEditIssueQty(row)) return;
  const updated = applyIssueUnitSelection(row, altUnit);
  row.unit = updated.unit;
  row.inventoryUnit = updated.inventoryUnit;
  row.conversionRatio = updated.conversionRatio;
  row.issueUnitConversionId = updated.issueUnitConversionId;
  row.issueQty = updated.issueQty;
  clearSameMaterialManualLocations(row.componentMaterial, row.workOrderNo);
  if (Number(updated.issueQty) > 0) {
    const rowKey = resolveBomTableRowKey(row);
    applyMaterialPoolMetrics({ ensureKeys: [rowKey] });
  } else {
    applyMaterialPoolMetrics({ dropKeys: [resolveBomTableRowKey(row)] });
  }
};

/** 表格勾选变化：同步已选行；数量=0 不允许保持勾选 */
const onBomSelectionChange = (rows: WorkOrderBomVO[]) => {
  if (syncingBomSelection.value) return;

  const invalid = rows.filter((row) => !isRowSelectable(row));
  if (invalid.length) {
    nextTick(() => {
      invalid.forEach((row) => bomTableRef.value?.toggleRowSelection(row, false));
    });
  }

  const selected = rows.filter(isRowSelectable);
  selectedBomRows.value = selected;

  if (!isPrepMode.value) {
    const selectedKeys = new Set(selected.map((r) => resolveBomTableRowKey(r)));
    bomList.value.forEach((row) => {
      if (!selectedKeys.has(resolveBomTableRowKey(row))) {
        row.issueQty = 0;
      } else if (Number(row.issueQty ?? 0) === 0) {
        applyIssueQtyBySet(row);
      }
    });
    applyMaterialPoolMetrics();
  }
};

/** 清除本次数量为 0 的无效表格勾选 */
const purgeInvalidSelection = () => {
  const table = bomTableRef.value;
  bomList.value.forEach((row) => {
    if (!isRowSelectable(row)) {
      table?.toggleRowSelection(row, false);
    }
  });
  selectedBomRows.value = selectedBomRows.value.filter(isRowSelectable);
};

/** 从已保存备料/发料行收集表格 rowKey（用于恢复勾选） */
const buildSavedSelectionKeys = (): Set<string> => {
  const keys = new Set<string>();
  let hasSaved = false;
  effectiveWorkOrders.value.forEach((order) => {
    const issues = resolveSavedIssuesForOrder(order.workOrderNo);
    if (!issues?.length) return;
    hasSaved = true;
    const matchSaved = buildSavedIssueLineMatcher(issues);
    bomList.value.forEach((row) => {
      if (row.workOrderNo !== order.workOrderNo) return;
      const saved = matchSaved(row);
      if (saved && saved.issueQty > 0) {
        keys.add(resolveBomTableRowKey(row));
      }
    });
  });
  if (!hasSaved && props.materialIssues?.length) {
    const matchSaved = buildSavedIssueLineMatcher([...props.materialIssues]);
    bomList.value.forEach((row) => {
      const saved = matchSaved(row);
      if (saved && saved.issueQty > 0) {
        keys.add(resolveBomTableRowKey(row));
      }
    });
  }
  return keys;
};

/** 根据已保存发料/备料记录恢复表格勾选与数量 */
const syncBomTableSelection = async () => {
  await nextTick();
  const table = bomTableRef.value;
  if (!table) return;

  let toSelect: WorkOrderBomVO[] = [];
  let restoredFromSaved = false;
  effectiveWorkOrders.value.forEach((order) => {
    const issues = resolveSavedIssuesForOrder(order.workOrderNo);
    if (!issues?.length) return;
    restoredFromSaved = true;
    const matchSaved = buildSavedIssueLineMatcher(issues);
    bomList.value.forEach((row) => {
      if (row.workOrderNo !== order.workOrderNo) return;
      const saved = matchSaved(row);
      if (saved && saved.issueQty > 0) {
        row.issueQty = clampIssueQty(saved.issueQty, resolveIssueQtyMax(row));
        row.manualLocationSelections = saved.manualLocationSelections;
        row.fifoRecommendedLocations = saved.fifoRecommendedLocations;
        row.otherLineWarehouseLocations = saved.otherLineWarehouseLocations;
        row.locationOverrideReason = saved.locationOverrideReason;
        if (saved.issueUnit) {
          const updated = applyIssueUnitSelection(row, saved.issueUnit);
          row.unit = updated.unit;
          row.inventoryUnit = updated.inventoryUnit;
          row.conversionRatio = updated.conversionRatio;
          row.issueUnitConversionId = updated.issueUnitConversionId;
          row.issueQty = clampIssueQty(saved.issueQty, resolveIssueQtyMax(row));
        }
        toSelect.push(row);
      }
    });
  });
  if (!restoredFromSaved && props.materialIssues?.length) {
    const matchSaved = buildSavedIssueLineMatcher([...props.materialIssues]);
    bomList.value.forEach((row) => {
      const saved = matchSaved(row);
      if (saved && saved.issueQty > 0) {
        row.issueQty = clampIssueQty(saved.issueQty, resolveIssueQtyMax(row));
        row.manualLocationSelections = saved.manualLocationSelections;
        row.fifoRecommendedLocations = saved.fifoRecommendedLocations;
        row.otherLineWarehouseLocations = saved.otherLineWarehouseLocations;
        row.locationOverrideReason = saved.locationOverrideReason;
        toSelect.push(row);
      }
    });
    restoredFromSaved = toSelect.length > 0;
  }
  if (!restoredFromSaved) {
    toSelect = isPrepMode.value ? bomList.value.filter(isRowSelectable) : [];
  }

  const selectKeys = new Set(toSelect.map((r) => resolveBomTableRowKey(r)));
  await resyncTableSelectionByKeys(selectKeys);
};

/** 按当前套数批量填充已选或可发行发料/备料数量 */
const applyIssueSetCount = () => {
  if (!props.workOrder?.plannedQty) {
    ElMessage.warning('工单计划数量无效');
    return;
  }
  const targets = resolveSetCountTargets();
  if (targets.length === 0) {
    ElMessage.warning(isPrepMode.value ? dialogCopy.value.selectWarning : dialogCopy.value.setCountWarning);
    return;
  }
  targets.forEach((row) => applyIssueQtyBySet(row));
  applyMaterialPoolMetrics({
    ensureKeys: targets.filter((r) => Number(r.issueQty) > 0).map((r) => resolveBomTableRowKey(r))
  });
};

/** 将已选或全部行的本次发料/备料数量清零 */
const clearAllIssue = () => {
  const targets = isPrepMode.value ? selectedBomRows.value : selectedBomRows.value.length > 0 ? selectedBomRows.value : bomList.value;
  targets.forEach((row) => {
    row.issueQty = 0;
  });
  applyMaterialPoolMetrics();
  nextTick(() => purgeInvalidSelection());
};

/** 校验并保存本次发料/备料明细到父组件 */
const saveMaterialIssues = () => {
  if (!effectiveWorkOrders.value.length) return;
  if (selectedBomRows.value.length === 0) {
    ElMessage.warning(dialogCopy.value.selectWarning);
    return;
  }
  if (isMultiWorkOrderMode.value) {
    const byWo = bomRowsToIssueLinesByWorkOrder(bomList.value, selectedBomRowKeys.value);
    const batch = Object.entries(byWo).map(([workOrderNo, materialIssues]) => ({ workOrderNo, materialIssues }));
    if (!batch.length) {
      ElMessage.warning(dialogCopy.value.qtyWarning);
      return;
    }
    emit('save', { batch });
    ElMessage.success(dialogCopy.value.saveSuccess);
    if (isPrepMode.value) visible.value = false;
    return;
  }
  const workOrderNo = effectiveWorkOrders.value[0].workOrderNo;
  const materialIssues = bomRowsToIssueLines(bomList.value, selectedBomRowKeys.value);
  if (materialIssues.length === 0) {
    ElMessage.warning(dialogCopy.value.qtyWarning);
    return;
  }
  emit('save', { workOrderNo, materialIssues });
  ElMessage.success(dialogCopy.value.saveSuccess);
  if (isPrepMode.value) visible.value = false;
};

// 监听props变化
watch(
  () => props.modelValue,
  async (val) => {
    visible.value = val;
    if (val && effectiveWorkOrders.value.length) {
      clearMaterialLocationCache();
      checkInventoryLocationCache.value.clear();
      apiAutoWarehouseCodes.value = [];
      issueSetCount.value = props.workOrder?.plannedQty || effectiveWorkOrders.value[0]?.plannedQty || 0;
      partSizeFilter.value = '';
      hideFullyIssued.value = true;
      selectedBomRows.value = [];
      await loadBomData();
    }
  }
);

// 监听visible变化
watch(visible, (val) => {
  emit('update:modelValue', val);
});

const mapBomApiRow = (bom: WorkOrderBomVO, workOrderNo: string, order: WorkOrderVO, matchSaved: ReturnType<typeof buildSavedIssueLineMatcher>): WorkOrderBomVO => {
  const saved = matchSaved(bom);
  const hasSavedQty = saved?.issueQty != null && saved.issueQty > 0;
  const row = isPrepMode.value
    ? initBomPrepIssueRow(bom, hasSavedQty ? saved!.issueQty : undefined, saved?.issueUnit)
    : initBomIssueRow(bom, hasSavedQty ? saved!.issueQty : undefined, saved?.issueUnit);
  const withUnit = saved?.issueUnit ? applyIssueUnitSelection(row, saved.issueUnit) : row;
  if (hasSavedQty) {
    withUnit.issueQty = clampIssueQty(saved!.issueQty, resolveIssueQtyMax(withUnit));
  }
  const salesOrderNo = String(bom.salesOrderNo ?? order.salesOrderNo ?? '').trim() || undefined;
  const salesOrderItem = String(bom.salesOrderItem ?? order.salesOrderItem ?? '').trim() || undefined;
  return {
    ...withUnit,
    workOrderNo,
    salesOrderNo,
    salesOrderItem,
    specialInventoryFlag: bom.specialInventoryFlag,
    partSizeType: normalizePartSizeType(bom as unknown as Record<string, unknown>),
    manualLocationSelections: saved?.manualLocationSelections,
    fifoRecommendedLocations: saved?.fifoRecommendedLocations,
    otherLineWarehouseLocations: saved?.otherLineWarehouseLocations,
    locationOverrideReason: saved?.locationOverrideReason
  };
};

/** 加载工单 BOM 清单、恢复已保存数量并执行库存检查 */
const loadBomData = async () => {
  const orders = effectiveWorkOrders.value;
  if (!orders.length) return;

  try {
    const allRows: WorkOrderBomVO[] = [];
    for (const order of orders) {
      const matchSaved = buildSavedIssueLineMatcher(resolveSavedIssuesForOrder(order.workOrderNo));
      const bomResponse = await WorkOrderApi.getWorkOrderBom(order.workOrderNo);
      if (bomResponse.code === 200) {
        allRows.push(...bomResponse.data.map((bom: WorkOrderBomVO) => mapBomApiRow(bom, order.workOrderNo, order, matchSaved)));
      }
    }
    bomList.value = allRows;

    const savedSelectKeys = buildSavedSelectionKeys();
    await checkInventory(savedSelectKeys);

    if (isPrepMode.value) {
      applyPrepDefaultIssueQtyAll();
    }
    await syncBomTableSelection();
  } catch (error) {
    ElMessage.error('加载BOM数据失败');
    console.error(error);
  }
};

/** 汇总指定库位列表中自动仓别可用数量 */
const sumAutoWarehouseQty = (locations?: Array<{ warehouseCode?: string; availableQty?: number; recommendedQty?: number }>) => {
  if (!locations?.length) return 0;
  const codes = autoWarehouseCodeSet.value;
  return locations
    .filter((loc) =>
      codes.has(
        String(loc.warehouseCode || '')
          .trim()
          .toUpperCase()
      )
    )
    .reduce((sum, loc) => sum + Number(loc.availableQty ?? loc.recommendedQty ?? 0), 0);
};

const applyCheckPayloadToRows = (
  checkPayload: ReturnType<typeof parseInventoryCheckPayload>,
  targetWorkOrderNo: string,
  nextCheckCache: Map<string, MaterialLocationRow[]>,
  checkedMaterialCodes?: Set<string>
) => {
  const inventoryMap = new Map<string, Record<string, unknown>>();
  checkPayload?.materials?.forEach((mat: Record<string, unknown>) => {
    const code = String(mat.materialCode || '').trim();
    if (code) inventoryMap.set(code, mat);
  });

  const lineResultIndex = buildInventoryCheckLineResultIndex(checkPayload?.lineResults);
  const materialLineUseIndex = new Map<string, number>();

  bomList.value = bomList.value.map((bom, bomIndex) => {
    if (bom.workOrderNo !== targetWorkOrderNo) return bom;
    if (checkedMaterialCodes && !checkedMaterialCodes.has(bom.componentMaterial)) return bom;

    const lineResult = resolveInventoryCheckLineResultForBom(bom, bomIndex, lineResultIndex, materialLineUseIndex);
    const inventory = inventoryMap.get(bom.componentMaterial);
    const partSizeType = bom.partSizeType ?? (inventory ? normalizePartSizeType(inventory) : undefined);

    let checkInventoryRecommendedLocations: MaterialLocationRow[] | undefined;
    if (lineResult?.recommendedLocations?.length) {
      let rows = normalizeCheckInventoryLocationRows(lineResult.recommendedLocations);
      if (bomRequiresSalesOrderInventory(bom)) {
        rows = enrichLocationRowsWithSalesOrderDefaults(rows, bom);
      }
      checkInventoryRecommendedLocations = rows;
      nextCheckCache.set(getBomRowKey(bom, bomIndex), rows);
    } else {
      checkInventoryRecommendedLocations = undefined;
    }

    const checkRows = checkInventoryRecommendedLocations;
    const poolQty = isAutoWarehouseIssueMode.value
      ? sumAutoWarehouseQty(lineResult?.recommendedLocations as Array<{ warehouseCode?: string; availableQty?: number; recommendedQty?: number }>)
      : checkRows?.length
        ? bomRequiresSalesOrderInventory(bom)
          ? sumSalesOrderAllocatablePoolQty(bom, checkRows)
          : sumAllocatablePoolQty(checkRows)
        : Number(inventory?.availableQty ?? 0);
    const autoWarehouseAvailableQty = isAutoWarehouseIssueMode.value ? poolQty : undefined;
    return {
      ...bom,
      checkInventoryRecommendedLocations,
      materialPoolQty: poolQty,
      availableQty: poolQty,
      autoWarehouseAvailableQty,
      batchCount: Number(inventory?.batchCount ?? 0),
      locationCount: Number(inventory?.locationCount ?? 0),
      inventoryStatus: String(inventory?.status || lineResult?.status || 'UNKNOWN'),
      partSizeType
    };
  });
};

/** 调用库存检查接口并回写 BOM 行可用量与件型 */
const checkInventory = async (preserveSelectKeys?: Set<string>, options?: { silentIfEmpty?: boolean }) => {
  const orders = effectiveWorkOrders.value;
  if (!orders.length || bomList.value.length === 0) return;

  const demandUserNo = String(props.demandUserNo || '').trim();
  if (isPrepMode.value && !demandUserNo) {
    ElMessage.warning('请先选择需求人');
    return;
  }

  try {
    const displayedMaterialCount = displayBomList.value.length;
    if (displayedMaterialCount === 0) {
      if (!options?.silentIfEmpty) {
        ElMessage.info('当前没有需要检查的显示物料');
      }
      return;
    }

    const nextCheckCache = new Map<string, MaterialLocationRow[]>(checkInventoryLocationCache.value);
    for (const order of orders) {
      const materialCodes = getDisplayedMaterialCodesForOrder(order.workOrderNo);
      if (!materialCodes.length) continue;

      const checkedMaterialCodes = new Set(materialCodes);
      const orderBoms = displayBomList.value.filter((bom) => bom.workOrderNo === order.workOrderNo);
      const needsSalesOrderInventory = orderBoms.some((bom) => bomRequiresSalesOrderInventory(bom));
      const salesOrderNo = String(order.salesOrderNo ?? '').trim();
      const salesOrderItem = String(order.salesOrderItem ?? '').trim();
      const response = await InventoryApi.checkMaterialInventory({
        workOrderNo: order.workOrderNo,
        materialCodes,
        ...(demandUserNo ? { demandUserNo } : {}),
        ...(needsSalesOrderInventory && salesOrderNo
          ? {
              salesOrderNo,
              ...(salesOrderItem ? { salesOrderItem } : {}),
              specialInventoryFlag: 'E'
            }
          : {})
      });

      if (response.code !== 200) continue;
      const checkPayload = parseInventoryCheckPayload(response.data);
      const apiAuto = parseAutoWarehousesFromCheckData(response.data);
      if (!isPrepMode.value && apiAuto.length) {
        apiAutoWarehouseCodes.value = apiAuto;
      }
      applyCheckPayloadToRows(checkPayload, order.workOrderNo, nextCheckCache, checkedMaterialCodes);
    }

    checkInventoryLocationCache.value = nextCheckCache;
    clearMaterialLocationCache();
    applyMaterialPoolMetrics({
      ensureKeys: preserveSelectKeys ? [...preserveSelectKeys] : undefined
    });
  } catch (error) {
    ElMessage.error('库存检查失败');
    console.error(error);
  }
};

/** 按齐套率返回库存分析标签颜色类型 */
const getAnalysisTagType = (kitRate: number) => {
  if (kitRate >= 0.9) return 'success';
  if (kitRate >= 0.7) return 'warning';
  return 'danger';
};

/** 打开物料批次详情弹窗 */
const showBatchDetail = (material: WorkOrderBomVO) => {
  selectedMaterial.value = material;
  showBatchDialog.value = true;
};

/** 打开系统推荐库位弹窗（须先填写本次备料数量） */
const openLocationRecommend = async (material: WorkOrderBomVO) => {
  if (Number(material.issueQty ?? 0) <= 0) {
    ElMessage.warning('请先填写本次备料数量');
    return;
  }
  await ensureMaterialLocations(material.componentMaterial);
  if (isPrepMode.value && Number(material.effectiveAvailableQty ?? material.availableQty ?? 0) <= 0) {
    ElMessage.info('当前无可用库存，可在弹窗中「缺料备料确认」，分类后将生成缺料需求');
  }
  selectedMaterial.value = findBomRowByKey(resolveBomTableRowKey(material)) ?? material;
  locationDialogMode.value = 'recommend';
  showLocationDialog.value = true;
};

/** 打开物料实时库存查询弹窗（只读，弹窗内实时拉取接口） */
const openLocationQuery = (material: WorkOrderBomVO) => {
  selectedMaterial.value = findBomRowByKey(resolveBomTableRowKey(material)) ?? material;
  locationDialogMode.value = 'query';
  showLocationDialog.value = true;
};

/** 库位选择确认：回写弹框内已选库位与系统推荐明细到 BOM 行 */
const onLocationConfirm = (payload: { material: WorkOrderBomVO | null; locations: Array<Record<string, unknown>>; recommendedLocations?: Array<Record<string, unknown>>; overrideReason?: string }) => {
  if (!payload.material) return;
  const rowKey = resolveBomTableRowKey(payload.material);
  const row = findBomRowByKey(rowKey);
  if (row) {
    const idx = bomList.value.findIndex((r) => resolveBomTableRowKey(r) === rowKey);
    if (idx >= 0) {
      bomList.value[idx] = {
        ...bomList.value[idx],
        manualLocationSelections: payload.locations.length ? payload.locations.map((loc) => ({ ...loc, recommendedQty: Number(loc.recommendedQty ?? 0) })) : undefined,
        locationOverrideReason: payload.overrideReason,
        ...(payload.locations.length
          ? {}
          : {
              fifoRecommendedLocations: undefined
            })
      };
    }
    applyMaterialPoolMetrics();
  }
  if (!payload.locations.length) {
    ElMessage.success('已记录缺料备料，确认分类后将生成缺料需求行');
  } else {
    ElMessage.success(payload.overrideReason ? '库位选择已保存（已记录数量调整原因）' : '库位选择已保存');
  }
};

/** 打开物料详情弹窗 */
const showMaterialDetail = (material: WorkOrderBomVO) => {
  selectedMaterial.value = material;
  showMaterialDialog.value = true;
};

/** 导出 BOM 清单（占位） */
const exportBom = () => {
  ElMessage.success('BOM导出功能开发中...');
};

/** 打开发料分配预览弹窗 */
const openAllocationPreview = () => {
  if (!props.workOrder?.workOrderNo) {
    ElMessage.warning('请先选择工单');
    return;
  }
  if (selectedBomRows.value.length === 0) {
    ElMessage.warning('请勾选需要发料的物料');
    return;
  }
  if (totalIssueQty.value <= 0) {
    ElMessage.warning(dialogCopy.value.qtyWarning);
    return;
  }
  showPreviewDialog.value = true;
};

/** 关闭 BOM 对话框 */
const handleClose = () => {
  visible.value = false;
};
</script>

<style scoped>
.order-bom-dialog {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.prep-tip {
  margin-bottom: 4px;
}

.merged-prep-hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.order-summary {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
}

.bom-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bom-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.bom-header > div:first-child {
  width: 100%;
}
.header-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.filter-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.selection-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.selection-hint.muted {
  color: var(--el-text-color-placeholder);
}
.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.header-title {
  font-size: 16px;
  font-weight: bold;
}

.header-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  font-weight: normal;
  color: var(--el-text-color-secondary);
}
.issue-set-input {
  width: 120px;
}
.issue-set-hint {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.bom-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
}
.footer-summary {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.inventory-analysis {
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #f9f9f9;
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.analysis-stats {
  margin-bottom: 16px;
}

.stat-card {
  padding: 16px;
  background: white;
  border-radius: 4px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.text-success {
  color: #67c23a;
}

.text-warning {
  color: #e6a23c;
}

.text-danger {
  color: #f56c6c;
}

.text-muted {
  color: #c0c4cc;
  font-style: italic;
}

.so-inventory-tag {
  cursor: pointer;
}

.so-inventory-popover {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  line-height: 1.5;
}

.shortage-detail {
  margin-top: 16px;
  border-top: 1px solid #ebeef5;
  padding-top: 16px;
}

.detail-title {
  font-weight: bold;
  margin-bottom: 12px;
  color: #f56c6c;
}

:deep(.el-descriptions__label) {
  font-weight: bold;
  background: #fafafa;
}

:deep(.el-descriptions__content) {
  background: white;
}
</style>
