<template>
  <el-drawer v-model="visible" :title="drawerTitle" size="82%" destroy-on-close @close="handleClose">
    <div v-loading="loading" class="prep-demand-drawer">
      <template v-if="demand">
        <div class="drawer-hero" :class="{ 'has-shortage': hasShortage }">
          <div class="hero-main">
            <div class="hero-title">
              <h3>{{ demand.demandNo }}</h3>
              <el-tag :type="demandStatusTag(demand.demandStatus)" size="small">{{ demandStatusLabel(demand.demandStatus) }}</el-tag>
              <el-tag v-if="demand.isEmergency" type="danger" size="small" effect="dark">紧急</el-tag>
            </div>
            <p class="hero-meta">
              创建于 {{ demand.createTime || '-' }}
              <span v-if="demand.remark"> · {{ demand.remark }}</span>
            </p>
          </div>
          <div class="hero-kit">
            <el-progress type="circle" :percentage="kitRatePercent" :color="kitRateColor(demand.kitRate)" :width="88" />
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
              <div class="kpi-value">{{ demand.totalRequired ?? '-' }}</div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="kpi-card">
              <div class="kpi-label">可用库存</div>
              <div class="kpi-value">{{ demand.totalAvailable ?? '-' }}</div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="kpi-card" :class="{ danger: hasShortage }">
              <div class="kpi-label">缺料量</div>
              <div class="kpi-value">{{ demand.totalShortage ?? 0 }}</div>
            </div>
          </el-col>
        </el-row>

        <div class="line-stats">
          <el-tag :type="demand.checkPassed ? 'success' : 'warning'" effect="plain">
            库存检查 {{ demand.checkPassed ? '通过' : '未通过' }}
          </el-tag>
          <span>共 {{ demand.totalLines ?? 0 }} 行</span>
          <span>齐套 {{ demand.kittedLines ?? 0 }}</span>
          <span>部分 {{ demand.partialLines ?? 0 }}</span>
          <span class="danger-text">缺料 {{ demand.shortageLines ?? 0 }}</span>
        </div>

        <div class="drawer-toolbar">
          <el-button size="small" @click="loadDetail"><el-icon><Refresh /></el-icon>刷新</el-button>
          <el-button v-if="demand.issueId" type="success" size="small" @click="$emit('go-issue', demand.issueId!)">去领料</el-button>
          <el-button type="primary" size="small" @click="$emit('edit', demand)" v-hasPermi="['wms:workOrderPrepDemand:edit']">修改头信息</el-button>
        </div>

        <prep-demand-plan-view
          :demand="demand"
          @refresh="loadDetail"
          @go-issue="$emit('go-issue', demand.issueId!)"
        />
      </template>
      <el-empty v-else-if="!loading" description="未找到备料需求" />
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Refresh } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { getPrepDemand } from '@/api/wms/workOrderPrepDemand';
import type { WorkOrderPrepDemandVO } from '@/api/wms/workOrderPrepDemand/types';
import PrepDemandPlanView from '@/views/wms/allocation/components/PrepDemandPlanView.vue';
import { demandStatusLabel, demandStatusTag, kitRateColor, kitRatePercentValue } from '../utils/prepDemandStatus';

const props = defineProps<{ modelValue: boolean; demandId?: number | string | null }>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  edit: [demand: WorkOrderPrepDemandVO];
  'go-issue': [issueId: number | string];
}>();

const visible = computed({ get: () => props.modelValue, set: (val) => emit('update:modelValue', val) });
const loading = ref(false);
const demand = ref<WorkOrderPrepDemandVO | null>(null);
const drawerTitle = computed(() => (demand.value ? `备料需求 · ${demand.value.demandNo}` : '备料需求详情'));
const hasShortage = computed(() => Number(demand.value?.totalShortage ?? 0) > 0 || Number(demand.value?.shortageLines ?? 0) > 0);
const kitRatePercent = computed(() => kitRatePercentValue(demand.value?.kitRate));

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

watch(() => [props.modelValue, props.demandId] as const, ([open, id]) => { if (open && id) loadDetail(); }, { immediate: true });
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
  padding: 18px 20px;
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
