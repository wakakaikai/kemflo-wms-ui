<template>
  <el-dialog
    v-model="visible"
    :title="`分配预览 - ${workOrderNo || ''}`"
    width="78%"
    destroy-on-close
    append-to-body
    @closed="resetState"
  >
    <el-alert type="info" :closable="false" show-icon class="preview-tip">
      试算本工单备料结果，不确认备料、不锁定库存。正式发料请在发料工作台选择工单后「生成备料」。
    </el-alert>

    <div v-loading="loading" class="preview-body">
      <template v-if="!loading && loaded">
        <el-descriptions v-if="planSummary" :column="4" border size="small" class="preview-summary">
          <el-descriptions-item label="备料单号">{{ planSummary.planNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="齐套率">{{ kitRatePercent }}%</el-descriptions-item>
          <el-descriptions-item label="拣货点">{{ planSummary.pickLocationCount ?? '-' }} 个</el-descriptions-item>
          <el-descriptions-item label="拣货行">{{ details.length }} 行</el-descriptions-item>
        </el-descriptions>

        <el-empty v-if="details.length === 0" description="暂无分配明细" />

        <el-table v-else :data="sortedDetails" border stripe size="small" max-height="420">
          <el-table-column type="index" label="序号" width="56" />
          <el-table-column label="物料" min-width="150">
            <template #default="{ row }">
              <div class="material-code">{{ row.materialCode }}</div>
              <div class="material-name">{{ row.materialName }}</div>
            </template>
          </el-table-column>
          <el-table-column label="分配 / 需求" width="120" align="right">
            <template #default="{ row }">
              <span :class="{ 'text-danger': row.allocatedQuantity < row.requiredQuantity }">
                {{ row.allocatedQuantity }} / {{ row.requiredQuantity }}
              </span>
              <span v-if="row.unit" class="unit">{{ row.unit }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="batchCode" label="批次" width="120" show-overflow-tooltip />
          <el-table-column prop="locationCode" label="库位" width="100" />
          <el-table-column label="仓别" width="100">
            <template #default="{ row }">{{ row.warehouseCode || row.areaCode || '-' }}</template>
          </el-table-column>
          <el-table-column prop="pickSequence" label="拣货序" width="72" align="center" />
          <el-table-column label="生产日期" width="108">
            <template #default="{ row }">{{ formatDate(row.productionDate) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.allocatedQuantity < row.requiredQuantity" type="warning" size="small">缺料</el-tag>
              <el-tag v-else type="success" size="small">充足</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button type="primary" :loading="loading" @click="loadPreview">刷新预览</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import AllocationApi, { getPlanDetail } from '@/api/wms/allocation/index';
import type { AllocationDetailVO, AllocationMaterialIssueItem, AllocationPlanVO } from '@/api/wms/allocation/types';

interface Props {
  modelValue: boolean;
  workOrderNo?: string;
  /** 部分发料明细（不传则按 BOM 待发满额） */
  materialIssueItems?: AllocationMaterialIssueItem[];
}

const props = defineProps<Props>();
const emit = defineEmits<{ 'update:modelValue': [boolean] }>();

const visible = ref(false);
const loading = ref(false);
const loaded = ref(false);
const details = ref<AllocationDetailVO[]>([]);
const planSummary = ref<AllocationPlanVO | null>(null);

/** 将接口返回数据规范为分配计划对象 */
function normalizePlan(data: unknown): AllocationPlanVO | null {
  if (!data) return null;
  if (Array.isArray(data)) return (data[0] as AllocationPlanVO) || null;
  return data as AllocationPlanVO;
}

/** 按拣货顺序排序的分配明细 */
const sortedDetails = computed(() =>
  [...details.value].sort((a, b) => (a.pickSequence ?? 0) - (b.pickSequence ?? 0))
);

/** 齐套率百分比（已分配/需求） */
const kitRatePercent = computed(() => {
  const req = details.value.reduce((s, d) => s + d.requiredQuantity, 0);
  const alloc = details.value.reduce((s, d) => s + d.allocatedQuantity, 0);
  return req > 0 ? ((alloc / req) * 100).toFixed(1) : '100.0';
});

/** 格式化日期为 YYYY/MM/DD */
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  return dayjs(dateStr).format('YYYY/MM/DD');
};

/** 重置预览加载状态与数据 */
const resetState = () => {
  loaded.value = false;
  details.value = [];
  planSummary.value = null;
};

/** 生成分配计划并加载预览明细 */
const loadPreview = async () => {
  if (!props.workOrderNo) {
    ElMessage.warning('缺少工单号');
    return;
  }
  loading.value = true;
  try {
    const genRes = await AllocationApi.generateAllocation({
      workOrderNos: [props.workOrderNo],
      generateMultiple: false,
      materialIssueItems: props.materialIssueItems
    });
    if (genRes.code !== 200) return;

    const plan = normalizePlan(genRes.data);
    if (!plan?.id) {
      ElMessage.warning('未获取到预览数据');
      loaded.value = true;
      return;
    }

    planSummary.value = plan;

    const detailRes = await getPlanDetail(plan.id);
    if (detailRes.code === 200) {
      const data = detailRes.data;
      details.value = data?.allocationDetails || (Array.isArray(data) ? data : []) || [];
      if (data?.planInfo) planSummary.value = data.planInfo;
    }
    loaded.value = true;
  } catch {
    ElMessage.error('分配预览失败');
    loaded.value = true;
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val && props.workOrderNo) {
      resetState();
      loadPreview();
    }
  }
);

watch(visible, (val) => emit('update:modelValue', val));
</script>

<style scoped>
.preview-tip {
  margin-bottom: 16px;
}
.preview-body {
  min-height: 120px;
}
.preview-summary {
  margin-bottom: 16px;
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
.text-danger {
  color: var(--el-color-danger);
}
</style>
