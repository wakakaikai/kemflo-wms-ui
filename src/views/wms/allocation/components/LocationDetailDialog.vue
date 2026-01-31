<!-- views/allocation/components/LocationDetailDialog.vue -->
<template>
  <el-dialog v-model="visible" :title="`库位详情 - ${material?.componentMaterial}`" width="900px">
    <div class="location-detail-dialog">
      <!-- 物料信息 -->
      <div class="material-info">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="物料编码">
            {{ material?.componentMaterial }}
          </el-descriptions-item>
          <el-descriptions-item label="物料描述">
            {{ material?.componentDesc }}
          </el-descriptions-item>
          <el-descriptions-item label="需求数量"> {{ material?.componentQty }} {{ material?.unit }} </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 库位分布 -->
      <div class="location-distribution">
        <div class="distribution-header">
          <span class="header-title">库位分布</span>
          <div class="header-stats">
            <el-tag type="info" size="small"> 总库存: {{ totalInventory }} {{ material?.unit }} </el-tag>
            <el-tag type="success" size="small"> 总库位: {{ locationList.length }}个 </el-tag>
          </div>
        </div>

        <el-table :data="locationList" border stripe :max-height="400" size="small">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="locationCode" label="库位编码" width="120" />
          <el-table-column prop="areaCode" label="库区" width="100" />
          <el-table-column prop="warehouseCode" label="仓库" width="100" />
          <el-table-column label="坐标" width="120">
            <template #default="{ row }"> X{{ row.positionX }}-Y{{ row.positionY }}-Z{{ row.positionZ }} </template>
          </el-table-column>
          <el-table-column prop="batchCode" label="批次号" width="120" />
          <el-table-column prop="availableQty" label="可用数量" width="100">
            <template #default="{ row }"> {{ row.availableQty }} {{ material?.unit }} </template>
          </el-table-column>
          <el-table-column label="到集料区距离" width="120">
            <template #default="{ row }"> {{ row.distance?.toFixed(1) || '0.0' }}m </template>
          </el-table-column>
          <el-table-column label="拣货效率" width="100">
            <template #default="{ row }">
              <efficiency-indicator :location="row" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="selectLocation(row)"> 选择 </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 库位地图预览 -->
      <div class="location-map">
        <div class="map-header">
          <span class="header-title">库位地图预览</span>
          <el-button size="small" @click="refreshMap">
            <el-icon><Refresh /></el-icon>刷新
          </el-button>
        </div>
        <div class="map-container">
          <!-- 这里可以集成地图组件 -->
          <div class="map-placeholder">
            <el-empty description="地图组件开发中" />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="confirmSelection"> 确认选择 </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import type { WorkOrderBomVO } from '@/api/wms/allocation/types';
import InventoryApi from '@/api/wms/allocation/index';
// import EfficiencyIndicator from './EfficiencyIndicator.vue';

interface Props {
  modelValue: boolean;
  material: WorkOrderBomVO | null;
  workOrderNo?: string;
}

const props = defineProps<Props>();

const emit = defineEmits(['update:modelValue', 'confirm']);

const visible = ref(false);
const locationList = ref<any[]>([]);
const selectedLocations = ref<any[]>([]);

// 计算总库存
const totalInventory = computed(() => {
  return locationList.value.reduce((sum, loc) => sum + (loc.availableQty || 0), 0);
});

// 监听props变化
watch(
  () => props.modelValue,
  async (val) => {
    visible.value = val;
    if (val && props.material) {
      await loadLocationData();
    }
  }
);

// 监听visible变化
watch(visible, (val) => {
  emit('update:modelValue', val);
});

// 加载库位数据
const loadLocationData = async () => {
  if (!props.material) return;

  try {
    const response = await InventoryApi.getMaterialLocations(props.material.componentMaterial);

    if (response.code === 200) {
      locationList.value = response.data;
    }
  } catch (error) {
    ElMessage.error('加载库位数据失败');
    console.error(error);
  }
};

// 选择库位
const selectLocation = (location: any) => {
  const index = selectedLocations.value.findIndex((loc) => loc.locationCode === location.locationCode);
  if (index >= 0) {
    selectedLocations.value.splice(index, 1);
    ElMessage.info(`取消选择库位 ${location.locationCode}`);
  } else {
    selectedLocations.value.push(location);
    ElMessage.success(`选择库位 ${location.locationCode}`);
  }
};

// 刷新地图
const refreshMap = () => {
  ElMessage.info('刷新地图数据');
};

// 确认选择
const confirmSelection = () => {
  if (selectedLocations.value.length === 0) {
    ElMessage.warning('请至少选择一个库位');
    return;
  }

  emit('confirm', {
    material: props.material,
    locations: selectedLocations.value
  });
  handleClose();
};

// 关闭对话框
const handleClose = () => {
  visible.value = false;
};
</script>

<style scoped>
.location-detail-dialog {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.material-info {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
}

.location-distribution {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.distribution-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 16px;
  font-weight: bold;
}

.header-stats {
  display: flex;
  gap: 10px;
}

.location-map {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 16px;
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.map-container {
  height: 200px;
  background: #f9f9f9;
  border-radius: 4px;
  overflow: hidden;
}

.map-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
