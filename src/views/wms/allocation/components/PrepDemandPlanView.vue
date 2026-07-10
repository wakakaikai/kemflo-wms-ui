<template>
  <el-card shadow="never" class="prep-demand-view">
    <template #header>
      <div class="detail-header">
        <div class="header-title">
          <span>备料需求清单</span>
          <dict-tag v-if="demand" :options="wms_prepare_demand_type" :value="demand.demandType" />
          <span v-if="demand" class="plan-meta">{{ demand.demandNo }} · {{ demand.workOrderCount }} 个工单 · 齐套率 {{ kitRatePercent }}%</span>
        </div>
        <div class="header-actions">
          <el-button v-if="showContinueOverPick && isOverPickDemand" type="primary" plain size="small" @click="emit('continue')">继续超领</el-button>
          <el-button size="small" @click="$emit('refresh')"
            ><el-icon><Refresh /></el-icon>刷新</el-button
          >
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
          <template #default="{ row }">{{ formatKitRate(resolvePrepDemandWoKitRate(row, demand)) }}%</template>
        </el-table-column>
        <el-table-column prop="totalRequired" label="待发" width="80" align="right" />
        <el-table-column prop="totalIssuedQty" label="已发" width="80" align="right" />
        <el-table-column prop="totalShortage" label="缺料" width="80" align="right" />
      </el-table>
    </el-card>

    <div v-if="showContinueOverPick && overPickTaskFinished" class="over-pick-finish-banner">
      <el-result icon="success" title="本单超领需求已提交" sub-title="261 扣料已完成；平面仓备货由仓库跟进。可继续填写下一张超领需求单，无需刷新页面。">
        <template #extra>
          <el-button type="primary" @click="emit('continue')">继续超领</el-button>
        </template>
      </el-result>
    </div>

    <div v-if="hasWarehouse261Tasks" class="warehouse261-toolbar">
      <span class="warehouse261-label">261 扣料操作</span>
      <el-button v-if="autoIssuableRows.length" type="success" :loading="submittingAuto" @click="submitAutoIssue"> 自动仓 · 261 扣账（{{ autoIssuableRows.length }}条） </el-button>
      <el-button v-if="lineIssuableRows.length" type="warning" :loading="submittingLine" @click="submitLineIssue"> 线边仓 · 待物料员 261 扣料（{{ lineIssuableRows.length }}条） </el-button>
      <el-button v-if="canSubmitCombined261" type="primary" :loading="submittingCombined" @click="submitCombinedIssue"> 自动仓+线边仓 · 261 合并扣料（{{ combined261RowCount }}条） </el-button>
    </div>

    <div v-if="resultMessage" class="result-alert">
      <el-alert show-icon :title="resultMessage" :type="resultStatus ? 'success' : 'error'" :closable="false">
        <template #icon>
          <Bell />
        </template>
      </el-alert>
    </div>

    <div v-loading="loading" class="classified-sections">
      <el-row :gutter="16">
        <el-col v-if="autoDisplayRows.length" :span="lineDisplayRows.length ? 12 : 24">
          <el-card shadow="never" class="section-card">
            <template #header>
              <div class="section-header">
                <span>自动仓 · 261 扣账</span>
                <div class="section-tags">
                  <el-tag v-if="autoIssuableRows.length" type="warning" size="small">待执行</el-tag>
                  <el-tag v-else type="success" size="small">已完成</el-tag>
                  <el-tag type="info" size="small">{{ autoDisplayRows.length }} 条</el-tag>
                </div>
              </div>
            </template>
            <p v-if="autoIssuableRows.length" class="section-hint">待执行 261 扣料，可使用上方「自动仓 · 261 扣账」按钮扣料。</p>
            <p v-else class="section-hint">261 扣料已完成。</p>
            <el-table :data="autoDisplayRows" border stripe size="small" max-height="320">
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
              <prep-demand-inventory-columns :rows="autoDisplayRows" />
              <prep-demand-over-pick-columns :rows="autoDisplayRows" :force-show="isOverPickDemand" />
              <el-table-column prop="warehouseCode" label="仓别" width="90" />
              <el-table-column prop="locationCode" label="库位" min-width="100" />
              <el-table-column label="状态" width="88" align="center">
                <template #default="{ row }">
                  <el-tag :type="lineStatusTag(row.lineStatus)" size="small">{{ lineStatusLabel(row.lineStatus) }}</el-tag>
                </template>
              </el-table-column>
              <prep-demand-location-source-column show-remark :rows="autoDisplayRows" />
            </el-table>
          </el-card>
        </el-col>

        <el-col v-if="lineDisplayRows.length" :span="autoDisplayRows.length ? 12 : 24">
          <el-card shadow="never" class="section-card">
            <template #header>
              <div class="section-header">
                <span>线边仓 · 待物料员 261 扣料</span>
                <div class="section-tags">
                  <el-tag v-if="lineIssuableRows.length" type="warning" size="small">待执行</el-tag>
                  <el-tag v-else type="success" size="small">已完成</el-tag>
                  <el-tag type="warning" size="small">{{ lineDisplayRows.length }} 条</el-tag>
                </div>
              </div>
            </template>
            <p v-if="lineIssuableRows.length" class="section-hint">待物料员执行 261 扣料，可使用上方「线边仓 · 261 扣料」或合并扣料按钮。</p>
            <p v-else class="section-hint">261 扣料已完成。</p>
            <el-table :data="lineDisplayRows" border stripe size="small" max-height="320">
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
              <prep-demand-inventory-columns :rows="lineDisplayRows" />
              <prep-demand-over-pick-columns :rows="lineDisplayRows" :force-show="isOverPickDemand" />
              <el-table-column prop="warehouseCode" label="仓别" width="90" />
              <el-table-column prop="locationCode" label="库位" min-width="100" />
              <el-table-column label="状态" width="88" align="center">
                <template #default="{ row }">
                  <el-tag :type="lineStatusTag(row.lineStatus)" size="small">{{ lineStatusLabel(row.lineStatus) }}</el-tag>
                </template>
              </el-table-column>
              <prep-demand-location-source-column show-remark :rows="lineDisplayRows" />
            </el-table>
          </el-card>
        </el-col>

        <el-col v-if="flatRows.length" :span="24" class="section-col-full">
          <el-card shadow="never" class="section-card">
            <template #header>
              <div class="section-header">
                <span>平面仓 · 仓库备货</span>
                <el-tag type="primary" size="small">{{ flatRows.length }} 条</el-tag>
              </div>
            </template>
            <p class="section-hint">按仓别分组，由仓库按 FIFO 推荐库位备货。</p>
            <div v-for="group in flatWarehouseGroups" :key="group.warehouseCode" class="warehouse-group">
              <div class="warehouse-group-title">
                <span>仓别：{{ group.warehouseCode }}</span>
                <el-tag type="info" size="small">{{ group.count }} 条</el-tag>
              </div>
              <el-table :data="group.items" border stripe size="small" max-height="260">
                <el-table-column prop="workOrderNo" label="工单号" width="120" />
                <el-table-column label="物料" min-width="260">
                  <template #default="{ row }">
                    <div class="material-code">{{ row.materialCode }}</div>
                    <div class="material-name">{{ row.materialName }}</div>
                  </template>
                </el-table-column>
                <el-table-column label="本次需求数量" min-width="110" align="right">
                  <template #default="{ row }">{{ formatQtyWithUnit(row.prepQty, row.inventoryUnit) }}</template>
                </el-table-column>
                <prep-demand-inventory-columns :rows="group.items" />
                <prep-demand-over-pick-columns :rows="group.items" :force-show="isOverPickDemand" />
                <el-table-column prop="locationCode" label="库位" min-width="100" />
                <el-table-column prop="batchCode" label="批次" min-width="110" />
                <el-table-column label="状态" width="88" align="center">
                  <template #default="{ row }">
                    <el-tag :type="lineStatusTag(row.lineStatus)" size="small">{{ lineStatusLabel(row.lineStatus) }}</el-tag>
                  </template>
                </el-table-column>
                <prep-demand-location-source-column show-remark :rows="group.items" />
              </el-table>
            </div>
          </el-card>
        </el-col>

        <el-col v-if="!hideShortageSection && shortageRows.length" :span="24" class="section-col-full">
          <el-card shadow="never" class="section-card shortage-card">
            <template #header>
              <div class="section-header">
                <span>缺料</span>
                <el-tag type="danger" size="small">{{ shortageRows.length }} 条</el-tag>
              </div>
            </template>
            <p class="section-hint">缺料行已纳入备料计划，到料后可通知领料。</p>
            <el-table :data="shortageRows" border stripe size="small" max-height="280">
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
          </el-card>
        </el-col>
      </el-row>

      <el-empty v-if="!loading && !displayRows.length" description="暂无备料明细" />

      <el-collapse v-if="displayRows.length" v-model="allDetailOpen" class="all-detail-collapse">
        <el-collapse-item :title="allDetailTitle" name="all">
          <el-table :data="allDetailRows" border stripe size="small" max-height="360">
            <el-table-column prop="workOrderNo" label="工单号" width="120" />
            <el-table-column label="物料" min-width="220">
              <template #default="{ row }">
                <div class="material-code">{{ row.materialCode }}</div>
                <div class="material-name">{{ row.materialName }}</div>
              </template>
            </el-table-column>
            <el-table-column label="本次备料数量" min-width="110" align="right">
              <template #default="{ row }">{{ formatQtyWithUnit(row.issueQty, row.inventoryUnit) }}</template>
            </el-table-column>
            <el-table-column label="实发数量" min-width="110" align="right">
              <template #default="{ row }">{{ formatQtyWithUnit(row.issuedQty, row.inventoryUnit) }}</template>
            </el-table-column>
            <prep-demand-inventory-columns :rows="allDetailRows" />
            <prep-demand-over-pick-columns :rows="allDetailRows" :force-show="isOverPickDemand" />
            <el-table-column prop="warehouseCode" label="仓别" width="90" />
            <el-table-column prop="locationCode" label="库位" width="100" />
            <el-table-column prop="batchCode" label="批次" width="110" />
            <el-table-column label="状态" width="88" align="center">
              <template #default="{ row }">
                <el-tag :type="lineStatusTag(row.lineStatus)" size="small">{{ lineStatusLabel(row.lineStatus) }}</el-tag>
              </template>
            </el-table-column>
            <prep-demand-location-source-column show-remark :rows="displayRows" />
          </el-table>
        </el-collapse-item>
      </el-collapse>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue';
