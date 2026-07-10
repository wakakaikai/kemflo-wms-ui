<template>
  <el-drawer v-model="visible" :title="drawerTitle" size="82%" destroy-on-close @close="handleClose">
    <div v-loading="loading" class="prep-demand-drawer">
      <template v-if="demand">
        <div class="drawer-hero" :class="{ 'has-shortage': hasShortage }">
          <div class="hero-main">
            <div class="hero-title">
              <h3>{{ demand.demandNo }}</h3>
              <dict-tag :options="wms_prepare_demand_type" :value="demand.demandType" />
              <dict-tag :options="wms_prepare_demand_status" :value="demand.demandStatus" />
              <el-tag v-if="demand.isEmergency" type="danger" size="small" effect="dark">紧急</el-tag>
            </div>
            <p class="hero-meta">
              创建于 {{ demand.createTime || '-' }}
              <span v-if="demand.remark"> · {{ demand.remark }}</span>
            </p>
          </div>

          <div class="hero-kit">
            <el-progress type="circle" :percentage="kitRatePercent" :color="kitRateColor(displayKitRate)" :width="70" />
            <span class="kit-caption">齐套率</span>
          </div>
        </div>

        <el-row :gutter="12" class="kpi-row">
          <el-col :xs="12" :sm="6">
            <div class="kpi-card">
              <div class="kpi-label">工单数</div>
              <div class="kpi-value">{{ demand.workOrderCount ?? 0 }}</div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="kpi-card">
              <div class="kpi-label">总待发</div>
              <div class="kpi-value">{{ formatQty(demand.totalRequired) ?? '-' }}</div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="kpi-card">
              <div class="kpi-label">已发货</div>
              <div class="kpi-value">{{ formatQty(demand.totalIssuedQty) ?? '-' }}</div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="kpi-card" :class="{ danger: hasShortage }">
              <div class="kpi-label">缺料量</div>
              <div class="kpi-value">{{ formatQty(demand.totalShortage ?? 0) }}</div>
            </div>
          </el-col>
        </el-row>

        <prep-demand-plan-view :demand="demand" @refresh="loadDetail" @go-issue="$emit('go-issue', demand.issueId!)" />
      </template>
      <el-empty v-else-if="!loading" description="未找到备料需求" />
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { formatQty, formatQtyWithUnit } from '@/utils/ruoyi';
import { computed, getCurrentInstance, ref, watch } from 'vue';
import type { ComponentInternalInstance } from 'vue';
import { ElMessage } from 'element-plus';
import { getPrepDemand } from '@/api/wms/workOrderPrepDemand';
import { PREP_DEMAND_STATUS_DICT, PREP_DEMAND_TYPE_DICT } from '@/api/wms/workOrderPrepDemand/index';
import type { WorkOrderPrepDemandVO } from '@/api/wms/workOrderPrepDemand/types';
import PrepDemandPlanView from '@/views/wms/allocation/components/PrepDemandPlanView.vue';
import { demandTypeLabel, kitRateColor, kitRatePercentValue, resolvePrepDemandKitRate, resolvePrepDemandWorkOrders } from '@/api/wms/workOrderPrepDemand/index';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_prepare_demand_type, wms_prepare_demand_status } = toRefs<any>(proxy?.useDict(PREP_DEMAND_TYPE_DICT, PREP_DEMAND_STATUS_DICT));

const props = defineProps<{ modelValue: boolean; demandId?: number | string | null }>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  edit: [demand: WorkOrderPrepDemandVO];
  'go-issue': [issueId: number | string];
}>();

