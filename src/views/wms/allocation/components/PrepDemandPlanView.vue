<template>
  <el-card shadow="never" class="prep-demand-view">
    <template #header>
      <div class="detail-header">
        <div class="header-title">
          <span>备料需求清单</span>
          <span v-if="demand" class="plan-meta">{{ demand.demandNo }} · {{ demand.workOrderCount }} 个工单 · 齐套率 {{ kitRatePercent }}%</span>
        </div>
        <div class="header-actions">
          <el-button size="small" @click="$emit('refresh')"><el-icon><Refresh /></el-icon>刷新</el-button>
          <el-button v-if="demand?.issueId" type="success" size="small" @click="$emit('go-issue')">去领料</el-button>
        </div>
      </div>
    </template>

    <el-card v-if="workOrderRows.length" shadow="never" class="work-order-list-card">
      <template #header>
        <div class="section-header">
          <span>工单列表</span>
          <el-tag type="info" size="small">{{ workOrderRows.length }} 个</el-tag>
        </div>
      </template>
      <el-table :data="workOrderRows" border stripe size="small" max-height="260">
        <el-table-column prop="workOrderNo" label="工单号" min-width="120" />
        <el-table-column label="产品" min-width="160">
          <template #default="{ row }">
            <div class="material-code">{{ row.item || '-' }}</div>
            <div v-if="row.itemDesc" class="material-name">{{ row.itemDesc }}</div>
          </template>
        </el-table-column>
        <el-table-column label="计划数量" width="100" align="right">
          <template #default="{ row }">{{ formatQtyWithUnit(row.plannedQty, row.unit) }}</template>
        </el-table-column>
        <el-table-column label="齐套率" width="80" align="right">
          <template #default="{ row }">{{ formatKitRate(row.kitRate) }}%</template>
        </el-table-column>
        <el-table-column prop="totalRequired" label="待发" width="80" align="right" />
        <el-table-column prop="totalAvailable" label="可用" width="80" align="right" />
        <el-table-column prop="totalShortage" label="缺料" width="80" align="right" />
        <el-table-column prop="shortageLines" label="缺料行" width="72" align="center" />
        <el-table-column label="库存检查" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.checkPassed ? 'success' : 'warning'" size="small">
              {{ row.checkPassed ? '通过' : '未通过' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <div v-if="hasWarehouse261Tasks" class="warehouse261-toolbar">
      <span class="warehouse261-label">261 扣料操作</span>
      <el-button v-if="autoRows.length" type="success" :loading="submittingAuto" @click="submitAutoIssue">
        自动仓 · 261 扣账（{{ autoRows.length }}条）
      </el-button>
      <el-button v-if="lineRows.length" type="warning" :loading="submittingLine" @click="submitLineIssue">
        线边仓 · 待物料员 261 扣料（{{ lineRows.length }}条）
      </el-button>
      <el-button v-if="canSubmitCombined261" type="primary" :loading="submittingCombined" @click="submitCombinedIssue">
        自动仓+线边仓 · 261 合并扣料（{{ combined261RowCount }}条）
      </el-button>
    </div>

    <div v-loading="loading" class="classified-sections">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-card shadow="never" class="section-card">
            <template #header>
              <div class="section-header">
                <span>自动仓 · 261 扣账</span>
                <div class="section-tags">
                  <el-tag v-if="autoRows.length" type="warning" size="small">待执行</el-tag>
                  <el-tag type="success" size="small">{{ autoRows.length }} 条</el-tag>
                </div>
              </div>
            </template>
            <p v-if="autoRows.length" class="section-hint">待执行 261 扣料，可使用上方「自动仓 · 261 扣账」按钮扣料。</p>
            <el-table v-if="autoRows.length" :data="autoRows" border stripe size="small" max-height="320">
              <el-table-column prop="workOrderNo" label="工单号" width="120" />
              <el-table-column label="物料" min-width="150">
                <template #default="{ row }">
                  <div class="material-code">{{ row.materialCode }}</div>
                  <div class="material-name">{{ row.materialName }}</div>
                </template>
              </el-table-column>
              <el-table-column label="本次备料数量" min-width="110" align="right">
                <template #default="{ row }">{{ formatQtyWithUnit(row.prepQty, row.inventoryUnit) }}</template>
              </el-table-column>
              <prep-demand-inventory-columns :rows="autoRows" />
              <el-table-column prop="warehouseCode" label="仓别" width="90" />
              <el-table-column prop="locationCode" label="库位" min-width="100" />
              <prep-demand-location-source-column show-remark :rows="autoRows" />
            </el-table>
            <el-empty v-else description="暂无自动仓需求" :image-size="56" />
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card shadow="never" class="section-card">
            <template #header>
              <div class="section-header">
                <span>线边仓 · 待物料员 261 扣料</span>
                <div class="section-tags">
                  <el-tag v-if="lineRows.length" type="warning" size="small">待执行</el-tag>
                  <el-tag type="warning" size="small">{{ lineRows.length }} 条</el-tag>
                </div>
              </div>
            </template>
            <p v-if="lineRows.length" class="section-hint">待物料员执行 261 扣料，可使用上方「线边仓 · 261 扣料」或合并扣料按钮。</p>
            <el-table v-if="lineRows.length" :data="lineRows" border stripe size="small" max-height="320">
              <el-table-column prop="workOrderNo" label="工单号" width="120" />
              <el-table-column label="物料" min-width="150">
                <template #default="{ row }">
                  <div class="material-code">{{ row.materialCode }}</div>
                  <div class="material-name">{{ row.materialName }}</div>
                </template>
              </el-table-column>
              <el-table-column label="本次备料数量" min-width="110" align="right">
                <template #default="{ row }">{{ formatQtyWithUnit(row.prepQty, row.inventoryUnit) }}</template>
              </el-table-column>
              <prep-demand-inventory-columns :rows="lineRows" />
              <el-table-column prop="warehouseCode" label="仓别" width="90" />
              <el-table-column prop="locationCode" label="库位" min-width="100" />
              <prep-demand-location-source-column show-remark :rows="lineRows" />
            </el-table>
            <el-empty v-else description="暂无线边仓需求" :image-size="56" />
          </el-card>
        </el-col>

        <el-col :span="24" class="section-col-full">
          <el-card shadow="never" class="section-card">
            <template #header>
              <div class="section-header">
                <span>平面仓 · 仓库备货</span>
                <el-tag type="primary" size="small">{{ flatRows.length }} 条</el-tag>
              </div>
            </template>
            <p v-if="flatRows.length" class="section-hint">按仓别分组，由仓库按 FIFO 推荐库位备货。</p>
            <template v-if="flatWarehouseGroups.length">
              <div v-for="group in flatWarehouseGroups" :key="group.warehouseCode" class="warehouse-group">
                <div class="warehouse-group-title">
                  <span>仓别：{{ group.warehouseCode }}</span>
                  <el-tag type="info" size="small">{{ group.count }} 条</el-tag>
                </div>
                <el-table :data="group.items" border stripe size="small" max-height="260">
                  <el-table-column prop="workOrderNo" label="工单号" width="120" />
                  <el-table-column label="物料" min-width="150">
                    <template #default="{ row }">
                      <div class="material-code">{{ row.materialCode }}</div>
                      <div class="material-name">{{ row.materialName }}</div>
                    </template>
                  </el-table-column>
                  <el-table-column label="本次备料数量" min-width="110" align="right">
                    <template #default="{ row }">{{ formatQtyWithUnit(row.prepQty, row.inventoryUnit) }}</template>
                  </el-table-column>
                  <prep-demand-inventory-columns :rows="group.items" />
                  <el-table-column prop="locationCode" label="库位" width="100" />
                  <prep-demand-location-source-column show-remark :rows="group.items" />
                  <el-table-column prop="batchCode" label="批次" width="110" />
                </el-table>
              </div>
            </template>
            <el-empty v-else description="暂无平面仓需求" :image-size="56" />
          </el-card>
        </el-col>

        <el-col :span="24" class="section-col-full">
          <el-card shadow="never" class="section-card shortage-card">
            <template #header>
              <div class="section-header">
                <span>缺料</span>
                <el-tag type="danger" size="small">{{ shortageRows.length }} 条</el-tag>
              </div>
            </template>
            <p v-if="shortageRows.length" class="section-hint">缺料行已纳入备料计划，到料后可通知领料。</p>
            <el-table v-if="shortageRows.length" :data="shortageRows" border stripe size="small" max-height="280">
              <el-table-column prop="workOrderNo" label="工单号" width="120" />
              <el-table-column label="物料" min-width="150">
                <template #default="{ row }">
                  <div class="material-code">{{ row.materialCode }}</div>
                  <div class="material-name">{{ row.materialName }}</div>
                </template>
              </el-table-column>
              <el-table-column label="BOM需求数量" min-width="120" align="right">
                <template #default="{ row }">{{ formatQtyWithUnit(row.bomComponentQty, row.inventoryUnit) }}</template>
              </el-table-column>
              <el-table-column label="本次备料数量" min-width="120" align="right">
                <template #default="{ row }">{{ formatQtyWithUnit(row.prepQty, row.inventoryUnit) }}</template>
              </el-table-column>
              <el-table-column label="缺料数量" min-width="110" align="right">
                <template #default="{ row }">
                  <span class="text-danger">{{ formatQtyWithUnit(row.shortageQty, row.inventoryUnit) }}</span>
                </template>
              </el-table-column>
              <prep-demand-inventory-columns :rows="shortageRows" />
            </el-table>
            <el-empty v-else description="暂无缺料需求" :image-size="56" />
          </el-card>
        </el-col>
      </el-row>

      <el-empty v-if="!loading && !displayRows.length" description="暂无备料明细" />

      <el-collapse v-if="displayRows.length" v-model="allDetailOpen" class="all-detail-collapse">
        <el-collapse-item :title="allDetailTitle" name="all">
          <el-table :data="displayRows" border stripe size="small" max-height="360">
            <el-table-column prop="workOrderNo" label="工单号" width="120" />
            <el-table-column label="物料" min-width="140">
              <template #default="{ row }">
                <div class="material-code">{{ row.materialCode }}</div>
                <div class="material-name">{{ row.materialName }}</div>
              </template>
            </el-table-column>
            <el-table-column label="本次备料数量" min-width="110" align="right">
              <template #default="{ row }">{{ formatPrepQtyWithUnit(row) }}</template>
            </el-table-column>
            <prep-demand-inventory-columns :rows="displayRows" />
            <el-table-column prop="warehouseCode" label="仓别" width="90" />
            <el-table-column prop="locationCode" label="库位" width="100" />
            <prep-demand-location-source-column show-remark :rows="displayRows" />
            <el-table-column prop="batchCode" label="批次" width="110" />
          </el-table>
        </el-collapse-item>
      </el-collapse>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Refresh } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { WorkOrderPrepDemandVO } from '@/api/wms/workOrderPrepDemand/types';
import type { MaterialDemandDetailRow, WarehouseRouteContext, WorkOrderMaterialIssueLine } from '@/api/wms/allocation/types';
import { executeAutoWarehouseIssue, loadWarehouseRouteContext } from '@/api/wms/allocation/index';
import { useUserStore } from '@/store/modules/user';
import {
  build261IssueItemsFromDisplayRows,
  flattenPrepDemandDisplayRows,
  groupFlatRowsByWarehouse,
  removeDisplayRowsByRoutes,
  resolvePrepDemandWorkOrders,
  type PrepDemand261Route,
  type PrepDemandDisplayRow
} from '@/views/wms/workOrderPrepDemand/utils/prepDemandPlan';
import { formatKitRate } from '@/views/wms/workOrderPrepDemand/utils/prepDemandStatus';
import PrepDemandInventoryColumns from './PrepDemandInventoryColumns.vue';
import PrepDemandLocationSourceColumn from './PrepDemandLocationSourceColumn.vue';

interface Props {
  demand: WorkOrderPrepDemandVO;
  locationHints?: MaterialDemandDetailRow[];
  issueLineHints?: Array<WorkOrderMaterialIssueLine & { workOrderNo: string }>;
  materialUserCode?: string;
  materialUserName?: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['refresh', 'go-issue']);

const userStore = useUserStore();
const loading = ref(false);
const movementType = ref('261');
const submittingAuto = ref(false);
const submittingLine = ref(false);
const submittingCombined = ref(false);
const routeCtx = ref<WarehouseRouteContext>({ autoWarehouseCodes: [], lineSideWarehouseCodes: [] });
const displayRows = ref<PrepDemandDisplayRow[]>([]);
const allDetailOpen = ref<string[]>([]);
const workOrderRows = computed(() => {
  const resolved = resolvePrepDemandWorkOrders(props.demand);
  if (resolved.length) return resolved;
  const map = new Map<string, import('@/api/wms/workOrderPrepDemand/types').PrepDemandWoVO>();
  displayRows.value.forEach((row) => {
    const woNo = String(row.workOrderNo ?? '').trim();
    if (!woNo || map.has(woNo)) return;
    map.set(woNo, { workOrderNo: woNo });
  });
  return [...map.values()];
});

const resolvedMaterialUserCode = computed(() => props.materialUserCode || userStore.name || undefined);
const resolvedMaterialUserName = computed(() => props.materialUserName || userStore.nickname || userStore.name || undefined);

const reloadRows = () => {
  displayRows.value = flattenPrepDemandDisplayRows(
    props.demand,
    routeCtx.value,
    props.locationHints,
    props.issueLineHints
  );
};

onMounted(async () => {
  loading.value = true;
  try {
    routeCtx.value = await loadWarehouseRouteContext();
    reloadRows();
  } finally {
    loading.value = false;
  }
});

watch(() => [props.demand, props.locationHints, props.issueLineHints] as const, () => reloadRows(), { deep: true });

const autoRows = computed(() => displayRows.value.filter((r) => r.warehouseRoute === 'AUTO'));
const lineRows = computed(() => displayRows.value.filter((r) => r.warehouseRoute === 'LINE'));
const flatRows = computed(() => displayRows.value.filter((r) => r.warehouseRoute === 'FLAT'));
const shortageRows = computed(() =>
  displayRows.value.filter(
    (r) => r.lineType === 'SHORTAGE' 
  )
);
const flatWarehouseGroups = computed(() => groupFlatRowsByWarehouse(flatRows.value));
const hasWarehouse261Tasks = computed(() => autoRows.value.length > 0 || lineRows.value.length > 0);
const canSubmitCombined261 = computed(() => autoRows.value.length > 0 && lineRows.value.length > 0);
const combined261RowCount = computed(() => autoRows.value.length + lineRows.value.length);

const kitRatePercent = computed(() => {
  const rate = Number(props.demand.kitRate ?? 0);
  return rate > 1 ? rate.toFixed(1) : (rate * 100).toFixed(1);
});

const allDetailTitle = computed(
  () => '全部明细 (' + displayRows.value.length + '条)'
);

const formatQtyWithUnit = (qty?: number, unit?: string) => {
  if (qty === undefined || qty === null || Number.isNaN(Number(qty))) return '-';
  const n = Number(qty);
  const u = String(unit ?? '').trim();
  return u ? `${n} ${u}` : String(n);
};

const formatPrepQtyWithUnit = (row: PrepDemandDisplayRow) => {
  const unit = row.warehouseRoute === 'SHORTAGE' || row.lineType === 'SHORTAGE' ? row.unit : row.inventoryUnit;
  return formatQtyWithUnit(row.prepQty, unit);
};

const submitWarehouseIssue = async (
  routeLabel: string,
  routes: PrepDemand261Route[],
  warehouseCodes: string[]
) => {
  const items = build261IssueItemsFromDisplayRows(displayRows.value, routes);
  if (!items.length) {
    ElMessage.warning(`没有可扣料的${routeLabel}需求`);
    return;
  }
  const workOrderNos = [...new Set(items.map((i) => i.workOrderNo))];
  await ElMessageBox.confirm(
    `将对 ${items.length} 条${routeLabel}库位需求执行 ${movementType.value} 扣料，是否继续？`,
    `确认 ${movementType.value} 扣料`,
    { type: 'warning' }
  );
  const res = await executeAutoWarehouseIssue({
    workOrderNos,
    materialIssueItems: items,
    warehouseCodes,
    movementType: movementType.value,
    materialUserCode: resolvedMaterialUserCode.value,
    materialUserName: resolvedMaterialUserName.value
  });
  if (res.code === 200) {
    ElMessage.success(`${movementType.value} 扣料成功`);
    displayRows.value = removeDisplayRowsByRoutes(displayRows.value, routes);
    emit('refresh');
  }
};

const submitAutoIssue = async () => {
  submittingAuto.value = true;
  try {
    await submitWarehouseIssue('自动仓', ['AUTO'], routeCtx.value.autoWarehouseCodes);
  } catch {
    /* cancelled */
  } finally {
    submittingAuto.value = false;
  }
};

const submitLineIssue = async () => {
  submittingLine.value = true;
  try {
    await submitWarehouseIssue('线边仓', ['LINE'], routeCtx.value.lineSideWarehouseCodes);
  } catch {
    /* cancelled */
  } finally {
    submittingLine.value = false;
  }
};

const submitCombinedIssue = async () => {
  const items = build261IssueItemsFromDisplayRows(displayRows.value, ['AUTO', 'LINE']);
  if (!items.length) {
    ElMessage.warning('没有可扣料的自动仓或线边仓需求');
    return;
  }
  const warehouseCodes = [...new Set([...routeCtx.value.autoWarehouseCodes, ...routeCtx.value.lineSideWarehouseCodes])];
  submittingCombined.value = true;
  try {
    const workOrderNos = [...new Set(items.map((i) => i.workOrderNo))];
    await ElMessageBox.confirm(
      `将对 ${items.length} 条自动仓+线边仓需求合并执行 ${movementType.value} 扣料，是否继续？`,
      `确认 ${movementType.value} 扣料`,
      { type: 'warning' }
    );
    const res = await executeAutoWarehouseIssue({
      workOrderNos,
      materialIssueItems: items,
      warehouseCodes,
      movementType: movementType.value,
      materialUserCode: resolvedMaterialUserCode.value,
      materialUserName: resolvedMaterialUserName.value
    });
    if (res.code === 200) {
      ElMessage.success(`${movementType.value} 扣料成功`);
      displayRows.value = removeDisplayRowsByRoutes(displayRows.value, ['AUTO', 'LINE']);
      emit('refresh');
    }
  } catch {
    /* cancelled */
  } finally {
    submittingCombined.value = false;
  }
};
</script>

<style scoped>
.prep-demand-view { border: none; }
.detail-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.header-title { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.plan-meta { font-size: 13px; color: var(--el-text-color-secondary); font-weight: normal; }
.header-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.work-order-list-card { margin-bottom: 16px; }
.warehouse261-toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; padding: 12px 14px; border-radius: 8px; background: var(--el-fill-color-light); }
.warehouse261-label { font-size: 13px; font-weight: 600; color: var(--el-text-color-regular); margin-right: 4px; }
.classified-sections { min-height: 120px; }
.section-card { margin-bottom: 0; }
.section-col-full { margin-top: 16px; }
.section-header { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.section-tags { display: flex; gap: 6px; align-items: center; }
.section-hint { margin: 0 0 10px; font-size: 12px; color: var(--el-text-color-secondary); }
.warehouse-group { margin-bottom: 14px; }
.warehouse-group:last-child { margin-bottom: 0; }
.warehouse-group-title { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-weight: 600; font-size: 13px; }
.shortage-card { border-color: var(--el-color-danger-light-7); }
.all-detail-collapse { margin-top: 16px; }
.material-code { font-weight: 600; }
.material-name { font-size: 12px; color: var(--el-text-color-secondary); }
.unit { font-size: 12px; color: var(--el-text-color-secondary); margin-left: 4px; }
.text-muted { color: var(--el-text-color-secondary); }
.text-danger { color: var(--el-color-danger); font-weight: 600; }
</style>
