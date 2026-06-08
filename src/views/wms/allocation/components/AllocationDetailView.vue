<template>
  <el-card>
    <template #header>
      <div class="detail-header">
        <div class="header-title">
          <span>备料清单</span>
          <span v-if="plan" class="plan-meta">
            {{ plan.planNo }} · {{ plan.workOrderCount }} 个工单 · 齐套率 {{ kitRatePercent }}%
          </span>
        </div>
        <div class="header-actions">
          <el-button size="small" @click="exportDetails">
            <el-icon><Download /></el-icon>导出
          </el-button>
          <el-button v-if="plan.planStatus === 'DRAFT'" type="success" size="small" @click="$emit('confirm')">
            确认备料
          </el-button>
          <el-button type="primary" size="small" @click="$emit('execute')" :disabled="plan.planStatus !== 'CONFIRMED'">
            <el-icon><Check /></el-icon>执行发料
          </el-button>
          <el-button v-if="plan.planStatus === 'EXECUTING' || plan.planStatus === 'COMPLETED'" type="success" size="small" @click="$emit('go-issue')">
            去领料
          </el-button>
        </div>
      </div>
    </template>

    <el-tabs v-model="activeTab" class="list-tabs">
      <!-- 清单一：所有工单明细 -->
      <el-tab-pane label="工单明细" name="orders">
        <p class="tab-desc">各工单的拣货明细，含批次与库位。</p>
        <el-table :data="orderDetailRows" border stripe size="small" max-height="480" :default-sort="{ prop: 'workOrderNo', order: 'ascending' }">
          <el-table-column prop="workOrderNo" label="工单号" width="130" fixed sortable />
          <el-table-column label="物料" min-width="160">
            <template #default="{ row }">
              <div class="material-info">
                <div class="material-code">{{ row.materialCode }}</div>
                <div class="material-name">{{ row.materialName }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="需求 / 分配" width="130" align="right">
            <template #default="{ row }">
              <span class="quantity">{{ row.allocatedQuantity }} / {{ row.requiredQuantity }}</span>
              <span v-if="row.unit" class="unit">{{ row.unit }}</span>
              <el-tag v-if="row.allocatedQuantity < row.requiredQuantity" type="warning" size="small" class="short-tag">缺料</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="batchCode" label="批次" width="120" show-overflow-tooltip />
          <el-table-column prop="locationCode" label="库位" width="100" />
          <el-table-column label="仓别" width="100">
            <template #default="{ row }">{{ row.warehouseCode || row.areaCode || '-' }}</template>
          </el-table-column>
          <el-table-column prop="pickSequence" label="拣货序" width="80" align="center" sortable />
          <el-table-column label="生产日期" width="110">
            <template #default="{ row }">{{ formatDate(row.productionDate) }}</template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 清单二：备料清单（物料 / 仓别聚合） -->
      <el-tab-pane label="备料清单" name="picking">
        <div class="picking-toolbar">
          <span class="tab-desc">现场备料汇总，可按物料或仓别查看。</span>
          <el-radio-group v-model="aggregateMode" size="small">
            <el-radio-button value="material">按物料聚合</el-radio-button>
            <el-radio-button value="warehouse">按仓别聚合</el-radio-button>
          </el-radio-group>
        </div>
        <div class="picking-filters">
          <el-input
            v-model="materialKeyword"
            placeholder="搜索物料编码 / 名称"
            clearable
            class="filter-input"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-input
            v-model="warehouseKeyword"
            placeholder="搜索仓别"
            clearable
            class="filter-input"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <span v-if="pickingFilterActive" class="filter-hint">
            {{ aggregateMode === 'material' ? '物料' : '仓别' }}视图 · 显示 {{ pickingResultCount }} / {{ pickingTotalCount }} 条
          </span>
        </div>

        <el-table v-if="aggregateMode === 'material'" :data="filteredMaterialPickingRows" border stripe size="small" max-height="480">
          <el-table-column prop="materialCode" label="物料编码" width="130" fixed />
          <el-table-column prop="materialName" label="物料描述" min-width="150" show-overflow-tooltip />
          <el-table-column label="备料数量" width="120" align="right">
            <template #default="{ row }">
              {{ row.totalAllocated }} / {{ row.totalRequired }}
              <span v-if="row.unit" class="unit">{{ row.unit }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="shortage" label="缺料" width="80" align="right">
            <template #default="{ row }">
              <span :class="{ 'text-danger': row.shortage > 0 }">{{ row.shortage > 0 ? row.shortage : '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="workOrderNos" label="涉及工单" min-width="160">
            <template #default="{ row }">
              <el-tag v-for="no in row.workOrderNos" :key="no" size="small" class="wo-tag">{{ no }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="batchCount" label="批次数" width="72" align="center" />
          <el-table-column prop="locationCount" label="库位数" width="72" align="center" />
          <el-table-column label="仓别" min-width="100" show-overflow-tooltip>
            <template #default="{ row }">{{ row.warehouseLabels.join('、') || '-' }}</template>
          </el-table-column>
        </el-table>

        <el-table
          v-else
          :data="filteredWarehousePickingRows"
          border
          stripe
          size="small"
          max-height="480"
          row-key="warehouseKey"
          :expand-row-keys="expandedWarehouseKeys"
          @expand-change="onWarehouseExpand"
        >
          <el-table-column type="expand">
            <template #default="{ row }">
              <el-table :data="row.materials" border size="small" class="nested-table">
                <el-table-column prop="materialCode" label="物料编码" width="130" />
                <el-table-column prop="materialName" label="物料描述" min-width="140" show-overflow-tooltip />
                <el-table-column label="备料数量" width="120" align="right">
                  <template #default="{ row: m }">
                    {{ m.totalAllocated }} / {{ m.totalRequired }}
                    <span v-if="m.unit" class="unit">{{ m.unit }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="locationCount" label="库位" width="64" align="center" />
                <el-table-column prop="batchCount" label="批次" width="64" align="center" />
              </el-table>
            </template>
          </el-table-column>
          <el-table-column prop="warehouseLabel" label="仓别" min-width="120" />
          <el-table-column prop="materialCount" label="物料种数" width="90" align="center" />
          <el-table-column label="备料总量" width="120" align="right">
            <template #default="{ row }">{{ row.totalAllocated }} / {{ row.totalRequired }}</template>
          </el-table-column>
          <el-table-column prop="locationCount" label="拣货库位" width="90" align="center" />
          <el-table-column prop="workOrderCount" label="工单数" width="80" align="center" />
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Download, Check, Search } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import type { AllocationPlanVO, AllocationDetailVO } from '@/api/wms/allocation/types';

type AggregateMode = 'material' | 'warehouse';

interface Props {
  plan: AllocationPlanVO;
  details: AllocationDetailVO[];
}

const props = defineProps<Props>();
defineEmits(['execute', 'go-issue', 'confirm']);

const activeTab = ref('orders');
const aggregateMode = ref<AggregateMode>('material');
const expandedWarehouseKeys = ref<string[]>([]);
const materialKeyword = ref('');
const warehouseKeyword = ref('');

function normKeyword(kw: string) {
  return kw.trim().toLowerCase();
}

function matchesMaterial(row: { materialCode: string; materialName: string }, kw: string) {
  if (!kw) return true;
  return row.materialCode.toLowerCase().includes(kw) || row.materialName.toLowerCase().includes(kw);
}

function matchesWarehouseLabel(label: string, key: string, kw: string) {
  if (!kw) return true;
  return label.toLowerCase().includes(kw) || key.toLowerCase().includes(kw);
}

function matchesWarehouseLabels(labels: string[], kw: string) {
  if (!kw) return true;
  return labels.some((l) => l.toLowerCase().includes(kw));
}

const orderDetailRows = computed(() =>
  [...props.details].sort((a, b) => {
    const wo = a.workOrderNo.localeCompare(b.workOrderNo);
    if (wo !== 0) return wo;
    return (a.pickSequence ?? 0) - (b.pickSequence ?? 0);
  })
);

const kitRatePercent = computed(() => {
  const req = props.details.reduce((s, d) => s + d.requiredQuantity, 0);
  const alloc = props.details.reduce((s, d) => s + d.allocatedQuantity, 0);
  return req > 0 ? ((alloc / req) * 100).toFixed(1) : '100.0';
});

interface MaterialAggRow {
  materialCode: string;
  materialName: string;
  totalRequired: number;
  totalAllocated: number;
  shortage: number;
  unit: string;
  workOrderNos: string[];
  batchCount: number;
  locationCount: number;
  warehouseLabels: string[];
}

const materialPickingRows = computed((): MaterialAggRow[] => {
  const map = new Map<string, MaterialAggRow & { batches: Set<string>; locations: Set<string>; warehouses: Set<string>; orders: Set<string> }>();

  props.details.forEach((d) => {
    let row = map.get(d.materialCode);
    if (!row) {
      row = {
        materialCode: d.materialCode,
        materialName: d.materialName,
        totalRequired: 0,
        totalAllocated: 0,
        shortage: 0,
        unit: d.unit || '',
        workOrderNos: [],
        batchCount: 0,
        locationCount: 0,
        warehouseLabels: [],
        batches: new Set(),
        locations: new Set(),
        warehouses: new Set(),
        orders: new Set()
      };
      map.set(d.materialCode, row);
    }
    row.totalRequired += d.requiredQuantity;
    row.totalAllocated += d.allocatedQuantity;
    if (d.batchCode) row.batches.add(d.batchCode);
    if (d.locationCode) row.locations.add(d.locationCode);
    const wh = d.warehouseCode || d.areaCode;
    if (wh) row.warehouses.add(wh);
    row.orders.add(d.workOrderNo);
  });

  return [...map.values()]
    .map((r) => ({
      materialCode: r.materialCode,
      materialName: r.materialName,
      totalRequired: r.totalRequired,
      totalAllocated: r.totalAllocated,
      shortage: Math.max(0, r.totalRequired - r.totalAllocated),
      unit: r.unit,
      workOrderNos: [...r.orders].sort(),
      batchCount: r.batches.size,
      locationCount: r.locations.size,
      warehouseLabels: [...r.warehouses].sort()
    }))
    .sort((a, b) => a.materialCode.localeCompare(b.materialCode));
});

const filteredMaterialPickingRows = computed(() => {
  const mk = normKeyword(materialKeyword.value);
  const wk = normKeyword(warehouseKeyword.value);
  return materialPickingRows.value.filter(
    (row) => matchesMaterial(row, mk) && matchesWarehouseLabels(row.warehouseLabels, wk)
  );
});

interface WarehouseMaterialRow {
  materialCode: string;
  materialName: string;
  totalRequired: number;
  totalAllocated: number;
  unit: string;
  batchCount: number;
  locationCount: number;
}

interface WarehouseAggRow {
  warehouseKey: string;
  warehouseLabel: string;
  materialCount: number;
  totalRequired: number;
  totalAllocated: number;
  locationCount: number;
  workOrderCount: number;
  materials: WarehouseMaterialRow[];
}

function warehouseKeyOf(d: AllocationDetailVO) {
  return d.warehouseCode || d.areaCode || '__unknown__';
}

function warehouseLabelOf(key: string, sample?: AllocationDetailVO) {
  if (key === '__unknown__') return '未指定仓别';
  if (sample?.warehouseCode && sample?.areaCode && sample.warehouseCode !== sample.areaCode) {
    return `${sample.warehouseCode} / ${sample.areaCode}`;
  }
  return key;
}

const warehousePickingRows = computed((): WarehouseAggRow[] => {
  const whMap = new Map<
    string,
    {
      label: string;
      locations: Set<string>;
      orders: Set<string>;
      materials: Map<string, WarehouseMaterialRow & { batches: Set<string>; locations: Set<string> }>;
      totalRequired: number;
      totalAllocated: number;
    }
  >();

  props.details.forEach((d) => {
    const key = warehouseKeyOf(d);
    let wh = whMap.get(key);
    if (!wh) {
      wh = {
        label: warehouseLabelOf(key, d),
        locations: new Set(),
        orders: new Set(),
        materials: new Map(),
        totalRequired: 0,
        totalAllocated: 0
      };
      whMap.set(key, wh);
    }
    wh.totalRequired += d.requiredQuantity;
    wh.totalAllocated += d.allocatedQuantity;
    if (d.locationCode) wh.locations.add(d.locationCode);
    wh.orders.add(d.workOrderNo);

    let mat = wh.materials.get(d.materialCode);
    if (!mat) {
      mat = {
        materialCode: d.materialCode,
        materialName: d.materialName,
        totalRequired: 0,
        totalAllocated: 0,
        unit: d.unit || '',
        batchCount: 0,
        locationCount: 0,
        batches: new Set(),
        locations: new Set()
      };
      wh.materials.set(d.materialCode, mat);
    }
    mat.totalRequired += d.requiredQuantity;
    mat.totalAllocated += d.allocatedQuantity;
    if (d.batchCode) mat.batches.add(d.batchCode);
    if (d.locationCode) mat.locations.add(d.locationCode);
  });

  return [...whMap.entries()]
    .map(([warehouseKey, wh]) => ({
      warehouseKey,
      warehouseLabel: wh.label,
      materialCount: wh.materials.size,
      totalRequired: wh.totalRequired,
      totalAllocated: wh.totalAllocated,
      locationCount: wh.locations.size,
      workOrderCount: wh.orders.size,
      materials: [...wh.materials.values()]
        .map((m) => ({
          materialCode: m.materialCode,
          materialName: m.materialName,
          totalRequired: m.totalRequired,
          totalAllocated: m.totalAllocated,
          unit: m.unit,
          batchCount: m.batches.size,
          locationCount: m.locations.size
        }))
        .sort((a, b) => a.materialCode.localeCompare(b.materialCode))
    }))
    .sort((a, b) => a.warehouseLabel.localeCompare(b.warehouseLabel));
});

const filteredWarehousePickingRows = computed(() => {
  const mk = normKeyword(materialKeyword.value);
  const wk = normKeyword(warehouseKeyword.value);

  return warehousePickingRows.value
    .map((row) => {
      const materials = mk ? row.materials.filter((m) => matchesMaterial(m, mk)) : row.materials;
      return {
        ...row,
        materials,
        materialCount: materials.length
      };
    })
    .filter((row) => {
      const whHit = matchesWarehouseLabel(row.warehouseLabel, row.warehouseKey, wk);
      const matHit = !mk || row.materials.length > 0;
      return whHit && matHit;
    });
});

const pickingFilterActive = computed(
  () => !!materialKeyword.value.trim() || !!warehouseKeyword.value.trim()
);

const pickingTotalCount = computed(() =>
  aggregateMode.value === 'material' ? materialPickingRows.value.length : warehousePickingRows.value.length
);

const pickingResultCount = computed(() =>
  aggregateMode.value === 'material' ? filteredMaterialPickingRows.value.length : filteredWarehousePickingRows.value.length
);

const onWarehouseExpand = (row: WarehouseAggRow, expanded: boolean) => {
  if (expanded) {
    if (!expandedWarehouseKeys.value.includes(row.warehouseKey)) {
      expandedWarehouseKeys.value = [...expandedWarehouseKeys.value, row.warehouseKey];
    }
  } else {
    expandedWarehouseKeys.value = expandedWarehouseKeys.value.filter((k) => k !== row.warehouseKey);
  }
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  return dayjs(dateStr).format('YYYY/MM/DD');
};

const exportDetails = () => {
  ElMessage.info('导出功能开发中...');
};
</script>

<style scoped>
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.plan-meta {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  font-weight: normal;
}
.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tab-desc {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.picking-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}
.picking-toolbar .tab-desc {
  margin: 0;
}
.picking-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}
.filter-input {
  width: 220px;
}
.filter-hint {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.material-info {
  line-height: 1.4;
}
.material-code {
  font-weight: 600;
}
.material-name {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.quantity {
  margin-right: 4px;
}
.unit {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.short-tag {
  margin-left: 4px;
}
.wo-tag {
  margin: 2px 4px 2px 0;
}
.text-danger {
  color: var(--el-color-danger);
}
.nested-table {
  margin: 8px 12px 12px 48px;
}
</style>
