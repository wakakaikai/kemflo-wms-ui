<!-- views/allocation/components/WorkOrderBomDialog.vue -->
<template>
  <el-dialog v-model="visible" :title="`工单BOM详情 - ${workOrder?.workOrderNo}`" width="70%" destroy-on-close>
    <div class="order-bom-dialog">
      <!-- 工单基本信息 -->
      <div class="order-summary">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="产品料号">
            {{ workOrder?.item }}
          </el-descriptions-item>
          <el-descriptions-item label="产品描述">
            {{ workOrder?.itemDesc }}
          </el-descriptions-item>
          <el-descriptions-item label="计划数量"> {{ workOrder?.plannedQty }} {{ workOrder?.unit }} </el-descriptions-item>
          <el-descriptions-item label="已发料"> {{ workOrder?.issuedQty || 0 }} {{ workOrder?.unit }} </el-descriptions-item>
          <el-descriptions-item label="待发料">
            <span
              :class="{
                'text-warning': remainingQty > 0,
                'text-success': remainingQty === 0
              }"
            >
              {{ remainingQty }} {{ workOrder?.unit }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="计划开工">
            {{ formatDate(workOrder?.plannedStartDate) }}
          </el-descriptions-item>
          <el-descriptions-item label="计划完工">
            {{ formatDate(workOrder?.plannedEndDate) }}
          </el-descriptions-item>
          <el-descriptions-item label="交货日期">
            {{ formatDate(workOrder?.soDeliveryDate) }}
          </el-descriptions-item>
          <el-descriptions-item label="优先级">
            <priority-badge :priority="workOrder?.priority || 5" />
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- BOM物料列表 -->
      <div class="bom-list">
        <div class="bom-header">
          <div>
            <span class="header-title">BOM物料清单</span>
            <span class="header-hint">支持部分发料，可修改「本次发料」数量（0 ~ 待发）</span>
          </div>
          <div class="header-toolbar">
            <el-switch
              v-model="showFullyIssued"
              inline-prompt
              active-text="显示已全部发料"
              inactive-text="仅待发物料"
            />
            <span v-if="fullyIssuedCount > 0" class="hidden-hint">
              已隐藏 {{ fullyIssuedCount }} 条已全部发料
            </span>
            <span class="selection-hint">已选 {{ selectedBomRows.length }} / 待发 {{ issuableCount }} 种</span>
          </div>
          <div class="header-actions">
            <el-button size="small" @click="fillAllPending">填满待发</el-button>
            <el-button size="small" @click="clearAllIssue">本次清零</el-button>
            <el-button size="small" @click="checkInventory">
              <el-icon><Search /></el-icon>库存检查
            </el-button>
            <el-button size="small" @click="exportBom">
              <el-icon><Download /></el-icon>导出BOM
            </el-button>
          </div>
        </div>

        <el-table
          ref="bomTableRef"
          :data="displayBomList"
          border
          stripe
          :max-height="400"
          size="small"
          row-key="componentMaterial"
          @selection-change="onBomSelectionChange"
          @select="onBomRowSelect"
          @select-all="onBomSelectAll"
          @deselect="onBomRowDeselect"
        >
          <el-table-column type="selection" width="48" :selectable="isRowSelectable" />
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="componentMaterial" label="物料编码" width="120" />
          <el-table-column prop="componentDesc" label="物料描述" min-width="150" />
          <el-table-column label="需求数量" width="100" align="right">
            <template #default="{ row }">
              {{ formatQty(row.componentQty) }}
            </template>
          </el-table-column>
          <el-table-column prop="inventoryUnit" label="基本单位" width="80" />
          <el-table-column label="已扣账数量" width="88" align="right">
            <template #default="{ row }">
              {{ formatQty(row.issuedQty) }}
            </template>
          </el-table-column>
          <el-table-column label="待发数量" width="88" align="right">
            <template #default="{ row }">
              <span :class="row.pendingQty > 0 ? 'text-warning' : 'text-success'">
                {{ formatQty(row.pendingQty) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="本次发料" width="140">
            <template #default="{ row }">
              <el-input-number
                v-model="row.issueQty"
                :min="0"
                :max="row.pendingQty"
                :precision="4"
                :step="1"
                :disabled="!canEditIssueQty(row)"
                controls-position="right"
                size="small"
                class="issue-qty-input"
                @change="(val: number | undefined) => onIssueQtyChange(row, val)"
              />
            </template>
          </el-table-column>
          <el-table-column label="状态" width="88" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.pendingQty <= 0" type="info" size="small">已发完</el-tag>
              <el-tag v-else-if="isRowSelected(row)" type="success" size="small">待发料</el-tag>
              <el-tag v-else type="info" size="small" effect="plain">未勾选</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="库存状态" width="120">
            <template #default="{ row }">
              <inventory-status :material="row" />
            </template>
          </el-table-column>
          <el-table-column label="齐套率" width="100">
            <template #default="{ row }">
              <kit-rate-indicator :material="row" />
            </template>
          </el-table-column>
          <el-table-column label="批次信息" width="120">
            <template #default="{ row }">
              <el-button v-if="row.batchCount > 0" type="primary" link size="small" @click="showBatchDetail(row)"> {{ row.batchCount }}个批次 </el-button>
              <span v-else class="text-muted">无批次</span>
            </template>
          </el-table-column>
          <el-table-column label="库位信息" width="120">
            <template #default="{ row }">
              <el-button v-if="row.locationCount > 0" type="primary" link size="small" @click="showLocationDetail(row)"> {{ row.locationCount }}个库位 </el-button>
              <span v-else class="text-muted">无库存</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="showMaterialDetail(row)"> 详情 </el-button>
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
            <el-table-column prop="componentMaterial" label="物料编码" />
            <el-table-column prop="componentDesc" label="物料描述" />
            <el-table-column prop="requiredQty" label="需求数量" />
            <el-table-column prop="availableQty" label="可用库存" />
            <el-table-column prop="shortageQty" label="缺料数量">
              <template #default="{ row }">
                <span class="text-danger">{{ row.shortageQty }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="bom-dialog-footer">
        <span v-if="totalIssueQty > 0" class="footer-summary">本次发料 {{ totalIssueQty }} 种物料</span>
        <div class="dialog-footer">
          <el-button @click="handleClose">关闭</el-button>
          <el-button type="success" :disabled="!workOrder?.workOrderNo" @click="saveMaterialIssues">保存发料数量</el-button>
          <el-button type="primary" :disabled="!workOrder?.workOrderNo || totalIssueQty <= 0" @click="openAllocationPreview">
            分配预览
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>

  <!-- 批次详情对话框 -->
  <batch-detail-dialog v-model="showBatchDialog" :material="selectedMaterial" :work-order-no="workOrder?.workOrderNo" />

  <!-- 库位详情对话框 -->
  <location-detail-dialog v-model="showLocationDialog" :material="selectedMaterial" :work-order-no="workOrder?.workOrderNo" />

  <!-- 物料详情对话框 -->
  <material-detail-dialog v-model="showMaterialDialog" :material="selectedMaterial" :work-order="workOrder" />

  <allocation-preview-dialog
    v-model="showPreviewDialog"
    :work-order-no="workOrder?.workOrderNo"
    :material-issue-items="previewMaterialIssueItems"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import type { TableInstance } from 'element-plus';
import { ElMessage } from 'element-plus';
import { Search, Download } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import type { WorkOrderVO, WorkOrderBomVO, WorkOrderMaterialIssueLine } from '@/api/wms/allocation/types';
import WorkOrderApi, { checkMaterialInventory } from '@/api/wms/allocation/index';
import InventoryApi from '@/api/wms/allocation/index';
import {
  bomRowsToIssueLines,
  clampIssueQty,
  getOrderRequiredQty,
  initBomIssueRow,
  issueLineMap,
  needsIssue
} from '../utils/workOrderMaterialIssue';
import PriorityBadge from './PriorityBadge.vue';
import InventoryStatus from './InventoryStatus.vue';
import KitRateIndicator from './KitRateIndicator.vue';
import BatchDetailDialog from './BatchDetailDialog.vue';
import LocationDetailDialog from './LocationDetailDialog.vue';
import AllocationPreviewDialog from './AllocationPreviewDialog.vue';
// import MaterialDetailDialog from './MaterialDetailDialog.vue';

interface Props {
  modelValue: boolean;
  workOrder: WorkOrderVO | null;
  /** 已保存的部分发料数量 */
  materialIssues?: WorkOrderMaterialIssueLine[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [boolean];
  save: [{ workOrderNo: string; materialIssues: WorkOrderMaterialIssueLine[] }];
}>();

const visible = ref(false);
const showBatchDialog = ref(false);
const showLocationDialog = ref(false);
const showMaterialDialog = ref(false);
const showPreviewDialog = ref(false);
const bomTableRef = ref<TableInstance>();
/** 默认隐藏已全部发料的行 */
const showFullyIssued = ref(false);
const selectedBomRows = ref<WorkOrderBomVO[]>([]);

// BOM列表
const bomList = ref<WorkOrderBomVO[]>([]);
// 库存分析
const inventoryAnalysis = ref<any>(null);
// 选中的物料
const selectedMaterial = ref<WorkOrderBomVO | null>(null);

// 计算待发料数量
const remainingQty = computed(() => {
  if (!props.workOrder) return 0;
  return props.workOrder.plannedQty - (props.workOrder.issuedQty || 0);
});

const displayBomList = computed(() => {
  if (showFullyIssued.value) return bomList.value;
  return bomList.value.filter((row) => needsIssue(row));
});

const fullyIssuedCount = computed(() => bomList.value.filter((row) => !needsIssue(row)).length);

const issuableCount = computed(() => bomList.value.filter((row) => needsIssue(row)).length);

const selectedMaterialCodes = computed(() => new Set(selectedBomRows.value.map((r) => r.componentMaterial)));

/** 仅待发>0 可勾选；已全部发料（本次发料必为 0）禁用 */
const isRowSelectable = (row: WorkOrderBomVO) => needsIssue(row);

const isRowSelected = (row: WorkOrderBomVO) => selectedMaterialCodes.value.has(row.componentMaterial);

const canEditIssueQty = (row: WorkOrderBomVO) => needsIssue(row) && isRowSelected(row);

const totalIssueQty = computed(() =>
  bomList.value.filter((row) => isRowSelected(row) && Number(row.issueQty) > 0).length
);

const previewMaterialIssueItems = computed(() => {
  if (!props.workOrder?.workOrderNo) return undefined;
  const lines = bomRowsToIssueLines(bomList.value, selectedMaterialCodes.value);
  if (lines.length === 0) return undefined;
  return lines.map((l) => ({
    workOrderNo: props.workOrder!.workOrderNo,
    materialCode: l.materialCode,
    issueQty: l.issueQty
  }));
});

const shortageMaterials = computed(() => {
  const scope = selectedBomRows.value.length > 0 ? selectedBomRows.value : bomList.value.filter(needsIssue);
  return scope
    .filter((material) => {
      const req = getOrderRequiredQty(material);
      return req > 0 && material.availableQty !== undefined;
    })
    .map((material) => {
      const requiredQty = getOrderRequiredQty(material);
      const availableQty = material.availableQty || 0;
      return {
        componentMaterial: material.componentMaterial,
        componentDesc: material.componentDesc,
        requiredQty,
        availableQty,
        shortageQty: Math.max(0, requiredQty - availableQty)
      };
    })
    .filter((m) => m.shortageQty > 0);
});

const formatQty = (val?: number) => {
  const n = Number(val ?? 0);
  return Number.isNaN(n) ? '0' : n;
};

const onIssueQtyChange = (row: WorkOrderBomVO, val?: number) => {
  if (!needsIssue(row)) {
    row.issueQty = 0;
    return;
  }
  if (!isRowSelected(row)) {
    row.issueQty = 0;
    return;
  }
  const qty = clampIssueQty(val ?? 0, row.pendingQty ?? 0);
  row.issueQty = qty;
  if (qty <= 0) {
    nextTick(() => {
      bomTableRef.value?.toggleRowSelection(row, false);
      purgeInvalidSelection();
    });
  }
};

const onBomSelectionChange = (rows: WorkOrderBomVO[]) => {
  const valid = rows.filter((r) => needsIssue(r) && Number(r.issueQty) > 0);
  selectedBomRows.value = valid;
  const selectedCodes = new Set(valid.map((r) => r.componentMaterial));
  bomList.value.forEach((row) => {
    if (!needsIssue(row)) {
      row.issueQty = 0;
    } else if (!selectedCodes.has(row.componentMaterial)) {
      row.issueQty = 0;
    }
  });
  if (valid.length !== rows.length) {
    nextTick(() => purgeInvalidSelection());
  }
};

const onBomRowSelect = (row: WorkOrderBomVO) => {
  if (!needsIssue(row)) return;
  if ((row.issueQty ?? 0) <= 0) {
    row.issueQty = row.pendingQty ?? 0;
  }
};

const onBomRowDeselect = (row: WorkOrderBomVO) => {
  row.issueQty = 0;
};

const onBomSelectAll = (rows: WorkOrderBomVO[]) => {
  if (rows.length === 0) {
    bomList.value.filter(needsIssue).forEach((row) => {
      row.issueQty = 0;
    });
    return;
  }
  rows.forEach((row) => onBomRowSelect(row));
};

/** 取消已全部发料、本次发料为 0 等无效勾选 */
const purgeInvalidSelection = () => {
  const table = bomTableRef.value;
  bomList.value.forEach((row) => {
    const invalid = !needsIssue(row) || Number(row.issueQty) <= 0;
    if (invalid) {
      if (!needsIssue(row)) row.issueQty = 0;
      table?.toggleRowSelection(row, false);
    }
  });
  selectedBomRows.value = selectedBomRows.value.filter(
    (r) => needsIssue(r) && Number(r.issueQty) > 0
  );
};

const syncBomTableSelection = async () => {
  await nextTick();
  const table = bomTableRef.value;
  if (!table) return;
  table.clearSelection();
  selectedBomRows.value = [];

  let toSelect: WorkOrderBomVO[];
  if (props.materialIssues?.length) {
    const savedCodes = new Set(
      props.materialIssues.filter((l) => l.issueQty > 0).map((l) => l.materialCode)
    );
    toSelect = bomList.value.filter((r) => savedCodes.has(r.componentMaterial) && needsIssue(r));
    toSelect.forEach((row) => {
      const saved = props.materialIssues!.find((l) => l.materialCode === row.componentMaterial);
      if (saved && saved.issueQty > 0) {
        row.issueQty = clampIssueQty(saved.issueQty, row.pendingQty ?? 0);
      }
    });
  } else {
    toSelect = bomList.value.filter(needsIssue);
    toSelect.forEach((row) => {
      row.issueQty = row.pendingQty ?? 0;
    });
  }

  toSelect = toSelect.filter((r) => Number(r.issueQty) > 0);
  toSelect.forEach((row) => table.toggleRowSelection(row, true));
  selectedBomRows.value = [...toSelect];
  purgeInvalidSelection();
};

const fillAllPending = () => {
  const targets =
    selectedBomRows.value.length > 0
      ? selectedBomRows.value.filter(needsIssue)
      : displayBomList.value.filter(needsIssue);
  if (targets.length === 0) {
    ElMessage.warning('请先勾选需要发料的物料');
    return;
  }
  targets.forEach((row) => {
    row.issueQty = row.pendingQty ?? 0;
  });
  nextTick(() => {
    targets.forEach((row) => bomTableRef.value?.toggleRowSelection(row, true));
    selectedBomRows.value = [...targets];
  });
};

const clearAllIssue = () => {
  const targets = selectedBomRows.value.length > 0 ? selectedBomRows.value : bomList.value.filter(needsIssue);
  targets.forEach((row) => {
    row.issueQty = 0;
  });
  nextTick(() => purgeInvalidSelection());
};

const saveMaterialIssues = () => {
  if (!props.workOrder?.workOrderNo) return;
  if (selectedBomRows.value.length === 0) {
    ElMessage.warning('请勾选需要发料的物料');
    return;
  }
  const materialIssues = bomRowsToIssueLines(bomList.value, selectedMaterialCodes.value);
  if (materialIssues.length === 0) {
    ElMessage.warning('请为已勾选物料填写本次发料数量');
    return;
  }
  emit('save', { workOrderNo: props.workOrder.workOrderNo, materialIssues });
  ElMessage.success('发料数量已保存');
};

// 监听props变化
watch(
  () => props.modelValue,
  async (val) => {
    visible.value = val;
    if (val && props.workOrder) {
      showFullyIssued.value = false;
      selectedBomRows.value = [];
      await loadBomData();
    }
  }
);

watch(showFullyIssued, () => {
  nextTick(() => purgeInvalidSelection());
});

// 监听visible变化
watch(visible, (val) => {
  emit('update:modelValue', val);
});

// 格式化日期
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  return dayjs(dateStr).format('YYYY/MM/DD');
};

// 加载BOM数据
const loadBomData = async () => {
  if (!props.workOrder) return;

  try {
    // 加载BOM清单
    const savedMap = issueLineMap(props.materialIssues);
    const bomResponse = await WorkOrderApi.getWorkOrderBom(props.workOrder.workOrderNo);
    if (bomResponse.code === 200) {
      bomList.value = bomResponse.data.map((bom: WorkOrderBomVO) =>
        initBomIssueRow(bom, savedMap.get(bom.componentMaterial))
      );
    }

    // 检查库存
    await checkInventory();
  } catch (error) {
    ElMessage.error('加载BOM数据失败');
    console.error(error);
  }
};

// 库存检查
const checkInventory = async () => {
  if (!props.workOrder || bomList.value.length === 0) return;

  try {
    const materialCodes = bomList.value.map((bom) => bom.componentMaterial);
    const requestParams = {
      workOrderNo: props.workOrder.workOrderNo,
      materialCodes
    };
    const response = await InventoryApi.checkMaterialInventory(requestParams);

    if (response.code === 200) {
      inventoryAnalysis.value = response.data.analysis;

      // 更新物料库存信息
      const inventoryMap = new Map();
      response.data.materials?.forEach((mat: any) => {
        inventoryMap.set(mat.materialCode, mat);
      });

      bomList.value = bomList.value.map((bom) => {
        const inventory = inventoryMap.get(bom.componentMaterial);
        return {
          ...bom,
          availableQty: inventory?.availableQty || 0,
          batchCount: inventory?.batchCount || 0,
          locationCount: inventory?.locationCount || 0,
          inventoryStatus: inventory?.status || 'UNKNOWN'
        };
      });
      await syncBomTableSelection();
    }
  } catch (error) {
    ElMessage.error('库存检查失败');
    console.error(error);
  }
};

// 获取分析标签类型
const getAnalysisTagType = (kitRate: number) => {
  if (kitRate >= 0.9) return 'success';
  if (kitRate >= 0.7) return 'warning';
  return 'danger';
};

// 显示批次详情
const showBatchDetail = (material: WorkOrderBomVO) => {
  selectedMaterial.value = material;
  showBatchDialog.value = true;
};

// 显示库位详情
const showLocationDetail = (material: WorkOrderBomVO) => {
  selectedMaterial.value = material;
  showLocationDialog.value = true;
};

// 显示物料详情
const showMaterialDetail = (material: WorkOrderBomVO) => {
  selectedMaterial.value = material;
  showMaterialDialog.value = true;
};

// 导出BOM
const exportBom = () => {
  ElMessage.success('BOM导出功能开发中...');
};

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
    ElMessage.warning('请为已勾选物料填写本次发料数量');
    return;
  }
  showPreviewDialog.value = true;
};

// 关闭对话框
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
.hidden-hint,
.selection-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
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
.issue-qty-input {
  width: 120px;
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
