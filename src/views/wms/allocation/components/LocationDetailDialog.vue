<template>
  <el-dialog v-model="visible" :title="dialogTitle" width="1280px" destroy-on-close append-to-body>
    <div v-loading="loading" class="location-detail-dialog">
      <div class="material-info">
        <el-descriptions :column="isRecommendMode ? 4 : 3" border size="small">
          <el-descriptions-item label="物料编码">{{ material?.componentMaterial }}</el-descriptions-item>
          <el-descriptions-item label="物料描述">{{ material?.componentDesc }}</el-descriptions-item>
          <el-descriptions-item v-if="isRecommendMode" label="本次备料">{{ formatQty(material?.issueQty) }} {{ issueUnit }}</el-descriptions-item>
          <el-descriptions-item v-if="isRecommendMode" label="需求数量(库存单位)">
            <span class="demand-qty">{{ formatQty(demandInventoryQty) }} {{ inventoryUnit }}</span>
          </el-descriptions-item>
          <el-descriptions-item v-if="!isRecommendMode" label="库存单位">{{ inventoryUnit || '-' }}</el-descriptions-item>
          <el-descriptions-item v-if="!isRecommendMode" label="可用合计">
            <span class="demand-qty">{{ formatQty(totalUnrestrictedQty) }} {{ inventoryUnit }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <template v-if="isRecommendMode">
        <el-alert v-if="demandInventoryQty <= 0" type="warning" :closable="false" show-icon class="tip-alert"> 请先填写本次备料数量后再使用系统推荐 </el-alert>
        <el-alert
          v-else-if="material && bomRequiresSalesOrderInventory(material)"
          type="warning"
          :closable="false"
          show-icon
          class="tip-alert"
        >
          本物料需使用销售订单库存（E），仅可分配匹配的销售订单及项次：{{ formatSalesOrderInventoryLabel(material) }}
        </el-alert>
        <el-alert v-else type="info" :closable="false" show-icon class="tip-alert"> 系统按 FIFO 自动推荐分配数量；可直接修改任意库位分配数量，与推荐不一致须填写调整原因 </el-alert>
        <el-alert v-if="isRecommendMode && allowShortageConfirm && demandInventoryQty > 0 && totalUnrestrictedQty <= 0" type="warning" :closable="false" show-icon class="tip-alert">
          当前无可用库存，可点击「缺料备料确认」；后续确认分类时将生成缺料需求行
        </el-alert>
      </template>
      <el-alert v-else type="info" :closable="false" show-icon class="tip-alert"> 查询物料实时库存，按仓库 / 库位展示；不参与备料推荐与确认 </el-alert>

      <div class="distribution-header">
        <span class="header-title">库存明细</span>
        <div class="header-actions">
          <el-button v-if="!isRecommendMode" size="small" :loading="loading" @click="loadLocationData">刷新</el-button>
          <template v-if="isRecommendMode">
            <el-button size="small" :disabled="!demandInventoryQty" @click="applyRecommendation">恢复系统推荐</el-button>
            <el-tag v-if="recommendedRows.length" type="success" size="small">推荐 {{ recommendedRows.length }} 项</el-tag>
            <el-tag v-if="shortageQty > 0" type="warning" size="small">缺口 {{ formatQty(shortageQty) }} {{ inventoryUnit }}</el-tag>
            <el-tag v-if="selectedLocations.length" type="primary" size="small">已选 {{ selectedLocations.length }} 项</el-tag>
            <el-tag type="info" size="small">已分配 {{ formatQty(selectedPickQty) }} / {{ formatQty(demandInventoryQty) }} {{ inventoryUnit }}</el-tag>
          </template>
          <el-tag v-else type="success" size="small">明细 {{ flatRows.length }} 条</el-tag>
        </div>
      </div>

      <el-table
        ref="tableRef"
        :data="treeData"
        row-key="rowKey"
        border
        stripe
        size="small"
        default-expand-all
        :tree-props="{ children: 'children' }"
        :max-height="420"
        @selection-change="onSelectionChange"
      >
        <el-table-column v-if="isRecommendMode" type="selection" width="46" :selectable="isRowSelectable" />
        <el-table-column prop="label" label="仓库 / 库位" min-width="220" show-overflow-tooltip />
        <el-table-column label="非限制使用" width="110" align="right">
          <template #default="{ row }">{{ formatQty(row.unrestrictedQty) }}</template>
        </el-table-column>
        <el-table-column label="质量检验" width="100" align="right">
          <template #default="{ row }">{{ formatQty(row.inspectionQty) }}</template>
        </el-table-column>
        <el-table-column label="已冻结" width="90" align="right">
          <template #default="{ row }">{{ formatQty(row.blockedQty) }}</template>
        </el-table-column>
        <el-table-column label="批次号" width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.isLeaf ? row.batchCode || '-' : '' }}</template>
        </el-table-column>
        <el-table-column label="接收时间" width="118">
          <template #default="{ row }">{{ row.isLeaf ? row.receivedDate : '' }}</template>
        </el-table-column>
        <el-table-column label="特殊库存" align="center" prop="specialInventoryFlag" width="96">
          <template #default="scope">
            <dict-tag v-if="scope.row.isLeaf" :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
          </template>
        </el-table-column>
        <el-table-column v-if="showBusinessCodeColumn" label="业务编码" width="130" show-overflow-tooltip>
          <template #default="scope">
            <span v-if="scope.row.isLeaf && scope.row.specialInventoryFlag && scope.row.specialInventoryFlag !== 'N'">
              {{ scope.row.businessCode }}
            </span>
          </template>
        </el-table-column>
        <el-table-column v-if="isRecommendMode" label="分配数量" width="130" align="right">
          <template #default="{ row }">
            <el-input-number
              v-if="row.isLeaf && isPickableLeaf(row)"
              :model-value="row.recommendedQty ?? 0"
              :min="0"
              :max="row.unrestrictedQty"
              :precision="4"
              :step="1"
              controls-position="right"
              size="small"
              class="pick-qty-input"
              @click.stop
              @change="(val: number | undefined) => onPickQtyChange(row, val)"
            />
            <span v-else-if="row.recommendedQty">{{ formatQty(row.recommendedQty) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column v-if="isRecommendMode" label="标记" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isLeaf && row.sourceRow && isNonUserLineWarehouse(row.sourceRow)" type="danger" size="small">其他线边</el-tag>
            <el-tag
              v-else-if="row.isLeaf && row.sourceRow && material && bomRequiresSalesOrderInventory(material) && !isOperatableLocationForBom(material, row.sourceRow)"
              type="info"
              size="small"
            >
              不可分配
            </el-tag>
            <el-tag v-else-if="row.isLeaf && row.isRecommended && !isQtyOverridden(row)" type="success" size="small">推荐</el-tag>
            <el-tag v-else-if="row.isLeaf && isQtyOverridden(row)" type="warning" size="small">已调整</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="isRecommendMode" class="recommend-summary">
        <div class="recommend-summary-head">
          <span class="header-title">推荐信息</span>
          <span v-if="!recommendInfoItems.length && demandInventoryQty > 0" class="text-muted">暂无推荐</span>
        </div>
        <div v-if="recommendInfoItems.length" class="recommend-picks">
          <div class="recommend-pick-head">
            <span class="pick-col pick-loc">库位</span>
            <span class="pick-col pick-batch">批次</span>
            <span class="pick-col pick-qty">数量</span>
          </div>
          <div
            v-for="(pick, idx) in recommendInfoItems"
            :key="idx"
            class="recommend-pick-row"
            :class="{ 'is-other-line': pick.isOtherLine }"
          >
            <span class="pick-col pick-loc" :title="pick.location">{{ pick.location }}</span>
            <span class="pick-col pick-batch" :title="pick.batch">{{ pick.batch }}</span>
            <span class="pick-col pick-qty">
              <span v-if="pick.isOtherLine" class="qty-tag qty-tag-hint">其他线边</span>
              {{ pick.qty }}<span v-if="pick.unit" class="pick-unit">{{ pick.unit }}</span>
            </span>
          </div>
        </div>
        <div v-if="material?.locationOverrideReason" class="recommend-reason">数量调整原因：{{ material.locationOverrideReason }}</div>
      </div>

      <div v-if="isRecommendMode && isOverride" class="override-reason">
        <div class="reason-label">数量调整原因 <span class="required">*</span></div>
        <el-input v-model="overrideReason" type="textarea" :rows="2" maxlength="200" show-word-limit placeholder="手动调整仓别/库位数量时，请说明原因" />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <span v-if="isRecommendMode" class="selection-summary">
          已选 {{ selectedLocations.length }} 项，已分配 {{ formatQty(selectedPickQty) }} / 需求 {{ formatQty(demandInventoryQty) }} {{ inventoryUnit }}
          <span v-if="pickShortageQty > 0" class="shortage-hint">（缺口 {{ formatQty(pickShortageQty) }}）</span>
        </span>
        <span v-else class="selection-summary">实时库存查询，共 {{ flatRows.length }} 条明细</span>
        <el-button @click="handleClose">关闭</el-button>
        <el-button v-if="canConfirmShortage" type="warning" @click="confirmShortagePrep">缺料备料确认</el-button>
        <el-button v-if="isRecommendMode" type="primary" :disabled="!canConfirm" @click="confirmSelection">确认选择</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, getCurrentInstance, toRefs, type ComponentInternalInstance } from 'vue';
import type { TableInstance } from 'element-plus';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import type { WorkOrderBomVO, InventoryTreeNode, MaterialLocationRow } from '@/api/wms/allocation/types';
import InventoryApi from '@/api/wms/allocation/index';
import { computeRecommendCapInventoryQty, issueQtyToInventoryQty, resolveBomBaseUnit } from '@/api/wms/allocation/index';
import {
  buildInventoryTree,
  clampPickQty,
  cloneMaterialLocationRows,
  collectLeafNodes,
  deductLocationPicksFromStock,
  normalizeMaterialInventoryResponse,
  isNonUserLineWarehouse,
  recommendLocationsByFifo,
  recommendLocationsFromCheckApi,
  resolveLocationPickAvailableQty,
  shouldUseCheckInventoryRecommend,
  recalcTreePickTotals,
  sumPickQty
} from '@/api/wms/allocation/index';
import {
  bomRequiresSalesOrderInventory,
  enrichLocationRowsWithSalesOrderDefaults,
  formatSalesOrderInventoryLabel,
  isOperatableLocationForBom
} from '@/api/wms/allocation/index';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_inventory_special_flag } = toRefs<any>(proxy?.useDict('wms_inventory_special_flag'));