import type { ComponentInternalInstance } from 'vue';
import { Bell, Refresh } from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';
import { HttpStatus } from '@/enums/RespEnum';
import type { WorkOrderPrepDemandVO } from '@/api/wms/workOrderPrepDemand/types';
import type { MaterialDemandDetailRow, WarehouseRouteContext, WorkOrderMaterialIssueLine } from '@/api/wms/allocation/types';
import { loadWarehouseRouteContext } from '@/api/wms/allocation/index';
import { buildPrepLocationRecIssueOutBoList, isIssuablePrepLocationRecRow, isPrepWarehouse261DisplayRow, lineStatusLabel, lineStatusTag, prepLocationRecIssueOut } from '@/api/wms/issueTask';
import { aggregateOverPickAllDetailRows, flattenPrepDemandDisplayRows, formatKitRate, groupFlatRowsByWarehouse, isOverPickPrepDemand, resolvePrepDemandWorkOrders, resolvePrepDemandKitRate, resolvePrepDemandWoKitRate, PREP_DEMAND_TYPE_DICT, type PrepDemand261Route, type PrepDemandDisplayRow } from '@/api/wms/workOrderPrepDemand/index';
import { formatQtyWithUnit } from '@/utils/ruoyi';
import { useUserStore } from '@/store/modules/user';
import PrepDemandInventoryColumns from './PrepDemandInventoryColumns.vue';
import PrepDemandLocationSourceColumn from './PrepDemandLocationSourceColumn.vue';
import PrepDemandOverPickColumns from './PrepDemandOverPickColumns.vue';

