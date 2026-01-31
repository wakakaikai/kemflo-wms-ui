<!-- views/allocation/components/BatchDetailDialog.vue -->
<template>
  <el-dialog v-model="visible" :title="`批次详情 - ${material?.componentMaterial}`" width="800px">
    <div class="batch-detail-dialog">
      <!-- 物料信息 -->
      <div class="material-info">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="物料编码">
            {{ material?.componentMaterial }}
          </el-descriptions-item>
          <el-descriptions-item label="物料描述">
            {{ material?.componentDesc }}
          </el-descriptions-item>
          <el-descriptions-item label="需求数量"> {{ material?.componentQty }} {{ material?.unit }} </el-descriptions-item>
          <el-descriptions-item label="工单号">
            {{ workOrderNo }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 批次列表 -->
      <div class="batch-list">
        <div class="list-header">
          <span class="header-title">可用批次</span>
        </div>

        <el-table :data="batchList" border stripe :max-height="300" size="small">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="batchCode" label="批次号" width="120" />
          <el-table-column prop="supplierBatchNo" label="供应商批次" width="120" />
          <el-table-column prop="locationCode" label="库位" width="100" />
          <el-table-column prop="availableQty" label="可用数量" width="100">
            <template #default="{ row }"> {{ row.availableQty }} {{ material?.unit }} </template>
          </el-table-column>
          <el-table-column label="生产日期" width="120">
            <template #default="{ row }">
              {{ formatDate(row.productionDate) }}
            </template>
          </el-table-column>
          <el-table-column label="有效期" width="120">
            <template #default="{ row }">
              {{ formatDate(row.expirationDate) }}
              <el-tag v-if="isExpiring(row.expirationDate)" type="warning" size="small"> 即将过期 </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="FIFO顺序" width="100">
            <template #default="{ row }">
              {{ row.fifoSequence || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="距离" width="80">
            <template #default="{ row }"> {{ row.distance?.toFixed(1) || '0.0' }}m </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="allocateBatch(row)"> 分配 </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 批次分配模拟 -->
      <div v-if="allocationSimulation" class="allocation-simulation">
        <div class="simulation-header">
          <span class="header-title">分配模拟</span>
          <el-tag type="success" size="small"> 可满足需求 </el-tag>
        </div>

        <el-table :data="allocationDetails" border size="small">
          <el-table-column prop="batchCode" label="批次号" />
          <el-table-column prop="allocatedQty" label="分配数量">
            <template #default="{ row }"> {{ row.allocatedQty }} {{ material?.unit }} </template>
          </el-table-column>
          <el-table-column prop="remainingQty" label="批次剩余">
            <template #default="{ row }"> {{ row.remainingQty }} {{ material?.unit }} </template>
          </el-table-column>
          <el-table-column prop="fifoOrder" label="FIFO顺序" />
        </el-table>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="confirmAllocation"> 确认分配 </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import type { WorkOrderBomVO } from '@/api/wms/allocation/types';
import InventoryApi from '@/api/wms/allocation/index';

interface Props {
  modelValue: boolean;
  material: WorkOrderBomVO | null;
  workOrderNo?: string;
}

const props = defineProps<Props>();

const emit = defineEmits(['update:modelValue', 'confirm']);

const visible = ref(false);
const batchList = ref<any[]>([]);
const allocationDetails = ref<any[]>([]);
const allocationSimulation = ref(false);

// 监听props变化
watch(
  () => props.modelValue,
  async (val) => {
    visible.value = val;
    if (val && props.material) {
      await loadBatchData();
      simulateAllocation();
    }
  }
);

// 监听visible变化
watch(visible, (val) => {
  emit('update:modelValue', val);
});

// 格式化日期
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  return dayjs(dateStr).format('YYYY/MM/DD');
};

// 检查是否即将过期（30天内）
const isExpiring = (expirationDate?: string) => {
  if (!expirationDate) return false;
  const days = dayjs(expirationDate).diff(dayjs(), 'day');
  return days >= 0 && days <= 30;
};

// 加载批次数据
const loadBatchData = async () => {
  if (!props.material) return;

  try {
    const response = await InventoryApi.getMaterialBatches(props.material.componentMaterial);

    if (response.code === 200) {
      batchList.value = response.data.map((batch: any, index: number) => ({
        ...batch,
        fifoSequence: index + 1
      }));
    }
  } catch (error) {
    ElMessage.error('加载批次数据失败');
    console.error(error);
  }
};

// 模拟分配
const simulateAllocation = () => {
  if (!props.material || batchList.value.length === 0) return;

  const requiredQty = props.material.componentQty;
  let remainingQty = requiredQty;
  const details: any[] = [];

  // 按FIFO顺序分配
  const sortedBatches = [...batchList.value].sort((a, b) => {
    const dateA = new Date(a.productionDate || 0);
    const dateB = new Date(b.productionDate || 0);
    return dateA.getTime() - dateB.getTime();
  });

  for (let i = 0; i < sortedBatches.length; i++) {
    const batch = sortedBatches[i];
    if (remainingQty <= 0) break;

    const allocateQty = Math.min(batch.availableQty, remainingQty);
    if (allocateQty > 0) {
      details.push({
        batchCode: batch.batchCode,
        allocatedQty: allocateQty,
        remainingQty: batch.availableQty - allocateQty,
        fifoOrder: i + 1
      });
      remainingQty -= allocateQty;
    }
  }

  allocationDetails.value = details;
  allocationSimulation.value = remainingQty === 0;
};

// 分配批次
const allocateBatch = (batch: any) => {
  ElMessage.info(`分配批次 ${batch.batchCode}`);
  // 这里可以实现批次分配逻辑
};

// 确认分配
const confirmAllocation = () => {
  ElMessage.success('批次分配确认');
  emit('confirm', {
    material: props.material,
    batches: allocationDetails.value
  });
  handleClose();
};

// 关闭对话框
const handleClose = () => {
  visible.value = false;
};
</script>

<style scoped>
.batch-detail-dialog {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.material-info {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
}

.batch-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 16px;
  font-weight: bold;
}

.allocation-simulation {
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #f9f9f9;
}

.simulation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