export type LocationDialogMode = 'recommend' | 'query';

interface Props {
  modelValue: boolean;
  material: WorkOrderBomVO | null;
  workOrderNo?: string;
  /** recommend=按需求FIFO推荐并确认；query=仅查询实时库存 */
  mode?: LocationDialogMode;
  /** 同物料前序 BOM 行已占用库存（库存单位） */
  peerReservedInventoryQty?: number;
  /** 同物料前序 BOM 行已占用的库位明细（用于按库位扣减库存池） */
  peerLocationPicks?: Array<Record<string, unknown>>;
  /** 与 BOM 列表 FIFO 共用的库存明细（优先于接口实时查询） */
  baseLocationRows?: MaterialLocationRow[];
  /** 备料模式：无库存时允许缺料备料确认（不分配库位） */
  allowShortageConfirm?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'recommend',
  peerReservedInventoryQty: 0,
  peerLocationPicks: () => [],
  allowShortageConfirm: false
});

const emit = defineEmits<{
  'update:modelValue': [boolean];
  confirm: [
    {
      material: WorkOrderBomVO | null;
      locations: MaterialLocationRow[];
      recommendedLocations: MaterialLocationRow[];
      demandInventoryQty: number;
      overrideReason?: string;
    }
  ];
}>();

const visible = ref(false);
const loading = ref(false);
const tableRef = ref<TableInstance>();
const flatRows = ref<MaterialLocationRow[]>([]);
const treeData = ref<InventoryTreeNode[]>([]);
const selectedLocations = ref<MaterialLocationRow[]>([]);
const recommendedRows = ref<MaterialLocationRow[]>([]);
const recommendedKeys = ref<Set<string>>(new Set());
const systemRecommendedMap = ref<Map<string, number>>(new Map());
const shortageQty = ref(0);
const overrideReason = ref('');
const applyingSelection = ref(false);
const selectedLeafKeys = ref<Set<string>>(new Set());

