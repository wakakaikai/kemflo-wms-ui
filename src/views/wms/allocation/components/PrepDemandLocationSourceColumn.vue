<template>
  <el-table-column v-if="showLocationSourceColumn" label="库位来源" width="96" align="center">
    <template #default="{ row }">
      <el-popover v-if="isPrepLocationUserSelected(resolvePrepLocationRecommendationSource(row))" placement="top" :width="280" trigger="hover" :show-after="80" :show-arrow="true">
        <template #reference>
          <el-tag type="warning" size="small" class="tag-popover-trigger">用户选择</el-tag>
        </template>
        <div class="recommendation-reason-popover">
          <div class="recommendation-reason-title">选择原因</div>
          <div class="recommendation-reason-value">{{ resolvePrepRowLocationAdjustRemark(row) || '-' }}</div>
        </div>
      </el-popover>
      <el-tag v-else-if="isPrepLocationSystemRecommended(resolvePrepLocationRecommendationSource(row))" type="info" size="small">系统推荐</el-tag>
      <span v-else class="text-muted">-</span>
    </template>
  </el-table-column>
  <el-table-column v-if="showAdjustReasonColumn" label="库位调整原因" min-width="120" show-overflow-tooltip>
    <template #default="{ row }">
      <span>{{ resolvePrepRowLocationAdjustRemark(row) || '-' }}</span>
    </template>
  </el-table-column>
  <el-table-column label="备注" min-width="120" show-overflow-tooltip>
    <template #default="{ row }">
      <span>{{ resolvePrepRowRemark(row) || '-' }}</span>
    </template>
  </el-table-column>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { hasPrepRowUserSelectedLocation, isPrepLocationSystemRecommended, isPrepLocationUserSelected, resolvePrepLocationRecommendationSource, type PrepLocationSourceRow } from '@/api/wms/workOrderPrepDemand/locationSource';
import { hasPrepRowAdjustRemark, hasPrepRowRemark, resolvePrepRowLocationAdjustRemark, resolvePrepRowRemark } from '@/api/wms/workOrderPrepDemand/index';

const props = withDefaults(
  defineProps<{
    showRemark?: boolean;
    rows?: PrepLocationSourceRow[];
  }>(),
  {
    showRemark: false,
    rows: undefined
  }
);

const showLocationSourceColumn = computed(() => {
  if (!props.rows?.length) return false;
  return hasPrepRowUserSelectedLocation(props.rows);
});

const showAdjustReasonColumn = computed(() => {
  if (!props.showRemark) return false;
  if (!props.rows?.length) return true;
  return hasPrepRowAdjustRemark(props.rows);
});

const showRemarkColumn = computed(() => {
  if (!props.showRemark) return false;
  if (!props.rows?.length) return true;
  return hasPrepRowRemark(props.rows);
});
</script>

<style scoped>
.text-muted {
  color: var(--el-text-color-secondary);
}

.tag-popover-trigger {
  cursor: pointer;
}

.recommendation-reason-popover {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.recommendation-reason-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.recommendation-reason-value {
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
  word-break: break-all;
  white-space: pre-wrap;
}
</style>