const visible = computed({ get: () => props.modelValue, set: (val) => emit('update:modelValue', val) });
const loading = ref(false);
const demand = ref<WorkOrderPrepDemandVO | null>(null);
const drawerTitle = computed(() => {
  if (!demand.value) return '备料需求详情';
  return `备料需求 · ${demandTypeLabel(demand.value.demandType, wms_prepare_demand_type.value)} · ${demand.value.demandNo}`;
});
const prepDemandLines = computed(() => resolvePrepDemandWorkOrders(demand.value).flatMap((wo) => wo.lines ?? []));
const lineStats = computed(() => {
  const lines = prepDemandLines.value;
  if (!lines.length) {
    return {
      totalLines: Number(demand.value?.totalLines ?? 0),
      kittedLines: Number(demand.value?.kittedLines ?? 0),
      partialLines: Number(demand.value?.partialLines ?? 0),
      shortageLines: Number(demand.value?.shortageLines ?? 0)
    };
  }

  let kittedLines = 0;
  let partialLines = 0;
  let shortageLines = 0;

  lines.forEach((line) => {
    const requiredQty = Math.max(0, Number(line.issueQty ?? line.pendingQty ?? 0));
    const dedicatedShortage = line.lineType === 'SHORTAGE' || line.warehouseRoute === 'SHORTAGE';
    const explicitShortage = Math.max(0, Number(line.shortageQty ?? 0));
    const shortageQty = explicitShortage > 0 ? explicitShortage : dedicatedShortage ? requiredQty : 0;

    if (shortageQty > 0) {
      if (requiredQty > 0 && shortageQty < requiredQty) {
        partialLines += 1;
      } else {
        shortageLines += 1;
      }
      return;
    }

    const recs = line.locationRecs ?? [];
    const coveredQty = recs.reduce((sum, rec) => sum + Math.max(0, Number(rec.issueQty ?? 0)), 0);
    if (requiredQty > 0) {
      if (coveredQty >= requiredQty) {
        kittedLines += 1;
      } else if (coveredQty > 0) {
        partialLines += 1;
      } else {
        const availableQty = Math.max(0, Number(line.availableQty ?? 0));
        if (availableQty >= requiredQty) {
          kittedLines += 1;
        } else if (availableQty > 0) {
          partialLines += 1;
        } else {
          shortageLines += 1;
        }
      }
      return;
    }

    kittedLines += 1;
  });

  return {
    totalLines: lines.length,
    kittedLines,
    partialLines,
    shortageLines
  };
});
const hasShortage = computed(() => Number(demand.value?.totalShortage ?? 0) > 0 || lineStats.value.shortageLines > 0);
const displayKitRate = computed(() => resolvePrepDemandKitRate(demand.value));
const kitRatePercent = computed(() => kitRatePercentValue(displayKitRate.value));

const loadDetail = async () => {
  if (!props.demandId) {
    demand.value = null;
    return;
  }
  loading.value = true;
  try {
    const res = await getPrepDemand(props.demandId);
    demand.value = res.data ?? null;
  } catch {
    ElMessage.error('获取备料需求详情失败');
    demand.value = null;
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  demand.value = null;
};

watch(
  () => [props.modelValue, props.demandId] as const,
  ([open, id]) => {
    if (open && id) loadDetail();
  },
  { immediate: true }
);
defineExpose({ reload: loadDetail });
</script>

<style scoped lang="scss">
.prep-demand-drawer {
  min-height: 200px;
}

.drawer-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 10px 12px;
  margin-bottom: 14px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-bg-color) 55%);

  &.has-shortage {
    border-color: var(--el-color-warning-light-5);
    background: linear-gradient(180deg, var(--el-color-warning-light-9) 0%, var(--el-bg-color) 88px);
  }
}

.hero-main {
  min-width: 0;
  flex: 1;
}

.hero-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;

  h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
  }
}

.hero-meta {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.hero-kit {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.kit-caption {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.kpi-row {
  margin-bottom: 12px;
}

.kpi-card {
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--el-fill-color-light);
  text-align: center;

  &.danger .kpi-value {
    color: var(--el-color-danger);
  }
}

.kpi-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.kpi-value {
  margin-top: 4px;
  font-size: 22px;
  font-weight: 700;
}

.line-stats {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.danger-text {
  color: var(--el-color-danger);
  font-weight: 600;
}

.drawer-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
</style>