/** 是否为库位推荐模式（否则为只读查库存） */
const isRecommendMode = computed(() => props.mode === 'recommend');

/** 由下方库存明细聚合的推荐信息（与其他库位同一逻辑，仅标记其他线边） */
const recommendInfoItems = computed(() => {
  if (!isRecommendMode.value) return [];
  const unit = inventoryUnit.value;

  return flatRows.value
    .filter((row) => Number(row.recommendedQty ?? 0) > 0)
    .map((row) => ({
      location: String(row.locationCode || '-').trim() || '-',
      batch: String(row.batchCode || '-').trim() || '-',
      qty: String(formatQty(Number(row.recommendedQty ?? 0))),
      unit,
      isOtherLine: isNonUserLineWarehouse(row),
      isAllocated: true
    }));
});

/** 弹窗标题：推荐模式与查询模式文案不同 */
const dialogTitle = computed(() => {
  const code = props.material?.componentMaterial || '';
  return isRecommendMode.value ? `库位推荐 - ${code}` : `实时库存 - ${code}`;
});

/** 发料/备料单位 */
const issueUnit = computed(() => props.material?.unit || '');
/** 库存计量单位（基本单位） */
const inventoryUnit = computed(() => resolveBomBaseUnit(props.material || {}) || props.material?.inventoryUnit || props.material?.unit || '');