interface Props {
  demand: WorkOrderPrepDemandVO;
  locationHints?: MaterialDemandDetailRow[];
  issueLineHints?: Array<WorkOrderMaterialIssueLine & { workOrderNo: string }>;
  materialUserCode?: string;
  materialUserName?: string;
  /** 工单超领等场景：不展示缺料分组 */
  hideShortageSection?: boolean;
  /** 是否展示「继续超领」入口（仅工单超领页开启） */
  showContinueOverPick?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  hideShortageSection: false,
  showContinueOverPick: false
});
const emit = defineEmits(['refresh', 'go-issue', 'continue']);

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_prepare_demand_type } = toRefs<any>(proxy?.useDict(PREP_DEMAND_TYPE_DICT));
const userStore = useUserStore();
const loading = ref(false);
const movementType = ref('261');
const submittingAuto = ref(false);
const submittingLine = ref(false);
const submittingCombined = ref(false);
const resultMessage = ref('');
const resultStatus = ref(false);
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
const isOverPickDemand = computed(() => isOverPickPrepDemand(props.demand));

const buildIssueOutBatchPayload = (issueOutBoList: ReturnType<typeof buildPrepLocationRecIssueOutBoList>) => ({
  demandId: props.demand.id,
  demandNo: props.demand.demandNo,
  issueOutBoList
});

