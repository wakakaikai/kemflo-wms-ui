<!-- views/allocation/components/AllocationDetailView.vue -->
<template>
  <el-card>
    <template #header>
      <div class="detail-header">
        <span>分配明细</span>
        <div class="header-actions">
          <el-button size="small" @click="exportDetails">
            <el-icon><Download /></el-icon>导出明细
          </el-button>
          <el-button type="primary" size="small" @click="$emit('execute')" :disabled="plan.planStatus !== 'CONFIRMED'">
            <el-icon><Check /></el-icon>执行发料
          </el-button>
        </div>
      </div>
    </template>

    <el-tabs v-model="activeTab">
      <!-- 拣货路径视图 -->
      <el-tab-pane label="拣货路径" name="path">
        <picking-path-view :details="details" />
      </el-tab-pane>

      <!-- 按工单分组视图 -->
      <el-tab-pane label="按工单" name="byOrder">
        <el-collapse v-model="activeOrders">
          <el-collapse-item v-for="(group, workOrderNo) in detailsByOrder" :key="workOrderNo" :name="workOrderNo">
            <template #title>
              <div class="order-header">
                <span class="order-no">{{ workOrderNo }}</span>
                <el-tag size="small"> {{ group.length }} 项 </el-tag>
                <el-tag type="success" size="small"> 齐套率: {{ calculateKitRate(group) }}% </el-tag>
              </div>
            </template>

            <el-table :data="group" border size="small">
              <el-table-column label="物料" width="180">
                <template #default="{ row }">
                  <div class="material-info">
                    <div class="material-code">{{ row.materialCode }}</div>
                    <div class="material-name">{{ row.materialName }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="batchCode" label="批次" width="120" />
              <el-table-column prop="locationCode" label="库位" width="100" />
              <el-table-column label="数量" width="120">
                <template #default="{ row }">
                  <span class="quantity">{{ row.allocatedQuantity }} / {{ row.requiredQuantity }}</span>
                  <el-tag v-if="row.allocatedQuantity < row.requiredQuantity" type="warning" size="small"> 缺料 </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="pickSequence" label="拣货顺序" width="100" />
              <el-table-column prop="distance" label="距离(m)" width="100">
                <template #default="{ row }">
                  {{ row.distance?.toFixed(1) || '0.0' }}
                </template>
              </el-table-column>
            </el-table>
          </el-collapse-item>
        </el-collapse>
      </el-tab-pane>

      <!-- 按物料分组视图 -->
      <el-tab-pane label="按物料" name="byMaterial">
        <el-table :data="materialSummary" border>
          <el-table-column prop="materialCode" label="物料编码" />
          <el-table-column prop="materialName" label="物料名称" />
          <el-table-column prop="totalRequired" label="总需求" />
          <el-table-column prop="totalAllocated" label="总分配" />
          <el-table-column prop="shortage" label="缺料数" />
          <el-table-column prop="batchCount" label="批次数量" />
          <el-table-column prop="locationCount" label="库位数量" />
        </el-table>
      </el-tab-pane>

      <!-- 批次信息视图 -->
      <el-tab-pane label="批次信息" name="batch">
        <el-table :data="batchDetails" border>
          <el-table-column prop="materialCode" label="物料编码" />
          <el-table-column prop="batchCode" label="批次号" />
          <el-table-column prop="supplierBatchNo" label="供应商批次" />
          <el-table-column prop="productionDate" label="生产日期">
            <template #default="{ row }">
              {{ formatDate(row.productionDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="expirationDate" label="有效期">
            <template #default="{ row }">
              {{ formatDate(row.expirationDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="allocatedQuantity" label="分配数量" />
          <el-table-column prop="locationCode" label="库位" />
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Download, Check } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import type { AllocationPlanVO, AllocationDetailVO } from '@/api/wms/allocation/types';
// import PickingPathView from './PickingPathView.vue';

interface Props {
  plan: AllocationPlanVO;
  details: AllocationDetailVO[];
}

const props = defineProps<Props>();
const emit = defineEmits(['execute']);

const activeTab = ref('path');
const activeOrders = ref<string[]>([]);

// 按工单分组
const detailsByOrder = computed(() => {
  const groups: Record<string, AllocationDetailVO[]> = {};
  props.details.forEach((detail) => {
    if (!groups[detail.workOrderNo]) {
      groups[detail.workOrderNo] = [];
    }
    groups[detail.workOrderNo].push(detail);
  });
  return groups;
});

// 物料汇总
const materialSummary = computed(() => {
  const materialMap: Record<string, any> = {};

  props.details.forEach((detail) => {
    if (!materialMap[detail.materialCode]) {
      materialMap[detail.materialCode] = {
        materialCode: detail.materialCode,
        materialName: detail.materialName,
        totalRequired: 0,
        totalAllocated: 0,
        batchCount: new Set(),
        locationCount: new Set()
      };
    }

    const material = materialMap[detail.materialCode];
    material.totalRequired += detail.requiredQuantity;
    material.totalAllocated += detail.allocatedQuantity;
    material.batchCount.add(detail.batchCode);
    material.locationCount.add(detail.locationCode);
  });

  return Object.values(materialMap).map((item) => ({
    ...item,
    shortage: item.totalRequired - item.totalAllocated,
    batchCount: (item.batchCount as Set<any>).size,
    locationCount: (item.locationCount as Set<any>).size
  }));
});

// 批次详情
const batchDetails = computed(() => {
  return props.details.map((detail) => ({
    materialCode: detail.materialCode,
    batchCode: detail.batchCode,
    supplierBatchNo: detail.supplierBatchNo,
    productionDate: detail.productionDate,
    expirationDate: detail.expirationDate,
    allocatedQuantity: detail.allocatedQuantity,
    locationCode: detail.locationCode
  }));
});

// 计算齐套率
const calculateKitRate = (details: AllocationDetailVO[]) => {
  const totalRequired = details.reduce((sum, d) => sum + d.requiredQuantity, 0);
  const totalAllocated = details.reduce((sum, d) => sum + d.allocatedQuantity, 0);
  return totalRequired > 0 ? ((totalAllocated / totalRequired) * 100).toFixed(1) : '100.0';
};

// 格式化日期
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  return dayjs(dateStr).format('YYYY/MM/DD');
};

// 导出明细
const exportDetails = () => {
  ElMessage.info('导出功能开发中...');
};
</script>

<style scoped>
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.order-no {
  font-weight: bold;
}

.material-info {
  line-height: 1.4;
}

.material-code {
  font-weight: bold;
  color: #303133;
}

.material-name {
  font-size: 12px;
  color: #909399;
}

.quantity {
  margin-right: 5px;
}

:deep(.el-collapse-item__header) {
  font-weight: bold;
}
</style>