/** 本行需求对应的库存单位数量 */
const rowDemandInventoryQty = computed(() => issueQtyToInventoryQty(Number(props.material?.issueQty ?? 0), props.material?.conversionRatio));

/** 当前分配需求量（库存单位） */
const demandInventoryQty = computed(() => rowDemandInventoryQty.value);

/** 推荐分配上限：与 BOM 列表推荐信息栏位共用同一 FIFO 上限算法 */
const recommendCapInventoryQty = computed(() => {
  if (!props.material) return 0;
  return computeRecommendCapInventoryQty(props.material, props.peerReservedInventoryQty);
});

/** 已选库位分配数量合计（库存单位） */
const selectedPickQty = computed(() => sumPickQty(selectedLocations.value));

/** 分配后仍缺的数量 */
const pickShortageQty = computed(() => Math.max(0, demandInventoryQty.value - selectedPickQty.value));

/** 是否存在需展示业务编码的特殊库存行 */
const showBusinessCodeColumn = computed(() =>
  flatRows.value.some((row) => row.specialInventoryFlag && row.specialInventoryFlag !== 'N')
);

/** 全部库位非限制可用量合计（销售订单绑定时仅统计可分配库存） */
const totalUnrestrictedQty = computed(() =>
  flatRows.value.reduce((sum, row) => {
    if (isRecommendMode.value && props.material && !isOperatableLocationForBom(props.material, row)) return sum;
    return sum + resolveLocationPickAvailableQty(row);
  }, 0)
);

