<template>
  <div class="movement-detail-block">
    <div class="detail-row">
      <span class="detail-label">物料</span>
      <span class="detail-value">{{ movement.itemName || movement.itemCode || '' }}</span>
    </div>
    <div v-if="movement.itemCode" class="detail-sub">{{ movement.itemCode }}</div>

    <div class="detail-row">
      <span class="detail-label">仓库</span>
      <span class="detail-value">{{ movement.warehouseCode || '' }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">库位</span>
      <span class="detail-value">{{ movement.locationCode }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">批次</span>
      <span class="detail-value">{{ movement.batchCode || '' }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">数量</span>
      <span class="detail-value">{{ formatQtyWithUnit(resolveQuantity(movement), resolveUnit(movement)) }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">移动类型</span>
      <span class="detail-value">{{ movement.moveType || '' }}</span>
    </div>

    <div class="detail-row">
      <span class="detail-label">特殊库存</span>
      <span class="detail-value">
        <dict-tag :options="wms_inventory_special_flag" :value="movement.specialInventoryFlag" />
      </span>
    </div>

    <div v-if="movement.businessCode" class="detail-row">
      <span class="detail-label">业务伙伴</span>
      <span class="detail-value">{{ movement.businessCode }}</span>
    </div>
    <div v-if="movement.businessName" class="detail-sub">{{ movement.businessName }}</div>
  </div>
</template>

<script setup lang="ts">
import { InventoryMovementVO } from '@/api/wms/inventoryMovement/types';
import { formatQty } from '@/utils/ruoyi';

defineProps<{
  movement: InventoryMovementVO;
}>();

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_inventory_special_flag } = toRefs<any>(proxy?.useDict('wms_inventory_special_flag'));

const resolveQuantity = (row: InventoryMovementVO & Record<string, any>) => row.quantity ?? row.orderQuantity ?? row.poQuantity;
const resolveUnit = (row: InventoryMovementVO & Record<string, any>) => row.unit ?? row.orderUnit ?? row.poUnit;

const formatQtyWithUnit = (qty?: number | string | null, unit?: string) => {
  const text = formatQty(qty);
  if (!text) {
    return unit || '-';
  }
  return unit ? `${text} ${unit}` : text;
};

const formatLocation = (movement: InventoryMovementVO) => {
  const parts = [movement.warehouseCode, movement.areaCode, movement.locationCode].filter(Boolean);
  return parts.length > 0 ? parts.join(' / ') : '-';
};
</script>

<style scoped>
.movement-detail-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-row {
  display: flex;
  gap: 12px;
  font-size: 13px;
  line-height: 1.5;
}

.detail-label {
  flex: 0 0 72px;
  color: var(--el-text-color-secondary);
}

.detail-value {
  flex: 1;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.detail-sub {
  margin-left: 84px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
