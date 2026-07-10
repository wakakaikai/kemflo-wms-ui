<template>
  <div class="p-2 shortage-task-page">
    <el-card shadow="never" class="analysis-card">
      <div class="analysis-toolbar">
        <el-button type="primary" :loading="analyzing" @click="analyzeInventory">一键分析库存状态</el-button>
        <span v-if="fulfillmentResult" class="analyzed-meta">已分析 {{ fulfillmentResult.summary.shortageLineCount }} 条</span>
        <div v-if="fulfillmentResult" class="status-tags">
          <el-tag type="success" effect="plain">充足 {{ fulfillmentResult.summary.fullLineCount }}</el-tag>
          <el-tag type="warning" effect="plain">部分缺料 {{ fulfillmentResult.summary.partialLineCount }}</el-tag>
          <el-tag type="danger" effect="plain">缺料 {{ fulfillmentResult.summary.noneLineCount }}</el-tag>
        </div>
      </div>
    </el-card>

    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="需求单号" prop="demandNo">
              <el-input v-model="queryParams.demandNo" placeholder="需求单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工单号" prop="workOrderNo">
              <el-input v-model="queryParams.workOrderNo" placeholder="工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="物料编码" prop="materialCode">
              <el-input v-model="queryParams.materialCode" placeholder="物料编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="never" class="section-card">
      <template #header>
        <div class="list-toolbar">
          <span class="section-title">缺料明细</span>
          <div class="list-toolbar-right">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:shortageTask:export']">导出</el-button>
            <right-toolbar v-model:showSearch="showSearch" @queryTable="getShortageList" />
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="lineList" border stripe>
        <el-table-column label="库存" width="52" align="center" fixed="left">
          <template #default="{ row }">
            <el-tooltip :content="inventoryStatusTooltip(row)" :disabled="!inventoryStatusTooltip(row)" placement="top">
              <inventory-status :material="getInventoryMaterial(row)" />
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="需求单号" align="center" prop="demandNo" min-width="140" fixed="left" show-overflow-tooltip />
        <el-table-column label="需求时间" align="center" prop="createTime" min-width="160" show-overflow-tooltip />
        <el-table-column label="工单号" align="center" prop="workOrderNo" min-width="120" show-overflow-tooltip />
        <el-table-column label="物料编码" align="center" prop="materialCode" min-width="120" show-overflow-tooltip />
        <el-table-column label="物料描述" align="left" prop="materialName" min-width="160" show-overflow-tooltip />
        <el-table-column label="库存标识" align="center" width="96">
          <template #default="{ row }">
            <dict-tag :options="wms_inventory_special_flag" :value="resolveRowInventoryFlag(row)" />
          </template>
        </el-table-column>
        <el-table-column label="缺料需求" align="right" width="96">
          <template #default="{ row }">
            <span class="shortage-qty">{{ formatQty(row.shortageQty) }}</span>
          </template>
        </el-table-column>
        <!--        <el-table-column label="待发数量" align="right" width="96">
          <template #default="{ row }">{{ formatQty(row.pendingQty) }}</template>
        </el-table-column>-->
        <el-table-column label="可用数量" align="right" width="96">
          <template #default="{ row }">{{ formatQty(resolveDisplayAvailableQty(row)) }}</template>
        </el-table-column>
        <el-table-column v-if="fulfillmentResult" label="缺料数量" align="right" width="96">
          <template #default="{ row }">
            <span :class="{ 'shortage-qty': Number(resolveDisplayRemainingQty(row) ?? 0) > 0 }">
              {{ formatQty(resolveDisplayRemainingQty(row)) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="单位" align="center" prop="unit" width="64" />
        <el-table-column label="库存信息" width="160">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openLocationRecommend(row)">系统推荐</el-button>
            <el-button type="primary" link size="small" @click="openLocationQuery(row)">查库存</el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="120" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.demandId" link type="primary" :loading="generatingLineId === row.id" :disabled="!canGenerateShortagePrep(fulfillmentResult?.lineMap, row)" @click="handleGeneratePrep(row)" v-hasPermi="['wms:allocationPlan:add']">生成备料需求</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getShortageList" />
    </el-card>

    <location-detail-dialog
      v-model="inventoryDialogVisible"
      :material="inventoryBomMaterial"
      :work-order-no="inventoryWorkOrderNo"
      :mode="inventoryDialogMode"
      :base-location-rows="inventoryDialogMode === 'recommend' ? inventoryBaseLocationRows : undefined"
      @confirm="onLocationConfirm"
    />

    <target-demand-location-dialog
      v-model="showTargetLocationDialog"
      :user-name="targetDemandUserName"
      :submitting="generatingLineId != null"
      @confirm="onTargetLocationConfirm"
    />
  </div>
</template>

<script setup name="ShortageTask" lang="ts">
import { computed, onMounted, ref, toRefs } from 'vue';
import { applyShortageFulfillmentLocationSelection, applyTargetDemandLocationToShortagePrepItems, buildShortageLineBomMaterial, buildShortageLineInventoryMaterial, buildShortageGeneratePrepItems, canGenerateShortagePrep, findShortagePrepItemsMissingTargetLocation, generateShortagePrep, lineStatusLabel, lineStatusTag, listShortageTaskDetail, loadShortageFulfillmentSimulation, normalizeShortageTaskLineListResponse, resolveShortageDemandMetaForLine, resolveShortageLineAllocatedQty, resolveShortageLineDisplayAvailableQty, resolveShortageLineDisplayRemainingQty, resolveShortageLineFulfillment, type ShortageFulfillmentLineResult, type ShortageFulfillmentSimulationResult, type ShortageTaskLineVO, type ShortageTaskQuery } from '@/api/wms/shortageTask';
import type { PrepDemandLineItem } from '@/api/wms/workOrderPrepDemand/types';
import type { MaterialLocationRow, WorkOrderBomVO } from '@/api/wms/allocation/types';
import InventoryApi, { normalizeMaterialInventoryResponse } from '@/api/wms/allocation/index';
import { resolvePrepRowInventoryFlag } from '@/api/wms/workOrderPrepDemand/index';
import LocationDetailDialog, { type LocationDialogMode } from '@/views/wms/allocation/components/LocationDetailDialog.vue';
import TargetDemandLocationDialog from '@/views/wms/allocation/components/TargetDemandLocationDialog.vue';
import type { TargetDemandLocationSelection } from '@/views/wms/allocation/components/TargetDemandLocationDialog.vue';
import InventoryStatus from '@/views/wms/allocation/components/InventoryStatus.vue';
import { ElMessage } from 'element-plus';
import { formatQty } from '@/utils/ruoyi';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_inventory_special_flag } = toRefs<any>(proxy?.useDict('wms_inventory_special_flag'));

const lineList = ref<ShortageTaskLineVO[]>([]);
const loading = ref(true);
const analyzing = ref(false);
const showSearch = ref(true);
const total = ref(0);
const generatingLineId = ref<number | string | null>(null);
const queryFormRef = ref<ElFormInstance>();
const fulfillmentResult = ref<ShortageFulfillmentSimulationResult | null>(null);
const inventoryDialogVisible = ref(false);
const inventoryDialogMode = ref<LocationDialogMode>('recommend');
const inventoryBomMaterial = ref<WorkOrderBomVO | null>(null);
const inventoryWorkOrderNo = ref('');
const activeShortageLine = ref<ShortageTaskLineVO | null>(null);
const materialLocationCache = ref(new Map<string, MaterialLocationRow[]>());
const showTargetLocationDialog = ref(false);
const pendingGenerateRow = ref<ShortageTaskLineVO | null>(null);
const pendingPrepItems = ref<PrepDemandLineItem[]>([]);

const targetDemandUserName = computed(() => {
  const row = pendingGenerateRow.value;
  return String(row?.materialUserCode || '').trim();
});

const inventoryBaseLocationRows = computed(() => {
  const material = inventoryBomMaterial.value;
  if (!material || inventoryDialogMode.value !== 'recommend') return undefined;
  if (material.checkInventoryRecommendedLocations?.length) {
    return material.checkInventoryRecommendedLocations;
  }
  const code = String(material.componentMaterial || '').trim();
  return code ? materialLocationCache.value.get(code) : undefined;
});

const queryParams = ref<ShortageTaskQuery>({
  pageNum: 1,
  pageSize: 100,
  demandNo: undefined,
  workOrderNo: undefined,
  materialCode: undefined,
  lineStatus: undefined
});

function resolveRowInventoryFlag(row: ShortageTaskLineVO) {
  return resolvePrepRowInventoryFlag(row);
}

function getInventoryMaterial(row: ShortageTaskLineVO): WorkOrderBomVO {
  return buildShortageLineInventoryMaterial(row, {
    fulfillment: getLineFulfillment(row),
    analyzed: !!fulfillmentResult.value
  });
}

function getLineFulfillment(row: ShortageTaskLineVO): ShortageFulfillmentLineResult | undefined {
  return resolveShortageLineFulfillment(fulfillmentResult.value?.lineMap, row.id);
}

function inventoryStatusTooltip(_row: ShortageTaskLineVO) {
  return undefined;
}

function resolveDisplayAvailableQty(row: ShortageTaskLineVO) {
  return resolveShortageLineDisplayAvailableQty(row, getLineFulfillment(row));
}

function resolveDisplayRemainingQty(row: ShortageTaskLineVO) {
  return resolveShortageLineDisplayRemainingQty(row, getLineFulfillment(row));
}

async function ensureMaterialLocations(materialCode: string): Promise<MaterialLocationRow[]> {
  const code = String(materialCode || '').trim();
  if (!code) return [];
  const cached = materialLocationCache.value.get(code);
  if (cached) return cached;
  const response = await InventoryApi.getMaterialLocations(code);
  if (response.code !== 200) return [];
  const rows = normalizeMaterialInventoryResponse(response.data);
  materialLocationCache.value.set(code, rows);
  return rows;
}

async function openLocationRecommend(row: ShortageTaskLineVO) {
  const fulfillment = getLineFulfillment(row);
  const recommendQty = Number(row.shortageQty ?? 0);
  if (recommendQty <= 0) {
    proxy?.$modal.msgWarning('缺料数量须大于 0');
    return;
  }
  activeShortageLine.value = row;
  inventoryBomMaterial.value = buildShortageLineBomMaterial(row, fulfillment);
  inventoryWorkOrderNo.value = String(row.workOrderNo || '');
  await ensureMaterialLocations(String(row.materialCode || ''));
  if (fulfillment && Number(inventoryBomMaterial.value?.effectiveAvailableQty ?? inventoryBomMaterial.value?.availableQty ?? 0) <= 0) {
    ElMessage.info('当前无可用库存');
  }
  inventoryDialogMode.value = 'recommend';
  inventoryDialogVisible.value = true;
}

function openLocationQuery(row: ShortageTaskLineVO) {
  activeShortageLine.value = row;
  inventoryBomMaterial.value = buildShortageLineBomMaterial(row, getLineFulfillment(row));
  inventoryWorkOrderNo.value = String(row.workOrderNo || '');
  inventoryDialogMode.value = 'query';
  inventoryDialogVisible.value = true;
}

function onLocationConfirm(payload: {
  material: WorkOrderBomVO | null;
  locations: MaterialLocationRow[];
  recommendedLocations: MaterialLocationRow[];
  overrideReason?: string;
}) {
  if (inventoryDialogMode.value !== 'recommend') return;
  const row = activeShortageLine.value;
  if (!row || !fulfillmentResult.value) return;
  const lineKey = String(row.id);
  const fulfillment = fulfillmentResult.value.lineMap[lineKey];
  if (!fulfillment) return;

  const updated = applyShortageFulfillmentLocationSelection(fulfillment, row, {
    locations: payload.locations,
    recommendedLocations: payload.recommendedLocations,
    overrideReason: payload.overrideReason
  });
  fulfillmentResult.value = {
    ...fulfillmentResult.value,
    lineMap: {
      ...fulfillmentResult.value.lineMap,
      [lineKey]: updated
    }
  };
  inventoryBomMaterial.value = buildShortageLineBomMaterial(row, updated);
  ElMessage.success(payload.overrideReason ? '库位选择已保存（已记录数量调整原因）' : payload.locations.length ? '库位选择已保存，可用数量已更新' : '已更新可用数量');
}

const getShortageList = async () => {
  loading.value = true;
  fulfillmentResult.value = null;
  try {
    const res = await listShortageTaskDetail(queryParams.value);
    const { rows, total: listTotal } = normalizeShortageTaskLineListResponse(res);
    lineList.value = rows;
    total.value = listTotal;
  } finally {
    loading.value = false;
  }
};

const analyzeInventory = async () => {
  if (!lineList.value.length) {
    proxy?.$modal.msgWarning('当前页无缺料明细');
    return;
  }
  analyzing.value = true;
  try {
    fulfillmentResult.value = await loadShortageFulfillmentSimulation({
      lines: lineList.value,
      query: {
        demandNo: queryParams.value.demandNo,
        workOrderNo: queryParams.value.workOrderNo,
        materialCode: queryParams.value.materialCode,
        lineStatus: queryParams.value.lineStatus
      }
    });
  } finally {
    analyzing.value = false;
  }
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getShortageList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.value.lineStatus = undefined;
  queryParams.value.pageNum = 1;
  getShortageList();
};

const submitGeneratePrep = async (row: ShortageTaskLineVO, prepItems: PrepDemandLineItem[]) => {
  generatingLineId.value = row.id;
  try {
    const res = await generateShortagePrep({
      demandLineId: row.id,
      prepItems
    });
    if (res.code !== 200) {
      proxy?.$modal.msgError(res.msg || '生成备料需求失败');
      return;
    }
    if (res.data?.success === false) {
      proxy?.$modal.msgError(res.data.message || '生成备料需求失败');
      return;
    }
    proxy?.$modal.msgSuccess(res.data?.message || '备料需求已生成');
    await getShortageList();
    if (lineList.value.length) {
      await analyzeInventory();
    }
  } finally {
    generatingLineId.value = null;
  }
};

const handleGeneratePrep = async (row: ShortageTaskLineVO) => {
  const fulfillment = getLineFulfillment(row);
  if (!fulfillment || fulfillment.poolAllocatedQty <= 0) {
    proxy?.$modal.msgWarning('请先一键分析库存，且当前行有可分配库存');
    return;
  }
  const prepItems = buildShortageGeneratePrepItems(
    row,
    fulfillment,
    resolveShortageDemandMetaForLine(fulfillmentResult.value, row)
  );
  if (!prepItems.length) {
    proxy?.$modal.msgWarning('无可生成的库位备料明细');
    return;
  }
  const allocatedQty = resolveShortageLineAllocatedQty(fulfillment);
  try {
    await proxy?.$modal.confirm(`确认为该缺料行生成库位备料？分配数量 ${formatQty(allocatedQty)}`);
  } catch {
    return;
  }
  if (findShortagePrepItemsMissingTargetLocation(prepItems).length > 0) {
    pendingGenerateRow.value = row;
    pendingPrepItems.value = prepItems;
    showTargetLocationDialog.value = true;
    return;
  }
  await submitGeneratePrep(row, prepItems);
};

const onTargetLocationConfirm = async (selection: TargetDemandLocationSelection) => {
  const row = pendingGenerateRow.value;
  if (!row) return;
  const prepItems = applyTargetDemandLocationToShortagePrepItems(pendingPrepItems.value, selection);
  if (findShortagePrepItemsMissingTargetLocation(prepItems).length > 0) {
    proxy?.$modal.msgWarning('请选择目标需求库位');
    return;
  }
  showTargetLocationDialog.value = false;
  pendingGenerateRow.value = null;
  pendingPrepItems.value = [];
  await submitGeneratePrep(row, prepItems);
};

const handleExport = () => {
  proxy?.download('wms/shortageTask/export', { ...queryParams.value }, `shortageTask_detail_${Date.now()}.xlsx`);
};

onMounted(() => {
  getShortageList();
});
</script>

<style scoped lang="scss">
.shortage-task-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.analysis-card {
  :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px 16px;
  }
}

.analysis-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.analyzed-meta {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.status-tags {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.analysis-hint {
  margin-bottom: 0;
}

.section-card {
  :deep(.el-card__header) {
    padding: 12px 16px;
  }
}

.section-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.list-toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.shortage-qty {
  color: var(--el-color-danger);
  font-weight: 600;
}

.text-muted {
  color: var(--el-text-color-placeholder);
}
</style>