/** 判断当前库位分配是否与系统 FIFO 推荐不一致 */
const isOverride = computed(() => {
  const selected = selectedLocations.value;
  if (!systemRecommendedMap.value.size) {
    return selected.some((row) => Number(row.recommendedQty ?? 0) > 0);
  }
  const selectedKeySet = new Set(selected.map((r) => r.rowKey));
  if (selectedKeySet.size !== recommendedKeys.value.size) return true;
  for (const key of recommendedKeys.value) {
    if (!selectedKeySet.has(key)) return true;
  }
  for (const row of selected) {
    const systemQty = systemRecommendedMap.value.get(row.rowKey) ?? 0;
    if (Number(row.recommendedQty ?? 0) !== systemQty) return true;
  }
  return false;
});

/** 是否允许确认库位选择（须已分配且覆盖时填写原因） */
const canConfirm = computed(() => {
  if (!selectedLocations.value.length) return false;
  if (selectedPickQty.value <= 0) return false;
  if (isOverride.value && !overrideReason.value.trim()) return false;
  return true;
});

/** 备料模式无库存时，允许缺料备料确认 */
const canConfirmShortage = computed(() => props.allowShortageConfirm && isRecommendMode.value && demandInventoryQty.value > 0 && totalUnrestrictedQty.value <= 0);

/** 格式化数量显示 */
const formatQty = (val?: number) => {
  const n = Number(val ?? 0);
  return Number.isNaN(n) ? '0' : n;
};

/** 格式化接收日期显示 */
const formatDate = (val?: string) => {
  if (!val) return '-';
  const d = dayjs(val);
  return d.isValid() ? d.format('YYYY/MM/DD') : val;
};

/** 判断库位叶子行是否可勾选/编辑（须有非限制可用量，且满足销售订单库存约束） */
const isRowSelectable = (row: InventoryTreeNode) => {
  if (!row.isLeaf || row.unrestrictedQty <= 0 || !row.sourceRow) return false;
  if (props.material && !isOperatableLocationForBom(props.material, row.sourceRow)) return false;
  return true;
};

const isPickableLeaf = isRowSelectable;

/** 判断单行分配数量是否偏离系统推荐值 */
const isQtyOverridden = (row: InventoryTreeNode) => {
  if (!row.isLeaf || !row.sourceRow) return false;
  const systemQty = row.sourceRow.systemRecommendedQty ?? systemRecommendedMap.value.get(row.sourceRow.rowKey);
  if (systemQty == null) return Number(row.recommendedQty ?? 0) > 0;
  return Number(row.recommendedQty ?? 0) !== systemQty;
};

/** 将树节点分配数量同步回扁平库存行 */
function syncFlatRowPick(rowKey: string, qty: number) {
  const flat = flatRows.value.find((r) => r.rowKey === rowKey);
  if (flat) flat.recommendedQty = qty;
}

/** 从树勾选状态重建已选库位列表并更新缺口 */
function syncSelectedFromTree() {
  const leaves = collectLeafNodes(treeData.value);
  selectedLocations.value = leaves
    .filter((leaf) => leaf.isLeaf && leaf.sourceRow && selectedLeafKeys.value.has(leaf.rowKey))
    .map((leaf) => ({ ...leaf.sourceRow!, recommendedQty: Number(leaf.recommendedQty ?? 0) }));
  recalcTreePickTotals(treeData.value);
  shortageQty.value = pickShortageQty.value;
}

/** 由扁平库存行重建仓库/库位树形数据 */
function rebuildTree(rows: MaterialLocationRow[]) {
  flatRows.value = rows;
  treeData.value = buildInventoryTree(rows);
}

/** 按 FIFO 推荐结果勾选表格对应库位行并回写分配数量 */
function applyRecommendationSelection() {
  applyingSelection.value = true;
  tableRef.value?.clearSelection();
  selectedLeafKeys.value = new Set();
  const leaves = collectLeafNodes(treeData.value);
  leaves.forEach((leaf) => {
    if (!leaf.sourceRow) return;
    const key = leaf.sourceRow.rowKey;
    if (!recommendedKeys.value.has(key)) return;
    const qty = systemRecommendedMap.value.get(key) ?? Number(leaf.sourceRow.recommendedQty ?? 0);
    if (qty <= 0) return;
    leaf.recommendedQty = qty;
    leaf.isRecommended = true;
    leaf.sourceRow.recommendedQty = qty;
    leaf.sourceRow.isRecommended = true;
    syncFlatRowPick(key, qty);
    tableRef.value?.toggleRowSelection(leaf, true);
    selectedLeafKeys.value.add(leaf.rowKey);
  });
  applyingSelection.value = false;
  syncSelectedFromTree();
}

