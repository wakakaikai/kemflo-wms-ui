<template>
  <div class="cost-center-detail">
    <el-tabs v-model="activeTab" class="cost-center-tabs">
      <el-tab-pane label="移动类型管理" name="moveType">
        <div v-loading="loading">
          <cost-center-move-type v-if="!loading" :cost-center="costCenter" :cost-center-name="costCenterName" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { listCostCenter } from '@/api/wms/costCenter';
import CostCenterMoveType from '@/views/wms/costCenterMoveType/index.vue';

const route = useRoute();
const activeTab = ref('moveType');
const costCenterName = ref('');
const loading = ref(false);

const costCenter = computed(() => String(route.params.costCenter || route.query.costCenter || ''));

const loadCostCenter = async () => {
  costCenterName.value = '';
  if (!costCenter.value) return;

  loading.value = true;
  try {
    const res = await listCostCenter({
      pageNum: 1,
      pageSize: 1,
      costCenter: costCenter.value
    });
    costCenterName.value = res.rows?.[0]?.costCenterName || '';
  } finally {
    loading.value = false;
  }
};

watch(costCenter, loadCostCenter, { immediate: true });
</script>

<style scoped>
.cost-center-tabs {
  margin: 15px;
}

.cost-center-tabs :deep(.el-loading-parent--relative) {
  min-height: 160px;
}
</style>
