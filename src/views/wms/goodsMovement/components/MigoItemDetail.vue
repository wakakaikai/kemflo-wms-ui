<template>
  <el-card shadow="never" class="item-detail-card">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="传输过账" name="transfer">
        <div class="transfer-columns">
          <div class="transfer-column">
            <div class="column-title">从</div>
            <el-form label-width="80px" label-position="left" class="detail-form">
              <el-form-item label="物料">
                <div class="field-desc">{{ line.itemName || '-' }}</div>
                <el-input v-if="editable" v-model="line.itemCode" placeholder="物料编码" readonly>
                  <template #append>
                    <el-button icon="Search" @click="emit('search-inventory')" />
                  </template>
                </el-input>
                <div v-else class="field-code">{{ line.itemCode || '-' }}</div>
              </el-form-item>
              <el-form-item label="工厂">
                <div class="field-desc">{{ line.plantName || '-' }}</div>
                <div class="field-code">{{ line.plantCode || 'CN00' }}</div>
              </el-form-item>
              <el-form-item label="地点">
                <div class="field-desc">{{ line.sourceLocationName || '-' }}</div>
                <el-input
                  v-if="editable"
                  v-model="line.sourceLocationCode"
                  placeholder="源库位编码"
                  @keydown.tab.prevent="emit('location-tab', 'source')"
                  @keydown.enter.prevent="emit('location-tab', 'source')"
                >
                  <template #append>
                    <el-button icon="Search" @click="emit('pick-location', 'source')" />
                  </template>
                </el-input>
                <div v-else class="field-code">{{ line.sourceLocationCode || '-' }}</div>
              </el-form-item>
              <el-form-item label="特殊库存">
                <dict-tag v-if="line.specialInventoryFlag" :options="specialFlagOptions" :value="line.specialInventoryFlag" />
                <span v-else>-</span>
                <div v-if="line.businessCode" class="field-code">{{ line.businessCode }}</div>
              </el-form-item>
              <el-form-item v-if="editable && showSourceInventoryType" label="库存类型">
                <el-select v-model="line.sourceInventoryType" placeholder="源库存类型" style="width: 100%">
                  <el-option v-for="opt in inventoryTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
            </el-form>
          </div>

          <div class="transfer-column">
            <div class="column-title">目的地</div>
            <el-form label-width="80px" label-position="left" class="detail-form">
              <el-form-item label="物料">
                <div class="field-desc">{{ line.itemName || '-' }}</div>
                <div class="field-code">{{ line.itemCode || '-' }}</div>
              </el-form-item>
              <el-form-item label="工厂">
                <div class="field-desc">{{ line.plantName || '-' }}</div>
                <div class="field-code">{{ line.plantCode || 'CN00' }}</div>
              </el-form-item>
              <el-form-item label="地点">
                <div class="field-desc">{{ line.targetLocationName || '-' }}</div>
                <el-input
                  v-if="editable && showTargetLocation"
                  v-model="line.targetLocationCode"
                  placeholder="目标库位编码"
                  @keydown.tab.prevent="emit('location-tab', 'target')"
                  @keydown.enter.prevent="emit('location-tab', 'target')"
                >
                  <template #append>
                    <el-button icon="Search" @click="emit('pick-location', 'target')" />
                  </template>
                </el-input>
                <div v-else class="field-code">{{ line.targetLocationCode || line.sourceLocationCode || '-' }}</div>
              </el-form-item>
              <el-form-item label="特殊库存">
                <dict-tag v-if="line.specialInventoryFlag" :options="specialFlagOptions" :value="line.specialInventoryFlag" />
                <span v-else>-</span>
              </el-form-item>
              <el-form-item v-if="editable && showTargetInventoryType" label="库存类型">
                <el-select v-model="line.targetInventoryType" placeholder="目标库存类型" style="width: 100%">
                  <el-option v-for="opt in inventoryTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="物料" name="material">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="物料编码">{{ line.itemCode || '-' }}</el-descriptions-item>
          <el-descriptions-item label="物料名称">{{ line.itemName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="批次号">{{ line.batchCode || '-' }}</el-descriptions-item>
          <el-descriptions-item label="单位">{{ line.unit || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <el-tab-pane label="数量" name="quantity">
        <el-form label-width="100px" class="quantity-form">
          <el-form-item label="数量 (UnE)">
            <el-input-number v-if="editable" v-model="line.qty" :min="0" :precision="3" controls-position="right" style="width: 200px" />
            <span v-else>{{ line.qty ?? '-' }}</span>
            <span class="unit-text">{{ line.unit }}</span>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="何处" name="where">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="源仓库">{{ line.sourceWarehouseCode || '-' }}</el-descriptions-item>
          <el-descriptions-item label="源库区">{{ line.sourceAreaCode || '-' }}</el-descriptions-item>
          <el-descriptions-item label="源库位">{{ line.sourceLocationCode || '-' }}</el-descriptions-item>
          <el-descriptions-item label="目标库位">{{ line.targetLocationCode || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { GoodsMovementLineVO } from '@/api/wms/goodsMovement/types';
import { INVENTORY_TYPE_OPTIONS } from '../utils/movementConfig';

defineProps<{
  line: GoodsMovementLineVO;
  editable?: boolean;
  showTargetLocation?: boolean;
  showSourceInventoryType?: boolean;
  showTargetInventoryType?: boolean;
  specialFlagOptions?: DictDataOption[];
}>();

const emit = defineEmits<{
  'pick-location': [side: 'source' | 'target'];
  'location-tab': [side: 'source' | 'target'];
  'search-inventory': [];
}>();

const activeTab = ref('transfer');
const inventoryTypeOptions = INVENTORY_TYPE_OPTIONS;
</script>

<style scoped lang="scss">
.item-detail-card {
  margin-top: 12px;
}

.transfer-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.column-title {
  font-weight: 600;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.field-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
  margin-bottom: 4px;
}

.field-code {
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.detail-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.quantity-form .unit-text {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 992px) {
  .transfer-columns {
    grid-template-columns: 1fr;
  }
}
</style>