/** 恢复已保存的手工库位选择（与 BOM 表推荐信息栏一致） */
function applyManualSelection(manual: Array<Record<string, unknown>>) {
  applyingSelection.value = true;
  tableRef.value?.clearSelection();
  selectedLeafKeys.value = new Set();
  const pickMap = new Map<string, number>();
  manual.forEach((loc) => {
    const key = String(loc.rowKey ?? '').trim();
    if (!key) return;
    pickMap.set(key, Number(loc.recommendedQty ?? 0));
  });
  const leaves = collectLeafNodes(treeData.value);
  leaves.forEach((leaf) => {
    if (!leaf.sourceRow) return;
    const qty = pickMap.get(leaf.sourceRow.rowKey);
    if (qty == null || qty <= 0) return;
    leaf.recommendedQty = qty;
    leaf.sourceRow.recommendedQty = qty;
    syncFlatRowPick(leaf.sourceRow.rowKey, qty);
    tableRef.value?.toggleRowSelection(leaf, true);
    selectedLeafKeys.value.add(leaf.rowKey);
  });
  overrideReason.value = String(props.material?.locationOverrideReason ?? '').trim();
  applyingSelection.value = false;
  syncSelectedFromTree();
}

/** 构建扣减前序占用后的库位明细（与 BOM 列表 FIFO 同一套库存池） */
function buildWorkingLocationRows(source: MaterialLocationRow[]): MaterialLocationRow[] {
  const rows = cloneMaterialLocationRows(source);
  if (isRecommendMode.value && props.peerLocationPicks?.length) {
    deductLocationPicksFromStock(rows, props.peerLocationPicks);
  }
  return rows;
}

/** 执行 FIFO 库位推荐并计算分配缺口 */
function runRecommendation() {
  const cap = recommendCapInventoryQty.value;
  const useCheckOrder = shouldUseCheckInventoryRecommend(flatRows.value);
  const allocateOptions = props.material
    ? { canAllocate: (loc: MaterialLocationRow) => isOperatableLocationForBom(props.material!, loc) }
    : undefined;
  const result = useCheckOrder
    ? recommendLocationsFromCheckApi(flatRows.value, cap, allocateOptions)
    : recommendLocationsByFifo(flatRows.value, cap, allocateOptions);
  recommendedRows.value = result.recommendedRows.map((row) => ({ ...row, systemRecommendedQty: row.recommendedQty }));
  recommendedKeys.value = result.recommendedKeys;
  systemRecommendedMap.value = new Map(result.recommendedRows.map((row) => [row.rowKey, Number(row.recommendedQty ?? 0)]));
  flatRows.value.forEach((row) => {
    const qty = systemRecommendedMap.value.get(row.rowKey) ?? 0;
    row.systemRecommendedQty = qty;
    if (qty > 0) {
      row.recommendedQty = qty;
      row.isRecommended = true;
    } else {
      row.recommendedQty = undefined;
      row.isRecommended = false;
    }
  });
  const allocated = result.recommendedRows.reduce((sum, row) => sum + Number(row.recommendedQty ?? 0), 0);
  shortageQty.value = Math.max(0, rowDemandInventoryQty.value - allocated);
  rebuildTree(flatRows.value);
}

/** 恢复系统 FIFO 推荐分配并重新勾选库位 */
async function applyRecommendation() {
  runRecommendation();
  overrideReason.value = '';
  await nextTick();
  applyRecommendationSelection();
}