const reloadRows = () => {
  displayRows.value = flattenPrepDemandDisplayRows(props.demand, routeCtx.value, props.locationHints, props.issueLineHints);
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

watch(
  () => [props.demand, props.locationHints, props.issueLineHints] as const,
  () => reloadRows(),
  { deep: true }
);

const autoDisplayRows = computed(() => displayRows.value.filter((r) => isPrepWarehouse261DisplayRow(r, 'AUTO')));
const lineDisplayRows = computed(() => displayRows.value.filter((r) => isPrepWarehouse261DisplayRow(r, 'LINE')));
const autoIssuableRows = computed(() => autoDisplayRows.value.filter(isIssuablePrepLocationRecRow));
const lineIssuableRows = computed(() => lineDisplayRows.value.filter(isIssuablePrepLocationRecRow));
const flatRows = computed(() => displayRows.value.filter((r) => r.warehouseRoute === 'FLAT'));
const shortageRows = computed(() => displayRows.value.filter((r) => r.lineType === 'SHORTAGE' && Number(r.shortageQty ?? 0) > 0));
const flatWarehouseGroups = computed(() => groupFlatRowsByWarehouse(flatRows.value));
const hasWarehouse261Tasks = computed(() => autoIssuableRows.value.length > 0 || lineIssuableRows.value.length > 0);
const overPickTaskFinished = computed(() => isOverPickDemand.value && !loading.value && !hasWarehouse261Tasks.value);
const canSubmitCombined261 = computed(() => autoIssuableRows.value.length > 0 && lineIssuableRows.value.length > 0);
const combined261RowCount = computed(() => autoIssuableRows.value.length + lineIssuableRows.value.length);

const kitRatePercent = computed(() => {
  const rate = resolvePrepDemandKitRate(props.demand);
  return rate > 1 ? rate.toFixed(1) : (rate * 100).toFixed(1);
});

const allDetailRows = computed(() => (isOverPickDemand.value ? aggregateOverPickAllDetailRows(displayRows.value) : displayRows.value));

const allDetailTitle = computed(() => {
  if (isOverPickDemand.value) {
    return `全部明细 (${allDetailRows.value.length}条物料)`;
  }
  return `全部明细 (${displayRows.value.length}条)`;
});

const validateOverPickIssueOut = (issueOutBoList: ReturnType<typeof buildPrepLocationRecIssueOutBoList>) => {
  if (!isOverPickDemand.value) return true;
  const missing = issueOutBoList.filter((line) => !String(line.overPickCode ?? '').trim());
  if (!missing.length) return true;
  resultMessage.value = '超领出库请填写超领编码';
  resultStatus.value = false;
  return false;
};

const submitWarehouseIssue = async (routeLabel: string, routes: PrepDemand261Route[]) => {
  resultStatus.value = true;
  resultMessage.value = '';
  const issueOutBoList = buildPrepLocationRecIssueOutBoList(displayRows.value, routes);
  if (!issueOutBoList.length) {
    resultMessage.value = `没有可扣料的${routeLabel}需求`;
    resultStatus.value = false;
    return;
  }
  if (!validateOverPickIssueOut(issueOutBoList)) return;
  await ElMessageBox.confirm(`将对 ${issueOutBoList.length} 条${routeLabel}库位需求执行 ${movementType.value} 扣料，是否继续？`, `确认 ${movementType.value} 扣料`, { type: 'warning' });
  const res = await prepLocationRecIssueOut(buildIssueOutBatchPayload(issueOutBoList));
  if (res.code !== HttpStatus.SUCCESS) {
    resultMessage.value = res.msg || `${movementType.value} 扣料失败`;
    resultStatus.value = false;
    return;
  }
  resultMessage.value = res.msg || `${movementType.value} 扣料成功`;
  resultStatus.value = true;
  emit('refresh');
};

const isConfirmCancelled = (error: unknown) => error === 'cancel' || (error as Error)?.message === 'cancel';

const submitAutoIssue = async () => {
  submittingAuto.value = true;
  try {
    await submitWarehouseIssue('自动仓', ['AUTO']);
  } catch (error) {
    if (!isConfirmCancelled(error)) {
      resultMessage.value = (error as Error)?.message || `${movementType.value} 扣料失败`;
      resultStatus.value = false;
    }
  } finally {
    submittingAuto.value = false;
  }
};

const submitLineIssue = async () => {
  submittingLine.value = true;
  try {
    await submitWarehouseIssue('线边仓', ['LINE']);
  } catch (error) {
    if (!isConfirmCancelled(error)) {
      resultMessage.value = (error as Error)?.message || `${movementType.value} 扣料失败`;
      resultStatus.value = false;
    }
  } finally {
    submittingLine.value = false;
  }
};

const submitCombinedIssue = async () => {
  resultStatus.value = true;
  resultMessage.value = '';
  const issueOutBoList = buildPrepLocationRecIssueOutBoList(displayRows.value, ['AUTO', 'LINE']);
  if (!issueOutBoList.length) {
    resultMessage.value = '没有可扣料的自动仓或线边仓需求';
    resultStatus.value = false;
    return;
  }
  if (!validateOverPickIssueOut(issueOutBoList)) return;
  submittingCombined.value = true;
  try {
    await ElMessageBox.confirm(`将对 ${issueOutBoList.length} 条自动仓+线边仓需求合并执行 ${movementType.value} 扣料，是否继续？`, `确认 ${movementType.value} 扣料`, { type: 'warning' });
    const res = await prepLocationRecIssueOut(buildIssueOutBatchPayload(issueOutBoList));
    if (res.code !== HttpStatus.SUCCESS) {
      resultMessage.value = res.msg || `${movementType.value} 扣料失败`;
      resultStatus.value = false;
      return;
    }
    resultMessage.value = res.msg || `${movementType.value} 扣料成功`;
    resultStatus.value = true;
    emit('refresh');
  } catch (error) {
    if (!isConfirmCancelled(error)) {
      resultMessage.value = (error as Error)?.message || `${movementType.value} 扣料失败`;
      resultStatus.value = false;
    }
  } finally {
    submittingCombined.value = false;
  }
};
</script>

<style scoped>
.prep-demand-view {
  border: none;
}
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
.work-order-list-card {
  margin-bottom: 16px;
}
.warehouse261-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
}
.warehouse261-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  margin-right: 4px;
}
.over-pick-finish-banner {
  margin-bottom: 16px;
}
.over-pick-finish-banner :deep(.el-result) {
  padding: 12px 0;
}
.result-alert {
  margin-bottom: 16px;
}
.result-alert :deep(.el-alert) {
  padding: 6px 10px;
}
.classified-sections {
  min-height: 120px;
}
.section-card {
  margin-bottom: 0;
}
.section-col-full {
  margin-top: 16px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.section-tags {
  display: flex;
  gap: 6px;
  align-items: center;
}
.section-hint {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.warehouse-group {
  margin-bottom: 14px;
}
.warehouse-group:last-child {
  margin-bottom: 0;
}
.warehouse-group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 13px;
}
.shortage-card {
  border-color: var(--el-color-danger-light-7);
}
.all-detail-collapse {
  margin-top: 16px;
}
.material-code {
  font-weight: 600;
}
.material-name {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.unit {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-left: 4px;
}
.text-muted {
  color: var(--el-text-color-secondary);
}
.text-danger {
  color: var(--el-color-danger);
  font-weight: 600;
}
</style>
