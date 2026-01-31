<!-- views/allocation/components/WorkOrderBomDialog.vue -->
<template>
  <el-dialog v-model="visible" :title="`工单BOM详情 - ${workOrder?.workOrderNo}`" width="1000px" destroy-on-close>
    <div class="order-bom-dialog">
      <!-- 工单基本信息 -->
      <div class="order-summary">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="产品料号">
            {{ workOrder?.item }}
          </el-descriptions-item>
          <el-descriptions-item label="产品描述">
            {{ workOrder?.itemDesc }}
          </el-descriptions-item>
          <el-descriptions-item label="计划数量"> {{ workOrder?.plannedQty }} {{ workOrder?.unit }} </el-descriptions-item>
          <el-descriptions-item label="已发料"> {{ workOrder?.issuedQty || 0 }} {{ workOrder?.unit }} </el-descriptions-item>
          <el-descriptions-item label="待发料">
            <span
              :class="{
                'text-warning': remainingQty > 0,
                'text-success': remainingQty === 0
              }"
            >
              {{ remainingQty }} {{ workOrder?.unit }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="计划开工">
            {{ formatDate(workOrder?.plannedStartDate) }}
          </el-descriptions-item>
          <el-descriptions-item label="计划完工">
            {{ formatDate(workOrder?.plannedEndDate) }}
          </el-descriptions-item>
          <el-descriptions-item label="交货日期">
            {{ formatDate(workOrder?.soDeliveryDate) }}
          </el-descriptions-item>
          <el-descriptions-item label="优先级">
            <priority-badge :priority="workOrder?.priority || 5" />
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- BOM物料列表 -->
      <div class="bom-list">
        <div class="bom-header">
          <span class="header-title">BOM物料清单</span>
          <div class="header-actions">
            <el-button size="small" @click="checkInventory">
              <el-icon><Search /></el-icon>库存检查
            </el-button>
            <el-button size="small" @click="exportBom">
              <el-icon><Download /></el-icon>导出BOM
            </el-button>
          </div>
        </div>

        <el-table :data="bomList" border stripe :max-height="400" size="small">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="componentMaterial" label="物料编码" width="120" />
          <el-table-column prop="componentDesc" label="物料描述" min-width="150" />
          <el-table-column prop="unit" label="单位" width="60" />
          <el-table-column label="需求数量" width="120">
            <template #default="{ row }">
              {{ row.componentQty }}
            </template>
          </el-table-column>
          <el-table-column label="已发数量" width="120">
            <template #default="{ row }">
              {{ row.issuedQty || 0 }}
            </template>
          </el-table-column>
          <el-table-column label="待发数量" width="120">
            <template #default="{ row }">
              <span
                :class="{
                  'text-warning': row.pendingQty > 0,
                  'text-success': row.pendingQty === 0
                }"
              >
                {{ row.pendingQty }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="库存状态" width="120">
            <template #default="{ row }">
              <inventory-status :material="row" />
            </template>
          </el-table-column>
          <el-table-column label="齐套率" width="100">
            <template #default="{ row }">
              <kit-rate-indicator :material="row" />
            </template>
          </el-table-column>
          <el-table-column label="批次信息" width="120">
            <template #default="{ row }">
              <el-button v-if="row.batchCount > 0" type="primary" link size="small" @click="showBatchDetail(row)"> {{ row.batchCount }}个批次 </el-button>
              <span v-else class="text-muted">无批次</span>
            </template>
          </el-table-column>
          <el-table-column label="库位信息" width="120">
            <template #default="{ row }">
              <el-button v-if="row.locationCount > 0" type="primary" link size="small" @click="showLocationDetail(row)"> {{ row.locationCount }}个库位 </el-button>
              <span v-else class="text-muted">无库存</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="showMaterialDetail(row)"> 详情 </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 库存分析 -->
      <div v-if="inventoryAnalysis" class="inventory-analysis">
        <div class="analysis-header">
          <span class="header-title">库存分析</span>
          <el-tag :type="getAnalysisTagType(inventoryAnalysis.kitRate)"> 齐套率: {{ (inventoryAnalysis.kitRate * 100).toFixed(1) }}% </el-tag>
        </div>

        <el-row :gutter="20" class="analysis-stats">
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-label">物料总数</div>
              <div class="stat-value">{{ inventoryAnalysis.totalMaterials }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-label">齐套物料</div>
              <div class="stat-value text-success">
                {{ inventoryAnalysis.kittedMaterials }}
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-label">部分缺料</div>
              <div class="stat-value text-warning">
                {{ inventoryAnalysis.partialMaterials }}
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-label">完全缺料</div>
              <div class="stat-value text-danger">
                {{ inventoryAnalysis.shortageMaterials }}
              </div>
            </div>
          </el-col>
        </el-row>

        <!-- 缺料明细 -->
        <div v-if="shortageMaterials.length > 0" class="shortage-detail">
          <div class="detail-title">缺料明细</div>
          <el-table :data="shortageMaterials" border size="small">
            <el-table-column prop="componentMaterial" label="物料编码" />
            <el-table-column prop="componentDesc" label="物料描述" />
            <el-table-column prop="requiredQty" label="需求数量" />
            <el-table-column prop="availableQty" label="可用库存" />
            <el-table-column prop="shortageQty" label="缺料数量">
              <template #default="{ row }">
                <span class="text-danger">{{ row.shortageQty }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="showAllocationPreview"> 分配预览 </el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 批次详情对话框 -->
  <batch-detail-dialog v-model="showBatchDialog" :material="selectedMaterial" :work-order-no="workOrder?.workOrderNo" />

  <!-- 库位详情对话框 -->
  <location-detail-dialog v-model="showLocationDialog" :material="selectedMaterial" :work-order-no="workOrder?.workOrderNo" />

  <!-- 物料详情对话框 -->
  <material-detail-dialog v-model="showMaterialDialog" :material="selectedMaterial" :work-order="workOrder" />
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, Download } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import type { WorkOrderVO, WorkOrderBomVO } from '@/api/wms/allocation/types';
import WorkOrderApi from '@/api/wms/allocation/index';
import InventoryApi from '@/api/wms/allocation/index';
import PriorityBadge from './PriorityBadge.vue';
import InventoryStatus from './InventoryStatus.vue';
import KitRateIndicator from './KitRateIndicator.vue';
import BatchDetailDialog from './BatchDetailDialog.vue';
import LocationDetailDialog from './LocationDetailDialog.vue';
// import MaterialDetailDialog from './MaterialDetailDialog.vue';

interface Props {
  modelValue: boolean;
  workOrder: WorkOrderVO | null;
}

const props = defineProps<Props>();

const emit = defineEmits(['update:modelValue']);

const visible = ref(false);
const showBatchDialog = ref(false);
const showLocationDialog = ref(false);
const showMaterialDialog = ref(false);

// BOM列表
const bomList = ref<WorkOrderBomVO[]>([]);
// 库存分析
const inventoryAnalysis = ref<any>(null);
// 选中的物料
const selectedMaterial = ref<WorkOrderBomVO | null>(null);

// 计算待发料数量
const remainingQty = computed(() => {
  if (!props.workOrder) return 0;
  return props.workOrder.plannedQty - (props.workOrder.issuedQty || 0);
});

// 计算缺料物料
const shortageMaterials = computed(() => {
  return bomList.value
    .filter((material) => {
      return material.pendingQty > 0 && material.availableQty !== undefined;
    })
    .map((material) => ({
      componentMaterial: material.componentMaterial,
      componentDesc: material.componentDesc,
      requiredQty: material.componentQty,
      availableQty: material.availableQty || 0,
      shortageQty: material.componentQty - (material.availableQty || 0)
    }));
});

// 监听props变化
watch(
  () => props.modelValue,
  async (val) => {
    visible.value = val;
    if (val && props.workOrder) {
      await loadBomData();
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

// 加载BOM数据
const loadBomData = async () => {
  if (!props.workOrder) return;

  try {
    // 加载BOM清单
    const bomResponse = await WorkOrderApi.getWorkOrderBom(props.workOrder.workOrderNo);
    if (bomResponse.code === 200) {
      bomList.value = bomResponse.data.map((bom: any) => ({
        ...bom,
        pendingQty: bom.componentQty - (bom.issuedQty || 0)
      }));
    }

    // 检查库存
    await checkInventory();
  } catch (error) {
    ElMessage.error('加载BOM数据失败');
    console.error(error);
  }
};

// 库存检查
const checkInventory = async () => {
  if (!props.workOrder || bomList.value.length === 0) return;

  try {
    const materialCodes = bomList.value.map((bom) => bom.componentMaterial);
    const response = await InventoryApi.checkMaterialInventory(props.workOrder.workOrderNo, materialCodes);

    if (response.code === 200) {
      inventoryAnalysis.value = response.data.analysis;

      // 更新物料库存信息
      const inventoryMap = new Map();
      response.data.materials?.forEach((mat: any) => {
        inventoryMap.set(mat.materialCode, mat);
      });

      bomList.value = bomList.value.map((bom) => {
        const inventory = inventoryMap.get(bom.componentMaterial);
        return {
          ...bom,
          availableQty: inventory?.availableQty || 0,
          batchCount: inventory?.batchCount || 0,
          locationCount: inventory?.locationCount || 0,
          inventoryStatus: inventory?.status || 'UNKNOWN'
        };
      });
    }
  } catch (error) {
    ElMessage.error('库存检查失败');
    console.error(error);
  }
};

// 获取分析标签类型
const getAnalysisTagType = (kitRate: number) => {
  if (kitRate >= 0.9) return 'success';
  if (kitRate >= 0.7) return 'warning';
  return 'danger';
};

// 显示批次详情
const showBatchDetail = (material: WorkOrderBomVO) => {
  selectedMaterial.value = material;
  showBatchDialog.value = true;
};

// 显示库位详情
const showLocationDetail = (material: WorkOrderBomVO) => {
  selectedMaterial.value = material;
  showLocationDialog.value = true;
};

// 显示物料详情
const showMaterialDetail = (material: WorkOrderBomVO) => {
  selectedMaterial.value = material;
  showMaterialDialog.value = true;
};

// 导出BOM
const exportBom = () => {
  ElMessage.success('BOM导出功能开发中...');
};

// 显示分配预览
const showAllocationPreview = () => {
  ElMessage.info('分配预览功能开发中...');
};

// 关闭对话框
const handleClose = () => {
  visible.value = false;
};
</script>

<style scoped>
.order-bom-dialog {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-summary {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
}

.bom-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bom-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 16px;
  font-weight: bold;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.inventory-analysis {
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #f9f9f9;
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.analysis-stats {
  margin-bottom: 16px;
}

.stat-card {
  padding: 16px;
  background: white;
  border-radius: 4px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.text-success {
  color: #67c23a;
}

.text-warning {
  color: #e6a23c;
}

.text-danger {
  color: #f56c6c;
}

.text-muted {
  color: #c0c4cc;
  font-style: italic;
}

.shortage-detail {
  margin-top: 16px;
  border-top: 1px solid #ebeef5;
  padding-top: 16px;
}

.detail-title {
  font-weight: bold;
  margin-bottom: 12px;
  color: #f56c6c;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-descriptions__label) {
  font-weight: bold;
  background: #fafafa;
}

:deep(.el-descriptions__content) {
  background: white;
}
</style>