watch(
  () => props.modelValue,
  async (val) => {
    visible.value = val;
    if (val && props.material) {
      overrideReason.value = '';
      selectedLocations.value = [];
      recommendedRows.value = [];
      recommendedKeys.value = new Set();
      systemRecommendedMap.value = new Map();
      selectedLeafKeys.value = new Set();
      shortageQty.value = 0;
      await loadLocationData();
    }
  }
);

watch(visible, (val) => emit('update:modelValue', val));

/** 加载物料库存明细并在推荐模式下执行 FIFO 分配 */
const loadLocationData = async () => {
  if (!props.material) return;
  loading.value = true;
  try {
    let sourceRows: MaterialLocationRow[];
    const useCachedRows = isRecommendMode.value && props.baseLocationRows?.length;
    if (useCachedRows) {
      sourceRows = props.baseLocationRows!;
    } else {
      const response = await InventoryApi.getMaterialLocations(props.material.componentMaterial);
      if (response.code !== 200) return;
      sourceRows = normalizeMaterialInventoryResponse(response.data);
    }
    if (useCachedRows && props.material && bomRequiresSalesOrderInventory(props.material)) {
      sourceRows = enrichLocationRowsWithSalesOrderDefaults(sourceRows, props.material);
    }
    const rows = buildWorkingLocationRows(sourceRows);
    flatRows.value = rows;
    if (isRecommendMode.value && demandInventoryQty.value > 0) {
      runRecommendation();
      await nextTick();
      const manual = props.material.manualLocationSelections?.filter((loc) => Number(loc.recommendedQty ?? 0) > 0);
      if (manual?.length) {
        applyManualSelection(manual);
      } else {
        applyRecommendationSelection();
      }
    } else {
      rebuildTree(rows);
    }
  } catch (error) {
    ElMessage.error('加载库存明细失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

/** 库位勾选变化：为新选行填充推荐或剩余需求量 */
const onSelectionChange = (rows: InventoryTreeNode[]) => {
  if (applyingSelection.value) return;
  const leaves = rows.filter((row) => row.isLeaf && row.sourceRow);
  selectedLeafKeys.value = new Set(leaves.map((row) => row.rowKey));
  let allocated = sumPickQty(leaves.filter((row) => Number(row.recommendedQty) > 0));
  leaves.forEach((row) => {
    if (Number(row.recommendedQty) > 0) return;
    const systemQty = row.sourceRow ? systemRecommendedMap.value.get(row.sourceRow.rowKey) : undefined;
    const remaining = Math.max(0, recommendCapInventoryQty.value - allocated);
    const qty = systemQty != null && systemQty > 0 ? clampPickQty(row.unrestrictedQty, systemQty) : clampPickQty(row.unrestrictedQty, remaining);
    row.recommendedQty = qty;
    if (row.sourceRow) {
      row.sourceRow.recommendedQty = qty;
      syncFlatRowPick(row.sourceRow.rowKey, qty);
    }
    allocated += qty;
  });
  syncSelectedFromTree();
};

/** 手动修改单行库位分配数量并同步勾选状态 */
const onPickQtyChange = (row: InventoryTreeNode, val: number | undefined) => {
  if (!row.isLeaf || !row.sourceRow) return;
  const qty = clampPickQty(row.unrestrictedQty, val);
  row.recommendedQty = qty;
  row.sourceRow.recommendedQty = qty;
  syncFlatRowPick(row.sourceRow.rowKey, qty);
  if (qty > 0 && !selectedLeafKeys.value.has(row.rowKey)) {
    applyingSelection.value = true;
    tableRef.value?.toggleRowSelection(row, true);
    applyingSelection.value = false;
    selectedLeafKeys.value.add(row.rowKey);
  }
  if (qty <= 0 && selectedLeafKeys.value.has(row.rowKey)) {
    applyingSelection.value = true;
    tableRef.value?.toggleRowSelection(row, false);
    applyingSelection.value = false;
    selectedLeafKeys.value.delete(row.rowKey);
  }
  syncSelectedFromTree();
};

/** 无库存缺料备料：不分配库位，由分类阶段生成缺料需求行 */
const confirmShortagePrep = () => {
  emit('confirm', {
    material: props.material,
    locations: [],
    recommendedLocations: [],
    demandInventoryQty: demandInventoryQty.value
  });
  handleClose();
};

/** 校验并提交库位选择结果给父组件 */
const confirmSelection = () => {
  if (!selectedLocations.value.length) {
    ElMessage.warning('请至少选择一条库存明细');
    return;
  }
  if (selectedPickQty.value <= 0) {
    ElMessage.warning('分配数量合计须大于 0');
    return;
  }
  if (isOverride.value && !overrideReason.value.trim()) {
    ElMessage.warning('手动调整仓别/库位数量时，请填写原因');
    return;
  }
  if (props.material && bomRequiresSalesOrderInventory(props.material)) {
    const invalid = selectedLocations.value.filter((loc) => !isOperatableLocationForBom(props.material!, loc));
    if (invalid.length) {
      ElMessage.warning('只能选择匹配销售订单及项次的 E 类型库存');
      return;
    }
  }
  emit('confirm', {
    material: props.material,
    locations: selectedLocations.value.map((row) => ({ ...row, recommendedQty: Number(row.recommendedQty ?? 0) })),
    recommendedLocations: recommendedRows.value,
    demandInventoryQty: demandInventoryQty.value,
    overrideReason: isOverride.value ? overrideReason.value.trim() : undefined
  });
  handleClose();
};

/** 关闭库位弹窗并重置选择状态 */
const handleClose = () => {
  visible.value = false;
  selectedLocations.value = [];
  selectedLeafKeys.value = new Set();
  overrideReason.value = '';
  tableRef.value?.clearSelection();
};
</script>

<style scoped>
.location-detail-dialog {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.material-info {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.demand-qty {
  font-weight: 600;
  color: var(--el-color-primary);
}

.tip-alert {
  margin-bottom: 0;
}

.recommend-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recommend-summary-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.recommend-picks {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background: var(--el-fill-color-blank);
  overflow: hidden;
}

.recommend-pick-head,
.recommend-pick-row {
  display: grid;
  grid-template-columns: 96px 120px 1fr;
  column-gap: 8px;
  align-items: center;
  padding: 4px 10px;
}

.recommend-pick-row.is-other-line {
  background: #fdf6ec;
}

.recommend-pick-head {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.recommend-pick-row {
  font-size: 12px;
  color: var(--el-text-color-primary);
  border-bottom: 1px dashed var(--el-border-color-extra-light);

  &:last-child {
    border-bottom: none;
  }
}

.pick-col {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pick-loc {
  font-family: var(--el-font-family-monospace, ui-monospace, monospace);
  color: var(--el-color-primary);
}

.pick-batch {
  color: var(--el-text-color-regular);
}

.pick-qty {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.qty-tag {
  flex-shrink: 0;
  padding: 0 4px;
  border-radius: 2px;
  font-size: 10px;
  font-style: normal;
  font-weight: 500;
  line-height: 16px;
}

.qty-tag-allocated {
  color: #e6a23c;
  background: #faecd8;
}

.qty-tag-hint {
  color: #f56c6c;
  background: #fde2e2;
}

.pick-unit {
  margin-left: 2px;
  font-size: 11px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.recommend-reason {
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-color-warning);
}

.distribution-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.header-title {
  font-size: 15px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.recommended-qty {
  color: var(--el-color-success);
  font-weight: 600;
}

.pick-qty-input {
  width: 110px;
}

.shortage-hint {
  color: var(--el-color-warning);
}

.override-reason {
  margin-top: 4px;
}

.reason-label {
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.required {
  color: var(--el-color-danger);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  width: 100%;
}

.selection-summary {
  margin-right: auto;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.text-muted {
  color: var(--el-text-color-placeholder);
}
</style>
